# 🪚 Chainsaw Chat (Fullstack Real-time Messenger)

> A dark, fast, and noisy fullstack messenger set in the **Chainsaw Man** universe. Built for those who appreciate the silence of the night city, clean code, and Tatsuki Fujimoto's unique manga aesthetic.

---

## 🖼️ Preview

### 🖥️ Desktop Version

<table width="100%">
  <tr>
    <td width="33.3%" align="center"><b>Start Screen</b></td>
    <td width="33.3%" align="center"><b>Login Screen</b></td>
    <td width="33.3%" align="center"><b>Chat Interface (Manga-Style)</b></td>
  </tr>
  <tr>
    <td><img src="client/public/start_engine.png" width="100%"></td>
    <td><img src="client/public/login_screen.png" width="100%"></td>
    <td><img src="client/public/chat_screen.png" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Rooms Screen</b></td>
    <td align="center"><b>Settings Interface</b></td>
    <td align="center"><b>Profile Screen</b></td>
    <td></td>
  </tr>
  <tr>
    <td><img src="client/public/room_screen.png" width="100%"></td>
    <td><img src="client/public/settings_screen.png" width="100%"></td>
    <td><img src="client/public/profile_screen.png" width="100%"></td>
    <td></td>
  </tr>
</table>

---

### 📱 Mobile Version

<table width="100%">
  <tr>
    <td width="25%" align="center"><b>Mobile Chat</b></td>
    <td width="25%" align="center"><b>Mobile Rooms</b></td>
    <td width="25%" align="center"><b>Mobile Settings</b></td>
    <td width="25%" align="center"><b>Mobile Profile</b></td>
  </tr>
  <tr>
    <td><img src="client/public/mobile_chat_screen.png" width="100%"></td>
    <td><img src="client/public/mobile_room_screen.png" width="100%"></td>
    <td><img src="client/public/mobile_settings_screen.png" width="100%"></td>
    <td><img src="client/public/mobile_profile_screen.png" width="100%"></td>
  </tr>
</table>

### Frontend
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-black?style=for-the-badge&logo=framer&logoColor=white)

