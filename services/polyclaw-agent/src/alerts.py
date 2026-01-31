"""Telegram and logging alerts."""

import aiohttp
import structlog
from .config import Config

log = structlog.get_logger()


class AlertManager:
    def __init__(self, config: Config):
        self.config = config
        self._session: aiohttp.ClientSession | None = None

    async def start(self):
        self._session = aiohttp.ClientSession()

    async def stop(self):
        if self._session:
            await self._session.close()

    async def send(self, message: str, level: str = "info"):
        """Send alert via Telegram (if configured) and log."""
        log.info("alert", level=level, message=message[:200])

        if self.config.telegram_bot_token and self.config.telegram_chat_id:
            await self._send_telegram(message)

    async def _send_telegram(self, message: str):
        if not self._session:
            return
        url = f"https://api.telegram.org/bot{self.config.telegram_bot_token}/sendMessage"
        try:
            async with self._session.post(url, json={
                "chat_id": self.config.telegram_chat_id,
                "text": message,
                "parse_mode": "Markdown",
            }, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    log.warning("telegram_send_failed", status=resp.status)
        except Exception as e:
            log.warning("telegram_error", error=str(e))
