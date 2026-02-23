// Sequence Board Game - Complete Implementation
// © 2026 - Digital Version

// ===== GAME CONSTANTS =====
const SUITS = ['♠', '♣', '♥', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Q', 'K', 'A'];

// Official Sequence board layout (10x10 grid)
// Each card appears twice on the board, corners are free spaces
const BOARD_LAYOUT = [
    ['FREE', '2♠', '3♠', '4♠', '5♠', '6♠', '7♠', '8♠', '9♠', 'FREE'],
    ['6♣', '5♣', '4♣', '3♣', '2♣', 'A♥', 'K♥', 'Q♥', '10♥', '10♠'],
    ['7♣', 'A♠', '2♦', '3♦', '4♦', '5♦', '6♦', '7♦', '9♥', 'Q♠'],
    ['8♣', 'K♠', '6♣', '5♣', '4♣', '3♣', '2♣', '8♦', '8♥', 'K♠'],
    ['9♣', 'Q♠', '7♣', '6♥', '5♥', '4♥', 'A♠', '9♦', '7♥', 'A♠'],
    ['10♣', '10♠', '8♣', '7♥', '2♥', '3♥', 'K♦', '10♦', '6♥', '2♦'],
    ['Q♣', '9♠', '9♣', '8♥', 'A♥', '4♥', 'Q♦', 'Q♦', '5♥', '3♦'],
    ['K♣', '8♠', '10♣', 'Q♣', 'K♣', 'A♣', 'A♣', 'K♦', '4♥', '4♦'],
    ['A♣', '7♠', '6♠', '5♠', '4♠', '3♠', '2♠', '2♥', '3♥', '5♦'],
    ['FREE', 'A♦', 'K♦', 'Q♦', '10♦', '9♦', '8♦', '7♦', '6♦', 'FREE']
];

// ===== GAME STATE =====
let gameState = {
    players: [],
    teams: [],
    currentPlayerIndex: 0,
    deck: [],
    board: [],
    selectedCard: null,
    sequences: { blue: [], green: [], red: [] },
    sequenceCounts: { blue: 0, green: 0, red: 0 },
    gameStarted: false,
    numTeams: 2,
    multiplayerMode: false
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeSetup();
});

function initializeSetup() {
    const playerCountSelect = document.getElementById('player-count');
    const teamCountSelect = document.getElementById('team-count');
    const startGameBtn = document.getElementById('start-game');
    const newGameBtn = document.getElementById('new-game');
    const playAgainBtn = document.getElementById('play-again');

    playerCountSelect.addEventListener('change', updatePlayerNames);
    teamCountSelect.addEventListener('change', updatePlayerNames);
    startGameBtn.addEventListener('click', startGame);
    newGameBtn.addEventListener('click', resetGame);
    playAgainBtn.addEventListener('click', resetGame);

    updatePlayerNames();
}

function updatePlayerNames() {
    const playerCount = parseInt(document.getElementById('player-count').value);
    const teamCount = parseInt(document.getElementById('team-count').value);
    const playerNamesSection = document.getElementById('player-names-section');
    
    // Show/hide red team in game screen
    const redSequences = document.getElementById('team-red-sequences');
    if (teamCount === 3) {
        redSequences.style.display = 'flex';
    } else {
        redSequences.style.display = 'none';
    }
    
    playerNamesSection.innerHTML = '<h3>Player Names:</h3>';
    
    for (let i = 0; i < playerCount; i++) {
        const teamIndex = i % teamCount;
        const teamName = ['Blue', 'Green', 'Red'][teamIndex];
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'player-name-input';
        input.placeholder = `Player ${i + 1} (Team ${teamName})`;
        input.id = `player-${i}-name`;
        playerNamesSection.appendChild(input);
    }
}

