import { initAudio, playSound, isCenter, getGridPos } from './utils.js';
import { LevelManager } from './levelManager.js';
import { Ghost, Pacman } from './ghostAI.js';
import { saveScore, renderLeaderboard } from './scoreboard.js';
import { unlockAchievement, checkAchievement } from './achievements.js';

// --- Constants & Globals ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');

const tileSize = 30;
const mapCols = 21;
const mapRows = 21;

// 0: dot, 1: wall, 2: empty, 3: power pellet, 4: gate
const initialMap = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 3, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 3, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 2, 1, 2, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 4, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2, 0, 2, 2, 1, 2, 2, 2, 1, 2, 2, 0, 2, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 3, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 3, 1],
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const mapCanvas = document.createElement('canvas');
mapCanvas.width = canvas.width;
mapCanvas.height = canvas.height;
const mapCtx = mapCanvas.getContext('2d');

let map = [];
let totalDots = 0;
let score = 0;
let lives = 3;
let powerModeTimer = 0;
let ghostsEatenInPowerMode = 0;
let gameState = 'landing'; // landing, difficulty, playing, gameover, win, paused

let mouthOpen = 0;
let mouthDir = 1;
let rafId = null;

const levelMgr = new LevelManager();
let pacman = new Pacman(10, 15, 2, tileSize);
pacman.nextVx = 0;
pacman.nextVy = 0;
let ghosts = [];

// Base UI References
const screens = {
    landing: document.getElementById('landing-screen'),
    difficulty: document.getElementById('difficulty-screen'),
    leaderboard: document.getElementById('leaderboard-screen'),
    game: document.getElementById('game-screen')
};

// Start logic
document.getElementById('btn-to-difficulty').addEventListener('click', () => switchScreen('difficulty'));
document.getElementById('btn-leaderboard').addEventListener('click', () => {
    renderLeaderboard('leaderboard-list');
    switchScreen('leaderboard');
});
document.getElementById('btn-back-landing').addEventListener('click', () => switchScreen('landing'));
document.getElementById('btn-back-from-lb').addEventListener('click', () => switchScreen('landing'));
document.getElementById('restartBtn').addEventListener('click', () => startGame(levelMgr.difficulty));
document.getElementById('menuBtn').addEventListener('click', () => switchScreen('landing'));
document.getElementById('resumeBtn').addEventListener('click', togglePause);
document.getElementById('quitBtn').addEventListener('click', () => switchScreen('landing'));

// Theme Toggle
document.getElementById('themeToggleBtn').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    initMapGraphics(); // redraw map colors
});

document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const diff = e.target.getAttribute('data-diff');
        startGame(diff);
    });
});

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
    gameState = screenName;

    if (screenName === 'game' && rafId === null) {
        // Stop current loops if playing
    } else {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}

function startGame(difficulty) {
    initAudio();
    levelMgr.setDifficulty(difficulty);
    levelMgr.reset();
    score = 0;
    lives = 3;

    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('pauseOverlay').classList.add('hidden');

    switchScreen('game');
    initLevel();

    gameState = 'playing';
    requestAnimationFrame(gameLoop);
}

function initLevel() {
    map = JSON.parse(JSON.stringify(initialMap));
    totalDots = 0;
    powerModeTimer = 0;
    ghostsEatenInPowerMode = 0;

    for (let r = 0; r < mapRows; r++) {
        for (let c = 0; c < mapCols; c++) {
            if (map[r][c] === 0 || map[r][c] === 3) totalDots++;
        }
    }

    initMapGraphics();

    let config = levelMgr.getConfig();
    pacman.baseSpeed = config.pacmanSpeed;
    pacman.speed = config.pacmanSpeed;
    pacman.reset();

    // Config Ghost instances based on diff/level
    ghosts = [
        new Ghost('blinky', 10, 7, '#ff0000', config.ghostModes[0], tileSize),
        new Ghost('pinky', 9, 9, '#ffb8ff', config.ghostModes[1], tileSize),
        new Ghost('inky', 10, 9, '#00ffff', config.ghostModes[2], tileSize),
        new Ghost('clyde', 11, 9, '#ffb852', config.ghostModes[3], tileSize)
    ];

    // Apply speed
    ghosts.forEach(g => {
        g.baseSpeed = config.ghostBaseSpeed;
        g.speed = config.ghostBaseSpeed;
    });

    updateHUD();
}

