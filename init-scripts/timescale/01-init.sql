-- Initialize TimescaleDB for market data

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Funding rates table
CREATE TABLE IF NOT EXISTS funding_rates (
    time TIMESTAMPTZ NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    funding_rate DECIMAL(20, 10) NOT NULL,
    mark_price DECIMAL(30, 10),
    index_price DECIMAL(30, 10),
    next_funding_time TIMESTAMPTZ,
    annualized_rate DECIMAL(20, 10),
    PRIMARY KEY (time, exchange, symbol)
);

-- Convert to hypertable
SELECT create_hypertable('funding_rates', 'time', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX idx_funding_exchange_symbol ON funding_rates(exchange, symbol, time DESC);
CREATE INDEX idx_funding_annualized ON funding_rates(annualized_rate, time DESC);

-- Price data table
CREATE TABLE IF NOT EXISTS prices (
    time TIMESTAMPTZ NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    price DECIMAL(30, 10) NOT NULL,
    volume_24h DECIMAL(30, 10),
    bid DECIMAL(30, 10),
    ask DECIMAL(30, 10),
    source VARCHAR(50),
    PRIMARY KEY (time, exchange, symbol)
);

SELECT create_hypertable('prices', 'time', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

CREATE INDEX idx_prices_symbol ON prices(symbol, time DESC);
CREATE INDEX idx_prices_exchange ON prices(exchange, symbol, time DESC);

-- Polymarket market data
CREATE TABLE IF NOT EXISTS polymarket_data (
    time TIMESTAMPTZ NOT NULL,
    market_id VARCHAR(100) NOT NULL,
    market_slug VARCHAR(200),
    question TEXT,
    outcome_yes_price DECIMAL(10, 6),
    outcome_no_price DECIMAL(10, 6),
    volume_usd DECIMAL(20, 2),
    liquidity_usd DECIMAL(20, 2),
    best_bid_yes DECIMAL(10, 6),
    best_ask_yes DECIMAL(10, 6),
    best_bid_no DECIMAL(10, 6),
    best_ask_no DECIMAL(10, 6),
    spread DECIMAL(10, 6),
    PRIMARY KEY (time, market_id)
);

SELECT create_hypertable('polymarket_data', 'time', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

CREATE INDEX idx_poly_market ON polymarket_data(market_id, time DESC);
CREATE INDEX idx_poly_spread ON polymarket_data(spread, time DESC);

-- Aggregated funding yield view (materialized)
CREATE MATERIALIZED VIEW IF NOT EXISTS funding_yield_24h AS
SELECT 
    exchange,
    symbol,
    time_bucket('1 day', time) as day,
    AVG(funding_rate) * 3 * 365 as estimated_apr,
    MIN(funding_rate) as min_rate,
    MAX(funding_rate) as max_rate,
    STDDEV(funding_rate) as rate_volatility,
    COUNT(*) as samples
FROM funding_rates
WHERE time > NOW() - INTERVAL '7 days'
GROUP BY exchange, symbol, day;

CREATE UNIQUE INDEX idx_funding_yield ON funding_yield_24h(exchange, symbol, day);

-- Create continuous aggregate for real-time funding stats
CREATE MATERIALIZED VIEW IF NOT EXISTS funding_stats_1h
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) as bucket,
    exchange,
    symbol,
    AVG(funding_rate) as avg_rate,
    MAX(funding_rate) as max_rate,
    MIN(funding_rate) as min_rate,
    LAST(mark_price, time) as last_price
FROM funding_rates
GROUP BY bucket, exchange, symbol;

-- Create retention policy (keep raw data for 90 days, aggregated for 1 year)
SELECT add_retention_policy('funding_rates', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('prices', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('polymarket_data', INTERVAL '90 days', if_not_exists => TRUE);

-- Create compression policy for older data
ALTER TABLE funding_rates SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'exchange,symbol'
);

SELECT add_compression_policy('funding_rates', INTERVAL '7 days', if_not_exists => TRUE);

-- Create read-only user
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'monitoring') THEN
        CREATE USER monitoring WITH PASSWORD 'monitor_pass';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE market_data TO monitoring;
GRANT USAGE ON SCHEMA public TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO monitoring;
