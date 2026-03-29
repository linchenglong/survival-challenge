/**
 * 工具函数
 */

const Utils = {
    /**
     * 生成指定范围内的随机整数
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 生成指定范围内的随机浮点数
     */
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * 从数组中随机选择一个元素
     */
    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    /**
     * 根据概率判断是否命中
     */
    chance(probability) {
        return Math.random() < probability;
    },

    /**
     * 碰撞检测 - 矩形碰撞
     */
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    /**
     * 计算两点之间的距离
     */
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    /**
     * 角度转弧度
     */
    degToRad(degrees) {
        return degrees * Math.PI / 180;
    },

    /**
     * 弧度转角度
     */
    radToDeg(radians) {
        return radians * 180 / Math.PI;
    },

    /**
     * 限制值在范围内
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * 格式化时间（秒 -> MM:SS）
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * 计算武器升级后的属性
     */
    calculateWeaponStats(weaponConfig, level) {
        const attackBonus = Math.pow(1 + CONFIG.WEAPON_UPGRADE.ATTACK_BONUS_RATE, level - 1);
        const fireRateBonus = Math.pow(1 + CONFIG.WEAPON_UPGRADE.FIRE_RATE_BONUS_RATE, level - 1);
        
        return {
            attack: Math.round(weaponConfig.attack * attackBonus),
            fireRate: weaponConfig.fireRate * fireRateBonus,
        };
    },

    /**
     * 计算丧尸升级后的属性
     */
    calculateZombieStats(zombieConfig, level) {
        const hpBonus = Math.pow(1 + CONFIG.ZOMBIE_UPGRADE.HP_BONUS_RATE, level - 1);
        const speedBonus = Math.pow(1 + CONFIG.ZOMBIE_UPGRADE.SPEED_BONUS_RATE, level - 1);
        const damageBonus = Math.pow(1 + CONFIG.ZOMBIE_UPGRADE.DAMAGE_BONUS_RATE, level - 1);
        
        return {
            hp: Math.round(zombieConfig.hp * hpBonus),
            defense: zombieConfig.defense + (level - 1) * CONFIG.ZOMBIE_UPGRADE.DEFENSE_BONUS,
            speed: zombieConfig.speed * speedBonus,
            damage: Math.round(zombieConfig.damage * damageBonus),
        };
    },

    /**
     * 根据关卡获取关卡配置
     */
    getLevelConfig(level) {
        for (const stage of CONFIG.LEVEL.STAGES) {
            if (level >= stage.levels[0] && level <= stage.levels[1]) {
                return stage;
            }
        }
        // 默认返回最后一个阶段
        return CONFIG.LEVEL.STAGES[CONFIG.LEVEL.STAGES.length - 1];
    },

    /**
     * 随机生成道具效果数值
     */
    randomItemValue(valueRange) {
        if (Array.isArray(valueRange)) {
            return Utils.randomInt(valueRange[0], valueRange[1]);
        }
        return valueRange;
    },
};
