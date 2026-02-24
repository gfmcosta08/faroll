/**
 * Executa migrações SQL no Supabase
 * Uso: node scripts/run-migrations.js
 * Requer: DATABASE_URL no .env
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL não encontrada no .env');
    console.log('Obtenha em: Supabase > Project Settings > Database > Connection string (URI)');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

  console.log(`\n📦 ${files.length} migrações encontradas\n`);

  try {
    await client.connect();

    // Cria tabela de controle de migrações (se não existir)
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    for (const file of files) {
      const name = file.replace('.sql', '');
      const { rows } = await client.query(
        'SELECT 1 FROM _migrations WHERE name = $1',
        [name]
      );

      if (rows.length > 0) {
        console.log(`⏭️  ${file} (já aplicada)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
      console.log(`✅ ${file}`);
    }

    console.log('\n✅ Migrações concluídas!\n');
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
