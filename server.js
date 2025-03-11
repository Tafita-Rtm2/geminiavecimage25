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

let imageUrl = null; // Stocke  temporairement l'URL de l'image uploadée

// API Texte uniquement ou avec image selon la présence d'une URL
app.post("/api/message", async (req, res) => {
    const { message } = req.body;

    try {
        // Construction de l'URL de l'API en utilisant la nouvelle API
        let apiUrl = `https://api.zetsu.xyz/gemini?prompt=${encodeURIComponent(message)}&url=`;
        if (imageUrl) {
            apiUrl = `https://api.zetsu.xyz/gemini?prompt=${encodeURIComponent(message)}&url=${encodeURIComponent(imageUrl)}`;
            imageUrl = null; // Réinitialisation après utilisation
        }

        const response = await axios.get(apiUrl);
        // La nouvelle API renvoie une réponse dans la clé "gemini"
        res.json({ reply: response.data.gemini });
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
