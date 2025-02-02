document.addEventListener("DOMContentLoaded", () => {
    const chatbox = document.getElementById("chatbox");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const uploadBtn = document.getElementById("uploadBtn");
    const imageInput = document.getElementById("imageInput");

    // Charger l'historique des messages
    chatbox.innerHTML = localStorage.getItem("chatHistory") || "";

    function appendMessage(sender, message, imgSrc = null) {
        let msgHtml = `<div class="${sender}"><img src="${sender === 'bot' ? 'robot1.jpg' : 'user1.jpg'}">`;
        if (imgSrc) msgHtml += `<img src="${imgSrc}" class="chat-img">`;
        msgHtml += `<p>${message}</p></div>`;
        chatbox.innerHTML += msgHtml;
        localStorage.setItem("chatHistory", chatbox.innerHTML);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    sendBtn.addEventListener("click", async () => {
        const message = userInput.value.trim();
        if (!message) return;

        appendMessage("user", message);
        userInput.value = "";

        const response = await fetch("/sendMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        appendMessage("bot", data.reply);
    });

    uploadBtn.addEventListener("click", () => imageInput.click());

    imageInput.addEventListener("change", async () => {
        const file = imageInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            appendMessage("user", "📷", reader.result);

            const response = await fetch("/uploadImage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: reader.result.split(",")[1] })
            });

            const data = await response.json();
            appendMessage("bot", "Image reçue ! Posez votre question.", data.imageUrl);
        };
        reader.readAsDataURL(file);
    });
});
