# Pac-Man Arcade - Neon Edition

A modern, highly polished, and architecturally clean recreation of the classic Pac-Man game. This project demonstrates advanced algorithm implementations, clean ES6 module architecture, and modern vanilla web development practices.

![Gameplay Screenshot placeholder](https://via.placeholder.com/800x400.png?text=Neon+Pac-Man+Gameplay)

## 🎯 Project Overview

This is no ordinary Pac-Man clone. It has been re-engineered from the ground up to showcase solid software engineering principles, featuring an A* pathfinding algorithm for intelligent Ghost AI, an elegant state machine for game logic, and a visually stunning Neon UI without relying on heavy frameworks.

## 🚀 Features

- **Advanced Ghost AI:** Ghosts behave differently based on difficulty. On "Hard" mode, ghosts actively hunt using a grid-based **A* Search Algorithm**.
- **Ghost Personalities:** Includes classic behaviors like Aggressive (direct chase) and Predictive (targeting ahead of the player).
- **Dynamic Difficulty & Leveling:** The game speeds up, and Ghost AI becomes more aggressive as levels progress.
- **Power-Ups & Combo Scoring:** Eating a Power Pellet flips the ghost state cleanly via an internal state machine, triggering reverse behavior and combo score multipliers.
- **Achievement System:** Unlockable badges (e.g., "Ghost Hunter", "Masochist") tracked and stored persistently.
- **Data Persistence:** LocalStorage-backed top 5 high-score leaderboard and saved achievements.
- **Polished UI/UX:** 60fps rendering, CSS transitions, particle backgrounds, and a Dark/Light toggle.
- **Mobile Responsive:** Includes an on-screen D-Pad for seamless mobile play.

## 🧠 Technical Architecture

The codebase is split into robust ES6 modules, strictly separating concerns:
- `src/gameEngine.js` - The core orchestration, rendering loop (`requestAnimationFrame`), and DOM event logic.
- `src/pathfinding.js` - Implements the **A* Algorithm** with Manhattan distance heuristics and fallback BFS pathing.
- `src/ghostAI.js` - OOP classes for Entities, handling State Transitions (`normal`, `frightened`, `eaten`). 
- `src/levelManager.js` - Handles scaling configs mapping levels to AI speeds and behaviors.
- `src/scoreboard.js` & `src/achievements.js` - Wrappers for `localStorage` interaction and toast UI.

## 🛠️ Technologies Used
- **HTML5 Canvas:** For high-performance 2D grid rendering.
- **Vanilla Javascript (ES6):** No external libraries. Utilizing ES6 Modules, Classes, and strict scoping.
- **Vanilla CSS:** Custom properties (variables), keyframe animations, and neon text-shadow effects.
- **Web Audio API:** Synthesized sine, triangle, and sawtooth waves for retro sound effects (no external `.mp3` dependencies).

## 🎮 How to Run

Because this project uses native **ES6 Modules** (`<script type="module">`), you cannot run it by simply double-clicking the `index.html` file due to browser CORS policies. 

You must serve it over a local HTTP server.
1. Install an extension like **Live Server** in VSCode.
2. Click "Go Live" to serve the `index.html`.
3. Alternatively, using Node.js via terminal: `npx serve .` 

## 🔮 Future Improvements
- Port to TypeScript for rigid type definitions on the Grid matrices and AI states.
- Add external joystick controller support via the HTML5 Gamepad API.
- Introduce additional maze layouts parsing dynamically from text files.
