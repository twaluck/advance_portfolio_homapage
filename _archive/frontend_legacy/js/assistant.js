const API_BASE = "";
const CHAT_ENDPOINT = `${API_BASE}/api/chat`;

const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const micButton = document.getElementById("mic-button");

let recognition;
let isListening = false;

function addMessage(text, role) {
    const div = document.createElement("div");
    div.className = `message ${role}`;
    div.textContent = text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP"; // Default to Japanese
    window.speechSynthesis.speak(utterance);
}

async function sendMessage(text) {
    if (!text.trim()) return;

    addMessage(text, "user");
    chatInput.value = "";

    try {
        const response = await fetch(CHAT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
        });

        if (!response.ok) {
            throw new Error("API Error");
        }

        const data = await response.json();
        addMessage(data.response, "assistant");
        speak(data.response);

        if (data.action === "open_url" && data.url) {
            setTimeout(() => {
                window.open(data.url, "_blank");
            }, 1000);
        }

    } catch (error) {
        console.error(error);
        addMessage("エラーが発生しました。", "assistant");
    }
}

// Initialize Web Speech API
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isListening = true;
        micButton.classList.add("listening");
    };

    recognition.onend = () => {
        isListening = false;
        micButton.classList.remove("listening");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        sendMessage(transcript);
    };

    micButton.addEventListener("click", () => {
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });
} else {
    micButton.style.display = "none";
    console.log("Web Speech API not supported");
}

chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(chatInput.value);
});
