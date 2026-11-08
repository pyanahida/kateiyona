const Game = {
    running: false,
    rafId: null,
    chartUrl: 'charts/little_star.json',

    async start() {
        // 重置
        Judge.reset();
        UI.update();
        Render.clearNotes(Chart.notes);
        Chart.reset();
        if (!Chart.data) {
            await Chart.load(this.chartUrl);
        }

        // 重新按当前数据生成 notes
        Chart._buildNotes();

        document.getElementById('startBtn').style.display = 'none';
        this.running = true;

        await AudioEngine.start(Chart.data.bpm);
        // AudioEngine.start 里设置了 0.15s 的延迟，对齐 t=0
        this._loop();
    },

    _loop() {
        if (!this.running) return;
        const now = AudioEngine.now();

        Render.updateNotes(Chart.notes, now);
        Judge.checkMiss(now);
        UI.update();

        // 全部结束
        if (Chart.notes.length && Chart.notes.every(n => n.judged) &&
                now > Chart.notes[Chart.notes.length - 1].t + 2000) {
            this._finish();
            return;
        }

        this.rafId = requestAnimationFrame(() => this._loop());
    },

    _finish() {
        this.running = false;
        AudioEngine.stop();
        const btn = document.getElementById('startBtn');
        btn.textContent = '再来一次';
        btn.style.display = 'block';
        UI.setJudge('perfect'); // 临时提示，可自行扩展结算
    },

    // 输入处理
    onKeyDown(e) {
        if (!this.running) return;
        const key = e.key.toLowerCase();
        const map = KEY_MAP[key];
        if (!map) return;
        e.preventDefault();
        const now = AudioEngine.now();
        Judge.press(map.track, map.lane, now);
        UI.update();
    },

    // 触屏处理：根据点击坐标判断落在哪条轨道
    onPointer(e) {
        if (!this.running) return;
        const svg = Render.svg;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    
        let trackId = null;
        // 顶部左轨：x<100，y 0..300
        if (loc.x < 100 && loc.y >= 0 && loc.y <= 300) {
            trackId = 'l';
        } else if (loc.x > 700 && loc.y >= 0 && loc.y <= 300) {
            trackId = 'r';
        } else if (loc.y > 500 && loc.x >= 100 && loc.x <= 700) {
            trackId = 'd';
        }
        if (!trackId) return;
    
        const t = CONFIG.TRACKS[trackId];
        let lane;
        if (t.axis === 'x') {
            lane = Math.floor((loc.y - CONFIG.START_OFFSET[trackId]) / CONFIG.LANE_W);
        } else {
            lane = Math.floor((loc.x - CONFIG.START_OFFSET[trackId]) / CONFIG.LANE_W);
        }
        lane = Math.max(0, Math.min(t.lanes.length - 1, lane));
    
        const now = AudioEngine.now();
        Judge.press(trackId, lane, now);
        UI.update();
    },
};

window.addEventListener('DOMContentLoaded', async () => {
    UI.init();
    Render.init(document.getElementById('stage'));

    // 预加载谱面（不启动游戏）
    try {
        await Chart.load(Game.chartUrl);
    } catch (err) {
        console.warn('谱面加载失败，尝试内嵌示例', err);
    }

    document.getElementById('startBtn').addEventListener('click', () => Game.start());

    window.addEventListener('keydown', e => Game.onKeyDown(e));

    const svg = document.getElementById('stage');
    svg.addEventListener('pointerdown', e => {
        e.preventDefault();
        Game.onPointer(e);
    });
});