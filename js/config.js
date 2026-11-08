const CONFIG = {
    W: 800,
    H: 600,
    LANE_W: 100,

    // 判定窗口 [ms]
    WINDOW: {
        d: { perfect: 60, good: 90, bad: 110 },
        l: { perfect: 40, good: 75, bad: 90 },
        r: { perfect: 40, good: 75, bad: 90 },
    },

    // 三条轨道定义
    // l: 左上，判定线 x=50，y 0..300，列从上到下 q/w/e，从右往左落
    // r: 右上，判定线 x=750，y 0..300，列从上到下 p/o/i，从左往右落
    // d: 底部，判定线 y=600，x 100..700，列从左到右 d/f/g/h/j/k，从上往下落
    TRACKS: {
        l: {
            id: 'l',
            axis: 'x',        // 沿 x 轴移动
            line: 50,         // 判定线位置
            dir: -1,          // 从右往左
            lanes: ['q', 'w', 'e'],
            origin: 800,      // 出生位置（画布右侧外）
        },
        r: {
            id: 'r',
            axis: 'x',
            line: 750,
            dir: 1,           // 从左往右
            lanes: ['p', 'o', 'i'],
            origin: 0,        // 出生位置（画布左侧外）
        },
        d: {
            id: 'd',
            axis: 'y',
            line: 600,
            dir: -1,          // 从上往下
            lanes: ['d', 'f', 'g', 'h', 'j', 'k'],
            origin: 0,
        },
    },

    // 每条轨道沿判定线方向的居中排列起点
    // d: 6*100=600 宽，居中 -> x=100
    // l/r: 3*100=300 高，顶部对齐 -> y=0
    START_OFFSET: {
        d: 100,
        l: 0,
        r: 0,
    },

    // 视觉：音符大小、速度
    NOTE_SIZE: 80,
    APPROACH_MS: 1600,   // 音符从出生到判定线所需时间
};

// key -> {track, laneIndex}
const KEY_MAP = {};
(function buildKeyMap() {
    for (const id in CONFIG.TRACKS) {
        const t = CONFIG.TRACKS[id];
        t.lanes.forEach((key, i) => {
            KEY_MAP[key] = { track: id, lane: i };
        });
    }
})();