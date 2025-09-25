// multiplayer.js - Multiplayer Management System

class MultiplayerManager {
    constructor() {
        this.roomCode = null;
        this.playerId = null;
        this.playerName = null;
        this.isHost = false;
        this.players = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    connect() {
        // Get player name from GameState or prompt
        if (GameState.playerName && GameState.playerName !== 'Player') {
            this.playerName = GameState.playerName;
        } else {
            const savedName = localStorage.getItem('playerName');
            if (savedName) {
                this.playerName = savedName;
                GameState.playerName = savedName;
            } else {
                this.playerName = prompt('Enter your name for online play:') || `Player_${Math.floor(Math.random() * 1000)}`;
                GameState.playerName = this.playerName;
                localStorage.setItem('playerName', this.playerName);
            }
        }
        
        // WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.hostname}:8080`;
        
        try {
            GameState.ws = new WebSocket(wsUrl);
            
            GameState.ws.onopen = () => {
                console.log('Connected to multiplayer server');
                this.reconnectAttempts = 0;
                this.sendMessage({
                    type: 'identify',
                    name: this.playerName
                });
                this.showLobby();
                game.showNotification('Connected to server!', 'success');
            };
            
            GameState.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            };
            
            GameState.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                game.showNotification('Connection error!', 'warning');
                this.handleConnectionError();
            };
            
            GameState.ws.onclose = () => {
                console.log('Disconnected from server');
                game.showNotification('Disconnected from server', 'warning');
                this.handleDisconnect();
            };
            
        } catch (error) {
            console.error('Failed to connect:', error);
            game.showNotification('Failed to connect to server. Playing offline.', 'warning');
            this.playOffline();
        }
    }
    
    handleMessage(data) {
        console.log('Received message:', data);
        
        switch (data.type) {
            case 'connected':
                this.playerId = data.playerId;
                break;
                
            case 'roomCreated':
                this.roomCode = data.roomCode;
                this.isHost = true;
                this.updateRoomDisplay();
                game.showNotification(`Room created: ${this.roomCode}`, 'success');
                break;
                
            case 'roomJoined':
                this.roomCode = data.roomCode;
                this.isHost = false;
                this.updateRoomDisplay();
                game.showNotification(`Joined room: ${this.roomCode}`, 'success');
                break;
                
            case 'roomNotFound':
                game.showNotification('Room not found!', 'warning');
                break;
                
            case 'roomFull':
                game.showNotification('Room is full!', 'warning');
                break;
                
            case 'playerUpdate':
                this.updatePlayerList(data.players);
                break;
                
            case 'gameStart':
                this.startMultiplayerGame(data.gameState);
                break;
                
            case 'gameStateUpdate':
                this.updateGameState(data.gameState);
                break;
                
            case 'turnUpdate':
                GameState.currentTurn = data.currentTurn === this.playerId ? 'player' : 'opponent';
                game.updateUI();
                break;
                
            case 'cardPlayed':
                this.handleOpponentPlay(data);
                break;
                
            case 'cardDrawn':
                this.handleOpponentDraw(data);
                break;
                
            case 'gameEnd':
                this.handleGameEnd(data);
                break;
                
            case 'playerDisconnected':
                game.showNotification(`${data.playerName} disconnected`, 'warning');
                if (data.gameActive) {
                    this.pauseGame();
                }
                break;
                
            case 'error':
                game.showNotification(data.message, 'warning');
                break;
        }
    }
    
    sendMessage(message) {
        if (GameState.ws && GameState.ws.readyState === WebSocket.OPEN) {
            GameState.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }
    
    createRoom() {
        if (!this.sendMessage({ type: 'createRoom' })) {
            game.showNotification('Not connected to server', 'warning');
        }
    }
    
    joinRoom() {
        const roomCode = prompt('Enter room code:');
        if (roomCode) {
            const code = roomCode.toUpperCase().trim();
            if (code.length === 6) {
                if (!this.sendMessage({ 
                    type: 'joinRoom', 
                    roomCode: code 
                })) {
                    game.showNotification('Not connected to server', 'warning');
                }
            } else {
                game.showNotification('Invalid room code format', 'warning');
            }
        }
    }
    
    startGame() {
        if (!this.isHost) {
            game.showNotification('Only the host can start the game', 'warning');
            return;
        }
        
        if (this.players.length < 2) {
            game.showNotification('Need at least 2 players to start', 'warning');
            return;
        }
        
        if (!this.sendMessage({ type: 'startGame' })) {
            game.showNotification('Failed to start game', 'warning');
        }
    }
    
    showLobby() {
        const lobbyContainer = document.getElementById('lobbyContainer');
        if (lobbyContainer) {
            lobbyContainer.classList.add('active');
        }
    }
    
    closeLobby() {
        const lobbyContainer = document.getElementById('lobbyContainer');
        if (lobbyContainer) {
            lobbyContainer.classList.remove('active');
        }
        
        // Leave room if connected
        if (this.roomCode) {
            this.sendMessage({ type: 'leaveRoom' });
            this.roomCode = null;
            this.isHost = false;
            this.players = [];
        }
    }
    
    updateRoomDisplay() {
        const roomInfo = document.getElementById('roomInfo');
        const roomCodeEl = document.getElementById('roomCode');
        
        if (roomInfo && roomCodeEl && this.roomCode) {
            roomInfo.style.display = 'flex';
            roomCodeEl.textContent = this.roomCode;
        }
    }
    
    updatePlayerList(players) {
        this.players = players;
        const playerList = document.getElementById('playerList');
        
        if (!playerList) return;
        
        playerList.innerHTML = '';
        
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            
            let statusText = 'Ready';
            if (player.isHost) statusText = 'Host';
            if (!player.connected) statusText = 'Disconnected';
            
            playerItem.innerHTML = `
                <span class="player-name">
                    ${player.name}
                    ${player.id === this.playerId ? ' (You)' : ''}
                </span>
                <span class="player-status">${statusText}</span>
            `;
            
            playerList.appendChild(playerItem);
        });
    }
    
    startMultiplayerGame(gameState) {
        this.closeLobby();
        
        // Convert server game state to local format
        GameState.playerHand = gameState.hands[this.playerId] || [];
        GameState.opponentHand = new Array(gameState.opponentCardCount || 8).fill(null);
        GameState.discardPile = gameState.discardPile || [];
        GameState.drawPile = new Array(gameState.drawPileCount || 36).fill(null);
        GameState.currentTurn = gameState.currentPlayer === this.playerId ? 'player' : 'opponent';
        GameState.stackCount = gameState.stackCount || 0;
        GameState.gameActive = true;
        
        game.updateUI();
        game.showNotification('Game started!', 'success');
    }
    
    updateGameState(gameState) {
        // Update local game state from server
        if (gameState.hands && gameState.hands[this.playerId]) {
            GameState.playerHand = gameState.hands[this.playerId];
        }
        
        if (gameState.opponentCardCount !== undefined) {
            GameState.opponentHand = new Array(gameState.opponentCardCount).fill(null);
        }
        
        if (gameState.discardPile) {
            GameState.discardPile = gameState.discardPile;
        }
        
        if (gameState.drawPileCount !== undefined) {
            GameState.drawPile = new Array(gameState.drawPileCount).fill(null);
        }
        
        if (gameState.stackCount !== undefined) {
            GameState.stackCount = gameState.stackCount;
        }
        
        game.updateUI();
    }
    
    sendMove(move) {
        if (!this.sendMessage({
            type: 'playCard',
            move: move
        })) {
            game.showNotification('Failed to send move', 'warning');
            return false;
        }
        return true;
    }
    
    sendDraw() {
        if (!this.sendMessage({
            type: 'drawCard'
        })) {
            game.showNotification('Failed to draw card', 'warning');
            return false;
        }
        return true;
    }
    
    sendCallGame() {
        if (!this.sendMessage({
            type: 'callGame'
        })) {
            game.showNotification('Failed to call game', 'warning');
            return false;
        }
        return true;
    }
    
    handleOpponentPlay(data) {
        // Animate opponent playing card
        if (data.card) {
            GameState.discardPile.push(data.card);
            game.handleSpecialCard(data.card);
        }
        
        if (data.opponentCardCount !== undefined) {
            GameState.opponentHand = new Array(data.opponentCardCount).fill(null);
        }
        
        game.updateUI();
        
        if (data.message) {
            game.showNotification(data.message, 'default');
        }
    }
    
    handleOpponentDraw(data) {
        if (data.cardsDrawn) {
            game.showNotification(`Opponent drew ${data.cardsDrawn} card(s)`, 'default');
        }
        
        if (data.opponentCardCount !== undefined) {
            GameState.opponentHand = new Array(data.opponentCardCount).fill(null);
        }
        
        game.updateUI();
    }
    
    handleGameEnd(data) {
        GameState.gameActive = false;
        
        const winner = data.winner === this.playerId ? 'player' : 'opponent';
        game.endGame(winner);
        
        // Return to lobby after game ends
        setTimeout(() => {
            this.showLobby();
        }, 5000);
    }
    
    pauseGame() {
        GameState.gameActive = false;
        game.showNotification('Game paused - waiting for player to reconnect', 'warning');
    }
    
    handleConnectionError() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            game.showNotification(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'warning');
            
            setTimeout(() => {
                this.connect();
            }, 2000 * this.reconnectAttempts);
        } else {
            game.showNotification('Failed to connect. Playing offline.', 'warning');
            this.playOffline();
        }
    }
    
    handleDisconnect() {
        if (GameState.gameActive && this.roomCode) {
            // Try to reconnect if in active game
            this.handleConnectionError();
        } else {
            // Return to offline mode
            this.playOffline();
        }
    }
    
    playOffline() {
        this.closeLobby();
        GameState.gameMode = 'local';
        game.newGame();
    }
    
    // Override game functions for multiplayer
    initMultiplayerHooks() {
        const originalPlayCards = game.playSelectedCards.bind(game);
        const originalDrawCard = game.drawCard.bind(game);
        const originalCallGame = game.callGame.bind(game);
        
        game.playSelectedCards = async () => {
            if (GameState.gameMode === 'online') {
                // Send move to server
                const cardsToPlay = GameState.selectedCards.map(i => GameState.playerHand[i]);
                if (this.sendMove({ cards: cardsToPlay, indices: GameState.selectedCards })) {
                    // Server will handle the actual play
                }
            } else {
                await originalPlayCards();
            }
        };
        
        game.drawCard = () => {
            if (GameState.gameMode === 'online') {
                this.sendDraw();
            } else {
                originalDrawCard();
            }
        };
        
        game.callGame = () => {
            if (GameState.gameMode === 'online') {
                this.sendCallGame();
            } else {
                originalCallGame();
            }
        };
    }
}

// Initialize multiplayer manager
const multiplayer = new MultiplayerManager();
multiplayer.initMultiplayerHooks();