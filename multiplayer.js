// Multiplayer functionality using PeerJS
// Handles peer-to-peer connections and game state synchronization

let multiplayerState = {
    isOnline: false,
    isHost: false,
    peer: null,
    connections: [],
    playerName: '',
    gameId: '',
    lobbyPlayers: [],
    maxPlayers: 4,
    numTeams: 2,
    myPlayerId: null
};

// Initialize multiplayer UI
function initializeMultiplayerUI() {
    // Main menu buttons
    document.getElementById('local-game-btn').addEventListener('click', showLocalSetup);
    document.getElementById('host-game-btn').addEventListener('click', showHostScreen);
    document.getElementById('join-game-btn').addEventListener('click', showJoinScreen);
    
    // Host screen
    document.getElementById('create-room-btn').addEventListener('click', createGameRoom);
    document.getElementById('back-to-menu-btn').addEventListener('click', showMainMenu);
    
    // Join screen
    document.getElementById('join-room-btn').addEventListener('click', joinGameRoom);
    document.getElementById('back-to-menu-btn2').addEventListener('click', showMainMenu);
    
    // Lobby
    document.getElementById('start-game-btn')?.addEventListener('click', startOnlineGame);
    document.getElementById('leave-lobby-btn').addEventListener('click', leaveLobby);
    document.getElementById('copy-link-btn').addEventListener('click', copyShareLink);
    
    // Check if joining from a link
    checkForGameIdInUrl();
}

// Screen navigation
function showMainMenu() {
    hideAllScreens();
    document.getElementById('main-menu').style.display = 'flex';
}

function showLocalSetup() {
    hideAllScreens();
    document.getElementById('setup-screen').style.display = 'flex';
}

function showHostScreen() {
    hideAllScreens();
    document.getElementById('host-screen').style.display = 'flex';
}

function showJoinScreen() {
    hideAllScreens();
    document.getElementById('join-screen').style.display = 'flex';
}

function showLobby() {
    hideAllScreens();
    document.getElementById('lobby-screen').style.display = 'flex';
}

function hideAllScreens() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('host-screen').style.display = 'none';
    document.getElementById('join-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('win-screen').style.display = 'none';
}

// Create game room (host)
function createGameRoom() {
    const hostName = document.getElementById('host-name').value.trim();
    if (!hostName) {
        alert('Please enter your name!');
        return;
    }
    
    multiplayerState.playerName = hostName;
    multiplayerState.maxPlayers = parseInt(document.getElementById('host-player-count').value);
    multiplayerState.numTeams = parseInt(document.getElementById('host-team-count').value);
    multiplayerState.isHost = true;
    multiplayerState.isOnline = true;
    
    // Generate unique game ID
    const gameId = generateGameId();
    multiplayerState.gameId = gameId;
    
    // Initialize PeerJS
    multiplayerState.peer = new Peer(gameId);
    
    multiplayerState.peer.on('open', (id) => {
        console.log('Host peer opened with ID:', id);
        multiplayerState.myPlayerId = 0;
        
        // Add host to lobby
        multiplayerState.lobbyPlayers = [{
            id: 0,
            name: hostName,
            isHost: true,
            peerId: id,
            connected: true
        }];
        
        showLobby();
        updateLobbyUI();
        setupHostConnections();
    });
    
    multiplayerState.peer.on('error', (err) => {
        console.error('Peer error:', err);
        alert('Failed to create game room. Please try again.');
        showMainMenu();
    });
}

