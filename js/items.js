/**
 * 道具系统 - 大卡片版
 *
 * 每个道具是一张横跨整个半屏宽度的大矩形卡片，
 * 左卡占 [0, canvasWidth/2)，右卡占 [canvasWidth/2, canvasWidth]，
 * 玩家在任意半屏位置都能碰到对应卡片。
 */

// 卡片尺寸（运行时根据 canvasWidth 动态计算）
const CARD_MARGIN   = 6;   // 卡片左右内边距（两边各 6px 留缝）
const CARD_HEIGHT   = 80;  // 卡片高度

class Item {
    /**
     * @param {string} type       道具类型 key
     * @param {'left'|'right'} side
     * @param {number} canvasWidth  canvas 总宽度
     */
    constructor(type, side, canvasWidth) {
        this.type   = type;
        this.side   = side;
        this.config = CONFIG.ITEMS.TYPES[type];
        this.canvasWidth = canvasWidth;

        // 卡片宽度 = 半屏宽 - 两侧 margin
        this.cardW = Math.floor(canvasWidth / 2) - CARD_MARGIN * 2;
        this.cardH = CARD_HEIGHT;

        // 左卡 x 起始，右卡 x 起始
        this.x = side === 'left'
            ? CARD_MARGIN
            : Math.floor(canvasWidth / 2) + CARD_MARGIN;
        this.y = -CARD_HEIGHT - 10;

        // 兼容旧逻辑用的碰撞宽高（实际判定用 cardW/cardH）
        this.width  = this.cardW;
        this.height = CARD_HEIGHT;

        this.speed      = CONFIG.ITEMS.FALL_SPEED;
        this.active     = true;
        this.effectValue = Utils.randomItemValue(this.config.effect.value);
        this.spawnTime  = performance.now();

        // 动画
        this._phase  = Math.random() * Math.PI * 2;  // 边框光效相位
        this._scale  = 0;                              // 弹出动画
        this._scanX  = 0;                              // 扫光位置
    }

    update() {
        if (!this.active) return;
        this.y      += this.speed;
        this._phase  = (this._phase + 0.06) % (Math.PI * 2);
        if (this._scale < 1) this._scale = Math.min(1, this._scale + 0.1);
        // 扫光从左到右循环
        this._scanX = (this._scanX + 1.5) % (this.cardW + 60);
    }

    applyEffect(player, weaponTypes) {
        const effect = this.config.effect;
        switch (effect.type) {
            case 'attack':
                player.weapon.addBonusAttack(this.effectValue);
                break;
            case 'fireRate':
                player.weapon.addBonusFireRate(this.effectValue);
                break;
            case 'weapon': {
                const otherTypes = weaponTypes.filter(t => t !== player.weapon.type);
                const newType = otherTypes.length > 0
                    ? Utils.randomChoice(otherTypes)
                    : Utils.randomChoice(weaponTypes);
                player.weapon.changeType(newType);
                break;
            }
            case 'heal':
                player.hp = Math.min(player.maxHp, player.hp + this.effectValue);
                break;
            case 'clear':
                this.active = false;
                return 'clear';
            case 'freeze':
                this.active = false;
                return 'freeze';
        }
        this.active = false;
        return null;
    }

