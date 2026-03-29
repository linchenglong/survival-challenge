/**
 * 丧尸系统
 */

class Zombie {
    constructor(type, level, x) {
        this.type = type;
        this.level = level;
        this.config = CONFIG.ZOMBIES[type];
        
        // 计算实际属性
        const stats = Utils.calculateZombieStats(this.config, level);
        this.maxHp = stats.hp;
        this.hp = stats.hp;
        this.defense = stats.defense;
        this.speed = stats.speed;
        this.damage = stats.damage;
        
        // 位置和尺寸
        this.x = x;
        this.y = -this.config.size; // 从屏幕上方开始
        this.width = this.config.size;
        this.height = this.config.size;
        
        // 状态
        this.alive = true;
        this.frozen = false;
        this.frozenUntil = 0;

        // 动画
        this._frame = Math.floor(Math.random() * 60); // 随机错开动画相位
        this._wobble = Math.random() * Math.PI * 2;   // 摇晃相位

        // 死亡特效
        this._dying = false;
        this._dyingTimer = 0;
    }

    /**
     * 更新丧尸状态
     */
    update(deltaTime, currentTime) {
        if (!this.alive) return;

        // 检查冻结状态
        if (this.frozen && currentTime < this.frozenUntil) {
            return;
        }
        this.frozen = false;

        // 向下移动
        this.y += this.speed;

        // 动画
        this._frame++;
        this._wobble = (this._wobble + 0.05) % (Math.PI * 2);
    }

