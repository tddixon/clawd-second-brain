"""Entry point for the PolyClaw trading agent."""

import asyncio
import sys

import structlog
from dotenv import load_dotenv

# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if sys.stderr.isatty() else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(0),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

from .config import Config
from .agent import PolyClawAgent


def main():
    load_dotenv()

    try:
        import uvloop
        asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    except ImportError:
        pass

    config = Config.from_env()
    agent = PolyClawAgent(config)
    asyncio.run(agent.run())


if __name__ == "__main__":
    main()
