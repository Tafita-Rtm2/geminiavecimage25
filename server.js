require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const axios = require("axios");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Multer pour gérer l'upload d'images
const upload = multer({ storage: multer.memoryStorage() });

const GEMINI_API_URL = "https://zaikyoo.onrender.com/api/gemini-2-0-exp";
const IMGBB_API_KEY = "6fef3d0d57641305c16bd5c0b5e27426";

// 📌 Route pour envoyer un message texte uniquement
app.post("/send-message", async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await axios.get(`${GEMINI_API_URL}?prompt=${encodeURIComponent(prompt)}&uid=1`);
    res.json({ reply: response.data.reply });
  } catch (error) {
    res.status(500).json({ error: "Erreur avec l'API." });
  }
});

// 📌 Route pour envoyer une image et obtenir un lien via ImgBB
app.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer.toString("base64");
    const imgbbResponse = await axios.post("https://api.imgbb.com/1/upload", null, {
      params: { key: IMGBB_API_KEY, image: imageBuffer },
    });
    res.json({ imageUrl: imgbbResponse.data.data.url });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'upload de l'image." });
  }
});

// 📌 Route pour envoyer un message avec une image
app.post("/send-image-message", async (req, res) => {
  const { prompt, imageUrl } = req.body;
  try {
    const response = await axios.get(`${GEMINI_API_URL}?prompt=${encodeURIComponent(prompt)}&uid=1&img=${encodeURIComponent(imageUrl)}`);
    res.json({ reply: response.data.reply });
  } catch (error) {
    res.status(500).json({ error: "Erreur avec l'API." });
  }
});

app.listen(port, () => console.log(`✅ Serveur lancé sur http://localhost:${port}`));
