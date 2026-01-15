// Wave Configuration (Aligned with Story Chapters & New Monster Types)
const WAVE_CONFIG = [
    // Chapter 1 (0s): Lead only
    { time: 0, rate: 30, types: ['lead'], max: 50 },

    // Chapter 2 (30s): Add Tank (Increase spawn rate)
    { time: 30, rate: 20, types: ['tank', 'tank', 'lead'], max: 100 },

    // Chapter 3 (60s): Add Dasher (Increase spawn rate)
    { time: 60, rate: 15, types: ['dasher', 'dasher', 'tank', 'lead'], max: 200 },

    // Chapter 4 (90s): Add Ranged (Wizard) - Heavily weighted to appear
    { time: 90, rate: 10, types: ['ranged', 'ranged', 'ranged', 'tank', 'dasher'], max: 300 },

    // Chapter 5 (120s): Add Boss (Demon) - FINAL WAVE
    { time: 120, rate: 30, types: ['boss'], max: 400 } // Faster spawn, ONLY BOSSES
];

function getWaveConfig() {
    // Find the latest config that matches current time
    for (let i = WAVE_CONFIG.length - 1; i >= 0; i--) {
        if (state.seconds >= WAVE_CONFIG[i].time) {
            return WAVE_CONFIG[i];
        }
    }
    return WAVE_CONFIG[0];
}

function spawnOneEnemy() {
    const config = getWaveConfig();

    // Cap enemy count
    if (state.enemies.length >= config.max) return;

    // Edges
    // Edges (Relative to Player in World Space)
    const angle = Math.random() * Math.PI * 2;
    // Spawn radius: Enough to be off-screen (approx 600-800 depending on screen)
    const spawnDist = 700;

    let x = state.player.x + Math.cos(angle) * spawnDist;
    let y = state.player.y + Math.sin(angle) * spawnDist;

    // Clamp Spawn Position to Map Boundaries (3000)
    // This ensures monsters always spawn INSIDE the arena.
    const MAP_SIZE = 3000;
    x = Math.max(50, Math.min(MAP_SIZE - 50, x));
    y = Math.max(50, Math.min(MAP_SIZE - 50, y));

    // Pick Type
    let type = config.types[Math.floor(Math.random() * config.types.length)];

    // Scaling: Base * 1.08^Level + Time Scaling
    // Make scaling a bit more aggressive over time
    const timeMult = 1 + (state.seconds / 60) * 0.8; // Stronger time scaling
    const difficultyMult = Math.pow(1.08, state.level) * timeMult;

    let stats = { hp: 10, speed: 1, visual: '👨‍💼', r: 15, xp: 5 * difficultyMult };

    if (type === 'lead') {
        stats = { hp: 10 * difficultyMult, speed: (1 + Math.random()) * 0.25, visual: '👨‍💼', r: 15, xp: 5 * difficultyMult };
    }
    else if (type === 'tank') {
        stats = { hp: 40 * difficultyMult, speed: 0.5, visual: '👩‍🎓', r: 25, xp: 20 * difficultyMult };
    }
    else if (type === 'dasher') {
        stats = { hp: 15 * difficultyMult, speed: 1.0, visual: '👷', r: 12, xp: 10 * difficultyMult };
    }
    else if (type === 'ranged') {
        stats = { hp: 20 * difficultyMult, speed: 0.75, visual: '👵', r: 18, xp: 15 * difficultyMult, type: 'ranged', shootCd: 0 };
    }
    else if (type === 'boss') {
        // SUPER BUFFED BOSS: Fast, Giant, Tanky => CEO/Investor
        stats = {
            hp: 50000 * difficultyMult,
            speed: 1.0, // Slower roaming
            visual: '🤵',
            r: 300, // Massive (occupies huge portion of screen)
            xp: 500 * difficultyMult,
            type: 'boss',
            knockbackImmune: true
        };
    }

    // Add wandering state
    state.enemies.push({ x, y, ...stats, maxHp: stats.hp, wanderAngle: Math.random() * Math.PI * 2, wanderTime: 0 });
}

