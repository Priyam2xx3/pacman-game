export class LevelManager {
    constructor() {
        this.level = 1;
        this.difficulty = 'normal'; // easy, normal, hard
    }

    setDifficulty(diff) {
        this.difficulty = diff;
    }

    reset() {
        this.level = 1;
    }

    nextLevel() {
        this.level++;
    }

    getConfig() {
        // Base configurations
        let config = {
            pacmanSpeed: 2,
            ghostBaseSpeed: 1,
            powerUpDuration: 600, // frames (~10s at 60fps)
            ghostFrightenedSpeedMult: 0.5,
            ghostCount: 4,
            ghostModes: ['random', 'random', 'random', 'random']
        };

        // Modify based on difficulty
        if (this.difficulty === 'easy') {
            config.powerUpDuration = 600;
            config.ghostBaseSpeed = 1;
        } else if (this.difficulty === 'normal') {
            config.powerUpDuration = 480;
            config.ghostBaseSpeed = 1 + (this.level * 0.1); // gets faster
            config.ghostModes = ['chase', 'random', 'random', 'random'];
        } else if (this.difficulty === 'hard') {
            config.powerUpDuration = 300; // very short power mode
            config.ghostBaseSpeed = 1 + (this.level * 0.2);
            // Aggressive pathfinding configuration
            config.ghostModes = ['chase', 'predictive', 'chase', 'random'];
        }

        // Cap ghost speed to be slightly lower than pacman usually
        if (config.ghostBaseSpeed > 1.8) config.ghostBaseSpeed = 1.8;

        return config;
    }
}
