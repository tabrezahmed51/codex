// Telegram Bot Emulation App - Frontend JavaScript

class TelegramBotEmulatorApp {
    constructor() {
        this.socket = null;
        this.currentSession = null;
        this.messageIdCounter = 1;
        
        this.initializeSocket();
        this.bindEvents();
        this.loadSessions();
        this.checkServerStatus();
    }

    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateServerStatus('Connected', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateServerStatus('Disconnected', 'error');
        });

        this.socket.on('session-joined', (data) => {
            console.log('Joined session:', data);
        });

        this.socket.on('message', (message) => {
            console.log('Received message:', message);
            if (message.type === 'update') {
                this.displayMessage(message.payload);
            }
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.showNotification('Socket error: ' + error.message, 'error');
        });
    }

    bindEvents() {
        // Bot creation form
        document.getElementById('bot-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createBot();
        });

        // Chat interface
        document.getElementById('send-message').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('message-text').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        document.getElementById('clear-chat').addEventListener('click', () => {
            this.clearChat();
        });

        document.getElementById('close-chat').addEventListener('click', () => {
            this.closeChatInterface();
        });
    }

    async createBot() {
        const token = document.getElementById('bot-token').value.trim();
        const username = document.getElementById('bot-username').value.trim();
        const webhookUrl = document.getElementById('webhook-url').value.trim();

        if (!token || !username) {
            this.showNotification('Please fill in required fields', 'warning');
            return;
        }

        // Validate token format
        const tokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
        if (!tokenRegex.test(token)) {
            this.showNotification('Invalid bot token format', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/bots', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    username,
                    webhook_url: webhookUrl || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Bot session created successfully!', 'success');
                document.getElementById('bot-form').reset();
                this.loadSessions();
            } else {
                this.showNotification(data.error || 'Failed to create bot', 'error');
            }
        } catch (error) {
            console.error('Error creating bot:', error);
            this.showNotification('Network error: Failed to create bot', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadSessions() {
        try {
            const response = await fetch('/api/bots');
            const data = await response.json();

            if (response.ok) {
                this.displaySessions(data.bots);
                document.getElementById('total-sessions').textContent = data.bots.length;
            } else {
                console.error('Failed to load sessions:', data.error);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    displaySessions(sessions) {
        const container = document.getElementById('sessions-list');
        
        if (sessions.length === 0) {
            container.innerHTML = '<p class="no-sessions">No active sessions. Create a bot to get started.</p>';
            return;
        }

        container.innerHTML = sessions.map(session => `
            <div class="session-card" data-session-id="${session.sessionId}">
                <div class="session-header">
                    <div class="session-title">@${session.username}</div>
                    <div class="session-actions">
                        <button class="btn-chat" onclick="app.openChatInterface('${session.sessionId}', '${session.username}')">
                            Chat
                        </button>
                        <button class="btn-delete" onclick="app.deleteSession('${session.sessionId}')">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="session-stats">
                    <div>Messages: ${session.stats.messagesCount}</div>
                    <div>Users: ${session.stats.usersCount}</div>
                    <div>Chats: ${session.stats.chatsCount}</div>
                </div>
                <div class="session-meta">
                    Created: ${new Date(session.createdAt).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    async deleteSession(sessionId) {
        if (!confirm('Are you sure you want to delete this bot session?')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`/api/bots/${sessionId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                this.showNotification('Bot session deleted successfully!', 'success');
                this.loadSessions();
                
                // Close chat if it's the current session
                if (this.currentSession === sessionId) {
                    this.closeChatInterface();
                }
            } else {
                const data = await response.json();
                this.showNotification(data.error || 'Failed to delete session', 'error');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            this.showNotification('Network error: Failed to delete session', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    openChatInterface(sessionId, botUsername) {
        this.currentSession = sessionId;
        document.getElementById('current-bot-name').textContent = `@${botUsername}`;
        document.getElementById('chat-interface').style.display = 'block';
        
        // Join socket room
        this.socket.emit('join-session', sessionId);
        
        // Load chat history
        this.loadChatHistory();
        
        // Scroll to chat interface
        document.getElementById('chat-interface').scrollIntoView({ behavior: 'smooth' });
    }

    closeChatInterface() {
        if (this.currentSession) {
            this.socket.emit('leave-session', this.currentSession);
            this.currentSession = null;
        }
        
        document.getElementById('chat-interface').style.display = 'none';
        this.clearChat();
    }

    async loadChatHistory() {
        if (!this.currentSession) return;

        try {
            const response = await fetch(`/api/bots/${this.currentSession}/messages?limit=50`);
            const data = await response.json();

            if (response.ok) {
                const messagesContainer = document.getElementById('chat-messages');
                messagesContainer.innerHTML = '';
                
                data.messages.forEach(message => {
                    this.displayMessage(message);
                });
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    async sendMessage() {
        const messageText = document.getElementById('message-text').value.trim();
        const firstName = document.getElementById('user-first-name').value.trim() || 'Test User';
        const username = document.getElementById('user-username').value.trim() || 'testuser';

        if (!messageText || !this.currentSession) return;

        const message = {
            message_id: this.messageIdCounter++,
            from: {
                id: 12345, // Fixed user ID for testing
                is_bot: false,
                first_name: firstName,
                username: username,
            },
            date: Math.floor(Date.now() / 1000),
            chat: {
                id: 12345,
                type: 'private',
                first_name: firstName,
                username: username,
            },
            text: messageText,
        };

        // Display user message immediately
        this.displayMessage(message);

        // Clear input
        document.getElementById('message-text').value = '';

        try {
            const response = await fetch(`/api/bots/${this.currentSession}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const data = await response.json();

            if (response.ok && data.result) {
                // Display bot response
                setTimeout(() => {
                    this.displayMessage(data.result);
                }, 500); // Small delay to simulate real bot response
            } else {
                this.showNotification('Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Network error: Failed to send message', 'error');
        }
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        
        const isBot = message.from?.is_bot || false;
        const messageClass = isBot ? 'message-bot' : 'message-user';
        
        messageDiv.className = `message ${messageClass}`;
        messageDiv.innerHTML = `
            <div class="message-text">${this.escapeHtml(message.text || '')}</div>
            <div class="message-meta">
                ${message.from?.first_name || 'Unknown'} • 
                ${new Date(message.date * 1000).toLocaleTimeString()}
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    clearChat() {
        document.getElementById('chat-messages').innerHTML = '';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        const container = document.getElementById('notifications');
        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    updateServerStatus(status, type) {
        const statusElement = document.getElementById('server-status');
        statusElement.textContent = status;
        statusElement.className = `stat-value ${type}`;
    }

    async checkServerStatus() {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                this.updateServerStatus('Connected', 'success');
            } else {
                this.updateServerStatus('Error', 'error');
            }
        } catch (error) {
            this.updateServerStatus('Offline', 'error');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TelegramBotEmulatorApp();
});

// Auto-refresh sessions every 30 seconds
setInterval(() => {
    if (window.app) {
        window.app.loadSessions();
    }
}, 30000);