// ===== GAME SETUP =====
function startGame() {
    const playerCount = parseInt(document.getElementById('player-count').value);
    const teamCount = parseInt(document.getElementById('team-count').value);
    
    gameState.numTeams = teamCount;
    gameState.players = [];
    gameState.teams = [];
    
    // Initialize teams
    const teamColors = ['blue', 'green', 'red'];
    for (let i = 0; i < teamCount; i++) {
        gameState.teams.push({
            color: teamColors[i],
            name: teamColors[i].charAt(0).toUpperCase() + teamColors[i].slice(1),
            players: []
        });
    }
    
    // Create players
    for (let i = 0; i < playerCount; i++) {
        const nameInput = document.getElementById(`player-${i}-name`);
        const playerName = nameInput.value.trim() || `Player ${i + 1}`;
        const teamIndex = i % teamCount;
        
        const player = {
            id: i,
            name: playerName,
            hand: [],
            team: gameState.teams[teamIndex]
        };
        
        gameState.players.push(player);
        gameState.teams[teamIndex].players.push(player);
    }
    
    // Initialize game
    initializeDeck();
    dealCards();
    initializeBoard();
    
    gameState.currentPlayerIndex = 0;
    gameState.gameStarted = true;
    
    // Show game screen
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('win-screen').style.display = 'none';
    
    updateUI();
}

function initializeDeck() {
    gameState.deck = [];
    
    // Two decks (104 cards total, no Jokers)
    for (let deckNum = 0; deckNum < 2; deckNum++) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                gameState.deck.push({ rank, suit });
            }
            // Add Jacks
            gameState.deck.push({ rank: 'J', suit, type: getJackType(suit) });
        }
    }
    
    shuffleDeck();
}

function getJackType(suit) {
    // One-eyed jacks: ♠ and ♥
    // Two-eyed jacks: ♣ and ♦
    return (suit === '♠' || suit === '♥') ? 'one-eyed' : 'two-eyed';
}

function shuffleDeck() {
    for (let i = gameState.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
    }
}

function dealCards() {
    const playerCount = gameState.players.length;
    let cardsPerPlayer;
    
    // Determine cards per player based on player count
    if (playerCount === 2) cardsPerPlayer = 7;
    else if (playerCount <= 4) cardsPerPlayer = 6;
    else if (playerCount === 6) cardsPerPlayer = 5;
    else if (playerCount <= 9) cardsPerPlayer = 4;
    else cardsPerPlayer = 3;
    
    gameState.players.forEach(player => {
        player.hand = [];
        for (let i = 0; i < cardsPerPlayer; i++) {
            player.hand.push(gameState.deck.pop());
        }
    });
}

function initializeBoard() {
    gameState.board = [];
    
    for (let row = 0; row < 10; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < 10; col++) {
            const cardStr = BOARD_LAYOUT[row][col];
            gameState.board[row][col] = {
                card: cardStr,
                chip: null,
                isCorner: cardStr === 'FREE',
                row: row,
                col: col,
                inSequence: false
            };
        }
    }
    
    renderBoard();
}

// ===== BOARD RENDERING =====
function renderBoard() {
    const boardElement = document.getElementById('game-board');
    boardElement.innerHTML = '';
    
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const cell = gameState.board[row][col];
            const cellElement = document.createElement('div');
            cellElement.className = 'board-cell';
            cellElement.dataset.row = row;
            cellElement.dataset.col = col;
            
            if (cell.isCorner) {
                cellElement.classList.add('corner');
                cellElement.innerHTML = '<div>FREE</div>';
            } else {
                const cardStr = cell.card;
                const rank = cardStr.slice(0, -1);
                const suit = cardStr.slice(-1);
                
                const rankSpan = document.createElement('div');
                rankSpan.className = 'card-rank';
                rankSpan.textContent = rank;
                
                const suitSpan = document.createElement('div');
                suitSpan.className = `card-suit suit-${getSuitName(suit)}`;
                suitSpan.textContent = suit;
                
                cellElement.appendChild(rankSpan);
                cellElement.appendChild(suitSpan);
                
                if (!cell.chip) {
                    cellElement.addEventListener('click', () => handleCellClick(row, col));
                }
            }
            
            // Add chip if present
            if (cell.chip) {
                const chip = document.createElement('div');
                chip.className = `chip ${cell.chip}`;
                cellElement.appendChild(chip);
                cellElement.classList.add('occupied');
            }
            
            // Highlight if in sequence
            if (cell.inSequence) {
                cellElement.classList.add('in-sequence');
            }
            
            boardElement.appendChild(cellElement);
        }
    }
}

function getSuitName(suit) {
    const suitMap = { '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs', '♠': 'spades' };
    return suitMap[suit] || 'clubs';
}

