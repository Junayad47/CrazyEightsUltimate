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
    currentSuit: null,
    playerName: 'Player',
    opponentName: 'Opponent',
    animationSpeed: 1000,
    processingAction: false,
    playerGoesAgain: false,
    opponentGoesAgain: false,
    mustDrawPenalty: false
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
        if (this.rank === 'J') return 'Jack - Play again';
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
        // Get player name from localStorage
        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            GameState.playerName = savedName;
            document.getElementById('playerNameDisplay').textContent = savedName;
        }
    }
    
    promptPlayerName() {
        const name = prompt('Enter your name:', GameState.playerName);
        if (name && name.trim()) {
            GameState.playerName = name.trim();
            localStorage.setItem('playerName', GameState.playerName);
            document.getElementById('playerNameDisplay').textContent = GameState.playerName;
            this.addGameLog(`Welcome, ${GameState.playerName}!`, 'system');
        }
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
        
        // Add event listeners to suit buttons
        document.querySelectorAll('.suit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const suit = e.currentTarget.dataset.suit;
                this.onSuitSelected(suit);
            });
        });
    }
    
    createGameLog() {
        // Game log is now in the header
    }
    
    addGameLog(message, type = 'default') {
        const logContent = document.getElementById('gameLogContent');
        if (!logContent) return;
        
        logContent.innerHTML = message;
        
        // Also show as notification for important messages
        if (type === 'special' || type === 'system') {
            this.showNotification(message, type === 'special' ? 'success' : 'default');
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
            document.getElementById('opponentName').textContent = GameState.opponentName;
        }
        
        GameState.playerHand = [];
        GameState.opponentHand = [];
        GameState.discardPile = [];
        GameState.drawPile = [...GameState.deck];
        GameState.selectedCards = [];
        GameState.stackCount = 0;
        GameState.calledGame = false;
        GameState.gameActive = true;
        GameState.playerGoesAgain = false;
        GameState.opponentGoesAgain = false;
        GameState.mustDrawPenalty = false;
        GameState.processingAction = false;
        
        this.addGameLog('New game started!', 'system');
        
        // Deal 8 cards to each player
        for (let i = 0; i < 8; i++) {
            GameState.playerHand.push(GameState.drawPile.pop());
            GameState.opponentHand.push(GameState.drawPile.pop());
        }
        
        // Start discard pile with non-special card
        let startCard;
        do {
            startCard = GameState.drawPile.pop();
        } while (startCard.isSpecial());
        
        GameState.discardPile.push(startCard);
        GameState.currentSuit = startCard.suit;
        
        this.addGameLog(`Starting card: ${startCard.toString()}`, 'system');
        
        // Randomly decide who goes first
        GameState.currentTurn = Math.random() < 0.5 ? 'player' : 'opponent';
        
        this.updateUI();
        
        if (GameState.currentTurn === 'opponent') {
            setTimeout(() => this.opponentTurn(), 2000);
        }
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
        
        // Check if player must draw penalty
        if (GameState.mustDrawPenalty && GameState.currentTurn === 'player' && GameState.stackCount > 0) {
            setTimeout(() => this.forcePenaltyDraw(), 1000);
        }
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
            if (this.soundEffects) this.soundEffects.error();
            GameState.processingAction = false;
            return;
        }
        
        // Check if trying to end with 2 or 8
        if (GameState.playerHand.length === cardsToPlay.length) {
            const lastCard = cardsToPlay[cardsToPlay.length - 1];
            
            if (lastCard.rank === '2' || lastCard.rank === '8') {
                this.showNotification('Cannot end with 2 or 8!', 'warning');
                if (this.soundEffects) this.soundEffects.error();
                GameState.processingAction = false;
                return;
            }
            
            if (!GameState.calledGame) {
                this.showNotification('You must call "GAME" first!', 'warning');
                if (this.soundEffects) this.soundEffects.error();
                GameState.processingAction = false;
                return;
            }
        }
        
        // Clear must draw penalty if playing a 2 or Q♠
        if (GameState.stackCount > 0) {
            const hasStackCard = cardsToPlay.some(card => 
                card.rank === '2' || (card.rank === 'Q' && card.suit === '♠')
            );
            if (hasStackCard) {
                GameState.mustDrawPenalty = false;
            }
        }
        
        // Log cards being played
        const cardsString = cardsToPlay.map(c => c.toString()).join(', ');
        this.addGameLog(`${GameState.playerName} plays ${cardsString}`, 'player');
        
        // Play the cards with animation delay
        let hasJack = false;
        let hasEight = false;
        for (let i = 0; i < cardsToPlay.length; i++) {
            const card = cardsToPlay[i];
            
            await this.delay(200); // Delay between each card
            
            GameState.discardPile.push(card);
            
            // Handle special cards
            if (card.rank === '8') {
                hasEight = true;
                // Will show suit selector after
            } else {
                GameState.currentSuit = card.suit;
                this.handleSpecialCard(card);
                if (card.rank === 'J') {
                    hasJack = true;
                }
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
        
        // Handle Jack effect - player goes again
        if (hasJack) {
            this.addGameLog('Jack played - You play again!', 'special');
            this.showNotification('Jack played - Play again!', 'success');
            GameState.playerGoesAgain = true;
        } else {
            GameState.playerGoesAgain = false;
        }
        
        GameState.processingAction = false;
        
        // Handle 8 - show suit selector
        if (hasEight) {
            GameState.processingAction = false; // Allow suit selection
            await this.showSuitSelector();
            GameState.processingAction = true;
            // Suit will be set by onSuitSelected
        } else {
            this.finishPlayerTurn();
        }
    }
    
    finishPlayerTurn() {
        // If player has Jack effect, they go again
        if (GameState.playerGoesAgain) {
            GameState.playerGoesAgain = false;
            // Player keeps their turn
            this.updateUI();
        } else {
            // Switch turn to opponent
            GameState.currentTurn = 'opponent';
            GameState.mustDrawPenalty = GameState.stackCount > 0;
            this.updateUI();
            
            // AI opponent's turn after delay
            setTimeout(() => this.opponentTurn(), 2000);
        }
    }
    
    handleSpecialCard(card) {
        if (card.rank === 'J') {
            // Jack effect handled in playSelectedCards
        } else if (card.rank === 'Q' && card.suit === '♠') {
            GameState.stackCount += 5;
            this.showNotification('Queen of Spades! +5 cards', 'warning');
        } else if (card.rank === '2') {
            GameState.stackCount += 2;
            this.showNotification(`Two played! Stack: ${GameState.stackCount} cards`, 'warning');
        }
    }
    
    async forcePenaltyDraw() {
        if (GameState.stackCount > 0 && GameState.currentTurn === 'player' && GameState.mustDrawPenalty) {
            this.showNotification(`Drawing ${GameState.stackCount} penalty cards!`, 'warning');
            this.addGameLog(`${GameState.playerName} must draw ${GameState.stackCount} cards`, 'system');
            
            await this.drawCard(true); // Force draw
        }
    }
    
    async drawCard(forced = false) {
        if (GameState.currentTurn !== 'player' || !GameState.gameActive || GameState.processingAction) {
            if (!forced) return;
        }
        
        GameState.processingAction = true;
        
        let cardsDrawn = 0;
        
        // Handle stacked draw
        if (GameState.stackCount > 0) {
            cardsDrawn = GameState.stackCount;
            this.addGameLog(`${GameState.playerName} draws ${cardsDrawn} cards`, 'player');
            
            for (let i = 0; i < cardsDrawn; i++) {
                await this.delay(100);
                if (GameState.drawPile.length === 0) this.reshuffleDeck();
                if (GameState.drawPile.length > 0) {
                    GameState.playerHand.push(GameState.drawPile.pop());
                }
            }
            GameState.stackCount = 0;
            GameState.mustDrawPenalty = false;
            this.showNotification(`Drew ${cardsDrawn} cards from stack!`, 'warning');
        } else {
            if (GameState.drawPile.length === 0) this.reshuffleDeck();
            if (GameState.drawPile.length > 0) {
                const drawnCard = GameState.drawPile.pop();
                GameState.playerHand.push(drawnCard);
                cardsDrawn = 1;
                this.addGameLog(`${GameState.playerName} draws 1 card`, 'player');
                
                // Check if drawn card can be played immediately
                const topCard = GameState.discardPile[GameState.discardPile.length - 1];
                if (this.canPlayCard(drawnCard, topCard)) {
                    this.showNotification('You can play the drawn card!', 'success');
                    GameState.processingAction = false;
                    this.updateUI();
                    return; // Stay on player's turn
                }
            }
        }
        
        if (this.soundEffects) this.soundEffects.cardDraw();
        
        GameState.processingAction = false;
        GameState.currentTurn = 'opponent';
        GameState.mustDrawPenalty = false;
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
    }
    
    async opponentTurn() {
        if (GameState.currentTurn !== 'opponent' || !GameState.gameActive) return;
        
        GameState.processingAction = true;
        
        const topCard = GameState.discardPile[GameState.discardPile.length - 1];
        
        // Check for stacked draw
        if (GameState.stackCount > 0 && GameState.mustDrawPenalty) {
            // AI tries to play a 2 or Queen of Spades
            const stackCards = GameState.opponentHand.filter(card => 
                ((card.rank === '2' || (card.rank === 'Q' && card.suit === '♠')) &&
                this.canPlayCard(card, topCard))
            );
            
            if (stackCards.length > 0) {
                // Play stack card
                const cardsToPlay = stackCards.slice(0, 1); // Play one at a time for simplicity
                const cardsString = cardsToPlay.map(c => c.toString()).join(', ');
                this.addGameLog(`${GameState.opponentName} plays ${cardsString}`, 'opponent');
                
                let hasJack = false;
                for (const card of cardsToPlay) {
                    await this.delay(300);
                    GameState.discardPile.push(card);
                    const index = GameState.opponentHand.indexOf(card);
                    GameState.opponentHand.splice(index, 1);
                    GameState.currentSuit = card.suit;
                    this.handleSpecialCard(card);
                    if (card.rank === 'J') hasJack = true;
                }
                
                if (this.soundEffects) this.soundEffects.special();
                GameState.mustDrawPenalty = false;
                
                // Check for win
                if (GameState.opponentHand.length === 0) {
                    this.endGame('opponent');
                    GameState.processingAction = false;
                    return;
                }
                
                // Handle Jack effect
                if (hasJack) {
                    this.addGameLog(`${GameState.opponentName} plays again!`, 'special');
                    GameState.processingAction = false;
                    this.updateUI();
                    setTimeout(() => this.opponentTurn(), 2000);
                    return;
                }
            } else {
                // Draw the stacked cards
                const drawCount = GameState.stackCount;
                this.addGameLog(`${GameState.opponentName} draws ${drawCount} cards`, 'opponent');
                
                for (let i = 0; i < drawCount; i++) {
                    await this.delay(100);
                    if (GameState.drawPile.length === 0) this.reshuffleDeck();
                    if (GameState.drawPile.length > 0) {
                        GameState.opponentHand.push(GameState.drawPile.pop());
                    }
                }
                GameState.stackCount = 0;
                GameState.mustDrawPenalty = false;
                if (this.soundEffects) this.soundEffects.cardDraw();
            }
        } else {
            // Find playable cards
            const playableCards = GameState.opponentHand.filter(card => 
                this.canPlayCard(card, topCard)
            );
            
            if (playableCards.length > 0) {
                // AI strategy - pick best card to play
                let cardToPlay = playableCards[0];
                
                // Prefer special cards when player has few cards
                if (GameState.playerHand.length <= 3) {
                    const specialCard = playableCards.find(c => c.isSpecial());
                    if (specialCard) cardToPlay = specialCard;
                }
                
                // Check if AI is about to win
                if (GameState.opponentHand.length === 1) {
                    if (cardToPlay.rank === '2' || cardToPlay.rank === '8') {
                        // Draw instead
                        this.addGameLog(`${GameState.opponentName} draws 1 card`, 'opponent');
                        if (GameState.drawPile.length === 0) this.reshuffleDeck();
                        if (GameState.drawPile.length > 0) {
                            GameState.opponentHand.push(GameState.drawPile.pop());
                        }
                        if (this.soundEffects) this.soundEffects.cardDraw();
                    } else {
                        // Play the card
                        this.addGameLog(`${GameState.opponentName} plays ${cardToPlay.toString()}`, 'opponent');
                        await this.delay(300);
                        GameState.discardPile.push(cardToPlay);
                        const index = GameState.opponentHand.indexOf(cardToPlay);
                        GameState.opponentHand.splice(index, 1);
                        
                        // Check for win
                        if (GameState.opponentHand.length === 0) {
                            this.endGame('opponent');
                            GameState.processingAction = false;
                            return;
                        }
                    }
                } else {
                    // Play the card
                    this.addGameLog(`${GameState.opponentName} plays ${cardToPlay.toString()}`, 'opponent');
                    await this.delay(300);
                    GameState.discardPile.push(cardToPlay);
                    const index = GameState.opponentHand.indexOf(cardToPlay);
                    GameState.opponentHand.splice(index, 1);
                    
                    if (cardToPlay.rank === '8') {
                        GameState.currentSuit = this.getAIMostCommonSuit();
                        this.addGameLog(`Suit changed to ${GameState.currentSuit}`, 'special');
                        this.showNotification(`Suit changed to ${GameState.currentSuit}`, 'success');
                    } else {
                        GameState.currentSuit = cardToPlay.suit;
                        this.handleSpecialCard(cardToPlay);
                        
                        // Handle Jack effect
                        if (cardToPlay.rank === 'J') {
                            this.addGameLog(`${GameState.opponentName} plays again!`, 'special');
                            if (this.soundEffects) this.soundEffects.special();
                            GameState.processingAction = false;
                            this.updateUI();
                            setTimeout(() => this.opponentTurn(), 2000);
                            return;
                        }
                    }
                    
                    if (cardToPlay.isSpecial()) {
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
        GameState.mustDrawPenalty = GameState.stackCount > 0;
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
        
        // Create victory animation
        if (winner === 'player') {
            this.createVictoryEffect();
        }
        
        const modal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        if (winner === 'player') {
            modalTitle.textContent = '🎉 VICTORY!';
            modalMessage.textContent = `Congratulations ${GameState.playerName}! You've won this round of Crazy Eights!`;
            this.addGameLog(`${GameState.playerName} WINS!`, 'special');
            if (this.soundEffects) this.soundEffects.win();
        } else {
            modalTitle.textContent = '😔 DEFEAT';
            modalMessage.textContent = `${GameState.opponentName} has won this round. Better luck next time!`;
            this.addGameLog(`${GameState.opponentName} WINS`, 'special');
            if (this.soundEffects) this.soundEffects.error();
        }
        
        // Calculate and display score
        this.displayScore(winner);
        
        setTimeout(() => {
            modal.classList.add('active');
        }, winner === 'player' ? 2000 : 500);
    }
    
    displayScore(winner) {
        const scoreDisplay = document.getElementById('scoreDisplay');
        const scoreDetails = document.getElementById('scoreDetails');
        
        if (scoreDisplay && scoreDetails) {
            let playerScore = 0;
            let opponentScore = 0;
            
            // Calculate scores based on remaining cards
            GameState.playerHand.forEach(card => {
                if (card.rank === '8') playerScore += 50;
                else if (['J', 'Q', 'K'].includes(card.rank)) playerScore += 10;
                else if (card.rank === 'A') playerScore += 1;
                else playerScore += parseInt(card.rank) || 0;
            });
            
            GameState.opponentHand.forEach(card => {
                if (card.rank === '8') opponentScore += 50;
                else if (['J', 'Q', 'K'].includes(card.rank)) opponentScore += 10;
                else if (card.rank === 'A') opponentScore += 1;
                else opponentScore += parseInt(card.rank) || 0;
            });
            
            scoreDetails.innerHTML = `
                <div>${GameState.playerName}: ${playerScore} points</div>
                <div>${GameState.opponentName}: ${opponentScore} points</div>
                <div style="margin-top: 10px; font-weight: bold; color: var(--primary-gold);">
                    Winner gets: ${winner === 'player' ? opponentScore : playerScore} points!
                </div>
            `;
            
            scoreDisplay.style.display = 'block';
        }
    }
    
    createVictoryEffect() {
        const container = document.getElementById('victoryAnimation');
        if (!container) return;
        
        container.classList.add('active');
        
        // Create victory text
        const victoryText = document.createElement('div');
        victoryText.className = 'victory-text';
        victoryText.textContent = 'VICTORY!';
        container.appendChild(victoryText);
        
        // Create particle explosion
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'victory-particle';
                particle.style.left = '50%';
                particle.style.top = '50%';
                
                const angle = (Math.PI * 2 * i) / 50;
                const velocity = 200 + Math.random() * 200;
                
                particle.style.setProperty('--x', `${Math.cos(angle) * velocity}px`);
                particle.style.setProperty('--y', `${Math.sin(angle) * velocity}px`);
                
                container.appendChild(particle);
                setTimeout(() => particle.remove(), 2000);
            }, i * 20);
        }
        
        // Clear after animation
        setTimeout(() => {
            container.innerHTML = '';
            container.classList.remove('active');
        }, 3000);
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
        const menuModal = document.getElementById('menuModal');
        if (modal) modal.classList.remove('active');
        if (menuModal) menuModal.classList.remove('active');
        
        GameState.selectedCards = [];
        GameState.stackCount = 0;
        GameState.currentTurn = 'player';
        GameState.calledGame = false;
        GameState.gameActive = true;
        GameState.playerGoesAgain = false;
        GameState.opponentGoesAgain = false;
        GameState.mustDrawPenalty = false;
        GameState.currentSuit = null;
        GameState.processingAction = false;
        
        this.initDeck();
        this.dealCards();
        
        this.showNotification('New game started!', 'success');
    }
}

// Game Mode Manager
class GameModeManager {
    constructor() {
        this.menuOpen = false;
    }
    
    showMenu() {
        const modal = document.getElementById('menuModal');
        if (modal) {
            modal.classList.add('active');
            this.menuOpen = true;
            
            // Update sound button text
            const soundText = document.getElementById('soundMenuText');
            const soundIcon = document.getElementById('soundMenuIcon');
            if (soundText) soundText.textContent = `SOUND: ${GameState.soundEnabled ? 'ON' : 'OFF'}`;
            if (soundIcon) soundIcon.textContent = GameState.soundEnabled ? '🔊' : '🔇';
        }
    }
    
    closeMenu() {
        const modal = document.getElementById('menuModal');
        if (modal) {
            modal.classList.remove('active');
            this.menuOpen = false;
        }
    }
    
    newGame() {
        this.closeMenu();
        if (game) game.newGame();
    }
    
    changeName() {
        this.closeMenu();
        if (game) game.promptPlayerName();
    }
    
    showMultiplayer() {
        this.closeMenu();
        const lobbyContainer = document.getElementById('lobbyContainer');
        if (lobbyContainer) {
            lobbyContainer.classList.add('active');
            // Initialize multiplayer if available
            if (typeof multiplayer !== 'undefined') {
                multiplayer.connect();
            }
        }
    }
    
    toggleSound() {
        GameState.soundEnabled = !GameState.soundEnabled;
        const soundBtn = document.getElementById('soundBtn');
        const soundText = document.getElementById('soundMenuText');
        const soundIcon = document.getElementById('soundMenuIcon');
        
        if (soundBtn) {
            soundBtn.querySelector('.btn-icon').textContent = GameState.soundEnabled ? '🔊' : '🔇';
        }
        if (soundText) soundText.textContent = `SOUND: ${GameState.soundEnabled ? 'ON' : 'OFF'}`;
        if (soundIcon) soundIcon.textContent = GameState.soundEnabled ? '🔊' : '🔇';
        
        game.showNotification(GameState.soundEnabled ? 'Sound enabled' : 'Sound disabled', 'success');
    }
    
    showRules() {
        const modal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        modalTitle.textContent = '📖 GAME RULES - JAY\'S ULTIMATE EDITION';
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
                    <li>Special cards must follow normal matching rules</li>
                </ul>
                
                <h3 style="color: #d4af37; margin-bottom: 10px;">🃏 Special Cards</h3>
                <div style="display: grid; gap: 8px;">
                    <div><strong>8:</strong> Wild card - choose any suit (can't end with)</div>
                    <div><strong>Jack:</strong> Play again (get another turn)</div>
                    <div><strong>Queen ♠:</strong> Next player draws 5 cards (stackable)</div>
                    <div><strong>2s:</strong> Next player draws 2 cards (stackable)</div>
                </div>
                
                <h3 style="color: #d4af37; margin: 15px 0 10px;">🔥 Stacking</h3>
                <p><strong>Queen♠ + 2s Combo:</strong> Play a 2 on Queen♠ to make it 7 cards, then 9, 11, etc.</p>
                <p><strong>Pure 2s Combo:</strong> Stack 2s to make opponent draw 2, 4, 6, 8+ cards.</p>
                <p>The player who can't continue the stack draws all accumulated cards.</p>
                
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