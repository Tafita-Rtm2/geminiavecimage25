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
        const formattedReply = `<pre><code>${response.data.reply}</code></pre>`;
        res.json({ reply: formattedReply });
    } catch (error) {
        res.status(500).json({ error: "Erreur API" });
    }
});

app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
        const file = fs.createReadStream(req.file.path);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("key", "6fef3d0d57641305c16bd5c0b5e27426");

        const imgbbResponse = await axios.post("https://api.imgbb.com/1/upload", formData, {
            headers: formData.getHeaders(),
        });

        fs.unlinkSync(req.file.path);
        imageUrl = imgbbResponse.data.data.url;
        res.json({ imageUrl });
    } catch (error) {
        res.status(500).json({ error: "Erreur de téléchargement d'image" });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
