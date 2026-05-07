# 🪚 Chainsaw Chat (Fullstack Real-time Messenger)

> A messenger set in the "Chainsaw Man" universe, created for those who appreciate the silence of the night city and Tatsuki Fujimoto's unique aesthetic. This project combines rigorous backend logic with vivid frontend animations.

---

## 🖼️ Preview

| Start Screen | Login Screen |
|---|---|
| ![Start Screen](.public/preview/start_engine.png) | ![Login Screen](.public/preview/login_screen.png) |

---

## 🛠 Tech Stack

- **Frontend:** React (Vite) + JavaScript
- **Styling & Animation:** Framer Motion + custom inline styles
- **Backend:** Node.js + Express
- **Real-time:** Socket.io (WebSocket)
- **Audio:** MediaRecorder API
- **State Management:** React Hooks

---

## ✨ Key Features

### 💬 Real-time Messaging
Instant message exchange without page reloads via persistent WebSocket connection. Messages appear simultaneously for all users in the room.

### 🚪 Dynamic Room System
- 4 default rooms: **General, Devils, Hunters, Pochita**
- Create your own room with a custom name
- Each room gets a unique **8-character invite code** (e.g. `KAIRYU42`)
- Share the code — anyone can join instantly
- Per-room message history (last 100 messages)

### 👤 User Identity
- Custom nickname screen on entry
- Your name is visible to everyone in the room
- System notifications when users join

### ⌨️ Typing Indicators
Live "is typing..." status with animated bouncing dots — visible to everyone in the room in real time.

### 🎤 Voice Messages
Hold the microphone button to record, release to send. Audio messages appear inline with a built-in player powered by the **MediaRecorder API**.

### 🎨 Manga-Style UI
- Two themes: **light** (classic manga paper) and **dark** (grim noir)
- Halftone dot background — like a printed manga page
- Angular speech bubbles with side tails
- Random tilt on each message bubble
- SFX words above every bubble: **VROOM!, SLASH!, BANG!, GRAAA!**
- CAPS messages render in a special "shout" style with Death Rattle font
- Custom **Chainsaw Man fonts**: BlambotClassic, CCDoohickey, DeathRattle, AnimeAce, Broadband

### 🧭 Chibi Navigation
Denji, Aki, Makima, and Reze sit on top of the nav icons. Active tab — character is full color. Inactive — greyed out and shrunk. Click — they jump.

### 🐾 Easter Eggs

- **🪚 CAPS-LOCK chainsaw** — writing in ALL CAPS has a 10% chance of triggering a chainsaw revving sound effect
- **❤️ Pochita love trigger** — typing "love", "cute", "люблю", "мило" or sending ❤️ has a 40% chance of making Pochita leap from the bottom of the screen with a fountain of hand-drawn hearts

---

## 🚀 Installation

Clone the repository:
```bash
git clone https://github.com/your-username/chainsaw-chat
cd chainsaw-chat
```

Install and run the backend:
```bash
cd server
npm install
node index.js
```

Install and run the frontend:
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in two browser tabs — and start chatting.

---

## 📁 Project Structure

```
chainsaw-chat/
├── server/
│   ├── index.js        ← Node.js + Socket.io server
│   └── package.json
└── client/
    ├── src/
    │   ├── App.jsx     ← main component
    │   ├── fonts.css   ← Chainsaw Man font declarations
    │   └── main.jsx
    └── public/
        ├── denji.png / aki.png / makima.png / reze.png / pochita.png
        ├── hand.png
        ├── chainsaw.mp3
        ├── bubble.png / bubble_me.png
        ├── heart_0.png ... heart_8.png
        └── icon_chat.png / icon_rooms.png / icon_settings.png / icon_profile.png
```

---

## 🛤 Road Map

- [ ] Database integration (MongoDB/PostgreSQL) for persistent message history
- [ ] Video messages via WebRTC
- [ ] Mobile-responsive UI improvements
- [ ] Push notifications
- [ ] User avatars and profile customization
- [ ] Message reactions

---

*Created with love for Nayuta and clean code. 🩸*
