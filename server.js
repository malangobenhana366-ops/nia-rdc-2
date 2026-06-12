import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { v2 as cloudinary } from "cloudinary";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.static(__dirname));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* UPLOAD */
async function uploadImage(base64){
  try {
    const res = await cloudinary.uploader.upload(base64, {
      folder: "nia_rdc"
    });
    return res.secure_url;
  } catch {
    return "";
  }
}

/* REGISTER */
app.post("/auth/register", async (req,res)=>{
  const {telephone,password} = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (telephone,password) VALUES ($1,$2) RETURNING *",
      [telephone,password]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({error:"register error"});
  }
});

/* LOGIN */
app.post("/auth/login", async (req,res)=>{
  const {telephone,password} = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE telephone=$1",
    [telephone]
  );

  const user = result.rows[0];

  if(!user) return res.status(400).json({error:"user not found"});
  if(user.password !== password)
    return res.status(400).json({error:"wrong password"});

  res.json({id:user.id,telephone:user.telephone});
});

/* CREATE ANNONCE + MULTI IMAGES */
app.post("/annonces", async (req,res)=>{
  try {
    const {
      user_id,
      titre,
      description,
      prix,
      ville,
      quartier,
      telephone,
      images_base64
    } = req.body;

    if(!user_id || !titre){
      return res.status(400).json({error:"missing fields"});
    }

    // 1. create annonce
    const annonce = await pool.query(
      `INSERT INTO annonces (user_id,titre,description,prix,ville,quartier,telephone)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [user_id,titre,description,prix,ville,quartier,telephone]
    );

    const annonceId = annonce.rows[0].id;

    // 2. upload images
    let images = [];

    if(images_base64 && images_base64.length > 0){
      for(let img of images_base64){
        const url = await uploadImage(img);
        if(url) images.push(url);
      }
    }

    // 3. save images in table
    for(let url of images){
      await pool.query(
        "INSERT INTO annonce_images (annonce_id,image_url) VALUES ($1,$2)",
        [annonceId,url]
      );
    }

    res.json({id:annonceId,images});

  } catch(e){
    res.status(500).json({error:"create error"});
  }
});

/* FEED + IMAGES */
app.get("/feed", async (req,res)=>{
  try {
    const annonces = await pool.query(
      "SELECT * FROM annonces ORDER BY id DESC"
    );

    const data = [];

    for(let a of annonces.rows){
      const imgs = await pool.query(
        "SELECT image_url FROM annonce_images WHERE annonce_id=$1",
        [a.id]
      );

      data.push({
        ...a,
        images: imgs.rows.map(i=>i.image_url)
      });
    }

    res.json(data);

  } catch {
    res.json([]);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("RUNNING",PORT));
