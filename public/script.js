document.addEventListener("DOMContentLoaded", () => {
    const chatMessages = document.getElementById("chatMessages");
    const messageInput = document.getElementById("messageInput");
    const sendMessageBtn = document.getElementById("sendMessage");
    const imageUpload = document.getElementById("imageUpload");

    let uploadedImageUrl = null; // Stocke l'image uploadée temporairement

    // CHARGER LES MESSAGES SAUVEGARDÉS DEPUIS localStorage
    const savedMessages = JSON.parse(localStorage.getItem("chatHistory")) || [];
    savedMessages.forEach(msg => {
        addMessage(msg.text, msg.sender, msg.image);
    });

    function addMessage(text, sender, image = null) {
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("chat-message", sender);
        msgDiv.textContent = text;
        if (image) {
            const img = document.createElement("img");
            img.src = image;
            img.style.maxWidth = "100px";
            msgDiv.appendChild(img);
        }
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // SAUVEGARDER LE MESSAGE DANS localStorage
        saveMessage({ text, sender, image });
    }

    function saveMessage(message) {
        const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
        chatHistory.push(message);
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    }

    sendMessageBtn.addEventListener("click", async () => {
        const message = messageInput.value.trim();
        if (!message) return;

        addMessage(message, "user");
        messageInput.value = "";

        let requestBody = { message };
        if (uploadedImageUrl) {
            requestBody.imageUrl = uploadedImageUrl;
            uploadedImageUrl = null; // Reset après envoi
        }

        // AJOUTER L'INDICATEUR "LE BOT EST EN TRAIN DE RÉPONDRE..."
        const pendingMessageDiv = document.createElement("div");
        pendingMessageDiv.classList.add("chat-message", "bot");
        pendingMessageDiv.textContent = "Le bot est en train de répondre...";
        chatMessages.appendChild(pendingMessageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const response = await fetch("/api/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        // SUPPRIMER L'INDICATEUR APRÈS RÉCEPTION DE LA RÉPONSE
        pendingMessageDiv.remove();

        addMessage(data.reply, "bot");
    });

    imageUpload.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        addMessage("Téléchargement de l'image en cours...", "bot");

        const formData = new FormData();
        formData.append("image", file);

        const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
        const { imageUrl } = await uploadResponse.json();
        uploadedImageUrl = imageUrl;

        addMessage("Image envoyée. Tapez votre question :", "bot", imageUrl);
    });
});
