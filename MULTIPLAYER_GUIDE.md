# 🌐 Online Multiplayer Quick Start Guide

## How to Play with Friends Online

### For the Host (Game Creator)

1. **Open the Game**
   - Go to: https://anishkini007.github.io/Sequence-web-game/
   
2. **Click "Host Online Game"**
   - Enter your name
   - Select number of players (2-6)
   - Select number of teams (2 or 3)
   - Click "Create Game Room"

3. **Share the Game Link**
   - You'll see a shareable link and 6-character Game ID
   - Click "Copy" to copy the link
   - Send it to your friends via:
     - Text message
     - Email
     - Discord/Slack
     - Any messaging app

4. **Wait for Players**
   - Watch the lobby as friends join
   - You'll see each player as they connect
   - Teams are automatically assigned

5. **Start the Game**
   - Once everyone joins, click "Start Game"
   - Only the host can start the game

### For Players (Joining)

**Option 1: Using the Shared Link**
1. Click the link your friend sent you
2. Enter your name
3. Click "Join Game"
4. Wait in the lobby for the host to start

**Option 2: Using Game ID**
1. Open: https://anishkini007.github.io/Sequence-web-game/
2. Click "Join Online Game"
3. Enter your name
4. Enter the 6-character Game ID
5. Click "Join Game"

### During the Game

- **Your Turn**: You'll see your cards and can play
- **Other's Turn**: You'll see "Waiting for other player's turn..."
- **Game Board**: Everyone sees the same board in real-time
- **Sequences**: Automatically detected and displayed for all players

### Tips for Best Experience

✅ **DO:**
- Use a stable internet connection
- Keep the browser tab open
- Use a modern browser (Chrome, Firefox, Edge)
- Share the full link (easiest for friends)

❌ **DON'T:**
- Close or refresh the browser tab (you'll disconnect)
- Use very old browsers
- Expect the game to work behind strict corporate firewalls

### Troubleshooting

**Can't Connect?**
- Check your internet connection
- Try a different browser
- Ensure the Game ID is correct (6 characters)
- Host should verify they created the room successfully

**Game Won't Start?**
- Only the host can click "Start Game"
- Need at least 2 players to start

**Player Disconnected?**
- If a player disconnects, the game may become unstable
- Best to restart and recreate the room

**Slow or Laggy?**
- Check internet speed on all devices
- Close other browser tabs/apps using bandwidth
- Move closer to WiFi router

### Example Session

**Host's View:**
```
1. Host clicks "Host Online Game"
2. Enters name: "Alice"
3. Selects: 4 Players, 2 Teams
4. Gets Game ID: ABC123
5. Shares: https://anishkini007.github.io/Sequence-web-game/?game=ABC123
6. Sees Bob join (Team Blue)
7. Sees Charlie join (Team Green)
8. Sees Diana join (Team Blue)
9. Clicks "Start Game"
10. Game begins!
```

**Player's View:**
```
1. Bob clicks link from Alice
2. Enters name: "Bob"
3. Clicks "Join Game"
4. Sees lobby with:
   - Alice (HOST) - Team Blue
   - Bob (me) - Team Green
5. Waits for more players...
6. Sees "Host is starting the game..."
7. Game begins!
```

## Game Rules Reminder

- Play cards from your hand
- Place chips on matching board spaces
- Form 5 in a row to make a sequence
- 2-player/2-team games need 2 sequences to win
- 3-team games need 1 sequence to win
- Jacks are special (wild or remove chips)

## Technical Notes

**What is PeerJS?**
- Free peer-to-peer connection technology
- Allows browser-to-browser communication
- No need for a dedicated server
- Uses WebRTC under the hood

**Data Usage:**
- Very minimal (few KB per move)
- Suitable for mobile connections
- Real-time updates without page refreshes

**Privacy:**
- No personal data collected
- Game state exists only in browsers
- Connections are temporary
- No account required

## Have Fun! 🎉

Enjoy playing Sequence with your friends online! The game preserves all the classic rules while adding the convenience of remote play.

Questions? Issues? Feel free to open an issue on GitHub!

---

**Repository**: https://github.com/AnishKini007/Sequence-web-game
**Live Game**: https://anishkini007.github.io/Sequence-web-game/
