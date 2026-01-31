-- Initialize trading database schema

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    strategy VARCHAR(50) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    exchange VARCHAR(50),
    market_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partial', 'cancelled', 'failed')),
    pnl DECIMAL(20, 8),
    fees DECIMAL(20, 8),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trades_timestamp ON trades(timestamp);
CREATE INDEX idx_trades_strategy ON trades(strategy);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_status ON trades(status);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy VARCHAR(50) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    exchange VARCHAR(50),
    market_id VARCHAR(100),
    side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
    size DECIMAL(20, 8) NOT NULL DEFAULT 0,
    entry_price DECIMAL(20, 8),
    current_price DECIMAL(20, 8),
    unrealized_pnl DECIMAL(20, 8),
    realized_pnl DECIMAL(20, 8) DEFAULT 0,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    metadata JSONB,
    UNIQUE(strategy, symbol, exchange, status)
);

CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_strategy ON positions(strategy);

-- Whale transactions table
CREATE TABLE IF NOT EXISTS whale_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tx_hash VARCHAR(100) NOT NULL UNIQUE,
    from_address VARCHAR(100) NOT NULL,
    to_address VARCHAR(100),
    from_label VARCHAR(100),
    to_label VARCHAR(100),
    value_eth DECIMAL(20, 8) NOT NULL,
    value_usd DECIMAL(20, 2),
    token_symbol VARCHAR(20),
    token_amount DECIMAL(30, 8),
    network VARCHAR(20) DEFAULT 'ethereum',
    alerted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whale_tx_timestamp ON whale_transactions(timestamp);
CREATE INDEX idx_whale_tx_from ON whale_transactions(from_address);
CREATE INDEX idx_whale_tx_to ON whale_transactions(to_address);
CREATE INDEX idx_whale_tx_value ON whale_transactions(value_eth);

-- News signals table
CREATE TABLE IF NOT EXISTS news_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    summary TEXT,
    sentiment VARCHAR(20) CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
    confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
    affected_assets TEXT[],
    suggested_action VARCHAR(20),
    acted_on BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_timestamp ON news_signals(timestamp);
CREATE INDEX idx_news_sentiment ON news_signals(sentiment);
CREATE INDEX idx_news_confidence ON news_signals(confidence);

-- Arbitrage opportunities table
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    market_id VARCHAR(100) NOT NULL,
    market_name VARCHAR(200),
    source_exchange VARCHAR(50),
    target_exchange VARCHAR(50),
    buy_price DECIMAL(20, 8) NOT NULL,
    sell_price DECIMAL(20, 8) NOT NULL,
    profit_percent DECIMAL(10, 4) NOT NULL,
    max_size_usd DECIMAL(20, 2),
    executed BOOLEAN DEFAULT FALSE,
    execution_trade_id UUID REFERENCES trades(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_arb_timestamp ON arbitrage_opportunities(timestamp);
CREATE INDEX idx_arb_executed ON arbitrage_opportunities(executed);
CREATE INDEX idx_arb_profit ON arbitrage_opportunities(profit_percent);

-- Daily P&L summary table
CREATE TABLE IF NOT EXISTS daily_pnl (
    date DATE PRIMARY KEY,
    strategy VARCHAR(50),
    realized_pnl DECIMAL(20, 8) DEFAULT 0,
    unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
    fees DECIMAL(20, 8) DEFAULT 0,
    trade_count INTEGER DEFAULT 0,
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'critical')),
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX idx_alerts_level ON alerts(level);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);

-- Create function to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_trades_updated_at before update on trades
    for each row execute function update_updated_at_column();

create trigger update_positions_updated_at before update on positions
    for each row execute function update_updated_at_column();

create trigger update_daily_pnl_updated_at before update on daily_pnl
    for each row execute function update_updated_at_column();

-- Create read-only user for monitoring
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'monitoring') THEN
        CREATE USER monitoring WITH PASSWORD 'monitor_pass';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE trading_db TO monitoring;
GRANT USAGE ON SCHEMA public TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO monitoring;

-- Insert sample whale addresses (you should update these with real ones)
INSERT INTO whale_transactions (tx_hash, from_address, from_label, value_eth, network, alerted)
VALUES 
    ('0x_sample_1', '0x_sample_wallet_1', 'Sample Exchange Hot', 1000.0, 'ethereum', false)
ON CONFLICT (tx_hash) DO NOTHING;