function initMapGraphics() {
    mapCtx.fillStyle = '#000';
    mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

    const isLight = document.body.classList.contains('light-theme');
    mapCtx.strokeStyle = isLight ? '#0055ff' : '#00ffff';
    mapCtx.lineWidth = 3;
    mapCtx.shadowBlur = 12;
    mapCtx.shadowColor = mapCtx.strokeStyle;

    for (let r = 0; r < mapRows; r++) {
        for (let c = 0; c < mapCols; c++) {
            if (map[r][c] === 1) {
                mapCtx.strokeRect(c * tileSize + 4, r * tileSize + 4, tileSize - 8, tileSize - 8);
            } else if (map[r][c] === 4) { // Gate
                mapCtx.strokeStyle = '#ff66ff';
                mapCtx.beginPath();
                mapCtx.moveTo(c * tileSize, r * tileSize + tileSize / 2);
                mapCtx.lineTo(c * tileSize + tileSize, r * tileSize + tileSize / 2);
                mapCtx.stroke();
                mapCtx.strokeStyle = isLight ? '#0055ff' : '#00ffff';
            }
        }
    }
}

function updateHUD() {
    scoreEl.innerText = score;
    livesEl.innerText = lives;
    levelEl.innerText = levelMgr.level;

    if (score >= 500) unlockAchievement('score_500');
}

// --- Inputs ---
window.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === 'Escape') {
        togglePause();
        return;
    }

    if (gameState !== 'playing') return;

    let nextVx = 0;
    let nextVy = 0;
    let angle = pacman.angle;

    if (e.key === 'ArrowUp') { pacman.nextVx = 0; pacman.nextVy = -tileSize; }
    else if (e.key === 'ArrowDown') { pacman.nextVx = 0; pacman.nextVy = tileSize; }
    else if (e.key === 'ArrowLeft') { pacman.nextVx = -tileSize; pacman.nextVy = 0; }
    else if (e.key === 'ArrowRight') { pacman.nextVx = tileSize; pacman.nextVy = 0; }
    else return;

    e.preventDefault();
});

// Mobile Controls D-Pad bridging
['Up', 'Down', 'Left', 'Right'].forEach(dir => {
    const btn = document.getElementById(`btn${dir}`);
    if (btn) {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btn.classList.add('active');
            setTimeout(() => btn.classList.remove('active'), 150);
            window.dispatchEvent(new KeyboardEvent('keydown', { key: `Arrow${dir}` }));
        });
    }
});

// --- Movement & Logic ---
function attemptPacmanTurn() {
    // Only attempt turn if a new direction is queued
    if (pacman.nextVx === 0 && pacman.nextVy === 0) return;

    // Only turn if precisely in the center of a tile
    if (isCenter(pacman.x, pacman.y, tileSize)) {
        let c = getGridPos((pacman.x + canvas.width) % canvas.width, tileSize);
        let r = getGridPos(pacman.y, tileSize);
        let nc = c + Math.sign(pacman.nextVx);
        let nr = r + Math.sign(pacman.nextVy);

        if (nc < 0) nc = mapCols - 1; else if (nc >= mapCols) nc = 0;

        let tile = map[nr] ? map[nr][nc] : 1;
        if (nr >= 0 && nr < mapRows && tile !== 1 && tile !== 4) {
            pacman.vx = pacman.nextVx;
            pacman.vy = pacman.nextVy;

            // Set angle based on physical movement applied
            if (pacman.vx > 0) pacman.angle = 0;
            else if (pacman.vx < 0) pacman.angle = Math.PI;
            else if (pacman.vy > 0) pacman.angle = Math.PI / 2;
            else if (pacman.vy < 0) pacman.angle = -Math.PI / 2;

            // Reset queued turn
            pacman.nextVx = 0;
            pacman.nextVy = 0;
        }
    } else if (
        // Allow immediate 180 degree U-turns without waiting for center
        (pacman.vx !== 0 && Math.sign(pacman.vx) === -Math.sign(pacman.nextVx)) ||
        (pacman.vy !== 0 && Math.sign(pacman.vy) === -Math.sign(pacman.nextVy))
    ) {
        pacman.vx = pacman.nextVx;
        pacman.vy = pacman.nextVy;
        if (pacman.vx > 0) pacman.angle = 0;
        else if (pacman.vx < 0) pacman.angle = Math.PI;
        else if (pacman.vy > 0) pacman.angle = Math.PI / 2;
        else if (pacman.vy < 0) pacman.angle = -Math.PI / 2;
        pacman.nextVx = 0;
        pacman.nextVy = 0;
    }
}

