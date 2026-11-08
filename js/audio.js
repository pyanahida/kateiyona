// 时间基准：使用 AudioContext 时钟，保证与音频同步。
// 目前用节拍器占位；换成真实音频只需替换 start() 里的调度。
const AudioEngine = {
    ctx: null,
    startTime: 0,     // AudioContext 时间（秒）作为 t=0
    bpm: 60,
    running: false,
    _timer: null,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    // 返回当前游戏时间（毫秒）
    now() {
        if (!this.ctx || !this.running) return 0;
        return (this.ctx.currentTime - this.startTime) * 1000;
    },

    async start(bpm) {
        this.init();
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        this.bpm = bpm || 60;
        this.startTime = this.ctx.currentTime + 0.15; // 小延迟，给准备时间
        this.running = true;
        this._scheduleMetronome();
    },

    stop() {
        this.running = false;
        if (this._timer) clearInterval(this._timer);
        this._timer = null;
    },

    // 简易节拍器占位
    _scheduleMetronome() {
        const beatMs = 60000 / this.bpm;
        let nextBeat = 0;
        const totalBeats = 999;
        const lookahead = 0.1;

        this._timer = setInterval(() => {
            if (!this.running) return;
            const elapsed = this.ctx.currentTime - this.startTime;
            while (nextBeat * (beatMs / 1000) < elapsed + lookahead && nextBeat < totalBeats) {
                this._click(nextBeat * (beatMs / 1000), nextBeat % 4 === 0);
                nextBeat++;
            }
        }, 25);
    },

    _click(atSec, accent) {
        const t = this.startTime + atSec;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.frequency.value = accent ? 1200 : 800;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(accent ? 0.25 : 0.12, t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        osc.connect(g).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
    },
};