function getNextWaveTime() {
    for (let i = 0; i < WAVE_CONFIG.length; i++) {
        // Find first config that is in the future
        if (WAVE_CONFIG[i].time > state.seconds) {
            return WAVE_CONFIG[i].time;
        }
    }
    return -1; // No more waves (Endless)
}

function updateEnemies(dt) {
    const config = getWaveConfig();

    // Update Next Wave Timer for UI
    state.nextWaveTime = getNextWaveTime();

    // Spawn Logic (Timer based)
    state.spawnTimer = (state.spawnTimer || 0) - dt;
    // Rate is effectively frames per spawn at 60fps.
    // So interval in seconds = rate / 60.
    // Interval in dt units?
    // If rate is 30 frames (0.5s), we want to spawn every 0.5s of GAME TIME?
    // Or REAL TIME? Usually scaling affects spawn rate too.
    // rate = 30 frames.
    // spawnTimer -= dt.
    // When spawnTimer <= 0, spawn and reset to rate.
    // Wait, rate is 30. If dt=0.5, it takes 60 frames to count down 30.
    // That means it matches 0.5x speed. Correct.

    if (state.spawnTimer <= 0) {
        spawnOneEnemy();
        state.spawnTimer = config.rate;
    }

    // Always spawn at start to ensure something is there
    if (state.frames === 1) spawnOneEnemy();

    // Move logic (Wander / Random Walk)
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];

        // Update wander direction periodically
        e.wanderTime = (e.wanderTime || 0) - dt;
        if (e.wanderTime <= 0) {
            e.wanderTime = 60 + Math.random() * 60; // Change every 1-2s
            e.wanderAngle = (e.wanderAngle || 0) + (Math.random() - 0.5) * 2.0; // Turn
        }

        let angle = e.wanderAngle;

        // Keep inside bounds (Soft steer back to center if too far)
        const MAP_SIZE = 3000;
        const distFromCenter = Math.sqrt((e.x - 1500) ** 2 + (e.y - 1500) ** 2);
        if (e.x < 100 || e.x > MAP_SIZE - 100 || e.y < 100 || e.y > MAP_SIZE - 100 || distFromCenter > 1300) {
            angle = Math.atan2(1500 - e.y, 1500 - e.x); // Head to center
            e.wanderAngle = angle;
        }

        // DEBUFF 4-1: Low Visibility (Customers avoid you)
        if (state.debuffState && state.debuffState.type === 'low_visibility') {
            const playerAngle = Math.atan2(e.y - state.player.y, e.x - state.player.x);
            // Blend flee behavior
            angle = playerAngle; // Run AWAY from player
        }

        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        // Ranged logic (just aesthetic shooting for now, or maybe they toss "Complaints"?)
        // Let's keep ranged shoot logic but make it random direction or towards player? 
        // For now, disable aggressive shooting or make it random.
        if (e.type === 'ranged') {
            // Optional: Randomly complain (shoot noise)
        }
    }
}

function updateEnemyBullets(dt) {
    for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
        const b = state.enemyBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.duration -= dt;

        // Collision with Player
        const d = (b.x - state.player.x) ** 2 + (b.y - state.player.y) ** 2;
        if (d < (state.player.r + b.r) ** 2) {
            // Complaints/Refusals reduce money?
            // For now, let's say they just annoy you (shake) but don't kill directly
            // Or maybe they reduce money slightly?
            state.player.money -= 500; // Small fine
            spawnFloatingText("-500", state.player.x, state.player.y, '#ef4444');
            state.shake = 5;
            spawnParticleBurst(state.player.x, state.player.y, '#ef4444', 10);
            state.enemyBullets.splice(i, 1);
            continue;
        }

        if (b.duration <= 0) {
            state.enemyBullets.splice(i, 1);
        }
    }
}

