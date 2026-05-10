const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  user: process.env.DB_USER || 'glowup_user',
  host: process.env.DB_HOST || 'main-db',
  database: process.env.DB_NAME || 'glowup_db',
  password: process.env.DB_PASSWORD || 'glowup_password',
  port: 5432,
});

// Funcție care se rulează la pornire pentru a crea structura
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        active_ingredients VARCHAR(255)
      );
    `);
    console.log("Tabelul 'inventory' este pregatit!");
  } catch (err) {
    console.error("Eroare la crearea tabelului:", err);
  }
};
initDB();

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: "IO Service is running!" }));

app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory');
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Eroare la citirea bazei de date." });
  }
});

app.listen(port, () => console.log(`IO Service asculta pe portul ${port}`));