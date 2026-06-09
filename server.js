import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

import adminModule from "./admin_module.js";
import vipModule from "./vip_module.js";
import { loadSearch } from "./search_loader.js";
import { loadFeed } from "./feed_loader.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// DB
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.locals.db = pool;

// CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// MULTER
const upload = multer({ storage: multer.memoryStorage() });

// MODULES
app.use("/api", adminModule);
app.use("/api", vipModule);
loadSearch(app);
loadFeed(app);

// HEALTH
app.get("/", (req, res) => {
  res.json({ status: "NIA RDC FULL SYSTEM ACTIVE 🚀" });
});

// AUTH
app.post("/auth/register", async (req, res) => {
  const { telephone, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    "INSERT INTO users (telephone, password) VALUES ($1,$2) RETURNING id, telephone, is_vip, is_admin",
    [telephone, hash]
  );

  res.json(result.rows[0]);
});

app.post("/auth/login", async (req, res) => {
  const { telephone, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE telephone=$1",
    [telephone]
  );

  const user = result.rows[0];

  if (!user) return res.status(400).json({ error: "User not found" });

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) return res.status(400).json({ error: "Wrong password" });

  res.json({
    id: user.id,
    telephone: user.telephone,
    is_vip: user.is_vip,
    is_admin: user.is_admin
  });
});

// UPLOAD IMAGE
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

// ANNONCES
app.get("/annonces", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM annonces ORDER BY created_at DESC"
  );

  res.json(result.rows);
});

app.post("/annonces", async (req, res) => {
  const {
    user_id,
    titre,
    description,
    categorie,
    prix_jour,
    ville,
    commune,
    quartier,
    conditions_location,
    contact_phone,
    contact_name,
    status,
    image_url
  } = req.body;

  const result = await pool.query(
    `INSERT INTO annonces (
      user_id, titre, description, categorie,
      prix_jour, ville, commune, quartier,
      conditions_location,
      contact_phone, contact_name,
      status, image_url
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *`,
    [
      user_id,
      titre,
      description,
      categorie,
      prix_jour,
      ville,
      commune,
      quartier,
      conditions_location,
      contact_phone,
      contact_name,
      status || "disponible",
      image_url || null
    ]
  );

  res.json(result.rows[0]);
});

// VIEWS
app.post("/annonces/:id/view", async (req, res) => {
  await pool.query(
    "UPDATE annonces SET views = views + 1 WHERE id=$1",
    [req.params.id]
  );

  res.json({ ok: true });
});

// FAVORIS
app.post("/favoris", async (req, res) => {
  const { user_id, annonce_id } = req.body;

  const result = await pool.query(
    "INSERT INTO favoris (user_id, annonce_id) VALUES ($1,$2) RETURNING *",
    [user_id, annonce_id]
  );

  res.json(result.rows[0]);
});

// CONTACT
app.post("/contact", async (req, res) => {
  const { user_id, annonce_id, contact_phone } = req.body;

  const result = await pool.query(
    "INSERT INTO contacts (user_id, annonce_id, contact_phone) VALUES ($1,$2,$3) RETURNING *",
    [user_id, annonce_id, contact_phone]
  );

  res.json(result.rows[0]);
});

// REPORT
app.post("/report", async (req, res) => {
  const { user_id, annonce_id, reason } = req.body;

  const result = await pool.query(
    "INSERT INTO reports (user_id, annonce_id, reason) VALUES ($1,$2,$3) RETURNING *",
    [user_id, annonce_id, reason]
  );

  res.json(result.rows[0]);
});

// START
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 NIA RDC RUNNING FULL SYSTEM");
});