function movePacman() {
    attemptPacmanTurn();

    if (pacman.vx === 0 && pacman.vy === 0) return;

    let c = getGridPos((pacman.x + canvas.width) % canvas.width, tileSize);
    let r = getGridPos(pacman.y, tileSize);

    let prevX = pacman.x;
    let prevY = pacman.y;

    // Calculate fractional movement
    let moveX = Math.sign(pacman.vx) * pacman.speed;
    let moveY = Math.sign(pacman.vy) * pacman.speed;

    pacman.x += moveX;
    pacman.y += moveY;

    // Check collision with walls exactly
    let newC = getGridPos((pacman.x + (Math.sign(pacman.vx) * tileSize / 2) + canvas.width) % canvas.width, tileSize);
    let newR = getGridPos(pacman.y + (Math.sign(pacman.vy) * tileSize / 2), tileSize);

    if (newC < 0) newC = mapCols - 1; else if (newC >= mapCols) newC = 0;
    if (newR < 0) newR = 0; else if (newR >= mapRows) newR = mapRows - 1;

    let tileFront = map[newR][newC];
    if (tileFront === 1 || tileFront === 4) {
        // Hit wall, snap back to center
        pacman.x = c * tileSize + tileSize / 2;
        pacman.y = r * tileSize + tileSize / 2;
        pacman.vx = 0;
        pacman.vy = 0;
    } else {
        // Keep centered on axis not moving
        if (moveX !== 0) pacman.y = r * tileSize + tileSize / 2;
        if (moveY !== 0) pacman.x = c * tileSize + tileSize / 2;
    }

    // Wrap around
    if (pacman.x < -tileSize / 2) pacman.x += canvas.width;
    if (pacman.x > canvas.width + tileSize / 2) pacman.x -= canvas.width;

    // Eat mechanism
    c = getGridPos((pacman.x + canvas.width) % canvas.width, tileSize);
    r = getGridPos(pacman.y, tileSize);

    if (map[r] && map[r][c] === 0) {
        map[r][c] = 2; // set to empty
        score += 10;
        playSound('chomp');
        totalDots--;
        updateHUD();
    } else if (map[r] && map[r][c] === 3) {
        map[r][c] = 2;
        score += 50;
        let config = levelMgr.getConfig();
        powerModeTimer = config.powerUpDuration;
        ghostsEatenInPowerMode = 0;
        playSound('powerPellet');
        totalDots--;
        updateHUD();

        // Make ghosts frightened
        ghosts.forEach(g => {
            if (g.state !== 'eaten') {
                g.state = 'frightened';
                // reverse direction
                g.vx = -g.vx;
                g.vy = -g.vy;
            }
        });
    }
}

function checkCollisions() {
    let hitSqDist = 200; // ~14px distance
    for (let ghost of ghosts) {
        let dx = ghost.x - pacman.x;
        let dy = ghost.y - pacman.y;
        if (dx * dx + dy * dy < hitSqDist) {
            if (ghost.state === 'frightened') {
                ghost.state = 'eaten';
                ghostsEatenInPowerMode++;
                score += 200 * Math.pow(2, ghostsEatenInPowerMode - 1);

                if (ghostsEatenInPowerMode >= 3) unlockAchievement('ghost_hunter');

                playSound('eatGhost');
                updateHUD();
            } else if (ghost.state === 'normal') {
                // Generous collision buffer for ghost deaths
                let overlapDist = 180;
                if (dx * dx + dy * dy < overlapDist) {
                    playSound('die');
                    lives--;
                    updateHUD();

                    if (lives <= 0) {
                        handleGameOver();
                    } else {
                        pacman.reset();
                        pacman.nextVx = 0;
                        pacman.nextVy = 0;
                        ghosts.forEach(g => g.reset());
                    }
                    break;
                }
            }
        }
    }
}

