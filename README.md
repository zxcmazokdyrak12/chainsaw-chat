<img width="808" height="495" alt="изображение" src="https://github.com/user-attachments/assets/6a0e5238-11fe-4a74-90fb-515d593e3fb9" /># 🪚 Chainsaw Chat (Fullstack Real-time Messenger)

> A messenger set in the "Chainsaw Man" universe, created for those who appreciate the silence of the night city and Tatsuki Fujimoto's unique aesthetic. This project combines rigorous backend logic with vivid frontend animations.

---

## 🖼️ Preview

| Start Screen | Login Screen | Chat Interface (Manga-Style UI) |
|---|---|---|
| ![Start Screen](client/public/start_engine.png) | ![Login Screen](client/public/login_screen.png) | ![Chat Interface](client/public/chat_screen.png) |

---

## 🛠 Tech Stack

- **Frontend:** React (Vite) + JavaScript
- **Styling & Animation:** Framer Motion + custom inline styles
- **Deployment:** Vercel (Frontend) + Render (Backend)
- **Backend(Planning TS):** Node.js + Express + **TypeScript**
- **Database & ORM(Planning Prisma):** **Neon (Serverless PostgreSQL)** + **Prisma ORM**
- **Authentication:** **OAuth 2.0 (Google & GitHub)** via Passport.js + JWT Session Management
- **Real-time:** Socket.io (WebSocket)
- **Audio:** MediaRecorder API
- **State Management:** React Hooks

---

## ✨ Key Features

### 🔐 Secure OAuth 2.0 Authentication
No more clunky registration forms. Users can instantly securely authenticate using their **Google** or **GitHub** accounts. The backend handles user creation, sessions via secure JWT tokens, and automatic profile integration.

### 🚪 Dynamic Room System & Persistent Storage
- Powered by **PostgreSQL** and **Prisma**, all users, rooms, and chat histories are safely stored in the cloud.
- 4 default rooms: **General, Devils, Hunters, Pochita**
- Create your own room with a custom name
- Each room gets a unique **8-character invite code** (e.g. `KAIRYU42`)
- Share the code — anyone can join instantly
- Per-room message history is fully persistent

### 💬 Real-time Messaging
Instant message exchange without page reloads via persistent WebSocket connection. Messages appear simultaneously for all users in the room.

### 👤 User Identity & Profile Customization
- Automatic avatar and name fetching from Google/GitHub profiles.
- Integrated fully functional **Profile Tab** with an interactive **Log Out** mechanics for seamless account switching.
- System notifications when users join.

### ⌨️ Typing Indicators
Live "is typing..." status with animated bouncing dots — visible to everyone in the room in real time.

### 🎤 Voice Messages
Hold the microphone button to record, release to send. Audio messages appear inline with a built-in player powered by the **MediaRecorder API**.

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
- **❤️ Pochita love trigger** — typing 'honey','baby','darling', 'cute', 'love', 'sweet', 'aww', '🥺', '💕', '😍', '🐾' or sending ❤️ has a 40% chance of making Pochita leap from the bottom of the screen with a fountain of hand-drawn hearts.

---

## 🚀 Installation & Environment

Clone the repository:
```bash
git clone [https://github.com/your-username/chainsaw-chat](https://github.com/your-username/chainsaw-chat)
cd chainsaw-chat
Backend Setup (/server)

Create a .env file in the server directory:
Code snippet

DATABASE_URL="postgresql://user:password@neon-host/dbname?sslmode=require"
JWT_SECRET="your_jwt_secret"
GOOGLE_CLIENT_ID="your_google_id"
GOOGLE_CLIENT_SECRET="your_google_secret"
GITHUB_CLIENT_ID="your_github_id"
GITHUB_CLIENT_SECRET="your_github_secret"
CLIENT_URL="http://localhost:5173"

Install dependencies and run migrations:
Bash

cd server
npm install
npx prisma db push
npm run dev

Frontend Setup (/client)

Create a .env file in the client directory:
Code snippet

VITE_API_URL="http://localhost:5000"

Install and run:
Bash

cd client
npm install
npm run dev

📁 Project Structure

chainsaw-chat/
├── server/
│   ├── prisma/
│   │   └── schema.prisma  ← Database models (User, Room, Message)
│   ├── src/
│   │   ├── index.ts       ← TypeScript server entryway
│   │   └── passport.ts    ← Google & GitHub OAuth Strategy configuration
│   └── package.json
└── client/
    ├── src/
    │   ├── App.jsx        ← Main application hub
    │   ├── fonts.css      ← Chainsaw Man font declarations
    │   └── main.jsx
    └── public/
        ├── favicon.svg    ← Denji custom favicon
        ├── denji.png / aki.png / makima.png / reze.png / pochita.png
        ├── hand.png
        ├── chainsaw.mp3
        ├── bubble.png / bubble_me.png
        ├── heart_0.png ... heart_8.png
        └── icon_chat.png / icon_rooms.png / icon_settings.png / icon_profile.png

🛤 Road Map

    [x] Database integration (Neon Serverless PostgreSQL)

    [ ] Prisma ORM configuration

    [ ] TypeScript backend migration

    [x] Google & GitHub OAuth 2.0 Integration

    [x] User avatars, live dynamic profile extraction and logout support

    [ ] Video messages via WebRTC

    [ ] Mobile-responsive UI improvements

    [ ] Message reactions

    [ ] Auth with login/password

    [ ] Contect menu (Right button click)

Created with love for Nayuta and clean code. 🩸