    /**
     * 受到伤害
     */
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense);
        this.hp -= actualDamage;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        
        return actualDamage;
    }

    /**
     * 冻结
     */
    freeze(duration, currentTime) {
        this.frozen = true;
        this.frozenUntil = currentTime + duration;
    }

    /**
     * 检查是否到达玩家位置
     */
    hasReachedPlayer(playerY) {
        return this.y + this.height >= playerY;
    }

    /**
     * 绘制丧尸
     */
    draw(ctx) {
        if (!this.alive) return;

        ctx.save();

        // 冻结状态：蓝色调滤镜
        if (this.frozen) {
            ctx.filter = 'hue-rotate(180deg) saturate(0.6) brightness(1.2)';
        }

        // 根据类型绘制不同形象
        switch (this.type) {
            case 'normal':   this._drawNormal(ctx); break;
            case 'fat':      this._drawFat(ctx); break;
            case 'agile':    this._drawAgile(ctx); break;
            case 'armored':  this._drawArmored(ctx); break;
            case 'berserk':  this._drawBerserk(ctx); break;
            default:         this._drawNormal(ctx); break;
        }

        ctx.filter = 'none';

        // 冻结光圈
        if (this.frozen) {
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);
            ctx.setLineDash([]);
        }

        // 血条
        this._drawHealthBar(ctx);

        ctx.restore();
    }

    /** 普通丧尸：略显腐烂的绿皮小人 */
    _drawNormal(ctx) {
        const x = this.x, y = this.y, w = this.width, h = this.height;
        const cx = x + w / 2;
        const wobble = Math.sin(this._wobble) * 2;

        // 腿（走路摆动）
        const legSwing = Math.sin(this._wobble * 2) * 3;
        ctx.fillStyle = '#3a5c3a';
        ctx.fillRect(cx - 7, y + h * 0.65, 6, h * 0.35 + legSwing);
        ctx.fillRect(cx + 1,  y + h * 0.65, 6, h * 0.35 - legSwing);

        // 躯干
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(cx - 9, y + h * 0.35, 18, h * 0.32);

        // 头（前倾）
        ctx.fillStyle = '#5c8c4a';
        ctx.beginPath();
        ctx.ellipse(cx + wobble * 0.3, y + h * 0.18, 9, 10, wobble * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛（红色发光）
        ctx.fillStyle = '#ff2020';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 4;
        ctx.fillRect(cx - 5 + wobble * 0.3, y + h * 0.14, 4, 3);
        ctx.fillRect(cx + 1 + wobble * 0.3, y + h * 0.14, 4, 3);
        ctx.shadowBlur = 0;

        // 嘴巴（龇牙）
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(cx - 4 + wobble * 0.3, y + h * 0.22, 8, 3);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(cx - 3 + wobble * 0.3, y + h * 0.22, 2, 2);
        ctx.fillRect(cx + 1 + wobble * 0.3, y + h * 0.22, 2, 2);

        // 手臂（伸向前方）
        ctx.fillStyle = '#4a7c59';
        ctx.save();
        ctx.translate(cx, y + h * 0.4);
        ctx.rotate(-0.2 + wobble * 0.05);
        ctx.fillRect(-16, -3, 7, 6); // 左臂
        ctx.restore();
        ctx.save();
        ctx.translate(cx, y + h * 0.4);
        ctx.rotate(0.2 - wobble * 0.05);
        ctx.fillRect(9, -3, 7, 6); // 右臂
        ctx.restore();

        // 伤口/污渍
        ctx.fillStyle = 'rgba(120, 0, 0, 0.5)';
        ctx.fillRect(cx - 3, y + h * 0.38, 3, 5);
    }

    /** 胖子丧尸：巨大臃肿的体型 */
    _drawFat(ctx) {
        const x = this.x, y = this.y, w = this.width, h = this.height;
        const cx = x + w / 2;
        const wobble = Math.sin(this._wobble) * 1.5;

        // 腿（粗短）
        ctx.fillStyle = '#3d2c20';
        ctx.fillRect(cx - 12, y + h * 0.68, 11, h * 0.32);
        ctx.fillRect(cx + 1,  y + h * 0.68, 11, h * 0.32);

        // 大肚子（椭圆）
        ctx.fillStyle = '#7a5c44';
        ctx.beginPath();
        ctx.ellipse(cx, y + h * 0.55, w * 0.48, h * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 躯干
        ctx.fillStyle = '#6b4f38';
        ctx.fillRect(cx - w * 0.4, y + h * 0.3, w * 0.8, h * 0.38);

        // 大头
        ctx.fillStyle = '#8a6650';
        ctx.beginPath();
        ctx.ellipse(cx + wobble * 0.2, y + h * 0.16, 14, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // 厚实的眉骨
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(cx - 10 + wobble * 0.2, y + h * 0.10, 20, 4);

        // 眼睛（橙色）
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(cx - 5 + wobble * 0.2, y + h * 0.15, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 5 + wobble * 0.2, y + h * 0.15, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 大嘴（怒吼）
        ctx.fillStyle = '#1a0000';
        ctx.beginPath();
        ctx.arc(cx + wobble * 0.2, y + h * 0.22, 7, 0, Math.PI);
        ctx.fill();
        // 牙齿
        ctx.fillStyle = '#ddd';
        for (let i = -2; i <= 2; i++) {
            ctx.fillRect(cx + i * 3 - 1 + wobble * 0.2, y + h * 0.22, 2, 4);
        }

        // 手臂（粗大）
        ctx.fillStyle = '#7a5c44';
        ctx.fillRect(x - 4, y + h * 0.32, 10, h * 0.32);
        ctx.fillRect(x + w - 6, y + h * 0.32, 10, h * 0.32);
    }

    /** 敏捷丧尸：细长骨感、弓身前倾 */
    _drawAgile(ctx) {
        const x = this.x, y = this.y, w = this.width, h = this.height;
        const cx = x + w / 2;
        const wobble = Math.sin(this._wobble) * 3;
        const lean = -0.2; // 前倾角度

        ctx.save();
        ctx.translate(cx, y + h * 0.5);
        ctx.rotate(lean);

        // 腿（细长）
        ctx.fillStyle = '#5c1a1a';
        const legSwing = Math.sin(this._wobble * 2.5) * 4;
        ctx.fillRect(-5, h * 0.18, 4, h * 0.42 + legSwing);
        ctx.fillRect(1,  h * 0.18, 4, h * 0.42 - legSwing);

        // 躯干（纤细）
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-6, -h * 0.2, 12, h * 0.4);

        // 头（小，向前探）
        ctx.fillStyle = '#a01010';
        ctx.beginPath();
        ctx.ellipse(2, -h * 0.32, 7, 8, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛（狭长）
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 6;
        ctx.fillRect(-3, -h * 0.35, 3, 2);
        ctx.fillRect(2,  -h * 0.35, 3, 2);
        ctx.shadowBlur = 0;

        // 爪子手臂（前伸抓挠）
        ctx.fillStyle = '#8b0000';
        ctx.save();
        ctx.rotate(-0.5 + wobble * 0.08);
        ctx.fillRect(-16, -h * 0.15, 10, 4);
        ctx.restore();
        ctx.save();
        ctx.rotate(0.3 - wobble * 0.08);
        ctx.fillRect(6, -h * 0.15, 10, 4);
        ctx.restore();

        // 爪子
        ctx.fillStyle = '#5c0000';
        ctx.fillRect(-18, -h * 0.17, 3, 6);
        ctx.fillRect(14, -h * 0.17, 3, 6);

        ctx.restore();
    }

    /** 装甲丧尸：穿着残破金属甲的丧尸 */
    _drawArmored(ctx) {
        const x = this.x, y = this.y, w = this.width, h = this.height;
        const cx = x + w / 2;
        const wobble = Math.sin(this._wobble) * 1.5;

        // 腿（铁靴）
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(cx - 9, y + h * 0.65, 8, h * 0.35);
        ctx.fillRect(cx + 1,  y + h * 0.65, 8, h * 0.35);

        // 铠甲腿片
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(cx - 10, y + h * 0.62, 9, 6);
        ctx.fillRect(cx,      y + h * 0.62, 9, 6);

        // 躯干（铠甲）
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(cx - 13, y + h * 0.3, 26, h * 0.35);

        // 铠甲高光
        ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
        ctx.fillRect(cx - 12, y + h * 0.31, 24, 3);

        // 铠甲划痕/腐蚀
        ctx.fillStyle = 'rgba(180, 60, 0, 0.4)';
        ctx.fillRect(cx - 5, y + h * 0.35, 3, 8);
        ctx.fillRect(cx + 4, y + h * 0.38, 2, 10);

        // 头盔
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.ellipse(cx + wobble * 0.2, y + h * 0.17, 12, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头盔护面
        ctx.fillStyle = '#555';
        ctx.fillRect(cx - 9 + wobble * 0.2, y + h * 0.11, 18, 10);

        // 眼缝（发红光）
        ctx.fillStyle = '#ff3300';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 5;
        ctx.fillRect(cx - 7 + wobble * 0.2, y + h * 0.14, 5, 2);
        ctx.fillRect(cx + 2 + wobble * 0.2, y + h * 0.14, 5, 2);
        ctx.shadowBlur = 0;

        // 肩甲
        ctx.fillStyle = '#606060';
        ctx.fillRect(x - 2, y + h * 0.3, 11, 8);
        ctx.fillRect(x + w - 9, y + h * 0.3, 11, 8);

        // 手臂
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(x, y + h * 0.35, 8, h * 0.28);
        ctx.fillRect(x + w - 8, y + h * 0.35, 8, h * 0.28);
    }

    /** 狂暴丧尸：巨大紫色肌肉怪 */
    _drawBerserk(ctx) {
        const x = this.x, y = this.y, w = this.width, h = this.height;
        const cx = x + w / 2;
        const wobble = Math.sin(this._wobble * 1.5) * 2;
        const rage = 0.5 + 0.5 * Math.sin(this._wobble * 3); // 狂暴光效脉冲

        // 肌肉腿
        ctx.fillStyle = '#6a1a8a';
        const legSwing = Math.sin(this._wobble * 2) * 4;
        ctx.fillRect(cx - 11, y + h * 0.62, 10, h * 0.38 + legSwing);
        ctx.fillRect(cx + 1,  y + h * 0.62, 10, h * 0.38 - legSwing);

        // 核心躯干（肌肉发达）
        ctx.fillStyle = '#8b008b';
        ctx.beginPath();
        ctx.ellipse(cx, y + h * 0.48, w * 0.46, h * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillRect(cx - w * 0.44, y + h * 0.3, w * 0.88, h * 0.35);

        // 怒气光晕
        ctx.fillStyle = `rgba(200, 0, 255, ${rage * 0.15})`;
        ctx.beginPath();
        ctx.ellipse(cx, y + h * 0.45, w * 0.55, h * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 肌肉线条
        ctx.strokeStyle = 'rgba(150, 0, 180, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 8, y + h * 0.32);
        ctx.lineTo(cx - 5, y + h * 0.55);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 8, y + h * 0.32);
        ctx.lineTo(cx + 5, y + h * 0.55);
        ctx.stroke();

        // 头部（大而凶）
        ctx.fillStyle = '#9a0a9a';
        ctx.beginPath();
        ctx.ellipse(cx + wobble * 0.3, y + h * 0.16, 13, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // 角（狂暴变异）
        ctx.fillStyle = '#4a004a';
        ctx.beginPath();
        ctx.moveTo(cx - 8, y + h * 0.06);
        ctx.lineTo(cx - 14, y - h * 0.04);
        ctx.lineTo(cx - 5, y + h * 0.06);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 8, y + h * 0.06);
        ctx.lineTo(cx + 14, y - h * 0.04);
        ctx.lineTo(cx + 5, y + h * 0.06);
        ctx.fill();

        // 眼睛（紫色发狂）
        ctx.fillStyle = `rgba(255, 0, 255, ${0.7 + rage * 0.3})`;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cx - 5 + wobble * 0.3, y + h * 0.14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 5 + wobble * 0.3, y + h * 0.14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 嘴巴（大裂口）
        ctx.fillStyle = '#1a001a';
        ctx.fillRect(cx - 8 + wobble * 0.3, y + h * 0.21, 16, 4);
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(cx - 7 + wobble * 0.3, y + h * 0.22, 2, 2);
        ctx.fillRect(cx + 1 + wobble * 0.3, y + h * 0.22, 2, 2);
        ctx.fillRect(cx + 5 + wobble * 0.3, y + h * 0.22, 2, 2);

        // 巨臂
        ctx.fillStyle = '#8b008b';
        ctx.save();
        ctx.translate(x - 2, y + h * 0.34);
        ctx.rotate(-0.3 + wobble * 0.06);
        ctx.fillRect(-8, -5, 18, 10);
        ctx.restore();
        ctx.save();
        ctx.translate(x + w + 2, y + h * 0.34);
        ctx.rotate(0.3 - wobble * 0.06);
        ctx.fillRect(-10, -5, 18, 10);
        ctx.restore();
    }

    /**
     * 绘制血条
     */
    _drawHealthBar(ctx) {
        const barW = this.width + 4;
        const barH = 4;
        const barX = this.x - 2;
        const barY = this.y - 9;
        const ratio = this.hp / this.maxHp;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        // 底色
        ctx.fillStyle = '#2c0000';
        ctx.fillRect(barX, barY, barW, barH);

        // 血量
        const hpColor = ratio > 0.6 ? '#2ecc71'
                      : ratio > 0.3 ? '#f1c40f'
                      : '#e74c3c';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * ratio, barH);

        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(barX, barY, barW * ratio, 1);
    }

    /**
     * 获取碰撞盒（比实际显示稍大，更容易命中）
     */
    getHitbox() {
        const padding = 5;
        return {
            x: this.x - padding,
            y: this.y - padding,
            width: this.width + padding * 2,
            height: this.height + padding * 2,
        };
    }
}

/**
 * 丧尸管理器
 */
const ZombieManager = {
    zombies: [],
    totalSpawned: 0,
    totalKilled: 0,

    /**
     * 创建丧尸
     */
    create(type, level, canvasWidth) {
        const config = CONFIG.ZOMBIES[type];
        const x = Utils.randomInt(10, canvasWidth - config.size - 10);
        const zombie = new Zombie(type, level, x);
        this.zombies.push(zombie);
        this.totalSpawned++;
        return zombie;
    },

    /**
     * 批量创建丧尸
     */
    createBatch(types, level, count, canvasWidth) {
        for (let i = 0; i < count; i++) {
            const type = Utils.randomChoice(types);
            this.create(type, level, canvasWidth);
        }
    },

    /**
     * 更新所有丧尸
     */
    update(deltaTime, currentTime) {
        this.zombies.forEach(zombie => {
            zombie.update(deltaTime, currentTime);
        });
    },

    /**
     * 绘制所有丧尸
     */
    draw(ctx) {
        this.zombies.forEach(zombie => {
            zombie.draw(ctx);
        });
    },

    /**
     * 移除死亡丧尸（一次遍历，同时统计击杀数）
     */
    removeDead() {
        let killed = 0;
        const alive = [];
        for (const z of this.zombies) {
            if (z.alive) alive.push(z);
            else killed++;
        }
        this.totalKilled += killed;
        this.zombies = alive;
    },

    /**
     * 获取存活的丧尸数量
     * removeDead() 后 this.zombies 已全部存活，直接返回长度
     */
    getAliveCount() {
        let count = 0;
        for (const z of this.zombies) if (z.alive) count++;
        return count;
    },

    /**
     * 获取所有存活的丧尸
     */
    getAliveZombies() {
        // 直接返回（每帧 removeDead 后数组里全是存活的）
        return this.zombies;
    },

    /**
     * 清除所有丧尸
     */
    clearAll() {
        this.totalKilled += this.zombies.length;
        this.zombies.forEach(z => z.alive = false);
        this.zombies = [];
    },

    /**
     * 冻结所有丧尸
     */
    freezeAll(duration, currentTime) {
        this.zombies.forEach(zombie => {
            zombie.freeze(duration, currentTime);
        });
    },

    /**
     * 重置
     */
    reset() {
        this.zombies = [];
        this.totalSpawned = 0;
        this.totalKilled = 0;
    },
};
