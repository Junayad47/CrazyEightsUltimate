# Crazy Eights - Ultimate Edition

High-end card game with stunning graphics inspired by Red Dead Redemption and Mafia 3.

## Features
- Stunning 3D graphics with Three.js
- Local and online multiplayer support
- Cross-platform responsive design
- Docker and Vercel deployment ready
- Real-time WebSocket gameplay

## Quick Start

### Local Development:
```bash
npm install
npm start
```

### Docker:
```bash
docker-compose up
```

### Vercel Deployment:
```bash
vercel --prod
```

## Game Controls
- Mouse: Click cards to select/play
- D: Draw card
- P: Play selected cards
- G: Call game

## Rules
- Be first to play all cards
- Must call "GAME" before final card
- Cannot end with 2 or 8
- Special cards: 8 (wild), J (skip), Q♠ (draw 5), 2s (draw 2, stackable)
