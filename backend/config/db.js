const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'viasugas',
  password: '1003526827',
  port: 5432,
});

module.exports = pool;
