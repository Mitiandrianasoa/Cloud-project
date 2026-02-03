// server.js (Mise à jour)
import express from "express";
import cors from "cors";
import pkg from "pg";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import bcrypt from "bcrypt";

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "localweb",
  port: 5432,
});

// ---------------------------
// Swagger Options
// ---------------------------
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: { title: "API Gestion Routière Antananarivo", version: "1.0.0" },
  },
  apis: ["./server.js"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------------------------
// ROUTES ROAD_ISSUES
// ---------------------------

/**
 * @swagger
 * /road_issues:
 * get:
 * summary: Liste tous les signalements de problèmes routiers
 * responses:
 * 200:
 * description: Succès
 */
app.get("/road_issues", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ri.*, u.name AS user_name 
      FROM road_issues ri
      LEFT JOIN users u ON ri.user_id = u.id
      ORDER BY ri.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /road_issues:
 * post:
 * summary: Créer un nouveau signalement
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * title: { type: string }
 * latitude: { type: number }
 * longitude: { type: number }
 * description: { type: string }
 * user_id: { type: string }
 * responses:
 * 201:
 * description: Créé
 */
app.post("/road_issues", async (req, res) => {
  const { title, description, surface, budget, company, latitude, longitude, user_id } = req.body;
  
  try {
    const result = await pool.query(`
      INSERT INTO road_issues 
      (title, description, surface, budget, company, latitude, longitude, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [title, description, surface, budget, company, latitude, longitude, user_id]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// ROUTES USERS & AUTH
// ---------------------------

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "API OK", dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, email, name FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { email, password, name, role_id } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(`
      INSERT INTO users (email, password_hash, name, role_id)
      VALUES ($1, $2, $3, $4) RETURNING id, email, name
    `, [email, password_hash, name, role_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const { password_hash, ...safeUser } = user;
      res.json({ message: "Welcome", user: safeUser });
    } else {
      res.status(401).json({ error: "Identifiants invalides" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://localhost:${PORT}`);
});