// server.js (Mise à jour)
import express from "express";
import cors from "cors";
import pkg from "pg";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import bcrypt from "bcrypt";

const { Pool } = pkg;
const app = express();

// 1. CORS en premier
app.use(cors());

// 2. Parseurs avec limites augmentées
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
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
// Dans ta route POST /road_issues
app.post('/road_issues', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // On récupère toutes les variables du body
    const { title, description, latitude, longitude, user_id, surface, budget, niveau_danger } = req.body;

    const issueRes = await client.query(
      `INSERT INTO road_issues (title, description, latitude, longitude, user_id, surface, budget, niveau_danger) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        title, 
        description, 
        latitude, 
        longitude, 
        user_id, 
        surface || 0, 
        budget || 0, 
        niveau_danger || 'MOYEN' // <--- Ne pas oublier le 8ème paramètre !
      ]
    );

    const newIssue = issueRes.rows[0];

    // Log de synchronisation pour Firebase
    await client.query(
      'INSERT INTO sync_logs (entity, entity_id, action, data, status) VALUES ($1, $2, $3, $4, $5)',
      ['road_issue', newIssue.id, 'PUSH', JSON.stringify(newIssue), 'PENDING']
    );

    await client.query('COMMIT');
    res.status(201).json(newIssue);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
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
    const { id, email, password, name, role_id } = req.body;
    
    // Hashage si mot de passe présent (comptes locaux)
    const password_hash = password ? await bcrypt.hash(password, 10) : null;
    
    const result = await pool.query(`
      INSERT INTO users (id, email, password_hash, name, role_id, provider)
      VALUES ($1, $2, $3, $4, $5, $6) 
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
      RETURNING id, email, name, role_id
    `, [
      id, // L'UID venant de Firebase
      email, 
      password_hash, 
      name, 
      role_id || 2, 
      id ? 'FIREBASE' : 'LOCAL'
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erreur création utilisateur:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const query = `
      SELECT u.*, b.blocked_at
      FROM users u 
      LEFT JOIN block_user b ON u.id = b.user_id
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    if (user.blocked_at) {
      return res.status(403).json({ error: "Ce compte est bloqué." });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      const { password_hash, ...safeUser } = user;
      res.json({ message: "Welcome", user: safeUser });
    } else {
      res.status(401).json({ error: "Identifiants invalides" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});// 1. Route pour récupérer les logs en attente (PENDING)
app.get('/sync_logs', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM sync_logs';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Route pour mettre à jour le statut du log après la synchro
app.patch('/sync_logs/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const synced_at = status === 'SUCCESS' ? new Date() : null;
    await pool.query(
      'UPDATE sync_logs SET status = $1, synced_at = $2 WHERE id = $3',
      [status, synced_at, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Route GET : Récupérer le dernier index de synchro
app.get('/sync_meta/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const result = await pool.query(
      'SELECT last_firebase_log FROM sync_meta WHERE entity = $1', 
      [entity]
    );
    
    if (result.rows.length === 0) {
      return res.json({ last_firebase_log: 0 });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route POST : Sauvegarder les données et mettre à jour l'index
app.post('/sync_pull', async (req, res) => {
  const { entity, entity_id, data } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const newLogIndex = new Date(data.synced_at?.seconds * 1000 || Date.now()).getTime();

    await client.query(`
      INSERT INTO road_issues (id, title, description, latitude, longitude, niveau_danger, status, surface, budget) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        niveau_danger = EXCLUDED.niveau_danger,
        status = EXCLUDED.status,
        surface = EXCLUDED.surface, -- AJOUT
        budget = EXCLUDED.budget    -- AJOUT
    `, [
      entity_id, 
      data.title, 
      data.description, 
      data.latitude, 
      data.longitude, 
      data.niveau_danger || 'MOYEN',
      data.status || 'EN_ATTENTE',
      data.surface || 0, // Récupéré depuis Firebase
      data.budget || 0   // Récupéré depuis Firebase
    ]);
    // ... reste du code
         await client.query(`
      INSERT INTO sync_meta (entity, last_firebase_log)
      VALUES ($1, $2)
      ON CONFLICT (entity) DO UPDATE SET last_firebase_log = $2
    `, [entity, newLogIndex]);

    await client.query('COMMIT');
    res.json({ success: true, newIndex: newLogIndex });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
app.patch('/road_issues/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Déterminer quelle colonne de date mettre à jour
    let dateUpdate = "";
    if (status === 'EN_COURS') {
        dateUpdate = ", started_at = NOW()";
    } else if (status === 'RESOLU' || status === 'TERMINÉ') {
        dateUpdate = ", resolved_at = NOW()";
    }

    try {
        // La requête SQL met à jour le statut, updated_at et la date spécifique
        const query = `
            UPDATE road_issues 
            SET status = $1, updated_at = NOW() ${dateUpdate}
            WHERE id = $2 
            RETURNING *;
        `;
        
        const result = await pool.query(query, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Signalement non trouvé" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
/**
 * @swagger
 * /users/block:
 * post:
 * summary: Bloque un utilisateur après trop d'échecs
 */
app.post("/users/block", async (req, res) => {
  const { email, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Récupérer l'ID de l'utilisateur à partir de l'email
    const userRes = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });
    
    const userId = userRes.rows[0].id;

   
    await client.query(
      "INSERT INTO block_user (user_id, reason) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, reason || "Trop de tentatives de connexion"]
    );

    // 3. Log pour la synchronisation Firebase (Optionnel mais recommandé)
    await client.query(
      "INSERT INTO sync_logs (entity, entity_id, action, data, status) VALUES ($1, $2, $3, $4, $5)",
      ['user_blocked', userId, 'UPDATE', JSON.stringify({ is_blocked: true, reason }), 'PENDING']
    );

    await client.query('COMMIT');
    res.json({ success: true, message: "Utilisateur bloqué en base locale" });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT u.id, u.email, u.name, u.role_id, b.blocked_at
      FROM users u
      LEFT JOIN block_user b ON u.id = b.user_id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const user = result.rows[0];

    // Vérification du blocage
    if (user.blocked_at) {
      return res.status(403).json({ error: "Ce compte est bloqué en base locale." });
    }

    res.json(user); // Renvoie l'objet complet : {id, email, name, role_id}
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/users_with_status", async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.email, u.name, r.name as role_name,
             (CASE WHEN b.user_id IS NOT NULL THEN true ELSE false END) as is_blocked
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN block_user b ON u.id = b.user_id
      ORDER BY u.name ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/users/unblock/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM block_user WHERE user_id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://localhost:${PORT}`);
});