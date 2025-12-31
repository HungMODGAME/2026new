// Dots Animation System for New Year
// Adapted from test.js

var S = {};

// Settings for dots color
window.settings = window.settings || { sequenceColor: '#ffd700' }; // Gold color

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 215, b: 0 }; // Default gold
}

S.Drawing = (function () {
    var canvas,
        context,
        renderFn,
        requestFrame = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };

    return {
        init: function (el) {
            canvas = document.querySelector(el);
            if (!canvas) {
                console.warn('Canvas element not found:', el);
                return;
            }
            context = canvas.getContext('2d');
            if (!context) {
                console.warn('Could not get 2d context from canvas');
                return;
            }
            this.adjustCanvas();
            window.addEventListener('resize', function () {
                S.Drawing.adjustCanvas();
            });
        },

        loop: function (fn) {
            if (!canvas || !context) {
                return;
            }
            renderFn = !renderFn ? fn : renderFn;
            this.clearFrame();
            renderFn();
            requestFrame.call(window, this.loop.bind(this));
        },

        adjustCanvas: function () {
            if (!canvas) {
                return;
            }
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        },

        clearFrame: function () {
            if (!canvas || !context) {
                return;
            }
            context.clearRect(0, 0, canvas.width, canvas.height);
        },

        getArea: function () {
            if (!canvas) {
                console.warn('Canvas not initialized, returning default area');
                return { w: window.innerWidth || 800, h: window.innerHeight || 600 };
            }
            return { w: canvas.width, h: canvas.height };
        },
        drawCircle: function (p, c) {
            c.a = p.a;
            context.fillStyle = c.render();
            
            context.beginPath();
            context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);
            context.closePath();
            context.fill();
        }
    };
}());

S.UI = (function () {
    var canvas = document.querySelector('.dots-canvas'),
        interval,
        currentAction,
        maxShapeSize = 30,
        sequence = [],
        cmd = '#';

    function getAction(value) {
        value = value && value.split(' ')[0];
        return value && value[0] === cmd && value.substring(1);
    }

    function timedAction(fn, delay, max, reverse) {
        clearInterval(interval);
        currentAction = reverse ? max : 1;
        fn(currentAction);

        if (!max || (!reverse && currentAction < max) || (reverse && currentAction > 0)) {
            interval = setInterval(function () {
                currentAction = reverse ? currentAction - 1 : currentAction + 1;
                fn(currentAction);
                if ((!reverse && max && currentAction === max) || (reverse && currentAction === 0)) {
                    clearInterval(interval);
                }
            }, delay);
        }
    }

    function performAction(value) {
        var action,
            current;

        sequence = typeof (value) === 'object' ? value : sequence.concat(value.split('|'));

        function getDynamicDelay(str) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            // Speed up countdown to better sync with audio
            const base = isMobile ? 850 : 950;
            if (!str || typeof str !== 'string') return base;
            if (str.trim().startsWith('#')) return base;
            const extra = Math.max(0, (str.length - 5) * 60);
            let delay = base + extra;
            // Add extra 500ms for "Happy New Year" to display longer
            if (str.trim() === 'Happy New Year') {
                delay += 500;
            }
            return delay;
        }

        const totalItems = sequence.length;
        let currentIndex = 0;

        timedAction(function (index) {
            current = sequence.shift();
            action = getAction(current);
            currentIndex++;

            const actionDelay = getDynamicDelay(current);

            const displayText = current === 'Happy New Year' ? 'Happy\nNew Year' : current;

            switch (action) {
                default:
                    S.Shape.switchShape(
                        S.ShapeBuilder.letter(displayText[0] === cmd ? 'What?' : displayText),
                        false,
                        displayText
                    );
            }

            // Start fireworks when "Happy New Year" appears
            if (current && (current.trim() === 'Happy' || current.trim() === 'Happy New Year')) {
                // Start fireworks immediately when Happy New Year appears
                if (typeof togglePause === 'function') {
                    togglePause(false);
                }
                
                if (typeof startNewYear === 'function') {
                    startNewYear();
                }
            }

            // When last item, fade out
            if (currentIndex >= totalItems) {
                setTimeout(() => {
                    setTimeout(() => {
                        if (S.Shape && S.Shape.fadeOut) {
                            S.Shape.fadeOut();
                        }
                        
                        setTimeout(() => {
                            const canvas = document.querySelector('.dots-canvas');
                            if (canvas) {
                                const ctx = canvas.getContext('2d');
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                            }
                            
                            if (S.Shape && S.Shape.clear) {
                                S.Shape.clear();
                            }
                            
                            // Hide dots canvas
                            if (canvas) {
                                canvas.style.display = 'none';
                            }
                            
                            // Start fireworks - unpause and trigger new year
                            if (typeof togglePause === 'function') {
                                togglePause(false);
                            }
                            
                            // Trigger new year celebration
                            if (typeof startNewYear === 'function') {
                                startNewYear();
                            }
                        }, 500);
                    }, 500);
                }, actionDelay);
            }
        }, getDynamicDelay(sequence[0]), sequence.length);
    }

    return {
        simulate: function (action) {
            performAction(action);
        }
    };
}());

