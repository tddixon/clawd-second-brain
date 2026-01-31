"""Autonomous PolyClaw trading agent main loop."""

import asyncio
import signal
import sys
from datetime import datetime, date, timedelta

import structlog
from prometheus_client import start_http_server, Counter, Gauge, Histogram

from .config import Config
from .db import Database
from .risk import RiskManager
from .scanner import run_hedge_scan, HedgeOpportunity
from .alerts import AlertManager

log = structlog.get_logger()

# Prometheus metrics
SCANS_TOTAL = Counter("polyclaw_scans_total", "Total hedge scans run")
OPPORTUNITIES_FOUND = Counter("polyclaw_opportunities_found", "Opportunities found", ["tier"])
TRADES_EXECUTED = Counter("polyclaw_trades_executed", "Trades executed", ["mode"])
TRADES_REJECTED = Counter("polyclaw_trades_rejected", "Trades rejected", ["reason"])
DAILY_PNL = Gauge("polyclaw_daily_pnl_usd", "Daily P&L in USD")
WEEKLY_PNL = Gauge("polyclaw_weekly_pnl_usd", "Weekly P&L in USD")
OPEN_POSITIONS = Gauge("polyclaw_open_positions", "Number of open positions")
TOTAL_EXPOSURE = Gauge("polyclaw_total_exposure_usd", "Total exposure in USD")
SCAN_DURATION = Histogram("polyclaw_scan_duration_seconds", "Hedge scan duration")


