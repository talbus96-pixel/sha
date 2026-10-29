// Sound engine: synthesised breathing cues (singing bowl, chime, breath tone)
// and looping ambient recordings. Everything runs through the Web Audio API.
const Sound = (() => {
    const AMBIENT_FILES = {
        rain: 'sounds/rain.mp3',
        ocean: 'sounds/ocean.mp3',
        stream: 'sounds/stream.mp3',
        forest: 'sounds/forest.mp3',
        fireplace: 'sounds/fireplace.mp3',
        night: 'sounds/night.mp3',
        wind: 'sounds/wind.mp3'
        // 'brown' (brown noise) is generated, not loaded
    };

    let ctx = null;
    let master, cueBus, ambientBus, noiseBuf;
    let cueStyle = 'bowl';
    let cueLevel = 0.8;
    let ambientGateOpen = false;
    let muted = false;
    const ambient = {};      // id -> { on, level, voice: {src, gain} | null, loading }
    const bufferCache = {};  // id -> Promise<AudioBuffer>
    let tone = null;         // continuous breath-tone voice

    // ---------- setup ----------

    // Must first be called from a tap/click: browsers only allow sound after the user interacts.
    function ensure() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            ctx = new AC({ latencyHint: 'playback' });
            // iPhone: play even when the ring/silent switch is on silent (Safari 17+)
            try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}

            const comp = ctx.createDynamicsCompressor();
            comp.threshold.value = -8;
            comp.knee.value = 8;
            comp.ratio.value = 4;
            comp.attack.value = 0.004;
            comp.release.value = 0.3;
            master = ctx.createGain();
            master.gain.value = muted ? 0 : 0.9;
            master.connect(comp);
            comp.connect(ctx.destination);

            // Cues: dry signal plus a soft, dark hall reverb
            cueBus = ctx.createGain();
            cueBus.gain.value = cueLevel;
            const reverb = ctx.createConvolver();
            reverb.buffer = makeImpulse(4.8, 2.4);
            const wet = ctx.createGain();
            wet.gain.value = 0.5;
            cueBus.connect(master);
            cueBus.connect(reverb);
            reverb.connect(wet);
            wet.connect(master);

            ambientBus = ctx.createGain();
            ambientBus.gain.value = 0;
            ambientBus.connect(master);

            noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
            const nd = noiseBuf.getChannelData(0);
            for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

            Object.keys(ambient).forEach(applyAmbient);
            setAmbientGate(ambientGateOpen);
        }
        if (ctx.state !== 'running') ctx.resume();
        return ctx;
    }

    function makeImpulse(seconds, decay) {
        const rate = ctx.sampleRate;
        const len = Math.floor(rate * seconds);
        const buf = ctx.createBuffer(2, len, rate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            let lp = 0;
            for (let i = 0; i < len; i++) {
                const t = i / len;
                // one-pole lowpass that closes over time = the tail gets darker as it fades
                lp += ((Math.random() * 2 - 1) - lp) * (0.3 - 0.26 * t);
                d[i] = lp * Math.pow(1 - t, decay);
            }
        }
        return buf;
    }

    // Sets an AudioParam to start smoothly from wherever it is right now.
    function holdParam(param, t) {
        if (param.cancelAndHoldAtTime) {
            param.cancelAndHoldAtTime(t);
        } else {
            const v = param.value;
            param.cancelScheduledValues(t);
            param.setValueAtTime(v, t);
        }
    }

    // ---------- cue instruments ----------

    // Singing bowl: inharmonic partials, each a slightly detuned pair so it shimmers.
    function bowl(freq, level, when = ctx.currentTime, decayScale = 1) {
        const partials = [
            // [ratio, amplitude, decay seconds]
            [1, 1, 9],
            [2.71, 0.42, 5.5],
            [5.12, 0.2, 3.2],
            [8.3, 0.09, 1.9],
            [12.2, 0.04, 1.1]
        ];
        const out = ctx.createGain();
        out.gain.value = level * 0.32;
        out.connect(cueBus);
        let end = when;
        partials.forEach(([ratio, amp, dec], k) => {
            [-1, 1].forEach(side => {
                const osc = ctx.createOscillator();
                osc.frequency.value = freq * ratio * (1 + side * 0.0011 * (k + 1));
                const g = ctx.createGain();
                const d = dec * decayScale;
                g.gain.setValueAtTime(0, when);
                g.gain.linearRampToValueAtTime(amp * 0.5, when + 0.008 + k * 0.006);
                g.gain.exponentialRampToValueAtTime(0.0001, when + d);
                const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
                osc.connect(g);
                if (pan) {
                    pan.pan.value = side * 0.25;
                    g.connect(pan);
                    pan.connect(out);
                } else {
                    g.connect(out);
                }
                osc.start(when);
                osc.stop(when + d + 0.05);
                end = Math.max(end, when + d);
            });
        });
        mallet(out, freq * 3, 0.12, when);
        setTimeout(() => out.disconnect(), (end - ctx.currentTime + 1) * 1000);
    }

    // Soft felt-mallet chime: warm fundamental with a quiet, quickly fading overtone.
    function chime(freq, level, when = ctx.currentTime) {
        const partials = [[1, 1, 3.4], [2, 0.18, 1.6], [4.01, 0.08, 0.5]];
        const out = ctx.createGain();
        out.gain.value = level * 0.42;
        out.connect(cueBus);
        partials.forEach(([ratio, amp, dec]) => {
            const osc = ctx.createOscillator();
            osc.frequency.value = freq * ratio;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, when);
            g.gain.linearRampToValueAtTime(amp, when + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
            osc.connect(g);
            g.connect(out);
            osc.start(when);
            osc.stop(when + dec + 0.05);
        });
        mallet(out, freq * 2, 0.06, when);
        setTimeout(() => out.disconnect(), (when - ctx.currentTime + 4.5) * 1000);
    }

    // A tiny filtered noise tap that makes a struck sound feel physical.
    function mallet(dest, freq, level, when) {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = Math.min(freq, 8000);
        bp.Q.value = 1.2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(level, when);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
        src.connect(bp);
        bp.connect(g);
        g.connect(dest);
        src.start(when);
        src.stop(when + 0.06);
    }

    // Breath tone: a soft, continuous drone that swells and brightens as you breathe in
    // and settles as you breathe out.
    function toneVoice() {
        if (tone) return tone;
        const out = ctx.createGain();
        out.gain.value = 0.0001;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 260;
        filter.Q.value = 0.6;
        filter.connect(out);
        out.connect(cueBus);
        const voices = [
            // [freq, type, level, detune cents]
            [110, 'sine', 0.5, 0],
            [110, 'sine', 0.25, 7],
            [164.81, 'sine', 0.22, -4],
            [220, 'triangle', 0.1, 3],
            [329.63, 'sine', 0.05, -6]
        ];
        const oscs = voices.map(([f, type, lvl, cents]) => {
            const osc = ctx.createOscillator();
            osc.type = type;
            osc.frequency.value = f;
            osc.detune.value = cents;
            const g = ctx.createGain();
            g.gain.value = lvl;
            osc.connect(g);
            g.connect(filter);
            osc.start();
            return osc;
        });
        tone = { out, filter, oscs };
        return tone;
    }

    // Rising kinds swell the tone, falling kinds settle it, holds leave it where it is.
    const RISING = ['in', 'top', 'powerIn'];
    const FALLING = ['out', 'powerOut'];

    function shapeTone(kind, seconds) {
        const v = toneVoice();
        const t = ctx.currentTime;
        holdParam(v.out.gain, t);
        holdParam(v.filter.frequency, t);
        if (RISING.includes(kind)) {
            v.out.gain.linearRampToValueAtTime(0.55, t + seconds);
            v.filter.frequency.exponentialRampToValueAtTime(1500, t + seconds);
        } else if (FALLING.includes(kind)) {
            v.out.gain.linearRampToValueAtTime(0.07, t + seconds);
            v.filter.frequency.exponentialRampToValueAtTime(260, t + seconds);
        } else if (v.out.gain.value < 0.06) {
            // resuming during a hold on empty lungs: bring the quiet drone back in
            v.out.gain.linearRampToValueAtTime(0.07, t + 1);
        }
    }

    function silenceTone(fade = 0.6) {
        if (!tone) return;
        const v = tone;
        tone = null;
        const t = ctx.currentTime;
        holdParam(v.out.gain, t);
        v.out.gain.linearRampToValueAtTime(0.0001, t + fade);
        v.oscs.forEach(o => o.stop(t + fade + 0.05));
        setTimeout(() => v.out.disconnect(), (fade + 0.3) * 1000);
    }

    // Notes and levels for each kind of step
    const BOWL_NOTES = { in: 293.66, top: 392, hold: 440, out: 220, retain: 146.83 }; // D4 G4 A4 A3 D3
    const CHIME_NOTES = { in: 659.25, top: 880, hold: 554.37, out: 440, retain: 329.63 }; // E5 A5 C#5 A4 E4

    // kind: 'in' | 'top' (extra sip in) | 'holdIn' | 'out' | 'holdOut' | 'retain' | 'powerIn' | 'powerOut'
    function cue(kind, seconds) {
        if (!ctx || cueStyle === 'off') return;
        if (cueStyle === 'tone') { shapeTone(kind, seconds); return; }
        const notes = cueStyle === 'bowl' ? BOWL_NOTES : CHIME_NOTES;
        const strike = cueStyle === 'bowl'
            ? (note, level, decay) => bowl(note, level, ctx.currentTime, decay)
            : (note, level) => chime(note, level);
        switch (kind) {
            case 'in': strike(notes.in, 1, 1); break;
            case 'top': strike(notes.top, 0.5, 0.5); break;
            case 'holdIn':
            case 'holdOut': strike(notes.hold, cueStyle === 'bowl' ? 0.3 : 0.45, 0.45); break;
            case 'out': strike(notes.out, 1, 1); break;
            case 'retain': strike(notes.retain, 0.9, 1.3); break;
            // quick Wim Hof breaths: only a soft tick, a full bell every 2 seconds would be too much
            case 'powerIn': chime(CHIME_NOTES.top, 0.16); break;
        }
    }

    // Called when a paused session continues mid-step.
    function resume(kind, secondsLeft) {
        if (ctx && cueStyle === 'tone') shapeTone(kind, Math.max(0.5, secondsLeft));
    }

    function pause() {
        silenceTone();
    }

    function finish() {
        if (!ctx) return;
        silenceTone(3);
        if (cueStyle === 'off') return;
        const t = ctx.currentTime;
        bowl(196, 0.9, t + 0.2);
        bowl(293.66, 0.6, t + 1.9);
    }

    function preview(style) {
        ensure();
        if (style === 'tone') {
            silenceTone(0.1);
            shapeTone('in', 2.5);
            setTimeout(() => { if (cueStyle === 'tone') silenceTone(2); }, 2600);
        } else if (style === 'bowl') {
            bowl(BOWL_NOTES.in, 1);
        } else if (style === 'chime') {
            chime(CHIME_NOTES.in, 1);
        }
    }

    function setCueStyle(style) {
        if (style !== 'tone') silenceTone();
        cueStyle = style;
    }

    function setCueLevel(level) {
        cueLevel = level;
        if (ctx) cueBus.gain.setTargetAtTime(level, ctx.currentTime, 0.05);
    }

    // ---------- ambient ----------

    function decode(arrayBuf) {
        // callback form also works on older Safari
        return new Promise((resolve, reject) => ctx.decodeAudioData(arrayBuf, resolve, reject));
    }

    function makeBrownNoise() {
        const len = ctx.sampleRate * 10;
        const buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            let last = 0;
            for (let i = 0; i < len; i++) {
                last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
                d[i] = last * 1.1;
            }
        }
        return buf;
    }

    // Folds the end of a recording over its start with an equal-power crossfade,
    // so it can loop forever with no audible seam.
    function makeSeamless(buf, fadeSeconds) {
        const n = Math.floor(fadeSeconds * buf.sampleRate);
        const len = buf.length - n;
        const out = ctx.createBuffer(buf.numberOfChannels, len, buf.sampleRate);
        for (let ch = 0; ch < buf.numberOfChannels; ch++) {
            const src = buf.getChannelData(ch);
            const dst = out.getChannelData(ch);
            dst.set(src.subarray(0, len));
            for (let i = 0; i < n; i++) {
                const x = (i / n) * Math.PI / 2;
                dst[i] = src[i] * Math.sin(x) + src[len + i] * Math.cos(x);
            }
        }
        return out;
    }

    function getBuffer(id) {
        if (!bufferCache[id]) {
            const raw = id === 'brown'
                ? Promise.resolve(makeBrownNoise())
                : fetch(AMBIENT_FILES[id])
                    .then(r => { if (!r.ok) throw new Error('missing ' + id); return r.arrayBuffer(); })
                    .then(decode);
            bufferCache[id] = raw.then(b => makeSeamless(b, Math.min(3, b.duration / 4)));
            bufferCache[id].catch(() => { delete bufferCache[id]; });
        }
        return bufferCache[id];
    }

    function applyAmbient(id) {
        const a = ambient[id];
        if (!ctx || !a) return;
        const t = ctx.currentTime;
        if (a.on && !a.voice) {
            if (a.loading) return;
            a.loading = getBuffer(id).then(buf => {
                a.loading = null;
                if (!a.on || a.voice) return;
                const src = ctx.createBufferSource();
                src.buffer = buf;
                src.loop = true;
                const gain = ctx.createGain();
                gain.gain.value = 0;
                src.connect(gain);
                gain.connect(ambientBus);
                // start somewhere random so it doesn't sound identical every time
                src.start(ctx.currentTime, Math.random() * buf.duration);
                a.voice = { src, gain };
                applyAmbient(id);
            }).catch(() => { a.loading = null; });
        } else if (a.on && a.voice) {
            a.voice.gain.gain.setTargetAtTime(a.level, t, 0.5);
        } else if (!a.on && a.voice) {
            const v = a.voice;
            a.voice = null;
            v.gain.gain.setTargetAtTime(0, t, 0.4);
            setTimeout(() => { try { v.src.stop(); } catch (e) {} v.gain.disconnect(); }, 2500);
        }
    }

    function setAmbient(id, on, level) {
        ambient[id] = ambient[id] || { on: false, level, voice: null, loading: null };
        ambient[id].on = on;
        ambient[id].level = level;
        applyAmbient(id);
    }

    // Ambience is heard only while the gate is open (session running, or previewing in the Sounds panel).
    function setAmbientGate(open, fadeSeconds = 1.2) {
        ambientGateOpen = open;
        if (!ctx) return;
        holdParam(ambientBus.gain, ctx.currentTime);
        ambientBus.gain.setTargetAtTime(open ? 1 : 0, ctx.currentTime, fadeSeconds / 3);
    }

    // One switch for every sound the app makes.
    function setMuted(on) {
        muted = on;
        if (ctx) master.gain.setTargetAtTime(on ? 0 : 0.9, ctx.currentTime, 0.08);
    }

    return {
        setMuted,
        ensure, cue, resume, pause, finish, preview,
        setCueStyle, setCueLevel, setAmbient, setAmbientGate,
        get ready() { return !!ctx; }
    };
})();
