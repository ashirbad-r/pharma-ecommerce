const fs = require('fs');
const path = require('path');

async function initializeDatabase(pool) {
  try {
    // Check if products already exist
    const result = await pool.query('SELECT COUNT(*) FROM products');
    
    if (result.rows[0].count == 0) {
      console.log('🌱 Seeding database with products...');
      
      const seedSQL = fs.readFileSync(
        path.join(__dirname, 'database/seed-all-products.sql'),
        'utf8'
      );
      
      await pool.query(seedSQL);
      console.log('✅ Database seeded successfully!');
    } else {
      console.log(`✅ Database already has ${result.rows[0].count} products`);
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

module.exports = initializeDatabase;
