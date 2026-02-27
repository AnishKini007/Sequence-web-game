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
    connectionTimeout: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    isReconnecting: false
};

// Detect iOS devices (iPhone, iPad)
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Get platform-specific troubleshooting message
function getConnectionErrorMessage() {
    const baseMsg = 'Failed to establish connection. Please try:\n\n';
    
    if (isIOS()) {
        return baseMsg + 
            '📱 iOS-SPECIFIC FIXES:\n\n' +
            '1. DISABLE iCloud Private Relay (Settings → Apple ID → iCloud → Private Relay → OFF)\n' +
            '2. Try using WiFi instead of cellular data\n' +
            '3. Keep Safari in foreground - don\'t switch apps\n' +
            '4. Verify Game ID is correct\n' +
            '5. Ask host to restart the game room\n\n' +
            '⚠️ iOS Safari has stricter WebRTC restrictions. Private Relay and cellular data often block connections.';
    } else {
        return baseMsg +
            '1. Verify the Game ID is correct\n' +
            '2. Ensure both devices have stable internet\n' +
            '3. Ask the host to restart the game room\n' +
            '4. Try connecting from a different network\n\n' +
            'Note: Some corporate/school networks may block peer connections.';
    }
}

// PeerJS configuration - use multiple free TURN servers for better cross-network connectivity
const PEER_CONFIG = {
    debug: 1,
    config: {
        iceServers: [
            // Google's public STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            // OpenRelay free TURN servers
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            // Twillio's public STUN servers
            { urls: 'stun:global.stun.twilio.com:3478' }
        ],
        iceTransportPolicy: 'all', // Try all methods (STUN direct + TURN relay)
        iceCandidatePoolSize: 10 // Pre-gather ICE candidates for faster connection
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
    
    // Add iOS-specific warning if on iOS
    if (isIOS()) {
        addIOSWarningToJoinScreen();
    }
    
    // Check if joining from a link
    checkForGameIdInUrl();
}

// Add iOS-specific warning to join screen
function addIOSWarningToJoinScreen() {
    const joinScreen = document.getElementById('join-screen');
    const existingWarnings = joinScreen.querySelectorAll('.setup-section');
    const lastWarning = existingWarnings[existingWarnings.length - 1];
    
    const iosWarning = document.createElement('div');
    iosWarning.className = 'setup-section';
    iosWarning.style.cssText = 'margin-top: 15px; padding: 15px; background: #ff9800; border-radius: 8px; color: white;';
    iosWarning.innerHTML = `
        <p style="margin: 0 0 8px 0; font-size: 0.95rem; font-weight: bold;">
            📱 iOS DEVICE DETECTED
        </p>
        <p style="margin: 0 0 8px 0; font-size: 0.85rem;">
            <strong>Before connecting, disable iCloud Private Relay:</strong>
        </p>
        <p style="margin: 0; padding-left: 15px; font-size: 0.8rem; line-height: 1.4;">
            Settings → [Your Name] → iCloud → Private Relay → Turn OFF
        </p>
        <p style="margin: 8px 0 0 0; font-size: 0.8rem; line-height: 1.4;">
            Also recommended: Use WiFi instead of cellular data for best results.
        </p>
    `;
    
    lastWarning.parentNode.insertBefore(iosWarning, lastWarning.nextSibling);
}

// Screen navigation
function showMainMenu() {
    hideAllScreens();
    document.getElementById('main-menu').style.display = 'flex';
    
    // Check for saved game state
    checkForSavedGame();
}

// Check if there's a saved game and offer to restore
function checkForSavedGame() {
    const savedState = loadGameState();
    if (savedState && savedState.multiplayerState.isOnline) {
        const age = Math.floor((Date.now() - savedState.timestamp) / 1000 / 60); // minutes
        const message = `Found a saved game from ${age} minute(s) ago.\n\nWould you like to try reconnecting?`;
        
        if (confirm(message)) {
            console.log('[Persistence] User chose to restore saved game');
            attemptRestoreAndReconnect(savedState);
        } else {
            console.log('[Persistence] User declined to restore');
            clearGameState();
        }
    }
}

// Attempt to restore game and reconnect
function attemptRestoreAndReconnect(savedState) {
    if (!restoreGameState(savedState)) {
        alert('Failed to restore game state. Starting fresh.');
        clearGameState();
        return;
    }
    
    showConnectionStatus('Attempting to reconnect...', 'connecting');
    
    // Restore multiplayer connection
    multiplayerState.isOnline = true;
    
    if (savedState.multiplayerState.isHost) {
        // Recreate host
        multiplayerState.peer = new Peer(savedState.multiplayerState.gameId, PEER_CONFIG);
        setupHostCallbacks();
    } else {
        // Rejoin as client
        multiplayerState.peer = new Peer(PEER_CONFIG);
        multiplayerState.peer.on('open', (id) => {
            const conn = multiplayerState.peer.connect(savedState.multiplayerState.gameId, {
                reliable: true,
                serialization: 'json',
                metadata: { playerName: savedState.multiplayerState.playerName }
            });
            
            conn.on('open', () => {
                console.log('[Reconnect] Successfully reconnected to game');
                multiplayerState.connections.push(conn);
                setupClientConnection(conn);
                handleReconnectionSuccess();
                startAutoSave();
            });
            
            conn.on('error', (err) => {
                console.error('[Reconnect] Failed to reconnect:', err);
                hideConnectionStatus();
                alert('Failed to reconnect to the game. The host may be offline.');
                showMainMenu();
            });
        });
    }
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
        console.log('[Host] Peer disconnected');
        if (multiplayerState.isOnline && !multiplayerState.isReconnecting) {
            saveGameState();
            attemptReconnection();
        }
    });
    
    multiplayerState.peer.on('open', (id) => {
        if (multiplayerState.reconnectAttempts > 0) {
            handleReconnectionSuccess();
        }
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
            alert(getConnectionErrorMessage());
            showMainMenu();
        }
    }, 45000); // 45 second timeout for initial connection
    
    // Initialize PeerJS with configuration
    multiplayerState.peer = new Peer(PEER_CONFIG);
    
    multiplayerState.peer.on('open', (id) => {
        console.log('Client peer opened with ID:', id);
        showConnectionStatus('Connecting to game...', 'connecting');
        
        // Connect to host with options
        const conn = multiplayerState.peer.connect(gameId, {
            reliable: true,
            serialization: 'json',
            metadata: { playerName: joinName }
        });
        
        // Log connection state changes for debugging
        if (conn.peerConnection) {
            conn.peerConnection.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', conn.peerConnection.iceConnectionState);
            };
        }
        
        // Set data channel timeout
        let dataChannelTimeout = setTimeout(() => {
            if (!conn.open) {
                console.log('Data channel timeout - connection failed');
                console.log('Final connection state:', conn.peerConnection?.iceConnectionState);
                cleanupConnection();
                hideConnectionStatus();
                alert(getConnectionErrorMessage());
                showMainMenu();
            }
        }, 40000); // 40 second timeout for data channel (TURN relay needs more time)
        
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
        console.log('[Client] Peer disconnected');
        if (multiplayerState.isOnline && !multiplayerState.isReconnecting) {
            saveGameState();
            attemptReconnection();
        }
    });
    
    multiplayerState.peer.on('open', (id) => {
        if (multiplayerState.reconnectAttempts > 0) {
            handleReconnectionSuccess();
        }
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
        console.log('[Client] Received start-game message, hiding connection status...');
        hideConnectionStatus();
        console.log('[Client] Starting multiplayer game...');
        startMultiplayerGame(data.gameState);
    } else if (data.type === 'game-action') {
        handleGameAction(data.action);
    } else if (data.type === 'game-state-sync') {
        syncGameState(data.gameState);
    } else if (data.type === 'error') {
        alert(data.message || 'An error occurred');
    }
}

