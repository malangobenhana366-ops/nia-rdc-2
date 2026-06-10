import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// MODULES
import adminModule from "./admin_module.js";
import vipModule from "./vip_module.js";
import annonceModule from "./annonce_module.js";
import favoriteModule from "./favorite_module.js";
import notificationModule from "./notification_module.js";

import { loadSearch } from "./search_loader.js";
import { loadFeed } from "./feed_loader.js";
import { loadChat } from "./chat_loader.js";
import { loadRealtime } from "./realtime_loader.js";
import { loadDashboard } from "./dashboard_loader.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// DATABASE NEON
// =========================
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.locals.db = pool;

// =========================
// CLOUDINARY CONFIG
// =========================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// =========================
// ROUTES MODULES
// =========================
app.use("/api", adminModule);
app.use("/api", vipModule);
app.use("/api", annonceModule);
app.use("/api", favoriteModule);
app.use("/api", notificationModule);

loadSearch(app);
loadFeed(app);
loadChat(app);
loadRealtime(app);
loadDashboard(app);

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.json({ status: "NIA RDC LIVE 🚀" });
});

// =========================
// AUTH REGISTER
// =========================
app.post("/auth/register", async (req, res) => {
  try {
    const { telephone, password } = req.body;

    if (!telephone || !password) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const exist = await pool.query(
      "SELECT id FROM users WHERE telephone=$1",
      [telephone]
    );

    if (exist.rows.length > 0) {
      return res.status(400).json({ error: "Utilisateur existe déjà" });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (telephone, password)
       VALUES ($1, $2)
       RETURNING id, telephone`,
      [telephone, hash]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur register" });
  }
});

// =========================
// AUTH LOGIN
// =========================
app.post("/auth/login", async (req, res) => {
  try {
    const { telephone, password } = req.body;

    if (!telephone || !password) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE telephone=$1",
      [telephone]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: "Utilisateur introuvable" });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(400).json({ error: "Mot de passe incorrect" });
    }

    res.json({
      id: user.id,
      telephone: user.telephone,
      is_vip: user.is_vip || false,
      is_admin: user.is_admin || false
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur login" });
  }
});

// =========================
// UPLOAD IMAGE (CLOUDINARY)
// =========================
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "nia_rdc" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file.buffer);
    });

    res.json({ url: result.secure_url });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 SERVER READY ON PORT", PORT);
});