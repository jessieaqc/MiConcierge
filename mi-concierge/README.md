# Mi Concierge — Frontend 📱

This is the frontend mobile app interface for **Mi Concierge**, built with React and Vite. It features a warm, editorial aesthetic with terracotta and cream colors, utilizing the `Fraunces` and `DM Sans` fonts.

## 🚀 Quick Start

Ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
By default, the app looks for the backend at `http://localhost:8000`. 
If you need to change this, create a `.env` file in this directory:
```env
VITE_API_URL=https://your-production-backend.com
```

### 3. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```
This generates the optimized static files in the `dist` folder.

---

## 📂 Project Structure

The `src` directory has been refactored for clarity and modularity:

```
src/
├── components/       # Reusable UI components (buttons, inputs, cards, UI chrome)
├── screens/          # Main application views (Feed, Profile, PostDetail, Auth, etc.)
├── lib/              # Shared logic (API client, mappers, constants)
├── assets/           # Static assets (images, vectors)
├── App.jsx           # Main router and state orchestrator
├── main.jsx          # React DOM entry point
└── index.css         # Global styles & Tailwind entry
```

## 🛠️ Tech Stack

- **React**: UI library
- **Vite**: Build tool and dev server
- **Tailwind CSS** (via index.css): Utility-first styling
- **Lucide React**: Beautiful, consistent icons

## 🎨 Design System

- **Typography**: 
  - `Fraunces` (serif) for elegant, editorial headings.
  - `DM Sans` (sans-serif) for readable body text.
  - `JetBrains Mono` for uppercase metadata tags.
- **Palette**: 
  - Backgrounds: `#F2EAD9` (bg), `#FBF6EA` (paper)
  - Ink: `#1A130C` (main text), `#73604A` (soft)
  - Accents: Terracotta (`#B83A13`), Forest Green (`#3D5C3A`), Gold (`#C8932B`)
