# DigiPortFolio. 🚀

> **The elite platform for creators to showcase their work in a bento-style workspace.**

DigiPortFolio (DPB) is a modern, premium portfolio builder designed to elevate your digital identity. With an emphasis on polished, highly-responsive glassmorphic UIs and dynamic layouts, it empowers developers and creatives to seamlessly aggregate and publish their active projects.

## ✨ Features

* **Bento Grid Architecture**: A highly responsive, visual-first presentation layer mirroring top-tier design trends.
* **Intelligent Light/Dark Adaptability**: Dynamically engineered UI variables providing seamless transitions between vibrant light modes and elegant dark themes.
* **Instant Public Preview**: Dedicated standalone URL routes (`/p/:id`) that cleanly present your portfolio without editing-panel clutter.
* **Rich Dashboard Management**: Fully-featured management hub for live editing identity profiles, tracking projects, and switching visual layouts.
* **Secure Authentication**: Built with JWT authentication to ensure only you can manipulate your draft portfolios and live deployments.
* **Theme Engine**: Instantly reskin your entire public portfolio with single-click color palette and gradient presets.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18, Vite, TypeScript
- **Routing**: React Router DOM (v6)
- **Styling**: Pure CSS (featuring complex variables, glassmorphism `backdrop-filter` utility, and dynamic CSS grid mapping)
- **Icons**: Lucide React

### Backend
- **Server**: Node.js, Express.js
- **Database**: SQLite3 (robust, PRAGMA-supported local schemas)
- **Security**: bcrypt, jsonwebtoken, CORS

## 🚀 Quick Start

### 1. Backend Setup

Open a terminal and navigate to the `server` directory:

```bash
cd server
npm install
npm run dev
```

*The backend server will start locally on `http://localhost:3001`. It will automatically spin up the SQLite schema on boot.*

### 2. Frontend Setup

In a new terminal, navigate to the `client` directory:

```bash
cd client
npm install
npm run dev
```

*The frontend development server will launch via Vite. Open `http://localhost:5176` in your browser.*

## 🔒 Security Notice

Please note the `/server/database.db` and any `.env` secrets are automatically hidden from this repository via `.gitignore`. If you clone this codebase fresh, a clean local SQLite database will be generated automatically on your first boot sequence.

---

*Designed and engineered with precision.*
