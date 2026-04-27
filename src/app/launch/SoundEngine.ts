export class SoundEngine {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  private tone(freq: number, type: OscillatorType, dur: number, vol: number, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  private noise(dur: number, vol = 0.4) {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * dur, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.15));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(this.ctx.destination);
    src.start();
  }

  playClick() {
    this.tone(880, "sine", 0.12, 0.2);
    this.tone(1320, "sine", 0.08, 0.1, 0.04);
  }

  playCharge() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 2);
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 1.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 2.2);
    // Low rumble
    this.tone(40, "sine", 2.2, 0.08);
  }

  playWhoosh() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600 + Math.random() * 400, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.35);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  playImpact() {
    this.noise(0.5, 0.6);
    this.tone(60, "sine", 0.6, 0.35);
    this.tone(90, "sine", 0.4, 0.2, 0.05);
    this.tone(120, "triangle", 0.3, 0.1, 0.1);
  }

  playStarBell(index: number) {
    const freqs = [523, 659, 784, 1047, 1319];
    const f = freqs[index] || 1319;
    this.tone(f, "sine", 0.7, 0.28);
    this.tone(f * 2, "sine", 0.45, 0.1, 0.01);
    this.tone(f * 3, "triangle", 0.3, 0.04, 0.02);
  }

  playFanfare() {
    const chord = [261, 329, 392, 523, 659, 784, 1047];
    chord.forEach((f, i) => {
      const d = i * 0.07;
      this.tone(f, "sine", 2.5, 0.14, d);
      this.tone(f * 1.5, "triangle", 1.8, 0.04, d + 0.01);
    });
    this.noise(0.15, 0.2);
  }
}
