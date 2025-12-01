const { Pool } = require('pg');

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "user",
  password: "pass",
  databse: "postgres",
});

module.exports = pool;