// Broadcast message to all connected players (with error handling)
function broadcastToAll(data) {
    multiplayerState.connections.forEach(conn => {
        if (conn && conn.open) {
            try {
                conn.send(data);
            } catch (err) {
                console.error('Error broadcasting to peer:', err);
            }
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
    
    // Start monitoring connection quality
    startConnectionMonitoring();
    
    // Start auto-saving game state
    startAutoSave();
    
    // Save initial state
    saveGameState();
}

// Start multiplayer game for clients
function startMultiplayerGame(serializedState) {
    console.log('[Client] Starting multiplayer game with state:', serializedState);
    
    gameState.isMultiplayer = true;
    gameState.multiplayerMode = true;
    
    // Initialize board structure first (must happen before deserializing)
    initializeBoard();
    
    // Initialize deck (clients don't need actual deck, just placeholder)
    gameState.deck = [];
    gameState.deadCardInHand = false;
    
    // Now restore the server's game state
    deserializeGameState(serializedState);
    
    console.log('[Client] Game state after deserialization:', gameState);
    
    hideAllScreens();
    document.getElementById('game-screen').style.display = 'block';
    updateUI();
    
    console.log('[Client] Game screen should now be visible');
    
    // Start monitoring connection quality
    startConnectionMonitoring();
    
    // Start auto-saving game state
    startAutoSave();
    
    // Save initial state
    saveGameState();
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
        // Temporarily prevent broadcasting during remote updates
        const wasMultiplayer = gameState.multiplayerMode;
        gameState.multiplayerMode = false;
        placeChip(action.row, action.col, action.color);
        gameState.multiplayerMode = wasMultiplayer;
    } else if (action.type === 'remove-chip') {
        const wasMultiplayer = gameState.multiplayerMode;
        gameState.multiplayerMode = false;
        removeChip(action.row, action.col);
        gameState.multiplayerMode = wasMultiplayer;
    } else if (action.type === 'next-turn') {
        console.log('[Client] Received next-turn action');
        gameState.currentPlayerIndex = action.playerIndex;
        // Only update the specific player's hand
        if (action.updatedPlayer && gameState.players[action.updatedPlayer.id]) {
            const player = gameState.players[action.updatedPlayer.id];
            console.log('[Client] Updating player', action.updatedPlayer.id, 'hand from', player.hand.length, 'to', action.updatedPlayer.hand.length, 'cards');
            
            // Fix Jack cards in the updated hand
            const fixedHand = action.updatedPlayer.hand.map(card => {
                if (card.rank === 'J' && !card.type) {
                    card.type = getJackType(card.suit);
                    console.log('[Client] Fixed Jack card type in hand update:', card.suit, '->', card.type);
                }
                return card;
            });
            
            player.hand = fixedHand;
            
            // If this is my hand, log it
            if (action.updatedPlayer.id === multiplayerState.myPlayerId) {
                console.log('[Client] My hand updated. New size:', player.hand.length);
            }
        }
        updateUI();
    } else if (action.type === 'update-sequences') {
        // Update sequence counts without recalculating
        gameState.sequenceCounts = action.sequenceCounts;
        renderBoard();
        updateUI();
    } else if (action.type === 'game-end') {
        // Show game over screen
        console.log('[Client] Game ended - Winner:', action.winnerTeamName);
        document.getElementById('winner-text').textContent = `Team ${action.winnerTeamName} Wins!`;
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('win-screen').style.display = 'flex';
    } else if (action.type === 'exchange-dead-card') {
        // Client receives dead card exchange from host
        console.log('[Client] Dead card exchanged for player', action.playerId);
        if (gameState.players[action.playerId]) {
            gameState.players[action.playerId].hand = action.updatedHand;
        }
        updateUI();
    } else if (action.type === 'client-exchange-dead-card') {
        // HOST ONLY: Handle client dead card exchange request
        if (multiplayerState.isHost) {
            console.log('[Host] Client requesting dead card exchange for player', action.playerId);
            const player = gameState.players[action.playerId];
            
            if (!player) return;
            
            // Find and remove the dead card from player's hand
            if (action.deadCard) {
                const deadCardIndex = player.hand.findIndex(card => 
                    card.rank === action.deadCard.rank && 
                    card.suit === action.deadCard.suit
                );
                
                if (deadCardIndex > -1 && gameState.deck.length > 0) {
                    const removedCard = player.hand.splice(deadCardIndex, 1)[0];
                    const newCard = gameState.deck.pop();
                    player.hand.push(newCard);
                    
                    console.log('[Host] Exchanged dead card for player:', removedCard, 'for', newCard);
                    
                    // Broadcast exchange to all clients
                    broadcastToAll({
                        type: 'game-action',
                        action: {
                            type: 'exchange-dead-card',
                            playerId: action.playerId,
                            removedCard: removedCard,
                            newCard: newCard,
                            updatedHand: player.hand
                        }
                    });
                    
                    // Update host UI
                    updateUI();
                } else {
                    console.warn('[Host] Could not exchange dead card - card not found or deck empty');
                }
            }
        }
    } else if (action.type === 'client-turn-complete') {
        // HOST ONLY: Handle client finishing their turn
        if (multiplayerState.isHost) {
            console.log('[Host] Client finished turn, processing for player', action.playerId);
            const player = gameState.players[action.playerId];
            
            console.log('[Host] Player hand before:', player.hand.length, 'cards');
            
            // Find and remove the played card from player's hand
            if (action.playedCard) {
                const cardIndex = player.hand.findIndex(card => 
                    card.rank === action.playedCard.rank && 
                    card.suit === action.playedCard.suit
                );
                if (cardIndex > -1) {
                    player.hand.splice(cardIndex, 1);
                    console.log('[Host] Removed played card:', action.playedCard);
                }
            }
            
            console.log('[Host] Player hand after removal:', player.hand.length, 'cards');
            
            // Draw new card for the player
            let drawnCard = null;
            if (gameState.deck.length > 0) {
                drawnCard = gameState.deck.pop();
                player.hand.push(drawnCard);
                console.log('[Host] Drew card for player:', drawnCard);
            }
            
            console.log('[Host] Final player hand size:', player.hand.length, 'cards');
            
            // Check win condition
            const wasMultiplayer = gameState.multiplayerMode;
            gameState.multiplayerMode = false;
            const hasWon = checkWinCondition();
            gameState.multiplayerMode = wasMultiplayer;
            
            if (hasWon) {
                // Handle win
                endGame();
                return;
            }
            
            // Next player
            gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
            
            // Broadcast turn change to all clients
            broadcastToAll({
                type: 'game-action',
                action: {
                    type: 'next-turn',
                    playerIndex: gameState.currentPlayerIndex,
                    updatedPlayer: {
                        id: action.playerId,
                        hand: player.hand
                    },
                    drawnCard: drawnCard
                }
            });
            
            // Update host UI
            updateUI();
        }
    }
}

// Send game action to network (optimized, non-blocking)
function sendGameAction(action) {
    if (!multiplayerState.isOnline) return;
    
    // Use setTimeout to make it non-blocking
    setTimeout(() => {
        const message = {
            type: 'game-action',
            action: action,
            timestamp: Date.now()
        };
        
        try {
            if (multiplayerState.isHost) {
                broadcastToAll(message);
            } else {
                if (multiplayerState.connections[0] && multiplayerState.connections[0].open) {
                    multiplayerState.connections[0].send(message);
                }
            }
        } catch (err) {
            console.error('Error sending game action:', err);
        }
    }, 0);
}

// Serialize game state for network (optimized - only essential data)
function serializeGameState() {
    return {
        players: gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            hand: p.hand, // Only send hands at game start
            teamIndex: gameState.teams.findIndex(t => t === p.team)
        })),
        currentPlayerIndex: gameState.currentPlayerIndex,
        // Compress board - only send occupied cells
        board: gameState.board.map(row => 
            row.map(cell => ({
                chip: cell.chip,
                inSequence: cell.inSequence
            }))
        ),
        sequenceCounts: gameState.sequenceCounts,
        numTeams: gameState.numTeams,
        // Don't send full deck - too much data
        deckCount: gameState.deck.length
    };
}

