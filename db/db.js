const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "pass",
  database: process.env.DB_NAME || "penny-wise-db",
});

module.exports = pool;

module.exports = pool;