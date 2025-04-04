document.addEventListener("DOMContentLoaded", () => {
    const chatMessages = document.getElementById("chatMessages");
    const messageInput = document.getElementById("messageInput");
    const sendMessageBtn = document.getElementById("sendMessage");
    const imageUpload = document.getElementById("imageUpload");

    let uploadedImageUrl = null; // Stocke l'image uploadée temporairement

    // Charger les messages sauvegardés au démarrage
    loadMessages();

    function addMessage(text, sender, image = null, save = true) {
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

        if (save) saveMessages(text, sender, image);
    }

    // Sauvegarder les messages dans localStorage
    function saveMessages(text, sender, image) {
        let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
        messages.push({ text, sender, image });
        localStorage.setItem("chatMessages", JSON.stringify(messages));
    }

    // Charger les messages depuis localStorage
    function loadMessages() {
        let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
        messages.forEach(msg => addMessage(msg.text, msg.sender, msg.image, false));
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

        const response = await fetch("/api/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });
        const data = await response.json();
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