    draw(ctx) {
        if (!this.active) return;

        const x  = this.x;
        const y  = this.y;
        const cw = this.cardW;
        const ch = this.cardH;
        const cr = 14; // 圆角半径

        ctx.save();

        // 弹出缩放动画（从卡片中心缩放）
        if (this._scale < 1) {
            const mx = x + cw / 2;
            const my = y + ch / 2;
            ctx.translate(mx, my);
            ctx.scale(this._scale, this._scale);
            ctx.translate(-mx, -my);
        }

        const isPositive = this.config.isPositive;
        const baseColor  = this.config.color;
        const pulse      = 0.8 + 0.2 * Math.abs(Math.sin(this._phase));

        // ── 1. 外层光晕（仅正面道具有蓝/彩光，负面道具暗红）──
        const glowColor = isPositive
            ? this._hexWithAlpha(baseColor, 0.25 * pulse)
            : 'rgba(120, 0, 0, 0.25)';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur  = 18;

        // ── 2. 卡片主背景 ──
        ctx.beginPath();
        this._roundRect(ctx, x, y, cw, ch, cr);

        // 背景渐变：正面道具用彩色系，负面用深红/紫系
        const bgGrad = ctx.createLinearGradient(x, y, x, y + ch);
        if (isPositive) {
            bgGrad.addColorStop(0, this._adjustColor(baseColor, 0.3, 0.9));   // 亮色顶部
            bgGrad.addColorStop(0.5, this._adjustColor(baseColor, 0.18, 0.7));
            bgGrad.addColorStop(1, this._adjustColor(baseColor, 0.08, 0.5));  // 暗色底部
        } else {
            bgGrad.addColorStop(0, 'rgba(60, 0, 0, 0.92)');
            bgGrad.addColorStop(1, 'rgba(30, 0, 30, 0.92)');
        }
        ctx.fillStyle = bgGrad;
        ctx.fill();
        ctx.shadowBlur = 0;

        // ── 3. 卡片边框（脉冲发光）──
        ctx.beginPath();
        this._roundRect(ctx, x, y, cw, ch, cr);
        const borderColor = isPositive
            ? this._hexWithAlpha(baseColor, 0.7 + 0.3 * pulse)
            : `rgba(180, 30, 30, ${0.6 + 0.4 * pulse})`;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // ── 4. 顶部高光条 ──
        ctx.beginPath();
        this._roundRect(ctx, x + 2, y + 2, cw - 4, 6, cr - 2);
        const hlGrad = ctx.createLinearGradient(x, y, x + cw, y);
        hlGrad.addColorStop(0,   'rgba(255,255,255,0)');
        hlGrad.addColorStop(0.3, 'rgba(255,255,255,0.3)');
        hlGrad.addColorStop(0.7, 'rgba(255,255,255,0.3)');
        hlGrad.addColorStop(1,   'rgba(255,255,255,0)');
        ctx.fillStyle = hlGrad;
        ctx.fill();

        // ── 5. 扫光动画 ──
        const scanX = x + this._scanX - 30;
        const scanGrad = ctx.createLinearGradient(scanX, y, scanX + 60, y);
        scanGrad.addColorStop(0,   'rgba(255,255,255,0)');
        scanGrad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
        scanGrad.addColorStop(1,   'rgba(255,255,255,0)');
        ctx.fillStyle = scanGrad;
        ctx.beginPath();
        this._roundRect(ctx, x, y, cw, ch, cr);
        ctx.fill();

        // ── 6. 左侧大图标 ──
        const iconSize = 38;
        const iconX = x + 14;
        const iconCY = y + ch / 2;
        ctx.font = `${iconSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.icon, iconX, iconCY);

        // ── 7. 道具名称（大号，粗体）──
        const textX = iconX + iconSize + 6;
        const nameLabel = this._buildName();
        ctx.font = 'bold 17px "PingFang SC", "Microsoft YaHei", Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        // 文字阴影
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur  = 4;
        ctx.fillStyle   = '#ffffff';
        ctx.fillText(nameLabel, textX, iconCY - 11);
        ctx.shadowBlur  = 0;

        // ── 8. 效果数值（醒目大字）──
        const valueLabel = this._buildValueLabel();
        if (valueLabel) {
            const vColor = isPositive ? '#ffee44' : '#ff5555';
            ctx.font = `bold 22px "Orbitron", "PingFang SC", Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = isPositive ? 'rgba(255,220,0,0.7)' : 'rgba(200,0,0,0.7)';
            ctx.shadowBlur  = 8;
            ctx.fillStyle   = vColor;
            ctx.fillText(valueLabel, textX, iconCY + 12);
            ctx.shadowBlur  = 0;
        }

