"use client";
// Theme-aware sound engine built entirely on the Web Audio API.
// Every sound is synthesised at runtime — zero audio files to download.
// Sound is OFF by default and only starts after an explicit user gesture.

import type { ThemeId } from "./themes";

type Voice = { stop: (t?: number) => void };

class SoundEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  ambientBus: GainNode | null = null;
  delay: DelayNode | null = null;
  enabled = false;
  theme: ThemeId = "pro";
  private voices: Voice[] = [];
  private timers: number[] = [];
  private noiseBuf: AudioBuffer | null = null;
  private lastHover = 0;

  private ensure() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    this.master.connect(comp).connect(ctx.destination);
    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.5;
    this.sfx.connect(this.master);
    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = 0.0;
    this.ambientBus.connect(this.master);
    // shared feedback delay for space
    const d = ctx.createDelay(1.5);
    d.delayTime.value = 0.38;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    d.connect(fb).connect(d);
    d.connect(wet).connect(this.master);
    this.delay = d;
    // white noise buffer
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    return ctx;
  }

  async setEnabled(on: boolean) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    this.enabled = on;
    if (on) {
      await ctx.resume();
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.3);
      this.startAmbient(this.theme);
    } else {
      this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      window.setTimeout(() => this.stopAmbient(), 600);
    }
  }

  setTheme(theme: ThemeId) {
    const changed = theme !== this.theme;
    this.theme = theme;
    if (this.enabled && changed) {
      this.stopAmbient(0.8);
      window.setTimeout(() => this.enabled && this.theme === theme && this.startAmbient(theme), 700);
    }
  }

  // ---------- helpers ----------
  private osc(type: OscillatorType, freq: number, dest: AudioNode, t0: number, dur: number, gain = 0.2, attack = 0.005) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(dest);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    return { o, g };
  }

  private noise(dest: AudioNode, t0: number, dur: number, gain: number, filterFreq: number, q = 1, type: BiquadFilterType = "bandpass") {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
    return { src, f, g };
  }

  // ---------- UI sounds ----------
  hover() {
    if (!this.enabled || !this.ctx || !this.sfx) return;
    const now = performance.now();
    if (now - this.lastHover < 60) return;
    this.lastHover = now;
    const t = this.ctx.currentTime;
    switch (this.theme) {
      case "gta":
        this.osc("square", 1320, this.sfx, t, 0.06, 0.05);
        break;
      case "illusion": {
        const { o } = this.osc("sine", 520, this.sfx, t, 0.25, 0.08, 0.02);
        o.frequency.exponentialRampToValueAtTime(1040, t + 0.2);
        break;
      }
      case "hacker":
        this.noise(this.sfx, t, 0.03, 0.25, 4200, 6);
        break;
      default:
        this.osc("sine", 880, this.sfx, t, 0.08, 0.04);
    }
  }

  click() {
    if (!this.enabled || !this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime;
    switch (this.theme) {
      case "gta":
        this.osc("sawtooth", 660, this.sfx, t, 0.12, 0.08);
        this.osc("sawtooth", 990, this.sfx, t + 0.06, 0.16, 0.08);
        break;
      case "illusion": {
        const { o } = this.osc("triangle", 1200, this.sfx, t, 0.5, 0.1, 0.01);
        o.frequency.exponentialRampToValueAtTime(300, t + 0.45);
        if (this.delay) this.osc("sine", 1800, this.delay, t, 0.2, 0.05);
        break;
      }
      case "hacker":
        this.osc("square", 220, this.sfx, t, 0.05, 0.08);
        this.osc("square", 440, this.sfx, t + 0.05, 0.05, 0.06);
        break;
      default:
        this.osc("sine", 660, this.sfx, t, 0.15, 0.07);
        this.osc("sine", 990, this.sfx, t + 0.04, 0.2, 0.04);
    }
  }

  transition(to: ThemeId) {
    if (!this.enabled || !this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime;
    const { f } = this.noise(this.sfx, t, 1.1, 0.35, 200, 2);
    f.frequency.exponentialRampToValueAtTime(to === "hacker" ? 6000 : 3000, t + 0.9);
    const base = { gta: 110, illusion: 73.4, hacker: 55, pro: 130.8 }[to];
    const { o } = this.osc(to === "hacker" ? "square" : "sawtooth", base * 0.5, this.sfx, t, 1.2, 0.06, 0.2);
    o.frequency.exponentialRampToValueAtTime(base, t + 1);
  }

  type() {
    if (!this.enabled || !this.ctx || !this.sfx || this.theme !== "hacker") return;
    this.noise(this.sfx, this.ctx.currentTime, 0.02, 0.15, 2500 + Math.random() * 3000, 4);
  }

  // ---------- ambient beds ----------
  private stopAmbient(fade = 0.4) {
    const ctx = this.ctx;
    if (!ctx) return;
    this.timers.forEach((id) => window.clearInterval(id));
    this.timers = [];
    this.voices.forEach((v) => v.stop(ctx.currentTime + fade));
    this.voices = [];
    this.ambientBus?.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
  }

  private pad(freqs: number[], type: OscillatorType, cutoff: number, gain: number): Voice {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.setTargetAtTime(gain, ctx.currentTime, 1.5);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = cutoff;
    lp.Q.value = 0.7;
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoG.gain.value = cutoff * 0.4;
    lfo.connect(lfoG).connect(lp.frequency);
    lfo.start();
    const oscs = freqs.flatMap((f) =>
      [-6, 6].map((det) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f;
        o.detune.value = det;
        o.connect(lp);
        o.start();
        return o;
      }),
    );
    lp.connect(out).connect(this.ambientBus!);
    return {
      stop: (t = ctx.currentTime + 0.4) => {
        out.gain.cancelScheduledValues(ctx.currentTime);
        out.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
        [...oscs, lfo].forEach((o) => o.stop(t + 0.5));
      },
    };
  }

  private startAmbient(theme: ThemeId) {
    const ctx = this.ensure();
    if (!ctx || !this.ambientBus) return;
    this.stopAmbient(0.1);
    this.ambientBus.gain.setTargetAtTime(0.5, ctx.currentTime, 0.8);
    const bus = this.ambientBus;
    if (theme === "gta") {
      // synthwave chord loop Am – F – C – G with a sunset arpeggio + ocean wash
      const chords = [
        [220, 261.6, 329.6],
        [174.6, 220, 261.6],
        [261.6, 329.6, 392],
        [196, 246.9, 293.7],
      ];
      let idx = 0;
      let cur = this.pad(chords[0], "sawtooth", 900, 0.05);
      this.voices.push({ stop: (t) => cur.stop(t) });
      const bar = 60 / 92 * 4;
      this.timers.push(
        window.setInterval(() => {
          idx = (idx + 1) % chords.length;
          const old = cur;
          cur = this.pad(chords[idx], "sawtooth", 900, 0.05);
          old.stop();
        }, bar * 1000),
      );
      let step = 0;
      this.timers.push(
        window.setInterval(() => {
          const ch = chords[idx];
          const f = ch[step % 3] * (step % 6 < 3 ? 2 : 4);
          this.osc("square", f, this.delay!, ctx.currentTime, 0.18, 0.025);
          step++;
        }, (60 / 92 / 2) * 1000),
      );
      this.timers.push(
        window.setInterval(() => this.noise(bus, ctx.currentTime, 3.5, 0.06, 500, 0.4, "lowpass"), 4200),
      );
    } else if (theme === "illusion") {
      this.voices.push(this.pad([73.4, 110, 164.8], "sine", 1400, 0.09));
      this.timers.push(
        window.setInterval(() => {
          const notes = [587, 659, 880, 987, 1318];
          const f = notes[Math.floor(Math.random() * notes.length)];
          const { o } = this.osc("sine", f, this.delay!, ctx.currentTime, 2.2, 0.03, 0.4);
          o.frequency.exponentialRampToValueAtTime(f * (Math.random() > 0.5 ? 1.5 : 0.75), ctx.currentTime + 2);
        }, 1700),
      );
    } else if (theme === "hacker") {
      this.voices.push(this.pad([55, 82.4], "square", 220, 0.035));
      this.timers.push(
        window.setInterval(() => {
          if (Math.random() < 0.55) {
            const f = 800 + Math.floor(Math.random() * 8) * 220;
            this.osc("sine", f, bus, ctx.currentTime, 0.06, 0.035);
          }
          if (Math.random() < 0.25) this.noise(bus, ctx.currentTime, 0.02, 0.08, 6000, 5);
        }, 180),
      );
    } else {
      this.voices.push(this.pad([130.8, 196, 246.9, 293.7], "triangle", 1100, 0.035));
    }
  }
}

export const sound = typeof window !== "undefined" ? new SoundEngine() : (null as unknown as SoundEngine);