function handleGameOver() {
    gameState = 'gameover';
    document.getElementById('finalScore').innerText = score;
    document.getElementById('gameOverOverlay').classList.remove('hidden');

    let pName = document.getElementById('player-name').value;
    saveScore(pName, score, levelMgr.difficulty, levelMgr.level);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapCanvas, 0, 0);

    // Draw dots
    ctx.fillStyle = '#fff';
    for (let r = 0; r < mapRows; r++) {
        for (let c = 0; c < mapCols; c++) {
            if (map[r] && map[r][c] === 0) {
                ctx.beginPath();
                ctx.arc(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (map[r] && map[r][c] === 3) {
                let radius = 6 + Math.sin(Date.now() / 150) * 2;
                ctx.beginPath();
                ctx.arc(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2, radius, 0, Math.PI * 2);
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#fff';
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    // Draw Ghosts
    ghosts.forEach(ghost => {
        ctx.save();
        ctx.translate(ghost.x, ghost.y);

        let isFlashing = ghost.state === 'frightened' && powerModeTimer < 120;

        if (ghost.state === 'eaten') {
            // Draw eyes only
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(-4, -4, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(4, -4, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#00f';
            ctx.beginPath(); ctx.arc(-4, -4, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(4, -4, 2, 0, Math.PI * 2); ctx.fill();
        } else {
            if (ghost.state === 'frightened') {
                ctx.fillStyle = isFlashing && Math.floor(Date.now() / 200) % 2 === 0 ? '#fff' : '#0000ff';
            } else {
                ctx.fillStyle = ghost.color;
            }

            ctx.beginPath();
            ctx.arc(0, -2, 12, Math.PI, 0);
            ctx.lineTo(12, 12);
            ctx.lineTo(8, 8);
            ctx.lineTo(4, 12);
            ctx.lineTo(0, 8);
            ctx.lineTo(-4, 12);
            ctx.lineTo(-8, 8);
            ctx.lineTo(-12, 12);
            ctx.closePath();

            ctx.shadowBlur = 15;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(-4, -4, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(4, -4, 4, 0, Math.PI * 2); ctx.fill();

            if (ghost.state !== 'frightened' || isFlashing) {
                let px = ghost.vx !== 0 ? Math.sign(ghost.vx) * 2 : 0;
                let py = ghost.vy !== 0 ? Math.sign(ghost.vy) * 2 : 0;
                ctx.fillStyle = '#00f';
                ctx.beginPath(); ctx.arc(-4 + px, -4 + py, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(4 + px, -4 + py, 2, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.fillStyle = '#ffb8ae';
                ctx.fillRect(-6, 2, 12, 2);
            }
        }
        ctx.restore();
    });

    // Draw Pacman
    ctx.save();
    ctx.translate(pacman.x, pacman.y);
    ctx.rotate(pacman.angle);

    if (pacman.vx !== 0 || pacman.vy !== 0) {
        mouthOpen += 0.08 * mouthDir;
        if (mouthOpen > 0.6 || mouthOpen < 0) mouthDir *= -1;
    }
    let m = Math.max(0, mouthOpen);

    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(0, 0, 13, m, Math.PI * 2 - m);
    ctx.lineTo(0, 0);
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffeb3b';
    ctx.fill();
    ctx.restore();
}

// Map Particle Background logic
const pCanvas = document.getElementById('particles');
const pCtx = pCanvas.getContext('2d');
let particles = [];
function initParticles() {
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * pCanvas.width,
            y: Math.random() * pCanvas.height,
            size: Math.random() * 2 + 1,
            speedY: Math.random() * 0.5 + 0.1
        });
    }
}
initParticles();

function drawParticles() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    pCtx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    particles.forEach(p => {
        p.y -= p.speedY;
        if (p.y < 0) {
            p.y = pCanvas.height;
            p.x = Math.random() * pCanvas.width;
        }
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pCtx.fill();
    });
}

function gameLoop() {
    if (gameState === 'playing') {
        if (powerModeTimer > 0) {
            powerModeTimer--;
            if (powerModeTimer === 0) {
                ghosts.forEach(g => {
                    if (g.state === 'frightened') g.state = 'normal';
                });
            }
        }

        drawParticles();
        movePacman();

        let config = levelMgr.getConfig();
        ghosts.forEach(ghost => ghost.update(map, mapCols, mapRows, pacman, config));

        checkCollisions();

        if (totalDots === 0) {
            playSound('levelUp');
            unlockAchievement('first_win');
            if (levelMgr.difficulty === 'hard') unlockAchievement('hard_mode');

            gameState = 'loading'; // slight pause before next level
            setTimeout(() => {
                levelMgr.nextLevel();
                initLevel();
                gameState = 'playing';
            }, 2000);
        }

        draw();
    }

    if (gameState === 'playing' || gameState === 'loading') {
        rafId = requestAnimationFrame(gameLoop);
    }
}

// Background animation for landing screen
function menuAnimation() {
    if (gameState === 'landing' || gameState === 'difficulty' || gameState === 'leaderboard' || gameState === 'paused') {
        drawParticles();
    }
    requestAnimationFrame(menuAnimation);
}
menuAnimation();
