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

let imageUrl = null; // Stocke temporairement l'URL de l'image uploadée
let conversationHistory = []; // Historique de la conversation

// Endpoint optionnel pour réinitialiser l'historique de conversation
app.post("/api/reset", (req, res) => {
    conversationHistory = [];
    res.json({ message: "Conversation réinitialisée" });
});

// API qui gère le texte et l'image avec conservation du contexte conversationnel
app.post("/api/message", async (req, res) => {
    const { message } = req.body;

    // Ajoute le message de l'utilisateur à l'historique
    conversationHistory.push({ role: "user", message });

    // Construit le prompt complet à partir de l'historique
    const fullPrompt = conversationHistory.map(entry => {
        return (entry.role === "user" ? "User: " : "Assistant: ") + entry.message;
    }).join("\n");

    try {
        let response;
        if (imageUrl) {
            // Si une image a été uploadée, on utilise l'API d'image avec le contexte complet
            const apiUrl = `https://sandipbaruwal.onrender.com/gemini2?prompt=${encodeURIComponent(fullPrompt)}&url=${encodeURIComponent(imageUrl)}`;
            response = await axios.get(apiUrl);
            imageUrl = null; // Réinitialise après utilisation
        } else {
            // Sinon, on utilise l'API texte en passant le contexte complet
            const apiUrl = `http://sgp1.hmvhostings.com:25721/gemini?question=${encodeURIComponent(fullPrompt)}`;
            response = await axios.get(apiUrl);
        }
        const answer = response.data.answer;
        // Ajoute la réponse de l'API à l'historique
        conversationHistory.push({ role: "assistant", message: answer });
        res.json({ reply: answer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur API" });
    }
});

// API Upload d'image (Transformation en lien via ImgBB)
app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
        const file = fs.createReadStream(req.file.path);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("key", "6fef3d0d57641305c16bd5c0b5e27426");

        const imgbbResponse = await axios.post("https://api.imgbb.com/1/upload", formData, {
            headers: formData.getHeaders(),
        });

        fs.unlinkSync(req.file.path); // Supprime l'image locale après upload
        imageUrl = imgbbResponse.data.data.url; // Stocke temporairement l'URL
        res.json({ imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur de téléchargement d'image" });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
