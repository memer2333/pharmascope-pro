/**
 * PharmaScope Pro — Gemini AI Chatbot Widget
 * Provides interactive medical assistance with context from the active app state.
 */

class Chatbot {
  constructor() {
    this.apiKey = localStorage.getItem('gemini_api_key') || 'AIzaSyDHhuB6U8YIYcDoKL5Nz1va_aOqEAmBH0g';
    this.isOpen = false;
    this.isProcessing = false;
    this.messages = [];
    
    // Auto-save the provided API key if not set
    if (!localStorage.getItem('gemini_api_key')) {
      localStorage.setItem('gemini_api_key', this.apiKey);
    }
  }

  init() {
    this.renderWidget();
    this.bindEvents();
    // Initial greeting
    setTimeout(() => {
      this.addMessage('Hi! I\'m your PharmaScope Clinical Assistant. I can help answer questions about drugs, interactions, or the specific profile you are viewing. How can I help?', 'ai');
    }, 500);
  }

  renderWidget() {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'gemini-chatbot-container';
    
    chatContainer.innerHTML = `
      <div id="chat-widget-window" class="chat-window closed">
        <div class="chat-header">
          <div style="display:flex; align-items:center; gap: 0.6rem;">
            <div class="chat-avatar">✨</div>
            <div>
              <div class="chat-title">AI Clinical Assistant</div>
              <div class="chat-subtitle">Powered by Gemini 1.5</div>
            </div>
          </div>
          <button id="chat-close-btn" class="chat-icon-btn" aria-label="Close Chat">×</button>
        </div>
        
        <div id="chat-messages" class="chat-messages">
          <!-- Messages will be injected here -->
        </div>
        
        <div class="chat-input-area">
          <textarea id="chat-input-textarea" placeholder="Ask a clinical question..." rows="1" aria-label="Chat input"></textarea>
          <button id="chat-send-btn" class="chat-send-btn" aria-label="Send Message">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
      
      <button id="chat-fab-btn" class="chat-fab-btn" aria-label="Open AI Assistant">
        <span class="fab-icon">✨</span>
      </button>
    `;

    document.body.appendChild(chatContainer);
    
    this.elements = {
      window: document.getElementById('chat-widget-window'),
      fab: document.getElementById('chat-fab-btn'),
      closeBtn: document.getElementById('chat-close-btn'),
      messagesContainer: document.getElementById('chat-messages'),
      textarea: document.getElementById('chat-input-textarea'),
      sendBtn: document.getElementById('chat-send-btn')
    };
  }

  bindEvents() {
    this.elements.fab.addEventListener('click', () => this.toggleChat());
    this.elements.closeBtn.addEventListener('click', () => this.toggleChat());
    
    this.elements.sendBtn.addEventListener('click', () => this.handleSend());
    
    // Handle Enter key (Shift+Enter for new line)
    this.elements.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Auto-resize textarea
    this.elements.textarea.addEventListener('input', () => {
      this.elements.textarea.style.height = 'auto';
      this.elements.textarea.style.height = Math.min(this.elements.textarea.scrollHeight, 120) + 'px';
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.elements.window.classList.remove('closed');
      this.elements.fab.style.transform = 'scale(0) rotate(90deg)';
      setTimeout(() => this.elements.textarea.focus(), 300);
    } else {
      this.elements.window.classList.add('closed');
      this.elements.fab.style.transform = 'scale(1) rotate(0)';
    }
  }

  addMessage(content, role) {
    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg-wrapper ${role}`;
    
    const formattedContent = this.formatMessageData(content);
    
    wrapper.innerHTML = `
      <div class="chat-bubble ${role}">
        ${formattedContent}
      </div>
    `;
    
    this.elements.messagesContainer.appendChild(wrapper);
    this.scrollToBottom();
  }
  
  formatMessageData(text) {
    // Basic markdown conversion for bolding and line breaks
    if (!text) return '';
    let html = escapeHtml(text)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br/>');
    return html;
  }

  addTypingIndicator() {
    const id = 'typing-' + Date.now();
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = `chat-msg-wrapper ai`;
    wrapper.innerHTML = `
      <div class="chat-bubble ai typing">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    
    this.elements.messagesContainer.appendChild(wrapper);
    this.scrollToBottom();
    return id;
  }

  removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  scrollToBottom() {
    const c = this.elements.messagesContainer;
    c.scrollTop = c.scrollHeight;
  }

  async handleSend() {
    if (this.isProcessing) return;
    
    const text = this.elements.textarea.value.trim();
    if (!text) return;

    this.elements.textarea.value = '';
    this.elements.textarea.style.height = 'auto';
    this.addMessage(text, 'user');
    
    this.isProcessing = true;
    const typingId = this.addTypingIndicator();

    try {
      const response = await this.callGeminiAPI(text);
      this.removeTypingIndicator(typingId);
      this.addMessage(response, 'ai');
    } catch (error) {
      console.error(error);
      this.removeTypingIndicator(typingId);
      this.addMessage('Sorry, I encountered an error connecting to the API. Check your network or API key.', 'ai');
    } finally {
      this.isProcessing = false;
    }
  }

  getContext() {
    // Read the AppState directly if it's available globally.
    if (typeof AppState === 'undefined') return 'No active context.';
    
    let ctx = `You are an expert clinical pharmacist assistant named PharmaScope Assistant.\nYou are embedded inside a clinical application.\n\nCurrently, the user is looking at:\nCurrent View: ${AppState.currentView}\n`;

    if (AppState.currentView === 'profile' && AppState.currentFDALabel) {
        const drug = AppState.currentFDALabel; // Now DrugBank JSON object
        const genName = (drug.brandNames && drug.brandNames.length > 0) ? drug.brandNames[0] : drug.name;
        const brandName = drug.name || 'Unknown';
        ctx += `Selected Drug: ${brandName} (${genName}).\n`;
    } else if (AppState.searchQuery) {
        ctx += `Search Query: ${AppState.searchQuery}\n`;
    }

    ctx += `\nPlease be concise, professional, and base your answers on standard medical guidelines. Provide warnings for serious interactions or black box warnings.`;
    return ctx;
  }

  async callGeminiAPI(userMessage) {
    // Record message in history
    this.messages.push({ role: 'user', parts: [{ text: userMessage }] });

    const key = localStorage.getItem('gemini_api_key');
    if (!key) throw new Error("No API key available");

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`;

    const systemInstruction = this.getContext();

    // Prepare contents: Gemini API expects an array of messages
    const contents = this.messages.map(m => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: m.parts
    }));

    const bodyData = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.1,
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error("API responded with " + response.status + ": " + errorText);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (replyText) {
      this.messages.push({ role: 'ai', parts: [{ text: replyText }] });
      return replyText;
    } else {
      throw new Error("Invalid response format");
    }
  }
}

// Initialize Chatbot when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.AppChatbot = new Chatbot();
    window.AppChatbot.init();
});
