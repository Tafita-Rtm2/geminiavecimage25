const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(bodyParser.json());

const GEMINI_API_URL = "https://zaikyoo.onrender.com/api/gemini-2-0-exp";
const IMGBB_API_KEY = "6fef3d0d57641305c16bd5c0b5e27426";

// Route pour envoyer un message texte
app.post("/sendMessage", async (req, res) => {
    const { message } = req.body;
    try {
        const response = await axios.get(`${GEMINI_API_URL}?prompt=${encodeURIComponent(message)}&uid=1`);
        res.json({ reply: response.data.reply });
    } catch (error) {
        res.status(500).json({ reply: "Erreur : Impossible d'obtenir une réponse." });
    }
});

// Route pour uploader une image sur ImgBB
app.post("/uploadImage", async (req, res) => {
    const imageBase64 = req.body.image; // Image en base64
    const formData = new FormData();
    formData.append("image", imageBase64);

    try {
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData, {
            headers: formData.getHeaders()
        });
        res.json({ imageUrl: response.data.data.url });
    } catch (error) {
        res.status(500).json({ error: "Échec de l'upload de l'image" });
    }
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
