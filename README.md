<div align="center">
<img width="120" height="120" alt="Wire Room Logo" src="public/logo.png" />
</div>

# Wire Room Racking & Reel Location Tool

A visual, interactive inventory layout tool for managing racking bins and reel rows with intuitive drag-and-drop organization. Designed for warehouse staff to efficiently track the physical location and state of wire reels.

## 🚀 Features

- **Visual Grid Layout**: Configure racking bins in a grid that matches your physical warehouse layout.
- **Reel Row Management**: Manage freestanding or floor racks with dedicated reel rows.
- **Drag & Drop Organization**: Seamlessly move reels between bins and rows using `@dnd-kit`.
- **Persistent State**: Automatic data persistence using IndexedDB (via `idb` library) for reliable offline-first storage.
- **Context Menus**: Right-click any reel, bin, or row to access quick actions like renaming, coloring, or removal.
- **Customizable Entities**: Assign colors and names to bins and reels for better visual categorization.
- **Unit Support**: Flexible handling of length units (ft/m) with global and per-reel settings.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Interactions**: [@dnd-kit](https://dndkit.com/) for Drag & Drop
- **Icons**: [Lucide React](https://lucide.dev/)
- **Storage**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via `idb`
- **Animations**: [Motion](https://motion.dev/)

## 📂 Project Structure

```text
src/
├── components/     # UI Components (Bins, Rows, Reels, Modals, etc.)
├── lib/            # Utility functions and Storage logic
├── types.ts        # TypeScript definitions
├── App.tsx         # Main application entry point
└── main.tsx        # React DOM rendering
```

## 💻 Local Development

**Prerequisites:** [Node.js](https://nodejs.org/) (latest LTS recommended)

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## 📦 Build & Deployment

### Production Build
To create a production-ready build:
```bash
npm run build
```
This generates a `dist/` directory with optimized assets.

### Deployment
This project is configured for **GitHub Pages**. Deployments are automated via GitHub Actions whenever changes are pushed to the `main` branch.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---

*Part of the Wire-Tools Suite.*