// ===== GAME LOGIC =====
function handleCellClick(row, col) {
    const cell = gameState.board[row][col];
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Check if it's player's turn in multiplayer
    if (gameState.multiplayerMode && typeof isMyTurn === 'function' && !isMyTurn()) {
        alert('It\'s not your turn!');
        return;
    }
    
    if (!gameState.selectedCard) {
        alert('Please select a card from your hand first!');
        return;
    }
    
    const selectedCard = gameState.selectedCard;
    
    // Ensure Jack has type (safety check)
    if (selectedCard.rank === 'J' && !selectedCard.type) {
        selectedCard.type = getJackType(selectedCard.suit);
        console.log('[handleCellClick] Fixed missing Jack type:', selectedCard.type);
    }
    
    console.log('[handleCellClick] Processing click with card:', selectedCard);
    
    // Handle Two-Eyed Jack (wild card)
    if (selectedCard.rank === 'J' && selectedCard.type === 'two-eyed') {
        if (!cell.chip && !cell.isCorner) {
            placeChip(row, col, currentPlayer.team.color);
            finishTurn();
        } else {
            alert('This space is already occupied or is a corner!');
        }
        return;
    }
    
    // Handle One-Eyed Jack (remove opponent chip)
    if (selectedCard.rank === 'J' && selectedCard.type === 'one-eyed') {
        console.log('[OneEyedJack] Attempting to remove chip at', row, col);
        console.log('[OneEyedJack] Cell chip:', cell.chip, 'Player team:', currentPlayer.team.color, 'In sequence:', cell.inSequence);
        if (cell.chip && cell.chip !== currentPlayer.team.color && !cell.inSequence) {
            console.log('[OneEyedJack] Removing chip');
            removeChip(row, col);
            finishTurn();
        } else {
            if (!cell.chip) {
                alert('You must select a space with an opponent\'s chip!');
            } else if (cell.chip === currentPlayer.team.color) {
                alert('You cannot remove your own team\'s chip!');
            } else if (cell.inSequence) {
                alert('You cannot remove a chip that is part of a completed sequence!');
            }
        }
        return;
    }
    
    // Normal card placement
    const cardStr = `${selectedCard.rank}${selectedCard.suit}`;
    if (cell.card === cardStr && !cell.chip) {
        placeChip(row, col, currentPlayer.team.color);
        finishTurn();
    } else {
        alert('Invalid move! Select a matching empty space on the board.');
    }
}

function placeChip(row, col, color) {
    gameState.board[row][col].chip = color;
    
    checkForSequences();
    renderBoard();
    
    // Broadcast action in multiplayer (after local update)
    if (gameState.multiplayerMode && typeof sendGameAction === 'function') {
        sendGameAction({
            type: 'place-chip',
            row: row,
            col: col,
            color: color
        });
        
        // Also send sequence update
        sendGameAction({
            type: 'update-sequences',
            sequenceCounts: gameState.sequenceCounts
        });
    }
}

function removeChip(row, col) {
    gameState.board[row][col].chip = null;
    
    checkForSequences();
    renderBoard();
    
    // Broadcast action in multiplayer (after local update)
    if (gameState.multiplayerMode && typeof sendGameAction === 'function') {
        sendGameAction({
            type: 'remove-chip',
            row: row,
            col: col
        });
        
        // Also send sequence update
        sendGameAction({
            type: 'update-sequences',
            sequenceCounts: gameState.sequenceCounts
        });
    }
}

