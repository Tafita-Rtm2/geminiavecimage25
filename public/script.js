document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("image-upload").addEventListener("change", uploadImage);

async function sendMessage() {
  let input = document.getElementById("user-input").value;
  if (!input) return;

  addMessage(input, "user");
  document.getElementById("user-input").value = "";

  let response = await fetch("/send-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: input }),
  });

  let data = await response.json();
  addMessage(data.reply, "bot");
}

async function uploadImage(event) {
  let formData = new FormData();
  formData.append("image", event.target.files[0]);

  let res = await fetch("/upload-image", { method: "POST", body: formData });
  let data = await res.json();

  let question = prompt("Posez une question sur l'image :");
  let response = await fetch("/send-image-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: question, imageUrl: data.imageUrl }),
  });

  let botResponse = await response.json();
  addMessage(botResponse.reply, "bot");
}

function addMessage(text, sender) {
  let messages = document.getElementById("messages");
  let msgDiv = document.createElement("div");
  msgDiv.classList.add(sender === "user" ? "user-message" : "bot-message");
  msgDiv.innerText = text;
  messages.appendChild(msgDiv);
}
