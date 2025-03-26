const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const uploadBtn = document.getElementById("upload-btn");
const imageInput = document.getElementById("image-input");

let lastImageUrl = ""; // Stocke l'image téléversée pour poser une question dessus

// Charger la conversation enregistrée
window.onload = () => {
    const savedChat = localStorage.getItem("conversation");
    if (savedChat) {
        chatBox.innerHTML = savedChat;
    }
};

// Fonction pour ajouter un message dans le chat
function addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender === "user" ? "user-message" : "bot-message");
    messageDiv.innerText = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    saveConversation();
}

// Fonction pour sauvegarder la conversation
function saveConversation() {
    localStorage.setItem("conversation", chatBox.innerHTML);
}

// Fonction pour envoyer un message texte à l'API Kaizenji
function sendMessage() {
    const message = userInput.value.trim();
    if (message === "") return;

    addMessage(message, "user");
    userInput.value = "";

    let apiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o-pro?ask=${encodeURIComponent(message)}&uid=1`;

    if (lastImageUrl) {
        apiUrl += `&imageUrl=${encodeURIComponent(lastImageUrl)}`;
        lastImageUrl = ""; // Réinitialiser l'image après envoi
    }

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            addMessage(data.response, "bot");
        })
        .catch(() => {
            addMessage("❌ Erreur avec l'API.", "bot");
        });
}

// Fonction pour téléverser une image sur ImgBB
function uploadImage(file) {
    addMessage("📤 Téléchargement de l’image en cours...", "bot");

    const formData = new FormData();
    formData.append("image", file);

    fetch("https://api.imgbb.com/1/upload?key=ffe88394d062119de16776181902619e", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        lastImageUrl = data.data.url;
        addMessage("✅ Image téléchargée. Que voulez-vous en faire ?", "bot");
    })
    .catch(() => {
        addMessage("❌ Erreur lors du téléversement de l’image.", "bot");
    });
}

// Gestion des événements
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

uploadBtn.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        uploadImage(e.target.files[0]);
    }
});
