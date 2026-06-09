import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ======================
// CONFIG CLOUDINARY
// ======================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// ======================
// MULTER (upload temp)
// ======================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ======================
// UPLOAD IMAGE
// ======================
router.post("/upload", upload.single("image"), async (req, res) => {
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

    res.json({
      url: result.secure_url
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;