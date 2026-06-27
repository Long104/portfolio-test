// AudioEngine — Web Audio API wrapper for audio-reactive visuals
// Provides bass / mid / treble / overall level extraction from an audio file.

export interface AudioData {
  bass: number; // 0–1, low frequencies (~20–250 Hz)
  mid: number; // 0–1, mid frequencies (~250–2000 Hz)
  treble: number; // 0–1, high frequencies (~2000–14000 Hz)
  level: number; // 0–1, overall RMS energy
}

const NUM_BINS = 256; // AnalyserNode fftSize=512 → 256 frequency bins

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(
    new ArrayBuffer(NUM_BINS),
  );

  private _isPlaying = false;
  private _audioBuffer: AudioBuffer | null = null;
  private _startTime = 0; // ctx.currentTime when playback started
  private _offset = 0; // playback offset within the buffer (seconds)
  private _smoothing: AudioData = { bass: 0, mid: 0, treble: 0, level: 0 };

  get isPlaying() {
    return this._isPlaying;
  }

  // ── Lifecycle ──────────────────────────────────────────────

  async init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = NUM_BINS * 2; // 512
    this.analyser.smoothingTimeConstant = 0.75;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.5;

    // analyser → gain → destination
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    // Load audio file
    const resp = await fetch("/far_beyond-the-stars.mp3");
    if (!resp.ok) throw new Error("Failed to load /far_beyond-the-stars.mp3 — place your MP3 in public/");
    const arrayBuffer = await resp.arrayBuffer();
    this._audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
  }

  async start() {
    if (!this.ctx || !this.analyser || !this._audioBuffer) {
      await this.init();
    }
    if (!this.ctx || !this.analyser || !this._audioBuffer) return;

    // Resume context (autoplay policy)
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    // Create source and connect: source → analyser (→ gain → destination already wired)
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this._audioBuffer;
    this.source.loop = true;
    this.source.connect(this.analyser);
    this.source.start(0, this._offset);
    this._startTime = this.ctx.currentTime;
    this._isPlaying = true;
  }

  pause() {
    if (!this.ctx || !this.source) return;
    const elapsed = this.ctx.currentTime - this._startTime;
    this._offset = (this._offset + elapsed) % (this._audioBuffer?.duration ?? 1);
    this.source.stop();
    this.source.disconnect();
    this.source = null;
    this._isPlaying = false;
  }

  // ── Per-frame data extraction ──────────────────────────────

  getData(): AudioData {
    if (!this.analyser || !this._isPlaying) {
      // Decay to zero when not playing — smooth fade
      this._smoothing.bass *= 0.9;
      this._smoothing.mid *= 0.9;
      this._smoothing.treble *= 0.9;
      this._smoothing.level *= 0.9;
      return { ...this._smoothing };
    }

    this.analyser.getByteFrequencyData(this.freqData);

    // Split 256 bins into 3 perceptual bands.
    // FFT bin frequency = (binIndex / NUM_BINS) * (sampleRate / 2)
    // At 44.1kHz: bass ≈ bins 0–6, mid ≈ bins 7–60, treble ≈ bins 61–255
    const bassEnd = 7;
    const midEnd = 61;

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let allSum = 0;

    for (let i = 0; i < NUM_BINS; i++) {
      const v = this.freqData[i];
      allSum += v;
      if (i < bassEnd) bassSum += v;
      else if (i < midEnd) midSum += v;
      else trebleSum += v;
    }

    // Normalize to 0–1
    const rawBass = bassSum / (bassEnd * 255);
    const rawMid = midSum / ((midEnd - bassEnd) * 255);
    const rawTreble = trebleSum / ((NUM_BINS - midEnd) * 255);
    const rawLevel = allSum / (NUM_BINS * 255);

    // Temporal smoothing — smooths jittery frequency data
    const s = 0.35; // smoothing factor (lower = smoother)
    this._smoothing.bass = this._smoothing.bass + (rawBass - this._smoothing.bass) * s;
    this._smoothing.mid = this._smoothing.mid + (rawMid - this._smoothing.mid) * s;
    this._smoothing.treble = this._smoothing.treble + (rawTreble - this._smoothing.treble) * s;
    this._smoothing.level = this._smoothing.level + (rawLevel - this._smoothing.level) * s;

    return { ...this._smoothing };
  }

  // ── Cleanup ────────────────────────────────────────────────

  dispose() {
    if (this.source) {
      try { this.source.stop(); } catch { /* already stopped */ }
      this.source.disconnect();
      this.source = null;
    }
    this.analyser?.disconnect();
    this.gainNode?.disconnect();
    this.ctx?.close();
    this.ctx = null;
    this.analyser = null;
    this.gainNode = null;
    this._audioBuffer = null;
    this._isPlaying = false;
  }
}
