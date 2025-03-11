const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

const upload = multer({ dest: "uploads/" });

let imageUrl = null;

app.post("/api/message", async (req, res) => {
    const { message } = req.body;

    try {
        let apiUrl = `https://renzweb.onrender.com/api/gemini-1206?prompt=${encodeURIComponent(message)}&uid=1`;
        if (imageUrl) {
            apiUrl += `&img=${encodeURIComponent(imageUrl)}`;
            imageUrl = null;
        }

        const response = await axios.get(apiUrl);
        const reply = response.data.reply;

        // Détecter les réponses contenant du code
        const isCode = reply.includes("```");
        const cleanedReply = reply.replace(/```/g, "");

        res.json({ reply: cleanedReply, isCode });
    } catch (error) {
        res.status(500).json({ error: "Erreur API" });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
