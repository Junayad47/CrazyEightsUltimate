// game-engine.js - Crazy Eights Game Engine with Enhanced Features

// Game State Management
const GameState = {
    deck: [],
    playerHand: [],
    opponentHand: [],
    discardPile: [],
    drawPile: [],
    currentTurn: 'player',
    selectedCards: [],
    stackCount: 0,
    gameMode: 'local',
    calledGame: false,
    soundEnabled: true,
    ws: null,
    gameActive: false,
    turnSkipped: false,
    currentSuit: null,
    playerName: 'Player',
    opponentName: 'Opponent',
    animationSpeed: 1000, // Slower animations
    messageQueue: [],
    processingAction: false
};

// Card Class
class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
        this.color = (suit === '♥' || suit === '♦') ? 'red' : 'black';
    }
    
    toString() {
        return `${this.rank}${this.suit}`;
    }
    
    isSpecial() {
        return this.rank === '8' || this.rank === 'J' || 
               (this.rank === 'Q' && this.suit === '♠') || 
               this.rank === '2';
    }
    
    getDescription() {
        if (this.rank === '8') return 'Wild Card - Choose any suit';
        if (this.rank === 'J') return 'Jack - Skip next player';
        if (this.rank === 'Q' && this.suit === '♠') return 'Queen of Spades - Next player draws 5';
        if (this.rank === '2') return 'Two - Next player draws 2';
        return '';
    }
}

// Main Game Engine
class CrazyEightsGame {
    constructor() {
        this.initDeck();
        this.initThreeJS();
        this.soundEffects = this.createSoundEffects();
        this.initEventListeners();
        this.createSuitSelector();
        this.createGameLog();
        this.initNameInput();
    }
    
