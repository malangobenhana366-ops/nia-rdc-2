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

import { loadSearch } from "./search_loader.js";
import { loadFeed } from "./feed_loader.js";
import { loadNotifications } from "./notification_loader.js";
import { loadChat } from "./chat_loader.js";
import { loadRealtime } from "./realtime_loader.js";
import { loadDashboard } from "./dashboard_loader.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// DATABASE
// =========================
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.locals.db = pool;

// =========================
// CLOUDINARY
// =========================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// =========================
// ROUTES
// =========================
app.use("/api", adminModule);
app.use("/api", vipModule);
app.use("/api", annonceModule);
app.use("/api", favoriteModule);

// LOADERS
loadSearch(app);
loadFeed(app);
loadNotifications(app);
loadChat(app);
loadRealtime(app);
loadDashboard(app);

// =========================
// UPLOAD IMAGE
// =========================
app.post(
  "/upload",
  multer({ storage: multer.memoryStorage() }).single("image"),
  async (req, res) => {
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
  }
);

// =========================
// AUTH
// =========================
app.post("/auth/register", async (req, res) => {
  const { telephone, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (telephone, password)
     VALUES ($1,$2)
     RETURNING id, telephone, is_vip, is_admin`,
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

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.json({ status: "NIA RDC RUNNING 🚀" });
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 NIA RDC SERVER READY ON PORT", PORT);
});