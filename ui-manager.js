// ui-manager.js - UI Management and Animations

class UIManager {
    constructor() {
        this.animations = {
            cardDeal: 500,
            cardPlay: 300,
            cardHover: 200,
            notification: 3000
        };
        
        this.init();
    }
    
    init() {
        this.setupResponsiveLayout();
        this.setupTouchSupport();
        this.setupDragAndDrop();
        this.setupAnimations();
        this.setupAccessibility();
    }
    
    setupResponsiveLayout() {
        // Adjust layout based on screen size
        const adjustLayout = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const gameTable = document.querySelector('.game-table');
            
            if (width < 768) {
                // Mobile layout
                this.setupMobileLayout();
            } else if (width < 1200) {
                // Tablet layout
                this.setupTabletLayout();
            } else {
                // Desktop layout
                this.setupDesktopLayout();
            }
            
            // Adjust card sizes based on available space
            this.adjustCardSizes();
        };
        
        window.addEventListener('resize', debounce(adjustLayout, 250));
        adjustLayout();
    }
    
    setupMobileLayout() {
        const playerHand = document.querySelector('.player-hand-container');
        if (playerHand) {
            playerHand.style.maxWidth = '100%';
            playerHand.style.overflowX = 'auto';
        }
        
        // Stack action buttons vertically on mobile
        const actionButtons = document.querySelector('.action-buttons');
        if (actionButtons && window.innerWidth < 480) {
            actionButtons.style.flexDirection = 'column';
        }
    }
    
    setupTabletLayout() {
        const sidePanel = document.querySelector('.side-panel');
        if (sidePanel) {
            sidePanel.style.display = 'none';
        }
    }
    
    setupDesktopLayout() {
        const sidePanel = document.querySelector('.side-panel');
        if (sidePanel && window.innerWidth >= 1200) {
            sidePanel.style.display = 'block';
        }
    }
    
    adjustCardSizes() {
        const container = document.querySelector('.player-hand-container');
        if (!container) return;
        
        const availableWidth = container.offsetWidth;
        const cardCount = GameState.playerHand.length;
        const baseCardWidth = 110;
        const minCardWidth = 60;
        const cardGap = 15;
        
        const totalNeededWidth = (cardCount * baseCardWidth) + ((cardCount - 1) * cardGap);
        
        if (totalNeededWidth > availableWidth && cardCount > 0) {
            const newCardWidth = Math.max(
                minCardWidth,
                Math.floor((availableWidth - ((cardCount - 1) * cardGap)) / cardCount)
            );
            
            const cards = container.querySelectorAll('.card');
            cards.forEach(card => {
                card.style.width = `${newCardWidth}px`;
                card.style.height = `${newCardWidth * 1.45}px`;
                
                // Adjust font size proportionally
                const fontSize = Math.max(16, Math.floor(newCardWidth * 0.3));
                card.style.fontSize = `${fontSize}px`;
            });
        }
    }
    
    setupTouchSupport() {
        if ('ontouchstart' in window) {
            document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
            document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
            document.addEventListener('touchend', this.handleTouchEnd.bind(this));
            
            // Add touch-friendly class
            document.body.classList.add('touch-device');
            
            // Increase touch target sizes
            const style = document.createElement('style');
            style.textContent = `
                .touch-device .card {
                    min-width: 70px;
                    min-height: 100px;
                }
                .touch-device .action-btn {
                    min-height: 50px;
                    min-width: 120px;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchStartTime = Date.now();
    }
    
    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        const deltaX = touchX - this.touchStartX;
        const deltaY = touchY - this.touchStartY;
        
        // Detect swipe for scrolling player hand
        const playerHand = document.querySelector('.player-hand-container');
        if (playerHand && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            playerHand.scrollLeft -= deltaX * 0.5;
        }
    }
    
    handleTouchEnd(e) {
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - this.touchStartTime;
        
        // Quick tap for card selection
        if (touchDuration < 200) {
            const target = e.target;
            if (target.classList.contains('card')) {
                target.click();
            }
        }
        
        this.touchStartX = null;
        this.touchStartY = null;
    }
    
    setupDragAndDrop() {
        // Enable drag and drop for cards
        const enableCardDrag = () => {
            const playerCards = document.querySelectorAll('.player-card');
            const discardPile = document.getElementById('discardPile');
            
            playerCards.forEach(card => {
                card.draggable = true;
                
                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('cardIndex', Array.from(playerCards).indexOf(card));
                    card.classList.add('dragging');
                });
                
                card.addEventListener('dragend', () => {
                    card.classList.remove('dragging');
                });
            });
            
            if (discardPile) {
                discardPile.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    discardPile.classList.add('drag-over');
                });
                
                discardPile.addEventListener('dragleave', () => {
                    discardPile.classList.remove('drag-over');
                });
                
                discardPile.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const cardIndex = parseInt(e.dataTransfer.getData('cardIndex'));
                    discardPile.classList.remove('drag-over');
                    
                    // Select and play the dragged card
                    if (!isNaN(cardIndex)) {
                        GameState.selectedCards = [cardIndex];
                        game.playSelectedCards();
                    }
                });
            }
        };
        
        // Re-enable drag and drop after UI updates
        const observer = new MutationObserver(() => {
            enableCardDrag();
        });
        
        const playerHand = document.getElementById('playerHand');
        if (playerHand) {
            observer.observe(playerHand, { childList: true });
        }
        
        // Add drag styles
        const style = document.createElement('style');
        style.textContent = `
            .dragging {
                opacity: 0.5;
                transform: rotate(5deg);
            }
            .drag-over {
                border: 3px dashed #d4af37 !important;
                background: rgba(212, 175, 55, 0.1) !important;
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);
    }
    
    setupAnimations() {
        // Add smooth animations for card movements
        this.addCardAnimations();
        this.addButtonAnimations();
        this.addTransitionEffects();
    }
    
    addCardAnimations() {
        // Stagger card dealing animation
        const dealCards = () => {
            const playerCards = document.querySelectorAll('.player-card');
            playerCards.forEach((card, index) => {
                card.style.animation = `dealCard ${this.animations.cardDeal}ms ease-out`;
                card.style.animationDelay = `${index * 50}ms`;
                card.style.animationFillMode = 'backwards';
            });
        };
        
        // Observe for new cards
        const observer = new MutationObserver(dealCards);
        const playerHand = document.getElementById('playerHand');
        if (playerHand) {
            observer.observe(playerHand, { childList: true });
        }
    }
    
    addButtonAnimations() {
        // Pulse animation for enabled action buttons
        const animateButtons = () => {
            const playBtn = document.getElementById('playBtn');
            const callBtn = document.getElementById('callGameBtn');
            
            if (playBtn && !playBtn.disabled) {
                playBtn.classList.add('pulse');
            } else if (playBtn) {
                playBtn.classList.remove('pulse');
            }
            
            if (callBtn && !callBtn.disabled) {
                callBtn.classList.add('pulse');
            } else if (callBtn) {
                callBtn.classList.remove('pulse');
            }
        };
        
        // Check button states periodically
        setInterval(animateButtons, 500);
    }
    
    addTransitionEffects() {
        // Add smooth transitions for UI changes
        const style = document.createElement('style');
        style.textContent = `
            .pulse {
                animation: buttonPulse 1s ease-in-out infinite;
            }
            
            @keyframes buttonPulse {
                0%, 100% {
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
                }
                50% {
                    box-shadow: 0 5px 25px rgba(212, 175, 55, 0.5);
                    transform: translateY(-2px);
                }
            }
            
            .card-enter {
                animation: cardEnter 300ms ease-out;
            }
            
            @keyframes cardEnter {
                from {
                    transform: scale(0) rotate(180deg);
                    opacity: 0;
                }
                to {
                    transform: scale(1) rotate(0);
                    opacity: 1;
                }
            }
            
            .card-exit {
                animation: cardExit 300ms ease-in;
            }
            
            @keyframes cardExit {
                from {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }
                to {
                    transform: scale(0.5) translateY(-100px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setupAccessibility() {
        // Add ARIA labels
        this.addAriaLabels();
        
        // Enable keyboard navigation
        this.setupKeyboardNavigation();
        
        // Add screen reader announcements
        this.setupScreenReaderSupport();
    }
    
    addAriaLabels() {
        const elements = {
            'playerHand': 'Your hand',
            'opponentHand': 'Opponent hand',
            'drawPile': 'Draw pile - click to draw a card',
            'discardPile': 'Discard pile',
            'playBtn': 'Play selected cards',
            'drawBtn': 'Draw a card from pile',
            'callGameBtn': 'Call game before playing last card'
        };
        
        for (const [id, label] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.setAttribute('aria-label', label);
                element.setAttribute('role', 'button');
            }
        }
    }
    
    setupKeyboardNavigation() {
        let focusedCardIndex = -1;
        
        document.addEventListener('keydown', (e) => {
            const playerCards = document.querySelectorAll('.player-card');
            
            switch(e.key) {
                case 'ArrowLeft':
                    if (focusedCardIndex > 0) {
                        focusedCardIndex--;
                        playerCards[focusedCardIndex]?.focus();
                    }
                    break;
                    
                case 'ArrowRight':
                    if (focusedCardIndex < playerCards.length - 1) {
                        focusedCardIndex++;
                        playerCards[focusedCardIndex]?.focus();
                    }
                    break;
                    
                case 'Enter':
                case ' ':
                    if (focusedCardIndex >= 0 && focusedCardIndex < playerCards.length) {
                        playerCards[focusedCardIndex]?.click();
                    }
                    break;
                    
                case 'Tab':
                    // Allow natural tab navigation
                    focusedCardIndex = -1;
                    break;
            }
        });
        
        // Track focused card
        document.addEventListener('focus', (e) => {
            if (e.target.classList.contains('player-card')) {
                const playerCards = document.querySelectorAll('.player-card');
                focusedCardIndex = Array.from(playerCards).indexOf(e.target);
            }
        }, true);
    }
    
    setupScreenReaderSupport() {
        // Create announcement element for screen readers
        const announcer = document.createElement('div');
        announcer.id = 'screen-reader-announcer';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(announcer);
        
        // Override notification function to include screen reader announcements
        const originalNotification = game.showNotification;
        game.showNotification = (message, type) => {
            originalNotification.call(game, message, type);
            announcer.textContent = message;
        };
    }
    
    // Card flip animation
    flipCard(cardElement, newContent) {
        cardElement.style.transform = 'rotateY(90deg)';
        setTimeout(() => {
            cardElement.innerHTML = newContent;
            cardElement.style.transform = 'rotateY(0)';
        }, 150);
    }
    
    // Shuffle animation
    animateShuffle() {
        const drawPile = document.getElementById('drawPile');
        if (drawPile) {
            drawPile.classList.add('shuffling');
            setTimeout(() => {
                drawPile.classList.remove('shuffling');
            }, 1000);
        }
        
        // Add shuffle animation styles
        if (!document.getElementById('shuffle-animation')) {
            const style = document.createElement('style');
            style.id = 'shuffle-animation';
            style.textContent = `
                @keyframes shuffle {
                    0%, 100% { transform: rotate(0) scale(1); }
                    25% { transform: rotate(-5deg) scale(1.05); }
                    50% { transform: rotate(5deg) scale(1.05); }
                    75% { transform: rotate(-3deg) scale(1.02); }
                }
                .shuffling {
                    animation: shuffle 0.5s ease-in-out 2;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize UI Manager
const uiManager = new UIManager();

// Export for use in other modules
window.uiManager = uiManager;