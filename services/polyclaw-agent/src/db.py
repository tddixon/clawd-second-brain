"""Database access layer using asyncpg."""

import asyncpg
import structlog
from datetime import datetime, date
from typing import Optional
from .config import Config

log = structlog.get_logger()


class Database:
    def __init__(self, config: Config):
        self.config = config
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(
            host=self.config.db_host,
            port=self.config.db_port,
            user=self.config.db_user,
            password=self.config.db_password,
            database=self.config.db_name,
            min_size=2,
            max_size=10,
        )
        log.info("database_connected", host=self.config.db_host)

    async def close(self):
        if self.pool:
            await self.pool.close()

    async def record_trade(self, strategy: str, symbol: str, side: str,
                           quantity: float, price: float, market_id: str,
                           status: str = "filled", metadata: dict = None) -> str:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO trades (strategy, symbol, side, quantity, price, market_id, status, metadata)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
                   RETURNING id""",
                strategy, symbol, side, quantity, price, market_id, status,
                __import__("json").dumps(metadata or {}),
            )
            return str(row["id"])

    async def open_position(self, strategy: str, symbol: str, side: str,
                            size: float, entry_price: float, market_id: str,
                            metadata: dict = None) -> str:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO positions (strategy, symbol, side, size, entry_price, current_price, market_id, status, metadata)
                   VALUES ($1, $2, $3, $4, $5, $5, $6, 'open', $7::jsonb)
                   ON CONFLICT (strategy, symbol, exchange, status) DO UPDATE
                   SET size = positions.size + EXCLUDED.size,
                       entry_price = (positions.entry_price * positions.size + EXCLUDED.entry_price * EXCLUDED.size)
                                     / (positions.size + EXCLUDED.size)
                   RETURNING id""",
                strategy, symbol, side, size, entry_price, market_id,
                __import__("json").dumps(metadata or {}),
            )
            return str(row["id"])

    async def get_open_positions(self, strategy: str = None) -> list:
        async with self.pool.acquire() as conn:
            if strategy:
                rows = await conn.fetch(
                    "SELECT * FROM positions WHERE status='open' AND strategy=$1", strategy
                )
            else:
                rows = await conn.fetch("SELECT * FROM positions WHERE status='open'")
            return [dict(r) for r in rows]

    async def close_position(self, position_id: str, realized_pnl: float):
        async with self.pool.acquire() as conn:
            await conn.execute(
                """UPDATE positions SET status='closed', closed_at=NOW(), realized_pnl=$2
                   WHERE id=$1""",
                position_id, realized_pnl,
            )

    async def get_daily_pnl(self, d: date = None) -> float:
        d = d or date.today()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """SELECT COALESCE(SUM(pnl), 0) as total
                   FROM trades WHERE timestamp::date = $1 AND pnl IS NOT NULL""",
                d,
            )
            return float(row["total"])

    async def get_weekly_pnl(self) -> float:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """SELECT COALESCE(SUM(pnl), 0) as total
                   FROM trades
                   WHERE timestamp >= date_trunc('week', CURRENT_DATE)
                   AND pnl IS NOT NULL"""
            )
            return float(row["total"])

    async def get_trades_today_count(self) -> int:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT COUNT(*) as cnt FROM trades WHERE timestamp::date = CURRENT_DATE"
            )
            return row["cnt"]

    async def get_total_exposure(self) -> float:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """SELECT COALESCE(SUM(size * entry_price), 0) as total
                   FROM positions WHERE status='open'"""
            )
            return float(row["total"])

    async def record_opportunity(self, market_id: str, market_name: str,
                                  profit_pct: float, max_size: float,
                                  executed: bool = False) -> str:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO arbitrage_opportunities
                   (market_id, market_name, buy_price, sell_price, profit_percent, max_size_usd, executed)
                   VALUES ($1, $2, 0, 0, $3, $4, $5)
                   RETURNING id""",
                market_id, market_name, profit_pct, max_size, executed,
            )
            return str(row["id"])

    async def upsert_daily_pnl_summary(self, strategy: str, realized: float,
                                        trade_count: int, wins: int, losses: int):
        async with self.pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO daily_pnl (date, strategy, realized_pnl, trade_count, win_count, loss_count)
                   VALUES (CURRENT_DATE, $1, $2, $3, $4, $5)
                   ON CONFLICT (date) DO UPDATE
                   SET realized_pnl = EXCLUDED.realized_pnl,
                       trade_count = EXCLUDED.trade_count,
                       win_count = EXCLUDED.win_count,
                       loss_count = EXCLUDED.loss_count,
                       updated_at = NOW()""",
                strategy, realized, trade_count, wins, losses,
            )

    async def record_alert(self, level: str, category: str, message: str, metadata: dict = None):
        async with self.pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO alerts (level, category, message, metadata)
                   VALUES ($1, $2, $3, $4::jsonb)""",
                level, category, message,
                __import__("json").dumps(metadata or {}),
            )
