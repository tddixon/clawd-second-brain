"""PolyClaw hedge scanner - runs hedge scan and parses results."""

import asyncio
import json
import re
import structlog
from dataclasses import dataclass
from typing import Optional
from .config import Config

log = structlog.get_logger()


@dataclass
class HedgeOpportunity:
    market_id: str
    market_name: str
    side: str  # "yes" or "no"
    price: float
    coverage_tier: int  # 1, 2, or 3
    expected_profit_pct: float
    recommended_size: float
    raw_data: dict


async def run_hedge_scan(config: Config) -> list[HedgeOpportunity]:
    """Execute PolyClaw hedge scan as a subprocess and parse output."""
    cmd = (
        f"unset VIRTUAL_ENV && export PATH=\"$HOME/.local/bin:$PATH\" && "
        f"cd {config.polyclaw_path} && "
        f"uv run python scripts/polyclaw.py hedge --json scan "
        f"--limit {config.hedge_scan_limit}"
    )

    log.info("hedge_scan_start", limit=config.hedge_scan_limit)

    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=180)

        if proc.returncode != 0:
            # Try without --json flag, parse text output
            log.warning("hedge_scan_json_failed", rc=proc.returncode,
                        stderr=stderr.decode()[:200])
            return await _run_text_scan(config)

        output = stdout.decode().strip()
        if not output:
            log.info("hedge_scan_empty")
            return []

        return _parse_json_output(output)

    except asyncio.TimeoutError:
        log.error("hedge_scan_timeout")
        return []
    except Exception as e:
        log.error("hedge_scan_error", error=str(e))
        return []


async def _run_text_scan(config: Config) -> list[HedgeOpportunity]:
    """Fallback: run scan without --json and parse text output."""
    cmd = (
        f"unset VIRTUAL_ENV && export PATH=\"$HOME/.local/bin:$PATH\" && "
        f"cd {config.polyclaw_path} && "
        f"uv run python scripts/polyclaw.py hedge scan "
        f"--limit {config.hedge_scan_limit}"
    )

    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=180)
        output = stdout.decode().strip()

        if not output:
            return []

        return _parse_text_output(output)

    except Exception as e:
        log.error("text_scan_error", error=str(e))
        return []


def _parse_json_output(output: str) -> list[HedgeOpportunity]:
    """Parse JSON output from PolyClaw hedge scan.

    PolyClaw outputs a list of portfolio dicts with fields:
    tier, coverage, total_cost, target_question, target_position, target_price,
    target_market_id, cover_question, cover_position, cover_price, cover_market_id,
    expected_profit, relationship
    """
    opportunities = []
    try:
        data = json.loads(output)
        items = data if isinstance(data, list) else data.get("opportunities", [])

        for item in items:
            # Calculate expected profit as percentage of cost
            total_cost = float(item.get("total_cost", 1))
            expected_profit = float(item.get("expected_profit", 0))
            profit_pct = (expected_profit / total_cost * 100) if total_cost > 0 else 0

            opp = HedgeOpportunity(
                market_id=item.get("target_market_id", item.get("market_id", "")),
                market_name=item.get("target_question", item.get("question", "Unknown")),
                side=item.get("target_position", "YES").lower(),
                price=float(item.get("target_price", 0)),
                coverage_tier=int(item.get("tier", 3)),
                expected_profit_pct=profit_pct,
                recommended_size=min(50, 1.0 / total_cost * 50) if total_cost > 0 else 50,
                raw_data=item,
            )
            opportunities.append(opp)

    except json.JSONDecodeError:
        log.warning("json_parse_failed", output=output[:200])

    return opportunities


def _parse_text_output(output: str) -> list[HedgeOpportunity]:
    """Parse text output from PolyClaw hedge scan.

    PolyClaw text output typically shows market info with coverage tiers
    and profit percentages. This parser handles common formats.
    """
    opportunities = []
    current_market = {}

    for line in output.split("\n"):
        line = line.strip()
        if not line:
            if current_market.get("market_id"):
                opportunities.append(HedgeOpportunity(
                    market_id=current_market.get("market_id", ""),
                    market_name=current_market.get("market_name", "Unknown"),
                    side=current_market.get("side", "yes"),
                    price=current_market.get("price", 0),
                    coverage_tier=current_market.get("tier", 3),
                    expected_profit_pct=current_market.get("profit", 0),
                    recommended_size=current_market.get("size", 50),
                    raw_data=current_market,
                ))
            current_market = {}
            continue

        # Try to extract market ID
        id_match = re.search(r'(?:market_id|condition_id|id)[:\s]+([0-9a-fx]+)', line, re.I)
        if id_match:
            current_market["market_id"] = id_match.group(1)

        # Try to extract coverage tier
        tier_match = re.search(r'T(\d)', line)
        if tier_match:
            current_market["tier"] = int(tier_match.group(1))

        # Try to extract profit percentage
        profit_match = re.search(r'(\d+\.?\d*)%?\s*(?:profit|return|gain)', line, re.I)
        if profit_match:
            current_market["profit"] = float(profit_match.group(1))

        # Try to extract market name/question
        if "?" in line and "market_name" not in current_market:
            current_market["market_name"] = line.strip()

    # Don't forget last entry
    if current_market.get("market_id"):
        opportunities.append(HedgeOpportunity(
            market_id=current_market.get("market_id", ""),
            market_name=current_market.get("market_name", "Unknown"),
            side=current_market.get("side", "yes"),
            price=current_market.get("price", 0),
            coverage_tier=current_market.get("tier", 3),
            expected_profit_pct=current_market.get("profit", 0),
            recommended_size=current_market.get("size", 50),
            raw_data=current_market,
        ))

    return opportunities


def _extract_tier(item: dict) -> int:
    """Extract coverage tier from various field names."""
    for key in ("coverage_tier", "tier", "coverage"):
        val = item.get(key)
        if val is not None:
            if isinstance(val, str):
                m = re.search(r'(\d)', val)
                return int(m.group(1)) if m else 3
            return int(val)
    # Infer from coverage percentage
    coverage_pct = item.get("coverage_pct", item.get("coverage_percent", 0))
    if coverage_pct >= 95:
        return 1
    elif coverage_pct >= 90:
        return 2
    return 3
