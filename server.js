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

// API Message (texte ou image)
app.post("/api/message", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message vide" });
    }

    try {
        let apiUrl = `https://api.zetsu.xyz/gemini?prompt=${encodeURIComponent(message)}`;

        if (imageUrl) {
            apiUrl += `&url=${encodeURIComponent(imageUrl)}`;
            console.log("Envoi de l'image avec la question:", apiUrl);
            imageUrl = null; // Reset après utilisation
        }

        const response = await axios.get(apiUrl);
        res.json({ reply: response.data.gemini });
    } catch (error) {
        console.error("Erreur API:", error);
        res.status(500).json({ error: "Erreur API" });
    }
});

// API Upload d'image (Transformation en lien via ImgBB)
app.post("/api/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Aucune image reçue" });
    }

    try {
        console.log("Téléchargement d'image en cours...");

        const file = fs.createReadStream(req.file.path);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("key", "6fef3d0d57641305c16bd5c0b5e27426");

        const imgbbResponse = await axios.post("https://api.imgbb.com/1/upload", formData, {
            headers: formData.getHeaders(),
        });

        fs.unlinkSync(req.file.path); // Supprime l'image locale après upload
        imageUrl = imgbbResponse.data.data.url; // Stocke temporairement l'URL de l'image

        console.log("Image téléchargée:", imageUrl);
        res.json({ message: "Image envoyée. Tapez votre question :", imageUrl });
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image:", error);
        res.status(500).json({ error: "Erreur de téléchargement d'image" });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
