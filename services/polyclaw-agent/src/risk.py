"""Risk management - circuit breakers, position limits, exposure checks."""

import structlog
from .config import Config
from .db import Database
from .scanner import HedgeOpportunity

log = structlog.get_logger()


class RiskManager:
    def __init__(self, config: Config, db: Database):
        self.config = config
        self.db = db
        self._paused = False
        self._pause_reason = ""

    @property
    def is_paused(self) -> bool:
        return self._paused

    @property
    def pause_reason(self) -> str:
        return self._pause_reason

    def manual_pause(self, reason: str = "manual"):
        self._paused = True
        self._pause_reason = reason
        log.warning("trading_paused", reason=reason)

    def manual_resume(self):
        self._paused = False
        self._pause_reason = ""
        log.info("trading_resumed")

    async def check_can_trade(self) -> tuple[bool, str]:
        """Run all pre-trade risk checks. Returns (can_trade, reason)."""
        if self._paused:
            return False, f"paused: {self._pause_reason}"

        # Daily loss limit
        daily_pnl = await self.db.get_daily_pnl()
        if daily_pnl <= -self.config.max_daily_loss:
            self._paused = True
            self._pause_reason = f"daily loss limit: ${daily_pnl:.2f}"
            await self.db.record_alert("critical", "risk",
                                        f"Daily loss circuit breaker: ${daily_pnl:.2f}")
            return False, self._pause_reason

        # Weekly loss limit
        weekly_pnl = await self.db.get_weekly_pnl()
        if weekly_pnl <= -self.config.max_weekly_loss:
            self._paused = True
            self._pause_reason = f"weekly loss limit: ${weekly_pnl:.2f}"
            await self.db.record_alert("critical", "risk",
                                        f"Weekly loss circuit breaker: ${weekly_pnl:.2f}")
            return False, self._pause_reason

        # Max trades per day
        trades_today = await self.db.get_trades_today_count()
        if trades_today >= self.config.max_trades_per_day:
            return False, f"max trades/day reached: {trades_today}"

        # Total exposure
        exposure = await self.db.get_total_exposure()
        if exposure >= self.config.max_total_exposure:
            return False, f"max exposure reached: ${exposure:.2f}"

        return True, "ok"

    async def validate_opportunity(self, opp: HedgeOpportunity) -> tuple[bool, str]:
        """Validate a specific opportunity against risk rules."""
        # Coverage tier
        if opp.coverage_tier > self.config.min_coverage_tier:
            return False, f"coverage T{opp.coverage_tier} < min T{self.config.min_coverage_tier}"

        # Minimum profit
        if opp.expected_profit_pct < self.config.min_profit_pct:
            return False, f"profit {opp.expected_profit_pct:.1f}% < min {self.config.min_profit_pct}%"

        # Position size check
        size = min(opp.recommended_size, self.config.max_position_size)
        exposure = await self.db.get_total_exposure()
        if exposure + size * opp.price > self.config.max_total_exposure:
            return False, f"would exceed max exposure"

        return True, "ok"

    def calculate_position_size(self, opp: HedgeOpportunity) -> float:
        """Calculate appropriate position size."""
        return min(opp.recommended_size, self.config.max_position_size)

    def needs_approval(self, size: float) -> bool:
        """Check if trade size requires manual approval."""
        return size > self.config.auto_execute_max
