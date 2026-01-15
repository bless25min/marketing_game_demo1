const MAP_SIZE = 3000;

// Renamed to drawBoundary as it draws the map edges
function drawBoundary() {
    // 0. No Inner Grid (Clean background)

    // 1. Map Boundary (Firewall Style)
    ctx.save();

    // Animated Red Glow
    const pulse = Math.abs(Math.sin(state.frames * 0.05));
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + pulse * 0.5})`; // #ef4444 pulsing opacity
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10 + pulse * 10;
    ctx.shadowColor = '#ef4444';


    // Draw Border
    ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);

    // 2. Tech Corners (Solid)
    ctx.setLineDash([]);
    ctx.lineWidth = 6;
    const s = 50;

    ctx.beginPath();
    // Top-Left
    ctx.moveTo(0, s); ctx.lineTo(0, 0); ctx.lineTo(s, 0);
    // Top-Right
    ctx.moveTo(MAP_SIZE - s, 0); ctx.lineTo(MAP_SIZE, 0); ctx.lineTo(MAP_SIZE, s);
    // Bottom-Right
    ctx.moveTo(MAP_SIZE, MAP_SIZE - s); ctx.lineTo(MAP_SIZE, MAP_SIZE); ctx.lineTo(MAP_SIZE - s, MAP_SIZE);
    // Bottom-Left
    ctx.moveTo(s, MAP_SIZE); ctx.lineTo(0, MAP_SIZE); ctx.lineTo(0, MAP_SIZE - s);
    ctx.stroke();
    ctx.stroke();

    ctx.restore();
}

function drawPlayer() {
    ctx.save();
    ctx.translate(state.player.x, state.player.y);
    ctx.rotate(state.player.angle);
    ctx.shadowColor = CONFIG.COLORS.player;
    ctx.shadowBlur = 15;
    ctx.fillStyle = CONFIG.COLORS.player;
    ctx.beginPath();
    ctx.arc(0, 0, state.player.r, 0, Math.PI * 2);

    // LINE Avatar Support
    if (state.player.image && state.player.image.complete) {
        ctx.save();
        ctx.rotate(-state.player.angle); // Counter-rotate to keep image upright
        ctx.clip(); // Clip to circle
        ctx.drawImage(state.player.image, -state.player.r, -state.player.r, state.player.r * 2, state.player.r * 2);
        ctx.restore();
    } else {
        ctx.fill();
    }

    // Overhead Health Bar
    ctx.restore(); // Restore separate from bar to avoid rotation

    // Overhead Health Bar - REMOVED (Clean look)
    /*
    if (state.player.hp < state.player.maxHp) {
        // ...
    }
    */
}

function drawBullets() {
    state.bullets.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);

        if (b.color) {
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = b.color;
        }

        if (b.type === 'beam') {
            // FIX: Correct line drawing
            if (b.targetX !== undefined && b.targetY !== undefined) {
                ctx.shadowBlur = 0;
                const tx = b.targetX - b.x;
                const ty = b.targetY - b.y;

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(tx, ty);

                ctx.strokeStyle = b.color || '#fca5a5';
                ctx.lineWidth = Math.max(1, (b.duration / 15) * 5);
                ctx.lineCap = 'round';
                ctx.shadowBlur = 15;
                ctx.shadowColor = b.color;
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(tx, ty, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (b.type === 'funnel_zone') {
            const isFire = (state.frames % 20 < 10);
            ctx.fillStyle = isFire ? '#fbbf24' : '#ef4444';
            ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 2;
            ctx.rotate(state.frames * 0.2);
            ctx.beginPath();
            ctx.moveTo(b.r, 0); ctx.lineTo(-b.r, 0);
            ctx.moveTo(0, b.r); ctx.lineTo(0, -b.r);
            ctx.stroke();

        } else if (b.type === 'viral_throw') {
            // Draw Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.ellipse(0, 0, b.r, b.r * 0.5, 0, 0, Math.PI * 2); ctx.fill();

            // Draw Projectile with Height Arc
            const t = (b.life - b.duration) / b.life;
            const height = Math.sin(t * Math.PI) * 50; // 50px peak height
            ctx.translate(0, -height);

            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = b.color || '#a855f7';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, b.r || 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#facc15';
            ctx.beginPath(); ctx.arc(b.r * 0.7, -b.r * 0.7, 3, 0, Math.PI * 2); ctx.fill();
            // Undo translate is handled by restore
        } else if (b.type === 'blog_post') {
            const size = b.r || 15;
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.quadraticCurveTo(-size / 2, -size - 5, -size, -size);
            ctx.lineTo(-size, size);
            ctx.quadraticCurveTo(-size / 2, size - 5, 0, size);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.quadraticCurveTo(size / 2, -size - 5, size, -size);
            ctx.lineTo(size, size);
            ctx.quadraticCurveTo(size / 2, size - 5, 0, size);
            ctx.fill();
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(-2, -size - 2, 4, size * 2 + 4);
            ctx.fillStyle = '#1e293b';
            for (let k = 0; k < 3; k++) {
                ctx.fillRect(-size + 4, -size / 2 + k * 6, size - 8, 2);
                ctx.fillRect(4, -size / 2 + k * 6, size - 8, 2);
            }

        } else if (b.type === 'pixel_tracker') {
            const size = 8;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = b.color || '#4ade80';
            ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(0, 0, size / 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = b.color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.arc(-size, 0, size / 2, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;

        } else if (b.type === 'kol_aura') {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.stroke();
            if (Math.random() > 0.5) {
                const r = Math.random() * b.r;
                const a = Math.random() * Math.PI * 2;
                ctx.fillStyle = '#fff';
                ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r, 2, 2);
            }
            ctx.globalAlpha = 1.0;

        } else if (b.type === 'hashtag') {
            ctx.fillStyle = b.color || '#f0abfc';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('#', 0, 0);
        } else if (b.type === 'orbit_hit') {
            // Generic Orbit Visual
            ctx.fillStyle = b.color || '#fff';
            ctx.shadowBlur = 10; ctx.shadowColor = b.color;
            ctx.beginPath();
            const s = 4;
            ctx.moveTo(0, -s * 2); ctx.lineTo(s, -s); ctx.lineTo(s * 2, 0); ctx.lineTo(s, s);
            ctx.lineTo(0, s * 2); ctx.lineTo(-s, s); ctx.lineTo(-s * 2, 0); ctx.lineTo(-s, -s);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (b.type === 'newsletter') {
            const s = 8;
            ctx.fillStyle = b.color || '#10b981';
            ctx.beginPath();
            ctx.moveTo(-s, -s * 0.6); ctx.lineTo(s, -s * 0.6); ctx.lineTo(s, s * 0.6); ctx.lineTo(-s, s * 0.6);
            ctx.fill();
            ctx.strokeStyle = '#064e3b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-s, -s * 0.6); ctx.lineTo(0, 0); ctx.lineTo(s, -s * 0.6);
            ctx.stroke();
        } else if (b.type === 'content') {
            ctx.fillStyle = b.color || '#facc15';
            const s = 6;
            ctx.beginPath();
            ctx.moveTo(-s * 0.7, -s); ctx.lineTo(s * 0.7, -s); ctx.lineTo(s * 0.7, s); ctx.lineTo(-s * 0.7, s);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.fillRect(-s * 0.4, -s * 0.5, s * 0.8, 1);
            ctx.fillRect(-s * 0.4, -s * 0.1, s * 0.8, 1);
            ctx.fillRect(-s * 0.4, s * 0.3, s * 0.5, 1);
        } else if (b.type === 'spider_minion') {
            const size = 6;
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let k = 0; k < 4; k++) {
                ctx.moveTo(-size, 0); ctx.lineTo(-size - 6, Math.sin(state.frames * 0.8 + k) * 6);
                ctx.moveTo(size, 0); ctx.lineTo(size + 6, Math.sin(state.frames * 0.8 + k + Math.PI) * 6);
            }
            ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#67e8f9';
            ctx.shadowBlur = 10; ctx.shadowColor = '#06b6d4';
            ctx.beginPath(); ctx.arc(-2, -2, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(2, -2, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            ctx.beginPath(); ctx.arc(0, 0, b.r || 4, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    });
}

function drawEnemyBullets() {
    state.enemyBullets.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = b.color;

        if (b.type === 'enemy_orb') {
            // Dark core, red glow
            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    });
}

function drawEnemies() {
    state.enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        // Flip if moving left
        if ((e.x - state.player.x) > 0) ctx.scale(-1, 1);

        if (e.flash > 0) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.fill();
            e.flash--;
            // Do NOT return here, just end the flash visual, restore so we can draw other things (like text/bar) normally?
            // Actually, usually "Flash" replaces the sprite.
            // So if we flash, we don't draw the "visual" emoji?
            // Let's just restore and continue to draw HP bar and Dialogue, but maybe skip "visual"?
            ctx.restore();
            // Skip drawing the Emoji if flashing
        } else {
            // Font based visuals
            ctx.globalAlpha = 1;
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 5;
            ctx.fillText(e.visual, 0, 0);
            ctx.shadowBlur = 0;
            ctx.restore(); // Restore sprite transform
        }

        // RE-SAVE for shared components (HP Bar, Dialogue) which need position but NOT rotation/flip if we want them consistent?
        // Actually, drawEnemies context was: translate, (scale -1, 1).
        // Flash restores that.
        // So now we are back at World Origin? NO.
        // We lost the verify position!
        // Wait, the original code had `ctx.restore()` inside the `if (flash)`.
        // And then `return`.
        // This meant it skipped HP bar and dialogue!

        // BETTER FIX:
        // Draw HP Bar and Dialogue OUTSIDE the "Sprite Drawing" block.
        // Let's refactor:
        // 1. Setup Context (Translate)
        // 2. Flip if needed
        // 3. Draw Sprite (Normal or Flash)
        // 4. Restore Flip? Or just draw Text inverted?
        // The original code handled flip in dialogue by re-flipping.

        // Let's try this:
        // Re-establish context for independent elements if we returned earlier.
        // But we can't easily jump back.

        // Let's change the structure:

        ctx.save();
        ctx.translate(e.x, e.y);

        // 1. Draw Sprite Layer
        ctx.save();
        if ((e.x - state.player.x) > 0) ctx.scale(-1, 1);

        if (e.flash > 0) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.fill();
            e.flash--;
        } else {
            ctx.globalAlpha = 1;
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 5;
            ctx.fillText(e.visual, 0, 0);
            ctx.shadowBlur = 0;
        }
        ctx.restore(); // Done with Sprite

        // 2. Draw UI Layer (HP Bar, Dialogue) - Unaffected by Flash
        // HP Bar
        if (e.hp < e.maxHp) {
            const hpPct = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = '#334155';
            ctx.fillRect(-12, -20, 24, 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-12, -20, 24 * hpPct, 4);
        }

        // Dialogue Bubble
        if (e.activeDialogue && e.activeDialogue.life > 0) {
            // No need to un-flip, we are in non-flipped context
            ctx.font = '12px sans-serif';
            const w = ctx.measureText(e.activeDialogue.text).width + 10;
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(-w / 2, -50, w, 20, 5);
            } else {
                ctx.rect(-w / 2, -50, w, 20); // Fallback
            }
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.textAlign = 'center'; // Ensure centered
            ctx.fillText(e.activeDialogue.text, 0, -36); // Adjusted Y slightly for vertical center

            e.activeDialogue.life -= (1 / 60) * (state.timeScale || 1.0);
        }

        ctx.restore(); // End Entity Draw
    });
}

function drawFloatingDialogues() {
    state.floatingDialogues.forEach(d => {
        ctx.save();
        ctx.translate(d.x, d.y);
        // Un-flip if needed? d.x is world pos.
        // We are in world context. Text should be upright.

        ctx.font = '12px sans-serif';
        const w = ctx.measureText(d.text).width + 10;
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-w / 2, -10, w, 20, 5);
        } else {
            ctx.rect(-w / 2, -10, w, 20);
        }
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.text, 0, 0);

        ctx.restore();
    });
}



function drawGems() {
    state.gems.forEach(g => {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0);
        ctx.fill();
        ctx.restore();
    });
}

function drawParticles() {
    state.particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.type === 'text') {
            ctx.fillStyle = '#fff';
            ctx.font = `${p.size}px sans-serif`;
            ctx.fillText(p.char, 0, 0);
        } else {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30; // Fade out
            ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    });
}

function drawFloatingTexts() {
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    state.floatingTexts.forEach(t => {
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color; ctx.shadowBlur = 5;
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1.0;
}

function drawHUD() {
    // Health Bar -> Budget Bar
    // Max Budget? Let's assume start money is "Max" for bar ratio, or just cap it at 100k visualization
    // Or maybe dynamic based on current? Let's use 100,000 as baseline denominator for now.
    const maxBudget = 100000;
    const hpPct = Math.max(0, Math.min(1, state.player.money / maxBudget));
    const hpBarY = state.height - 35;

    // Background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, hpBarY, state.width, 15);

    // Foreground
    ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : (hpPct > 0.2 ? '#facc15' : '#ef4444');
    ctx.fillRect(0, hpBarY, state.width * hpPct, 15);

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`資金: $${Math.floor(state.player.money).toLocaleString()}`, state.width / 2, hpBarY + 11);

    // XP Bar
    const xpPct = state.xp / state.xpNeeded;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, state.width, 20);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, 0, state.width * xpPct, 20);

    // Level
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`等級 ${state.level}`, 10, 16);

    // Timer
    const mins = Math.floor(state.seconds / 60);
    const secs = Math.floor(state.seconds % 60).toString().padStart(2, '0');
    ctx.textAlign = 'center';
    ctx.fillText(`${mins}:${secs}`, state.width / 2, 16);

    // Wave Countdown (Red Warning Style)
    if (state.nextWaveTime > 0) {
        const remaining = Math.max(0, state.nextWaveTime - state.seconds);
        const rMins = Math.floor(remaining / 60);
        const rSecs = Math.floor(remaining % 60).toString().padStart(2, '0');

        // Pulsing Effect
        const pulse = Math.abs(Math.sin(state.frames * 0.1));
        const fontSize = 16 + (pulse * 4); // Pulse between 16px and 20px

        ctx.fillStyle = '#ef4444'; // Red Warning Color
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.shadowColor = '#991b1b';
        ctx.shadowBlur = 10;
        ctx.fillText(`⚠️ 下一波: ${rMins}:${rSecs} ⚠️`, state.width / 2, 40); // Moved down slightly
        ctx.shadowBlur = 0;
    } else {
        const pulse = Math.abs(Math.sin(state.frames * 0.1));
        const fontSize = 16 + (pulse * 4);

        ctx.fillStyle = '#ef4444';
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 15;
        ctx.fillText(`🔥 最後一波 (BOSS) 🔥`, state.width / 2, 40);
        ctx.shadowBlur = 0;
    }

    // Stats
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff'; // Reset color
    ctx.font = '12px monospace';
    // ctx.fillText(`Enemies: ${state.enemies.length}`, state.width - 10, 16);

    // Debuff Indicator
    if (state.debuffState && state.debuffState.type) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px sans-serif';
        const typeName = {
            'low_visibility': '⚠️ 品牌可見度低 (客戶遠離)',
            'awareness_lack': '⚠️ 品牌認知不足 (首擊無效)',
            'low_credibility': '⚠️ 品牌信任度低 (效果減半)'
        }[state.debuffState.type] || '⚠️ 市場逆風';

        ctx.fillText(typeName, state.width / 2, 70);
    }
}

// function drawGrid() { ... } // Replaced/Refactored into drawBackground

function drawBackground() {
    // 1. Base Gradient (Digital Marketing Deep Blue)
    const grad = ctx.createRadialGradient(state.width / 2, state.height / 2, 0, state.width / 2, state.height / 2, state.width);
    grad.addColorStop(0, '#1e293b'); // Dark Slate centered
    grad.addColorStop(1, '#0f172a'); // Black/Deep Blue edges
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.save();

    // Camera Transform for World Elements (Grid & Particles)
    const cx = state.width / 2;
    const cy = state.height / 2;
    ctx.translate(cx, cy);
    ctx.scale(state.zoom, state.zoom); // Zoom affects grid? Maybe keep grid subtle?
    // Actually, background grid should probably scroll with player but parallax?
    // Simple approach: Move with player (World Grid)
    ctx.translate(-state.player.x, -state.player.y);

    // 2. World Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)'; // Light blue, very faint
    ctx.lineWidth = 1;
    const gridSize = 100;

    // Optimization: Only draw grid visible on screen
    const startX = Math.floor((state.player.x - cx / state.zoom) / gridSize) * gridSize;
    const endX = Math.ceil((state.player.x + cx / state.zoom) / gridSize) * gridSize;
    const startY = Math.floor((state.player.y - cy / state.zoom) / gridSize) * gridSize;
    const endY = Math.ceil((state.player.y + cy / state.zoom) / gridSize) * gridSize;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY); ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y); ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // 3. Floating Data Particles
    state.bgParticles.forEach(p => {
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = p.opacity;
        ctx.font = `bold ${p.size}px monospace`;
        ctx.fillText(p.icon, p.x, p.y);
    });
    ctx.globalAlpha = 1.0;

    // 4. Map Boundary (The Firewall)
    drawBoundary();
    // Actually original drawGrid drew the boundary. Let's keep using it for Boundary but rename conceptually.

    ctx.restore();
}

function draw() {
    drawBackground();
    // ctx.fillStyle = '#0f172a'; // Removed
    // ctx.fillRect(0, 0, state.width, state.height); // Removed

    ctx.save();
    // Centering is tricky with fixed grid.
    // Let's just translate world relative to center.
    // But then grid needs to move.
    // Simplified: No camera follow for now or simple "center on player"
    // Since we handle player pos directly on screen for now, let's keep it steady.
    // Wait, original code had a restore at end of drawEntities.
    // Let's just draw entities at their coords.
    // If we want camera, we need to translate context by (Center - PlayerPos).
    const cx = state.width / 2;
    const cy = state.height / 2;

    // Camera Transform with Zoom
    // 1. Center
    // 2. Scale
    // 3. Move to world pos
    ctx.translate(cx, cy);
    ctx.scale(state.zoom, state.zoom);
    ctx.translate(-state.player.x, -state.player.y);

    // drawGrid(); // MOVED to drawBackground
    drawGems();
    drawBullets();
    drawEnemyBullets();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawFloatingTexts();
    drawFloatingDialogues();

    ctx.restore();

    if (state.screen === 'playing' || state.screen === 'over') {
        drawHUD();
        drawJoystick();
    }
}

function drawJoystick() {
    if (typeof joystick === 'undefined' || !joystick.active) return;

    // Outer Ring
    ctx.beginPath();
    ctx.arc(joystick.originX, joystick.originY, 50, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner Thumb
    ctx.beginPath();
    ctx.arc(joystick.x, joystick.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
}
