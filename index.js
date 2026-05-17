const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  user: process.env.DB_USER || 'glowup_user',
  host: process.env.DB_HOST || 'main-db',
  database: process.env.DB_NAME || 'glowup_db',
  password: process.env.DB_PASSWORD || 'glowup_password',
  port: process.env.DB_PORT || 5432,
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
          username VARCHAR(50) PRIMARY KEY,
          skin_type VARCHAR(20),
          sensitivities TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          category VARCHAR(50),
          active_ingredients TEXT,
          consistency INT, 
          ph_level DECIMAL, 
          time_of_day VARCHAR(10)
      );

      CREATE TABLE IF NOT EXISTS user_shelf (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) REFERENCES user_profiles(username),
          product_id INT REFERENCES products(id),
          opened_date DATE NOT NULL,
          pao_months INT NOT NULL
      );
    `);
    console.log("Tabelele au fost create cu succes!");

    const checkRes = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(checkRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, category, active_ingredients, consistency, ph_level, time_of_day) VALUES 
        ('Glow Serum', 'tratament', 'Vitamina C, Niacinamide', 2, 3.5, 'AM'),
        ('Night Renewal', 'tratament', 'Retinol, Acid Hialuronic', 3, 5.5, 'PM'),
        ('Exfoliant Lichid', 'curatare', 'AHA, BHA, Acid Glicolic', 1, 3.2, 'PM'),
        ('Daily Moisture', 'hidratare', 'Ceramide, Glicerina', 4, 5.5, 'BOTH'),
        ('Sun Shield', 'protectie solara', 'Zinc Oxide', 5, 7.0, 'AM');
      `);
      console.log("Datele de test au fost inserate!");
    }
  } catch (err) {
    console.error("Eroare la initializarea bazei de date:", err);
  }
};
initDB();

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: "IO Service is running!" }));

app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Eroare la citirea bazei de date." });
  }
});

// Adăugare produs pe raft
app.post('/shelf', async (req, res) => {
  const { username, product_id, pao_months } = req.body;
  const opened_date = new Date().toISOString().split('T')[0]; 

  try {
    await pool.query(
      'INSERT INTO user_shelf (username, product_id, opened_date, pao_months) VALUES ($1, $2, $3, $4)',
      [username, product_id, opened_date, pao_months]
    );
    res.json({ message: "Produs adaugat cu succes pe raftul tau!" });
  } catch (err) {
    res.status(500).json({ error: "Eroare la adaugarea produsului." });
  }
});

// Vizualizare raft + calculare expirare
app.get('/shelf/:username', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.name, p.category, s.opened_date, s.pao_months,
             (s.opened_date + (s.pao_months || ' months')::interval) as expiry_date
      FROM user_shelf s
      JOIN products p ON s.product_id = p.id
      WHERE s.username = $1
    `, [req.params.username]);
    
    res.json({ user: req.params.username, shelf_items: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Eroare la citirea raftului." });
  }
});

app.listen(port, () => console.log(`IO Service asculta pe portul ${port}`));