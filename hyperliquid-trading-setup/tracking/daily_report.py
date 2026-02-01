#!/usr/bin/env python3
"""
Daily Trading Report Generator
Tracks performance across both bots
"""

import csv
import json
import os
from datetime import datetime, timedelta
from pathlib import Path

def load_trades(log_file):
    """Load trades from CSV log"""
    trades = []
    if not os.path.exists(log_file):
        return trades
    
    with open(log_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('Date'):  # Skip empty rows
                trades.append(row)
    return trades

def calculate_stats(trades, days=1):
    """Calculate trading statistics"""
    if not trades:
        return None
    
    # Filter for last N days
    cutoff = datetime.now() - timedelta(days=days)
    recent_trades = []
    
    for trade in trades:
        try:
            trade_date = datetime.strptime(trade['Date'], '%Y-%m-%d')
            if trade_date >= cutoff:
                recent_trades.append(trade)
        except:
            continue
    
    if not recent_trades:
        return None
    
    # Calculate metrics
    total_trades = len(recent_trades)
    winning_trades = sum(1 for t in recent_trades if float(t.get('Net P&L', 0)) > 0)
    losing_trades = total_trades - winning_trades
    
    total_pnl = sum(float(t.get('Net P&L', 0)) for t in recent_trades)
    total_fees = sum(float(t.get('Fees (USDC)', 0)) for t in recent_trades)
    
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    avg_pnl = total_pnl / total_trades if total_trades > 0 else 0
    
    return {
        'period': f'Last {days} day(s)',
        'total_trades': total_trades,
        'winning_trades': winning_trades,
        'losing_trades': losing_trades,
        'win_rate': f'{win_rate:.1f}%',
        'total_pnl': f'{total_pnl:.2f} USDC',
        'total_fees': f'{total_fees:.2f} USDC',
        'avg_pnl_per_trade': f'{avg_pnl:.2f} USDC'
    }

def print_report(stats, bot_name):
    """Print formatted report"""
    if not stats:
        print(f"\n{bot_name}: No trades in period")
        return
    
    print(f"\n{'='*50}")
    print(f"📊 {bot_name} - {stats['period']}")
    print(f"{'='*50}")
    print(f"Total Trades:     {stats['total_trades']}")
    print(f"Winning Trades:   {stats['winning_trades']} ✅")
    print(f"Losing Trades:    {stats['losing_trades']} ❌")
    print(f"Win Rate:         {stats['win_rate']}")
    print(f"Total P&L:        {stats['total_pnl']}")
    print(f"Total Fees:       {stats['total_fees']}")
    print(f"Avg P&L/Trade:    {stats['avg_pnl_per_trade']}")
    print(f"{'='*50}")

def main():
    """Generate daily report"""
    print("🚀 Hyperliquid Paper Trading Daily Report")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    # Load funding arb trades
    funding_log = Path.home() / 'hummingbot' / 'funding-arb' / 'data' / 'trades.csv'
    funding_backup = 'tracking/funding_arb_trades.csv'
    
    funding_trades = load_trades(funding_log) if funding_log.exists() else []
    if not funding_trades:
        funding_trades = load_trades(funding_backup)
    
    # Load meme grid trades
    meme_log = Path.home() / 'hummingbot' / 'meme-grid' / 'data' / 'trades.csv'
    meme_backup = 'tracking/meme_grid_trades.csv'
    
    meme_trades = load_trades(meme_log) if meme_log.exists() else []
    if not meme_trades:
        meme_trades = load_trades(meme_backup)
    
    # Calculate and print stats
    funding_stats = calculate_stats(funding_trades, days=1)
    meme_stats = calculate_stats(meme_trades, days=1)
    
    print_report(funding_stats, "Funding Arbitrage Bot")
    print_report(meme_stats, "Meme Grid Bot")
    
    # Combined stats
    print(f"\n{'='*50}")
    print("📈 COMBINED PERFORMANCE")
    print(f"{'='*50}")
    
    total_trades = (funding_stats['total_trades'] if funding_stats else 0) + \
                   (meme_stats['total_trades'] if meme_stats else 0)
    
    total_pnl = 0
    if funding_stats:
        total_pnl += float(funding_stats['total_pnl'].split()[0])
    if meme_stats:
        total_pnl += float(meme_stats['total_pnl'].split()[0])
    
    print(f"Total Trades:     {total_trades}")
    print(f"Combined P&L:     {total_pnl:.2f} USDC")
    
    if total_trades > 0:
        print(f"\n💡 Learnings:")
        print("   - Document what worked and what didn't")
        print("   - Adjust strategies based on results")
        print("   - Stay disciplined, don't chase losses")
    
    print(f"\n{'='*50}")

if __name__ == '__main__':
    main()
