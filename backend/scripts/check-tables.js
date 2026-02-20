const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'yellow_machinery_erp',
  user: 'postgres',
  password: 'postgres'
});

async function main() {
  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

main();
