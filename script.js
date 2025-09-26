class MageSystem {
    constructor() {
        this.currentChars = 0;
        this.notesCreated = 0;
        this.charsWritten = 0;
        this.sessionStart = Date.now();
        this.isActive = false;
        this.achievements = new Set();
        
        this.initialize();
    }

    initialize() {
        this.cacheElements();
        this.loadFromStorage();
        this.setupEventListeners();
        this.updateDisplay();
        this.startSessionTimer();
        
        // ✅ REMOVIDO o modo demo automático
        this.setConnectionStatus('connected');
    }

    cacheElements() {
        this.elements = {
            // Character
            character: document.getElementById('character'),
            magicCircle: document.getElementById('magicCircle'),
            characterState: document.getElementById('characterState'),
            stateIcon: document.querySelector('.state-icon'),
            stateText: document.querySelector('.state-text'),
            
            // Stats
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            notesCreated: document.getElementById('notesCreated'),
            charsWritten: document.getElementById('charsWritten'),
            sessionTime: document.getElementById('sessionTime'),
            
            // Connection
            connectionStatus: document.getElementById('connectionStatus'),
            statusDot: document.querySelector('.status-dot'),
            
            // Debug
            debugLog: document.getElementById('debugLog')
        };
    }

    setupEventListeners() {
        // Comunicação com Obsidian
        window.addEventListener('message', this.handleObsidianMessage.bind(this));
        
        // ✅ REMOVIDO o listener de teclado que simulava digitação
    }

    handleObsidianMessage(event) {
        this.log('Mensagem recebida do Obsidian:', event.data);
        
        switch (event.data.type) {
            case 'characterCount':
                this.updateCharacterCount(event.data.count, event.data.noteTitle);
                break;
            case 'newNote':
                this.onNewNoteCreated(event.data.noteTitle);
                break;
            case 'sessionUpdate':
                this.updateSessionStats(event.data);
                break;
        }
    }

    // ✅ REMOVIDA a função handleKeydown que simulava digitação

    updateCharacterCount(count, noteTitle = 'Nota atual') {
        const previousChars = this.currentChars;
        this.currentChars = count;
        
        // Só incrementa charsWritten se for um aumento real
        if (count > previousChars) {
            this.charsWritten += (count - previousChars);
        }
        
        this.saveToStorage();
        this.updateDisplay();
        this.checkAchievements();

        if (count >= 200 && !this.isActive) {
            this.activateCharacter();
        } else if (count < 200 && this.isActive) {
            this.deactivateCharacter();
        }

        this.log(`Nota "${noteTitle}": ${count} caracteres`);
    }

    onNewNoteCreated(noteTitle = 'Nova nota') {
        this.notesCreated++;
        this.triggerNewNoteEffect();
        this.saveToStorage();
        this.updateDisplay();
        this.checkAchievements();
        
        this.log(`Nova nota criada: "${noteTitle}"`);
    }

    activateCharacter() {
        this.isActive = true;
        this.elements.character.classList.remove('character-idle');
        this.elements.character.classList.add('character-active');
        this.elements.magicCircle.classList.add('active');
        
        this.elements.stateIcon.textContent = '⚡';
        this.elements.stateText.textContent = 'Energizado! Continue escrevendo!';
        
        this.unlockAchievement('first200');
        this.log('Personagem ativado!');
    }

    deactivateCharacter() {
        this.isActive = false;
        this.elements.character.classList.remove('character-active');
        this.elements.character.classList.add('character-idle');
        this.elements.magicCircle.classList.remove('active');
        
        this.elements.stateIcon.textContent = '💤';
        this.elements.stateText.textContent = 'Aguardando atividade...';
        
        this.log('Personagem em modo idle');
    }

    triggerNewNoteEffect() {
        // Efeito visual quando nova nota é criada
        this.elements.character.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.elements.character.style.transform = 'scale(1)';
        }, 300);
    }

    updateDisplay() {
        // Progresso
        const percentage = Math.min((this.currentChars / 200) * 100, 100);
        this.elements.progressFill.style.width = percentage + '%';
        this.elements.progressText.textContent = `${this.currentChars}/200 caracteres`;
        
        // Estatísticas
        this.elements.notesCreated.textContent = this.notesCreated;
        this.elements.charsWritten.textContent = this.charsWritten;
        
        // Atualizar conquistas
        this.updateAchievementsDisplay();
    }

    checkAchievements() {
        if (this.currentChars >= 200 && !this.achievements.has('first200')) {
            this.unlockAchievement('first200');
        }
        
        if (this.notesCreated >= 5 && !this.achievements.has('fiveNotes')) {
            this.unlockAchievement('fiveNotes');
        }
        
        if (this.charsWritten >= 1000 && !this.achievements.has('dailyWriter')) {
            this.unlockAchievement('dailyWriter');
        }
    }

    unlockAchievement(achievementId) {
        this.achievements.add(achievementId);
        const achievementElement = document.querySelector(`[data-id="${achievementId}"]`);
        
        if (achievementElement) {
            achievementElement.classList.add('unlocked');
            achievementElement.querySelector('.achievement-badge').textContent = '✅';
            achievementElement.querySelector('.achievement-badge').classList.add('unlocked');
            
            // Efeito especial para conquista
            achievementElement.style.animation = 'celebrate 0.6s ease';
            setTimeout(() => {
                achievementElement.style.animation = '';
            }, 600);
            
            this.log(`Conquista desbloqueada: ${achievementId}`);
        }
    }

    updateAchievementsDisplay() {
        document.querySelectorAll('.achievement').forEach(achievement => {
            const achievementId = achievement.dataset.id;
            if (this.achievements.has(achievementId)) {
                achievement.classList.add('unlocked');
                achievement.querySelector('.achievement-badge').textContent = '✅';
            }
        });
    }

    startSessionTimer() {
        setInterval(() => {
            const minutes = Math.floor((Date.now() - this.sessionStart) / 60000);
            this.elements.sessionTime.textContent = `${minutes}min`;
        }, 60000);
    }

    updateSessionStats(data) {
        if (data.totalChars) this.charsWritten = data.totalChars;
        if (data.totalNotes) this.notesCreated = data.totalNotes;
        this.updateDisplay();
    }

    setConnectionStatus(status) {
        const statusText = {
            'connected': 'Conectado ao Obsidian',
            'disconnected': 'Desconectado',
            'waiting': 'Aguardando atividade...'
        };
        
        this.elements.connectionStatus.textContent = statusText[status];
        this.elements.statusDot.className = `status-dot ${status}`;
    }

    log(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
        
        if (this.elements.debugLog) {
            this.elements.debugLog.innerHTML += logEntry + '\n';
            this.elements.debugLog.scrollTop = this.elements.debugLog.scrollHeight;
        }
        
        console.log(logEntry);
    }

    saveToStorage() {
        const data = {
            chars: this.currentChars,
            notes: this.notesCreated,
            totalChars: this.charsWritten,
            achievements: Array.from(this.achievements),
            sessionStart: this.sessionStart
        };
        localStorage.setItem('mageSystem', JSON.stringify(data));
    }

    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('mageSystem') || '{}');
            this.currentChars = data.chars || 0;
            this.notesCreated = data.notes || 0;
            this.charsWritten = data.totalChars || 0;
            this.achievements = new Set(data.achievements || []);
            this.sessionStart = data.sessionStart || Date.now();
        } catch (error) {
            this.log('Erro ao carregar dados:', error);
        }
    }

    // ✅ REMOVIDO completamente o startDemoMode()
}

// Funções globais para debug (OPCIONAIS - só para teste manual)
function simulateTyping(chars) {
    if (window.mageSystem) {
        window.mageSystem.updateCharacterCount(
            window.mageSystem.currentChars + chars, 
            'Nota Teste'
        );
    }
}

function simulateNewNote() {
    if (window.mageSystem) {
        window.mageSystem.onNewNoteCreated('Nota Teste');
    }
}

function resetStats() {
    if (window.mageSystem) {
        localStorage.removeItem('mageSystem');
        window.mageSystem.achievements.clear();
        window.location.reload();
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    window.mageSystem = new MageSystem();
});
