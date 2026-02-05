class BharatChatWidget {
    constructor() {
        this.isOpen = false;
        this.activePersona = 'general';
        this.schemes = [];
        this.init();
    }

    async init() {
        this.injectStyles();
        this.createDOM();
        this.setupEventListeners();
        await this.loadKnowledge();
    }

    async loadKnowledge() {
        try {
            const response = await fetch('schemes.json');
            this.schemes = await response.json();
        } catch (e) {
            console.error("Chatbot failed to load schemes:", e);
        }
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Chat Widget Styles */
            .chat-widget-btn {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, var(--primary-blue), #1a5c8a);
                border-radius: 50%;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 9999;
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                border: 2px solid rgba(255,255,255,0.2);
            }

            .chat-widget-btn:hover {
                transform: scale(1.1);
            }

            .chat-icon {
                font-size: 1.8rem;
                color: white;
            }

            .chat-window {
                position: fixed;
                bottom: 7rem;
                right: 2rem;
                width: 380px;
                height: 550px;
                background: var(--bg-card);
                backdrop-filter: blur(20px);
                border: 1px solid var(--glass-border);
                border-radius: 20px;
                box-shadow: 0 20px 60px var(--shadow);
                display: flex;
                flex-direction: column;
                z-index: 9998;
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                pointer-events: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            }

            .chat-window.open {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: all;
            }

            /* Header & Tabs */
            .chat-header {
                background: linear-gradient(to right, var(--primary-blue), #1a5c8a);
                padding: 1.5rem;
                color: white;
                position: relative;
            }

            .chat-title {
                font-weight: 700;
                font-size: 1.1rem;
                margin-bottom: 0.25rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .chat-subtitle {
                font-size: 0.8rem;
                opacity: 0.8;
            }

            .close-chat {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: transparent;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .close-chat:hover {
                opacity: 1;
            }

            .persona-tabs {
                display: flex;
                background: rgba(0,0,0,0.1);
                padding: 0.25rem;
                gap: 0.25rem;
            }

            .persona-tab {
                flex: 1;
                padding: 0.5rem;
                border: none;
                background: transparent;
                color: rgba(255,255,255,0.7);
                font-size: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .persona-tab.active {
                background: white;
                color: var(--primary-blue);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            /* Messages Area */
            .chat-messages {
                flex: 1;
                padding: 1rem;
                overflow-y: auto;
                background: rgba(255,255,255,0.05);
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .message {
                max-width: 80%;
                padding: 0.75rem 1rem;
                border-radius: 12px;
                font-size: 0.9rem;
                line-height: 1.4;
                animation: slideIn 0.3s ease;
            }

            @keyframes slideIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .message.bot {
                background: var(--bg-secondary);
                color: var(--text-primary);
                align-self: flex-start;
                border-bottom-left-radius: 2px;
                border: 1px solid var(--glass-border);
            }

            .message.user {
                background: var(--secondary-green);
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 2px;
            }

            /* Input Area */
            .chat-input-area {
                padding: 1rem;
                background: var(--bg-card);
                border-top: 1px solid var(--glass-border);
                display: flex;
                gap: 0.5rem;
            }

            .chat-input {
                flex: 1;
                padding: 0.75rem;
                border-radius: 20px;
                border: 1px solid var(--glass-border);
                background: var(--bg-secondary);
                color: var(--text-primary);
                font-family: inherit;
                outline: none;
                transition: border-color 0.2s;
            }

            .chat-input:focus {
                border-color: var(--primary-blue);
            }

            .send-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: var(--primary-blue);
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s;
            }

            .send-btn:hover {
                transform: scale(1.05);
            }

            /* Dark Mode Adjustments */
            [data-theme="dark"] .chat-window {
                background: rgba(17, 34, 64, 0.95);
            }
            
            [data-theme="dark"] .chat-input {
                background: #0A192F;
                color: white;
            }

            /* Respnsive */
            @media (max-width: 480px) {
                .chat-window {
                    width: 90%;
                    right: 5%;
                    bottom: 6rem;
                    height: 60vh;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createDOM() {
        // Floating Button
        const btn = document.createElement('div');
        btn.className = 'chat-widget-btn magnifiable';
        btn.innerHTML = '<span class="chat-icon">💬</span>';
        btn.onclick = () => this.toggleChat();

        // Chat Window
        const window = document.createElement('div');
        window.className = 'chat-window';
        window.innerHTML = `
            <div class="chat-header">
                <button class="close-chat">×</button>
                <div class="chat-title">
                    <span>Bharat Seva Assistant</span>
                </div>
                <div class="chat-subtitle">AI-powered Citizen Support</div>
                <div class="persona-tabs">
                    <button class="persona-tab active" data-persona="general">General</button>
                    <button class="persona-tab" data-persona="scheme">Schemes</button>
                    <button class="persona-tab" data-persona="eligibility">Check</button>
                    <button class="persona-tab" data-persona="support">Help</button>
                </div>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="message bot">Namaste! 🙏 I am your Bharat Seva assistant. How can I help you today?</div>
            </div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" placeholder="Type your query..." id="chatInput">
                <button class="send-btn">➤</button>
            </div>
        `;

        document.body.appendChild(btn);
        document.body.appendChild(window);

        this.elements = {
            window: window,
            messages: window.querySelector('.chat-messages'),
            input: window.querySelector('.chat-input'),
            sendBtn: window.querySelector('.send-btn'),
            closeBtn: window.querySelector('.close-chat'),
            tabs: window.querySelectorAll('.persona-tab')
        };
    }

    setupEventListeners() {
        this.elements.closeBtn.onclick = () => this.toggleChat();
        this.elements.sendBtn.onclick = () => this.handleSend();
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });

        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchPersona(tab.dataset.persona);
            });
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.elements.window.classList.toggle('open', this.isOpen);
        if (this.isOpen) setTimeout(() => this.elements.input.focus(), 300);
    }

    switchPersona(persona) {
        this.activePersona = persona;
        
        // Update Tabs UI
        this.elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.persona === persona);
        });

        // Greeting based on persona
        let greeting = "";
        switch(persona) {
            case 'general': greeting = "Namaste! I can help you navigate the portal and find information."; break;
            case 'scheme': greeting = "I am the Scheme Expert. Ask me details about any government scheme."; break;
            case 'eligibility': greeting = "Let's check your eligibility. Tell me your age, income, or category."; break;
            case 'support': greeting = "Application Support here. Need help with forms or documents?"; break;
        }

        this.addMessage(greeting, 'bot');
    }

    handleSend() {
        const text = this.elements.input.value.trim();
        if (!text) return;

        this.addMessage(text, 'user');
        this.elements.input.value = '';

        // Simulate thinking delay
        this.showTyping();
        setTimeout(() => {
            const response = this.generateResponse(text);
            this.removeTyping();
            this.addMessage(response, 'bot');
        }, 800 + Math.random() * 500);
    }

    addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.textContent = text;
        this.elements.messages.appendChild(div);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    showTyping() {
        const div = document.createElement('div');
        div.className = 'message bot typing';
        div.textContent = '...';
        div.id = 'typingIndicator';
        this.elements.messages.appendChild(div);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    removeTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    generateResponse(input) {
        input = input.toLowerCase();
        
        // LOGIC PER PERSONA
        if (this.activePersona === 'general') {
            if (input.includes('hi') || input.includes('hello')) return "Namaste! How can I assist you today?";
            if (input.includes('scheme') || input.includes('benefit')) return "You can explore schemes in the 'Discover Benefits' section. Or ask the 'Schemes' bot tab!";
            if (input.includes('portal') || input.includes('app')) return "This is the Bharat Seva Portal, a one-stop solution for government benefits.";
            return "I can help with general queries. For specific schemes, try the 'Schemes' tab!";
        }

        if (this.activePersona === 'scheme') {
            // Search in loaded schemes
            const foundScheme = this.schemes.find(s => 
                s.title.toLowerCase().includes(input) || 
                s.id.includes(input) ||
                (s.benefits && s.benefits.some(b => b.toLowerCase().includes(input)))
            );

            if (foundScheme) {
                return `**${foundScheme.title}**: ${foundScheme.benefits[0]}. It is for ${foundScheme.criteria.category ? foundScheme.criteria.category.join(', ') : 'citizens'}.`;
            }
            if (input.includes('list') || input.includes('all')) return "We have schemes like PM-KISAN, PM-JAY, Mudra Yojana, Atal Pension, and more.";
            return "I couldn't find a specific scheme matching that. Try 'PM Kisan' or 'Pension'.";
        }

        if (this.activePersona === 'eligibility') {
            if (input.includes('income')) return "Income limits vary. Usually below ₹2 Lakh for farmer schemes and ₹5 Lakh for health schemes.";
            if (input.includes('student')) return "Students can apply for Post Matric Scholarships if family income is < ₹2.5 Lakh.";
            if (input.includes('senior') || input.includes('age')) return "Senior citizens (60+) are eligible for NSAP pension and special PMAY benefits.";
            return "Tell me your Age, Income, and Occupation, and I'll suggest what fits!";
        }

        if (this.activePersona === 'support') {
            if (input.includes('document')) return "Common documents: Aadhaar Card, Income Certificate, Caste Certificate (if applicable), and Bank Passbook.";
            if (input.includes('apply')) return "Click the 'Apply Now' button on any scheme card. You'll be redirected to the official government portal.";
            if (input.includes('error') || input.includes('fail')) return "Please check your internet connection or try clearing your browser cache.";
            return "I can guide you on documents and application steps. What do you need help with?";
        }

        return "I'm not sure about that. Try asking in a different way or switch tabs!";
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    new BharatChatWidget();
});
