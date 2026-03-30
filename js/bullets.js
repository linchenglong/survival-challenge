/**
 * 子弹系统
 */

class Bullet {
    constructor(x, y, damage, color, angle = Utils.degToRad(-90), weaponType = 'desert_eagle') {
        this.x = x;
        this.y = y;
        this.width  = CONFIG.BULLET.WIDTH;
        this.height = CONFIG.BULLET.HEIGHT;
        this.damage = damage;
        this.color  = color;
        this.angle  = angle;
        this.speed  = CONFIG.BULLET.SPEED;
        this.active = true;
        this.weaponType = weaponType;

        // 穿透次数限制
        switch (weaponType) {
            case 'sniper':       this.pierceCount = 999; break; // 狙击枪无限穿透
            case 'desert_eagle': this.pierceCount = 1;   break; // 沙鹰穿透1次（最多打2个）
            default:             this.pierceCount = 0;   break; // 其他武器不穿透
        }

        // 用于拖尾效果
        this._trail = [];
    }

    /**
     * 更新子弹位置
     */
    update() {
        if (!this.active) return;

        // 记录拖尾（最多保留 4 个）
        this._trail.push({ x: this.x, y: this.y });
        if (this._trail.length > 4) this._trail.shift();

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    /**
     * 绘制子弹（根据武器类型使用不同外观）
     */
    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        switch (this.weaponType) {
            case 'sniper':      this._drawSniper(ctx); break;
            case 'shotgun':     this._drawShotgun(ctx); break;
            case 'machine_gun': this._drawMachineGun(ctx); break;
            case 'smg':         this._drawSMG(ctx); break;
            default:            this._drawPistol(ctx); break;  // desert_eagle
        }

        ctx.restore();
    }

    /** 手枪子弹：金色小椭圆 */
    _drawPistol(ctx) {
        this._drawTrail(ctx, 'rgba(255, 210, 0, 0.5)');

        // 外层光晕
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);

        // 核心子弹（细长椭圆）
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ffe033';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 高光线
        ctx.fillStyle = 'rgba(255, 255, 200, 0.7)';
        ctx.fillRect(this.x + 1, this.y, 2, this.height * 0.6);
    }

    /** 狙击枪子弹：蓝白色高速穿透弹 */
    _drawSniper(ctx) {
        this._drawTrail(ctx, 'rgba(0, 180, 255, 0.5)');

        // 冲击波光晕（更大）
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#00bfff';
        ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);

        // 外层
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#88ddff';
        ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

        // 核心（更细更亮）
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 1, this.y, this.width - 2, this.height);

        // 高光
        ctx.fillStyle = '#00bfff';
        ctx.fillRect(this.x, this.y, 1, this.height);
    }

    /** 机枪子弹：红色短粗弹 */
    _drawMachineGun(ctx) {
        this._drawTrail(ctx, 'rgba(255, 80, 80, 0.4)');

        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(this.x, this.y, this.width, this.height * 0.8);

        // 弹头反光
        ctx.fillStyle = '#ffaaaa';
        ctx.fillRect(this.x + 1, this.y, 2, 4);
    }

    /** 霰弹枪子弹：橙色扁弹丸 */
    _drawShotgun(ctx) {
        // 霰弹无拖尾，用光晕代替
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ff8c00';
        const r = this.width + 3;
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2,
            this.y + this.height / 2,
            r, 0, Math.PI * 2
        );
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.width * 0.6, 0, Math.PI * 2
        );
        ctx.fill();

        // 高光
        ctx.fillStyle = 'rgba(255, 255, 200, 0.7)';
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2 - 1,
            this.y + this.height / 2 - 1,
            this.width * 0.25, 0, Math.PI * 2
        );
        ctx.fill();
    }

    /** 冲锋枪子弹：绿色细小快弹 */
    _drawSMG(ctx) {
        this._drawTrail(ctx, 'rgba(50, 200, 50, 0.4)');

        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#32cd32';
        ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#44ee44';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = 'rgba(200, 255, 200, 0.6)';
        ctx.fillRect(this.x + 1, this.y, 1, this.height * 0.5);
    }

    /** 绘制拖尾效果 */
    _drawTrail(ctx, trailColor) {
        if (this._trail.length < 2) return;
        for (let i = 0; i < this._trail.length; i++) {
            const t = this._trail[i];
            const alpha = (i / this._trail.length) * 0.4;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = trailColor;
            ctx.fillRect(
                t.x, t.y,
                this.width, this.height
            );
        }
        ctx.globalAlpha = 1;
    }

    /**
     * 检查是否超出屏幕
     */
    isOutOfBounds(canvasWidth, canvasHeight) {
        return this.x < -this.width || this.x > canvasWidth ||
               this.y < -this.height || this.y > canvasHeight;
    }

    /**
     * 获取碰撞盒
     */
    getHitbox() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

/**
 * 子弹管理器
 */
const BulletManager = {
    bullets: [],

    add(bullets) {
        if (Array.isArray(bullets)) {
            this.bullets.push(...bullets);
        } else {
            this.bullets.push(bullets);
        }
    },

    update(canvasWidth, canvasHeight) {
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(
            bullet => bullet.active && !bullet.isOutOfBounds(canvasWidth, canvasHeight)
        );
    },

    draw(ctx) {
        this.bullets.forEach(bullet => bullet.draw(ctx));
    },

    /**
     * 检查与丧尸的碰撞（支持穿透）
     * 优化：丧尸排序只做一次，而非每颗子弹各做一次
     */
    checkCollisions(zombies) {
        const hits = [];
        if (this.bullets.length === 0 || zombies.length === 0) return hits;

        // 按 y 从大到小排序一次（靠近玩家的丧尸优先被打）
        const sortedZombies = zombies
            .filter(z => z.alive)
            .sort((a, b) => b.y - a.y);

        if (sortedZombies.length === 0) return hits;

        this.bullets.forEach(bullet => {
            if (!bullet.active || bullet.damage <= 0) return;

            for (const zombie of sortedZombies) {
                if (!zombie.alive) continue;
                if (bullet.damage <= 0) break;

                if (Utils.rectCollision(bullet.getHitbox(), zombie.getHitbox())) {
                    const zombieHpBefore = zombie.hp;
                    const actualDamage = zombie.takeDamage(bullet.damage);

                    hits.push({ bullet, zombie, damage: actualDamage });

                    if (!zombie.alive && bullet.pierceCount > 0) {
                        bullet.damage -= zombieHpBefore;
                        bullet.pierceCount--;
                    } else {
                        bullet.damage = 0;
                        bullet.active = false;
                        break;
                    }
                }
            }

            if (bullet.damage <= 0) {
                bullet.active = false;
            }
        });

        this.bullets = this.bullets.filter(b => b.active);
        return hits;
    },

    clear() {
        this.bullets = [];
    },
};
