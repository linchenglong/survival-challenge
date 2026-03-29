/**
 * 游戏配置文件
 * 包含所有游戏数值和常量定义
 */

const CONFIG = {
    // 游戏基础设置
    GAME: {
        FPS: 60,
        CANVAS_WIDTH: 450,      // 竖版手机宽度
        CANVAS_HEIGHT: 800,     // 竖版手机高度
    },

    // 玩家配置
    PLAYER: {
        INITIAL_HP: 100,
        WIDTH: 40,
        HEIGHT: 50,
        SPEED: 5,               // 左右移动速度
        BOTTOM_OFFSET: 80,      // 距离屏幕底部的距离
    },

    // 子弹配置
    BULLET: {
        SPEED: 15,              // 子弹飞行速度（加快）
        WIDTH: 8,               // 加宽，更容易命中
        HEIGHT: 20,             // 加长
    },

    // 武器配置（1级时的基础值）
    WEAPONS: {
        desert_eagle: {
            name: '沙漠之鹰',
            attack: 100,        // 攻击力大幅提升，支持穿透
            fireRate: 1.0,      // 发/秒
            type: 'line',       // 直线射击
            color: '#ffd700',
        },
        machine_gun: {
            name: '机枪',
            attack: 60,
            fireRate: 3.0,
            type: 'line',
            color: '#ff6b6b',
        },
        shotgun: {
            name: '霰弹枪',
            attack: 50,         // 每发子弹的伤害
            bulletCount: 5,     // 扇形发射的子弹数量
            spreadAngle: 30,    // 扇形角度（度）
            fireRate: 0.8,
            type: 'spread',     // 扇形射击
            color: '#ff8c00',
        },
        sniper: {
            name: '狙击枪',
            attack: 300,        // 极高伤害，穿透力强
            fireRate: 0.4,
            type: 'line',
            color: '#00bfff',
        },
        smg: {
            name: '冲锋枪',
            attack: 45,
            fireRate: 2.0,
            type: 'line',
            color: '#32cd32',
        },
    },

    // 武器升级配置
    WEAPON_UPGRADE: {
        ATTACK_BONUS_RATE: 0.05,     // 每级攻击力提升5%
        FIRE_RATE_BONUS_RATE: 0.02,  // 每级攻速提升2%
        MAX_LEVEL: 100,
    },

    // 丧尸配置（1级时的基础值）
    ZOMBIES: {
        normal: {
            name: '普通丧尸',
            hp: 20,
            defense: 0,
            speed: 1.5,
            damage: 15,
            color: '#4a7c59',
            size: 30,
            reachTime: 16,
        },
        fat: {
            name: '胖子丧尸',
            hp: 50,
            defense: 2,
            speed: 1.1,
            damage: 30,
            color: '#5c4033',
            size: 45,
            reachTime: 22,
        },
        agile: {
            name: '敏捷丧尸',
            hp: 15,
            defense: 0,
            speed: 2.2,
            damage: 15,
            color: '#8b0000',
            size: 25,
            reachTime: 10,
        },
        armored: {
            name: '装甲丧尸',
            hp: 35,
            defense: 5,
            speed: 1.24,
            damage: 20,
            color: '#2f4f4f',
            size: 35,
            reachTime: 20,
        },
        berserk: {
            name: '狂暴丧尸',
            hp: 40,
            defense: 2,
            speed: 2.0,
            damage: 30,
            color: '#8b008b',
            size: 38,
            reachTime: 11,
        },
    },

    // 丧尸等级成长配置
    ZOMBIE_UPGRADE: {
        HP_BONUS_RATE: 0.2,       // 每级生命值提升20%
        DEFENSE_BONUS: 1,         // 每级抗性提升1
        SPEED_BONUS_RATE: 0.1,    // 每级速度提升10%
        DAMAGE_BONUS_RATE: 0.1,   // 每级破坏力提升10%
    },

    // 关卡配置
    LEVEL: {
        // 关卡段配置
        // 每关丧尸总量目标：~100只（最快 40s，正常 60-90s 完成）
        STAGES: [
            { levels: [1, 3],   zombieLevel: [1, 1], waveCount: [4, 5],  zombieTypes: ['normal'], zombiesPerWave: [18, 25] },
            { levels: [4, 6],   zombieLevel: [1, 2], waveCount: [5, 6],  zombieTypes: ['normal', 'agile'], zombiesPerWave: [20, 28] },
            { levels: [7, 10],  zombieLevel: [2, 3], waveCount: [5, 6],  zombieTypes: ['normal', 'agile', 'fat', 'armored'], zombiesPerWave: [22, 30] },
            { levels: [11, 999],zombieLevel: [3, 5], waveCount: [6, 7],  zombieTypes: ['normal', 'agile', 'fat', 'armored', 'berserk'], zombiesPerWave: [25, 35] },
        ],
        WAVE_TRIGGER_THRESHOLD: 0.1,    // 上一波剩余10%时才触发下一波（波间積少量缓冲）
        FINAL_WAVE_BONUS: 1.2,
        ZOMBIE_SPAWN_INTERVAL: 200,     // 一波内丧尸逐个出现的间隔（毫秒）
    },

    // 道具配置
    ITEMS: {
        SPAWN_INTERVAL: 2000,     // 备用（新逻辑不再用此字段）
        PICKUP_DELAY: 1500,       // 道具被拾取后，等待多少毫秒再生成下一对
        INITIAL_DELAY: 3000,      // 开局多少毫秒后才开始生成道具
        FALL_SPEED: 4.0,          // 道具下落速度
        SIZE: 30,
        TYPES: {
            attack_up: {
                name: '攻击力提升',
                effect: { type: 'attack', value: [5, 15] },
                probability: 0.25,
                isPositive: true,
                color: '#ff6b6b',
                icon: '⚔️',
            },
            speed_up: {
                name: '攻速提升',
                effect: { type: 'fireRate', value: [5, 15] },  // 百分比
                probability: 0.25,
                isPositive: true,
                color: '#4ade80',
                icon: '⚡',
            },
            weapon_change: {
                name: '更换武器',
                effect: { type: 'weapon', value: null },
                probability: 0.15,
                isPositive: true,
                color: '#ffd700',
                icon: '🔫',
            },
            heal: {
                name: '生命恢复',
                effect: { type: 'heal', value: [10, 30] },
                probability: 0.20,
                isPositive: true,
                color: '#ff69b4',
                icon: '❤️',
            },
            attack_down: {
                name: '攻击力降低',
                effect: { type: 'attack', value: [-8, -3] },
                probability: 0.05,
                isPositive: false,
                color: '#8b0000',
                icon: '💀',
            },
            speed_down: {
                name: '攻速降低',
                effect: { type: 'fireRate', value: [-10, -5] },  // 百分比
                probability: 0.05,
                isPositive: false,
                color: '#4a0080',
                icon: '🐌',
            },
            clear_all: {
                name: '全屏清除',
                effect: { type: 'clear', value: null },
                probability: 0.03,
                isPositive: true,
                color: '#00ffff',
                icon: '💥',
            },
            freeze: {
                name: '时间冻结',
                effect: { type: 'freeze', value: 5000 },  // 毫秒
                probability: 0.02,
                isPositive: true,
                color: '#87ceeb',
                icon: '❄️',
            },
        },
        // 道具组合概率
        COMBO: {
            BOTH_POSITIVE: 0.7,      // 两个都是正向道具的概率
            ONE_POSITIVE: 0.3,       // 一正一负的概率
            BOTH_NEGATIVE: 0,        // 两个都是负向的概率（不会出现）
        },
    },

    // 颜色配置
    COLORS: {
        BACKGROUND: '#1a1a2e',
        PLAYER: '#3498db',
        BULLET: '#ffd700',
        TEXT: '#ffffff',
        HP_BAR: '#e74c3c',
        HP_BAR_BG: '#2c3e50',
    },
};
