/**
 * 游戏主逻辑 - 美化版
 */

class Game {
    constructor() {
        // Canvas设置
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // 游戏状态
        this.state = 'idle'; // idle, playing, paused, gameover, levelup
        this.level = 1;
        this.kills = 0;
        
        // 游戏对象
        this.player = null;
        this.waveManager = null;
        
        // 特效
        this.damageNumbers  = [];
        this.itemPickupNotice = null;
        this.particles      = [];   // 爆炸/击杀粒子
        this.muzzleFlashes  = [];   // 枪口闪光
        this.screenShake    = { x: 0, y: 0, intensity: 0, duration: 0 }; // 屏幕震动

        // 背景元素（星星、城市废墟）
        this._stars      = [];
        this._buildings  = [];
        this._bgReady    = false;

        // 时间
        this.lastTime = 0;
        this.currentTime = 0;
        
        // 绑定事件
        this.bindEvents();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this._initBackground();
        });
    }

    /**
     * 调整Canvas尺寸
     */
    resizeCanvas() {
        const container = document.getElementById('game-container');
        this.canvas.width  = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup',   (e) => this.handleKeyUp(e));
        
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove',  (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend',   (e) => this.handleTouchEnd(e));
        
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup',   (e) => this.handleMouseUp(e));
    }

    // ── 键盘事件 ──
    handleKeyDown(e) {
        if (this.state !== 'playing' || !this.player) return;
        if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') this.player.movingLeft  = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.player.movingRight = true;
    }

    handleKeyUp(e) {
        if (!this.player) return;
        if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') this.player.movingLeft  = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.player.movingRight = false;
    }

    // ── 触摸事件 ──
    handleTouchStart(e) {
        e.preventDefault();
        if (this.state !== 'playing' || !this.player) return;
        const touch = e.touches[0];
        const rect  = this.canvas.getBoundingClientRect();
        this.touchX    = touch.clientX - rect.left;
        this.isTouching = true;
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.state !== 'playing' || !this.player || !this.isTouching) return;
        const touch = e.touches[0];
        const rect  = this.canvas.getBoundingClientRect();
        this.touchX = touch.clientX - rect.left;
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.isTouching = false;
        if (!this.player) return;
        this.player.movingLeft  = false;
        this.player.movingRight = false;
    }

    // ── 鼠标事件（PC 调试）──
    handleMouseDown(e) {
        if (this.state !== 'playing' || !this.player) return;
        const rect        = this.canvas.getBoundingClientRect();
        const mouseX      = e.clientX - rect.left;
        const playerCenterX = this.player.x + this.player.width / 2;
        if (mouseX < playerCenterX) this.player.movingLeft  = true;
        else                         this.player.movingRight = true;
    }

    handleMouseMove(e) {
        if (this.state !== 'playing' || !this.player) return;
        if (!this.player.movingLeft && !this.player.movingRight) return;
        const rect        = this.canvas.getBoundingClientRect();
        const mouseX      = e.clientX - rect.left;
        const playerCenterX = this.player.x + this.player.width / 2;
        this.player.movingLeft  = mouseX < playerCenterX;
        this.player.movingRight = mouseX >= playerCenterX;
    }

    handleMouseUp() {
        if (!this.player) return;
        this.player.movingLeft  = false;
        this.player.movingRight = false;
    }

    // ================================================================
    //  背景初始化
    // ================================================================
    _initBackground() {
        const W = this.canvas.width;
        const H = this.canvas.height;

        // 星星
        this._stars = [];
        for (let i = 0; i < 80; i++) {
            this._stars.push({
                x:     Math.random() * W,
                y:     Math.random() * H * 0.55,
                r:     Math.random() * 1.5 + 0.3,
                alpha: Math.random() * 0.6 + 0.2,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.02 + 0.005,
            });
        }

        // 废墟城市建筑轮廓
        this._buildings = [];
        let bx = 0;
        while (bx < W + 20) {
            const bw = Utils.randomInt(30, 70);
            const bh = Utils.randomInt(40, 160);
            const windows = [];
            for (let wy = bh - 15; wy > 10; wy -= Utils.randomInt(10, 18)) {
                for (let wx = 5; wx < bw - 5; wx += Utils.randomInt(10, 16)) {
                    if (Math.random() > 0.45) {
                        windows.push({ x: wx, y: wy, lit: Math.random() > 0.6 });
                    }
                }
            }
            this._buildings.push({ x: bx, w: bw, h: bh, windows });
            bx += bw + Utils.randomInt(0, 8);
        }

        // 离线生成背景纹理到离屏 Canvas
        this._bgCanvas  = document.createElement('canvas');
        this._bgCanvas.width  = W;
        this._bgCanvas.height = H;
        this._bgCtx = this._bgCanvas.getContext('2d');
        this._bgReady = true;
    }

    // ================================================================
    //  绘制背景（分层）
    // ================================================================
    _drawBackground(ctx) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const now = this.currentTime * 0.001;

        // ── 层 1：深空渐变 ──
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.7);
        skyGrad.addColorStop(0,   '#05060f');
        skyGrad.addColorStop(0.4, '#0a0a1e');
        skyGrad.addColorStop(1,   '#0d0a18');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // ── 层 2：星星（闪烁） ──
        for (const star of this._stars) {
            const flicker = 0.4 + 0.6 * Math.abs(Math.sin(now * star.speed + star.phase));
            ctx.globalAlpha = star.alpha * flicker;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // ── 层 3：远景红雾（末世氛围） ──
        const fogGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7);
        fogGrad.addColorStop(0, 'rgba(120, 0, 0, 0)');
        fogGrad.addColorStop(0.5, 'rgba(80, 0, 0, 0.04)');
        fogGrad.addColorStop(1, 'rgba(180, 0, 0, 0.08)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 0, W, H);

        // ── 层 4：废墟建筑轮廓 ──
        const buildY = H - 60;  // 建筑底部固定在玩家区域以上
        ctx.fillStyle = '#080810';
        for (const b of this._buildings) {
            ctx.fillRect(b.x, buildY - b.h, b.w, b.h);
        }

        // 建筑轮廓线（暗红）
        ctx.strokeStyle = 'rgba(120, 30, 30, 0.4)';
        ctx.lineWidth = 1;
        for (const b of this._buildings) {
            ctx.strokeRect(b.x, buildY - b.h, b.w, b.h);
        }

        // 建筑窗户
        for (const b of this._buildings) {
            for (const win of b.windows) {
                if (win.lit) {
                    const flicker = 0.6 + 0.4 * Math.sin(now * 2 + win.x);
                    ctx.fillStyle = `rgba(255, 200, 80, ${0.3 * flicker})`;
                } else {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                }
                ctx.fillRect(b.x + win.x, buildY - b.h + win.y, 4, 4);
            }
        }

        // ── 层 5：地面（颓废红砖街道感） ──
        const groundGrad = ctx.createLinearGradient(0, H - 80, 0, H);
        groundGrad.addColorStop(0, '#1a0808');
        groundGrad.addColorStop(1, '#0d0505');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, H - 80, W, 80);

        // 地面横纹
        ctx.strokeStyle = 'rgba(100, 30, 30, 0.25)';
        ctx.lineWidth = 1;
        for (let gy = H - 75; gy < H; gy += 12) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(W, gy);
            ctx.stroke();
        }

        // 地面纵缝（透视感）
        ctx.strokeStyle = 'rgba(120, 40, 40, 0.2)';
        const vanishX = W / 2;
        const vanishY = H - 80;
        for (let i = 0; i < 8; i++) {
            const bx = (W / 7) * i;
            ctx.beginPath();
            ctx.moveTo(vanishX, vanishY);
            ctx.lineTo(bx, H);
            ctx.stroke();
        }
    }

    // ================================================================
    //  枪口闪光
    // ================================================================
    _addMuzzleFlash(x, y, color) {
        this.muzzleFlashes.push({ x, y, color, life: 80, maxLife: 80 });
    }

    _drawMuzzleFlashes(ctx) {
        this.muzzleFlashes = this.muzzleFlashes.filter(f => f.life > 0);
        for (const f of this.muzzleFlashes) {
            const alpha = f.life / f.maxLife;
            const r = 14 * alpha;

            ctx.save();
            ctx.globalAlpha = alpha;

            // 光晕
            const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
            grd.addColorStop(0, '#ffffff');
            grd.addColorStop(0.3, f.color);
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
            ctx.fill();

            // 十字光线
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = alpha * 0.5;
            ctx.beginPath();
            ctx.moveTo(f.x - r * 1.5, f.y);
            ctx.lineTo(f.x + r * 1.5, f.y);
            ctx.moveTo(f.x, f.y - r * 1.5);
            ctx.lineTo(f.x, f.y + r * 1.5);
            ctx.stroke();

            ctx.restore();
            f.life -= 16;
        }
    }

    // ================================================================
    //  击杀爆炸粒子
    // ================================================================
    _spawnKillParticles(x, y, color) {
        // 爆炸主粒子（向四周飞散的光斑）
        const count = Utils.randomInt(10, 16);
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.6;
            const speed = Utils.randomFloat(2, 5.5);
            this.particles.push({
                type:  'spark',
                x, y,
                vx:    Math.cos(angle) * speed,
                vy:    Math.sin(angle) * speed - 0.5,
                color,
                size:  Utils.randomFloat(3, 6),
                life:  Utils.randomInt(350, 600),
                maxLife: 500,
            });
        }

        // 血液/碎片溅射（深红 + 丧尸颜色混合）
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI;  // 只往上飞
            const speed = Utils.randomFloat(1, 3.5);
            this.particles.push({
                type:  'blood',
                x: x + (Math.random() - 0.5) * 10,
                y,
                vx:    (Math.random() - 0.5) * speed * 2,
                vy:    -speed * 0.8,
                color: Math.random() > 0.4 ? '#cc0000' : '#6a0000',
                size:  Utils.randomFloat(2, 4),
                life:  Utils.randomInt(250, 500),
                maxLife: 450,
                trail: [],
            });
        }

        // 中心爆光圆（1 帧快速消散）
        this.particles.push({
            type:  'flash',
            x, y,
            vx: 0, vy: 0,
            color,
            size:  22,
            life:  120,
            maxLife: 120,
        });
    }

    _updateParticles(deltaTime) {
        this.particles = this.particles.filter(p => p.life > 0);
        for (const p of this.particles) {
            if (p.type === 'flash') {
                p.life -= deltaTime * 2;
                p.size  = Math.max(0, p.size - 1.2);
                continue;
            }
            // 记录拖尾（血液粒子）
            if (p.type === 'blood' && p.trail) {
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 5) p.trail.shift();
            }
            p.x   += p.vx;
            p.y   += p.vy;
            p.vy  += 0.15;      // 重力
            p.vx  *= 0.94;      // 空气阻力
            p.size = Math.max(0.3, p.size * 0.985);
            p.life -= deltaTime;
        }
    }

    _drawParticles(ctx) {
        ctx.save();
        for (const p of this.particles) {
            const alpha = Math.min(1, p.life / 180);

            if (p.type === 'flash') {
                // 爆光圆
                const a = p.life / p.maxLife;
                const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                grd.addColorStop(0, `rgba(255,255,220,${a * 0.9})`);
                grd.addColorStop(0.4, this._hexAlpha(p.color, a * 0.6));
                grd.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                continue;
            }

            if (p.type === 'blood') {
                // 血液拖尾
                if (p.trail && p.trail.length > 1) {
                    ctx.strokeStyle = this._hexAlpha(p.color, alpha * 0.5);
                    ctx.lineWidth   = p.size * 0.6;
                    ctx.lineCap     = 'round';
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x, p.trail[0].y);
                    for (let i = 1; i < p.trail.length; i++) {
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                    }
                    ctx.stroke();
                }
                ctx.globalAlpha = alpha;
                ctx.fillStyle   = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                continue;
            }

            // spark：发光圆点
            ctx.globalAlpha = alpha;
            // 外层柔光
            const grd2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            grd2.addColorStop(0,   this._hexAlpha(p.color, 0.9));
            grd2.addColorStop(0.5, this._hexAlpha(p.color, 0.3));
            grd2.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.fillStyle = grd2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();
            // 内核
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    }

    /** hex 转 rgba 字符串（粒子系统内部用） */
    _hexAlpha(hex, alpha) {
        if (!hex || hex[0] !== '#') return `rgba(180,180,180,${alpha})`;
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // ================================================================
    //  道具左右分区中线
    // ================================================================
    _drawItemDivider(ctx, W, H) {
        if (!this._dividerPhase) this._dividerPhase = 0;
        this._dividerPhase = (this._dividerPhase + 0.04) % (Math.PI * 2);
        const pulse = 0.4 + 0.3 * Math.abs(Math.sin(this._dividerPhase));
        const midX  = W / 2;

        // 主线：从顶到底的渐变虚线
        ctx.save();
        ctx.setLineDash([8, 10]);
        ctx.lineDashOffset = -this._dividerPhase * 20;

        const lineGrad = ctx.createLinearGradient(midX, 0, midX, H);
        lineGrad.addColorStop(0,   `rgba(100, 200, 255, 0)`);
        lineGrad.addColorStop(0.15, `rgba(100, 200, 255, ${pulse})`);
        lineGrad.addColorStop(0.85, `rgba(100, 200, 255, ${pulse})`);
        lineGrad.addColorStop(1,   `rgba(100, 200, 255, 0)`);
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(midX, 0);
        ctx.lineTo(midX, H);
        ctx.stroke();
        ctx.setLineDash([]);

        // 左右标签（帮助玩家判断分区）
        const labelY = H * 0.78;
        ctx.font = 'bold 11px "PingFang SC", Arial';
        ctx.textBaseline = 'middle';

        // 左侧 "← 左区"
        ctx.textAlign = 'right';
        ctx.fillStyle = `rgba(100, 220, 255, ${pulse * 0.8})`;
        ctx.fillText('← 左区', midX - 6, labelY);

        // 右侧 "右区 →"
        ctx.textAlign = 'left';
        ctx.fillStyle = `rgba(100, 220, 255, ${pulse * 0.8})`;
        ctx.fillText('右区 →', midX + 6, labelY);

        ctx.restore();
    }

    // ================================================================
    //  屏幕震动
    // ================================================================
    _triggerShake(intensity, duration) {
        if (intensity > this.screenShake.intensity) {
            this.screenShake.intensity = intensity;
            this.screenShake.duration  = duration;
        }
    }

    _updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            const t = this.screenShake.intensity * (this.screenShake.duration / 200);
            this.screenShake.x = (Math.random() * 2 - 1) * t;
            this.screenShake.y = (Math.random() * 2 - 1) * t;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
        }
    }

    // ================================================================
    //  开始游戏
    // ================================================================
    start() {
        this.state  = 'playing';
        this.level  = 1;
        this.kills  = 0;

        this.player      = new Player(this.canvas.width, this.canvas.height);
        this.waveManager = new WaveManager(this.level);

        ZombieManager.reset();
        BulletManager.clear();
        ItemManager.reset();

        // 清空特效
        this.particles     = [];
        this.muzzleFlashes = [];
        this.damageNumbers = [];
        this.screenShake   = { x: 0, y: 0, intensity: 0, duration: 0 };

        ItemManager.pickedUpTime = performance.now();

        // 初始化背景
        this._initBackground();

        // 预热 3 帧再启动
        new Promise(resolve => this._warmup(3, resolve)).then(() => {
            this._firstFrame = true;
            this.gameLoop();
        });
    }

    /**
     * 预热 Canvas 和 JIT
     */
    _warmup(frames, resolve) {
        if (frames <= 0) { resolve(); return; }
        requestAnimationFrame(() => {
            this.ctx.fillStyle = '#0d0d1a';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'rgba(255,255,255,0)';
            this.ctx.fillRect(0, 0, 1, 1);
            this._warmup(frames - 1, resolve);
        });
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        const now = performance.now();
        if (this._firstFrame) {
            this._firstFrame = false;
            this.lastTime = now;
        }
        const deltaTime = Math.min(now - this.lastTime, 50);
        this.lastTime    = now;
        this.currentTime = now;

        if (this.state === 'playing') {
            this.update(deltaTime);
        }

        // levelup 状态跳过游戏渲染
        if (this.state !== 'levelup') {
            this.render();
        }

        if (this.state !== 'gameover') {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    // ================================================================
    //  UPDATE
    // ================================================================
    update(deltaTime) {
        // 触摸跟随
        if (this.isTouching && this.touchX !== undefined) {
            this.player.targetX = this.touchX;
        } else {
            this.player.targetX = null;
        }

        this.player.update(this.currentTime);

        // 射击 + 枪口闪光
        const bullets = this.player.tryFire(this.currentTime);
        if (bullets) {
            BulletManager.add(bullets);
            // 枪口坐标
            const mx = this.player.x + this.player.width / 2 + 14;
            const my = this.player.y + 6;
            this._addMuzzleFlash(mx, my, this.player.weapon.config.color);
        }

        BulletManager.update(this.canvas.width, this.canvas.height);
        ZombieManager.update(deltaTime, this.currentTime);

        const hits = BulletManager.checkCollisions(ZombieManager.getAliveZombies());
        this.handleBulletHits(hits);

        this.checkZombieReachPlayer();
        ZombieManager.removeDead();

        this.waveManager.update(deltaTime, this.currentTime, ZombieManager, this.canvas.width);

        ItemManager.spawnItemPair(this.canvas.width, this.currentTime);
        ItemManager.update();

        const itemEffects = ItemManager.checkPickups(this.player, WeaponManager.getAllTypes(), this.canvas.width);
        this.handleItemEffects(itemEffects);

        this.updateDamageNumbers(deltaTime);
        this._updateParticles(deltaTime);
        this._updateScreenShake(deltaTime);

        if (this.waveManager.isLevelComplete()) this.levelUp();
        if (!this.player.alive)                  this.gameOver();
    }

    /**
     * 处理子弹命中
     */
    handleBulletHits(hits) {
        hits.forEach(hit => {
            this.damageNumbers.push({
                x: hit.zombie.x + hit.zombie.width / 2,
                y: hit.zombie.y,
                damage: hit.damage,
                size: 14,
                color: hit.damage > 200 ? '#00bfff' : '#ff6b6b',
                life: 500,
                vy: -1.2,
            });

            if (!hit.zombie.alive) {
                this.kills++;
                // 击杀粒子 + 轻微震动
                this._spawnKillParticles(
                    hit.zombie.x + hit.zombie.width / 2,
                    hit.zombie.y + hit.zombie.height / 2,
                    hit.zombie.config.color
                );
                this._triggerShake(2, 100);
            }
        });
    }

    /**
     * 检查丧尸是否到达玩家
     */
    checkZombieReachPlayer() {
        const playerY  = this.player.y;
        const zombies  = ZombieManager.getAliveZombies();

        zombies.forEach(zombie => {
            if (zombie.hasReachedPlayer(playerY)) {
                this.player.takeDamage(zombie.damage);
                zombie.alive = false;

                this.damageNumbers.push({
                    x:      this.player.x + this.player.width / 2,
                    y:      this.player.y - 20,
                    damage: zombie.damage,
                    size:   20,
                    color:  '#e74c3c',
                    life:   800,
                    vy:     -2,
                });
                // 受击震动（较强）
                this._triggerShake(5, 200);
            }
        });
    }

    /**
     * 处理道具效果
     */
    handleItemEffects(effects) {
        effects.forEach(effect => {
            if (effect.type === 'clear') {
                ZombieManager.clearAll();
                this.showItemPickupNotice('💥 全屏清除！', '#00ffff');
                this._triggerShake(8, 300);
            } else if (effect.type === 'freeze') {
                ZombieManager.freezeAll(effect.value, this.currentTime);
                this.showItemPickupNotice('❄️ 时间冻结！', '#87ceeb');
            }
        });
    }

    showItemPickupNotice(text, color) {
        this.itemPickupNotice = { text, color, life: 2000 };
    }

    updateDamageNumbers(deltaTime) {
        this.damageNumbers.forEach(num => {
            num.life -= deltaTime;
            num.y    += num.vy;
            num.size  = Math.max(10, num.size - 0.01);
        });
        this.damageNumbers = this.damageNumbers.filter(num => num.life > 0);

        if (this.itemPickupNotice) {
            this.itemPickupNotice.life -= deltaTime;
            if (this.itemPickupNotice.life <= 0) this.itemPickupNotice = null;
        }
    }

    // ================================================================
    //  RENDER
    // ================================================================
    render() {
        const ctx = this.ctx;
        const W   = this.canvas.width;
        const H   = this.canvas.height;

        // 屏幕震动偏移
        ctx.save();
        ctx.translate(this.screenShake.x, this.screenShake.y);

        // ── 背景 ──
        if (this._bgReady) {
            this._drawBackground(ctx);
        } else {
            ctx.fillStyle = '#0d0d1a';
            ctx.fillRect(0, 0, W, H);
        }

        if (this.state === 'playing') {
            // ── 地面装饰线 ──
            if (this.player) {
                UI.drawGroundLine(ctx, W, this.player.y);
            }

            // ── 游戏对象 ──
            ZombieManager.draw(ctx);
            BulletManager.draw(ctx);
            // 有道具时绘制左右分区中线
            if (ItemManager.waitingForPickup) {
                this._drawItemDivider(ctx, W, H);
            }
            ItemManager.draw(ctx);
            this.player.draw(ctx);

            // ── 枪口闪光 ──
            this._drawMuzzleFlashes(ctx);

            // ── 粒子特效 ──
            this._drawParticles(ctx);

            // ── HUD ──
            const waveInfo = this.waveManager.getWaveInfo();
            UI.drawHUD(ctx, this.player, this.level, waveInfo, this.kills, W);

            // ── 伤害数字 ──
            UI.drawDamageNumbers(ctx, this.damageNumbers);

            // ── 道具拾取提示 ──
            UI.drawItemPickupNotice(ctx, this.itemPickupNotice, W, H);

            // ── 波次提示 ──
            const announcement = this.waveManager.getAnnouncement();
            UI.drawWaveAnnouncement(ctx, announcement, W, H);
        }

        ctx.restore();
    }

    // ================================================================
    //  关卡状态
    // ================================================================
    levelUp() {
        this.state = 'levelup';
        this.level++;
        this.player.upgradeWeapon();

        document.getElementById('next-level').textContent = this.level;
        document.getElementById('levelup-screen').classList.remove('hidden');
    }

    startNextLevel() {
        this.state = 'playing';

        this.waveManager = new WaveManager(this.level);

        ItemManager.clear();
        ItemManager.waitingForPickup = false;
        ItemManager.lastSpawnTime    = 0;
        ItemManager.pickedUpTime     = performance.now();

        BulletManager.clear();

        this.damageNumbers  = [];
        this.particles      = [];
        this.muzzleFlashes  = [];
        this.screenShake    = { x: 0, y: 0, intensity: 0, duration: 0 };

        this.player.x = (this.canvas.width - this.player.width) / 2;

        document.getElementById('levelup-screen').classList.add('hidden');
    }

    gameOver() {
        this.state = 'gameover';
        document.getElementById('final-level').textContent = this.level;
        document.getElementById('final-kills').textContent = this.kills;
        document.getElementById('gameover-screen').classList.remove('hidden');
    }

    restart() {
        document.getElementById('gameover-screen').classList.add('hidden');
        this.start();
    }
}
