const Judge = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    counts: { perfect: 0, good: 0, bad: 0, miss: 0 },

    reset() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.counts = { perfect: 0, good: 0, bad: 0, miss: 0 };
    },

    // 按键命中处理
    // 返回判定的结果字符串 或 null（未命中任何音符）
    press(trackId, lane, nowMs) {
        const notes = Chart.notes;
        const w = CONFIG.WINDOW[trackId];
        const maxWin = w.bad;

        // 找该轨道该列、未判定、|Δt| 在窗口内、离现在最近（优先未来最近）的音符
        let best = null;
        let bestAbs = Infinity;
        for (const n of notes) {
            if (n.judged || n.track !== trackId || n.lane !== lane) continue;
            const dt = nowMs - n.t; // 正=晚按，负=早按
            if (dt > maxWin) continue;       // 太早按：点了没用
            if (dt < -maxWin) continue;      // 已经错过（会由 miss 检查处理）
            const abs = Math.abs(dt);
            if (abs < bestAbs) {
                bestAbs = abs;
                best = { note: n, dt };
            }
        }
        if (!best) return null; // 点了没用

        const { note, dt } = best;
        const abs = Math.abs(dt);
        let result;
        if (abs <= w.perfect) result = 'perfect';
        else if (abs <= w.good) result = 'good';
        else result = 'bad';

        note.judged = true;
        note.hit = true;
        this._apply(result, note, nowMs);
        return result;
    },

    _apply(result, note, nowMs) {
        const table = { perfect: 100, good: 60, bad: 20 };
        this.counts[result]++;
        if (result !== 'miss') {
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            this.score += Math.round(table[result] * (1 + this.combo * 0.01));
            Render.flashHit(note);
        }
        UI.setJudge(result);
    },

    // 每帧检查漏掉的音符
    checkMiss(nowMs) {
        const notes = Chart.notes;
        for (const n of notes) {
            if (n.judged) continue;
            const w = CONFIG.WINDOW[n.track];
            const dt = nowMs - n.t;
            if (dt > w.bad) {           // 超过 bad 窗口仍未判定 => Miss
                n.judged = true;
                n.hit = false;
                this.counts.miss++;
                this.combo = 0;
                UI.setJudge('miss');
                UI.update();
            }
        }
    },
};

const UI = {
    scoreEl: null,
    comboEl: null,
    judgeEl: null,
    _judgeTimer: null,

    init() {
        this.scoreEl = document.getElementById('score');
        this.comboEl = document.getElementById('combo');
        this.judgeEl = document.getElementById('judge');
    },

    update() {
        this.scoreEl.textContent = Judge.score;
        this.comboEl.textContent = Judge.combo;
    },

    // 找到 UI 对象里的 setJudge 方法，替换为如下代码：
    setJudge(result) {
        const map = { perfect: 'Perfect', good: 'Good', bad: 'Bad', miss: 'Miss' };
        this.judgeEl.textContent = map[result];
        // 极简黑白：Perfect 为纯白，Miss 为暗灰，Good/Bad 为浅灰
        this.judgeEl.style.color = result === 'miss' ? '#666' : (result === 'perfect' ? '#fff' : '#ccc');
        this.judgeEl.style.opacity = 1;
        clearTimeout(this._judgeTimer);
        this._judgeTimer = setTimeout(() => {
            this.judgeEl.style.opacity = 0;
        }, 300);
        this.update();
    },
};