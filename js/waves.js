/**
 * 波次系统 - 改进版：丧尸逐个出现
 */

class WaveManager {
    constructor(level) {
        this.level = level;
        this.levelConfig = Utils.getLevelConfig(level);

        // 波次信息
        this.totalWaves = Utils.randomInt(...this.levelConfig.waveCount);
        this.currentWave = 0;

        // 当前波的丧尸队列
        this.pendingZombies = [];   // 待生成的丧尸队列
        this.lastWaveTotal = 0;     // 上一波的总数（用于计算触发阈值）
        this.spawnTimer = 0;        // 生成计时器
        this.spawnInterval = CONFIG.LEVEL.ZOMBIE_SPAWN_INTERVAL;

        // 状态
        this.allWavesSpawned = false;
        this.allZombiesCleared = false;
        this.waveStarted = false;

        // 波次提示
        this.waveAnnouncement = null;
        this.waveAnnouncementTime = 0;
    }

    /**
     * 生成一波丧尸的队列
     */
    generateWaveQueue(waveIndex) {
        const zombiesPerWave = this.levelConfig.zombiesPerWave || [8, 12];
        let count = Utils.randomInt(...zombiesPerWave);

        // 最终波数量更多
        if (waveIndex === this.totalWaves - 1) {
            count = Math.ceil(count * CONFIG.LEVEL.FINAL_WAVE_BONUS);
        }

        const zombieTypes = this.levelConfig.zombieTypes;
        const zombieLevel = Utils.randomInt(...this.levelConfig.zombieLevel);

        // 生成丧尸队列
        const queue = [];
        for (let i = 0; i < count; i++) {
            queue.push({
                type: Utils.randomChoice(zombieTypes),
                level: zombieLevel,
            });
        }
        return queue;
    }

    /**
     * 开始新一波
     */
    startNextWave() {
        if (this.currentWave >= this.totalWaves) {
            this.allWavesSpawned = true;
            return;
        }

        // 设置波次提示
        this.waveAnnouncement = `第 ${this.currentWave + 1} 波`;
        this.waveAnnouncementTime = 1500; // 显示1.5秒

        this.pendingZombies = this.generateWaveQueue(this.currentWave);
        this.lastWaveTotal = this.pendingZombies.length; // 记录本波总数
        this.spawnTimer = 0;
        this.waveStarted = true;
        this.currentWave++;
    }

    /**
     * 更新波次状态 - 返回本帧需要生成的丧尸列表
     */
    update(deltaTime, currentTime, zombieManager, canvasWidth) {
        // 更新波次提示
        if (this.waveAnnouncementTime > 0) {
            this.waveAnnouncementTime -= deltaTime;
            if (this.waveAnnouncementTime <= 0) {
                this.waveAnnouncement = null;
            }
        }

        // 检查是否需要开始新波次
        if (!this.waveStarted && !this.allWavesSpawned) {
            const aliveCount = zombieManager.getAliveCount();
            // 用上一波的总数而非已清空的队列计算阈值
            const threshold = Math.ceil(this.lastWaveTotal * CONFIG.LEVEL.WAVE_TRIGGER_THRESHOLD);

            // 第一波直接开始，或当前波存活丧尸不超过阈值时开始下一波
            if (this.currentWave === 0 || aliveCount <= threshold) {
                this.startNextWave();
            }
        }

        // 逐个生成丧尸
        if (this.pendingZombies.length > 0) {
            this.spawnTimer += deltaTime;

            // 可能需要一次生成多个（如果帧率低或间隔短）
            while (this.spawnTimer >= this.spawnInterval && this.pendingZombies.length > 0) {
                this.spawnTimer -= this.spawnInterval;

                const zombieData = this.pendingZombies.shift();
                zombieManager.create(zombieData.type, zombieData.level, canvasWidth);
            }
        }

        // 当前波丧尸已全部生成，标记可以开始下一波
        if (this.pendingZombies.length === 0 && this.waveStarted) {
            this.waveStarted = false;

            if (this.currentWave >= this.totalWaves) {
                this.allWavesSpawned = true;
            }
        }

        // 检查是否所有丧尸已清除
        if (this.allWavesSpawned && zombieManager.getAliveCount() === 0) {
            this.allZombiesCleared = true;
        }
    }

    /**
     * 检查是否通关
     */
    isLevelComplete() {
        return this.allZombiesCleared;
    }

    /**
     * 获取波次信息
     */
    getWaveInfo() {
        return {
            current: this.currentWave,
            total: this.totalWaves,
            pending: this.pendingZombies.length,
            allSpawned: this.allWavesSpawned,
        };
    }

    /**
     * 获取波次提示信息
     */
    getAnnouncement() {
        return this.waveAnnouncement ? {
            text: this.waveAnnouncement,
            remainingTime: this.waveAnnouncementTime,
        } : null;
    }
}