// Deserialize game state from network (handle compressed data)
function deserializeGameState(serializedState) {
    console.log('[Deserialize] Starting deserialization:', serializedState);
    
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
        
        // Fix Jack cards that might be missing type property
        const hand = p.hand.map(card => {
            if (card.rank === 'J' && !card.type) {
                card.type = getJackType(card.suit);
                console.log('[Deserialize] Fixed Jack card type:', card.suit, '->', card.type);
            }
            return card;
        });
        
        const player = {
            id: p.id,
            name: p.name,
            hand: hand,
            team: team
        };
        team.players.push(player);
        return player;
    });
    
    gameState.currentPlayerIndex = serializedState.currentPlayerIndex;
    gameState.sequenceCounts = serializedState.sequenceCounts;
    gameState.numTeams = serializedState.numTeams;
    gameState.gameStarted = true;
    
    // Restore board state (merge with existing board structure)
    if (serializedState.board && gameState.board) {
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                if (serializedState.board[row] && serializedState.board[row][col]) {
                    if (gameState.board[row] && gameState.board[row][col]) {
                        gameState.board[row][col].chip = serializedState.board[row][col].chip;
                        gameState.board[row][col].inSequence = serializedState.board[row][col].inSequence;
                    }
                }
            }
        }
    }
    
    console.log('[Deserialize] Deserialization complete. Board:', gameState.board);
    console.log('[Deserialize] Players:', gameState.players);
    
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

