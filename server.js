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
app.use(cors());
app.use(express.json());

// --------------------
// PATH FRONTEND
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------
// DATABASE
// --------------------
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.locals.db = pool;

// --------------------
// CLOUDINARY
// --------------------
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// --------------------
// FRONTEND SERVING
// --------------------
app.use(express.static(__dirname));

// page principale
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// autres pages
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "home.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.get("/annonce", (req, res) => {
  res.sendFile(path.join(__dirname, "annonce.html"));
});

app.get("/publish", (req, res) => {
  res.sendFile(path.join(__dirname, "publish.html"));
});

app.get("/vip", (req, res) => {
  res.sendFile(path.join(__dirname, "vip.html"));
});

// --------------------
// API MODULES
// --------------------
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

// --------------------
// UPLOAD IMAGE
// --------------------
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

// --------------------
// AUTH
// --------------------
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

// --------------------
// HEALTH CHECK
// --------------------
app.get("/health", (req, res) => {
  res.json({ status: "NIA RDC LIVE 🚀" });
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 SERVER READY ON", PORT);
});