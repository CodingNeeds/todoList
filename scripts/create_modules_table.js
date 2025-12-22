/*
  Script: create_modules_table.js
  Purpose: Execute the SQL in database/schema.sql to create the `modules` table.

  Usage (PowerShell):

  # 1) Install dependency once
  npm install pg

  # 2) Run with environment variables (example)
  $env:PGHOST='localhost'; $env:PGPORT='5432'; $env:PGUSER='postgres'; $env:PGPASSWORD='your_password'; $env:PGDATABASE='schoolmodule'; node scripts/create_modules_table.js

  Or set env vars permanently or use a .env loader as desired.
*/

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    const client = new Client({
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'postgres',
    });

    console.log('Connecting to PostgreSQL %s@%s:%s/%s', client.user || process.env.PGUSER, client.host, client.port, client.database);

    await client.connect();
    console.log('Connected. Executing schema...');

    await client.query(sql);

    console.log('Schema executed successfully. `modules` table should exist now.');

    await client.end();
  } catch (err) {
    console.error('Error executing schema:', err && (err.stack || err.message) || err);
    process.exitCode = 1;
  }
}

run();
