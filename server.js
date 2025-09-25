// server.js - Crazy Eights Multiplayer Server

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.static('.'));
app.use(express.json());

// Game rooms and players storage
const rooms = new Map();
const players = new Map();

// Card class (server-side)
class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
        this.color = (suit === '♥' || suit === '♦') ? 'red' : 'black';
    }
    
    isSpecial() {
        return this.rank === '8' || this.rank === 'J' || 
               (this.rank === 'Q' && this.suit === '♠') || 
               this.rank === '2';
    }
}

// Room class
class GameRoom {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.players = [hostId];
        this.maxPlayers = 4;
        this.gameState = null;
        this.gameActive = false;
        this.currentPlayerIndex = 0;
        this.turnTimer = null;
        this.turnTimeLimit = 30000; // 30 seconds per turn
    }
    
    addPlayer(playerId) {
        if (this.players.length >= this.maxPlayers) {
            return false;
        }
        if (!this.players.includes(playerId)) {
            this.players.push(playerId);
        }
        return true;
    }
    
    removePlayer(playerId) {
        const index = this.players.indexOf(playerId);
        if (index > -1) {
            this.players.splice(index, 1);
            
            // Update host if needed
            if (this.hostId === playerId && this.players.length > 0) {
                this.hostId = this.players[0];
            }
            
            // Adjust current player index if needed
            if (this.gameActive && index <= this.currentPlayerIndex) {
                this.currentPlayerIndex = Math.max(0, this.currentPlayerIndex - 1);
            }
        }
        
        return this.players.length === 0;
    }
    
    startGame() {
        if (this.players.length < 2) {
            return false;
        }
        
        this.gameState = this.createGameState();
        this.gameActive = true;
        this.currentPlayerIndex = 0;
        this.startTurnTimer();
        
        return true;
    }
    
    createGameState() {
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        
        const hands = {};
        const drawPile = [...deck];
        
        // Deal 8 cards to each player
        this.players.forEach(playerId => {
            hands[playerId] = [];
            for (let i = 0; i < 8; i++) {
                hands[playerId].push(drawPile.pop());
            }
        });
        
        // Start discard pile with non-special card
        let startCard;
        do {
            startCard = drawPile.pop();
        } while (startCard.isSpecial());
        
        return {
            hands: hands,
            drawPile: drawPile,
            discardPile: [startCard],
            stackCount: 0,
            calledGame: {},
            skipNext: false,
            currentSuit: startCard.suit
        };
    }
    
    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        
        const deck = [];
        for (let suit of suits) {
            for (let i = 0; i < ranks.length; i++) {
                deck.push(new Card(suit, ranks[i], values[i]));
            }
        }
        
        return deck;
    }
    
    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    nextTurn() {
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // Handle skip if Jack was played
        if (this.gameState.skipNext) {
            this.gameState.skipNext = false;
            // Skip this player and move to next
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            
            // Notify players about skip
            this.broadcastToRoom({
                type: 'turnSkipped',
                playerId: this.players[(this.currentPlayerIndex - 1 + this.players.length) % this.players.length],
                message: 'Turn skipped by Jack!'
            });
        }
        
        this.startTurnTimer();
    }
    
    startTurnTimer() {
        this.clearTurnTimer();
        
        this.turnTimer = setTimeout(() => {
            // Auto-draw if player doesn't make a move
            this.handleTimeout();
        }, this.turnTimeLimit);
    }
    
    clearTurnTimer() {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
    }
    
    handleTimeout() {
        const currentPlayer = this.getCurrentPlayer();
        
        // Force draw for timeout
        this.drawCards(currentPlayer, 1);
        this.nextTurn();
        
        // Notify all players
        this.broadcastToRoom({
            type: 'turnTimeout',
            playerId: currentPlayer,
            message: 'Turn timed out - card drawn automatically'
        });
    }
    
    canPlayCard(card, topCard) {
        if (card.rank === '8') return true;
        return card.suit === this.gameState.currentSuit || card.rank === topCard.rank;
    }
    
    playCards(playerId, cards) {
        if (this.getCurrentPlayer() !== playerId) {
            return { success: false, error: 'Not your turn' };
        }
        
        const hand = this.gameState.hands[playerId];
        const topCard = this.gameState.discardPile[this.gameState.discardPile.length - 1];
        
        // Validate all cards have same rank for multiple play
        if (cards.length > 1) {
            const firstRank = cards[0].rank;
            if (!cards.every(card => card.rank === firstRank)) {
                return { success: false, error: 'Multiple cards must have same rank' };
            }
        }
        
        // Validate cards exist in hand
        const validCards = cards.every(card => 
            hand.some(handCard => 
                handCard.suit === card.suit && handCard.rank === card.rank
            )
        );
        
        if (!validCards) {
            return { success: false, error: 'Invalid cards' };
        }
        
        // Check if at least first card can be played
        if (!this.canPlayCard(cards[0], topCard)) {
            return { success: false, error: 'Cards cannot be played' };
        }
        
        // Check end game restrictions
        if (hand.length === cards.length) {
            const lastCard = cards[cards.length - 1];
            
            if (lastCard.rank === '2' || lastCard.rank === '8') {
                return { success: false, error: 'Cannot end with 2 or 8' };
            }
            
            if (!this.gameState.calledGame[playerId]) {
                return { success: false, error: 'Must call game first' };
            }
        }
        
        // Play the cards
        cards.forEach(card => {
            // Remove from hand
            const index = hand.findIndex(handCard => 
                handCard.suit === card.suit && handCard.rank === card.rank
            );
            if (index > -1) {
                hand.splice(index, 1);
            }
            
            // Add to discard pile
            this.gameState.discardPile.push(card);
            
            // Handle special cards
            this.handleSpecialCard(card);
        });
        
        // Update current suit for wild 8
        if (cards.some(card => card.rank === '8')) {
            // In a real game, player would choose suit
            // For simplicity, using the most common suit in hand
            this.gameState.currentSuit = this.getMostCommonSuit(playerId);
        } else {
            this.gameState.currentSuit = cards[cards.length - 1].suit;
        }
        
        // Check for win
        if (hand.length === 0) {
            this.endGame(playerId);
            return { success: true, winner: playerId };
        }
        
        this.nextTurn();
        return { success: true };
    }
    
    handleSpecialCard(card) {
        if (card.rank === 'J') {
            this.gameState.skipNext = true;
        } else if (card.rank === 'Q' && card.suit === '♠') {
            this.gameState.stackCount += 5;
        } else if (card.rank === '2') {
            this.gameState.stackCount += 2;
        }
    }
    
    getMostCommonSuit(playerId) {
        const hand = this.gameState.hands[playerId];
        const suitCounts = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };
        
        hand.forEach(card => {
            suitCounts[card.suit]++;
        });
        
        return Object.entries(suitCounts).reduce((a, b) => 
            suitCounts[a[0]] > suitCounts[b[0]] ? a : b
        )[0];
    }
    
    drawCards(playerId, count = 1) {
        if (this.getCurrentPlayer() !== playerId && count === 1) {
            return { success: false, error: 'Not your turn' };
        }
        
        const hand = this.gameState.hands[playerId];
        
        // Handle stacked draw
        if (this.gameState.stackCount > 0) {
            count = this.gameState.stackCount;
            this.gameState.stackCount = 0;
        }
        
        for (let i = 0; i < count; i++) {
            if (this.gameState.drawPile.length === 0) {
                this.reshuffleDeck();
            }
            
            if (this.gameState.drawPile.length > 0) {
                hand.push(this.gameState.drawPile.pop());
            }
        }
        
        this.nextTurn();
        return { success: true, cardsDrawn: count };
    }
    
    reshuffleDeck() {
        if (this.gameState.discardPile.length <= 1) return;
        
        const topCard = this.gameState.discardPile.pop();
        this.gameState.drawPile = this.gameState.discardPile;
        this.gameState.discardPile = [topCard];
        
        this.shuffleDeck(this.gameState.drawPile);
    }
    
    callGame(playerId) {
        const hand = this.gameState.hands[playerId];
        
        if (hand.length !== 1) {
            return { success: false, error: 'Can only call game with 1 card' };
        }
        
        this.gameState.calledGame[playerId] = true;
        return { success: true };
    }
    
    endGame(winnerId) {
        this.gameActive = false;
        this.clearTurnTimer();
        
        // Calculate scores
        const scores = {};
        this.players.forEach(playerId => {
            const hand = this.gameState.hands[playerId];
            let score = 0;
            
            hand.forEach(card => {
                if (card.rank === '8') score += 50;
                else if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') score += 10;
                else if (card.rank === 'A') score += 1;
                else score += parseInt(card.rank) || 0;
            });
            
            scores[playerId] = score;
        });
        
        return { winner: winnerId, scores: scores };
    }
    
    broadcastToRoom(data) {
        this.players.forEach(playerId => {
            const player = players.get(playerId);
            if (player && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify(data));
            }
        });
    }
    
    getPublicGameState(playerId) {
        if (!this.gameState) return null;
        
        // Return game state with only the requesting player's hand visible
        return {
            hands: { [playerId]: this.gameState.hands[playerId] },
            opponentCardCount: this.getOpponentCardCount(playerId),
            drawPileCount: this.gameState.drawPile.length,
            discardPile: this.gameState.discardPile,
            stackCount: this.gameState.stackCount,
            currentPlayer: this.getCurrentPlayer(),
            players: this.players,
            currentSuit: this.gameState.currentSuit
        };
    }
    
    getOpponentCardCount(playerId) {
        let maxCards = 0;
        this.players.forEach(id => {
            if (id !== playerId) {
                maxCards = Math.max(maxCards, this.gameState.hands[id].length);
            }
        });
        return maxCards;
    }
}

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        players: players.size,
        rooms: rooms.size
    });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    const playerId = uuidv4();
    const player = {
        id: playerId,
        ws: ws,
        name: `Player_${playerId.substring(0, 6)}`,
        roomCode: null,
        connected: true
    };
    
    players.set(playerId, player);
    
    console.log(`Player connected: ${playerId}`);
    
    // Send connection confirmation
    ws.send(JSON.stringify({
        type: 'connected',
        playerId: playerId
    }));
    
    // Handle messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(playerId, data);
        } catch (error) {
            console.error('Invalid message from', playerId, error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });
    
    // Handle disconnect
    ws.on('close', () => {
        console.log(`Player disconnected: ${playerId}`);
        handleDisconnect(playerId);
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error(`WebSocket error for ${playerId}:`, error);
    });
});