// Join game room
function joinGameRoom() {
    const joinName = document.getElementById('join-name').value.trim();
    const gameId = document.getElementById('game-id-input').value.trim();
    
    if (!joinName) {
        alert('Please enter your name!');
        return;
    }
    
    if (!gameId) {
        alert('Please enter a game ID!');
        return;
    }
    
    multiplayerState.playerName = joinName;
    multiplayerState.gameId = gameId;
    multiplayerState.isHost = false;
    multiplayerState.isOnline = true;
    
    // Initialize PeerJS
    multiplayerState.peer = new Peer();
    
    multiplayerState.peer.on('open', (id) => {
        console.log('Client peer opened with ID:', id);
        
        // Connect to host
        const conn = multiplayerState.peer.connect(gameId);
        
        conn.on('open', () => {
            console.log('Connected to host');
            
            // Send join request
            conn.send({
                type: 'join',
                playerName: joinName,
                peerId: id
            });
            
            multiplayerState.connections.push(conn);
            setupClientConnection(conn);
            showLobby();
        });
        
        conn.on('error', (err) => {
            console.error('Connection error:', err);
            alert('Failed to connect to game. Check the game ID and try again.');
            showMainMenu();
        });
    });
    
    multiplayerState.peer.on('error', (err) => {
        console.error('Peer error:', err);
        alert('Failed to join game. Please try again.');
        showMainMenu();
    });
}

// Setup host to accept incoming connections
function setupHostConnections() {
    multiplayerState.peer.on('connection', (conn) => {
        console.log('New player connecting:', conn.peer);
        
        conn.on('data', (data) => {
            handleHostMessage(conn, data);
        });
        
        conn.on('close', () => {
            handlePlayerDisconnect(conn.peer);
        });
        
        multiplayerState.connections.push(conn);
    });
}

// Handle messages received by host
function handleHostMessage(conn, data) {
    console.log('Host received:', data);
    
    if (data.type === 'join') {
        // Add new player to lobby
        const playerId = multiplayerState.lobbyPlayers.length;
        
        if (playerId >= multiplayerState.maxPlayers) {
            conn.send({ type: 'error', message: 'Game is full' });
            conn.close();
            return;
        }
        
        const newPlayer = {
            id: playerId,
            name: data.playerName,
            isHost: false,
            peerId: data.peerId,
            connected: true
        };
        
        multiplayerState.lobbyPlayers.push(newPlayer);
        
        // Send lobby state to new player
        conn.send({
            type: 'lobby-state',
            players: multiplayerState.lobbyPlayers,
            maxPlayers: multiplayerState.maxPlayers,
            numTeams: multiplayerState.numTeams,
            gameId: multiplayerState.gameId,
            yourId: playerId
        });
        
        // Broadcast updated lobby to all players
        broadcastToAll({
            type: 'player-joined',
            player: newPlayer,
            players: multiplayerState.lobbyPlayers
        });
        
        updateLobbyUI();
    } else if (data.type === 'game-action') {
        // Handle game actions and broadcast to all
        handleGameAction(data.action);
        broadcastToAll(data);
    }
}

// Setup client connection handlers
function setupClientConnection(conn) {
    conn.on('data', (data) => {
        handleClientMessage(data);
    });
    
    conn.on('close', () => {
        alert('Disconnected from host');
        showMainMenu();
    });
}

// Handle messages received by client
function handleClientMessage(data) {
    console.log('Client received:', data);
    
    if (data.type === 'lobby-state') {
        multiplayerState.lobbyPlayers = data.players;
        multiplayerState.maxPlayers = data.maxPlayers;
        multiplayerState.numTeams = data.numTeams;
        multiplayerState.gameId = data.gameId;
        multiplayerState.myPlayerId = data.yourId;
        updateLobbyUI();
    } else if (data.type === 'player-joined') {
        multiplayerState.lobbyPlayers = data.players;
        updateLobbyUI();
    } else if (data.type === 'start-game') {
        startMultiplayerGame(data.gameState);
    } else if (data.type === 'game-action') {
        handleGameAction(data.action);
    } else if (data.type === 'game-state-sync') {
        syncGameState(data.gameState);
    }
}

// Broadcast message to all connected players
function broadcastToAll(data) {
    multiplayerState.connections.forEach(conn => {
        if (conn.open) {
            conn.send(data);
        }
    });
}

