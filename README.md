markdown

# 🪚 Chainsaw Chat (Fullstack Real-time Messenger)

> A dark, fast, and noisy fullstack messenger set in the **Chainsaw Man** universe [0.1.2]. Built for those who appreciate the silence of the night city, clean code, and Tatsuki Fujimoto's unique manga aesthetic.

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

---

## 🛠 Tech Stack

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
![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black)

---

## ✨ Key Features

### 📱 Mobile Adaptation & UI/UX Optimization
Chainsaw Chat is fully optimized for mobile devices, adapting the aggressive manga-style layout for seamless one-handed use.
* **Dynamic Viewport (`100dvh`):** Replaced standard `100vh` to prevent mobile browser navigation bars from cutting off the UI layout [0.1.2].
* **Streamlined Header:** Heavy character tabs are safely hidden on mobile viewports for a cleaner interface.
* **Bottom Navigation (`BottomNav`):** Sticky thumb-reach panel for easy switching between core app tabs [0.1.2].
* **Isolated Scroll Containers:** Added independent vertical scrolling (`overflow-y: auto`) to eliminate full-page layout freeze [0.1.2].

### 🔐 Multi-Provider OAuth 2.0 & Session Safety
* Instant, secure authentication via **Google** and **GitHub** social profiles [0.1.2].
* Seamless Passport.js strategy management on the backend layer [0.1.2].
* Automatic user provisioning and secure JWT session tokens issuance [0.1.2].

### 🚪 Dynamic Room System & Persistent Cloud Storage
* Powered by **PostgreSQL** and **Prisma ORM** for solid relational data flows [0.1.2].
* Generate instant custom channels with unique **8-character invite codes** (e.g., `KAIRYU42`).
* Fully persistent message logs and synchronized room membership states.

### 💬 Real-time Synchronization & Voice Engine
* **Zero-Latency Dispatch:** Real-time event propagation via persistent WebSockets (Socket.io) [0.1.2].
* **Tactical Context Menu:** Interactive bubble frames to delete backend records instantly across clients.
* **Alive Typing UI:** Throttled typing indicator broadcast with custom animated bouncing manga dots [0.1.2].
* **Voice Notes Engine:** Captures and encodes mic input into compressed audio blobs via the **MediaRecorder API** [0.1.2].

### 🎨 Manga-Style UI/UX & Easter Eggs
* **Grim Aesthetic:** Authentic printed manga layout featuring halftone backgrounds, side tails, and random speech bubble tilts [0.1.2].
* **Death Rattle Fonts:** Aggressive typographic treatments for uppercase messages with action words (**VROOM!, SLASH!, BANG!**) [0.1.2].
* **Chibi Navigation:** Animated jumps for Denji, Aki, Makima, and Reze active profile state indicators.
* **🪚 Chainsaw Rev:** ALL CAPS text submissions trigger an interactive chainsaw audio sound effect (10% chance) [0.1.2].
* **🐾 Pochita Love:** Keywords like 'love', 'cute', 'aww', or sending ❤️ triggers a Pochita screen leap with hand-drawn hearts (40% chance) [0.1.2].

---

## 🚀 Installation & Environment

### 1. Clone the repository
%%MAGIT_PARSER_PROTECT%%```bash
git clone https://github.com/zxcmazokdyrak12/chainsaw-chat.git
cd chainsaw-chat
%%MAGIT_PARSER_PROTECT%%```

### 2. Backend Setup (`/server`)
Create a `.env` file in the `server/` directory:
%%MAGIT_PARSER_PROTECT%%```env
DATABASE_URL="postgresql://user:password@neon-host/dbname?sslmode=require"
JWT_SECRET="your_jwt_secret"
GOOGLE_CLIENT_ID="your_google_id"
GOOGLE_CLIENT_SECRET="your_google_secret"
GITHUB_CLIENT_ID="your_github_id"
GITHUB_CLIENT_SECRET="your_github_secret"
CLIENT_URL="http://localhost:5173"
%%MAGIT_PARSER_PROTECT%%```
Install backend packages and apply database schema:
%%MAGIT_PARSER_PROTECT%%```bash
cd server
npm install
npx prisma db push
npm run dev
%%MAGIT_PARSER_PROTECT%%```

### 3. Frontend Setup (`/client`)
Create a `.env` file in the `client/` directory:
%%MAGIT_PARSER_PROTECT%%```env
VITE_API_URL="http://localhost:5000"
%%MAGIT_PARSER_PROTECT%%```
Install frontend dependencies and start the Vite dev server:
%%MAGIT_PARSER_PROTECT%%```bash
cd ../client
npm install
npm run dev
%%MAGIT_PARSER_PROTECT%%```

---

## 📁 Project Structure

%%MAGIT_PARSER_PROTECT%%```text
chainsaw-chat/
├── client/                  # Frontend single page application (React + Vite)
│   ├── public/              # Binary graphic assets & custom manga fonts [0.1.2]
│   └── src/                 # Reactive UI components & Framer Motion workflows
├── server/                  # Backend REST API & WebSocket pipeline (Node.js)
│   ├── prisma/
│   │   └── schema.prisma    # Prisma schemas for User, Room, and Message models [0.1.2]
│   └── src/
│       ├── index.ts         # Strictly typed Express server & socket lifecycle [0.1.2]
│       └── passport.ts      # Multi-provider OAuth 2.0 authentication strategies [0.1.2]
%%MAGIT_PARSER_PROTECT%%```

Use code with caution.