function finishTurn() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const playedCard = gameState.selectedCard;
    
    console.log('[FinishTurn] Played card:', playedCard);
    
    gameState.selectedCard = null;
    
    // In multiplayer mode
    if (gameState.multiplayerMode && typeof multiplayerState !== 'undefined') {
        if (multiplayerState.isHost) {
            // HOST: Remove card, draw new card, and broadcast turn change
            const cardIndex = currentPlayer.hand.findIndex(c => 
                c.rank === playedCard.rank && c.suit === playedCard.suit
            );
            if (cardIndex > -1) {
                currentPlayer.hand.splice(cardIndex, 1);
                console.log('[Host] Removed card from hand at index', cardIndex);
            } else {
                console.warn('[Host] Could not find played card in hand!');
            }
            
            let drawnCard = null;
            if (gameState.deck.length > 0) {
                drawnCard = gameState.deck.pop();
                currentPlayer.hand.push(drawnCard);
            }
            
            console.log('[Host] After turn - Player hand size:', currentPlayer.hand.length);
            
            // Check win condition
            if (checkWinCondition()) {
                endGame();
                return;
            }
            
            // Next player
            gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
            
            // Broadcast turn change
            if (typeof sendGameAction === 'function') {
                sendGameAction({
                    type: 'next-turn',
                    playerIndex: gameState.currentPlayerIndex,
                    updatedPlayer: {
                        id: currentPlayer.id,
                        hand: currentPlayer.hand
                    },
                    drawnCard: drawnCard
                });
            }
        } else {
            // CLIENT: Send played card to host (DO NOT remove locally - wait for host)
            console.log('[Client] Sending turn complete. Current hand size:', currentPlayer.hand.length);
            if (typeof sendGameAction === 'function') {
                sendGameAction({
                    type: 'client-turn-complete',
                    playerId: currentPlayer.id,
                    playedCard: playedCard
                });
            }
        }
    } else {
        // Local game: Remove card and draw new one
        const cardIndex = currentPlayer.hand.findIndex(c => 
            c.rank === playedCard.rank && c.suit === playedCard.suit
        );
        if (cardIndex > -1) {
            currentPlayer.hand.splice(cardIndex, 1);
        }
        
        if (gameState.deck.length > 0) {
            currentPlayer.hand.push(gameState.deck.pop());
        }
        
        // Check win condition
        if (checkWinCondition()) {
            endGame();
            return;
        }
        
        // Next player
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    }
    
    updateUI();
}

// ===== SEQUENCE DETECTION =====
function checkForSequences() {
    // Reset sequence flags
    gameState.board.forEach(row => {
        row.forEach(cell => {
            cell.inSequence = false;
        });
    });
    
    // Reset sequence counts
    gameState.sequenceCounts = { blue: 0, green: 0, red: 0 };
    gameState.sequences = { blue: [], green: [], red: [] };
    
    const colors = gameState.numTeams === 2 ? ['blue', 'green'] : ['blue', 'green', 'red'];
    
    for (const color of colors) {
        // Check horizontal
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col <= 5; col++) {
                if (isSequence(row, col, 0, 1, color, 5)) {
                    markSequence(row, col, 0, 1, 5);
                    gameState.sequenceCounts[color]++;
                    gameState.sequences[color].push({ type: 'horizontal', row, col });
                }
            }
        }
        
        // Check vertical
        for (let col = 0; col < 10; col++) {
            for (let row = 0; row <= 5; row++) {
                if (isSequence(row, col, 1, 0, color, 5)) {
                    markSequence(row, col, 1, 0, 5);
                    gameState.sequenceCounts[color]++;
                    gameState.sequences[color].push({ type: 'vertical', row, col });
                }
            }
        }
        
        // Check diagonal (down-right)
        for (let row = 0; row <= 5; row++) {
            for (let col = 0; col <= 5; col++) {
                if (isSequence(row, col, 1, 1, color, 5)) {
                    markSequence(row, col, 1, 1, 5);
                    gameState.sequenceCounts[color]++;
                    gameState.sequences[color].push({ type: 'diagonal-dr', row, col });
                }
            }
        }
        
        // Check diagonal (down-left)
        for (let row = 0; row <= 5; row++) {
            for (let col = 4; col < 10; col++) {
                if (isSequence(row, col, 1, -1, color, 5)) {
                    markSequence(row, col, 1, -1, 5);
                    gameState.sequenceCounts[color]++;
                    gameState.sequences[color].push({ type: 'diagonal-dl', row, col });
                }
            }
        }
    }
}

function isSequence(startRow, startCol, rowDir, colDir, color, length) {
    let count = 0;
    
    for (let i = 0; i < length; i++) {
        const row = startRow + (i * rowDir);
        const col = startCol + (i * colDir);
        
        if (row < 0 || row >= 10 || col < 0 || col >= 10) {
            return false;
        }
        
        const cell = gameState.board[row][col];
        
        // Corners count for all colors
        if (cell.isCorner) {
            count++;
        } else if (cell.chip === color) {
            count++;
        } else {
            return false;
        }
    }
    
    return count === length;
}

function markSequence(startRow, startCol, rowDir, colDir, length) {
    for (let i = 0; i < length; i++) {
        const row = startRow + (i * rowDir);
        const col = startCol + (i * colDir);
        gameState.board[row][col].inSequence = true;
    }
}

// ===== WIN CONDITION =====
function checkWinCondition() {
    const requiredSequences = gameState.numTeams === 2 ? 2 : 1;
    
    for (const team of gameState.teams) {
        if (gameState.sequenceCounts[team.color] >= requiredSequences) {
            return true;
        }
    }
    
    return false;
}

