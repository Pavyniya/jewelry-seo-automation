-- Database Performance Optimization for Jewelry SEO Automation

-- Enable performance monitoring
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -10000;  -- 10MB cache
PRAGMA temp_store = memory;
PRAGMA mmap_size = 268435456;  -- 256MB memory mapping

-- Create optimized indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_products_status_vendor ON products(status, vendor);
CREATE INDEX IF NOT EXISTS idx_products_optimization_status ON products(optimization_status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_last_optimized ON products(last_optimized DESC);
CREATE INDEX IF NOT EXISTS idx_products_vendor_status ON products(vendor, status);
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING fts(title, description, tags);

-- Index optimization for optimization_versions table
CREATE INDEX IF NOT EXISTS idx_optimization_versions_product_id ON optimization_versions(product_id);
CREATE INDEX IF NOT EXISTS idx_optimization_versions_is_active ON optimization_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_optimization_versions_created_at ON optimization_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_versions_product_active ON optimization_versions(product_id, is_active);

-- AI usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_created ON ai_usage_records(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model_created ON ai_usage_records(model, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_success_rate ON ai_usage_records(success, created_at);

-- Content review indexes
CREATE INDEX IF NOT EXISTS idx_content_reviews_status ON content_reviews(status);
CREATE INDEX IF NOT EXISTS idx_content_reviews_created_at ON content_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reviews_reviewer ON content_reviews(reviewer_id, status);

-- Analytics and monitoring indexes
CREATE INDEX IF NOT EXISTS idx_analytics_date_type ON analytics(date, type);
CREATE INDEX IF NOT EXISTS idx_analytics_product_id ON analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type_value ON analytics(type, value);

-- User activity indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);

-- Performance optimization views
CREATE VIEW IF NOT EXISTS product_optimization_status AS
SELECT
    p.id,
    p.title,
    p.vendor,
    p.status,
    p.optimization_status,
    p.last_optimized,
    ov.created_at as last_version_created,
    COUNT(ov.id) as version_count
FROM products p
LEFT JOIN optimization_versions ov ON p.id = ov.product_id
GROUP BY p.id, p.title, p.vendor, p.status, p.optimization_status, p.last_optimized, ov.created_at;

-- Analytics aggregation views
CREATE VIEW IF NOT EXISTS daily_analytics_summary AS
SELECT
    DATE(created_at) as date,
    type,
    COUNT(*) as count,
    AVG(CAST(value as REAL)) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value
FROM analytics
GROUP BY DATE(created_at), type
ORDER BY date DESC, type;

-- AI usage summary view
CREATE VIEW IF NOT EXISTS ai_usage_summary AS
SELECT
    provider_id,
    model,
    DATE(created_at) as date,
    COUNT(*) as request_count,
    SUM(tokens_used) as total_tokens,
    AVG(tokens_used) as avg_tokens,
    SUM(CAST(success as INTEGER)) * 100.0 / COUNT(*) as success_rate
FROM ai_usage_records
GROUP BY provider_id, model, DATE(created_at)
ORDER BY date DESC;

-- Trigger to update last_optimized timestamp
CREATE TRIGGER IF NOT EXISTS update_product_last_optimized
AFTER UPDATE ON optimization_versions
WHEN NEW.is_active = 1 AND OLD.is_active = 0
BEGIN
    UPDATE products
    SET last_optimized = CURRENT_TIMESTAMP,
        optimization_status = 'completed'
    WHERE id = NEW.product_id;
END;

-- Trigger to maintain optimization status
CREATE TRIGGER IF NOT EXISTS update_product_optimization_status
AFTER INSERT ON optimization_versions
BEGIN
    UPDATE products
    SET optimization_status = 'processing'
    WHERE id = NEW.product_id AND optimization_status = 'pending';
END;

-- Vacuum command to reclaim space (run periodically)
VACUUM;

-- Analyze command to update statistics (run after large data changes)
ANALYZE;

-- Performance monitoring functions
CREATE OR REPLACE FUNCTION get_query_stats()
RETURNS TABLE (
    query_text TEXT,
    total_count INTEGER,
    avg_time REAL,
    min_time REAL,
    max_time REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sql as query_text,
        count(*) as total_count,
        avg(blk_read_time + blk_write_time) as avg_time,
        min(blk_read_time + blk_write_time) as min_time,
        max(blk_read_time + blk_write_time) as max_time
    FROM sqlite_master
    CROSS JOIN pragma_index_list(name)
    WHERE type = 'table'
    GROUP BY sql
    ORDER BY avg_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(threshold_ms INTEGER DEFAULT 100)
RETURNS TABLE (
    query_text TEXT,
    execution_count INTEGER,
    avg_time_ms REAL,
    total_time_ms REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sql as query_text,
        count(*) as execution_count,
        avg(blk_read_time + blk_write_time) * 1000 as avg_time_ms,
        sum(blk_read_time + blk_write_time) * 1000 as total_time_ms
    FROM sqlite_master
    WHERE type = 'table'
    GROUP BY sql
    HAVING avg(blk_read_time + blk_write_time) * 1000 > threshold_ms
    ORDER BY avg_time_ms DESC;
END;
$$ LANGUAGE plpgsql;

-- Performance optimization recommendations view
CREATE VIEW IF NOT EXISTS performance_recommendations AS
SELECT
    'Consider adding index on frequently filtered columns' as recommendation,
    'products' as table_name,
    'Medium' as priority
WHERE NOT EXISTS (
        SELECT 1 FROM sqlite_master
        WHERE type = 'index'
        AND name = 'idx_products_composite'
    )

UNION ALL

SELECT
    'Consider archiving old records' as recommendation,
    'activity_logs' as table_name,
    'Low' as priority
WHERE (SELECT COUNT(*) FROM activity_logs) > 100000

UNION ALL

SELECT
    'Database vacuum recommended' as recommendation,
    'system' as table_name,
    'High' as priority
WHERE (SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name LIKE 'temp_%') > 10;

-- Query optimization examples
-- Example 1: Optimized product listing with proper indexing
/*
-- Before optimization (slow):
SELECT p.*, ov.*
FROM products p
LEFT JOIN optimization_versions ov ON p.id = ov.product_id
WHERE p.status = 'active' AND ov.is_active = true
ORDER BY p.created_at DESC;

-- After optimization (fast):
SELECT p.id, p.title, p.price, p.image_url,
       ov.optimized_title, ov.optimized_description
FROM products p
INNER JOIN optimization_versions ov ON p.id = ov.product_id
WHERE p.status = 'active'
  AND ov.is_active = true
  AND p.optimization_status = 'completed'
ORDER BY p.last_optimized DESC
LIMIT 20;
*/

-- Example 2: Optimized analytics query
/*
-- Before optimization (slow):
SELECT DATE(created_at) as date, type, COUNT(*) as count
FROM analytics
GROUP BY DATE(created_at), type
ORDER BY date DESC;

-- After optimization (fast):
SELECT date, type, count
FROM daily_analytics_summary
ORDER BY date DESC;
*/