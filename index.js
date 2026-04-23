const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Configurarea conexiunii la baza de date din Docker
const pool = new Pool({
  user: process.env.DB_USER || 'glowup_user',
  host: process.env.DB_HOST || 'main-db',
  database: process.env.DB_NAME || 'glowup_db',
  password: process.env.DB_PASSWORD || 'glowup_password',
  port: 5432,
});

app.use(express.json());

// Endpoint de test pentru a verifica starea serviciului
app.get('/health', (req, res) => {
  res.json({ status: "IO Service is running and ready!" });
});

// Endpoint pentru produse
app.get('/products', async (req, res) => {
  try {
    // Verificăm conexiunea la baza de date cerând ora curentă de la serverul SQL
    const dbRes = await pool.query('SELECT NOW()');
    
    // Returnăm un răspuns fals deocamdată, doar pentru a testa ruta
    res.json({
      message: "Conexiune la DB reușită!",
      db_time: dbRes.rows[0].now,
      data: [
        { id: 1, name: "Cerave Hydrating Cleanser", type: "cleanser" },
        { id: 2, name: "Paula's Choice BHA", type: "exfoliant" }
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la conectarea cu baza de date" });
  }
});

app.listen(port, () => {
  console.log(`IO Service asculta pe portul ${port}`);
});