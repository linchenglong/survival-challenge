/**
 * 玩家系统
 */

class Player {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // 基础属性
        this.maxHp = CONFIG.PLAYER.INITIAL_HP;
        this.hp = this.maxHp;
        this.speed = CONFIG.PLAYER.SPEED;
        
        // 尺寸
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        
        // 位置（屏幕底部中央）
        this.x = (canvasWidth - this.width) / 2;
        this.y = canvasHeight - CONFIG.PLAYER.BOTTOM_OFFSET - this.height;
        
        // 武器
        this.weapon = new Weapon('desert_eagle', 1);
        
        // 射击计时器
        this.lastFireTime = 0;
        
        // 状态
        this.alive = true;
        
        // 移动状态
        this.movingLeft = false;
        this.movingRight = false;
        
        // 触摸跟踪
        this.targetX = null;

        // 动画
        this._frame = 0;        // 内部帧计数（用于动画）
        this._bobPhase = 0;     // 呼吸/浮动相位
        this._hitFlash = 0;     // 受击闪白帧数
    }

    /**
     * 更新玩家状态
     */
    update(currentTime) {
        if (!this.alive) return;

        // 触摸控制：向目标位置移动
        if (this.targetX !== null) {
            const playerCenterX = this.x + this.width / 2;
            const diff = this.targetX - playerCenterX;
            
            if (Math.abs(diff) > this.speed) {
                if (diff > 0) {
                    this.x += this.speed;
                } else {
                    this.x -= this.speed;
                }
            }
        } else {
            // 键盘控制
            if (this.movingLeft)  this.x -= this.speed;
            if (this.movingRight) this.x += this.speed;
        }

        // 限制在屏幕范围内
        this.x = Utils.clamp(this.x, 0, this.canvasWidth - this.width);

        // 动画更新
        this._frame++;
        this._bobPhase = (this._bobPhase + 0.06) % (Math.PI * 2);
        if (this._hitFlash > 0) this._hitFlash--;
    }

    /**
     * 尝试发射子弹
     */
    tryFire(currentTime) {
        if (!this.alive) return null;

        if (currentTime - this.lastFireTime >= this.weapon.fireInterval) {
            this.lastFireTime = currentTime;
            return this.createBullets();
        }
        return null;
    }

    /**
     * 创建子弹
     */
    createBullets() {
        const bullets = [];
        const bulletX = this.x + this.width / 2 - CONFIG.BULLET.WIDTH / 2;
        const bulletY = this.y;

        if (this.weapon.config.type === 'spread') {
            const bulletCount = this.weapon.config.bulletCount;
            const spreadAngle = this.weapon.config.spreadAngle;
            const angleStep = spreadAngle / (bulletCount - 1);
            const startAngle = -spreadAngle / 2;

            for (let i = 0; i < bulletCount; i++) {
                const angle = Utils.degToRad(startAngle + angleStep * i - 90);
                bullets.push(new Bullet(
                    bulletX, bulletY,
                    this.weapon.attack,
                    this.weapon.config.color,
                    angle,
                    this.weapon.type
                ));
            }
        } else {
            bullets.push(new Bullet(
                bulletX, bulletY,
                this.weapon.attack,
                this.weapon.config.color,
                Utils.degToRad(-90),
                this.weapon.type
            ));
        }

        return bullets;
    }

    /**
     * 受到伤害
     */
    takeDamage(damage) {
        this.hp -= damage;
        this._hitFlash = 8; // 触发受击闪白
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    /**
     * 绘制玩家（像素风小人）
     */
    draw(ctx) {
        if (!this.alive) return;

        const cx = this.x + this.width / 2;
        const baseY = this.y;
        // 轻微上下浮动
        const bob = Math.sin(this._bobPhase) * 1.2;
        const by = baseY + bob;

        ctx.save();

        // 受击闪白效果
        if (this._hitFlash > 0) {
            ctx.globalAlpha = 0.4 + 0.6 * (this._hitFlash / 8);
            // 先画一层白色轮廓
            ctx.filter = 'brightness(3) saturate(0)';
            this._drawBody(ctx, cx, by);
            ctx.filter = 'none';
            ctx.globalAlpha = 1;
        }

        this._drawBody(ctx, cx, by);

        // 武器枪口闪光（射击时）
        if (this._hitFlash === 0) {
            this._drawWeapon(ctx, cx, by);
        }

        ctx.restore();
    }

    /**
     * 绘制玩家身体（像素风格小人）
     */
    _drawBody(ctx, cx, by) {
        const w = this.width;

        // ── 腿部（行走摆动） ──
        const legSwing = Math.sin(this._bobPhase * 2) * 4;
        const isMoving = this.movingLeft || this.movingRight || this.targetX !== null;

        // 左腿
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(cx - 9, by + 34, 8, isMoving ? 12 + legSwing : 12);

        // 右腿
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(cx + 1,  by + 34, 8, isMoving ? 12 - legSwing : 12);

        // 靴子
        ctx.fillStyle = '#111827';
        ctx.fillRect(cx - 11, by + 43, 10, 5);
        ctx.fillRect(cx + 1,  by + 43, 10, 5);

        // ── 躯干 ──
        // 背心/战甲
        ctx.fillStyle = '#1a4480';
        ctx.fillRect(cx - 12, by + 18, 24, 18);

        // 战甲高光
        ctx.fillStyle = 'rgba(100, 160, 255, 0.35)';
        ctx.fillRect(cx - 11, by + 19, 10, 4);

        // 腰带
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(cx - 12, by + 33, 24, 3);

        // ── 手臂 ──
        // 左臂
        ctx.fillStyle = '#2d5a87';
        ctx.fillRect(cx - 18, by + 19, 7, 15);
        // 右臂（持枪侧略微前伸）
        ctx.fillStyle = '#2d5a87';
        ctx.fillRect(cx + 11,  by + 17, 7, 15);

        // 手套
        ctx.fillStyle = '#2c2c2c';
        ctx.fillRect(cx - 18, by + 33, 7, 5);
        ctx.fillRect(cx + 11,  by + 31, 7, 5);

        // ── 头部 ──
        // 脖子
        ctx.fillStyle = '#c8a882';
        ctx.fillRect(cx - 4, by + 12, 8, 7);

        // 头盔
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.ellipse(cx, by + 8, 13, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头盔护目镜
        ctx.fillStyle = '#e94560';
        ctx.fillRect(cx - 10, by + 6, 20, 6);

        // 护目镜反光
        ctx.fillStyle = 'rgba(255, 180, 180, 0.6)';
        ctx.fillRect(cx - 9, by + 7, 6, 2);

        // 头盔顶部高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.ellipse(cx - 2, by + 3, 7, 5, -0.3, 0, Math.PI);
        ctx.fill();

        // ── 胸部标志 ──
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(cx - 4, by + 22, 8, 2);
        ctx.fillRect(cx - 4, by + 26, 8, 2);
    }

    /**
     * 绘制武器
     */
    _drawWeapon(ctx, cx, by) {
        const weaponType = this.weapon.type;
        const color = this.weapon.config.color;

        ctx.save();

        if (weaponType === 'shotgun') {
            // 霰弹枪 - 粗管
            ctx.fillStyle = '#555';
            ctx.fillRect(cx + 10, by + 5, 5, 18);
            ctx.fillStyle = color;
            ctx.fillRect(cx + 11, by + 3, 3, 6);
            // 双管高光
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(cx + 11, by + 5, 1, 14);
        } else if (weaponType === 'sniper') {
            // 狙击枪 - 细长枪管
            ctx.fillStyle = '#444';
            ctx.fillRect(cx + 12, by - 6, 3, 26);
            ctx.fillStyle = color;
            ctx.fillRect(cx + 12, by - 8, 3, 10);
            // 瞄准镜
            ctx.fillStyle = '#222';
            ctx.fillRect(cx + 11, by + 10, 5, 5);
            ctx.fillStyle = color;
            ctx.fillRect(cx + 12, by + 11, 3, 3);
        } else if (weaponType === 'machine_gun') {
            // 机枪 - 粗短管 + 弹夹
            ctx.fillStyle = '#555';
            ctx.fillRect(cx + 10, by + 8, 6, 14);
            ctx.fillStyle = '#333';
            ctx.fillRect(cx + 10, by + 16, 8, 6);  // 弹夹
            ctx.fillStyle = color;
            ctx.fillRect(cx + 11, by + 5, 4, 8);
        } else if (weaponType === 'smg') {
            // 冲锋枪 - 短小
            ctx.fillStyle = '#444';
            ctx.fillRect(cx + 11, by + 8, 5, 12);
            ctx.fillStyle = '#333';
            ctx.fillRect(cx + 11, by + 15, 6, 5);  // 弹夹
            ctx.fillStyle = color;
            ctx.fillRect(cx + 12, by + 5, 3, 7);
        } else {
            // 手枪（沙漠之鹰）- 默认
            ctx.fillStyle = '#555';
            ctx.fillRect(cx + 11, by + 10, 5, 12);
            ctx.fillStyle = '#333';
            ctx.fillRect(cx + 11, by + 18, 6, 5);  // 握把
            ctx.fillStyle = color;
            ctx.fillRect(cx + 12, by + 6, 3, 8);   // 枪管
        }

        // 枪口闪光（射击判断：lastFireTime 在非常近的时间内）
        // 由游戏层控制，这里不处理

        ctx.restore();
    }

    /**
     * 获取碰撞盒
     */
    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        };
    }

    /**
     * 重置玩家状态
     */
    reset() {
        this.hp = this.maxHp;
        this.x = (this.canvasWidth - this.width) / 2;
        this.alive = true;
        this.lastFireTime = 0;
        this.movingLeft = false;
        this.movingRight = false;
        this._hitFlash = 0;
    }

    /**
     * 为下一关升级武器
     */
    upgradeWeapon() {
        this.weapon.upgrade();
    }
}
