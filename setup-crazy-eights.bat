@echo off
setlocal enabledelayedexpansion
color 0A
cls

echo ========================================
echo   CRAZY EIGHTS ULTIMATE - GAME SETUP
echo   High-End Graphics Card Game Installer
echo ========================================
echo.

:: Create main project directory
set PROJECT_DIR=CrazyEightsUltimate
echo [1/10] Creating project directory: %PROJECT_DIR%
if exist %PROJECT_DIR% (
    echo Directory exists! Backing up old version...
    ren %PROJECT_DIR% %PROJECT_DIR%_backup_%random%
)
mkdir %PROJECT_DIR%
cd %PROJECT_DIR%

:: Create subdirectories
echo [2/10] Creating subdirectories...
mkdir public 2>nul
mkdir src 2>nul

:: Create index.html (Main Game File)
echo [3/10] Creating index.html (Main Game)...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Crazy Eights - Jay's Ultimate Edition^</title^>
echo     ^<style^>
echo         @import url^('https://fonts.googleapis.com/css2?family=Bebas+Neue^&family=Oswald:wght@400;700^&display=swap'^);
echo         * { margin: 0; padding: 0; box-sizing: border-box; }
echo         body { font-family: 'Oswald', sans-serif; background: #0a0a0a; color: #f0e6d2; overflow: hidden; position: relative; height: 100vh; }
echo         #game-canvas { position: fixed; top: 0; left: 0; width: 100%%; height: 100%%; z-index: 1; }
echo         .game-overlay { position: fixed; top: 0; left: 0; width: 100%%; height: 100%%; background: linear-gradient^(180deg, rgba^(139, 69, 19, 0.3^) 0%%, rgba^(0, 0, 0, 0.7^) 50%%, rgba^(139, 69, 19, 0.4^) 100%%^); z-index: 2; pointer-events: none; }
echo         .vignette { position: fixed; top: 0; left: 0; width: 100%%; height: 100%%; background: radial-gradient^(circle, transparent 40%%, rgba^(0, 0, 0, 0.8^) 100%%^); z-index: 3; pointer-events: none; animation: pulse 4s ease-in-out infinite; }
echo         @keyframes pulse { 0%%, 100%% { opacity: 1; } 50%% { opacity: 0.7; } }
echo         .game-container { position: relative; z-index: 10; height: 100vh; display: flex; flex-direction: column; background: url^('data:image/svg+xml,^<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"^>^<rect width="100" height="100" fill="%%23000"/^>^<rect x="0" y="0" width="50" height="50" fill="%%231a1a1a" opacity="0.3"/^>^<rect x="50" y="50" width="50" height="50" fill="%%231a1a1a" opacity="0.3"/^>^</svg^>'^); }
echo         .game-header { background: linear-gradient^(135deg, #2a1810 0%%, #1a0e08 100%%^); padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #8b4513; box-shadow: 0 5px 20px rgba^(139, 69, 19, 0.5^); }
echo         .game-title { font-family: 'Bebas Neue', cursive; font-size: 48px; color: #d4af37; text-shadow: 3px 3px 6px rgba^(0, 0, 0, 0.9^), 0 0 30px rgba^(212, 175, 55, 0.5^); letter-spacing: 3px; animation: flicker 3s infinite; }
echo         @keyframes flicker { 0%%, 100%% { opacity: 1; } 50%% { opacity: 0.9; } }
echo         .game-controls { display: flex; gap: 20px; }
echo         .control-btn { padding: 12px 25px; background: linear-gradient^(135deg, #8b4513 0%%, #654321 100%%^); border: 2px solid #d4af37; color: #f0e6d2; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 10px rgba^(0, 0, 0, 0.5^), inset 0 1px 0 rgba^(255, 255, 255, 0.1^); }
echo         .control-btn:hover { transform: translateY^(-2px^); box-shadow: 0 6px 20px rgba^(212, 175, 55, 0.4^), inset 0 1px 0 rgba^(255, 255, 255, 0.2^); background: linear-gradient^(135deg, #a0522d 0%%, #8b4513 100%%^); }
echo         .game-table { flex: 1; display: flex; flex-direction: column; padding: 20px; position: relative; background: radial-gradient^(ellipse at center, rgba^(46, 25, 14, 0.9^) 0%%, rgba^(0, 0, 0, 0.95^) 70%%^); }
echo         .opponent-area { height: 150px; display: flex; justify-content: center; align-items: center; position: relative; }
echo         .opponent-hand { display: flex; gap: -30px; perspective: 1000px; }
echo         .play-area { flex: 1; display: flex; justify-content: center; align-items: center; position: relative; }
echo         .deck-container { display: flex; gap: 50px; align-items: center; }
echo         .card-pile { width: 120px; height: 180px; position: relative; transform-style: preserve-3d; transition: transform 0.3s ease; }
echo         .card-pile:hover { transform: translateY^(-5px^) rotateY^(5deg^); }
echo         .card { width: 120px; height: 180px; position: absolute; background: linear-gradient^(135deg, #f0e6d2 0%%, #d4c4b0 100%%^); border-radius: 10px; box-shadow: 0 10px 30px rgba^(0, 0, 0, 0.8^), inset 0 1px 0 rgba^(255, 255, 255, 0.5^), inset 0 -1px 0 rgba^(0, 0, 0, 0.3^); display: flex; justify-content: center; align-items: center; font-size: 32px; font-weight: bold; cursor: pointer; transition: all 0.3s cubic-bezier^(0.4, 0, 0.2, 1^); transform-style: preserve-3d; backface-visibility: hidden; border: 2px solid #8b4513; }
echo         .card-back { background: linear-gradient^(135deg, #2a1810 0%%, #1a0e08 100%%^); color: #d4af37; font-family: 'Bebas Neue', cursive; font-size: 24px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 3px solid #d4af37; }
echo         .card-back::before { content: '♠♥♣♦'; font-size: 48px; opacity: 0.3; animation: rotate 10s linear infinite; }
echo         @keyframes rotate { from { transform: rotate^(0deg^); } to { transform: rotate^(360deg^); } }
echo         .card.red { color: #8b0000; }
echo         .card.black { color: #1a1a1a; }
echo         .card:hover { transform: translateY^(-10px^) rotateX^(5deg^) scale^(1.05^); box-shadow: 0 20px 40px rgba^(212, 175, 55, 0.4^), 0 0 60px rgba^(139, 69, 19, 0.3^); }
echo         .card.selected { transform: translateY^(-20px^) scale^(1.1^); box-shadow: 0 25px 50px rgba^(212, 175, 55, 0.6^), 0 0 80px rgba^(212, 175, 55, 0.4^); border-color: #d4af37; }
echo         .player-area { height: 200px; display: flex; flex-direction: column; align-items: center; background: linear-gradient^(0deg, rgba^(46, 25, 14, 0.9^) 0%%, transparent 100%%^); padding: 20px; }
echo         .player-hand { display: flex; gap: 15px; margin-bottom: 20px; perspective: 1000px; }
echo         .player-card { transform-origin: bottom center; animation: dealCard 0.5s ease-out; }
echo         @keyframes dealCard { from { transform: translateY^(-200px^) rotateX^(90deg^); opacity: 0; } to { transform: translateY^(0^) rotateX^(0^); opacity: 1; } }
echo         .action-buttons { display: flex; gap: 20px; }
echo         .action-btn { padding: 15px 30px; background: linear-gradient^(135deg, #8b0000 0%%, #660000 100%%^); border: 2px solid #d4af37; color: #f0e6d2; font-size: 18px; font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba^(0, 0, 0, 0.7^), inset 0 1px 0 rgba^(255, 255, 255, 0.1^); }
echo         .action-btn:hover:not^(:disabled^) { transform: scale^(1.05^); box-shadow: 0 8px 25px rgba^(139, 0, 0, 0.5^), 0 0 40px rgba^(212, 175, 55, 0.3^); }
echo         .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
echo         .action-btn.draw { background: linear-gradient^(135deg, #1a4d2e 0%%, #0f3d0f 100%%^); }
echo         .game-info { position: fixed; right: 20px; top: 50%%; transform: translateY^(-50%%^); background: linear-gradient^(135deg, rgba^(26, 14, 8, 0.95^) 0%%, rgba^(0, 0, 0, 0.95^) 100%%^); border: 2px solid #d4af37; border-radius: 10px; padding: 20px; width: 250px; z-index: 20; box-shadow: 0 10px 40px rgba^(0, 0, 0, 0.8^); }
echo         .info-title { font-family: 'Bebas Neue', cursive; font-size: 24px; color: #d4af37; margin-bottom: 15px; text-align: center; text-shadow: 2px 2px 4px rgba^(0, 0, 0, 0.8^); }
echo         .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba^(212, 175, 55, 0.2^); }
echo         .info-label { color: #a0886c; font-size: 14px; text-transform: uppercase; }
echo         .info-value { color: #f0e6d2; font-weight: bold; font-size: 16px; }
echo         .modal { position: fixed; top: 0; left: 0; width: 100%%; height: 100%%; background: rgba^(0, 0, 0, 0.9^); display: flex; justify-content: center; align-items: center; z-index: 100; opacity: 0; visibility: hidden; transition: all 0.3s ease; }
echo         .modal.active { opacity: 1; visibility: visible; }
echo         .modal-content { background: linear-gradient^(135deg, #2a1810 0%%, #1a0e08 100%%^); border: 3px solid #d4af37; border-radius: 15px; padding: 40px; text-align: center; max-width: 500px; box-shadow: 0 20px 60px rgba^(0, 0, 0, 0.9^), 0 0 100px rgba^(212, 175, 55, 0.3^); transform: scale^(0.8^); transition: transform 0.3s ease; }
echo         .modal.active .modal-content { transform: scale^(1^); }
echo         .modal-title { font-family: 'Bebas Neue', cursive; font-size: 48px; color: #d4af37; margin-bottom: 20px; text-shadow: 3px 3px 6px rgba^(0, 0, 0, 0.8^); }
echo         .lobby-container { display: none; position: fixed; top: 50%%; left: 50%%; transform: translate^(-50%%, -50%%^); background: linear-gradient^(135deg, #2a1810 0%%, #1a0e08 100%%^); border: 3px solid #d4af37; border-radius: 20px; padding: 40px; z-index: 50; box-shadow: 0 20px 80px rgba^(0, 0, 0, 0.9^); width: 600px; max-width: 90%%; }
echo         .lobby-title { font-family: 'Bebas Neue', cursive; font-size: 36px; color: #d4af37; text-align: center; margin-bottom: 30px; }
echo         .player-list { background: rgba^(0, 0, 0, 0.5^); border-radius: 10px; padding: 20px; margin-bottom: 20px; min-height: 200px; }
echo         .player-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: linear-gradient^(90deg, rgba^(212, 175, 55, 0.1^) 0%%, transparent 100%%^); border-left: 3px solid #d4af37; margin-bottom: 10px; }
echo         .player-name { font-size: 18px; color: #f0e6d2; }
echo         .player-status { font-size: 14px; color: #a0886c; text-transform: uppercase; }
echo         .notification { position: fixed; top: 100px; left: 50%%; transform: translateX^(-50%%^) translateY^(-100px^); background: linear-gradient^(135deg, #8b0000 0%%, #660000 100%%^); border: 2px solid #d4af37; padding: 20px 40px; border-radius: 10px; font-size: 20px; font-weight: bold; color: #f0e6d2; z-index: 200; opacity: 0; transition: all 0.5s cubic-bezier^(0.68, -0.55, 0.265, 1.55^); box-shadow: 0 10px 40px rgba^(0, 0, 0, 0.8^); }
echo         .notification.show { transform: translateX^(-50%%^) translateY^(0^); opacity: 1; }
echo         .particle { position: absolute; width: 4px; height: 4px; background: #d4af37; border-radius: 50%%; pointer-events: none; animation: particle 3s ease-out forwards; }
echo         @keyframes particle { 0%% { transform: translate^(0, 0^) scale^(1^); opacity: 1; } 100%% { transform: translate^(var^(--x^), var^(--y^)^) scale^(0^); opacity: 0; } }
echo         @media ^(max-width: 768px^) { .game-title { font-size: 32px; } .card { width: 80px; height: 120px; font-size: 24px; } .player-hand { gap: 10px; } .action-btn { padding: 10px 20px; font-size: 14px; } .game-info { width: 200px; right: 10px; } }
echo         .loading-screen { position: fixed; top: 0; left: 0; width: 100%%; height: 100%%; background: #000; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 1000; transition: opacity 1s ease; }
echo         .loading-screen.hidden { opacity: 0; pointer-events: none; }
echo         .loading-logo { font-family: 'Bebas Neue', cursive; font-size: 72px; color: #d4af37; text-shadow: 0 0 40px rgba^(212, 175, 55, 0.8^), 0 0 80px rgba^(212, 175, 55, 0.4^); animation: loadingPulse 2s ease-in-out infinite; }
echo         @keyframes loadingPulse { 0%%, 100%% { transform: scale^(1^); opacity: 0.8; } 50%% { transform: scale^(1.1^); opacity: 1; } }
echo         .loading-bar { width: 300px; height: 4px; background: rgba^(212, 175, 55, 0.2^); border-radius: 2px; margin-top: 30px; overflow: hidden; }
echo         .loading-progress { height: 100%%; background: linear-gradient^(90deg, #d4af37 0%%, #f0e6d2 100%%^); animation: loadingBar 2s ease-in-out infinite; }
echo         @keyframes loadingBar { 0%% { width: 0%%; } 50%% { width: 70%%; } 100%% { width: 100%%; } }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div class="loading-screen" id="loadingScreen"^>
echo         ^<div class="loading-logo"^>CRAZY EIGHTS^</div^>
echo         ^<div class="loading-bar"^>^<div class="loading-progress"^>^</div^>^</div^>
echo     ^</div^>
echo     ^<canvas id="game-canvas"^>^</canvas^>
echo     ^<div class="game-overlay"^>^</div^>
echo     ^<div class="vignette"^>^</div^>
echo     ^<div class="game-container"^>
echo         ^<header class="game-header"^>
echo             ^<h1 class="game-title"^>🃏 CRAZY EIGHTS^</h1^>
echo             ^<div class="game-controls"^>
echo                 ^<button class="control-btn" onclick="gameMode.showModeSelection^(^)"^>MODE^</button^>
echo                 ^<button class="control-btn" onclick="gameMode.toggleSound^(^)"^>🔊 SOUND^</button^>
echo                 ^<button class="control-btn" onclick="gameMode.showRules^(^)"^>RULES^</button^>
echo             ^</div^>
echo         ^</header^>
echo         ^<div class="game-table"^>
echo             ^<div class="opponent-area"^>^<div class="opponent-hand" id="opponentHand"^>^</div^>^</div^>
echo             ^<div class="play-area"^>
echo                 ^<div class="deck-container"^>
echo                     ^<div class="card-pile" id="drawPile"^>^<div class="card card-back"^>^<div^>DRAW^</div^>^</div^>^</div^>
echo                     ^<div class="card-pile" id="discardPile"^>^</div^>
echo                 ^</div^>
echo             ^</div^>
echo             ^<div class="player-area"^>
echo                 ^<div class="player-hand" id="playerHand"^>^</div^>
echo                 ^<div class="action-buttons"^>
echo                     ^<button class="action-btn draw" onclick="game.drawCard^(^)"^>DRAW CARD^</button^>
echo                     ^<button class="action-btn" onclick="game.playSelectedCards^(^)"^>PLAY CARDS^</button^>
echo                     ^<button class="action-btn" onclick="game.callGame^(^)" id="callGameBtn"^>CALL GAME!^</button^>
echo                 ^</div^>
echo             ^</div^>
echo         ^</div^>
echo         ^<div class="game-info"^>
echo             ^<h3 class="info-title"^>GAME STATUS^</h3^>
echo             ^<div class="info-item"^>^<span class="info-label"^>Turn^</span^>^<span class="info-value" id="currentTurn"^>YOUR TURN^</span^>^</div^>
echo             ^<div class="info-item"^>^<span class="info-label"^>Your Cards^</span^>^<span class="info-value" id="playerCardCount"^>8^</span^>^</div^>
echo             ^<div class="info-item"^>^<span class="info-label"^>Opponent Cards^</span^>^<span class="info-value" id="opponentCardCount"^>8^</span^>^</div^>
echo             ^<div class="info-item"^>^<span class="info-label"^>Draw Pile^</span^>^<span class="info-value" id="drawPileCount"^>36^</span^>^</div^>
echo             ^<div class="info-item"^>^<span class="info-label"^>Stack Count^</span^>^<span class="info-value" id="stackCount"^>0^</span^>^</div^>
echo         ^</div^>
echo     ^</div^>
echo     ^<div class="lobby-container" id="lobbyContainer"^>
echo         ^<h2 class="lobby-title"^>MULTIPLAYER LOBBY^</h2^>
echo         ^<div class="player-list" id="playerList"^>^</div^>
echo         ^<div class="action-buttons" style="justify-content: center;"^>
echo             ^<button class="action-btn" onclick="multiplayer.createRoom^(^)"^>CREATE ROOM^</button^>
echo             ^<button class="action-btn" onclick="multiplayer.joinRoom^(^)"^>JOIN ROOM^</button^>
echo             ^<button class="action-btn draw" onclick="multiplayer.startGame^(^)"^>START GAME^</button^>
echo         ^</div^>
echo     ^</div^>
echo     ^<div class="notification" id="notification"^>^</div^>
echo     ^<div class="modal" id="gameModal"^>
echo         ^<div class="modal-content"^>
echo             ^<h2 class="modal-title" id="modalTitle"^>GAME OVER^</h2^>
echo             ^<p id="modalMessage" style="color: #f0e6d2; font-size: 20px; margin: 20px 0;"^>^</p^>
echo             ^<button class="control-btn" onclick="game.newGame^(^)"^>NEW GAME^</button^>
echo         ^</div^>
echo     ^</div^>
echo     ^<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"^>^</script^>
echo     ^<script^>
echo         const GameState = { deck: [], playerHand: [], opponentHand: [], discardPile: [], drawPile: [], currentTurn: 'player', selectedCards: [], stackCount: 0, gameMode: 'local', calledGame: false, soundEnabled: true, ws: null };
echo         class Card { constructor^(suit, rank, value^) { this.suit = suit; this.rank = rank; this.value = value; this.color = ^(suit === '♥' ^|^| suit === '♦'^) ? 'red' : 'black'; } toString^(^) { return `${this.rank}${this.suit}`; } isSpecial^(^) { return this.rank === '8' ^|^| this.rank === 'J' ^|^| ^(this.rank === 'Q' ^&^& this.suit === '♠'^) ^|^| this.rank === '2'; } }
echo         class CrazyEightsGame {
echo             constructor^(^) { this.initDeck^(^); this.initThreeJS^(^); this.soundEffects = this.createSoundEffects^(^); }
echo             initDeck^(^) { const suits = ['♠', '♥', '♦', '♣']; const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']; const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; GameState.deck = []; for ^(let suit of suits^) { for ^(let i = 0; i ^< ranks.length; i++^) { GameState.deck.push^(new Card^(suit, ranks[i], values[i]^)^); } } }
echo             initThreeJS^(^) {
echo                 const canvas = document.getElementById^('game-canvas'^); const scene = new THREE.Scene^(^); const camera = new THREE.PerspectiveCamera^(75, window.innerWidth / window.innerHeight, 0.1, 1000^); const renderer = new THREE.WebGLRenderer^({ canvas, alpha: true, antialias: true }^);
echo                 renderer.setSize^(window.innerWidth, window.innerHeight^); renderer.setPixelRatio^(window.devicePixelRatio^);
echo                 const ambientLight = new THREE.AmbientLight^(0xd4af37, 0.3^); scene.add^(ambientLight^);
echo                 const directionalLight = new THREE.DirectionalLight^(0xffffff, 0.5^); directionalLight.position.set^(5, 5, 5^); scene.add^(directionalLight^);
echo                 const particleCount = 100; const particles = new THREE.BufferGeometry^(^); const positions = new Float32Array^(particleCount * 3^);
echo                 for ^(let i = 0; i ^< particleCount * 3; i += 3^) { positions[i] = ^(Math.random^(^) - 0.5^) * 50; positions[i + 1] = ^(Math.random^(^) - 0.5^) * 50; positions[i + 2] = ^(Math.random^(^) - 0.5^) * 50; }
echo                 particles.setAttribute^('position', new THREE.BufferAttribute^(positions, 3^)^);
echo                 const particleMaterial = new THREE.PointsMaterial^({ color: 0xd4af37, size: 0.5, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }^);
echo                 const particleSystem = new THREE.Points^(particles, particleMaterial^); scene.add^(particleSystem^); camera.position.z = 15;
echo                 const animate = ^(^) =^> { requestAnimationFrame^(animate^); particleSystem.rotation.y += 0.001; particleSystem.rotation.x += 0.0005; const time = Date.now^(^) * 0.001; particleSystem.position.y = Math.sin^(time^) * 0.5; renderer.render^(scene, camera^); }; animate^(^);
echo                 window.addEventListener^('resize', ^(^) =^> { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix^(^); renderer.setSize^(window.innerWidth, window.innerHeight^); }^);
echo             }
echo             createSoundEffects^(^) {
echo                 const AudioContext = window.AudioContext ^|^| window.webkitAudioContext; const audioContext = new AudioContext^(^);
echo                 const playSound = ^(frequency, duration, type = 'sine'^) =^> {
echo                     if ^(!GameState.soundEnabled^) return;
echo                     const oscillator = audioContext.createOscillator^(^); const gainNode = audioContext.createGain^(^);
echo                     oscillator.connect^(gainNode^); gainNode.connect^(audioContext.destination^);
echo                     oscillator.frequency.value = frequency; oscillator.type = type;
echo                     gainNode.gain.setValueAtTime^(0.3, audioContext.currentTime^); gainNode.gain.exponentialRampToValueAtTime^(0.01, audioContext.currentTime + duration^);
echo                     oscillator.start^(audioContext.currentTime^); oscillator.stop^(audioContext.currentTime + duration^);
echo                 };
echo                 return { cardPlay: ^(^) =^> playSound^(523, 0.1^), cardDraw: ^(^) =^> playSound^(392, 0.1^), special: ^(^) =^> playSound^(784, 0.2, 'square'^), win: ^(^) =^> { playSound^(523, 0.1^); setTimeout^(^(^) =^> playSound^(659, 0.1^), 100^); setTimeout^(^(^) =^> playSound^(784, 0.2^), 200^); }, error: ^(^) =^> playSound^(196, 0.3, 'sawtooth'^) };
echo             }
echo             shuffleDeck^(^) { for ^(let i = GameState.deck.length - 1; i ^> 0; i--^) { const j = Math.floor^(Math.random^(^) * ^(i + 1^)^); [GameState.deck[i], GameState.deck[j]] = [GameState.deck[j], GameState.deck[i]]; } }
echo             dealCards^(^) {
echo                 this.shuffleDeck^(^);
echo                 GameState.playerHand = []; GameState.opponentHand = []; GameState.discardPile = []; GameState.drawPile = [...GameState.deck];
echo                 for ^(let i = 0; i ^< 8; i++^) { GameState.playerHand.push^(GameState.drawPile.pop^(^)^); GameState.opponentHand.push^(GameState.drawPile.pop^(^)^); }
echo                 let startCard; do { startCard = GameState.drawPile.pop^(^); } while ^(startCard.isSpecial^(^)^);
echo                 GameState.discardPile.push^(startCard^); this.updateUI^(^);
echo             }
echo             updateUI^(^) {
echo                 const playerHandEl = document.getElementById^('playerHand'^); playerHandEl.innerHTML = '';
echo                 GameState.playerHand.forEach^(^(card, index^) =^> { const cardEl = document.createElement^('div'^); cardEl.className = `card player-card ${card.color} ${GameState.selectedCards.includes^(index^) ? 'selected' : ''}`; cardEl.textContent = card.toString^(^); cardEl.onclick = ^(^) =^> this.selectCard^(index^); cardEl.style.animationDelay = `${index * 0.1}s`; playerHandEl.appendChild^(cardEl^); }^);
echo                 const opponentHandEl = document.getElementById^('opponentHand'^); opponentHandEl.innerHTML = '';
echo                 GameState.opponentHand.forEach^(^(_, index^) =^> { const cardEl = document.createElement^('div'^); cardEl.className = 'card card-back'; cardEl.style.transform = `rotate^(${^(index - GameState.opponentHand.length/2^) * 5}deg^)`; opponentHandEl.appendChild^(cardEl^); }^);
echo                 const discardPileEl = document.getElementById^('discardPile'^); discardPileEl.innerHTML = '';
echo                 if ^(GameState.discardPile.length ^> 0^) { const topCard = GameState.discardPile[GameState.discardPile.length - 1]; const cardEl = document.createElement^('div'^); cardEl.className = `card ${topCard.color}`; cardEl.textContent = topCard.toString^(^); discardPileEl.appendChild^(cardEl^); }
echo                 document.getElementById^('currentTurn'^).textContent = GameState.currentTurn === 'player' ? 'YOUR TURN' : 'OPPONENT';
echo                 document.getElementById^('playerCardCount'^).textContent = GameState.playerHand.length; document.getElementById^('opponentCardCount'^).textContent = GameState.opponentHand.length;
echo                 document.getElementById^('drawPileCount'^).textContent = GameState.drawPile.length; document.getElementById^('stackCount'^).textContent = GameState.stackCount;
echo                 const callGameBtn = document.getElementById^('callGameBtn'^); callGameBtn.disabled = GameState.playerHand.length ^> 1;
echo             }
echo             selectCard^(index^) {
echo                 if ^(GameState.currentTurn !== 'player'^) return;
echo                 const cardIndex = GameState.selectedCards.indexOf^(index^);
echo                 if ^(cardIndex ^> -1^) { GameState.selectedCards.splice^(cardIndex, 1^); } else {
echo                     if ^(GameState.selectedCards.length ^> 0^) { const firstCard = GameState.playerHand[GameState.selectedCards[0]]; const thisCard = GameState.playerHand[index]; if ^(firstCard.rank === thisCard.rank^) { GameState.selectedCards.push^(index^); } else { this.showNotification^('Cards must have the same rank!'^); this.soundEffects.error^(^); } } else { GameState.selectedCards.push^(index^); }
echo                 }
echo                 this.updateUI^(^);
echo             }
echo             canPlayCard^(card, topCard^) { if ^(card.rank === '8'^) return true; return card.suit === topCard.suit ^|^| card.rank === topCard.rank; }
echo             playSelectedCards^(^) {
echo                 if ^(GameState.currentTurn !== 'player' ^|^| GameState.selectedCards.length === 0^) { this.soundEffects.error^(^); return; }
echo                 const topCard = GameState.discardPile[GameState.discardPile.length - 1]; const cardsToPlay = GameState.selectedCards.map^(i =^> GameState.playerHand[i]^);
echo                 const canPlay = cardsToPlay.every^(card =^> this.canPlayCard^(card, topCard^)^);
echo                 if ^(!canPlay^) { this.showNotification^('Invalid move!'^); this.soundEffects.error^(^); return; }
echo                 if ^(GameState.playerHand.length === cardsToPlay.length^) { const lastCard = cardsToPlay[cardsToPlay.length - 1]; if ^(lastCard.rank === '2' ^|^| lastCard.rank === '8'^) { this.showNotification^('Cannot end with 2 or 8!'^); this.soundEffects.error^(^); return; } if ^(!GameState.calledGame^) { this.showNotification^('You must call "GAME" first!'^); this.soundEffects.error^(^); return; } }
echo                 cardsToPlay.forEach^(card =^> { GameState.discardPile.push^(card^); this.handleSpecialCard^(card^); }^);
echo                 GameState.selectedCards.sort^(^(a, b^) =^> b - a^); GameState.selectedCards.forEach^(index =^> { GameState.playerHand.splice^(index, 1^); }^);
echo                 GameState.selectedCards = [];
echo                 if ^(cardsToPlay.some^(card =^> card.isSpecial^(^)^)^) { this.soundEffects.special^(^); } else { this.soundEffects.cardPlay^(^); }
echo                 if ^(GameState.playerHand.length === 0^) { this.endGame^('player'^); return; }
echo                 GameState.currentTurn = 'opponent'; this.updateUI^(^); setTimeout^(^(^) =^> this.opponentTurn^(^), 1500^);
echo             }
echo             handleSpecialCard^(card^) { if ^(card.rank === 'J'^) { this.showNotification^('Turn skipped!'^); } else if ^(card.rank === 'Q' ^&^& card.suit === '♠'^) { GameState.stackCount += 5; } else if ^(card.rank === '2'^) { GameState.stackCount += 2; } else if ^(card.rank === '8'^) { this.showNotification^('Suit changed!'^); } }
echo             drawCard^(^) {
echo                 if ^(GameState.currentTurn !== 'player'^) return;
echo                 if ^(GameState.stackCount ^> 0^) { for ^(let i = 0; i ^< GameState.stackCount; i++^) { if ^(GameState.drawPile.length === 0^) this.reshuffleDeck^(^); GameState.playerHand.push^(GameState.drawPile.pop^(^)^); } GameState.stackCount = 0; } else { if ^(GameState.drawPile.length === 0^) this.reshuffleDeck^(^); GameState.playerHand.push^(GameState.drawPile.pop^(^)^); }
echo                 this.soundEffects.cardDraw^(^); GameState.currentTurn = 'opponent'; this.updateUI^(^); setTimeout^(^(^) =^> this.opponentTurn^(^), 1500^);
echo             }
echo             reshuffleDeck^(^) { if ^(GameState.discardPile.length ^<= 1^) return; const topCard = GameState.discardPile.pop^(^); GameState.drawPile = GameState.discardPile; GameState.discardPile = [topCard]; for ^(let i = GameState.drawPile.length - 1; i ^> 0; i--^) { const j = Math.floor^(Math.random^(^) * ^(i + 1^)^); [GameState.drawPile[i], GameState.drawPile[j]] = [GameState.drawPile[j], GameState.drawPile[i]]; } }
echo             opponentTurn^(^) {
echo                 if ^(GameState.currentTurn !== 'opponent'^) return;
echo                 const topCard = GameState.discardPile[GameState.discardPile.length - 1];
echo                 if ^(GameState.stackCount ^> 0^) { const stackCard = GameState.opponentHand.find^(card =^> ^(card.rank === '2' ^|^| ^(card.rank === 'Q' ^&^& card.suit === '♠'^)^) ^&^& this.canPlayCard^(card, topCard^)^); if ^(stackCard^) { GameState.discardPile.push^(stackCard^); GameState.opponentHand.splice^(GameState.opponentHand.indexOf^(stackCard^), 1^); this.handleSpecialCard^(stackCard^); this.soundEffects.special^(^); } else { for ^(let i = 0; i ^< GameState.stackCount; i++^) { if ^(GameState.drawPile.length === 0^) this.reshuffleDeck^(^); GameState.opponentHand.push^(GameState.drawPile.pop^(^)^); } GameState.stackCount = 0; this.soundEffects.cardDraw^(^); } } else {
echo                     const playableCards = GameState.opponentHand.filter^(card =^> this.canPlayCard^(card, topCard^)^);
echo                     if ^(playableCards.length ^> 0^) { let cardToPlay; if ^(GameState.playerHand.length ^<= 3^) { cardToPlay = playableCards.find^(card =^> card.isSpecial^(^)^) ^|^| playableCards[0]; } else { cardToPlay = playableCards[0]; } if ^(GameState.opponentHand.length === 1 ^&^& ^(cardToPlay.rank === '2' ^|^| cardToPlay.rank === '8'^)^) { if ^(GameState.drawPile.length === 0^) this.reshuffleDeck^(^); GameState.opponentHand.push^(GameState.drawPile.pop^(^)^); this.soundEffects.cardDraw^(^); } else { GameState.discardPile.push^(cardToPlay^); GameState.opponentHand.splice^(GameState.opponentHand.indexOf^(cardToPlay^), 1^); this.handleSpecialCard^(cardToPlay^); if ^(cardToPlay.isSpecial^(^)^) { this.soundEffects.special^(^); } else { this.soundEffects.cardPlay^(^); } if ^(GameState.opponentHand.length === 0^) { this.endGame^('opponent'^); return; } } } else { if ^(GameState.drawPile.length === 0^) this.reshuffleDeck^(^); GameState.opponentHand.push^(GameState.drawPile.pop^(^)^); this.soundEffects.cardDraw^(^); }
echo                 }
echo                 GameState.currentTurn = 'player'; this.updateUI^(^);
echo             }
echo             callGame^(^) { if ^(GameState.playerHand.length !== 1^) { this.showNotification^('You can only call GAME with 1 card left!'^); this.soundEffects.error^(^); return; } GameState.calledGame = true; this.showNotification^('GAME CALLED!'^); this.soundEffects.special^(^); }
echo             endGame^(winner^) { const modal = document.getElementById^('gameModal'^); const modalTitle = document.getElementById^('modalTitle'^); const modalMessage = document.getElementById^('modalMessage'^); if ^(winner === 'player'^) { modalTitle.textContent = 'VICTORY!'; modalMessage.textContent = 'Congratulations! You won this round!'; this.soundEffects.win^(^); this.createVictoryEffect^(^); } else { modalTitle.textContent = 'DEFEAT'; modalMessage.textContent = 'Better luck next time!'; this.soundEffects.error^(^); } modal.classList.add^('active'^); }
echo             createVictoryEffect^(^) { for ^(let i = 0; i ^< 50; i++^) { const particle = document.createElement^('div'^); particle.className = 'particle'; particle.style.left = '50%%'; particle.style.top = '50%%'; particle.style.setProperty^('--x', `${^(Math.random^(^) - 0.5^) * 200}px`^); particle.style.setProperty^('--y', `${^(Math.random^(^) - 0.5^) * 200}px`^); document.body.appendChild^(particle^); setTimeout^(^(^) =^> particle.remove^(^), 3000^); } }
echo             showNotification^(message^) { const notification = document.getElementById^('notification'^); notification.textContent = message; notification.classList.add^('show'^); setTimeout^(^(^) =^> { notification.classList.remove^('show'^); }, 3000^); }
echo             newGame^(^) { const modal = document.getElementById^('gameModal'^); modal.classList.remove^('active'^); GameState.selectedCards = []; GameState.stackCount = 0; GameState.currentTurn = 'player'; GameState.calledGame = false; this.initDeck^(^); this.dealCards^(^); }
echo         }
echo         class MultiplayerManager {
echo             constructor^(^) { this.roomCode = null; this.playerId = null; this.isHost = false; }
echo             connect^(^) { try { GameState.ws = new WebSocket^('ws://localhost:8080'^); GameState.ws.onopen = ^(^) =^> { console.log^('Connected to multiplayer server'^); this.showLobby^(^); }; GameState.ws.onmessage = ^(event^) =^> { const data = JSON.parse^(event.data^); this.handleMessage^(data^); }; GameState.ws.onerror = ^(error^) =^> { console.error^('WebSocket error:', error^); game.showNotification^('Connection error! Playing offline.'^); }; GameState.ws.onclose = ^(^) =^> { console.log^('Disconnected from server'^); game.showNotification^('Disconnected from server'^); }; } catch ^(error^) { console.error^('Failed to connect:', error^); game.showNotification^('Multiplayer unavailable. Playing offline.'^); } }
echo             handleMessage^(data^) { switch ^(data.type^) { case 'roomCreated': this.roomCode = data.roomCode; this.isHost = true; game.showNotification^(`Room created: ${this.roomCode}`^); break; case 'playerJoined': this.updatePlayerList^(data.players^); break; case 'gameStart': this.startMultiplayerGame^(data.gameState^); break; case 'cardPlayed': this.handleOpponentPlay^(data.card^); break; case 'turnUpdate': GameState.currentTurn = data.currentTurn; game.updateUI^(^); break; } }
echo             createRoom^(^) { if ^(GameState.ws ^&^& GameState.ws.readyState === WebSocket.OPEN^) { GameState.ws.send^(JSON.stringify^({ type: 'createRoom' }^)^); } else { game.showNotification^('Not connected to server'^); } }
echo             joinRoom^(^) { const roomCode = prompt^('Enter room code:'^); if ^(roomCode ^&^& GameState.ws ^&^& GameState.ws.readyState === WebSocket.OPEN^) { GameState.ws.send^(JSON.stringify^({ type: 'joinRoom', roomCode: roomCode }^)^); } }
echo             startGame^(^) { if ^(this.isHost ^&^& GameState.ws ^&^& GameState.ws.readyState === WebSocket.OPEN^) { GameState.ws.send^(JSON.stringify^({ type: 'startGame' }^)^); } else { game.showNotification^('Only the host can start the game'^); } }
echo             showLobby^(^) { const lobbyContainer = document.getElementById^('lobbyContainer'^); lobbyContainer.style.display = 'block'; }
echo             hideLobby^(^) { const lobbyContainer = document.getElementById^('lobbyContainer'^); lobbyContainer.style.display = 'none'; }
echo             updatePlayerList^(players^) { const playerList = document.getElementById^('playerList'^); playerList.innerHTML = ''; players.forEach^(player =^> { const playerItem = document.createElement^('div'^); playerItem.className = 'player-item'; playerItem.innerHTML = `^<span class="player-name"^>${player.name}^</span^>^<span class="player-status"^>${player.status}^</span^>`; playerList.appendChild^(playerItem^); }^); }
echo             startMultiplayerGame^(gameState^) { this.hideLobby^(^); Object.assign^(GameState, gameState^); game.updateUI^(^); }
echo             sendMove^(move^) { if ^(GameState.ws ^&^& GameState.ws.readyState === WebSocket.OPEN^) { GameState.ws.send^(JSON.stringify^({ type: 'playCard', move: move }^)^); } }
echo             handleOpponentPlay^(card^) { GameState.discardPile.push^(card^); game.handleSpecialCard^(card^); game.updateUI^(^); }
echo         }
echo         class GameModeManager {
echo             showModeSelection^(^) { const modal = document.getElementById^('gameModal'^); const modalTitle = document.getElementById^('modalTitle'^); const modalMessage = document.getElementById^('modalMessage'^); modalTitle.textContent = 'SELECT MODE'; modalMessage.innerHTML = `^<button class="control-btn" onclick="gameMode.selectMode^('local'^)"^>LOCAL PLAY^</button^> ^<button class="control-btn" onclick="gameMode.selectMode^('online'^)"^>ONLINE MULTIPLAYER^</button^>`; modal.classList.add^('active'^); }
echo             selectMode^(mode^) { GameState.gameMode = mode; const modal = document.getElementById^('gameModal'^); modal.classList.remove^('active'^); if ^(mode === 'online'^) { multiplayer.connect^(^); } else { game.newGame^(^); } }
echo             toggleSound^(^) { GameState.soundEnabled = !GameState.soundEnabled; const soundBtn = event.target; soundBtn.textContent = GameState.soundEnabled ? '🔊 SOUND' : '🔇 SOUND'; }
echo             showRules^(^) { const modal = document.getElementById^('gameModal'^); const modalTitle = document.getElementById^('modalTitle'^); const modalMessage = document.getElementById^('modalMessage'^); modalTitle.textContent = 'GAME RULES'; modalMessage.innerHTML = `^<div style="text-align: left; max-height: 400px; overflow-y: auto;"^>^<h3 style="color: #d4af37;"^>Goal^</h3^>^<p^>Be the first to play all your cards.^</p^>^<p^>⚠️ Must call "GAME" before playing final card!^</p^>^<p^>🚫 Cannot end with 2 or 8!^</p^>^<h3 style="color: #d4af37; margin-top: 20px;"^>Special Cards^</h3^>^<ul style="list-style: none; padding-left: 0;"^>^<li^>🎱 ^<b^>8^</b^> - Wild card ^(change suit^)^</li^>^<li^>🎭 ^<b^>Jack^</b^> - Skip next player^</li^>^<li^>👑 ^<b^>Queen♠^</b^> - Next player draws 5^</li^>^<li^>✌️ ^<b^>2s^</b^> - Next player draws 2 ^(stackable^)^</li^>^</ul^>^<h3 style="color: #d4af37; margin-top: 20px;"^>Stacking^</h3^>^<p^>Queen♠ and 2s can be stacked to increase draw count!^</p^>^</div^>^<button class="control-btn" onclick="document.getElementById^('gameModal'^).classList.remove^('active'^)"^>CLOSE^</button^>`; modal.classList.add^('active'^); }
echo         }
echo         const game = new CrazyEightsGame^(^); const multiplayer = new MultiplayerManager^(^); const gameMode = new GameModeManager^(^);
echo         window.addEventListener^('load', ^(^) =^> { setTimeout^(^(^) =^> { document.getElementById^('loadingScreen'^).classList.add^('hidden'^); game.newGame^(^); }, 2000^); }^);
echo         document.addEventListener^('keydown', ^(e^) =^> { if ^(e.key === 'd' ^|^| e.key === 'D'^) { game.drawCard^(^); } else if ^(e.key === 'p' ^|^| e.key === 'P'^) { game.playSelectedCards^(^); } else if ^(e.key === 'g' ^|^| e.key === 'G'^) { game.callGame^(^); } }^);
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > index.html

:: Create package.json
echo [4/10] Creating package.json...
(
echo {
echo   "name": "crazy-eights-ultimate",
echo   "version": "1.0.0",
echo   "description": "High-end Crazy Eights card game with multiplayer support",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js",
echo     "dev": "nodemon server.js",
echo     "build": "echo 'No build required for static files'"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "ws": "^8.14.2",
echo     "cors": "^2.8.5",
echo     "uuid": "^9.0.1"
echo   },
echo   "devDependencies": {
echo     "nodemon": "^3.0.1"
echo   },
echo   "engines": {
echo     "node": ">=18.0.0"
echo   }
echo }
) > package.json

:: Create server.js
echo [5/10] Creating server.js...
(
echo const express = require^('express'^);
echo const http = require^('http'^);
echo const WebSocket = require^('ws'^);
echo const { v4: uuidv4 } = require^('uuid'^);
echo const path = require^('path'^);
echo const cors = require^('cors'^);
echo.
echo const app = express^(^);
echo const server = http.createServer^(app^);
echo const wss = new WebSocket.Server^({ server }^);
echo.
echo app.use^(cors^(^)^);
echo app.use^(express.static^('public'^)^);
echo app.use^(express.json^(^)^);
echo.
echo const rooms = new Map^(^);
echo const players = new Map^(^);
echo.
echo app.get^('/', ^(req, res^) =^> {
echo     res.sendFile^(path.join^(__dirname, 'index.html'^)^);
echo }^);
echo.
echo wss.on^('connection', ^(ws^) =^> {
echo     const playerId = uuidv4^(^);
echo     players.set^(playerId, { ws, roomCode: null }^);
echo     
echo     ws.on^('message', ^(message^) =^> {
echo         try {
echo             const data = JSON.parse^(message^);
echo             handleMessage^(playerId, data^);
echo         } catch ^(error^) {
echo             console.error^('Invalid message:', error^);
echo         }
echo     }^);
echo     
echo     ws.on^('close', ^(^) =^> {
echo         const player = players.get^(playerId^);
echo         if ^(player ^&^& player.roomCode^) {
echo             leaveRoom^(playerId, player.roomCode^);
echo         }
echo         players.delete^(playerId^);
echo     }^);
echo }^);
echo.
echo function handleMessage^(playerId, data^) {
echo     const player = players.get^(playerId^);
echo     
echo     switch ^(data.type^) {
echo         case 'createRoom':
echo             createRoom^(playerId^);
echo             break;
echo         case 'joinRoom':
echo             joinRoom^(playerId, data.roomCode^);
echo             break;
echo         case 'startGame':
echo             startGame^(playerId^);
echo             break;
echo         case 'playCard':
echo             handleCardPlay^(playerId, data.move^);
echo             break;
echo     }
echo }
echo.
echo function createRoom^(playerId^) {
echo     const roomCode = Math.random^(^).toString^(36^).substring^(2, 8^).toUpperCase^(^);
echo     const room = {
echo         code: roomCode,
echo         host: playerId,
echo         players: [playerId],
echo         gameState: null
echo     };
echo     
echo     rooms.set^(roomCode, room^);
echo     const player = players.get^(playerId^);
echo     player.roomCode = roomCode;
echo     
echo     player.ws.send^(JSON.stringify^({
echo         type: 'roomCreated',
echo         roomCode: roomCode
echo     }^)^);
echo }
echo.
echo function joinRoom^(playerId, roomCode^) {
echo     const room = rooms.get^(roomCode^);
echo     if ^(!room^) {
echo         players.get^(playerId^).ws.send^(JSON.stringify^({
echo             type: 'error',
echo             message: 'Room not found'
echo         }^)^);
echo         return;
echo     }
echo     
echo     room.players.push^(playerId^);
echo     const player = players.get^(playerId^);
echo     player.roomCode = roomCode;
echo     
echo     broadcastToRoom^(roomCode, {
echo         type: 'playerJoined',
echo         players: room.players.map^(id =^> ^({
echo             id,
echo             name: `Player ${room.players.indexOf^(id^) + 1}`,
echo             status: id === room.host ? 'Host' : 'Ready'
echo         }^)^)
echo     }^);
echo }
echo.
echo function leaveRoom^(playerId, roomCode^) {
echo     const room = rooms.get^(roomCode^);
echo     if ^(!room^) return;
echo     
echo     room.players = room.players.filter^(id =^> id !== playerId^);
echo     
echo     if ^(room.players.length === 0^) {
echo         rooms.delete^(roomCode^);
echo     } else if ^(room.host === playerId^) {
echo         room.host = room.players[0];
echo         broadcastToRoom^(roomCode, {
echo             type: 'hostChanged',
echo             newHost: room.host
echo         }^);
echo     }
echo }
echo.
echo function startGame^(playerId^) {
echo     const player = players.get^(playerId^);
echo     const room = rooms.get^(player.roomCode^);
echo     
echo     if ^(!room ^|^| room.host !== playerId^) return;
echo     
echo     const gameState = createGameState^(room.players^);
echo     room.gameState = gameState;
echo     
echo     broadcastToRoom^(player.roomCode, {
echo         type: 'gameStart',
echo         gameState: gameState
echo     }^);
echo }
echo.
echo function createGameState^(playerIds^) {
echo     const deck = createDeck^(^);
echo     shuffleDeck^(deck^);
echo     
echo     const hands = {};
echo     playerIds.forEach^(id =^> {
echo         hands[id] = [];
echo         for ^(let i = 0; i ^< 8; i++^) {
echo             hands[id].push^(deck.pop^(^)^);
echo         }
echo     }^);
echo     
echo     return {
echo         players: playerIds,
echo         hands: hands,
echo         drawPile: deck,
echo         discardPile: [deck.pop^(^)],
echo         currentPlayer: 0,
echo         stackCount: 0
echo     };
echo }
echo.
echo function createDeck^(^) {
echo     const suits = ['♠', '♥', '♦', '♣'];
echo     const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
echo     const deck = [];
echo     
echo     for ^(let suit of suits^) {
echo         for ^(let rank of ranks^) {
echo             deck.push^({ suit, rank }^);
echo         }
echo     }
echo     
echo     return deck;
echo }
echo.
echo function shuffleDeck^(deck^) {
echo     for ^(let i = deck.length - 1; i ^> 0; i--^) {
echo         const j = Math.floor^(Math.random^(^) * ^(i + 1^)^);
echo         [deck[i], deck[j]] = [deck[j], deck[i]];
echo     }
echo }
echo.
echo function handleCardPlay^(playerId, move^) {
echo     const player = players.get^(playerId^);
echo     const room = rooms.get^(player.roomCode^);
echo     
echo     if ^(!room ^|^| !room.gameState^) return;
echo     
echo     broadcastToRoom^(player.roomCode, {
echo         type: 'cardPlayed',
echo         playerId: playerId,
echo         card: move.card
echo     }^);
echo }
echo.
echo function broadcastToRoom^(roomCode, data^) {
echo     const room = rooms.get^(roomCode^);
echo     if ^(!room^) return;
echo     
echo     room.players.forEach^(playerId =^> {
echo         const player = players.get^(playerId^);
echo         if ^(player ^&^& player.ws.readyState === WebSocket.OPEN^) {
echo             player.ws.send^(JSON.stringify^(data^)^);
echo         }
echo     }^);
echo }
echo.
echo const PORT = process.env.PORT ^|^| 8080;
echo server.listen^(PORT, ^(^) =^> {
echo     console.log^(`Crazy Eights server running on port ${PORT}`^);
echo }^);
) > server.js

:: Create Dockerfile
echo [6/10] Creating Dockerfile...
(
echo FROM node:18-alpine
echo.
echo WORKDIR /app
echo.
echo COPY package*.json ./
echo.
echo RUN npm ci --only=production
echo.
echo COPY . .
echo.
echo RUN mkdir -p public
echo.
echo COPY index.html public/
echo.
echo EXPOSE 8080
echo.
echo CMD ["node", "server.js"]
) > Dockerfile

:: Create docker-compose.yml
echo [7/10] Creating docker-compose.yml...
(
echo version: '3.8'
echo.
echo services:
echo   game:
echo     build: .
echo     ports:
echo       - "8080:8080"
echo     environment:
echo       - NODE_ENV=production
echo       - PORT=8080
echo     restart: unless-stopped
echo     volumes:
echo       - ./public:/app/public
echo     networks:
echo       - game-network
echo.
echo networks:
echo   game-network:
echo     driver: bridge
) > docker-compose.yml

:: Create vercel.json
echo [8/10] Creating vercel.json...
(
echo {
echo   "version": 2,
echo   "builds": [
echo     {
echo       "src": "server.js",
echo       "use": "@vercel/node"
echo     },
echo     {
echo       "src": "index.html",
echo       "use": "@vercel/static"
echo     }
echo   ],
echo   "routes": [
echo     {
echo       "src": "/ws",
echo       "dest": "/server.js"
echo     },
echo     {
echo       "src": "/^(.*^)",
echo       "dest": "/index.html"
echo     }
echo   ]
echo }
) > vercel.json

:: Create .dockerignore
echo [9/10] Creating .dockerignore...
(
echo node_modules
echo npm-debug.log
echo .git
echo .gitignore
echo README.md
echo .env
echo .DS_Store
) > .dockerignore

:: Create .env.example
echo [10/10] Creating .env.example...
(
echo NODE_ENV=production
echo PORT=8080
echo WS_URL=ws://localhost:8080
) > .env.example

:: Create README.md
echo Creating README.md...
(
echo # Crazy Eights - Ultimate Edition
echo.
echo High-end card game with stunning graphics inspired by Red Dead Redemption and Mafia 3.
echo.
echo ## Features
echo - Stunning 3D graphics with Three.js
echo - Local and online multiplayer support
echo - Cross-platform responsive design
echo - Docker and Vercel deployment ready
echo - Real-time WebSocket gameplay
echo.
echo ## Quick Start
echo.
echo ### Local Development:
echo ```bash
echo npm install
echo npm start
echo ```
echo.
echo ### Docker:
echo ```bash
echo docker-compose up
echo ```
echo.
echo ### Vercel Deployment:
echo ```bash
echo vercel --prod
echo ```
echo.
echo ## Game Controls
echo - Mouse: Click cards to select/play
echo - D: Draw card
echo - P: Play selected cards
echo - G: Call game
echo.
echo ## Rules
echo - Be first to play all cards
echo - Must call "GAME" before final card
echo - Cannot end with 2 or 8
echo - Special cards: 8 ^(wild^), J ^(skip^), Q♠ ^(draw 5^), 2s ^(draw 2, stackable^)
) > README.md

echo.
echo ========================================
echo   SETUP COMPLETE! 
echo ========================================
echo.

:: Ask user if they want to install dependencies
echo Do you want to install Node.js dependencies now?
echo [1] Yes - Install and run locally
echo [2] Yes - Install only
echo [3] No - Manual setup later
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Installing dependencies...
    call npm install
    echo.
    echo Starting game server...
    echo.
    echo ========================================
    echo   Game is running at http://localhost:8080
    echo   Press Ctrl+C to stop the server
    echo ========================================
    echo.
    npm start
) else if "%choice%"=="2" (
    echo.
    echo Installing dependencies...
    call npm install
    echo.
    echo Dependencies installed! Run 'npm start' to launch the game.
) else (
    echo.
    echo Setup complete! To start the game:
    echo 1. Run 'npm install' to install dependencies
    echo 2. Run 'npm start' to launch the game
    echo 3. Open http://localhost:8080 in your browser
)

echo.
echo ========================================
echo   Additional Commands:
echo ========================================
echo.
echo Local Development:
echo   npm start              - Start the game server
echo   npm run dev            - Start with auto-reload
echo.
echo Docker:
echo   docker build -t crazy-eights .    - Build Docker image
echo   docker-compose up                 - Run with Docker Compose
echo.
echo Vercel:
echo   vercel login           - Login to Vercel
echo   vercel --prod          - Deploy to production
echo.
echo ========================================
echo.
pause