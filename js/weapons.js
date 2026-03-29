/**
 * 武器系统
 *
 * 属性说明：
 *   baseAttack / baseFireRate  ← 仅由等级决定，每次 upgrade() 后更新
 *   bonusAttack / bonusFireRateMult ← 由道具累积，过关时保留
 *   attack = baseAttack + bonusAttack
 *   fireRate = baseFireRate * bonusFireRateMult
 */

class Weapon {
    constructor(type = 'desert_eagle', level = 1) {
        this.type   = type;
        this.level  = level;
        this.config = CONFIG.WEAPONS[type];

        // 道具 bonus（过关保留）
        this.bonusAttack       = 0;
        this.bonusFireRateMult = 1.0;  // 乘数，初始 1.0

        this._updateBase();
        this._applyStats();
    }

    /** 根据等级计算基础属性（不含道具 bonus） */
    _updateBase() {
        const stats = Utils.calculateWeaponStats(this.config, this.level);
        this.baseAttack   = stats.attack;
        this.baseFireRate = stats.fireRate;
    }

    /** 将 base + bonus 写入最终使用的 attack / fireRate */
    _applyStats() {
        this.attack   = this.baseAttack + this.bonusAttack;
        this.fireRate  = this.baseFireRate * this.bonusFireRateMult;
        this.fireInterval = 1000 / Math.max(this.fireRate, 0.1);
    }

    /** 已废弃的旧接口，保留兼容 */
    updateStats() {
        this._updateBase();
        this._applyStats();
    }

    /**
     * 过关升级：等级 +1，重新计算 base，bonus 保留
     */
    upgrade() {
        if (this.level < CONFIG.WEAPON_UPGRADE.MAX_LEVEL) {
            this.level++;
            this._updateBase();
            this._applyStats();
            return true;
        }
        return false;
    }

    /**
     * 道具：攻击力增减
     * @param {number} delta  正数=增加，负数=减少
     */
    addBonusAttack(delta) {
        this.bonusAttack += delta;
        // 保证最终攻击力不低于 1
        if (this.baseAttack + this.bonusAttack < 1) {
            this.bonusAttack = 1 - this.baseAttack;
        }
        this._applyStats();
    }

    /**
     * 道具：攻速倍率叠加
     * @param {number} percentDelta  百分比，如 +10 表示 ×1.10，-5 表示 ×0.95
     */
    addBonusFireRate(percentDelta) {
        const mult = 1 + percentDelta / 100;
        this.bonusFireRateMult *= mult;
        // 防止攻速过低
        if (this.baseFireRate * this.bonusFireRateMult < 0.1) {
            this.bonusFireRateMult = 0.1 / this.baseFireRate;
        }
        this._applyStats();
    }

    /**
     * 更换武器类型（保留等级和 bonus）
     */
    changeType(newType) {
        if (newType === this.type) {
            return this.upgrade();
        }
        this.type   = newType;
        this.config = CONFIG.WEAPONS[newType];
        this._updateBase();
        this._applyStats();
        return true;
    }

    /**
     * 获取武器信息（用于 HUD 显示）
     */
    getInfo() {
        return {
            name:      this.config.name,
            type:      this.type,
            level:     this.level,
            attack:    Math.round(this.attack),
            fireRate:  this.fireRate.toFixed(1),
            shootType: this.config.type,
            color:     this.config.color,
        };
    }
}

/**
 * 武器管理器
 */
const WeaponManager = {
    getAllTypes() {
        return Object.keys(CONFIG.WEAPONS);
    },

    getRandomType() {
        return Utils.randomChoice(this.getAllTypes());
    },

    getConfig(type) {
        return CONFIG.WEAPONS[type];
    },
};
