const { Database } = require('better-sqlite3');
const db = new Database('./jewelry_seo_dev.db');

try {
  const row = db.prepare('SELECT * FROM products LIMIT 1').get();
  console.log('Raw row keys:', Object.keys(row));
  console.log('optimization_status:', row.optimization_status);
  console.log('optimization_status type:', typeof row.optimization_status);

  // Test JSON parsing
  try {
    const tags = JSON.parse(row.tags || '[]');
    console.log('Tags parsed successfully:', tags);
  } catch (e) {
    console.error('Tags parsing failed:', e.message);
  }

  try {
    const variants = JSON.parse(row.variants || '[]');
    console.log('Variants parsed successfully:', variants);
  } catch (e) {
    console.error('Variants parsing failed:', e.message);
  }

  try {
    const images = JSON.parse(row.images || '[]');
    console.log('Images parsed successfully:', images);
  } catch (e) {
    console.error('Images parsing failed:', e.message);
  }

} catch (error) {
  console.error('Database error:', error);
} finally {
  db.close();
}