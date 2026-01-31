"""
Self-Hosted Whale Tracker
Monitors Ethereum addresses for large transactions
Zero external SaaS dependencies
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Set
from dataclasses import dataclass
import yaml

from web3 import Web3, AsyncWeb3
from web3.exceptions import TransactionNotFound
import psycopg2
from psycopg2.extras import RealDictCursor
import redis.asyncio as redis
from prometheus_client import Counter, Gauge, Histogram, start_http_server

# Prometheus metrics
WHALE_TX_DETECTED = Counter('whale_transactions_detected_total', 'Total whale transactions detected', ['network', 'category'])
WHALE_VALUE_ETH = Histogram('whale_transaction_value_eth', 'Whale transaction value in ETH', ['network'])
ACTIVE_MONITORS = Gauge('whale_active_monitors', 'Number of active address monitors')
RPC_LATENCY = Histogram('rpc_request_duration_seconds', 'RPC request latency')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/whale-tracker.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class AddressLabel:
    address: str
    name: str
    category: str
    tags: List[str]
    alert_threshold_eth: float = 100.0


@dataclass
class WhaleTransaction:
    tx_hash: str
    from_address: str
    to_address: Optional[str]
    from_label: Optional[str]
    to_label: Optional[str]
    value_eth: float
    value_usd: Optional[float]
    token_symbol: Optional[str]
    token_amount: Optional[float]
    network: str
    timestamp: datetime


class Database:
    def __init__(self):
        self.conn = None
        
    def connect(self):
        self.conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'postgres'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'trading_db'),
            user=os.getenv('DB_USER', 'trader'),
            password=os.getenv('DB_PASSWORD', 'changeme')
        )
        
    def store_transaction(self, tx: WhaleTransaction):
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO whale_transactions 
                (tx_hash, from_address, to_address, from_label, to_label, 
                 value_eth, value_usd, token_symbol, token_amount, network, alerted)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (tx_hash) DO NOTHING
            """, (
                tx.tx_hash, tx.from_address, tx.to_address, tx.from_label, tx.to_label,
                tx.value_eth, tx.value_usd, tx.token_symbol, tx.token_amount, tx.network, False
            ))
        self.conn.commit()
        
    def get_recent_transactions(self, hours: int = 24) -> List[dict]:
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM whale_transactions 
                WHERE timestamp > NOW() - INTERVAL '%s hours'
                ORDER BY timestamp DESC
            """, (hours,))
            return cur.fetchall()


class WhaleTracker:
    # Free RPC endpoints for redundancy
    ETH_RPC_URLS = [
        'https://eth.llamarpc.com',
        'https://rpc.ankr.com/eth',
        'https://ethereum.publicnode.com',
        'https://cloudflare-eth.com',
    ]
    
    def __init__(self):
        self.labels: Dict[str, AddressLabel] = {}
        self.db = Database()
        self.redis: Optional[redis.Redis] = None
        self.providers: List[Web3] = []
        self.current_provider_idx = 0
        self.known_tx_hashes: Set[str] = set()
        
    async def initialize(self):
        """Initialize connections"""
        logger.info("Initializing Whale Tracker...")
        
        # Load labels
        await self.load_labels()
        
        # Connect to database
        self.db.connect()
        logger.info("Connected to PostgreSQL")
        
        # Connect to Redis
        try:
            self.redis = redis.Redis(
                host=os.getenv('REDIS_HOST', 'redis'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                decode_responses=True
            )
            await self.redis.ping()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            self.redis = None
        
        # Initialize Web3 providers
        for url in self.ETH_RPC_URLS:
            try:
                w3 = Web3(Web3.HTTPProvider(url, request_kwargs={'timeout': 30}))
                if w3.is_connected():
                    self.providers.append(w3)
                    logger.info(f"Connected to RPC: {url}")
            except Exception as e:
                logger.warning(f"Failed to connect to {url}: {e}")
        
        if not self.providers:
            raise Exception("No RPC providers available!")
        
        ACTIVE_MONITORS.set(len(self.labels))
        logger.info(f"Monitoring {len(self.labels)} addresses")
        
    async def load_labels(self):
        """Load address labels from config files"""
        labels_dir = '/app/data/labels'
        
        # Default labels if no config exists
        default_labels = {
            'whales': [
                {
                    'address': '0x28C6c06298d514Db089934071355E5743bf21d60',  # Binance 14
                    'name': 'Binance 14',
                    'category': 'exchange',
                    'alert_threshold_eth': 500
                },
                {
                    'address': '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549',  # Binance 15
                    'name': 'Binance 15',
                    'category': 'exchange',
                    'alert_threshold_eth': 500
                }
            ]
        }
        
        try:
            import os
            if os.path.exists(f'{labels_dir}/whales.yaml'):
                with open(f'{labels_dir}/whales.yaml', 'r') as f:
                    data = yaml.safe_load(f)
            else:
                data = default_labels
                
            for whale in data.get('whales', []):
                addr = whale['address'].lower()
                self.labels[addr] = AddressLabel(
                    address=addr,
                    name=whale['name'],
                    category=whale.get('category', 'unknown'),
                    tags=whale.get('tags', []),
                    alert_threshold_eth=whale.get('alert_threshold_eth', 100.0)
                )
                
            for exchange in data.get('exchanges', []):
                addr = exchange['address'].lower()
                self.labels[addr] = AddressLabel(
                    address=addr,
                    name=exchange['name'],
                    category='exchange',
                    tags=['exchange'],
                    alert_threshold_eth=exchange.get('alert_threshold_eth', 1000.0)
                )
                
        except Exception as e:
            logger.error(f"Failed to load labels: {e}")
            # Use defaults
            for whale in default_labels['whales']:
                addr = whale['address'].lower()
                self.labels[addr] = AddressLabel(
                    address=addr,
                    name=whale['name'],
                    category=whale['category'],
                    tags=[],
                    alert_threshold_eth=whale['alert_threshold_eth']
                )
    
    def get_provider(self) -> Web3:
        """Get next available provider (round-robin)"""
        provider = self.providers[self.current_provider_idx]
        self.current_provider_idx = (self.current_provider_idx + 1) % len(self.providers)
        return provider
    
    async def scan_block(self, block_number: int):
        """Scan a block for whale transactions"""
        try:
            w3 = self.get_provider()
            block = w3.eth.get_block(block_number, full_transactions=True)
            
            for tx in block.transactions:
                await self.process_transaction(tx, block)
                
        except Exception as e:
            logger.error(f"Error scanning block {block_number}: {e}")
    
    async def process_transaction(self, tx, block):
        """Process a single transaction"""
        tx_hash = tx.hash.hex()
        
        # Skip if already processed
        if tx_hash in self.known_tx_hashes:
            return
        self.known_tx_hashes.add(tx_hash)
        
        from_addr = tx.get('from', '').lower() if tx.get('from') else None
        to_addr = tx.get('to', '').lower() if tx.get('to') else None
        
        # Check if either address is in our watchlist
        from_label = self.labels.get(from_addr)
        to_label = self.labels.get(to_addr)
        
        if not from_label and not to_label:
            return
        
        # Calculate value in ETH
        value_eth = float(Web3.from_wei(tx.get('value', 0), 'ether'))
        
        # Check thresholds
        threshold = from_label.alert_threshold_eth if from_label else to_label.alert_threshold_eth
        if value_eth < threshold:
            return
        
        # Create transaction record
        whale_tx = WhaleTransaction(
            tx_hash=tx_hash,
            from_address=from_addr,
            to_address=to_addr,
            from_label=from_label.name if from_label else None,
            to_label=to_label.name if to_label else None,
            value_eth=value_eth,
            value_usd=None,  # Would need price oracle
            token_symbol=None,
            token_amount=None,
            network='ethereum',
            timestamp=datetime.fromtimestamp(block.timestamp)
        )
        
        # Store in database
        self.db.store_transaction(whale_tx)
        
        # Update metrics
        category = from_label.category if from_label else to_label.category
        WHALE_TX_DETECTED.labels(network='ethereum', category=category).inc()
        WHALE_VALUE_ETH.labels(network='ethereum').observe(value_eth)
        
        # Send alert
        await self.send_alert(whale_tx)
        
        logger.info(f"Whale transaction detected: {from_label.name if from_label else 'Unknown'} -> "
                   f"{to_label.name if to_label else 'Unknown'}: {value_eth:.2f} ETH")
    
    async def send_alert(self, tx: WhaleTransaction):
        """Send alert via Telegram or other channels"""
        # Store in Redis for real-time notifications
        if self.redis:
            await self.redis.publish('whale_alerts', json.dumps({
                'tx_hash': tx.tx_hash,
                'from': tx.from_label or tx.from_address[:20] + '...',
                'to': tx.to_label or (tx.to_address[:20] + '...' if tx.to_address else 'Contract'),
                'value': f"{tx.value_eth:.2f} ETH",
                'time': tx.timestamp.isoformat()
            }))
    
    async def run(self):
        """Main monitoring loop"""
        await self.initialize()
        
        # Start Prometheus metrics server
        start_http_server(8080)
        logger.info("Metrics server started on port 8080")
        
        # Get current block and start monitoring
        w3 = self.get_provider()
        latest_block = w3.eth.block_number
        logger.info(f"Starting monitoring from block {latest_block}")
        
        while True:
            try:
                current_block = w3.eth.block_number
                
                # Process new blocks
                while latest_block < current_block:
                    latest_block += 1
                    await self.scan_block(latest_block)
                
                # Clean up old tx hashes to prevent memory growth
                if len(self.known_tx_hashes) > 100000:
                    self.known_tx_hashes.clear()
                
                await asyncio.sleep(12)  # ~Ethereum block time
                
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                await asyncio.sleep(5)


async def main():
    tracker = WhaleTracker()
    await tracker.run()


if __name__ == '__main__':
    asyncio.run(main())
