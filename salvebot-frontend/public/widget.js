(function() {
  'use strict';

  // Prevent multiple widget initializations
  if (window.SalvebotWidget) {
    return;
  }

  // Extract configuration from script tag
  const currentScript = document.currentScript || 
    Array.from(document.querySelectorAll('script')).find(s => 
      s.src && s.src.includes('widget.js')
    );

  if (!currentScript) {
    console.error('Salvebot Widget: Could not find widget script tag');
    return;
  }

  const chatbotId = currentScript.getAttribute('data-chatbot-id');
  const domain = currentScript.getAttribute('data-domain');
  const theme = currentScript.getAttribute('data-theme') || 'light';
  const position = currentScript.getAttribute('data-position') || 'bottom-right';
  const welcomeMessage = currentScript.getAttribute('data-welcome-message') || 'Hello! How can I help you today?';

  if (!chatbotId || !domain) {
    console.error('Salvebot Widget: Missing required attributes data-chatbot-id or data-domain');
    return;
  }

  // Widget state
  let isOpen = false;
  let isLoaded = false;
  let widgetContainer = null;
  let chatWindow = null;
  let messagesContainer = null;
  let inputElement = null;
  let sessionId = null;

  // Create widget styles
  const styles = `
    .salvebot-widget {
      position: fixed;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    }
    .salvebot-widget * {
      box-sizing: border-box;
    }
    .salvebot-widget-button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #2563eb;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
    }
    .salvebot-widget-button:hover {
      transform: scale(1.05);
      background: #1d4ed8;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    .salvebot-widget-button svg {
      width: 24px;
      height: 24px;
      fill: white;
    }
    .salvebot-chat-window {
      position: absolute;
      width: 384px;
      height: 500px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      display: none;
    }
    .salvebot-chat-window.open {
      display: flex;
      flex-direction: column;
    }
    .salvebot-chat-header {
      padding: 16px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .salvebot-chat-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .salvebot-chat-avatar {
      width: 32px;
      height: 32px;
      background: #2563eb;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .salvebot-chat-avatar svg {
      width: 16px;
      height: 16px;
      fill: white;
    }
    .salvebot-chat-title {
      font-weight: 600;
      font-size: 14px;
      color: #111827;
      margin: 0 0 2px 0;
    }
    .salvebot-chat-status {
      font-size: 12px;
      color: #6b7280;
      margin: 0;
    }
    .salvebot-close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      color: #6b7280;
      transition: all 0.2s ease;
    }
    .salvebot-close-button:hover {
      background: #e5e7eb;
      color: #374151;
    }
    .salvebot-close-button svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    .salvebot-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .salvebot-message {
      display: flex;
      gap: 8px;
    }
    .salvebot-message.user {
      flex-direction: row-reverse;
    }
    .salvebot-message-content {
      max-width: 280px;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.4;
    }
    .salvebot-message.assistant .salvebot-message-content {
      background: #f3f4f6;
      color: #374151;
    }
    .salvebot-message.user .salvebot-message-content {
      background: #2563eb;
      color: white;
    }
    .salvebot-input-container {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }
    .salvebot-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 24px;
      outline: none;
      font-size: 14px;
      resize: none;
      min-height: 20px;
      max-height: 100px;
    }
    .salvebot-input:focus {
      border-color: #2563eb;
    }
    .salvebot-send-button {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #2563eb;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    }
    .salvebot-send-button:hover {
      background: #1d4ed8;
    }
    .salvebot-send-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .salvebot-send-button svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    .salvebot-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #6b7280;
      font-style: italic;
    }
    .salvebot-typing-dots {
      display: flex;
      gap: 2px;
    }
    .salvebot-typing-dot {
      width: 4px;
      height: 4px;
      background: #6b7280;
      border-radius: 50%;
      animation: salvebot-bounce 1.4s infinite ease-in-out both;
    }
    .salvebot-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .salvebot-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes salvebot-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `;

  // Position classes
  const getPositionClasses = (pos) => {
    switch (pos) {
      case 'bottom-left': return 'bottom: 20px; left: 20px;';
      case 'top-right': return 'top: 20px; right: 20px;';
      case 'top-left': return 'top: 20px; left: 20px;';
      default: return 'bottom: 20px; right: 20px;';
    }
  };

  const getChatWindowPosition = (pos) => {
    switch (pos) {
      case 'bottom-left': return 'bottom: 72px; left: 0;';
      case 'top-right': return 'top: 72px; right: 0;';
      case 'top-left': return 'top: 72px; left: 0;';
      default: return 'bottom: 72px; right: 0;';
    }
  };

  // Icons
  const chatIcon = `<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97z" clip-rule="evenodd" /></svg>`;
  const closeIcon = `<svg viewBox="0 0 24 24"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
  const sendIcon = `<svg viewBox="0 0 24 24"><path d="M3 3l18 9-18 9v-7l13-2L3 10V3z"/></svg>`;

  // Send message to backend
  async function sendMessage(message) {
    try {
      const response = await fetch('https://salvebot-api.fideleamazing.workers.dev/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId: chatbotId,
          message: message,
          domain: domain,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.sessionId) {
        sessionId = data.sessionId;
      }

      return data.response || 'I apologize, but I encountered an issue processing your message. Please try again.';
    } catch (error) {
      console.error('Salvebot Widget: Error sending message:', error);
      return 'I\'m having trouble connecting to the server right now. Please try again later.';
    }
  }

  // Add message to chat
  function addMessage(content, role = 'assistant') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `salvebot-message ${role}`;
    
    messageDiv.innerHTML = `
      <div class="salvebot-message-content">
        ${content.replace(/\n/g, '<br>')}
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show typing indicator
  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'salvebot-message assistant salvebot-typing-indicator';
    typingDiv.innerHTML = `
      <div class="salvebot-message-content salvebot-typing">
        <span>AI is typing</span>
        <div class="salvebot-typing-dots">
          <div class="salvebot-typing-dot"></div>
          <div class="salvebot-typing-dot"></div>
          <div class="salvebot-typing-dot"></div>
        </div>
      </div>
    `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Hide typing indicator
  function hideTyping() {
    const typingIndicator = messagesContainer.querySelector('.salvebot-typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Handle message send
  async function handleSendMessage() {
    const message = inputElement.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    inputElement.value = '';
    inputElement.style.height = 'auto';

    // Show typing indicator
    showTyping();

    // Send to backend
    const response = await sendMessage(message);
    
    // Hide typing and add response
    hideTyping();
    addMessage(response, 'assistant');
  }

  // Create widget HTML
  function createWidget() {
    // Add styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Create widget container
    widgetContainer = document.createElement('div');
    widgetContainer.className = 'salvebot-widget';
    widgetContainer.id = 'salvebot-widget';
    widgetContainer.style.cssText = getPositionClasses(position);

    // Widget button
    const button = document.createElement('button');
    button.className = 'salvebot-widget-button';
    button.innerHTML = chatIcon;
    button.onclick = toggleChat;

    // Chat window
    chatWindow = document.createElement('div');
    chatWindow.className = 'salvebot-chat-window';
    chatWindow.style.cssText = getChatWindowPosition(position);

    // Chat header
    const header = document.createElement('div');
    header.className = 'salvebot-chat-header';
    header.innerHTML = `
      <div class="salvebot-chat-header-info">
        <div class="salvebot-chat-avatar">${chatIcon}</div>
        <div>
          <p class="salvebot-chat-title">AI Assistant</p>
          <p class="salvebot-chat-status">Online</p>
        </div>
      </div>
      <button class="salvebot-close-button" onclick="window.SalvebotWidget.close()">${closeIcon}</button>
    `;

    // Messages container
    messagesContainer = document.createElement('div');
    messagesContainer.className = 'salvebot-messages';

    // Input container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'salvebot-input-container';

    inputElement = document.createElement('textarea');
    inputElement.className = 'salvebot-input';
    inputElement.placeholder = 'Type your message...';
    inputElement.rows = 1;

    const sendButton = document.createElement('button');
    sendButton.className = 'salvebot-send-button';
    sendButton.innerHTML = sendIcon;
    sendButton.onclick = handleSendMessage;

    // Auto-resize textarea
    inputElement.oninput = function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    };

    // Enter to send
    inputElement.onkeydown = function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    // Assemble widget
    inputContainer.appendChild(inputElement);
    inputContainer.appendChild(sendButton);
    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(inputContainer);
    widgetContainer.appendChild(chatWindow);
    widgetContainer.appendChild(button);

    document.body.appendChild(widgetContainer);

    // Add welcome message
    if (welcomeMessage) {
      addMessage(welcomeMessage, 'assistant');
    }

    isLoaded = true;
  }

  // Toggle chat window
  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.classList.toggle('open', isOpen);
    
    if (isOpen) {
      inputElement.focus();
    }
  }

  // Public API
  window.SalvebotWidget = {
    open: () => {
      if (!isOpen) toggleChat();
    },
    close: () => {
      if (isOpen) toggleChat();
    },
    isOpen: () => isOpen,
    isLoaded: () => isLoaded,
    destroy: () => {
      if (widgetContainer) {
        widgetContainer.remove();
        widgetContainer = null;
        isLoaded = false;
        isOpen = false;
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

})();