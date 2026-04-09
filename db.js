require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: parseInt(process.env.PORT)
});

// Export a query function to easily interact with the pool
module.exports = {
  query: (text, params) => pool.query(text, params),
};