        // ── 9. 正/负 角标 ──
        this._drawBadge(ctx, x + cw - 4, y + 4, isPositive);

        // ── 10. 负面道具警告叠加 ──
        if (!isPositive) {
            // 黑色半透明斜纹警告
            ctx.save();
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            this._roundRect(ctx, x, y, cw, ch, cr);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }

    /** 绘制右上角正/负角标 */
    _drawBadge(ctx, rx, ty, isPositive) {
        const bw = 28, bh = 18, br = 6;
        const bx = rx - bw;
        const by = ty;
        ctx.beginPath();
        this._roundRect(ctx, bx, by, bw, bh, br);
        ctx.fillStyle = isPositive ? 'rgba(34, 197, 94, 0.85)' : 'rgba(220, 38, 38, 0.85)';
        ctx.fill();
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(isPositive ? '正' : '负', bx + bw / 2, by + bh / 2);
    }

    /** 道具名称（短版） */
    _buildName() {
        const names = {
            attack_up:    '攻击力提升',
            speed_up:     '攻速提升',
            weapon_change:'更换武器',
            heal:         '生命恢复',
            attack_down:  '攻击力降低',
            speed_down:   '攻速降低',
            clear_all:    '全屏清除',
            freeze:       '时间冻结',
        };
        return names[this.type] || this.config.name;
    }

    /** 效果数值文字 */
    _buildValueLabel() {
        const effect = this.config.effect;
        const v = this.effectValue;
        switch (effect.type) {
            case 'attack':
                return v > 0 ? `攻击 +${v}` : `攻击 ${v}`;
            case 'fireRate':
                return v > 0 ? `攻速 +${v}%` : `攻速 ${v}%`;
            case 'heal':
                return `回血 +${v}`;
            case 'weapon':
                return '随机换枪';
            case 'clear':
                return '全部消灭！';
            case 'freeze':
                return '冻结 5 秒';
            default:
                return null;
        }
    }

