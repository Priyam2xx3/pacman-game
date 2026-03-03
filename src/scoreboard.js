const SCORE_KEY = 'pacman_neon_scores';

export function getTopScores() {
    let scores = [];
    try {
        const data = localStorage.getItem(SCORE_KEY);
        if (data) scores = JSON.parse(data);
    } catch (e) {
        console.warn('LocalStorage not available');
    }
    return Array.isArray(scores) ? scores : [];
}

export function saveScore(name, score, difficulty, level) {
    if (!name.trim()) name = 'ANON';
    let scores = getTopScores();
    scores.push({
        name: name.substring(0, 10).toUpperCase(),
        score: score,
        difficulty: difficulty.toUpperCase(),
        level: level,
        date: new Date().toLocaleDateString()
    });

    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);
    // Keep top 5
    scores = scores.slice(0, 5);

    try {
        localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
    } catch (e) {
        console.warn('LocalStorage not available');
    }
    return scores;
}

export function renderLeaderboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const scores = getTopScores();
    if (scores.length === 0) {
        container.innerHTML = '<div class="lb-entry">NO SCORES YET</div>';
        return;
    }

    container.innerHTML = scores.map((s, index) => `
        <div class="lb-entry">
            <span>${index + 1}. ${s.name} (${s.difficulty})</span>
            <span>${s.score}</span>
        </div>
    `).join('');
}
