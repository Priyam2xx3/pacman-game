import { isCenter, getGridPos } from './utils.js';
import { getNextMoveAStar, getFallbackMove, getNextMoveSemiRandom } from './pathfinding.js';

export class BaseEntity {
    constructor(startX, startY, speed, tileSize) {
        this.startX = startX;
        this.startY = startY;
        this.baseSpeed = speed;
        this.speed = speed;
        this.tileSize = tileSize;
        this.reset();
    }
    reset() {
        this.x = this.startX * this.tileSize + this.tileSize / 2;
        this.y = this.startY * this.tileSize + this.tileSize / 2;
        this.vx = 0;
        this.vy = 0;
    }
}

export class Pacman extends BaseEntity {
    constructor(startX, startY, speed, tileSize) {
        super(startX, startY, speed, tileSize);
        this.angle = 0;
    }
}

export class Ghost extends BaseEntity {
    constructor(id, startX, startY, color, mode, tileSize) {
        super(startX, startY, 1, tileSize);
        this.id = id;
        this.color = color;
        this.behaviorType = mode; // 'chase', 'predictive', 'random'
        this.state = 'normal'; // 'normal', 'frightened', 'eaten'
    }

    reset() {
        super.reset();
        this.state = 'normal';
        this.vx = this.speed; // usually start moving right
    }

    update(map, mapCols, mapRows, pacman, config) {
        // Adjust speed based on state
        if (this.state === 'eaten') {
            this.speed = 3; // run fast back to base
        } else if (this.state === 'frightened') {
            this.speed = this.baseSpeed * config.ghostFrightenedSpeedMult;
        } else {
            this.speed = this.baseSpeed;
        }

        // Only decide new direction when precisely at the center of a tile
        if (isCenter(this.x, this.y, this.tileSize)) {
            let c = getGridPos(this.x, this.tileSize);
            let r = getGridPos(this.y, this.tileSize);

            let invalidC = this.vx !== 0 ? -Math.sign(this.vx) : 0;
            let invalidR = this.vy !== 0 ? -Math.sign(this.vy) : 0;

            let move = null;

            if (this.state === 'eaten') {
                // Route to ghost house spawn coordinates
                if (c === this.startX && r === this.startY) {
                    this.state = 'normal';
                    move = getFallbackMove(map, mapCols, mapRows, c, r, invalidC, invalidR);
                } else {
                    move = getNextMoveAStar(map, mapCols, mapRows, c, r, this.startX, this.startY, this.vx, this.vy);
                }
            } else if (this.state === 'frightened') {
                // Random turn when frightened to simulate panic
                move = getFallbackMove(map, mapCols, mapRows, c, r, invalidC, invalidR);
            } else {
                // Normal targeting based on behavior type
                let pacC = getGridPos(pacman.x, this.tileSize);
                let pacR = getGridPos(pacman.y, this.tileSize);

                if (this.behaviorType === 'chase') {
                    // Aggressive: Direct A* path to pacman
                    move = getNextMoveAStar(map, mapCols, mapRows, c, r, pacC, pacR, this.vx, this.vy);
                } else if (this.behaviorType === 'predictive') {
                    // Target 4 tiles ahead of pacman's current direction
                    let targetC = pacC + (Math.sign(pacman.vx) * 4);
                    let targetR = pacR + (Math.sign(pacman.vy) * 4);
                    move = getNextMoveAStar(map, mapCols, mapRows, c, r, targetC, targetR, this.vx, this.vy);
                } else if (this.behaviorType === 'semi-random') {
                    // 40% chase chance
                    move = getNextMoveSemiRandom(map, mapCols, mapRows, c, r, this.vx, this.vy, pacC, pacR, 0.4);
                } else {
                    // Fully random roaming
                    move = getFallbackMove(map, mapCols, mapRows, c, r, invalidC, invalidR);
                }
            }

            // Fallback safety if undefined
            if (!move) move = getFallbackMove(map, mapCols, mapRows, c, r, invalidC, invalidR);

            this.vx = move.vx * this.speed;
            this.vy = move.vy * this.speed;
        }

        // Snap to grid lines if drift occurs, but maintain velocity scaling
        if (this.vx !== 0 && Math.abs(this.vx) !== this.speed && isCenter(this.x, this.y, this.tileSize)) {
            this.vx = Math.sign(this.vx) * this.speed;
        }
        if (this.vy !== 0 && Math.abs(this.vy) !== this.speed && isCenter(this.x, this.y, this.tileSize)) {
            this.vy = Math.sign(this.vy) * this.speed;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Tunnel wrapping
        let mapWidth = mapCols * this.tileSize;
        if (this.x < -this.tileSize / 2) this.x += mapWidth;
        if (this.x > mapWidth + this.tileSize / 2) this.x -= mapWidth;
    }
}
