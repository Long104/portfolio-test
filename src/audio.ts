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
  private _startTime = 0;
  private _offset = 0;

  get isPlaying() {
    return this._isPlaying;
  }

  // ── Lifecycle ──────────────────────────────────────────────

  async init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = NUM_BINS * 2; // 512
    this.analyser.smoothingTimeConstant = 0.5; // light analyser smoothing; per-layer smoothing happens in component
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.5;

    // analyser → gain → destination
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
  }

  async loadTrack(url: string) {
    await this.preloadTrack(url);
    // loadTrack also starts playback; preloadTrack just loads.
  }

  /** Fetch + decode audio into memory without starting playback.
   *  Safe to call early — on mount, before user interaction.
   *  Call start() later for instant playback. */
  async preloadTrack(url: string) {
    if (!this.ctx) await this.init();
    if (!this.ctx) throw new Error("AudioContext not available");

    // Skip if already loaded (same track)
    if (this._audioBuffer) return;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Failed to load " + url);
    const arrayBuffer = await resp.arrayBuffer();
    this._audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this._offset = 0;
  }

  async start() {
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
    const zero: AudioData = { bass: 0, mid: 0, treble: 0, level: 0 };
    if (!this.analyser || !this._isPlaying) return zero;

    this.analyser.getByteFrequencyData(this.freqData);

    // Split 256 bins into 3 perceptual bands.
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

    return {
      bass: bassSum / (bassEnd * 255),
      mid: midSum / ((midEnd - bassEnd) * 255),
      treble: trebleSum / ((NUM_BINS - midEnd) * 255),
      level: allSum / (NUM_BINS * 255),
    };
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