// Update lobby UI
function updateLobbyUI() {
    const shareLinkInput = document.getElementById('share-link');
    const gameIdDisplay = document.getElementById('game-id-display');
    const lobbyCount = document.getElementById('lobby-count');
    const lobbyMax = document.getElementById('lobby-max');
    const lobbyPlayers = document.getElementById('lobby-players');
    const startGameBtn = document.getElementById('start-game-btn');
    const hostControls = document.getElementById('host-controls');
    const waitingMessage = document.getElementById('waiting-message');
    
    // Update share link
    const shareLink = `${window.location.origin}${window.location.pathname}?game=${multiplayerState.gameId}`;
    shareLinkInput.value = shareLink;
    gameIdDisplay.textContent = multiplayerState.gameId;
    
    // Update player count
    lobbyCount.textContent = multiplayerState.lobbyPlayers.length;
    lobbyMax.textContent = multiplayerState.maxPlayers;
    
    // Update player list
    lobbyPlayers.innerHTML = '';
    const teamColors = ['blue', 'green', 'red'];
    
    multiplayerState.lobbyPlayers.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        
        const teamIndex = index % multiplayerState.numTeams;
        const teamColor = teamColors[teamIndex];
        
        playerDiv.innerHTML = `
            <div class="player-name">
                ${player.name}
                ${player.isHost ? '<span class="host-badge">HOST</span>' : ''}
            </div>
            <div class="player-status">
                <span class="team-badge ${teamColor}">Team ${teamColor.charAt(0).toUpperCase() + teamColor.slice(1)}</span>
                <span class="status-indicator"></span>
            </div>
        `;
        
        lobbyPlayers.appendChild(playerDiv);
    });
    
    // Show/hide host controls
    if (multiplayerState.isHost) {
        hostControls.style.display = 'block';
        waitingMessage.style.display = 'none';
        
        // Enable start button if we have at least 2 players
        startGameBtn.disabled = multiplayerState.lobbyPlayers.length < 2;
    } else {
        hostControls.style.display = 'none';
        waitingMessage.style.display = 'block';
    }
}

// Start online game (host only)
function startOnlineGame() {
    if (!multiplayerState.isHost) return;
    
    // Create game state
    const players = multiplayerState.lobbyPlayers.map((lobbyPlayer, index) => {
        const teamIndex = index % multiplayerState.numTeams;
        return {
            id: lobbyPlayer.id,
            name: lobbyPlayer.name,
            hand: [],
            teamIndex: teamIndex
        };
    });
    
    // Initialize game with multiplayer flag
    gameState.isMultiplayer = true;
    gameState.multiplayerMode = true;
    gameState.numTeams = multiplayerState.numTeams;
    
    // Initialize game
    initializeMultiplayerGame(players);
    
    // Broadcast game start to all clients
    broadcastToAll({
        type: 'start-game',
        gameState: serializeGameState()
    });
    
    // Show game screen
    hideAllScreens();
    document.getElementById('game-screen').style.display = 'block';
    updateUI();
}

// Start multiplayer game for clients
function startMultiplayerGame(serializedState) {
    gameState.isMultiplayer = true;
    gameState.multiplayerMode = true;
    deserializeGameState(serializedState);
    
    hideAllScreens();
    document.getElementById('game-screen').style.display = 'block';
    updateUI();
}

// Initialize multiplayer game
function initializeMultiplayerGame(players) {
    gameState.players = [];
    gameState.teams = [];
    
    // Initialize teams
    const teamColors = ['blue', 'green', 'red'];
    for (let i = 0; i < multiplayerState.numTeams; i++) {
        gameState.teams.push({
            color: teamColors[i],
            name: teamColors[i].charAt(0).toUpperCase() + teamColors[i].slice(1),
            players: []
        });
    }
    
    // Create players
    players.forEach(player => {
        const team = gameState.teams[player.teamIndex];
        const newPlayer = {
            id: player.id,
            name: player.name,
            hand: [],
            team: team
        };
        
        gameState.players.push(newPlayer);
        team.players.push(newPlayer);
    });
    
    // Initialize game
    initializeDeck();
    dealCards();
    initializeBoard();
    
    gameState.currentPlayerIndex = 0;
    gameState.gameStarted = true;
}

