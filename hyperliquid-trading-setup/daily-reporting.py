#!/usr/bin/env python3
"""
Hyperliquid Trading Bot - Daily Reporting Script
Generates daily P&L summaries and trade reports from Hummingbot logs
"""

import os
import sys
import csv
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
import argparse

class DailyReporter:
    def __init__(self, base_dir=None):
        self.base_dir = base_dir or os.path.dirname(os.path.abspath(__file__))
        self.logs_dir = self.base_dir
        self.tracker_file = os.path.join(self.base_dir, "trading-tracker.csv")
        self.report_file = os.path.join(self.base_dir, f"daily-report-{datetime.now().strftime('%Y-%m-%d')}.csv")
        
    def parse_hummingbot_logs(self, bot_name, days=1):
        """
        Parse Hummingbot log files for trade information
        
        Args:
            bot_name: Name of the bot (funding-arb or meme-grid)
            days: Number of days to look back
            
        Returns:
            List of trade dictionaries
        """
        trades = []
        
        # Log files to check
        log_paths = [
            os.path.join(self.base_dir, f"hummingbot-{bot_name}", "logs"),
            os.path.join(self.base_dir, f"{bot_name}", "logs")
        ]
        
        for log_path in log_paths:
            if not os.path.exists(log_path):
                continue
                
            # Find log files from the last N days
            cutoff_date = datetime.now() - timedelta(days=days)
            
            for log_file in os.listdir(log_path):
                if not log_file.endswith('.log'):
                    continue
                    
                file_path = os.path.join(log_path, log_file)
                file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                
                if file_mtime < cutoff_date:
                    continue
                    
                trades.extend(self._parse_log_file(file_path, bot_name))
        
        return trades
    
    def _parse_log_file(self, file_path, bot_name):
        """Parse a single log file for trade information"""
        trades = []
        
        # Patterns for different log formats
        patterns = [
            # Hummingbot v1+ format
            r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*Order filled.*(\w+).*price: ([\d.]+).*amount: ([\d.]+)',
            r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*Bought.*(\w+).*price: ([\d.]+).*amount: ([\d.]+)',
            r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*Sold.*(\w+).*price: ([\d.]+).*amount: ([\d.]+)',
            # Generic format
            r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*?(\w+[-_]?\w*).*?([\d,]+\.?\d*).*?([\d,]+\.?\d*)',
        ]
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    for pattern in patterns:
                        match = re.search(pattern, line)
                        if match:
                            trade = {
                                'timestamp': match.group(1),
                                'asset': match.group(2).strip(),
                                'price': float(match.group(3).replace(',', '')),
                                'amount': float(match.group(4).replace(',', '')),
                                'value': float(match.group(3).replace(',', '')) * float(match.group(4).replace(',', '')),
                                'bot': bot_name,
                                'strategy': 'funding' if 'funding' in bot_name else 'meme'
                            }
                            trades.append(trade)
                            break
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
        
        return trades
    
    def calculate_pnl(self, trades):
        """
        Calculate P&L from a list of trades
        
        Args:
            trades: List of trade dictionaries
            
        Returns:
            Dictionary with P&L metrics
        """
        if not trades:
            return {
                'total_trades': 0,
                'total_pnl': 0.0,
                'win_rate': 0.0,
                'largest_win': 0.0,
                'largest_loss': 0.0,
                'avg_trade': 0.0
            }
        
        # Group trades by asset and calculate P&L
        # This is a simplified calculation - pair up buys and sells
        pnl_trades = []
        holdings = {}
        
        for trade in sorted(trades, key=lambda x: x['timestamp']):
            asset = trade['asset']
            
            if asset not in holdings:
                holdings[asset] = []
            
            holdings[asset].append(trade)
        
        # Calculate P&L for completed trades
        total_pnl = 0.0
        wins = []
        losses = []
        
        for asset, asset_trades in holdings.items():
            buys = [t for t in asset_trades if 'buy' in t.get('action', '').lower() or 'bought' in t.get('timestamp', '').lower()]
            sells = [t for t in asset_trades if 'sell' in t.get('action', '').lower() or 'sold' in t.get('timestamp', '').lower()]
            
            # Simple pairing: match each buy with a sell
            for buy, sell in zip(buys, sells):
                pnl = (sell['price'] - buy['price']) * buy['amount']
                total_pnl += pnl
                
                if pnl > 0:
                    wins.append(pnl)
                else:
                    losses.append(pnl)
        
        return {
            'total_trades': len(trades),
            'total_pnl': total_pnl,
            'win_rate': len(wins) / len(trades) * 100 if trades else 0.0,
            'largest_win': max(wins) if wins else 0.0,
            'largest_loss': min(losses) if losses else 0.0,
            'avg_trade': total_pnl / len(trades) if trades else 0.0
        }
    
    def generate_daily_report(self):
        """Generate a comprehensive daily report"""
        print("=" * 60)
        print(f"Daily Trading Report - {datetime.now().strftime('%Y-%m-%d')}")
        print("=" * 60)
        print()
        
        # Get trades from both bots
        funding_trades = self.parse_hummingbot_logs('funding-arb')
        meme_trades = self.parse_hummingbot_logs('meme-grid')
        
        # Calculate P&L for each strategy
        funding_metrics = self.calculate_pnl(funding_trades)
        meme_metrics = self.calculate_pnl(meme_trades)
        
        # Calculate overall metrics
        all_trades = funding_trades + meme_trades
        overall_metrics = self.calculate_pnl(all_trades)
        
        # Print Funding Arbitrage Report
        print("FUNDING ARBITRAGE STRATEGY")
        print("-" * 40)
        print(f"Total Trades: {funding_metrics['total_trades']}")
        print(f"Total P&L: ${funding_metrics['total_pnl']:.2f}")
        print(f"Win Rate: {funding_metrics['win_rate']:.1f}%")
        print(f"Largest Win: ${funding_metrics['largest_win']:.2f}")
        print(f"Largest Loss: ${funding_metrics['largest_loss']:.2f}")
        print()
        
        # Print Meme Grid Report
        print("MEME GRID STRATEGY")
        print("-" * 40)
        print(f"Total Trades: {meme_metrics['total_trades']}")
        print(f"Total P&L: ${meme_metrics['total_pnl']:.2f}")
        print(f"Win Rate: {meme_metrics['win_rate']:.1f}%")
        print(f"Largest Win: ${meme_metrics['largest_win']:.2f}")
        print(f"Largest Loss: ${meme_metrics['largest_loss']:.2f}")
        print()
        
        # Print Overall Summary
        print("OVERALL SUMMARY")
        print("-" * 40)
        print(f"Total Trades: {overall_metrics['total_trades']}")
        print(f"Total P&L: ${overall_metrics['total_pnl']:.2f}")
        print(f"Win Rate: {overall_metrics['win_rate']:.1f}%")
        print(f"Average Trade: ${overall_metrics['avg_trade']:.2f}")
        print()
        
        # Export to CSV
        self._export_report_to_csv({
            'date': datetime.now().strftime('%Y-%m-%d'),
            'funding_trades': funding_metrics['total_trades'],
            'funding_pnl': funding_metrics['total_pnl'],
            'funding_win_rate': funding_metrics['win_rate'],
            'meme_trades': meme_metrics['total_trades'],
            'meme_pnl': meme_metrics['total_pnl'],
            'meme_win_rate': meme_metrics['win_rate'],
            'total_trades': overall_metrics['total_trades'],
            'total_pnl': overall_metrics['total_pnl'],
            'overall_win_rate': overall_metrics['win_rate'],
            'avg_trade': overall_metrics['avg_trade']
        })
        
        # Export trade details
        if all_trades:
            self._export_trades_to_csv(all_trades)
        
        return overall_metrics
    
    def _export_report_to_csv(self, report_data):
        """Export daily report to CSV file"""
        file_exists = os.path.exists(self.report_file)
        
        with open(self.report_file, 'a', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'date', 'funding_trades', 'funding_pnl', 'funding_win_rate',
                'meme_trades', 'meme_pnl', 'meme_win_rate',
                'total_trades', 'total_pnl', 'overall_win_rate', 'avg_trade'
            ])
            
            if not file_exists:
                writer.writeheader()
            
            writer.writerow(report_data)
        
        print(f"Report exported to: {self.report_file}")
        print()
    
    def _export_trades_to_csv(self, trades):
        """Export detailed trade list to CSV"""
        trades_file = os.path.join(self.base_dir, f"trades-{datetime.now().strftime('%Y-%m-%d')}.csv")
        
        with open(trades_file, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'timestamp', 'strategy', 'bot', 'asset', 'action',
                'price', 'amount', 'value'
            ])
            
            writer.writeheader()
            
            for trade in sorted(trades, key=lambda x: x['timestamp']):
                # Determine action (buy/sell) from timestamp or other field
                action = 'BUY' if 'buy' in trade.get('timestamp', '').lower() else 'SELL'
                
                writer.writerow({
                    'timestamp': trade['timestamp'],
                    'strategy': trade['strategy'],
                    'bot': trade['bot'],
                    'asset': trade['asset'],
                    'action': action,
                    'price': trade['price'],
                    'amount': trade['amount'],
                    'value': trade['value']
                })
        
        print(f"Trade details exported to: {trades_file}")
        print()
    
    def update_tracker(self, trades):
        """Update the main trading tracker CSV file"""
        if not os.path.exists(self.tracker_file):
            print(f"Tracker file not found: {self.tracker_file}")
            return
        
        # Read existing data
        with open(self.tracker_file, 'r') as f:
            existing_data = list(csv.reader(f))
        
        # Append new trades
        with open(self.tracker_file, 'a', newline='') as f:
            writer = csv.writer(f)
            
            for trade in trades:
                action = 'BUY' if 'buy' in trade.get('timestamp', '').lower() else 'SELL'
                writer.writerow([
                    trade['timestamp'],
                    trade['strategy'],
                    trade['asset'],
                    action,
                    trade['price'],
                    '',  # Exit price (to be filled later)
                    trade['value'],
                    '',  # P&L (to be calculated)
                    '',  # P&L %
                    '',  # Fees
                    ''   # Notes
                ])
        
        print(f"Updated tracker: {self.tracker_file}")
        print()

def main():
    parser = argparse.ArgumentParser(description='Generate daily trading reports')
    parser.add_argument('--days', type=int, default=1, help='Number of days to report on')
    parser.add_argument('--bot', type=str, choices=['funding', 'meme', 'all'], default='all',
                        help='Which bot(s) to report on')
    parser.add_argument('--update-tracker', action='store_true',
                        help='Update the main trading tracker file')
    
    args = parser.parse_args()
    
    reporter = DailyReporter()
    
    if args.update_tracker:
        trades = []
        if args.bot in ['funding', 'all']:
            trades.extend(reporter.parse_hummingbot_logs('funding-arb', args.days))
        if args.bot in ['meme', 'all']:
            trades.extend(reporter.parse_hummingbot_logs('meme-grid', args.days))
        reporter.update_tracker(trades)
    
    metrics = reporter.generate_daily_report()
    
    print("=" * 60)
    print("Report generation complete!")
    print("=" * 60)

if __name__ == '__main__':
    main()