S.Point = function (args) {
    this.x = args.x;
    this.y = args.y;
    this.z = args.z;
    this.a = args.a;
    this.h = args.h;
};

S.Color = function (r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
};

S.Color.prototype = {
    render: function () {
        return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';
    }
};

S.Dot = function (x, y) {
    this.p = new S.Point({
        x: x,
        y: y,
        z: this.getDotSize(),
        a: 1,
        h: 0
    });
    this.e = 0.07;
    this.s = true;
    const currentSettings = window.settings || { sequenceColor: '#ffd700' };
    const rgb = hexToRgb(currentSettings.sequenceColor);
    this.c = new S.Color(rgb.r, rgb.g, rgb.b, this.p.a);
    this.t = this.clone();
    this.q = [];
};

S.Dot.prototype = {
    getDotSize: function () {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            return 2;
        } else {
            return 4;
        }
    },

    clone: function () {
        return new S.Point({
            x: this.x,
            y: this.y,
            z: this.z,
            a: this.a,
            h: this.h
        });
    },

    _draw: function () {
        const currentSettings = window.settings || { sequenceColor: '#ffd700' };
        const rgb = hexToRgb(currentSettings.sequenceColor);
        this.c.r = rgb.r;
        this.c.g = rgb.g;
        this.c.b = rgb.b;
        this.c.a = this.p.a;
        S.Drawing.drawCircle(this.p, this.c);
    },

    _moveTowards: function (n) {
        var details = this.distanceTo(n, true),
            dx = details[0],
            dy = details[1],
            d = details[2],
            e = this.e * d;

        if (this.p.h === -1) {
            this.p.x = n.x;
            this.p.y = n.y;
            return true;
        }

        if (d > 1) {
            this.p.x -= ((dx / d) * e);
            this.p.y -= ((dy / d) * e);
        } else {
            if (this.p.h > 0) {
                this.p.h--;
            } else {
                return true;
            }
        }

        return false;
    },

    _update: function () {
        if (this._moveTowards(this.t)) {
            var p = this.q.shift();
            if (p) {
                this.t.x = p.x || this.p.x;
                this.t.y = p.y || this.p.y;
                this.t.z = p.z || this.p.z;
                this.t.a = p.a || this.p.a;
                this.p.h = p.h || 0;
            } else {
                if (!this.s) {
                    this.move(new S.Point({
                        x: this.p.x + (Math.random() * 50) - 25,
                        y: this.p.y + (Math.random() * 50) - 25,
                    }));
                }
            }
        }
        var d = this.p.a - this.t.a;
        const fadeSpeed = this.t.a === 0 ? 0.06 : 0.05;
        this.p.a = Math.max(0, this.p.a - (d * fadeSpeed));
        d = this.p.z - this.t.z;
        const sizeFadeSpeed = this.t.z === 0 ? 0.06 : 0.05;
        this.p.z = Math.max(0, this.p.z - (d * sizeFadeSpeed));
    },

    distanceTo: function (n, details) {
        var dx = this.p.x - n.x,
            dy = this.p.y - n.y,
            d = Math.sqrt(dx * dx + dy * dy);
        return details ? [dx, dy, d] : d;
    },

    move: function (p, avoidStatic) {
        if (!avoidStatic || (avoidStatic && this.distanceTo(p) > 1)) {
            this.q.push(p);
        }
    },

    render: function () {
        this._update();
        this._draw();
    }
};