// Message handler
function handleMessage(playerId, data) {
    const player = players.get(playerId);
    if (!player) return;
    
    console.log(`Message from ${playerId}:`, data.type);
    
    switch (data.type) {
        case 'identify':
            player.name = data.name || player.name;
            break;
            
        case 'createRoom':
            createRoom(playerId);
            break;
            
        case 'joinRoom':
            joinRoom(playerId, data.roomCode);
            break;
            
        case 'leaveRoom':
            leaveRoom(playerId);
            break;
            
        case 'startGame':
            startGame(playerId);
            break;
            
        case 'playCard':
            handlePlayCard(playerId, data.move);
            break;
            
        case 'drawCard':
            handleDrawCard(playerId);
            break;
            
        case 'callGame':
            handleCallGame(playerId);
            break;
            
        case 'ping':
            player.ws.send(JSON.stringify({ type: 'pong' }));
            break;
    }
}

// Room management functions
function createRoom(playerId) {
    const player = players.get(playerId);
    if (!player) return;
    
    // Generate unique room code
    let roomCode;
    do {
        roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (rooms.has(roomCode));
    
    // Create room
    const room = new GameRoom(roomCode, playerId);
    rooms.set(roomCode, room);
    
    // Update player
    player.roomCode = roomCode;
    
    // Send confirmation
    player.ws.send(JSON.stringify({
        type: 'roomCreated',
        roomCode: roomCode
    }));
    
    // Send player update
    updateRoomPlayers(roomCode);
    
    console.log(`Room created: ${roomCode} by ${playerId}`);
}

function joinRoom(playerId, roomCode) {
    const player = players.get(playerId);
    if (!player) return;
    
    const room = rooms.get(roomCode);
    if (!room) {
        player.ws.send(JSON.stringify({
            type: 'roomNotFound',
            message: 'Room not found'
        }));
        return;
    }
    
    if (!room.addPlayer(playerId)) {
        player.ws.send(JSON.stringify({
            type: 'roomFull',
            message: 'Room is full'
        }));
        return;
    }
    
    // Update player
    player.roomCode = roomCode;
    
    // Send confirmation
    player.ws.send(JSON.stringify({
        type: 'roomJoined',
        roomCode: roomCode
    }));
    
    // Update all players
    updateRoomPlayers(roomCode);
    
    console.log(`Player ${playerId} joined room ${roomCode}`);
}

function leaveRoom(playerId) {
    const player = players.get(playerId);
    if (!player || !player.roomCode) return;
    
    const room = rooms.get(player.roomCode);
    if (!room) return;
    
    const roomCode = player.roomCode;
    const isEmpty = room.removePlayer(playerId);
    
    // Clean up empty room
    if (isEmpty) {
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted (empty)`);
    } else {
        updateRoomPlayers(roomCode);
    }
    
    player.roomCode = null;
    
    console.log(`Player ${playerId} left room ${roomCode}`);
}

function startGame(playerId) {
    const player = players.get(playerId);
    if (!player || !player.roomCode) return;
    
    const room = rooms.get(player.roomCode);
    if (!room) return;
    
    // Check if player is host
    if (room.hostId !== playerId) {
        player.ws.send(JSON.stringify({
            type: 'error',
            message: 'Only host can start the game'
        }));
        return;
    }
    
    // Start game
    if (!room.startGame()) {
        player.ws.send(JSON.stringify({
            type: 'error',
            message: 'Need at least 2 players to start'
        }));
        return;
    }
    
    // Send game state to all players
    room.players.forEach(id => {
        const p = players.get(id);
        if (p && p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(JSON.stringify({
                type: 'gameStart',
                gameState: room.getPublicGameState(id)
            }));
        }
    });
    
    console.log(`Game started in room ${player.roomCode}`);
}

function handlePlayCard(playerId, move) {
    const player = players.get(playerId);
    if (!player || !player.roomCode) return;
    
    const room = rooms.get(player.roomCode);
    if (!room || !room.gameActive) return;
    
    // Process the move
    const result = room.playCards(playerId, move.cards);
    
    if (result.success) {
        // Update all players
        room.players.forEach(id => {
            const p = players.get(id);
            if (p && p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(JSON.stringify({
                    type: 'gameStateUpdate',
                    gameState: room.getPublicGameState(id)
                }));
                
                if (result.winner) {
                    p.ws.send(JSON.stringify({
                        type: 'gameEnd',
                        winner: result.winner,
                        scores: result.scores
                    }));
                }
            }
        });
    } else {
        player.ws.send(JSON.stringify({
            type: 'error',
            message: result.error
        }));
    }
}

function handleDrawCard(playerId) {
    const player = players.get(playerId);
    if (!player || !player.roomCode) return;
    
    const room = rooms.get(player.roomCode);
    if (!room || !room.gameActive) return;
    
    const result = room.drawCards(playerId);
    
    if (result.success) {
        // Update all players
        room.players.forEach(id => {
            const p = players.get(id);
            if (p && p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(JSON.stringify({
                    type: 'gameStateUpdate',
                    gameState: room.getPublicGameState(id)
                }));
                
                if (id !== playerId) {
                    p.ws.send(JSON.stringify({
                        type: 'cardDrawn',
                        playerId: playerId,
                        cardsDrawn: result.cardsDrawn
                    }));
                }
            }
        });
    } else {
        player.ws.send(JSON.stringify({
            type: 'error',
            message: result.error
        }));
    }
}

function handleCallGame(playerId) {
    const player = players.get(playerId);
    if (!player || !player.roomCode) return;
    
    const room = rooms.get(player.roomCode);
    if (!room || !room.gameActive) return;
    
    const result = room.callGame(playerId);
    
    if (result.success) {
        room.broadcastToRoom({
            type: 'gameCall',
            playerId: playerId,
            message: `${player.name} called GAME!`
        });
    } else {
        player.ws.send(JSON.stringify({
            type: 'error',
            message: result.error
        }));
    }
}

function handleDisconnect(playerId) {
    const player = players.get(playerId);
    if (!player) return;
    
    // Mark as disconnected
    player.connected = false;
    
    // Handle room cleanup
    if (player.roomCode) {
        const room = rooms.get(player.roomCode);
        if (room) {
            // Notify other players
            room.players.forEach(id => {
                if (id !== playerId) {
                    const p = players.get(id);
                    if (p && p.ws.readyState === WebSocket.OPEN) {
                        p.ws.send(JSON.stringify({
                            type: 'playerDisconnected',
                            playerId: playerId,
                            playerName: player.name,
                            gameActive: room.gameActive
                        }));
                    }
                }
            });
            
            // Give player 30 seconds to reconnect
            setTimeout(() => {
                const p = players.get(playerId);
                if (p && !p.connected) {
                    leaveRoom(playerId);
                    players.delete(playerId);
                }
            }, 30000);
        }
    } else {
        // Remove immediately if not in room
        players.delete(playerId);
    }
}

function updateRoomPlayers(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    const playerList = room.players.map(id => {
        const p = players.get(id);
        return {
            id: id,
            name: p ? p.name : 'Unknown',
            isHost: id === room.hostId,
            connected: p ? p.connected : false
        };
    });
    
    room.broadcastToRoom({
        type: 'playerUpdate',
        players: playerList
    });
}

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Crazy Eights server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    
    // Notify all players
    players.forEach(player => {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify({
                type: 'serverShutdown',
                message: 'Server is shutting down'
            }));
        }
    });
    
    wss.close(() => {
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
});