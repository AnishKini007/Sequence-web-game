# Sequence - Classic Board Game

A complete digital implementation of the classic Sequence board game, playable in your browser!

## 🎮 Game Overview

Sequence is a strategy board game where players compete to create sequences of 5 connected chips on a 10x10 game board. Each space on the board represents a playing card, and players use cards from their hand to place chips on matching spaces.

## ✨ Features

- **🌐 Online Multiplayer**: Play with friends remotely via peer-to-peer connections
- **🏠 Local Multiplayer**: Pass-and-play mode for playing on the same device
- **2-6 Player Support (Online)**: Host online games for 2-6 players
- **2-12 Player Support (Local)**: Play locally with 2-12 players
- **Team Play**: Automatic team assignment (2 or 3 teams)
- **Share Link**: Get a shareable link to invite friends to your game
- **Official Rules**: Fully implements the classic Sequence rules
- **Special Cards**: 
  - Two-Eyed Jacks (Wild cards - place anywhere)
  - One-Eyed Jacks (Remove opponent chips)
- **Dead Card Exchange**: Automatically detect and exchange dead cards
- **Sequence Detection**: Automatic detection of horizontal, vertical, and diagonal sequences
- **Responsive Design**: Works on desktop and mobile devices
- **No Installation Required**: Runs entirely in the browser
- **No Backend Required**: Uses PeerJS for peer-to-peer connections

## 🎯 How to Play

### Game Modes

**🌐 Online Multiplayer**
1. Click "Host Online Game" to create a new game room
2. Enter your name and select number of players/teams
3. Share the generated link or Game ID with friends
4. Friends click "Join Online Game" and enter the Game ID or use your shared link
5. Once everyone joins, the host can start the game

**🏠 Local Game (Pass & Play)**
1. Click "Local Game (Pass & Play)"
2. Set up player count and team configuration
3. Players take turns on the same device

### Objective
Be the first player/team to form the required number of sequences:
- **2 Players/Teams**: Need TWO sequences to win
- **3 Teams**: Need ONE sequence to win

### Gameplay
1. **Select a card** from your hand by clicking on it
2. **Click a matching space** on the board to place your chip
3. In online games, wait for your turn
4. The turn automatically advances to the next player

### Special Rules
- **Corner Spaces**: The four corners are FREE spaces that count toward any player's sequence
- **Two-Eyed Jacks (♣ ♦)**: Place a chip on ANY empty space (wild card)
- **One-Eyed Jacks (♠ ♥)**: Remove any opponent's chip (unless it's part of a completed sequence)
- **Dead Cards**: If both spaces for a card are occupied, you can exchange it for a new card
- **No Table Talk**: Players on the same team shouldn't coach each other

### Winning
- Form 5 chips in a row (horizontal, vertical, or diagonal)
- Chips must be your team's color
- Corner spaces count as wildcards for sequences
- In 2-player/2-team games, you need 2 sequences to win
- In 3-team games, you need 1 sequence to win

## 🚀 Deployment on GitHub Pages

This game is designed to be hosted on GitHub Pages. To deploy:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit - Sequence game"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Under "Source", select "main" branch
   - Select "/ (root)" as the folder
   - Click "Save"

3. **Access Your Game**:
   - Your game will be available at: `https://[username].github.io/Sequence-web-game/`
   - It may take a few minutes to deploy

## 📁 Project Structure

```
Sequence-web-game/
├── index.html         # Main HTML structure with multiplayer UI
├── styles.css         # Game styling and animations
├── game.js            # Core game logic and rules
├── multiplayer.js     # Online multiplayer functionality (PeerJS)
├── README.md          # Documentation
└── DEPLOYMENT.md      # Deployment guide
```

## 🎨 Technical Details

### Multiplayer Architecture
- **PeerJS**: WebRTC-based peer-to-peer connections
- **No Backend Required**: Direct browser-to-browser communication
- **Signaling**: Uses PeerJS cloud broker (free)
- **Host-Client Model**: Host manages game state and broadcasts to all clients
- **Real-time Sync**: Game actions synchronized across all players

### Frontend Technology

- **Frontend Only**: Pure HTML, CSS, and JavaScript
- **No Dependencies**: No frameworks or libraries required
- **Responsive Design**: Adapts to different screen sizes
- **Local Storage**: Could be added for game state persistence

## 🎲 Game Rules Implementation

### Board Layout
- 10x10 grid with 100 card spaces
- Each card (except Jacks) appears twice on the board
- Four corner spaces are FREE (count for all players)
- Two complete 52-card decks (104 cards, no Jokers)

### Card Distribution
- 2 players: 7 cards each
- 3-4 players: 6 cards each
- 6 players: 5 cards each
- 8-9 players: 4 cards each
- 10-12 players: 3 cards each

### Turn Sequence
1. Player selects and plays a card
2. Player places a chip on a corresponding board space
3. Player draws a new card
4. Check for sequences and win conditions
5. Next player's turn

## 🔧 Customization

You can customize the game by modifying:
- **Colors**: Edit the CSS color variables in `styles.css`
- **Board Layout**: Modify the `BOARD_LAYOUT` array in `game.js`
- **Rules**: Adjust win conditions and special card behaviors in `game.js`

## 📝 Credits

- **Original Game**: Douglas Reuter (1981)
- **Digital Implementation**: 2026
- **Card Symbols**: Unicode playing card suits (♠ ♣ ♥ ♦)

## 🐛 Known Limitations

- No AI opponents (human players only)
- No undo functionality
- No reconnection support (if a player disconnects, game must restart)
- Online games limited to 6 players max (local games support up to 12)
- Relies on PeerJS cloud broker for connectivity

## 💡 Tips for Online Play

- **Stable Connection**: Ensure all players have stable internet
- **Modern Browser**: Use Chrome, Firefox, or Edge (latest versions)
- **Firewall**: PeerJS uses WebRTC, which may be blocked by some firewalls
- **Same Network**: If connecting fails, players on the same network can try hosting
- **Game ID**: Share the Game ID (6 characters) instead of full link if needed

## 📜 License

This is a fan-made digital implementation of the classic Sequence board game for educational and entertainment purposes.

## 🎉 Enjoy!

Have fun playing Sequence with your friends and family! May the best strategist win! 🏆