function updateBullets(dt) {
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.duration -= dt;
        if (b.duration <= 0) {
            // Expire
            if (b.type === 'viral_throw') {
                // Explode on expire
                createExplosion(b.targetX, b.targetY, b.area || 100, b.dmg, b);
            }
            state.bullets.splice(i, 1);
            continue;
        }
        b.x += b.vx * dt; b.y += b.vy * dt;

        // Special Bullet Logic
        if (b.type === 'funnel_zone' && b.drip) {
            b.dripCd = (b.dripCd || 0) - 1;
            if (b.dripCd <= 0) {
                b.dripCd = 60;
                const target = findNearestEnemy();
                const angle = target ? Math.atan2(target.y - b.y, target.x - b.x) : Math.random() * Math.PI * 2;
                for (let j = 0; j < 3; j++) {
                    const finalAngle = angle + (j - 1) * 0.4;
                    spawnBullet({
                        type: 'newsletter',
                        x: b.x, y: b.y,
                        vx: Math.cos(finalAngle) * 8, vy: Math.sin(finalAngle) * 8,
                        dmg: 5 * state.stats.damageMult,
                        duration: 30,
                        r: 4,
                        color: '#10b981'
                    });
                }
            }
        } else if (b.type === 'beam') {
            // FIX: Update target position references
            if (b.target && !b.target.dead) {
                b.targetX = b.target.x;
                b.targetY = b.target.y;
            } else if (b.targetX === undefined) {
                b.duration = 0;
            }
        } else if (b.homing) {
            const target = findNearestEnemy();
            if (target) {
                const angle = Math.atan2(target.y - b.y, target.x - b.x);
                b.vx += Math.cos(angle) * 0.5;
                b.vy += Math.sin(angle) * 0.5;
                const speed = Math.sqrt(b.vx ** 2 + b.vy ** 2);
                if (speed > 8) { b.vx *= 0.9; b.vy *= 0.9; }
            }
            b.x += b.vx; b.y += b.vy; // Double move? No, already moved above. Remove duplicate move.
            // Oh wait, `b.x += ` is above. So this modifies v for NEXT frame. Correct.
        } else if (b.type === 'spider_minion') {
            // Minion AI
            b.attackCd = (b.attackCd || 0) - 1;
            let target = findNearestEnemy();
            if (target) {
                const angle = Math.atan2(target.y - b.y, target.x - b.x);
                b.vx = Math.cos(angle) * b.speed;
                b.vy = Math.sin(angle) * b.speed;
            }
            // Minions override standard bullet movement which is purely ballistic? 
            // `b.x += b.vx` is already called at start of loop.
            // But we just set vx/vy. So it will move next frame.
            // To make it responsive, we can move it now or accept 1 frame delay. 1 frame is fine.
        }
    }
}

function spawnParticleBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        state.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 30 + Math.random() * 20,
            color,
            size: Math.random() * 3 + 2
        });
    }
}

function spawnDebris(x, y, emojis, count) {
    for (let i = 0; i < count; i++) {
        const char = emojis[Math.floor(Math.random() * emojis.length)];
        state.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 7.5,
            vy: (Math.random() - 0.5) * 7.5 - 2.5,
            life: 40,
            type: 'text',
            char: char,
            size: 20,
            gravity: 0.5
        });
    }
}

function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;

        if (p.type === 'text') {
            p.vy += p.gravity || 0;
            p.life--;
        } else {
            p.life -= 1; // Standardize
        }

        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

function spawnFloatingText(text, x, y, color, duration = 1.0) {
    state.floatingTexts.push({ text, x, y, color, life: duration, maxLife: duration, vy: -0.5 });
}

function updateFloatingTexts(dt) {
    // Logic handled in draw? No, update logic should be here.
    // The original code mixed draw/update. I will move update logic here.
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const t = state.floatingTexts[i];
        t.y += t.vy * dt;
        t.life -= (1 / 60) * dt; // Match Time Scale (duration in seconds)
        if (t.life <= 0) state.floatingTexts.splice(i, 1);
    }
}
