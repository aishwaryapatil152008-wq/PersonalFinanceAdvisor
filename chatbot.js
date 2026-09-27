document.addEventListener('DOMContentLoaded', () => {
    setupChatbot();
});

function setupChatbot() {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatBody = document.getElementById('chatBody');
    const chipBtns = document.querySelectorAll('.chip-btn');

    if (!chatForm || !chatInput || !chatBody) return;

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = chatInput.value.trim();
        if (!question) return;

        appendMessage('user', question);
        chatInput.value = '';

        // Show typing indicator
        const typingId = appendTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });

            const result = await response.json();
            removeTypingIndicator(typingId);

            if (result.success) {
                appendMessage('bot', result.response);
            } else {
                appendMessage('bot', result.message || 'Sorry, I encountered an issue processing your question.');
            }
        } catch (err) {
            removeTypingIndicator(typingId);
            console.error('Chat error:', err);
            appendMessage('bot', 'Unable to connect to the AI advisor right now. Please check your network connection.');
        }
    });

    // Chip buttons click listener
    chipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.innerText;
            chatInput.value = text;
            chatForm.dispatchEvent(new Event('submit'));
        });
    });
}

function appendMessage(sender, text) {
    const chatBody = document.getElementById('chatBody');
    if (!chatBody) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;

    const icon = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    const formattedText = parseMarkdown(text);

    messageDiv.innerHTML = `
        <div class="avatar">${icon}</div>
        <div class="message-bubble">${formattedText}</div>
    `;

    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function appendTypingIndicator() {
    const chatBody = document.getElementById('chatBody');
    const id = 'typing-' + Date.now();

    const div = document.createElement('div');
    div.className = 'chat-message bot';
    div.id = id;
    div.innerHTML = `
        <div class="avatar"><i class="fas fa-robot"></i></div>
        <div class="message-bubble">
            <div class="typing-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    `;

    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function parseMarkdown(text) {
    if (!text) return '';
    let parsed = text
        .replace(/^### (.*$)/gim, '<h4 style="margin: 0.5rem 0; font-weight:700;">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
    return parsed;
}