function endGame() {
    const requiredSequences = gameState.numTeams === 2 ? 2 : 1;
    let winner = null;
    
    for (const team of gameState.teams) {
        if (gameState.sequenceCounts[team.color] >= requiredSequences) {
            winner = team;
            break;
        }
    }
    
    if (winner) {
        document.getElementById('winner-text').textContent = `Team ${winner.name} Wins!`;
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('win-screen').style.display = 'flex';
    }
}

// ===== UI UPDATE =====
function updateUI() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Update current player display
    document.getElementById('current-player').textContent = currentPlayer.name;
    const teamIndicator = document.getElementById('current-team-indicator');
    teamIndicator.className = `team-indicator ${currentPlayer.team.color}`;
    teamIndicator.style.background = getTeamColorHex(currentPlayer.team.color);
    
    // Update sequence counts
    document.getElementById('blue-sequences').textContent = gameState.sequenceCounts.blue;
    document.getElementById('green-sequences').textContent = gameState.sequenceCounts.green;
    document.getElementById('red-sequences').textContent = gameState.sequenceCounts.red;
    
    // Render player hand
    renderPlayerHand();
    
    // Update dead card button
    updateDeadCardButton();
}

function renderPlayerHand() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const handElement = document.getElementById('player-hand');
    handElement.innerHTML = '';
    
    // In multiplayer, only show hand if it's your turn or you're the current player
    if (gameState.multiplayerMode && typeof multiplayerState !== 'undefined') {
        // Only show your own hand
        const myPlayer = gameState.players[multiplayerState.myPlayerId];
        if (!myPlayer) return;
        
        // Show message if not your turn
        if (!isMyTurn()) {
            handElement.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Waiting for other player\'s turn...</p>';
            return;
        }
        
        // Render your hand
        myPlayer.hand.forEach((card, index) => {
            renderCardElement(card, handElement);
        });
    } else {
        // Local game - show current player's hand
        currentPlayer.hand.forEach((card, index) => {
            renderCardElement(card, handElement);
        });
    }
    
    // Highlight selectable board cells
    highlightSelectableCells();
}

function renderCardElement(card, container) {
    // Ensure Jack cards have their type set
    if (card.rank === 'J' && !card.type) {
        card.type = getJackType(card.suit);
        console.log('[RenderCard] Fixed missing Jack type for', card.suit, '- assigned:', card.type);
    }
    
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
        
        if (card.rank === 'J') {
            cardElement.classList.add('jack');
            cardElement.innerHTML = `
                <div class="card-rank">Jack</div>
                <div class="card-suit">${card.suit}</div>
                <div style="font-size: 0.7rem; margin-top: 5px;">
                    ${card.type === 'two-eyed' ? 'WILD' : 'REMOVE'}
                </div>
            `;
            console.log('[RenderCard] Jack card:', card.suit, 'Type:', card.type);
        } else {
            const suitClass = getSuitName(card.suit);
            cardElement.innerHTML = `
                <div class="card-rank suit-${suitClass}">${card.rank}</div>
                <div class="card-suit suit-${suitClass}">${card.suit}</div>
            `;
        }
        
        // Check if card is dead
        if (isDeadCard(card)) {
            cardElement.classList.add('dead');
            cardElement.title = 'Dead card - both spaces occupied';
        }
        
        // Check if this card is selected (compare by rank and suit, not reference)
        if (gameState.selectedCard && 
            gameState.selectedCard.rank === card.rank && 
            gameState.selectedCard.suit === card.suit) {
            cardElement.classList.add('selected');
        }
        
        cardElement.addEventListener('click', () => selectCard(card));
        container.appendChild(cardElement);
}

function selectCard(card) {
    // Ensure Jack cards have their type set
    if (card.rank === 'J' && !card.type) {
        card.type = getJackType(card.suit);
        console.log('[SelectCard] Fixed missing Jack type for', card.suit, '- assigned:', card.type);
    }
    
    console.log('[SelectCard] Selected card:', card);
    if (card.rank === 'J') {
        console.log('[SelectCard] Jack suit:', card.suit, 'Type:', card.type);
        console.log('[SelectCard] Expected type for suit:', getJackType(card.suit));
    }
    
    // Store a copy of the card to avoid reference issues
    gameState.selectedCard = { ...card };
    renderPlayerHand();
}