S.ShapeBuilder = (function () {
    var shapeCanvas = document.createElement('canvas'),
        shapeContext = shapeCanvas.getContext('2d', { willReadFrequently: true }),
        fontSize = 500,
        fontFamily = 'Avenir, Helvetica Neue, Helvetica, Arial, sans-serif';

    function getGap() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            return 4;
        } else {
            return 8;
        }
    }

    function fit() {
        const gap = getGap();
        shapeCanvas.width = Math.floor(window.innerWidth / gap) * gap;
        shapeCanvas.height = Math.floor(window.innerHeight / gap) * gap;
        shapeContext.fillStyle = 'red';
        shapeContext.textBaseline = 'middle';
        shapeContext.textAlign = 'center';
    }

    function processCanvas() {
        const gap = getGap();
        var pixels = shapeContext.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height).data,
            dots = [],
            x = 0,
            y = 0,
            fx = shapeCanvas.width,
            fy = shapeCanvas.height,
            w = 0,
            h = 0;

        for (var p = 0; p < pixels.length; p += (4 * gap)) {
            if (pixels[p + 3] > 0) {
                dots.push(new S.Point({
                    x: x,
                    y: y
                }));

                w = x > w ? x : w;
                h = y > h ? y : h;
                fx = x < fx ? x : fx;
                fy = y < fy ? y : fy;
            }
            x += gap;
            if (x >= shapeCanvas.width) {
                x = 0;
                y += gap;
                p += gap * 4 * shapeCanvas.width;
            }
        }
        return { dots: dots, w: w + fx, h: h + fy };
    }

    function setFontSize(s) {
        shapeContext.font = 'bold ' + s + 'px ' + fontFamily;
    }

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function init() {
        fit();
        window.addEventListener('resize', fit);
    }

    init();

    return {
        letter: function (l) {
            var s = 0;

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isSmallScreen = window.innerWidth < 768;
            const baseFontSize = (isMobile || isSmallScreen) ? 200 : 400;

            // Support multi-line text via '\n'
            const lines = String(l).split('\n');
            setFontSize(baseFontSize);
            const longestWidth = Math.max(...lines.map(line => shapeContext.measureText(line).width));

            // Height constraint considers number of lines
            const heightFactor = lines.length || 1;

            s = Math.min(
                baseFontSize,
                (shapeCanvas.width / longestWidth) * 0.8 * baseFontSize,
                (shapeCanvas.height / (baseFontSize * heightFactor)) * 0.35 * baseFontSize
            );

            setFontSize(s);
            shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);

            const lineHeight = s * 0.9;
            const startY = shapeCanvas.height / 2 - (lineHeight * (lines.length - 1)) / 2;
            lines.forEach((line, idx) => {
                shapeContext.fillText(line, shapeCanvas.width / 2, startY + idx * lineHeight);
            });

            return processCanvas();
        }
    };
}());

