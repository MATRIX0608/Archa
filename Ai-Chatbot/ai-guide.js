(() => {

  const messages = document.getElementById("messages");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const langSelect = document.getElementById("langSelect");
  const langChip = document.getElementById("langChip");
  const suggestList = document.getElementById("suggestList");
  const quickChips = document.getElementById("quickChips");
  const micBtn = document.getElementById("micBtn");

  const API_BASE =
    window.CHAT_API_BASE || "http://localhost:3000";


  // -----------------------------
  // Add message to chat
  // -----------------------------

  function addMessage(text, type) {

    const message = document.createElement("div");

    message.className = `msg ${type}`;

    const p = document.createElement("p");

    p.style.margin = "0";
    p.textContent = text;

    message.appendChild(p);

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;
  }


  // -----------------------------
  // Send message
  // -----------------------------

  async function sendMessage() {

    const question = input.value.trim();

    if (!question) return;


    const language = langSelect.value;


    // Show user message
    addMessage(question, "user");

    input.value = "";

    sendBtn.disabled = true;

    addMessage("Thinking...", "bot");


    try {

      const response = await fetch(
        `${API_BASE}/api/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            question: question,
            language: language
          })
        }
      );


      const data = await response.json();


      // Remove "Thinking..."
      const botMessages =
        messages.querySelectorAll(".msg.bot");

      const thinking =
        botMessages[botMessages.length - 1];

      if (
        thinking &&
        thinking.textContent === "Thinking..."
      ) {
        thinking.remove();
      }


      if (!response.ok) {
        throw new Error(
          data.message || "AI response failed."
        );
      }


      addMessage(
        data.answer || "I couldn't generate a response.",
        "bot"
      );


    } catch (error) {

      console.error("Chat error:", error);


      const botMessages =
        messages.querySelectorAll(".msg.bot");

      const thinking =
        botMessages[botMessages.length - 1];

      if (
        thinking &&
        thinking.textContent === "Thinking..."
      ) {
        thinking.remove();
      }


      addMessage(
        "Sorry, I couldn't connect to the AI right now.",
        "bot"
      );

    } finally {

      sendBtn.disabled = false;

      input.focus();

    }
  }


  // -----------------------------
  // Send button
  // -----------------------------

  sendBtn.addEventListener(
    "click",
    sendMessage
  );


  // -----------------------------
  // Enter key
  // -----------------------------

  input.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        event.preventDefault();

        sendMessage();

      }

    }
  );


  // -----------------------------
  // Language
  // -----------------------------

  langSelect.addEventListener(
    "change",
    () => {

      langChip.textContent =
        "🌐 " + langSelect.value;

    }
  );


  // -----------------------------
  // Suggested questions
  // -----------------------------

  const suggestions = [
    "Tell me about Konark Sun Temple",
    "What is the story behind Diwali?",
    "Explain Kathakali dance form",
    "Who built the Taj Mahal?",
    "What is Meenakari jewellery?"
  ];


  suggestList.innerHTML =
    suggestions.map(question =>
      `<button class="suggest-item" type="button">${question}</button>`
    ).join("");


  document
    .querySelectorAll(".suggest-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          input.value =
            button.textContent;

          sendMessage();

        }
      );

    });


  // -----------------------------
  // Quick questions
  // -----------------------------

  const quickQuestions = [
    "Who built it?",
    "History",
    "Architecture details",
    "Interesting facts"
  ];


  quickChips.innerHTML =
    quickQuestions.map(question =>
      `<span class="chip">${question}</span>`
    ).join("");


  document
    .querySelectorAll(".quick-chips .chip")
    .forEach(chip => {

      chip.addEventListener(
        "click",
        () => {

          input.value =
            chip.textContent;

          sendMessage();

        }
      );

    });


  console.log("AI Guide loaded.");

})();

(() => {
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatMessages = document.getElementById("chatMessages");

  const API_BASE =
    window.CHAT_API_BASE || "http://localhost:3000";

  function addMessage(text, type) {
    const message = document.createElement("div");

    message.className = `chat-message ${type}`;
    message.textContent = text;

    chatMessages.appendChild(message);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage() {
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user");

    input.value = "";
    sendBtn.disabled = true;

    const loading = document.createElement("div");
    loading.className = "chat-message ai";
    loading.textContent = "Thinking...";
    chatMessages.appendChild(loading);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: message
        })
      });

      const data = await response.json();

      loading.remove();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not get AI response."
        );
      }

      addMessage(data.reply, "ai");

    } catch (error) {
      console.error("Chat error:", error);

      loading.textContent =
        error.message || "Could not connect to AI.";

    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener("click", sendMessage);

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });
})();