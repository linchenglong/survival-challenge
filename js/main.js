/**
 * 游戏入口
 */

let game = null;

/**
 * 初始化游戏
 */
function initGame() {
    game = new Game();
    
    // 绑定UI按钮事件
    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        game.start();
    });
    
    document.getElementById('restart-btn').addEventListener('click', () => {
        game.restart();
    });
    
    document.getElementById('continue-btn').addEventListener('click', () => {
        game.startNextLevel();
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initGame);
