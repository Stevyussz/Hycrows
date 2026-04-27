export class SoundEngine {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  private tone(freq: number, type: OscillatorType, dur: number, vol: number, delay = 0, rampDown = true) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    if (rampDown) g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
    return osc;
  }

  private noise(dur: number, vol = 0.4, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * dur, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.12));
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(g); g.connect(this.ctx.destination);
    src.start(t);
  }

  playClick() {
    this.tone(1047, "sine", 0.08, 0.3);
    this.tone(1568, "sine", 0.06, 0.15, 0.03);
    this.tone(2093, "sine", 0.05, 0.1, 0.06);
  }

  playCharge(): ()=>void {
    if (!this.ctx) return () => {};
    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    const master = this.ctx.createGain();
    master.connect(this.ctx.destination);

    // Low rumble rising
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(40, t);
    osc1.frequency.exponentialRampToValueAtTime(200, t + 2.5);
    const g1 = this.ctx.createGain();
    g1.gain.setValueAtTime(0.01, t); g1.gain.linearRampToValueAtTime(0.18, t + 2);
    osc1.connect(g1); g1.connect(master);

    // Mid sweep
    osc2.type = "square";
    osc2.frequency.setValueAtTime(120, t);
    osc2.frequency.exponentialRampToValueAtTime(900, t + 2.5);
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.005, t); g2.gain.linearRampToValueAtTime(0.08, t + 2);
    osc2.connect(g2); g2.connect(master);

    // High shimmer
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(600, t);
    osc3.frequency.exponentialRampToValueAtTime(2400, t + 2.5);
    const g3 = this.ctx.createGain();
    g3.gain.setValueAtTime(0.001, t); g3.gain.linearRampToValueAtTime(0.05, t + 2);
    osc3.connect(g3); g3.connect(master);

    master.gain.setValueAtTime(1, t);
    [osc1, osc2, osc3].forEach(o => { o.start(t); o.stop(t + 3); });

    return () => { try { master.gain.setValueAtTime(0.001, this.ctx!.currentTime); } catch {} };
  }

  playRollingDrone(): ()=>void {
    if (!this.ctx) return () => {};
    const t = this.ctx.currentTime;
    const nodes: OscillatorNode[] = [];
    const master = this.ctx.createGain();
    master.gain.setValueAtTime(0.001, t);
    master.gain.linearRampToValueAtTime(1, t + 0.3);
    master.connect(this.ctx.destination);

    // Pads
    [[55,"sine",0.12],[110,"triangle",0.07],[220,"sine",0.05],[440,"triangle",0.03],[880,"sine",0.02]].forEach(([f,type,v],i)=>{
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = type as OscillatorType;
      osc.frequency.value = f as number;
      g.gain.value = v as number;
      osc.connect(g); g.connect(master);
      osc.start(t); nodes.push(osc);
    });

    return () => {
      if (!this.ctx) return;
      const ct = this.ctx.currentTime;
      master.gain.setValueAtTime(master.gain.value, ct);
      master.gain.exponentialRampToValueAtTime(0.001, ct + 0.5);
      setTimeout(() => nodes.forEach(o => { try { o.stop(); } catch {} }), 600);
    };
  }

  playMysticCrack() {
    if (!this.ctx) return;
    // Electric crackle
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.15), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (i < d.length * 0.1 ? 1 : Math.exp(-i / (d.length * 0.05)));
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = 0.35;
    const filter = this.ctx.createBiquadFilter(); filter.type = "highpass"; filter.frequency.value = 2000;
    src.connect(filter); filter.connect(g); g.connect(this.ctx.destination);
    src.start();
    this.tone(80 + Math.random() * 120, "sine", 0.2, 0.12);
  }

  playWhoosh(pitch = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime((700 + Math.random() * 500) * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(40 * pitch, t + 0.5);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + 0.55);
  }

  playImpact() {
    this.noise(0.6, 0.7);
    this.tone(50, "sine", 0.8, 0.5);
    this.tone(80, "sine", 0.6, 0.3, 0.04);
    this.tone(160, "triangle", 0.4, 0.2, 0.08);
    this.tone(1200, "sine", 0.15, 0.1, 0.01);
  }

  playStarBell(idx: number) {
    const freqs = [523, 659, 784, 1047, 1319];
    const f = freqs[idx] || 1319;
    this.tone(f, "sine", 0.9, 0.32);
    this.tone(f * 2, "sine", 0.6, 0.12, 0.01);
    this.tone(f * 3, "triangle", 0.4, 0.05, 0.02);
    this.tone(f * 0.5, "triangle", 0.5, 0.08, 0.005);
  }

  playEpicFanfare() {
    if (!this.ctx) return;
    // Orchestral build
    const progression = [
      [261,329,392],[293,369,440],[329,415,494],[349,440,523],
      [392,494,587],[440,554,659],[523,659,784]
    ];
    progression.forEach((chord, ci) => {
      chord.forEach((f, fi) => {
        const d = ci * 0.12 + fi * 0.015;
        this.tone(f, "sine", 2.5 - ci * 0.1, 0.12, d);
        this.tone(f * 2, "triangle", 2 - ci * 0.1, 0.04, d + 0.01);
        this.tone(f * 0.5, "sine", 1.5, 0.06, d);
      });
    });
    // Percussion hit at start
    this.noise(0.3, 0.25);
    this.tone(100, "sine", 0.5, 0.3);
  }
}
