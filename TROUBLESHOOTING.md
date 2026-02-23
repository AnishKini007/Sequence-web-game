# 🔧 Multiplayer Troubleshooting Guide

If you're having trouble connecting for online multiplayer, try these solutions:

## Quick Fixes

### ✅ **Most Reliable: Same WiFi Network**
Both host and players connect to the **same WiFi network**. This almost always works.

**Steps:**
1. Host creates game on laptop/device
2. Players join from their devices
3. All devices connected to same WiFi = No network issues!

### ✅ **Alternative: Both Use Mobile Data**
If same WiFi isn't possible:
1. Host turns on mobile hotspot OR uses mobile data
2. Players use mobile data (not WiFi)
3. This often works better than mixing networks

### ✅ **Check Browser**
- **Works Best:** Chrome, Firefox, Edge (latest versions)
- **May Not Work:** Safari (older versions), Opera Mini
- **Mobile:** Chrome or Firefox recommended

## Common Errors & Solutions

### Error: "Failed to establish connection"

**Causes:**
- Different networks (laptop WiFi + phone mobile data)
- Firewall blocking WebRTC
- Restrictive network (corporate, school, public WiFi)

**Solutions (try in order):**
1. **Same WiFi:** Connect both devices to same network
2. **Mobile Data:** Both use mobile data (not WiFi)
3. **Disable VPN:** Turn off VPN on both devices
4. **Different Network:** Try at home instead of work/school
5. **Restart Browser:** Close and reopen browser completely

### Error: "Connection timeout"

**Causes:**
- Host went offline
- Wrong Game ID entered
- Host's browser tab closed

**Solutions:**
1. Verify Game ID is correct (6 characters)
2. Host keeps tab open and doesn't refresh
3. Host recreates room if needed
4. Try hosting from phone instead of laptop

### Error: "Game not found"

**Causes:**
- Wrong Game ID
- Host hasn't created room yet
- Host already started game

**Solutions:**
1. Double-check Game ID (case-insensitive)
2. Make sure host clicked "Create Game Room"
3. Host shares link immediately after creating

## Network Scenarios

### ✅ **These Usually Work:**
- Same WiFi network
- Both on mobile data
- Both on same mobile hotspot
- Home WiFi networks (no restrictions)

### ⚠️ **These May Have Issues:**
- Different networks (mixing WiFi + mobile data)
- Corporate/work networks (firewalls)
- School networks (restricted)
- Public WiFi (coffee shops, airports)
- VPN enabled

### ❌ **These Won't Work:**
- Very old browsers (pre-2020)
- Browsers without WebRTC support
- Networks that block WebRTC ports

## Step-by-Step: Guaranteed Working Setup

### Option 1: Same WiFi (Easiest)
1. Host and all players connect to same WiFi
2. Host opens game, clicks "Host Online Game"
3. Host shares link or Game ID
4. Players click link or enter Game ID
5. Should connect in 5-10 seconds

### Option 2: Mobile Hotspot
1. Host turns on mobile hotspot
2. Players connect to host's hotspot
3. Host creates game
4. Players join
5. Works like same WiFi

### Option 3: All Mobile Data
1. Everyone disconnects from WiFi
2. Everyone uses mobile data
3. Host creates game
4. Players join using link
5. May take longer (15-25 seconds)

## Testing Connection

Want to test if it works at all?

1. **Open two browser tabs** on same device
2. **Tab 1:** Host a game
3. **Tab 2:** Join using the Game ID
4. **If this works** → Your device is fine, it's a network issue
5. **If this fails** → Try clearing browser cache or different browser

## Advanced: Check Browser Console

For tech-savvy users:

1. Press **F12** (or right-click → Inspect)
2. Go to **Console** tab
3. Look for errors like:
   - `ICE connection state: failed` → Network/firewall blocking
   - `peer-unavailable` → Wrong Game ID or host offline
   - `network error` → Internet connection issue

## Still Not Working?

### Last Resort Options:

1. **Local Game Mode**
   - Use "Local Game (Pass & Play)"
   - Everyone plays on same device
   - Pass device between players

2. **Try Different Time/Location**
   - Some networks have temporary issues
   - Home networks usually work better

3. **Screen Share Alternative**
   - Host creates local game
   - Share screen via Zoom/Discord
   - Players tell host what to do
   - Not ideal but works!

## Why This Happens

**Technical Explanation:**
Online multiplayer uses WebRTC for peer-to-peer connections. This requires:
- **STUN servers** to discover your public IP
- **TURN servers** to relay data if direct connection fails

Some networks (corporate, school, mobile carriers) block these connections for security. That's why same WiFi works best - no internet routing needed!

## Report Issues

If none of these work and you:
- ✅ Tried same WiFi
- ✅ Used modern browser
- ✅ Both devices have good internet

Then it might be a bug! Please report:
- What error message you see
- What browsers/devices you're using
- What network setup (same WiFi, different networks, etc.)

---

**Most Important:** When in doubt, use **same WiFi network**! This bypasses almost all connection issues. 🎮✨
