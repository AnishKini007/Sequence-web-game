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
    myPlayerId: null,
    connectionTimeout: null
};

// PeerJS configuration with better connectivity
const PEER_CONFIG = {
    debug: 2, // Enable debugging
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    }
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
    
    // Show loading state
    showConnectionStatus('Connecting...', 'connecting');
    
    // Generate unique game ID
    const gameId = generateGameId();
    multiplayerState.gameId = gameId;
    
    // Initialize PeerJS with configuration
    multiplayerState.peer = new Peer(gameId, PEER_CONFIG);
    
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
        
        showConnectionStatus('Connected', 'connected');
        showLobby();
        updateLobbyUI();
        setupHostConnections();
    });
    
    multiplayerState.peer.on('error', (err) => {
        console.error('Peer error:', err);
        hideConnectionStatus();
        let errorMsg = 'Failed to create game room.';
        if (err.type === 'unavailable-id') {
            errorMsg = 'Game ID already in use. Please try again.';
        } else if (err.type === 'network') {
            errorMsg = 'Network error. Check your internet connection.';
        }
        alert(errorMsg);
        showMainMenu();
    });
    
    multiplayerState.peer.on('disconnected', () => {
        console.log('Peer disconnected, attempting to reconnect...');
        multiplayerState.peer.reconnect();
    });
}

// Join game room
function joinGameRoom() {
    const joinName = document.getElementById('join-name').value.trim();
    const gameId = document.getElementById('game-id-input').value.trim().toUpperCase();
    
    if (!joinName) {
        alert('Please enter your name!');
        return;
    }
    
    if (!gameId) {
        alert('Please enter a game ID!');
        return;
    }
    
    if (gameId.length !== 6) {
        alert('Game ID must be 6 characters long!');
        return;
    }
    
    multiplayerState.playerName = joinName;
    multiplayerState.gameId = gameId;
    multiplayerState.isHost = false;
    multiplayerState.isOnline = true;
    
    // Show loading state
    showConnectionStatus('Connecting to host...', 'connecting');
    
    // Set connection timeout
    multiplayerState.connectionTimeout = setTimeout(() => {
        if (multiplayerState.peer && !multiplayerState.lobbyPlayers.length) {
            console.log('Connection timeout');
            cleanupConnection();
            hideConnectionStatus();
            alert('Connection timeout. The host may be offline or the Game ID is incorrect.');
            showMainMenu();
        }
    }, 15000); // 15 second timeout
    
    // Initialize PeerJS with configuration
    multiplayerState.peer = new Peer(PEER_CONFIG);
    
    multiplayerState.peer.on('open', (id) => {
        console.log('Client peer opened with ID:', id);
        showConnectionStatus('Connecting to game...', 'connecting');
        
        // Connect to host with options
        const conn = multiplayerState.peer.connect(gameId, {
            reliable: true,
            serialization: 'json'
        });
        
        // Set data channel timeout
        let dataChannelTimeout = setTimeout(() => {
            if (!conn.open) {
                console.log('Data channel timeout');
                cleanupConnection();
                hideConnectionStatus();
                alert('Failed to establish connection. The host may not be available.');
                showMainMenu();
            }
        }, 10000); // 10 second timeout for data channel
        
        conn.on('open', () => {
            clearTimeout(dataChannelTimeout);
            clearTimeout(multiplayerState.connectionTimeout);
            console.log('Connected to host - sending join request');
            showConnectionStatus('Connected! Joining lobby...', 'connected');
            
            // Send join request
            conn.send({
                type: 'join',
                playerName: joinName,
                peerId: id
            });
            
            multiplayerState.connections.push(conn);
            setupClientConnection(conn);
        });
        
        conn.on('error', (err) => {
            clearTimeout(dataChannelTimeout);
            clearTimeout(multiplayerState.connectionTimeout);
            console.error('Connection error:', err);
            hideConnectionStatus();
            alert('Failed to connect to game. The host may be offline or the Game ID is incorrect.');
            cleanupConnection();
            showMainMenu();
        });
        
        conn.on('close', () => {
            console.log('Connection closed');
            if (!gameState.gameStarted) {
                hideConnectionStatus();
                alert('Connection to host lost.');
                showMainMenu();
            }
        });
    });
    
    multiplayerState.peer.on('error', (err) => {
        clearTimeout(multiplayerState.connectionTimeout);
        console.error('Peer error:', err);
        hideConnectionStatus();
        let errorMsg = 'Failed to join game.';
        if (err.type === 'peer-unavailable') {
            errorMsg = 'Game not found. Check the Game ID and make sure the host has created the room.';
        } else if (err.type === 'network') {
            errorMsg = 'Network error. Check your internet connection.';
        } else if (err.type === 'browser-incompatible') {
            errorMsg = 'Your browser does not support this feature. Try Chrome, Firefox, or Edge.';
        }
        alert(errorMsg);
        cleanupConnection();
        showMainMenu();
    });
    
    multiplayerState.peer.on('disconnected', () => {
        console.log('Peer disconnected, attempting to reconnect...');
        multiplayerState.peer.reconnect();
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
        clearTimeout(multiplayerState.connectionTimeout);
        multiplayerState.lobbyPlayers = data.players;
        multiplayerState.maxPlayers = data.maxPlayers;
        multiplayerState.numTeams = data.numTeams;
        multiplayerState.gameId = data.gameId;
        multiplayerState.myPlayerId = data.yourId;
        hideConnectionStatus();
        showLobby();
        updateLobbyUI();
    } else if (data.type === 'player-joined') {
        multiplayerState.lobbyPlayers = data.players;
        updateLobbyUI();
    } else if (data.type === 'start-game') {
        hideConnectionStatus();
        startMultiplayerGame(data.gameState);
    } else if (data.type === 'game-action') {
        handleGameAction(data.action);
    } else if (data.type === 'game-state-sync') {
        syncGameState(data.gameState);
    } else if (data.type === 'error') {
        alert(data.message || 'An error occurred');
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
    cleanupConnection();
    hideConnectionStatus();
    
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
        myPlayerId: null,
        connectionTimeout: null
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

// Connection status indicator
function showConnectionStatus(message, status) {
    let statusDiv = document.getElementById('connection-status');
    
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.className = 'connection-status';
        document.body.appendChild(statusDiv);
    }
    
    statusDiv.className = `connection-status ${status}`;
    statusDiv.innerHTML = `
        <span class="status-dot"></span>
        <span>${message}</span>
    `;
    statusDiv.style.display = 'flex';
}

function hideConnectionStatus() {
    const statusDiv = document.getElementById('connection-status');
    if (statusDiv) {
        statusDiv.style.display = 'none';
    }
}

// Cleanup connection
function cleanupConnection() {
    if (multiplayerState.connectionTimeout) {
        clearTimeout(multiplayerState.connectionTimeout);
        multiplayerState.connectionTimeout = null;
    }
    
    multiplayerState.connections.forEach(conn => {
        if (conn && conn.open) {
            conn.close();
        }
    });
    
    if (multiplayerState.peer) {
        multiplayerState.peer.destroy();
        multiplayerState.peer = null;
    }
    
    multiplayerState.connections = [];
}

// Initialize multiplayer on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMultiplayerUI);
} else {
    initializeMultiplayerUI();
}