function isDeadCard(card) {
    if (card.rank === 'J') {
        return false; // Jacks are never dead
    }
    
    const cardStr = `${card.rank}${card.suit}`;
    let occupiedCount = 0;
    
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const cell = gameState.board[row][col];
            if (cell.card === cardStr) {
                if (cell.chip) {
                    occupiedCount++;
                }
            }
        }
    }
    
    // Card is dead if both instances are occupied
    return occupiedCount >= 2;
}

function updateDeadCardButton() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const deadCardBtn = document.getElementById('dead-card-btn');
    
    const hasDeadCard = currentPlayer.hand.some(card => isDeadCard(card));
    deadCardBtn.disabled = !hasDeadCard;
    
    deadCardBtn.onclick = () => exchangeDeadCard();
}

function exchangeDeadCard() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const deadCardIndex = currentPlayer.hand.findIndex(card => isDeadCard(card));
    
    if (deadCardIndex !== -1 && gameState.deck.length > 0) {
        currentPlayer.hand.splice(deadCardIndex, 1);
        currentPlayer.hand.push(gameState.deck.pop());
        updateUI();
    }
}

function highlightSelectableCells() {
    // Remove previous highlights
    document.querySelectorAll('.board-cell').forEach(cell => {
        cell.classList.remove('selectable');
    });
    
    if (!gameState.selectedCard) {
        return;
    }
    
    const selectedCard = gameState.selectedCard;
    
    // Ensure Jack has type for highlighting
    if (selectedCard.rank === 'J' && !selectedCard.type) {
        selectedCard.type = getJackType(selectedCard.suit);
        console.log('[Highlight] Fixed missing Jack type:', selectedCard.type);
    }
    
    console.log('[Highlight] Highlighting for card:', selectedCard);
    
    // Two-eyed Jack - highlight all empty cells
    if (selectedCard.rank === 'J' && selectedCard.type === 'two-eyed') {
        console.log('[Highlight] Two-eyed Jack - highlighting empty cells');
        document.querySelectorAll('.board-cell').forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const boardCell = gameState.board[row][col];
            
            if (!boardCell.chip && !boardCell.isCorner) {
                cell.classList.add('selectable');
            }
        });
        return;
    }
    
    // One-eyed Jack - highlight removable opponent chips
    if (selectedCard.rank === 'J' && selectedCard.type === 'one-eyed') {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        console.log('[Highlight] One-eyed Jack - highlighting opponent chips');
        console.log('[Highlight] Current player team:', currentPlayer.team.color);
        let highlightCount = 0;
        document.querySelectorAll('.board-cell').forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const boardCell = gameState.board[row][col];
            
            if (boardCell.chip && boardCell.chip !== currentPlayer.team.color && !boardCell.inSequence) {
                cell.classList.add('selectable');
                highlightCount++;
            }
        });
        console.log('[Highlight] Highlighted', highlightCount, 'opponent chips');
        return;
    }
    
    // Normal card - highlight matching empty cells
    const cardStr = `${selectedCard.rank}${selectedCard.suit}`;
    document.querySelectorAll('.board-cell').forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const boardCell = gameState.board[row][col];
        
        if (boardCell.card === cardStr && !boardCell.chip) {
            cell.classList.add('selectable');
        }
    });
}

function getTeamColorHex(color) {
    const colorMap = {
        'blue': '#2196F3',
        'green': '#4CAF50',
        'red': '#f44336'
    };
    return colorMap[color] || '#2196F3';
}

// ===== GAME RESET =====
function resetGame() {
    // Handle multiplayer cleanup
    if (gameState.multiplayerMode && typeof leaveLobby === 'function') {
        leaveLobby();
        return;
    }
    
    gameState = {
        players: [],
        teams: [],
        currentPlayerIndex: 0,
        deck: [],
        board: [],
        selectedCard: null,
        sequences: { blue: [], green: [], red: [] },
        sequenceCounts: { blue: 0, green: 0, red: 0 },
        gameStarted: false,
        numTeams: 2,
        multiplayerMode: false
    };
    
    // Check if we're in multiplayer mode
    if (typeof multiplayerState !== 'undefined' && multiplayerState.isOnline) {
        leaveLobby();
    } else {
        document.getElementById('setup-screen').style.display = 'flex';
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('win-screen').style.display = 'none';
        
        updatePlayerNames();
    }
}