class PolyClawAgent:
    def __init__(self, config: Config):
        self.config = config
        self.db = Database(config)
        self.risk = RiskManager(config, self.db)
        self.alerts = AlertManager(config)
        self._running = False
        self._last_report_date: date | None = None

    async def start(self):
        """Initialize connections and start the agent."""
        await self.db.connect()
        await self.alerts.start()

        # Start Prometheus metrics server
        start_http_server(self.config.metrics_port)
        log.info("metrics_server_started", port=self.config.metrics_port)

        self._running = True
        log.info("agent_started",
                 mode=self.config.trading_mode,
                 max_daily_loss=self.config.max_daily_loss,
                 max_weekly_loss=self.config.max_weekly_loss,
                 scan_interval=self.config.scan_interval_minutes)

        await self.alerts.send(
            f"*PolyClaw Agent Started*\n"
            f"Mode: `{self.config.trading_mode}`\n"
            f"Risk: ${self.config.max_daily_loss}/day, ${self.config.max_weekly_loss}/week"
        )

    async def stop(self):
        """Graceful shutdown."""
        self._running = False
        await self.alerts.send("*PolyClaw Agent Stopped*")
        await self.alerts.stop()
        await self.db.close()
        log.info("agent_stopped")

    async def run(self):
        """Main loop."""
        await self.start()

        # Handle SIGINT/SIGTERM
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, lambda: asyncio.create_task(self._shutdown()))

        try:
            while self._running:
                await self._tick()
                await asyncio.sleep(self.config.scan_interval_minutes * 60)
        finally:
            await self.stop()

    async def _shutdown(self):
        log.info("shutdown_signal_received")
        self._running = False

    async def _tick(self):
        """Single iteration of the main loop."""
        try:
            # Update metrics
            await self._update_metrics()

            # Check if we can trade
            can_trade, reason = await self.risk.check_can_trade()
            if not can_trade:
                log.warning("trading_blocked", reason=reason)
                return

            # Run hedge scan
            with SCAN_DURATION.time():
                opportunities = await run_hedge_scan(self.config)
            SCANS_TOTAL.inc()

            log.info("scan_complete", opportunities=len(opportunities))

            # Evaluate and execute
            for opp in opportunities:
                OPPORTUNITIES_FOUND.labels(tier=f"T{opp.coverage_tier}").inc()
                await self._process_opportunity(opp)

            # Daily report at 21:00
            await self._maybe_send_report()

        except Exception as e:
            log.error("tick_error", error=str(e), exc_info=True)
            await self.alerts.send(f"*Agent Error*: {str(e)[:200]}", level="warning")

    async def _process_opportunity(self, opp: HedgeOpportunity):
        """Evaluate and potentially execute a single opportunity."""
        valid, reason = await self.risk.validate_opportunity(opp)
        if not valid:
            TRADES_REJECTED.labels(reason=reason.split(":")[0].strip()).inc()
            log.debug("opportunity_rejected", market=opp.market_name[:50], reason=reason)
            return

        size = self.risk.calculate_position_size(opp)

        # Record the opportunity
        await self.db.record_opportunity(
            opp.market_id, opp.market_name,
            opp.expected_profit_pct, size * opp.price,
            executed=False,
        )

        # Check if needs approval
        if self.risk.needs_approval(size):
            log.info("trade_needs_approval", market=opp.market_name[:50], size=size)
            await self.alerts.send(
                f"*Trade Approval Needed*\n"
                f"Market: {opp.market_name[:80]}\n"
                f"Side: {opp.side} @ {opp.price:.4f}\n"
                f"Size: ${size:.2f}\n"
                f"Expected: {opp.expected_profit_pct:.1f}% (T{opp.coverage_tier})"
            )
            TRADES_REJECTED.labels(reason="needs_approval").inc()
            return

        # Execute
        if self.config.trading_mode == "paper":
            await self._paper_trade(opp, size)
        else:
            await self._live_trade(opp, size)

    async def _paper_trade(self, opp: HedgeOpportunity, size: float):
        """Simulate trade execution in paper mode."""
        # Record trade
        trade_id = await self.db.record_trade(
            strategy="polyclaw_hedge",
            symbol=opp.market_name[:50],
            side="buy",
            quantity=size,
            price=opp.price,
            market_id=opp.market_id,
            status="filled",
            metadata={
                "mode": "paper",
                "coverage_tier": opp.coverage_tier,
                "expected_profit_pct": opp.expected_profit_pct,
            },
        )

        # Open position
        await self.db.open_position(
            strategy="polyclaw_hedge",
            symbol=opp.market_name[:50],
            side="long" if opp.side == "yes" else "short",
            size=size,
            entry_price=opp.price,
            market_id=opp.market_id,
            metadata={"mode": "paper", "trade_id": trade_id},
        )

        TRADES_EXECUTED.labels(mode="paper").inc()
        log.info("paper_trade_executed",
                 market=opp.market_name[:50],
                 side=opp.side,
                 size=size,
                 price=opp.price,
                 expected_profit=opp.expected_profit_pct)

        await self.alerts.send(
            f"*Paper Trade Executed*\n"
            f"Market: {opp.market_name[:80]}\n"
            f"Side: {opp.side} @ {opp.price:.4f}\n"
            f"Size: ${size:.2f}\n"
            f"Expected: {opp.expected_profit_pct:.1f}%"
        )

    async def _live_trade(self, opp: HedgeOpportunity, size: float):
        """Execute live trade via PolyClaw CLI."""
        # TODO: Implement actual PolyClaw trade execution
        # This will call: polyclaw buy <market_id> <side> <size>
        log.warning("live_trading_not_implemented", market=opp.market_id)
        TRADES_REJECTED.labels(reason="not_implemented").inc()

    async def _update_metrics(self):
        """Update Prometheus gauge metrics."""
        try:
            daily = await self.db.get_daily_pnl()
            weekly = await self.db.get_weekly_pnl()
            positions = await self.db.get_open_positions()
            exposure = await self.db.get_total_exposure()

            DAILY_PNL.set(daily)
            WEEKLY_PNL.set(weekly)
            OPEN_POSITIONS.set(len(positions))
            TOTAL_EXPOSURE.set(exposure)
        except Exception as e:
            log.warning("metrics_update_error", error=str(e))

    async def _maybe_send_report(self):
        """Send daily report at 21:00 UTC."""
        now = datetime.utcnow()
        if now.hour != 21 or self._last_report_date == now.date():
            return

        self._last_report_date = now.date()

        daily_pnl = await self.db.get_daily_pnl()
        weekly_pnl = await self.db.get_weekly_pnl()
        trades_count = await self.db.get_trades_today_count()
        positions = await self.db.get_open_positions()
        exposure = await self.db.get_total_exposure()

        report = (
            f"*Daily Report - {now.strftime('%Y-%m-%d')}*\n"
            f"Mode: `{self.config.trading_mode}`\n\n"
            f"P&L Today: ${daily_pnl:.2f}\n"
            f"P&L This Week: ${weekly_pnl:.2f}\n"
            f"Trades Today: {trades_count}\n"
            f"Open Positions: {len(positions)}\n"
            f"Total Exposure: ${exposure:.2f}\n\n"
            f"Risk Status: {'ACTIVE' if not self.risk.is_paused else 'PAUSED - ' + self.risk.pause_reason}"
        )

        await self.alerts.send(report)
        log.info("daily_report_sent", daily_pnl=daily_pnl, weekly_pnl=weekly_pnl)

        # Persist summary
        await self.db.upsert_daily_pnl_summary(
            "polyclaw_hedge", daily_pnl, trades_count, 0, 0
        )
