const ACHIEVEMENTS_KEY = 'pacman_neon_achievements';

const achievementsDict = {
    'first_win': { title: 'First Victory', subtitle: 'Clear level 1 for the first time', icon: '🏆' },
    'score_500': { title: 'High Scorer', subtitle: 'Reach 500+ points', icon: '⭐' },
    'hard_mode': { title: 'Masochist', subtitle: 'Beat a level on Hard mode', icon: '🔥' },
    'ghost_hunter': { title: 'Ghost Hunter', subtitle: 'Eat 3 ghosts in one power-up', icon: '👻' }
};

export function getUnlockedAchievements() {
    try {
        const data = localStorage.getItem(ACHIEVEMENTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveUnlockedAchievements(arr) {
    try {
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(arr));
    } catch (e) { }
}

export function checkAchievement(id) {
    const unlocked = getUnlockedAchievements();
    if (unlocked.includes(id)) return true;
    return false;
}

export function unlockAchievement(id) {
    if (checkAchievement(id)) return; // Already unlocked

    const unlocked = getUnlockedAchievements();
    unlocked.push(id);
    saveUnlockedAchievements(unlocked);

    const ach = achievementsDict[id];
    if (ach) {
        showToast(ach.title, ach.subtitle, ach.icon);
    }
}

export function showToast(title, subtitle, icon) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div>
            <strong>${title}</strong><br>
            <span style="color: rgba(255,255,255,0.7);">${subtitle}</span>
        </div>
    `;

    container.appendChild(toast);

    // Remove toast element after animation completes
    setTimeout(() => {
        if (toast.parentNode === container) {
            container.removeChild(toast);
        }
    }, 4000);
}
