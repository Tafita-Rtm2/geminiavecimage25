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

// API Texte ou image selon la présence d'une URL d'image
app.post("/api/message", async (req, res) => {
    const { message } = req.body;

    try {
        let response;
        if (imageUrl) {
            // Utilisation de l'API image
            const apiUrl = `https://sandipbaruwal.onrender.com/gemini2?prompt=${encodeURIComponent(message)}&url=${encodeURIComponent(imageUrl)}`;
            response = await axios.get(apiUrl);
            imageUrl = null; // Réinitialisation après utilisation
        } else {
            // Utilisation de l'API texte
            const apiUrl = `http://sgp1.hmvhostings.com:25721/gemini?question=${encodeURIComponent(message)}`;
            response = await axios.get(apiUrl);
        }
        // On renvoie la réponse extraite de la clé "answer"
        res.json({ reply: response.data.answer });
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
