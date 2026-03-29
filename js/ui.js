/**
 * UI系统 - 使用Canvas绘制（全面美化版）
 */

const UI = {

    /**
     * 绘制 HUD
     */
    drawHUD(ctx, player, level, waveInfo, kills, canvasWidth) {
        const pad = 12;

        // ── 顶部信息栏背景 ──
        const barH = 52;
        const bgGrad = ctx.createLinearGradient(0, 0, 0, barH);
        bgGrad.addColorStop(0, 'rgba(5, 5, 20, 0.92)');
        bgGrad.addColorStop(1, 'rgba(5, 5, 20, 0)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvasWidth, barH);

        // ── 关卡徽章 ──
        this._drawLevelBadge(ctx, pad, 8, level);

        // ── 波次指示 ──
        this._drawWaveIndicator(ctx, canvasWidth / 2, 16, waveInfo);

        // ── 击杀数 ──
        ctx.textAlign = 'right';
        ctx.font = 'bold 11px "Orbitron", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('KILLS', canvasWidth - pad, 16);
        ctx.font = 'bold 16px "Orbitron", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(kills, canvasWidth - pad, 32);
        ctx.textAlign = 'left';

        // ── 生命值条 ──
        this._drawHealthBar(ctx, pad, 56, canvasWidth - pad * 2, player.hp, player.maxHp);

        // ── 武器信息 ──
        this._drawWeaponInfo(ctx, pad, 78, canvasWidth - pad * 2, player.weapon);
    },

    /**
     * 关卡徽章
     */
    _drawLevelBadge(ctx, x, y, level) {
        const w = 52, h = 32;

        // 背景
        ctx.fillStyle = 'rgba(233, 69, 96, 0.15)';
        ctx.strokeStyle = 'rgba(233, 69, 96, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6);
        else ctx.rect(x, y, w, h);
        ctx.fill();
        ctx.stroke();

        // 文字
        ctx.textAlign = 'center';
        ctx.font = '9px "Orbitron", monospace';
        ctx.fillStyle = 'rgba(233, 69, 96, 0.8)';
        ctx.fillText('LEVEL', x + w / 2, y + 12);

        ctx.font = 'bold 16px "Orbitron", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(level, x + w / 2, y + 26);

        ctx.textAlign = 'left';
    },

    /**
     * 波次指示器（中央圆点）
     */
    _drawWaveIndicator(ctx, cx, y, waveInfo) {
        const dotR = 4;
        const dotSpacing = 14;
        const total = Math.min(waveInfo.total, 8);
        const startX = cx - (total - 1) * dotSpacing / 2;

        for (let i = 0; i < total; i++) {
            const dx = startX + i * dotSpacing;
            const dy = y + 8;
            const isCurrent = i === waveInfo.current - 1;
            const isDone    = i < waveInfo.current - 1;

            if (isCurrent) {
                // 当前波：亮白色发光
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(dx, dy, dotR + 1, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (isDone) {
                // 已完成：绿色
                ctx.fillStyle = '#4ade80';
                ctx.beginPath();
                ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 未来波：暗灰
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        // WAVE 标签
        ctx.textAlign = 'center';
        ctx.font = '9px "Orbitron", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(`WAVE ${waveInfo.current}/${waveInfo.total}`, cx, y + 24);
        ctx.textAlign = 'left';
    },

    /**
     * 生命值条（美化版）
     */
    _drawHealthBar(ctx, x, y, width, current, max) {
        const height = 10;
        const ratio  = Math.max(0, current / max);

        // 外框阴影
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur  = 4;

        // 背景槽
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, width, height, height / 2);
        else ctx.rect(x, y, width, height);
        ctx.fill();

        ctx.shadowBlur = 0;

        // 血量填充色（渐变）
        const hpColor1 = ratio > 0.6 ? '#22c55e'
                       : ratio > 0.3 ? '#f59e0b'
                       : '#ef4444';
        const hpColor2 = ratio > 0.6 ? '#16a34a'
                       : ratio > 0.3 ? '#d97706'
                       : '#b91c1c';
        const barGrad  = ctx.createLinearGradient(x, y, x, y + height);
        barGrad.addColorStop(0, hpColor1);
        barGrad.addColorStop(1, hpColor2);

        ctx.fillStyle = barGrad;
        const barW = width * ratio;
        if (barW > 0) {
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, barW, height, height / 2);
            else ctx.rect(x, y, barW, height);
            ctx.fill();
        }

        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        const hlW = barW * 0.7;
        if (hlW > 0) {
            ctx.fillRect(x + 2, y + 1, hlW - 2, 2);
        }

        // 外框描边
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, width, height, height / 2);
        else ctx.rect(x, y, width, height);
        ctx.stroke();

        // 左侧图标
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = hpColor1;
        ctx.fillText('❤', x, y + height / 2);

        // 数值文字
        ctx.font = 'bold 9px "Orbitron", monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${current} / ${max}`, x + width / 2, y + height / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    },

    /**
     * 武器信息栏
     */
    _drawWeaponInfo(ctx, x, y, width, weapon) {
        const info   = weapon.getInfo();
        const barH   = 26;
        const color  = info.color || '#ffd700';

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, width, barH, 6);
        else ctx.rect(x, y, width, barH);
        ctx.fill();

        // 左侧色条（武器颜色）
        ctx.fillStyle = color;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, 3, barH, [3, 0, 0, 3]);
        else ctx.rect(x, y, 3, barH);
        ctx.fill();

        // 武器图标
        const iconMap = {
            desert_eagle: '🔫',
            machine_gun:  '⚙️',
            shotgun:      '💥',
            sniper:       '🎯',
            smg:          '⚡',
        };
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(iconMap[weapon.type] || '🔫', x + 8, y + barH / 2);

        // 武器名 + 等级
        ctx.font = 'bold 11px "Orbitron", monospace';
        ctx.fillStyle = color;
        ctx.fillText(`${info.name}`, x + 28, y + 10);
        ctx.font = '9px "Orbitron", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillText(`LV.${info.level}`, x + 28, y + 21);

        // 右侧属性
        const midX = x + width * 0.58;
        ctx.font = '9px "Orbitron", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText('ATK', midX, y + 10);
        ctx.fillText('RPS', midX + 42, y + 10);

        ctx.font = 'bold 11px "Orbitron", monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(info.attack, midX, y + 21);
        ctx.fillText(info.fireRate, midX + 42, y + 21);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    },

    /**
     * 绘制伤害数字（击中丧尸时显示）
     */
    drawDamageNumbers(ctx, damageNumbers) {
        damageNumbers.forEach(num => {
            const alpha = Math.min(1, num.life / 300);
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${num.size}px "Orbitron", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 描边
            ctx.strokeStyle = 'rgba(0,0,0,0.7)';
            ctx.lineWidth = 3;
            ctx.strokeText(`${num.damage}`, num.x, num.y);

            // 填充
            ctx.fillStyle = num.color;
            ctx.fillText(`${num.damage}`, num.x, num.y);
        });
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    },

    /**
     * 绘制道具拾取提示
     */
    drawItemPickupNotice(ctx, notice, canvasWidth, canvasHeight) {
        if (!notice) return;

        const cx = canvasWidth / 2;
        const cy = canvasHeight * 0.72;
        const alpha = Math.min(1, notice.life / 400);

        ctx.save();
        ctx.globalAlpha = alpha;

        // 背景胶囊
        const textW = 160;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.strokeStyle = notice.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx - textW / 2, cy - 16, textW, 32, 16);
        else ctx.rect(cx - textW / 2, cy - 16, textW, 32);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 14px "Rajdhani", sans-serif';
        ctx.fillStyle = notice.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(notice.text, cx, cy);

        ctx.restore();
    },

    /**
     * 绘制波次提示（居中大字，带光效）
     */
    drawWaveAnnouncement(ctx, announcement, canvasWidth, canvasHeight) {
        if (!announcement) return;

        const { text, remainingTime } = announcement;
        const alpha = Math.min(1, remainingTime / 400);
        const scale = 0.8 + 0.2 * Math.min(1, (1500 - remainingTime + 200) / 200);

        const cx = canvasWidth / 2;
        const cy = canvasHeight * 0.35;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        // 光晕背景
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
        grd.addColorStop(0, 'rgba(255, 215, 0, 0.12)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(cx - 120, cy - 60, 240, 120);

        // 顶部装饰线
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - 80, cy - 28);
        ctx.lineTo(cx + 80, cy - 28);
        ctx.stroke();
        ctx.setLineDash([]);

        // 主文字
        ctx.font = 'bold 38px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 5;
        ctx.strokeText(text, cx, cy);
        ctx.fillStyle = '#ffd700';
        ctx.fillText(text, cx, cy);

        // 高光层
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = 'bold 38px "Orbitron", monospace';
        ctx.fillText(text, cx, cy - 1.5);

        // 底部装饰线
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - 80, cy + 28);
        ctx.lineTo(cx + 80, cy + 28);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    },

    /**
     * 绘制底部安全区装饰（玩家区域地面）
     */
    drawGroundLine(ctx, canvasWidth, playerY) {
        const lineY = playerY + 60;

        // 渐变线条
        const grad = ctx.createLinearGradient(0, lineY, canvasWidth, lineY);
        grad.addColorStop(0, 'rgba(233, 69, 96, 0)');
        grad.addColorStop(0.2, 'rgba(233, 69, 96, 0.4)');
        grad.addColorStop(0.5, 'rgba(233, 69, 96, 0.7)');
        grad.addColorStop(0.8, 'rgba(233, 69, 96, 0.4)');
        grad.addColorStop(1, 'rgba(233, 69, 96, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(canvasWidth, lineY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 底部渐变填充（安全区暗色）
        const shadowGrad = ctx.createLinearGradient(0, lineY, 0, lineY + 40);
        shadowGrad.addColorStop(0, 'rgba(233, 69, 96, 0.06)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, lineY, canvasWidth, 40);
    },
};
