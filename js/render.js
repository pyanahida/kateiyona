const Render = {
    svg: null,
    noteLayer: null,

    init(svgEl) {
        this.svg = svgEl;
        this.svg.innerHTML = '';
        this._drawBackground();
        this._drawJudgeLines();
        this._drawKeyHints();
        this.noteLayer = this._svgEl('g', { id: 'notes' });
        this.svg.appendChild(this.noteLayer);
        this._drawHitMarkers();
    },

    _svgEl(tag, attrs = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    },

    _drawBackground() {
        const g = this._svgEl('g', { id: 'bg' });

        // 不再画底色矩形，只画列分割线（深灰色虚线）
        for (let i = 1; i < 3; i++) {
            const y = i * 100;
            g.appendChild(this._svgEl('line', { x1: 0, y1: y, x2: 100, y2: y, class: 'lane-line' }));
            g.appendChild(this._svgEl('line', { x1: 700, y1: y, x2: 800, y2: y, class: 'lane-line' }));
        }
        for (let i = 1; i < 6; i++) {
            const x = 100 + i * 100;
            g.appendChild(this._svgEl('line', { x1: x, y1: 500, x2: x, y2: 600, class: 'lane-line' }));
        }
        this.svg.appendChild(g);
    },

    _drawJudgeLines() {
        const g = this._svgEl('g', { id: 'judge-lines' });
        
        // 判定线改为纯白，1px
        g.appendChild(this._svgEl('line', {
            id: 'l', x1: 50, y1: 0, x2: 50, y2: 300, 
            stroke: '#fff', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke'
        }));
        g.appendChild(this._svgEl('line', {
            id: 'r', x1: 750, y1: 0, x2: 750, y2: 300, 
            stroke: '#fff', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke'
        }));
        g.appendChild(this._svgEl('line', {
            id: 'd', x1: 100, y1: 550, x2: 700, y2: 550, 
            stroke: '#fff', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke'
        }));
        this.svg.appendChild(g);
    },

    _drawKeyHints() {
        const g = this._svgEl('g', { id: 'hints' });
        const addText = (x, y, text) => {
            const t = this._svgEl('text', {
                x, y, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
                fill: '#fff', 'font-size': 14, 'font-family': 'system-ui',
                'font-weight': '400', // 极简风格用细体或常规体
            });
            t.textContent = text.toUpperCase();
            g.appendChild(t);
        };

        ['q', 'w', 'e'].forEach((k, i) => addText(50, 50 + i * 100, k));
        ['p', 'o', 'i'].forEach((k, i) => addText(750, 50 + i * 100, k));
        ['d', 'f', 'g', 'h', 'j', 'k'].forEach((k, i) => addText(150 + i * 100, 550, k));

        this.svg.appendChild(g);
    },

    _drawHitMarkers() {
        const g = this._svgEl('g', { id: 'hit-markers' });
        this.svg.appendChild(g);
        this._hitLayer = g;
    },

    updateNotes(notes, nowMs) {
        for (const n of notes) {
            if (n.judged) {
                if (n.el) { n.el.remove(); n.el = null; }
                continue;
            }
            const pos = NoteLogic.position(n, nowMs);
            if (!n.el) {
                n.el = this._svgEl('rect', {
                    class: 'note',
                    rx: 12,
                });
                this.noteLayer.appendChild(n.el);
            }
            n.el.setAttribute('x', pos.x - pos.w / 2);
            n.el.setAttribute('y', pos.y - pos.h / 2);
            n.el.setAttribute('width', pos.w);
            n.el.setAttribute('height', pos.h);
            n.el.setAttribute('opacity', pos.alpha);
        }
    },

    clearNotes(notes) {
        notes.forEach(n => { if (n.el) { n.el.remove(); n.el = null; } });
    },

    flashHit(note) {
        const track = CONFIG.TRACKS[note.track];
        let cx, cy;
        if (track.axis === 'x') {
            cx = track.line;
            cy = CONFIG.START_OFFSET[note.track] + note.lane * CONFIG.LANE_W + CONFIG.LANE_W / 2;
        } else {
            cx = CONFIG.START_OFFSET[note.track] + note.lane * CONFIG.LANE_W + CONFIG.LANE_W / 2;
            cy = 550;
        }
        const circle = this._svgEl('circle', {
            cx, cy, r: 10,
            fill: 'none', stroke: '#fff', 'stroke-width': 1,
            opacity: 0.9, 'vector-effect': 'non-scaling-stroke'
        });
        this._hitLayer.appendChild(circle);
        const start = performance.now();
        const anim = () => {
            const p = (performance.now() - start) / 220;
            if (p >= 1) { circle.remove(); return; }
            circle.setAttribute('r', 10 + p * 40);
            circle.setAttribute('opacity', 0.9 * (1 - p));
            requestAnimationFrame(anim);
        };
        anim();
    },
};