    /** 绘制圆角矩形路径（兼容不支持 roundRect 的浏览器） */
    _roundRect(ctx, x, y, w, h, r) {
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, r);
        } else {
            r = Math.min(r, w / 2, h / 2);
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.arcTo(x + w, y, x + w, y + r, r);
            ctx.lineTo(x + w, y + h - r);
            ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
            ctx.lineTo(x + r, y + h);
            ctx.arcTo(x, y + h, x, y + h - r, r);
            ctx.lineTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
            ctx.closePath();
        }
    }

    /** hex 颜色 + alpha */
    _hexWithAlpha(hex, alpha) {
        if (!hex || hex.length < 7) return `rgba(128,128,128,${alpha})`;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    /**
     * 根据 hex 颜色生成背景色（保持色相，调整亮度和透明度）
     * @param {string} hex
     * @param {number} lightness  0~1 高亮程度（越高越白）
     * @param {number} alpha
     */
    _adjustColor(hex, lightness, alpha) {
        if (!hex || hex.length < 7) return `rgba(100,100,100,${alpha})`;
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.round(r + (255 - r) * lightness);
        g = Math.round(g + (255 - g) * lightness);
        b = Math.round(b + (255 - b) * lightness);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    isOutOfBounds(canvasHeight) {
        return this.y > canvasHeight + 10;
    }
}

// ================================================================
//  道具管理器
// ================================================================
const ItemManager = {
    items: [],
    itemPairs: [],
    lastSpawnTime: 0,
    waitingForPickup: false,
    pickedUpTime: 0,

    /**
     * 生成一对道具（大卡片版，需要传入 canvasWidth）
     */
    spawnItemPair(canvasWidth, currentTime) {
        if (this.waitingForPickup) return;

        const delay = this.lastSpawnTime === 0
            ? CONFIG.ITEMS.INITIAL_DELAY
            : CONFIG.ITEMS.PICKUP_DELAY;
        if (currentTime - this.pickedUpTime < delay) return;

        const isBothPositive = Utils.chance(CONFIG.ITEMS.COMBO.BOTH_POSITIVE);
        const positiveTypes  = Object.entries(CONFIG.ITEMS.TYPES)
            .filter(([, cfg]) => cfg.isPositive).map(([t]) => t);
        const negativeTypes  = Object.entries(CONFIG.ITEMS.TYPES)
            .filter(([, cfg]) => !cfg.isPositive).map(([t]) => t);

        let type1, type2;
        if (isBothPositive) {
            type1 = this._selectByProb(positiveTypes);
            type2 = this._selectByProb(positiveTypes.filter(t => t !== type1));
        } else {
            type1 = this._selectByProb(positiveTypes);
            type2 = this._selectByProb(negativeTypes);
        }

        const leftItem  = new Item(type1, 'left',  canvasWidth);
        const rightItem = new Item(type2, 'right', canvasWidth);

        this.items.push(leftItem, rightItem);
        this.itemPairs.push({ left: leftItem, right: rightItem });
        this.lastSpawnTime    = currentTime;
        this.waitingForPickup = true;
    },

    _selectByProb(types) {
        const total = types.reduce((s, t) => s + CONFIG.ITEMS.TYPES[t].probability, 0);
        let r = Math.random() * total;
        for (const t of types) {
            r -= CONFIG.ITEMS.TYPES[t].probability;
            if (r <= 0) return t;
        }
        return types[0];
    },

    update() {
        this.items.forEach(item => item.update());
    },

    draw(ctx) {
        this.items.forEach(item => item.draw(ctx));
    },

    /**
     * 检查玩家拾取
     * 判定逻辑：
     *   - 玩家在左半屏 → 左卡片；右半屏 → 右卡片
     *   - 卡片的 y 范围与玩家 y 范围重叠即触发（玩家碰到卡片任意位置）
     */
    checkPickups(player, weaponTypes, canvasWidth) {
        const results       = [];
        const playerCenterX = player.x + player.width / 2;
        const playerInLeft  = playerCenterX < canvasWidth / 2;

        // 玩家竖向范围
        const playerTop    = player.y - 20;
        const playerBottom = player.y + player.height;

        this.itemPairs = this.itemPairs.filter(pair => {
            const L = pair.left;
            const R = pair.right;

            if (!L.active && !R.active) return false;

            // 超时 或 飞出屏幕
            const age = performance.now() - L.spawnTime;
            if (L.isOutOfBounds(player.canvasHeight) || R.isOutOfBounds(player.canvasHeight)
                || age > 14000) {
                L.active = R.active = false;
                this.waitingForPickup = false;
                this.pickedUpTime = performance.now();
                return false;
            }

            // 卡片竖向范围（取两张中更靠下的底部）
            const cardTop    = Math.min(L.y, R.y);
            const cardBottom = Math.max(L.y + L.cardH, R.y + R.cardH);

            // 是否在玩家高度范围内
            const inRange = cardBottom >= playerTop && cardTop <= playerBottom;
            if (!inRange) return true;

            // 根据左右分区触发
            if (playerInLeft && L.active) {
                const fx = L.applyEffect(player, weaponTypes);
                if (fx) results.push({ type: fx, value: L.effectValue });
                R.active = false;
                this.waitingForPickup = false;
                this.pickedUpTime = performance.now();
                return false;
            } else if (!playerInLeft && R.active) {
                const fx = R.applyEffect(player, weaponTypes);
                if (fx) results.push({ type: fx, value: R.effectValue });
                L.active = false;
                this.waitingForPickup = false;
                this.pickedUpTime = performance.now();
                return false;
            }

            return true;
        });

        // 同步 items 数组
        this.items = this.items.filter(
            item => item.active && !item.isOutOfBounds(player.canvasHeight)
        );

        return results;
    },

    clear() {
        this.items = [];
        this.itemPairs = [];
    },

    reset() {
        this.items = [];
        this.itemPairs = [];
        this.lastSpawnTime    = 0;
        this.waitingForPickup = false;
        this.pickedUpTime     = 0;
    },
};
