import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
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

/* ======================
   PATH FRONTEND
====================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ======================
   MIDDLEWARE
====================== */
app.use(cors());
app.use(express.json());

/* ======================
   STATIC FRONTEND
====================== */
app.use(express.static(path.join(__dirname, "public")));

/* ======================
   DATABASE
====================== */
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.locals.db = pool;

/* ======================
   CLOUDINARY
====================== */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

/* ======================
   MODULE ROUTES
====================== */
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

/* ======================
   HEALTH CHECK
====================== */
app.get("/api/health", (req, res) => {
  res.json({ status: "OK NIA RDC 🚀" });
});

/* ======================
   AUTH REGISTER
====================== */
app.post("/auth/register", async (req, res) => {
  try {
    const { telephone, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (telephone, password)
       VALUES ($1,$2)
       RETURNING id, telephone`,
      [telephone, hash]
    );

    res.json(result.rows[0]);

  } catch (e) {
    res.status(500).json({ error: "register error" });
  }
});

/* ======================
   AUTH LOGIN
====================== */
app.post("/auth/login", async (req, res) => {
  try {
    const { telephone, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE telephone=$1",
      [telephone]
    );

    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: "user not found" });

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) return res.status(400).json({ error: "wrong password" });

    res.json({
      id: user.id,
      telephone: user.telephone,
      is_admin: user.is_admin,
      is_vip: user.is_vip
    });

  } catch (e) {
    res.status(500).json({ error: "login error" });
  }
});

/* ======================
   UPLOAD IMAGE
====================== */
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no file" });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "nia_rdc" },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({ url: result.secure_url });

  } catch (e) {
    res.status(500).json({ error: "upload error" });
  }
});

/* ======================
   FRONTEND ENTRY
====================== */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ======================
   START
====================== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 NIA RDC RUNNING ON", PORT);
});