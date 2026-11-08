const NoteLogic = {
    // 计算某音符当前应处于的坐标
    // 返回 { x, y, w, h, alpha }
    position(note, nowMs) {
        const track = CONFIG.TRACKS[note.track];
        const lane = note.lane;
        const size = CONFIG.NOTE_SIZE;
        const half = size / 2;

        // 沿判定线方向的静态坐标（轨道内列的位置）
        const offset = CONFIG.START_OFFSET[note.track] + lane * CONFIG.LANE_W;

        // 进度：从 origin 到 line，note.t 时到达 line
        // approachMs 决定提前多少毫秒出现在边缘
        const approach = CONFIG.APPROACH_MS;
        const startT = note.t - approach;

        let p = (nowMs - startT) / approach; // 0 -> 1
        if (p < 0) p = 0;
        // 允许超过 1 继续前进（已越过判定线）

        if (track.axis === 'x') {
            // 判定线是竖直的，沿 x 移动
            const from = track.origin;
            const to = track.line;
            const x = from + (to - from) * p;
            return {
                x: x,
                y: offset + half,
                w: size,
                h: size,
                alpha: p > 1.15 ? Math.max(0, 1 - (p - 1.15) * 4) : 1,
            };
        } else {
            // 判定线是水平的，沿 y 移动
            const from = track.origin;
            const to = track.line;
            const y = from + (to - from) * p;
            return {
                x: offset + half,
                y: y,
                w: size,
                h: size,
                alpha: p > 1.15 ? Math.max(0, 1 - (p - 1.15) * 4) : 1,
            };
        }
    },

    // 音符当前沿运动轴的坐标（用于计算偏差）
    axisPos(note, nowMs) {
        const track = CONFIG.TRACKS[note.track];
        const approach = CONFIG.APPROACH_MS;
        const startT = note.t - approach;
        let p = (nowMs - startT) / approach;
        if (p < 0) p = 0;
        return track.origin + (track.line - track.origin) * p;
    },
};