S.Shape = (function () {
    var dots = [],
        width = 0,
        height = 0,
        cx = 0,
        cy = 0,
        currentText = ''; // Track current text for positioning

    function compensate() {
        var a = S.Drawing.getArea();
        cx = a.w / 2 - width / 2;
        // Offset "New Year" down if "Happy" was shown before
        if (currentText === 'New Year') {
            cy = a.h / 2 - height / 2 + (a.h * 0.15); // Move down by 15% of screen height
        } else if (currentText === 'Happy') {
            cy = a.h / 2 - height / 2 - (a.h * 0.1); // Move "Happy" up slightly
        } else {
            cy = a.h / 2 - height / 2;
        }
    }

    function getDotCreationParams() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth < 768;

        if (isMobile || isSmallScreen) {
            return {
                minSize: 1,
                maxSize: 4,
                minZ: 2,
                maxZ: 3
            };
        } else {
            return {
                minSize: 3,
                maxSize: 12,
                minZ: 4,
                maxZ: 8
            };
        }
    }

    return {
        switchShape: function (n, fast, text) {
            var size,
                a = S.Drawing.getArea();
            // Store current text for positioning
            if (text) {
                currentText = text;
            }
            width = n.w;
            height = n.h;
            compensate();

            const params = getDotCreationParams();

            if (n.dots.length > dots.length) {
                size = n.dots.length - dots.length;
                for (var d = 1; d <= size; d++) {
                    dots.push(new S.Dot(a.w / 2, a.h / 2));
                }
            }

            var d = 0,
                i = 0;
            while (n.dots.length > 0) {
                i = Math.floor(Math.random() * n.dots.length);
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                dots[d].e = isMobile ? 0.35 : 0.11;

                if (dots[d].s) {
                    dots[d].move(new S.Point({
                        z: Math.random() * (params.maxSize - params.minSize) + params.minSize,
                        a: Math.random(),
                        h: 18
                    }));
                } else {
                    dots[d].move(new S.Point({
                        z: Math.random() * (params.minZ) + params.minZ,
                        h: fast ? 18 : 30
                    }));
                }

                dots[d].s = true;
                dots[d].move(new S.Point({
                    x: n.dots[i].x + cx,
                    y: n.dots[i].y + cy,
                    a: 1,
                    z: params.minZ,
                    h: 0
                }));

                n.dots = n.dots.slice(0, i).concat(n.dots.slice(i + 1));
                d++;
            }

            for (var i = d; i < dots.length; i++) {
                if (dots[i].s) {
                    dots[i].move(new S.Point({
                        z: Math.random() * (params.maxSize - params.minSize) + params.minSize,
                        a: Math.random() * 0.25 + 0.75,
                        h: 20
                    }));
                    dots[i].s = false;
                    dots[i].e = 0.04;
                    dots[i].move(new S.Point({
                        x: Math.random() * a.w,
                        y: Math.random() * a.h,
                        a: 1,
                        z: Math.random() * params.minZ,
                        h: 0
                    }));
                }
            }
        },

        render: function () {
            for (var d = 0; d < dots.length; d++) {
                dots[d].render();
            }
        },

        clear: function () {
            dots.length = 0;
            width = 0;
            height = 0;
            cx = 0;
            cy = 0;
        },

        fadeOut: function () {
            const a = S.Drawing.getArea();
            for (var i = 0; i < dots.length; i++) {
                if (dots[i]) {
                    const centerX = a.w / 2;
                    const centerY = a.h / 2;
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.max(a.w, a.h) * (0.5 + Math.random() * 0.5);
                    const targetX = centerX + Math.cos(angle) * distance;
                    const targetY = centerY + Math.sin(angle) * distance;
                    
                    dots[i].move(new S.Point({
                        x: targetX,
                        y: targetY,
                        a: 0,
                        z: 0,
                        h: 0
                    }));
                    dots[i].e = 0.1;
                }
            }
        }
    };
}());

// Flag to prevent multiple initializations
var dotsAnimationInitialized = false;
var dotsSequenceStarted = false;

// Initialize dots animation
function initDotsAnimation() {
    // Only initialize once
    if (dotsAnimationInitialized) {
        return;
    }
    dotsAnimationInitialized = true;
    S.Drawing.init('.dots-canvas');
    S.Drawing.loop(function () {
        S.Shape.render();
    });
}

// Start countdown and text sequence
function startDotsSequence() {
    // Only start once
    if (dotsSequenceStarted) {
        return;
    }
    dotsSequenceStarted = true;
    // Sequence: 3, 2, 1, Happy New Year (rendered on two lines)
    const sequence = "Happy New Year 2  0  2  6";
    // Start immediately without delay
    S.UI.simulate(sequence);
}
