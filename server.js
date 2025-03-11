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
let waitingForImageQuestion = false; // Indique si on attend une question sur l'image
let conversationHistory = []; // Historique de la conversation

// Endpoint pour réinitialiser l'historique
app.post("/api/reset", (req, res) => {
    conversationHistory = [];
    imageUrl = null;
    waitingForImageQuestion = false;
    res.json({ message: "Conversation réinitialisée" });
});

// API pour gérer les messages (texte et questions sur l’image)
app.post("/api/message", async (req, res) => {
    const { message } = req.body;

    try {
        let reply;

        if (waitingForImageQuestion && imageUrl) {
            // 📷 L’utilisateur pose une question sur l’image → Envoyer à l’API d’image
            const apiUrl = `https://sandipbaruwal.onrender.com/gemini2?prompt=${encodeURIComponent(message)}&url=${encodeURIComponent(imageUrl)}`;
            const response = await axios.get(apiUrl);
            reply = response.data.answer;
            waitingForImageQuestion = false; // Désactive l'attente après la réponse

            // Sauvegarde dans l'historique
            conversationHistory.push({ role: "user", message: `[Question sur l'image] ${message}` });
            conversationHistory.push({ role: "assistant", message: reply });
        } else {
            // 📝 Conversation texte normale
            conversationHistory.push({ role: "user", message });
            const fullPrompt = conversationHistory
                .map(entry => (entry.role === "user" ? "User: " : "Assistant: ") + entry.message)
                .join("\n");

            const apiUrl = `http://sgp1.hmvhostings.com:25721/gemini?question=${encodeURIComponent(fullPrompt)}`;
            const response = await axios.get(apiUrl);
            reply = response.data.answer;

            // Ajoute la réponse à l'historique
            conversationHistory.push({ role: "assistant", message: reply });
        }

        res.json({ reply });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur API" });
    }
});

// API Upload d’image et gestion de l’attente pour une question
app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
        // ✅ Dès que l'utilisateur envoie une image, le bot répond immédiatement
        res.json({ reply: "Téléchargement de l'image en cours..." });

        const file = fs.createReadStream(req.file.path);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("key", "6fef3d0d57641305c16bd5c0b5e27426");

        const imgbbResponse = await axios.post("https://api.imgbb.com/1/upload", formData, {
            headers: formData.getHeaders(),
        });

        fs.unlinkSync(req.file.path); // Supprime l’image locale après upload
        imageUrl = imgbbResponse.data.data.url; // Stocke temporairement l’URL
        waitingForImageQuestion = true; // Active l’attente d’une question

        // ✅ Une fois l’image uploadée, le bot envoie un message
        conversationHistory.push({ role: "assistant", message: "Image reçue. Posez toutes vos questions sur l'image." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur de téléchargement d'image" });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
