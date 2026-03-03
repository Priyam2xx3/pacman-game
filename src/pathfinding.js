/**
 * A* Pathfinding Implementation for Grid-based Movement.
 * Showcases algorithm skills with a priority queue proxy.
 */

class Node {
    constructor(c, r, parent = null, g = 0, h = 0) {
        this.c = c;
        this.r = r;
        this.parent = parent;
        this.g = g; // exact cost from start
        this.h = h; // estimated cost to target (heuristic)
        this.f = g + h; // total cost
    }
}

// Manhattan distance heuristic
function heuristic(c, r, targetC, targetR) {
    return Math.abs(c - targetC) + Math.abs(r - targetR);
}

/**
 * Returns the direction {vx, vy} to take for the shortest path to target.
 * Prevents 180-degree immediate turns (ghost restriction in Pac-Man).
 */
export function getNextMoveAStar(map, mapCols, mapRows, startC, startR, targetC, targetR, currentVx, currentVy) {
    // If already at target or invalid map
    if (startC === targetC && startR === targetR) return null;

    let openList = [];
    let closedSet = new Set();

    // Convert current velocity to node direction check
    let invalidDirC = currentVx !== 0 ? -Math.sign(currentVx) : 0;
    let invalidDirR = currentVy !== 0 ? -Math.sign(currentVy) : 0;

    let startNode = new Node(startC, startR, null, 0, heuristic(startC, startR, targetC, targetR));
    openList.push(startNode);

    const dirs = [
        { c: 0, r: -1 }, // Up
        { c: 0, r: 1 },  // Down
        { c: -1, r: 0 }, // Left
        { c: 1, r: 0 }   // Right
    ];

    while (openList.length > 0) {
        // Sort to proxy a Priority Queue (lowest f first)
        openList.sort((a, b) => a.f - b.f);
        let current = openList.shift();

        // Target reached
        if (current.c === targetC && current.r === targetR) {
            // Trace back to the first step
            let step = current;
            while (step.parent && step.parent.parent !== null) {
                step = step.parent;
            }
            return {
                vx: step.c - startC,
                vy: step.r - startR
            };
        }

        closedSet.add(`${current.c},${current.r}`);

        // Explore neighbors
        for (let d of dirs) {
            let nc = current.c + d.c;
            let nr = current.r + d.r;

            // Handle wrap-around map (tunnel)
            if (nc < 0) nc = mapCols - 1;
            else if (nc >= mapCols) nc = 0;

            // Ghost cannot reverse direction on the VERY FIRST step 
            // from its starting grid position (classic pac-man rule)
            if (current.parent === null && d.c === invalidDirC && d.r === invalidDirR) {
                continue;
            }

            // Check walls (1 = wall, 4 = gate). Ghosts outside gate treat 4 as wall.
            // For simplicity, we assume A* considers 1 as impassable. 
            // We allow ghosts to traverse 4 (gate) if they are in the ghost house or returning.
            if (nr < 0 || nr >= mapRows) continue;
            let tile = map[nr] ? map[nr][nc] : 1;
            if (tile === 1) continue;

            // Skip already evaluated nodes
            if (closedSet.has(`${nc},${nr}`)) continue;

            let gScore = current.g + 1;
            let hScore = heuristic(nc, nr, targetC, targetR);
            let neighborNode = new Node(nc, nr, current, gScore, hScore);

            // Check if better path exists in openList
            let existingNode = openList.find(n => n.c === nc && n.r === nr);
            if (!existingNode) {
                openList.push(neighborNode);
            } else if (gScore < existingNode.g) {
                existingNode.g = gScore;
                existingNode.f = gScore + existingNode.h;
                existingNode.parent = current;
            }
        }

        // Safety Break (limit search depth for performance on huge open maps)
        if (closedSet.size > 200) break;
    }

    // Fallback: If no path found (target blocked or enclosed), return a valid valid move
    return getFallbackMove(map, mapCols, mapRows, startC, startR, invalidDirC, invalidDirR);
}

export function getFallbackMove(map, mapCols, mapRows, c, r, invalidC, invalidR) {
    const dirs = [
        { vx: 0, vy: -1 }, { vx: 0, vy: 1 }, { vx: -1, vy: 0 }, { vx: 1, vy: 0 }
    ];
    let valid = [];

    for (let d of dirs) {
        // Prevent reversing
        if (d.vx === invalidC && d.vy === invalidR) continue;

        let nc = c + d.vx;
        let nr = r + d.vy;

        if (nc < 0) nc = mapCols - 1;
        else if (nc >= mapCols) nc = 0;

        let tile = map[nr] ? map[nr][nc] : 1;
        // Don't treat gate (4) as wall strictly for fallback unless fully out
        if (tile !== 1) {
            valid.push(d);
        }
    }

    if (valid.length > 0) {
        return valid[Math.floor(Math.random() * valid.length)]; // random valid turn
    }
    // If truly trapped, reverse direction
    return { vx: invalidC, vy: invalidR };
}

/**
 * Normal Mode heuristic (Semi-Random)
 * Calculates a few steps ahead but occasionally picks a random valid fork.
 */
export function getNextMoveSemiRandom(map, mapCols, mapRows, c, r, currentVx, currentVy, targetC, targetR, chaseProbability) {
    if (Math.random() < chaseProbability) {
        return getNextMoveAStar(map, mapCols, mapRows, c, r, targetC, targetR, currentVx, currentVy);
    } else {
        return getFallbackMove(map, mapCols, mapRows, c, r, currentVx !== 0 ? -Math.sign(currentVx) : 0, currentVy !== 0 ? -Math.sign(currentVy) : 0);
    }
}