    initNameInput() {
        // Get player name from localStorage or prompt
        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            GameState.playerName = savedName;
        } else {
            this.promptPlayerName();
        }
    }
    
    promptPlayerName() {
        setTimeout(() => {
            const name = prompt('Enter your name:', GameState.playerName);
            if (name && name.trim()) {
                GameState.playerName = name.trim();
                localStorage.setItem('playerName', GameState.playerName);
                this.addGameLog(`Welcome, ${GameState.playerName}!`, 'system');
            }
        }, 500);
    }
    
    createSuitSelector() {
        // Create suit selector modal
        const suitModal = document.createElement('div');
        suitModal.id = 'suitSelector';
        suitModal.className = 'suit-selector-modal';
        suitModal.innerHTML = `
            <div class="suit-selector-content">
                <h3>Choose a Suit</h3>
                <div class="suit-options">
                    <button class="suit-btn" data-suit="♠">
                        <span class="suit-icon black">♠</span>
                        <span>Spades</span>
                    </button>
                    <button class="suit-btn" data-suit="♥">
                        <span class="suit-icon red">♥</span>
                        <span>Hearts</span>
                    </button>
                    <button class="suit-btn" data-suit="♦">
                        <span class="suit-icon red">♦</span>
                        <span>Diamonds</span>
                    </button>
                    <button class="suit-btn" data-suit="♣">
                        <span class="suit-icon black">♣</span>
                        <span>Clubs</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(suitModal);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .suit-selector-modal {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #2a1810 0%, #1a0e08 100%);
                border: 3px solid #d4af37;
                border-radius: 15px;
                padding: 30px;
                z-index: 1000;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9);
            }
            
            .suit-selector-modal.active {
                display: block;
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -60%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
            }
            
            .suit-selector-content h3 {
                color: #d4af37;
                font-family: 'Bebas Neue', cursive;
                font-size: 32px;
                text-align: center;
                margin-bottom: 25px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            }
            
            .suit-options {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            
            .suit-btn {
                padding: 20px;
                background: linear-gradient(135deg, #8b4513 0%, #654321 100%);
                border: 2px solid #d4af37;
                border-radius: 10px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                transition: all 0.3s ease;
                color: #f0e6d2;
                font-weight: bold;
                font-size: 16px;
            }
            
            .suit-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
                background: linear-gradient(135deg, #a0522d 0%, #8b4513 100%);
            }
            
            .suit-icon {
                font-size: 48px;
            }
            
            .suit-icon.red {
                color: #ff4444;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            }
            
            .suit-icon.black {
                color: #333;
                text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.3);
            }
            
            .game-log {
                position: fixed;
                left: 20px;
                top: 50%;
                transform: translateY(-50%);
                width: 280px;
                max-height: 400px;
                background: linear-gradient(135deg, rgba(26, 14, 8, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%);
                border: 2px solid #d4af37;
                border-radius: 10px;
                padding: 15px;
                overflow-y: auto;
                z-index: 50;
            }
            
            .game-log-title {
                font-family: 'Bebas Neue', cursive;
                font-size: 20px;
                color: #d4af37;
                margin-bottom: 10px;
                text-align: center;
            }
            
            .game-log-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 320px;
                overflow-y: auto;
                padding-right: 5px;
            }
            
            .game-log-content::-webkit-scrollbar {
                width: 6px;
            }
            
            .game-log-content::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 3px;
            }
            
            .game-log-content::-webkit-scrollbar-thumb {
                background: #d4af37;
                border-radius: 3px;
            }
            
            .log-entry {
                padding: 8px 10px;
                background: rgba(0, 0, 0, 0.3);
                border-left: 3px solid #666;
                border-radius: 5px;
                font-size: 13px;
                color: #f0e6d2;
                animation: slideInLog 0.3s ease-out;
            }
            
            @keyframes slideInLog {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .log-entry.player {
                border-left-color: #4caf50;
                background: rgba(76, 175, 80, 0.1);
            }
            
            .log-entry.opponent {
                border-left-color: #f44336;
                background: rgba(244, 67, 54, 0.1);
            }
            
            .log-entry.special {
                border-left-color: #d4af37;
                background: rgba(212, 175, 55, 0.1);
                font-weight: bold;
            }
            
            .log-entry.system {
                border-left-color: #2196f3;
                background: rgba(33, 150, 243, 0.1);
                font-style: italic;
            }
            
            .log-timestamp {
                font-size: 10px;
                color: #888;
                margin-right: 5px;
            }
            
            @media (max-width: 1200px) {
                .game-log {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners to suit buttons
        document.querySelectorAll('.suit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const suit = e.currentTarget.dataset.suit;
                this.onSuitSelected(suit);
            });
        });
    }
    
    createGameLog() {
        const gameLog = document.createElement('div');
        gameLog.className = 'game-log';
        gameLog.innerHTML = `
            <div class="game-log-title">GAME LOG</div>
            <div class="game-log-content" id="gameLogContent"></div>
        `;
        document.body.appendChild(gameLog);
    }
    
    addGameLog(message, type = 'default') {
        const logContent = document.getElementById('gameLogContent');
        if (!logContent) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        entry.innerHTML = `<span class="log-timestamp">${timestamp}</span>${message}`;
        logContent.appendChild(entry);
        
        // Auto-scroll to bottom
        logContent.scrollTop = logContent.scrollHeight;
        
        // Keep only last 50 entries
        while (logContent.children.length > 50) {
            logContent.removeChild(logContent.firstChild);
        }
    }
    
    showSuitSelector() {
        return new Promise((resolve) => {
            const modal = document.getElementById('suitSelector');
            modal.classList.add('active');
            
            // Store the resolve function
            this.suitResolve = resolve;
            
            this.addGameLog('Choose a suit for your Wild 8...', 'system');
        });
    }
    
    onSuitSelected(suit) {
        const modal = document.getElementById('suitSelector');
        modal.classList.remove('active');
        
        GameState.currentSuit = suit;
        
        this.addGameLog(`Suit changed to ${suit}`, 'special');
        this.showNotification(`Suit changed to ${suit}`, 'success');
        
        if (this.suitResolve) {
            this.suitResolve(suit);
            this.suitResolve = null;
        }
        
        // Continue with turn
        this.finishPlayerTurn();
    }
    
    initDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        
        GameState.deck = [];
        for (let suit of suits) {
            for (let i = 0; i < ranks.length; i++) {
                GameState.deck.push(new Card(suit, ranks[i], values[i]));
            }
        }
    }
    
    initThreeJS() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xd4af37, 0.3);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        
        // Particle system
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 50;
            positions[i + 1] = (Math.random() - 0.5) * 50;
            positions[i + 2] = (Math.random() - 0.5) * 50;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xd4af37,
            size: 0.5,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);
        
        camera.position.z = 15;
        
        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            particleSystem.rotation.y += 0.001;
            particleSystem.rotation.x += 0.0005;
            
            const time = Date.now() * 0.001;
            particleSystem.position.y = Math.sin(time) * 0.5;
            
            renderer.render(scene, camera);
        };
        
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    createSoundEffects() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;
        
        const audioContext = new AudioContext();
        
        const playSound = (frequency, duration, type = 'sine') => {
            if (!GameState.soundEnabled) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
        
        return {
            cardPlay: () => playSound(523, 0.1),
            cardDraw: () => playSound(392, 0.1),
            special: () => playSound(784, 0.2, 'square'),
            win: () => {
                playSound(523, 0.1);
                setTimeout(() => playSound(659, 0.1), 100);
                setTimeout(() => playSound(784, 0.2), 200);
            },
            error: () => playSound(196, 0.3, 'sawtooth'),
            select: () => playSound(440, 0.05),
            skip: () => playSound(300, 0.2, 'triangle')
        };
    }
    
    initEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!GameState.gameActive || GameState.processingAction) return;
            
            switch(e.key.toLowerCase()) {
                case 'd':
                    this.drawCard();
                    break;
                case 'p':
                    this.playSelectedCards();
                    break;
                case 'g':
                    this.callGame();
                    break;
                case 'escape':
                    this.deselectAllCards();
                    break;
                case 'n':
                    this.promptPlayerName();
                    break;
            }
        });
    }
    
    shuffleDeck() {
        for (let i = GameState.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [GameState.deck[i], GameState.deck[j]] = [GameState.deck[j], GameState.deck[i]];
        }
    }
    
    dealCards() {
        this.shuffleDeck();
        
        // Set opponent name for local play
        if (GameState.gameMode === 'local') {
            const aiNames = ['Wild Bill', 'Doc Holliday', 'Jesse James', 'Wyatt Earp', 'Billy the Kid', 'Calamity Jane'];
            GameState.opponentName = aiNames[Math.floor(Math.random() * aiNames.length)];
        }
        
        GameState.playerHand = [];
        GameState.opponentHand = [];
        GameState.discardPile = [];
        GameState.drawPile = [...GameState.deck];
        GameState.selectedCards = [];
        GameState.stackCount = 0;
        GameState.calledGame = false;
        GameState.gameActive = true;
        GameState.turnSkipped = false;
        GameState.processingAction = false;
        
        this.addGameLog('=== NEW GAME STARTED ===', 'system');
        this.addGameLog('Shuffling deck...', 'system');
        
        // Deal 8 cards to each player
        for (let i = 0; i < 8; i++) {
            GameState.playerHand.push(GameState.drawPile.pop());
            GameState.opponentHand.push(GameState.drawPile.pop());
        }
        
        this.addGameLog(`Dealt 8 cards to ${GameState.playerName}`, 'system');
        this.addGameLog(`Dealt 8 cards to ${GameState.opponentName}`, 'system');
        
        // Start discard pile with non-special card
        let startCard;
        do {
            startCard = GameState.drawPile.pop();
        } while (startCard.isSpecial());
        
        GameState.discardPile.push(startCard);
        GameState.currentSuit = startCard.suit;
        
        this.addGameLog(`Starting card: ${startCard.toString()}`, 'system');
        
        this.updateUI();
    }
    
    updateUI() {
        // Update player hand
        const playerHandEl = document.getElementById('playerHand');
        if (playerHandEl) {
            playerHandEl.innerHTML = '';
            
            GameState.playerHand.forEach((card, index) => {
                const cardEl = document.createElement('div');
                cardEl.className = `card player-card ${card.color}`;
                
                // Check if card is playable
                const topCard = GameState.discardPile[GameState.discardPile.length - 1];
                if (this.canPlayCard(card, topCard)) {
                    cardEl.classList.add('playable');
                }
                
                // Check if card is selected
                if (GameState.selectedCards.includes(index)) {
                    cardEl.classList.add('selected');
                }
                
                cardEl.textContent = card.toString();
                cardEl.title = card.getDescription();
                cardEl.onclick = () => this.selectCard(index);
                cardEl.style.animationDelay = `${index * 0.05}s`;
                playerHandEl.appendChild(cardEl);
            });
        }
        
        // Update opponent hand
        const opponentHandEl = document.getElementById('opponentHand');
        if (opponentHandEl) {
            opponentHandEl.innerHTML = '';
            
            GameState.opponentHand.forEach((_, index) => {
                const cardEl = document.createElement('div');
                cardEl.className = 'card card-back';
                cardEl.style.transform = `rotate(${(index - GameState.opponentHand.length/2) * 5}deg)`;
                opponentHandEl.appendChild(cardEl);
            });
        }
        
        // Update discard pile with current suit indicator
        const discardPileEl = document.getElementById('discardPile');
        if (discardPileEl && GameState.discardPile.length > 0) {
            discardPileEl.innerHTML = '';
            const topCard = GameState.discardPile[GameState.discardPile.length - 1];
            const cardEl = document.createElement('div');
            cardEl.className = `card ${topCard.color}`;
            cardEl.textContent = topCard.toString();
            discardPileEl.appendChild(cardEl);
            
            // Add current suit indicator if different from card
            if (GameState.currentSuit && GameState.currentSuit !== topCard.suit) {
                const suitIndicator = document.createElement('div');
                suitIndicator.className = 'current-suit-indicator';
                suitIndicator.innerHTML = `Current Suit: <span style="font-size: 24px;">${GameState.currentSuit}</span>`;
                suitIndicator.style.cssText = `
                    position: absolute;
                    bottom: -40px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(212, 175, 55, 0.2);
                    padding: 5px 15px;
                    border-radius: 20px;
                    border: 2px solid #d4af37;
                    color: #f0e6d2;
                    font-weight: bold;
                    font-size: 14px;
                `;
                discardPileEl.appendChild(suitIndicator);
            }
        }
        
        // Update turn indicator
        const currentTurnEl = document.getElementById('currentTurn');
        if (currentTurnEl) {
            currentTurnEl.textContent = GameState.currentTurn === 'player' ? 
                `${GameState.playerName}'S TURN` : `${GameState.opponentName}'S TURN`;
            const turnIndicator = document.getElementById('turnIndicator');
            if (turnIndicator) {
                turnIndicator.className = 'turn-indicator';
                if (GameState.currentTurn === 'player') {
                    turnIndicator.classList.add('player-turn');
                } else {
                    turnIndicator.classList.add('opponent-turn');
                }
            }
        }
        
        // Update card counts
        document.getElementById('playerCardCount').textContent = GameState.playerHand.length;
        document.getElementById('opponentCardCount').textContent = GameState.opponentHand.length;
        document.getElementById('drawPileCount').textContent = GameState.drawPile.length;
        
        // Update selected count
        document.getElementById('selectedCount').textContent = GameState.selectedCards.length;
        
        // Update stack indicator
        const stackIndicator = document.getElementById('stackIndicator');
        const stackCountEl = document.getElementById('stackCount');
        const drawStackEl = document.getElementById('drawStackCount');
        
        if (GameState.stackCount > 0) {
            stackIndicator.style.display = 'flex';
            stackCountEl.textContent = GameState.stackCount;
            drawStackEl.textContent = GameState.stackCount;
        } else {
            stackIndicator.style.display = 'none';
            drawStackEl.textContent = '0';
        }
        
        // Update buttons state
        this.updateButtonStates();
    }
    
    updateButtonStates() {
        const drawBtn = document.getElementById('drawBtn');
        const playBtn = document.getElementById('playBtn');
        const callGameBtn = document.getElementById('callGameBtn');
        
        // Draw button
        if (drawBtn) {
            drawBtn.disabled = GameState.currentTurn !== 'player' || GameState.processingAction;
        }
        
        // Play button
        if (playBtn) {
            const canPlay = GameState.currentTurn === 'player' && 
                          GameState.selectedCards.length > 0 &&
                          !GameState.processingAction &&
                          this.validateSelectedCards();
            playBtn.disabled = !canPlay;
        }
        
        // Call game button
        if (callGameBtn) {
            callGameBtn.disabled = GameState.playerHand.length > 1 || 
                                  GameState.calledGame ||
                                  GameState.processingAction;
        }
    }
    
    validateSelectedCards() {
        if (GameState.selectedCards.length === 0) return false;
        
        // Check if all selected cards have the same rank
        const firstCard = GameState.playerHand[GameState.selectedCards[0]];
        const allSameRank = GameState.selectedCards.every(index => {
            const card = GameState.playerHand[index];
            return card.rank === firstCard.rank;
        });
        
        if (!allSameRank) return false;
        
        // Check if at least one card can be played
        const topCard = GameState.discardPile[GameState.discardPile.length - 1];
        return this.canPlayCard(firstCard, topCard);
    }
    
    selectCard(index) {
        if (GameState.currentTurn !== 'player' || !GameState.gameActive || GameState.processingAction) return;
        
        const card = GameState.playerHand[index];
        const cardIndex = GameState.selectedCards.indexOf(index);
        
        if (cardIndex > -1) {
            // Deselect card
            GameState.selectedCards.splice(cardIndex, 1);
            if (this.soundEffects) this.soundEffects.select();
        } else {
            // Check if card can be selected
            const topCard = GameState.discardPile[GameState.discardPile.length - 1];
            
            // If cards already selected, check if this card matches their rank
            if (GameState.selectedCards.length > 0) {
                const firstCard = GameState.playerHand[GameState.selectedCards[0]];
                
                if (card.rank !== firstCard.rank) {
                    this.showNotification('Select cards with same rank only!', 'warning');
                    if (this.soundEffects) this.soundEffects.error();
                    return;
                }
            }
            
            // Check if card can be played
            if (!this.canPlayCard(card, topCard)) {
                this.showNotification('This card cannot be played!', 'warning');
                if (this.soundEffects) this.soundEffects.error();
                return;
            }
            
            GameState.selectedCards.push(index);
            if (this.soundEffects) this.soundEffects.select();
            
            // Show hint for special cards
            if (card.isSpecial()) {
                this.showNotification(card.getDescription(), 'success');
            }
        }
        
        this.updateUI();
    }
    
    deselectAllCards() {
        GameState.selectedCards = [];
        this.updateUI();
    }
    
    canPlayCard(card, topCard) {
        // Wild 8 can always be played
        if (card.rank === '8') return true;
        
        // Match current suit (which might be different from top card due to wild 8)
        // or match rank
        const currentSuit = GameState.currentSuit || topCard.suit;
        return card.suit === currentSuit || card.rank === topCard.rank;
    }
    
    async playSelectedCards() {
        if (GameState.currentTurn !== 'player' || GameState.selectedCards.length === 0 || 
            !GameState.gameActive || GameState.processingAction) {
            if (this.soundEffects) this.soundEffects.error();
            return;
        }
        
        GameState.processingAction = true;
        
        const topCard = GameState.discardPile[GameState.discardPile.length - 1];
        const cardsToPlay = GameState.selectedCards.map(i => GameState.playerHand[i]);
        
        // Validate all selected cards can be played
        if (!this.validateSelectedCards()) {
            this.showNotification('Invalid move!', 'warning');
            this.addGameLog('Invalid move attempted', 'player');
            if (this.soundEffects) this.soundEffects.error();
            GameState.processingAction = false;
            return;
        }
        
        // Check if trying to end with 2 or 8
        if (GameState.playerHand.length === cardsToPlay.length) {
            const lastCard = cardsToPlay[cardsToPlay.length - 1];
            
            if (lastCard.rank === '2' || lastCard.rank === '8') {
                this.showNotification('Cannot end with 2 or 8!', 'warning');
                this.addGameLog('Cannot end game with 2 or 8!', 'system');
                if (this.soundEffects) this.soundEffects.error();
                GameState.processingAction = false;
                return;
            }
            
            if (!GameState.calledGame) {
                this.showNotification('You must call "GAME" first!', 'warning');
                this.addGameLog('Must call GAME before playing last card!', 'system');
                if (this.soundEffects) this.soundEffects.error();
                GameState.processingAction = false;
                return;
            }
        }
        
        // Log cards being played
        const cardsString = cardsToPlay.map(c => c.toString()).join(', ');
        this.addGameLog(`${GameState.playerName} plays ${cardsString}`, 'player');
        
        // Play the cards with animation delay
        for (let i = 0; i < cardsToPlay.length; i++) {
            const card = cardsToPlay[i];
            
            await this.delay(200); // Delay between each card
            
            GameState.discardPile.push(card);
            
            // Animate special card effect
            if (card.isSpecial()) {
                const discardPileEl = document.getElementById('discardPile');
                if (discardPileEl && discardPileEl.firstChild) {
                    discardPileEl.firstChild.classList.add('special-played');
                    setTimeout(() => {
                        if (discardPileEl.firstChild) {
                            discardPileEl.firstChild.classList.remove('special-played');
                        }
                    }, 600);
                }
            }
            
            // Handle special cards
            if (card.rank === '8') {
                // Show suit selector and wait for selection
                GameState.processingAction = false; // Allow suit selection
                await this.showSuitSelector();
                GameState.processingAction = true;
                // Suit will be set by onSuitSelected
            } else {
                GameState.currentSuit = card.suit;
                this.handleSpecialCard(card);
            }
        }
        
        // Remove cards from hand
        GameState.selectedCards.sort((a, b) => b - a);
        GameState.selectedCards.forEach(index => {
            GameState.playerHand.splice(index, 1);
        });
        
        GameState.selectedCards = [];
        
        // Play sound
        if (this.soundEffects) {
            if (cardsToPlay.some(card => card.isSpecial())) {
                this.soundEffects.special();
            } else {
                this.soundEffects.cardPlay();
            }
        }
        
        // Check for win
        if (GameState.playerHand.length === 0) {
            this.endGame('player');
            GameState.processingAction = false;
            return;
        }
        
        GameState.processingAction = false;
        
        // Only continue if 8 wasn't played (suit selector will handle continuation)
        if (!cardsToPlay.some(card => card.rank === '8')) {
            this.finishPlayerTurn();
        }
    }
    
    finishPlayerTurn() {
        // Check if next turn should be skipped (Jack effect)
        if (GameState.turnSkipped) {
            GameState.turnSkipped = false;
            this.addGameLog(`${GameState.opponentName}'s turn skipped!`, 'special');
            this.showNotification('Opponent\'s turn skipped!', 'success');
            if (this.soundEffects) this.soundEffects.skip();
            
            // Stay on player's turn
            this.updateUI();
        } else {
            // Switch turn
            GameState.currentTurn = 'opponent';
            this.updateUI();
            
            // AI opponent's turn after delay
            setTimeout(() => this.opponentTurn(), 2000);
        }
    }
    
    handleSpecialCard(card) {
        if (card.rank === 'J') {
            GameState.turnSkipped = true;
            this.showNotification('Jack played - Skip next turn!', 'special');
            this.addGameLog('Jack played - Next turn will be skipped', 'special');
        } else if (card.rank === 'Q' && card.suit === '♠') {
            GameState.stackCount += 5;
            this.showNotification('Queen of Spades! +5 cards', 'warning');
            this.addGameLog('Queen of Spades - Stack +5 cards', 'special');
        } else if (card.rank === '2') {
            GameState.stackCount += 2;
            this.showNotification(`Two played! +2 cards (Total: ${GameState.stackCount})`, 'warning');
            this.addGameLog(`Two played - Stack +2 (Total: ${GameState.stackCount})`, 'special');
        }
    }
    
    async drawCard() {
        if (GameState.currentTurn !== 'player' || !GameState.gameActive || GameState.processingAction) return;
        
        GameState.processingAction = true;
        
        let cardsDrawn = 0;
        
        // Handle stacked draw
        if (GameState.stackCount > 0) {
            cardsDrawn = GameState.stackCount;
            this.addGameLog(`${GameState.playerName} draws ${cardsDrawn} cards (stack)`, 'player');
            
            for (let i = 0; i < cardsDrawn; i++) {
                await this.delay(100);
                if (GameState.drawPile.length === 0) this.reshuffleDeck();
                if (GameState.drawPile.length > 0) {
                    GameState.playerHand.push(GameState.drawPile.pop());
                }
            }
            GameState.stackCount = 0;
            this.showNotification(`Drew ${cardsDrawn} cards from stack!`, 'warning');
        } else {
            if (GameState.drawPile.length === 0) this.reshuffleDeck();
            if (GameState.drawPile.length > 0) {
                GameState.playerHand.push(GameState.drawPile.pop());
                cardsDrawn = 1;
                this.addGameLog(`${GameState.playerName} draws 1 card`, 'player');
            }
        }
        
        if (this.soundEffects) this.soundEffects.cardDraw();
        
        GameState.processingAction = false;
        GameState.currentTurn = 'opponent';
        this.updateUI();
        
        setTimeout(() => this.opponentTurn(), 2000);
    }
    
    reshuffleDeck() {
        if (GameState.discardPile.length <= 1) return;
        
        const topCard = GameState.discardPile.pop();
        GameState.drawPile = GameState.discardPile;
        GameState.discardPile = [topCard];
        
        // Shuffle draw pile
        for (let i = GameState.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [GameState.drawPile[i], GameState.drawPile[j]] = [GameState.drawPile[j], GameState.drawPile[i]];
        }
        
        this.showNotification('Deck reshuffled!', 'success');
        this.addGameLog('Deck reshuffled', 'system');
    }
    
    async opponentTurn() {
        if (GameState.currentTurn !== 'opponent' || !GameState.gameActive) return;
        
        GameState.processingAction = true;
        
        // Check if turn was skipped
        if (GameState.turnSkipped) {
            GameState.turnSkipped = false;
            this.addGameLog(`${GameState.playerName}'s turn skipped!`, 'special');
            this.showNotification('Your turn was skipped!', 'warning');
            if (this.soundEffects) this.soundEffects.skip();
            
            // Stay on opponent's turn for another play
            await this.delay(1500);
            this.opponentTurn();
            return;
        }
        
        const topCard = GameState.discardPile[GameState.discardPile.length - 1];
        
        // Check for stacked draw
        if (GameState.stackCount > 0) {
            // AI tries to play a 2 or Queen of Spades
            const stackCards = GameState.opponentHand.filter(card => 
                (card.rank === '2' || (card.rank === 'Q' && card.suit === '♠')) &&
                this.canPlayCard(card, topCard)
            );
            
            if (stackCards.length > 0) {
                // Play all matching stack cards
                const cardsToPlay = stackCards.filter(c => c.rank === stackCards[0].rank);
                const cardsString = cardsToPlay.map(c => c.toString()).join(', ');
                this.addGameLog(`${GameState.opponentName} plays ${cardsString}`, 'opponent');
                
                for (const card of cardsToPlay) {
                    await this.delay(300);
                    GameState.discardPile.push(card);
                    const index = GameState.opponentHand.indexOf(card);
                    GameState.opponentHand.splice(index, 1);
                    GameState.currentSuit = card.suit;
                    this.handleSpecialCard(card);
                }
                
                if (this.soundEffects) this.soundEffects.special();
            } else {
                // Draw the stacked cards
                const drawCount = GameState.stackCount;
                this.addGameLog(`${GameState.opponentName} draws ${drawCount} cards (stack)`, 'opponent');
                
                for (let i = 0; i < drawCount; i++) {
                    await this.delay(100);
                    if (GameState.drawPile.length === 0) this.reshuffleDeck();
                    if (GameState.drawPile.length > 0) {
                        GameState.opponentHand.push(GameState.drawPile.pop());
                    }
                }
                GameState.stackCount = 0;
                if (this.soundEffects) this.soundEffects.cardDraw();
            }
        } else {
            // Find playable cards
            const playableCards = GameState.opponentHand.filter(card => 
                this.canPlayCard(card, topCard)
            );
            
            if (playableCards.length > 0) {
                // Group by rank to play multiple cards
                const cardsByRank = {};
                playableCards.forEach(card => {
                    if (!cardsByRank[card.rank]) {
                        cardsByRank[card.rank] = [];
                    }
                    cardsByRank[card.rank].push(card);
                });
                
                // AI strategy: prefer special cards when player has few cards
                let cardsToPlay;
                
                if (GameState.playerHand.length <= 3) {
                    // Play special cards
                    const specialRanks = ['2', 'Q', 'J', '8'];
                    const specialGroup = specialRanks.find(rank => cardsByRank[rank]);
                    cardsToPlay = specialGroup ? cardsByRank[specialGroup] : Object.values(cardsByRank)[0];
                } else {
                    // Play the group with most cards
                    cardsToPlay = Object.values(cardsByRank).reduce((a, b) => 
                        a.length > b.length ? a : b
                    );
                }
                
                // Check if AI is about to win
                if (GameState.opponentHand.length === cardsToPlay.length) {
                    const lastCard = cardsToPlay[cardsToPlay.length - 1];
                    if (lastCard.rank === '2' || lastCard.rank === '8') {
                        // Draw instead
                        this.addGameLog(`${GameState.opponentName} draws 1 card (can't end with ${lastCard.rank})`, 'opponent');
                        if (GameState.drawPile.length === 0) this.reshuffleDeck();
                        if (GameState.drawPile.length > 0) {
                            GameState.opponentHand.push(GameState.drawPile.pop());
                        }
                        if (this.soundEffects) this.soundEffects.cardDraw();
                    } else {
                        // Play the cards
                        const cardsString = cardsToPlay.map(c => c.toString()).join(', ');
                        this.addGameLog(`${GameState.opponentName} plays ${cardsString}`, 'opponent');
                        
                        for (const card of cardsToPlay) {
                            await this.delay(300);
                            GameState.discardPile.push(card);
                            const index = GameState.opponentHand.indexOf(card);
                            GameState.opponentHand.splice(index, 1);
                            
                            if (card.rank === '8') {
                                // AI chooses most common suit in hand
                                GameState.currentSuit = this.getAIMostCommonSuit();
                                this.addGameLog(`Suit changed to ${GameState.currentSuit}`, 'special');
                                this.showNotification(`Suit changed to ${GameState.currentSuit}`, 'success');
                            } else {
                                GameState.currentSuit = card.suit;
                                this.handleSpecialCard(card);
                            }
                        }
                        
                        if (cardsToPlay.some(card => card.isSpecial())) {
                            if (this.soundEffects) this.soundEffects.special();
                        } else {
                            if (this.soundEffects) this.soundEffects.cardPlay();
                        }
                        
                        // Check for win
                        if (GameState.opponentHand.length === 0) {
                            this.endGame('opponent');
                            GameState.processingAction = false;
                            return;
                        }
                    }
                } else {
                    // Play the cards normally
                    const cardsString = cardsToPlay.map(c => c.toString()).join(', ');
                    this.addGameLog(`${GameState.opponentName} plays ${cardsString}`, 'opponent');
                    
                    for (const card of cardsToPlay) {
                        await this.delay(300);
                        GameState.discardPile.push(card);
                        const index = GameState.opponentHand.indexOf(card);
                        GameState.opponentHand.splice(index, 1);
                        
                        if (card.rank === '8') {
                            GameState.currentSuit = this.getAIMostCommonSuit();
                            this.addGameLog(`Suit changed to ${GameState.currentSuit}`, 'special');
                            this.showNotification(`Suit changed to ${GameState.currentSuit}`, 'success');
                        } else {
                            GameState.currentSuit = card.suit;
                            this.handleSpecialCard(card);
                        }
                    }
                    
                    if (cardsToPlay.some(card => card.isSpecial())) {
                        if (this.soundEffects) this.soundEffects.special();
                    } else {
                        if (this.soundEffects) this.soundEffects.cardPlay();
                    }
                }
            } else {
                // Draw a card
                this.addGameLog(`${GameState.opponentName} draws 1 card`, 'opponent');
                if (GameState.drawPile.length === 0) this.reshuffleDeck();
                if (GameState.drawPile.length > 0) {
                    GameState.opponentHand.push(GameState.drawPile.pop());
                }
                if (this.soundEffects) this.soundEffects.cardDraw();
            }
        }
        
        GameState.processingAction = false;
        GameState.currentTurn = 'player';
        this.updateUI();
    }
    
    getAIMostCommonSuit() {
        const suitCounts = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };
        GameState.opponentHand.forEach(card => {
            suitCounts[card.suit]++;
        });
        
        let maxSuit = '♠';
        let maxCount = 0;
        for (const [suit, count] of Object.entries(suitCounts)) {
            if (count > maxCount) {
                maxCount = count;
                maxSuit = suit;
            }
        }
        
        return maxSuit;
    }
    
    callGame() {
        if (GameState.playerHand.length !== 1 || GameState.calledGame) {
            this.showNotification('You can only call GAME with 1 card left!', 'warning');
            if (this.soundEffects) this.soundEffects.error();
            return;
        }
        
        GameState.calledGame = true;
        this.showNotification('GAME CALLED! Play your last card!', 'success');
        this.addGameLog(`${GameState.playerName} calls GAME!`, 'special');
        if (this.soundEffects) this.soundEffects.special();
        this.updateUI();
    }
    
    endGame(winner) {
        GameState.gameActive = false;
        
        const modal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        if (winner === 'player') {
            modalTitle.textContent = '🎉 VICTORY!';
            modalMessage.textContent = `Congratulations ${GameState.playerName}! You've won this round of Crazy Eights!`;
            this.addGameLog(`=== ${GameState.playerName} WINS! ===`, 'special');
            if (this.soundEffects) this.soundEffects.win();
            this.createVictoryEffect();
        } else {
            modalTitle.textContent = '😔 DEFEAT';
            modalMessage.textContent = `${GameState.opponentName} has won this round. Better luck next time!`;
            this.addGameLog(`=== ${GameState.opponentName} WINS ===`, 'special');
            if (this.soundEffects) this.soundEffects.error();
        }
        
        modal.classList.add('active');
    }
    
    createVictoryEffect() {
        // Create particle explosion
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: fixed;
                    width: 8px;
                    height: 8px;
                    background: #d4af37;
                    border-radius: 50%;
                    left: 50%;
                    top: 50%;
                    pointer-events: none;
                    z-index: 1000;
                    animation: particleExplosion 1s ease-out forwards;
                `;
                
                const angle = (Math.PI * 2 * i) / 50;
                const velocity = 200 + Math.random() * 200;
                
                particle.style.setProperty('--x', `${Math.cos(angle) * velocity}px`);
                particle.style.setProperty('--y', `${Math.sin(angle) * velocity}px`);
                
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 1000);
            }, i * 20);
        }
        
        // Add animation style if not exists
        if (!document.getElementById('victory-animation-style')) {
            const style = document.createElement('style');
            style.id = 'victory-animation-style';
            style.textContent = `
                @keyframes particleExplosion {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(0);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    showNotification(message, type = 'default') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = 'notification show';
        
        if (type === 'success') {
            notification.classList.add('success');
        } else if (type === 'warning') {
            notification.classList.add('warning');
        }
        
        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    newGame() {
        const modal = document.getElementById('gameModal');
        if (modal) modal.classList.remove('active');
        
        GameState.selectedCards = [];
        GameState.stackCount = 0;
        GameState.currentTurn = 'player';
        GameState.calledGame = false;
        GameState.gameActive = true;
        GameState.turnSkipped = false;
        GameState.currentSuit = null;
        GameState.processingAction = false;
        
        // Clear game log
        const logContent = document.getElementById('gameLogContent');
        if (logContent) {
            logContent.innerHTML = '';
        }
        
        this.initDeck();
        this.dealCards();
        
        this.showNotification('New game started!', 'success');
    }
}

// Game Mode Manager
class GameModeManager {
    showModeSelection() {
        const modal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalAction = document.getElementById('modalAction');
        
        modalTitle.textContent = 'SELECT GAME MODE';
        modalMessage.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <button class="modal-btn" onclick="gameMode.selectMode('local')">🎮 LOCAL PLAY</button>
                <button class="modal-btn" onclick="gameMode.selectMode('online')">🌐 ONLINE MULTIPLAYER</button>
            </div>
        `;
        modalAction.style.display = 'none';
        
        modal.classList.add('active');
    }
    
    selectMode(mode) {
        GameState.gameMode = mode;
        const modal = document.getElementById('gameModal');
        modal.classList.remove('active');
        
        document.getElementById('modalAction').style.display = 'block';
        
        if (mode === 'online') {
            if (typeof multiplayer !== 'undefined') {
                multiplayer.connect();
            }
        } else {
            game.newGame();
        }
    }
    
    toggleSound() {
        GameState.soundEnabled = !GameState.soundEnabled;
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.querySelector('.btn-icon').textContent = GameState.soundEnabled ? '🔊' : '🔇';
        }
        
        game.showNotification(GameState.soundEnabled ? 'Sound enabled' : 'Sound disabled', 'success');
    }
    
    showRules() {
        const modal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        modalTitle.textContent = '📖 GAME RULES';
        modalMessage.innerHTML = `
            <div style="text-align: left; max-height: 400px; overflow-y: auto; padding: 10px;">
                <h3 style="color: #d4af37; margin-bottom: 10px;">🎯 Goal</h3>
                <p style="margin-bottom: 15px;">Be the first to play all your cards.</p>
                
                <h3 style="color: #d4af37; margin-bottom: 10px;">⚠️ Important Rules</h3>
                <ul style="margin-bottom: 15px; padding-left: 20px;">
                    <li>Must call "GAME" before playing final card</li>
                    <li>Cannot end with 2 or 8</li>
                    <li>Can play multiple cards of same rank together</li>
                    <li>Match suit or rank to play cards</li>
                </ul>
                
                <h3 style="color: #d4af37; margin-bottom: 10px;">🃏 Special Cards</h3>
                <div style="display: grid; gap: 8px;">
                    <div><strong>8:</strong> Wild card - choose any suit</div>
                    <div><strong>Jack:</strong> Skip next player's turn</div>
                    <div><strong>Queen ♠:</strong> Next player draws 5 cards</div>
                    <div><strong>2s:</strong> Next player draws 2 cards (stackable)</div>
                </div>
                
                <h3 style="color: #d4af37; margin: 15px 0 10px;">🔥 Stacking</h3>
                <p>Queen♠ and 2s can be stacked! Play a 2 on Queen♠ to make it 7 cards, or stack multiple 2s. The player who can't continue the stack draws all accumulated cards.</p>
                
                <h3 style="color: #d4af37; margin: 15px 0 10px;">💡 Tips</h3>
                <ul style="padding-left: 20px;">
                    <li>Save 8s for when you're stuck</li>
                    <li>Use Jacks strategically to skip opponent</li>
                    <li>Stack 2s to force big draws</li>
                    <li>Play multiple same-rank cards together</li>
                </ul>
                
                <h3 style="color: #d4af37; margin: 15px 0 10px;">⌨️ Keyboard Shortcuts</h3>
                <div style="display: grid; gap: 5px;">
                    <div><strong>D:</strong> Draw card</div>
                    <div><strong>P:</strong> Play selected cards</div>
                    <div><strong>G:</strong> Call game</div>
                    <div><strong>N:</strong> Change name</div>
                    <div><strong>ESC:</strong> Deselect all cards</div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('gameModal');
    if (modal) modal.classList.remove('active');
}

// Initialize game and mode manager
const game = new CrazyEightsGame();
const gameMode = new GameModeManager();