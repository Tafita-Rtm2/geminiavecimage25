const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Chemin temporaire pour l'upload
const upload = multer({ dest: "uploads/" });

// Stocke l'URL de l'image (une seule à la fois)
let storedImageUrl = null;

// -------------------------
// 1) UPLOAD D'IMAGE
// -------------------------
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    console.log("Réception d'une image...");

    // Réponse immédiate (pour informer l'utilisateur)
    // ⚠ Attention: on répond tôt, mais on continue l'upload derrière
    // Si tu préfères attendre la fin de l'upload avant de répondre, 
    // déplace ce res.json() tout en bas.
    res.json({ reply: "Image reçue. Posez votre question sur l’image." });

    // Upload vers ImgBB
    const fileStream = fs.createReadStream(req.file.path);
    const formData = new FormData();
    formData.append("image", fileStream);
    formData.append("key", "6fef3d0d57641305c16bd5c0b5e27426");

    const imgbbResponse = await axios.post("https://api.imgbb.com/1/upload", formData, {
      headers: formData.getHeaders(),
    });

    // On supprime l'image locale après l'upload
    fs.unlinkSync(req.file.path);

    // On stocke l'URL pour la prochaine question
    storedImageUrl = imgbbResponse.data.data.url;
    console.log("URL de l'image stockée:", storedImageUrl);

  } catch (error) {
    console.error("Erreur pendant l'upload:", error);
    return res.status(500).json({ error: "Erreur de téléchargement d'image" });
  }
});

// -------------------------
// 2) MESSAGE (TEXTE + IMAGE?)
// -------------------------
app.post("/api/message", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("Message reçu:", message);

    // Construit l'URL de l'API
    let apiUrl = `https://api.zetsu.xyz/gemini?prompt=${encodeURIComponent(message)}`;

    if (storedImageUrl) {
      // On a une image en attente → on ajoute l'URL
      apiUrl += `&url=${encodeURIComponent(storedImageUrl)}`;
      console.log("Envoi à l'API avec l'image:", apiUrl);

      // Après avoir utilisé l'image, on l'invalide
      storedImageUrl = null;
    } else {
      // Pas d'image en attente → on met &url= vide (optionnel)
      apiUrl += "&url=";
      console.log("Envoi à l'API sans image:", apiUrl);
    }

    // Requête vers l'API zetsu
    const response = await axios.get(apiUrl);
    const botReply = response.data.gemini || "Pas de réponse";

    console.log("Réponse de l'API:", botReply);

    // On renvoie la réponse au front
    res.json({ reply: botReply });
  } catch (error) {
    console.error("Erreur pendant l'appel API:", error);
    res.status(500).json({ error: "Erreur API" });
  }
});

// Lancement du serveur
const port = 3000;
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
