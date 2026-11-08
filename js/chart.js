const Chart = {
    data: null,
    notes: [],   // { t: ms, key, track, lane, judged, hit, el }

    async load(url) {
        const res = await fetch(url);
        this.data = await res.json();
        this._buildNotes();
        return this.data;
    },

    // 也支持直接传入对象（便于内嵌测试）
    loadFromObject(obj) {
        this.data = obj;
        this._buildNotes();
        return this.data;
    },

    _buildNotes() {
        const d = this.data;
        const beatMs = 60000 / d.bpm;
        this.notes = d.taps.map(([beat, key]) => {
            const map = KEY_MAP[key];
            if (!map) {
                console.warn('未知键位:', key);
                return null;
            }
            return {
                t: beat * beatMs,
                key,
                track: map.track,
                lane: map.lane,
                judged: false,
                hit: false,
                el: null,
            };
        }).filter(Boolean);
        // 按时间排序
        this.notes.sort((a, b) => a.t - b.t);
    },

    reset() {
        this.notes.forEach(n => {
            n.judged = false;
            n.hit = false;
            if (n.el) n.el.remove();
            n.el = null;
        });
    },
};