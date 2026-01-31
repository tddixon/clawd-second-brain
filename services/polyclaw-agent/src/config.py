"""Configuration loaded from environment variables."""

import os
from dataclasses import dataclass, field


@dataclass
class Config:
    # Trading mode
    trading_mode: str = "paper"

    # Database
    db_host: str = "127.0.0.1"
    db_port: int = 5432
    db_user: str = "trader"
    db_password: str = ""
    db_name: str = "trading_db"

    # Redis
    redis_host: str = "127.0.0.1"
    redis_port: int = 6379

    # Risk limits
    max_daily_loss: float = 20.0
    max_weekly_loss: float = 100.0
    max_position_size: float = 100.0
    max_total_exposure: float = 500.0
    max_trades_per_day: int = 10
    max_concurrent_positions: int = 3

    # Profit taking
    take_profit_pct: float = 5.0
    stop_loss_pct: float = 3.0
    max_hold_days: int = 7

    # Strategy
    min_profit_pct: float = 3.0
    min_coverage_tier: int = 2
    auto_execute_max: float = 50.0
    scan_interval_minutes: int = 60
    hedge_scan_limit: int = 20

    # PolyClaw
    polyclaw_path: str = ""

    # Telegram
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    # Prometheus
    metrics_port: int = 8000

    @classmethod
    def from_env(cls) -> "Config":
        return cls(
            trading_mode=os.getenv("TRADING_MODE", "paper"),
            db_host=os.getenv("DB_HOST", "127.0.0.1"),
            db_port=int(os.getenv("DB_PORT", "5432")),
            db_user=os.getenv("DB_USER", "trader"),
            db_password=os.getenv("DB_PASSWORD", ""),
            db_name=os.getenv("DB_NAME", "trading_db"),
            redis_host=os.getenv("REDIS_HOST", "127.0.0.1"),
            redis_port=int(os.getenv("REDIS_PORT", "6379")),
            max_daily_loss=float(os.getenv("MAX_DAILY_LOSS", "20")),
            max_weekly_loss=float(os.getenv("MAX_WEEKLY_LOSS", "100")),
            max_position_size=float(os.getenv("MAX_POSITION_SIZE", "100")),
            max_total_exposure=float(os.getenv("MAX_TOTAL_EXPOSURE", "500")),
            max_trades_per_day=int(os.getenv("MAX_TRADES_PER_DAY", "10")),
            max_concurrent_positions=int(os.getenv("MAX_CONCURRENT_POSITIONS", "3")),
            take_profit_pct=float(os.getenv("TAKE_PROFIT_PCT", "5")),
            stop_loss_pct=float(os.getenv("STOP_LOSS_PCT", "3")),
            max_hold_days=int(os.getenv("MAX_HOLD_DAYS", "7")),
            min_profit_pct=float(os.getenv("MIN_PROFIT_PCT", "3")),
            min_coverage_tier=int(os.getenv("MIN_COVERAGE_TIER", "2")),
            auto_execute_max=float(os.getenv("AUTO_EXECUTE_MAX", "50")),
            scan_interval_minutes=int(os.getenv("SCAN_INTERVAL_MINUTES", "60")),
            hedge_scan_limit=int(os.getenv("HEDGE_SCAN_LIMIT", "20")),
            polyclaw_path=os.getenv("POLYCLAW_PATH", os.path.expanduser("~/.openclaw/skills/polyclaw")),
            telegram_bot_token=os.getenv("TELEGRAM_BOT_TOKEN", ""),
            telegram_chat_id=os.getenv("TELEGRAM_CHAT_ID", ""),
            metrics_port=int(os.getenv("METRICS_PORT", "8000")),
        )