// Handle game actions from network
function handleGameAction(action) {
    if (action.type === 'place-chip') {
        placeChip(action.row, action.col, action.color);
    } else if (action.type === 'remove-chip') {
        removeChip(action.row, action.col);
    } else if (action.type === 'next-turn') {
        gameState.currentPlayerIndex = action.playerIndex;
        gameState.players[action.updatedPlayer.id].hand = action.updatedPlayer.hand;
        updateUI();
    }
}

// Send game action to network
function sendGameAction(action) {
    if (!multiplayerState.isOnline) return;
    
    const message = {
        type: 'game-action',
        action: action
    };
    
    if (multiplayerState.isHost) {
        broadcastToAll(message);
    } else {
        multiplayerState.connections[0].send(message);
    }
}

// Serialize game state for network
function serializeGameState() {
    return {
        players: gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            hand: p.hand,
            teamIndex: gameState.teams.findIndex(t => t === p.team)
        })),
        currentPlayerIndex: gameState.currentPlayerIndex,
        board: gameState.board,
        deck: gameState.deck,
        sequenceCounts: gameState.sequenceCounts,
        numTeams: gameState.numTeams
    };
}

// Deserialize game state from network
function deserializeGameState(serializedState) {
    // Recreate teams
    gameState.teams = [];
    const teamColors = ['blue', 'green', 'red'];
    for (let i = 0; i < serializedState.numTeams; i++) {
        gameState.teams.push({
            color: teamColors[i],
            name: teamColors[i].charAt(0).toUpperCase() + teamColors[i].slice(1),
            players: []
        });
    }
    
    // Recreate players
    gameState.players = serializedState.players.map(p => {
        const team = gameState.teams[p.teamIndex];
        const player = {
            id: p.id,
            name: p.name,
            hand: p.hand,
            team: team
        };
        team.players.push(player);
        return player;
    });
    
    gameState.currentPlayerIndex = serializedState.currentPlayerIndex;
    gameState.board = serializedState.board;
    gameState.deck = serializedState.deck;
    gameState.sequenceCounts = serializedState.sequenceCounts;
    gameState.numTeams = serializedState.numTeams;
    gameState.gameStarted = true;
    
    renderBoard();
}

// Sync game state periodically
function syncGameState(serializedState) {
    deserializeGameState(serializedState);
    updateUI();
}

// Handle player disconnect
function handlePlayerDisconnect(peerId) {
    const player = multiplayerState.lobbyPlayers.find(p => p.peerId === peerId);
    if (player) {
        console.log('Player disconnected:', player.name);
        // Could implement reconnection logic here
    }
}

// Leave lobby
function leaveLobby() {
    if (multiplayerState.peer) {
        multiplayerState.peer.destroy();
    }
    
    multiplayerState = {
        isOnline: false,
        isHost: false,
        peer: null,
        connections: [],
        playerName: '',
        gameId: '',
        lobbyPlayers: [],
        maxPlayers: 4,
        numTeams: 2,
        myPlayerId: null
    };
    
    showMainMenu();
}

// Copy share link
function copyShareLink() {
    const shareLinkInput = document.getElementById('share-link');
    shareLinkInput.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copy-link-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

// Check if joining from URL
function checkForGameIdInUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    
    if (gameId) {
        document.getElementById('game-id-input').value = gameId;
        showJoinScreen();
    }
}

// Generate random game ID
function generateGameId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Check if current player's turn
function isMyTurn() {
    if (!multiplayerState.isOnline) return true;
    return gameState.currentPlayerIndex === multiplayerState.myPlayerId;
}

// Initialize multiplayer on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMultiplayerUI);
} else {
    initializeMultiplayerUI();
}