// Monitor connection quality
function monitorConnectionQuality() {
    if (!multiplayerState.isOnline || !gameState.gameStarted) return;
    
    const connections = multiplayerState.isHost ? 
        multiplayerState.connections : 
        [multiplayerState.connections[0]];
    
    connections.forEach(conn => {
        if (conn && conn.peerConnection) {
            conn.peerConnection.getStats(null).then(stats => {
                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        const rtt = report.currentRoundTripTime;
                        if (rtt) {
                            updateConnectionQuality(rtt * 1000); // Convert to ms
                        }
                    }
                });
            }).catch(err => {
                console.log('Could not get connection stats:', err);
            });
        }
    });
}

// Update connection quality indicator
function updateConnectionQuality(latency) {
    const statusDiv = document.getElementById('connection-status');
    if (!statusDiv || !gameState.gameStarted) return;
    
    let quality = 'Good';
    let color = 'connected';
    
    if (latency > 500) {
        quality = 'Poor';
        color = 'disconnected';
    } else if (latency > 200) {
        quality = 'Fair';
        color = 'connecting';
    }
    
    statusDiv.className = `connection-status ${color}`;
    statusDiv.innerHTML = `
        <span class="status-dot"></span>
        <span>Connection: ${quality} (${Math.round(latency)}ms)</span>
    `;
}