### Backend & Cloud
![NodeJS](https://img.shields.io/badge/node.js-%23339933.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socketdotio&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&)

---

## ✨ Key Features


### 📱 Mobile Adaptation & UI/UX Optimization

Chainsaw Chat is fully optimized for mobile devices, adapting the aggressive manga-style layout for seamless one-handed use.

- 🛠 What Was Done

* **Dynamic Viewport (`100dvh`):** Replaced `100vh` with `100dvh` to prevent mobile browser navigation bars from cutting off the bottom of the interface.
* **Streamlined Header:** Heavy character tabs are hidden on mobile, leaving a compact top bar with a theme toggle.
* **Bottom Navigation (`BottomNav`):** Added a sticky bottom nav bar for easy thumb-reach switching between Chats, Rooms, Settings, and Profile.
* **Isolated Scroll Containers:** Added independent vertical scrolling (`overflow-y: auto`) to each tab panel to prevent page-wide layout locks and scroll freezing.
* **Smart Input Layout:** Added dynamic padding to the `InputBar` to keep it perfectly visible right above the mobile navigation bar without overlaps.
* **Responsive Sidebar:** The room `Sidebar` is automatically hidden on mobile screens, giving 100% width to the active chat.

### 🔐 Multi-Provider OAuth 2.0
Instant, secure authentication using your **Google** or **GitHub** profiles. The backend automatically provisions users, signs secure JWT session tokens, and fetches raw profile assets (names, avatars) directly into the environment.

### 🚪 Dynamic Room System & Persistent Storage
- Powered by **PostgreSQL** and **Prisma**, all users, rooms, and chat histories are safely stored in the cloud.
- Create your own room with a custom name
- Each room gets a unique **8-character invite code** (e.g. `KAIRYU42`)
- Share the code — anyone can join instantly
- Per-room message history is fully persistent

### 💬 Real-time Messaging
Zero-latency event synchronization powered by WebSockets. Chat state updates concurrently for all session members, handling text dispatch, message deletion, and pinning.

### 🖱️ Tactical Context Menu
Right-click on any message bubble to summon a custom inline action frame. Instantly delete messages from the database across all clients in real time or copy raw string content to the clipboard.

### ⌨️ Alive Typing System
Live typing status indicator that updates instantly. Uses a localized debounce throttle to register who is actively typing in the room, displaying animated bouncing manga dots.

### 🎤 High-Fidelity Voice Notes
Hold down the mic button to record, release to push. Encodes live microphone input into an optimized audio blob via the browser-native **MediaRecorder API** and streams it directly to the socket pipeline.

### ⚙️ Granular Control & Settings Tab
- Fully interactive settings panel keeping state variables in perfect synchronization.
- Dynamic Font Scaling: Instantly switch layout bounds between Small, Medium, and Large typographic frames.
- Keybind Pipelines: Toggle message submission behavior (Enter vs Ctrl+Enter).
- Audio & Privacy Toggles: Hot-swap your chainsaw SFX triggers and typing state broadcasting natively.

### 🪚 Public Safety Bureau License (Profile Tab)
- Your presence inside the app is stylized as an official Devil Hunter Identification License.
- Pulls live context like data of issue (28/06/2026) and unique barcode sequences.
- Integrated Terminate Session sequence built with aggressive red manga tones for safe account de-authentication.

### 👤 User Identity & Profile Customization
- Automatic avatar and name fetching from Google/GitHub profiles.
- Integrated fully functional **Profile Tab** with an interactive **Log Out** mechanics for seamless account switching.
- System notifications when users join.

### 🎨 Manga-Style UI
- Custom **Chainsaw Man favicon** guarding your browser tabs.
- Two themes: **light** (classic manga paper) and **dark** (grim noir).
- Halftone dot background — like a printed manga page.
- Angular speech bubbles with side tails.
- Random tilt on each message bubble.
- SFX words above every bubble: **VROOM!, SLASH!, BANG!, GRAAA!**
- CAPS messages render in a special "shout" style with Death Rattle font.
- Custom **Chainsaw Man fonts**: BlambotClassic, CCDoohickey, DeathRattle, AnimeAce, Broadband.

### 🧭 Chibi Navigation
Denji, Aki, Makima, and Reze sit on top of the nav icons. Active tab — character is full color. Inactive — greyed out and shrunk. Click — they jump.

### 🐾 Easter Eggs

- **🪚 CAPS-LOCK chainsaw** — writing in ALL CAPS has a 10% chance of triggering a chainsaw revving sound effect.
- **❤️ Pochita love trigger** — typing 'honey', 'baby', 'darling', 'cute', 'love', 'sweet', 'aww', '🥺', '💕', '😍', '🐾' or sending ❤️ has a 40% chance of making Pochita leap from the bottom of the screen with a fountain of hand-drawn hearts.

---

## 🚀 Installation & Environment

### 1. Clone the repository
```bash
git clone https://github.com/zxcmazokdyrak12/chainsaw-chat.git
cd chainsaw-chat
```

### 2. Backend Setup (`/server`)
Create a `.env` file in the `server/` directory:
```env
DATABASE_URL="postgresql://user:password@neon-host/dbname?sslmode=require"
JWT_SECRET="your_jwt_secret"
GOOGLE_CLIENT_ID="your_google_id"
GOOGLE_CLIENT_SECRET="your_google_secret"
GITHUB_CLIENT_ID="your_github_id"
GITHUB_CLIENT_SECRET="your_github_secret"
CLIENT_URL="http://localhost:5173"
```
Install dependencies and run migrations:
```bash
cd server
npm install
npx prisma db push
npm run dev
```

### 3. Frontend Setup (`/client`)
Create a `.env` file in the `client/` directory:
```env
VITE_API_URL="http://localhost:5000"
```
Install and run:
```bash
cd ../client
npm install
npm run dev
```

---

## 📁 Project Structure
```text
chainsaw-chat/
├── server/
│   ├── prisma/
│   │   └── schema.prisma      ← Prisma relational models (User, Room, Message)
│   ├── src/
│   │   ├── index.ts           ← Strictly typed Express server entrypoint
│   │   └── passport.ts        ← OAuth 2.0 Security Strategies
│   └── package.json
└── client/
    ├── src/
    │   ├── components/        ← Modular UI Blocks (InputBar, ProfileTab, RoomsTab, etc.)
    │   ├── hooks/             ← Custom React Hooks (useSettings tracking)
    │   ├── utils/             ← Helper modules (date processing pipelines)
    │   ├── App.tsx            ← Central reactive Hub (TypeScript-managed)
    │   ├── fonts.css          ← @font-face declarations
    │   └── main.tsx           ← Virtual DOM target mounting
    └── public/                ← Binary audio clips, assets & manga frames
```

🛤 Road Map

    [x] Cloud Database Sync (Neon Serverless Cloud Architecture)

    [x] Prisma ORM configuration layer

    [x] Full Backend Migration to Strict TypeScript

    [x] Frontend refactoring into full Type Safety (.tsx architecture alignment)

    [x] Google & GitHub Provider integration (OAuth 2.0)

    [x] Persistent session tracking via JSON Web Tokens

    [x] Live interactive context action layouts

    [ ] Async Video transmission framework via WebRTC

    [x] Mobile-responsive UI improvements

    [ ] Per-message emoticons and reactive status flags

    [ ] Independent login/pass legacy security framework

Created with love for Nayuta and clean code. 🩸