// Start monitoring connection during game
function startConnectionMonitoring() {
    if (multiplayerState.isOnline && gameState.gameStarted) {
        showConnectionStatus('Monitoring...', 'connected');
        // Check every 5 seconds
        setInterval(() => {
            if (gameState.gameStarted && multiplayerState.isOnline) {
                monitorConnectionQuality();
            }
        }, 5000);
    }
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
// ===== STATE PERSISTENCE =====
// Save game state to localStorage for reconnection
function saveGameState() {
    try {
        const stateToSave = {
            multiplayerState: {
                isOnline: multiplayerState.isOnline,
                isHost: multiplayerState.isHost,
                playerName: multiplayerState.playerName,
                gameId: multiplayerState.gameId,
                lobbyPlayers: multiplayerState.lobbyPlayers,
                maxPlayers: multiplayerState.maxPlayers,
                numTeams: multiplayerState.numTeams,
                myPlayerId: multiplayerState.myPlayerId
            },
            gameState: {
                players: gameState.players,
                teams: gameState.teams,
                currentPlayerIndex: gameState.currentPlayerIndex,
                board: gameState.board,
                sequences: gameState.sequences,
                sequenceCounts: gameState.sequenceCounts,
                gameStarted: gameState.gameStarted,
                numTeams: gameState.numTeams,
                multiplayerMode: gameState.multiplayerMode
            },
            timestamp: Date.now()
        };
        localStorage.setItem('sequenceGameState', JSON.stringify(stateToSave));
        console.log('[Persistence] Game state saved');
    } catch (e) {
        console.error('[Persistence] Failed to save state:', e);
    }
}

// Load game state from localStorage
function loadGameState() {
    try {
        const savedState = localStorage.getItem('sequenceGameState');
        if (!savedState) return null;
        
        const state = JSON.parse(savedState);
        
        // Check if state is recent (within 24 hours)
        const age = Date.now() - state.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (age > maxAge) {
            console.log('[Persistence] Saved state too old, clearing');
            clearGameState();
            return null;
        }
        
        console.log('[Persistence] Loaded state from', Math.floor(age / 1000), 'seconds ago');
        return state;
    } catch (e) {
        console.error('[Persistence] Failed to load state:', e);
        return null;
    }
}

// Clear saved game state
function clearGameState() {
    try {
        localStorage.removeItem('sequenceGameState');
        console.log('[Persistence] Cleared saved state');
    } catch (e) {
        console.error('[Persistence] Failed to clear state:', e);
    }
}

// Restore game state after reconnection
function restoreGameState(savedState) {
    if (!savedState) return false;
    
    try {
        // Restore multiplayer state
        multiplayerState.isOnline = savedState.multiplayerState.isOnline;
        multiplayerState.isHost = savedState.multiplayerState.isHost;
        multiplayerState.playerName = savedState.multiplayerState.playerName;
        multiplayerState.gameId = savedState.multiplayerState.gameId;
        multiplayerState.lobbyPlayers = savedState.multiplayerState.lobbyPlayers;
        multiplayerState.maxPlayers = savedState.multiplayerState.maxPlayers;
        multiplayerState.numTeams = savedState.multiplayerState.numTeams;
        multiplayerState.myPlayerId = savedState.multiplayerState.myPlayerId;
        
        // Restore game state
        gameState.players = savedState.gameState.players;
        gameState.teams = savedState.gameState.teams;
        gameState.currentPlayerIndex = savedState.gameState.currentPlayerIndex;
        gameState.board = savedState.gameState.board;
        gameState.sequences = savedState.gameState.sequences;
        gameState.sequenceCounts = savedState.gameState.sequenceCounts;
        gameState.gameStarted = savedState.gameState.gameStarted;
        gameState.numTeams = savedState.gameState.numTeams;
        gameState.multiplayerMode = savedState.gameState.multiplayerMode;
        
        // Re-render UI
        hideAllScreens();
        document.getElementById('game-screen').style.display = 'block';
        renderBoard();
        renderPlayerHand();
        updateTurnInfo();
        updateSequenceCounts();
        
        console.log('[Persistence] Game state restored successfully');
        return true;
    } catch (e) {
        console.error('[Persistence] Failed to restore state:', e);
        return false;
    }
}

// ===== RECONNECTION SUPPORT =====
// Attempt to reconnect after disconnection
function attemptReconnection() {
    if (multiplayerState.isReconnecting) {
        console.log('[Reconnect] Already attempting reconnection');
        return;
    }
    
    multiplayerState.isReconnecting = true;
    multiplayerState.reconnectAttempts++;
    
    showConnectionStatus(`Reconnecting... (${multiplayerState.reconnectAttempts}/${multiplayerState.maxReconnectAttempts})`, 'connecting');
    
    console.log(`[Reconnect] Attempt ${multiplayerState.reconnectAttempts} of ${multiplayerState.maxReconnectAttempts}`);
    
    if (multiplayerState.reconnectAttempts > multiplayerState.maxReconnectAttempts) {
        console.log('[Reconnect] Max attempts reached, giving up');
        showConnectionStatus('Connection lost', 'error');
        setTimeout(() => {
            hideConnectionStatus();
            alert('Connection lost. The game has been saved. You can try rejoining using the same Game ID.');
            saveGameState();
            showMainMenu();
        }, 2000);
        multiplayerState.isReconnecting = false;
        return;
    }
    
    // Try to reconnect with exponential backoff
    const backoff = Math.min(1000 * Math.pow(2, multiplayerState.reconnectAttempts - 1), 10000);
    
    setTimeout(() => {
        if (multiplayerState.peer && !multiplayerState.peer.disconnected) {
            console.log('[Reconnect] Peer already connected');
            multiplayerState.isReconnecting = false;
            multiplayerState.reconnectAttempts = 0;
            showConnectionStatus('Reconnected!', 'connected');
            setTimeout(hideConnectionStatus, 2000);
            return;
        }
        
        if (multiplayerState.peer) {
            console.log('[Reconnect] Attempting peer reconnection');
            multiplayerState.peer.reconnect();
        } else if (multiplayerState.isHost) {
            console.log('[Reconnect] Recreating host peer');
            createGameRoom();
        } else {
            console.log('[Reconnect] Rejoining as client');
            joinGameRoom();
        }
        
        multiplayerState.isReconnecting = false;
    }, backoff);
}

// Handle successful reconnection
function handleReconnectionSuccess() {
    console.log('[Reconnect] Successfully reconnected');
    multiplayerState.reconnectAttempts = 0;
    multiplayerState.isReconnecting = false;
    showConnectionStatus('Reconnected!', 'connected');
    setTimeout(hideConnectionStatus, 3000);
    
    // Save current state
    saveGameState();
}

// ===== MOBILE BACKGROUND HANDLING =====
// Handle page visibility changes (mobile backgrounding)
function handleVisibilityChange() {
    if (document.hidden) {
        console.log('[Visibility] Page hidden - saving state');
        saveGameState();
    } else {
        console.log('[Visibility] Page visible - checking connection');
        
        // Check if we need to reconnect
        if (multiplayerState.isOnline && multiplayerState.peer && multiplayerState.peer.disconnected) {
            console.log('[Visibility] Peer disconnected, attempting reconnection');
            attemptReconnection();
        }
    }
}

// Initialize visibility tracking
document.addEventListener('visibilitychange', handleVisibilityChange);

// Save state periodically during gameplay
let autoSaveInterval = null;

function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    autoSaveInterval = setInterval(() => {
        if (gameState.gameStarted && multiplayerState.isOnline) {
            saveGameState();
        }
    }, 30000); // Auto-save every 30 seconds
}

function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

function cleanupConnection() {
    // Stop auto-saving
    stopAutoSave();
    
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
    multiplayerState.reconnectAttempts = 0;
    multiplayerState.isReconnecting = false;
}

// Initialize multiplayer on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMultiplayerUI);
} else {
    initializeMultiplayerUI();
}
