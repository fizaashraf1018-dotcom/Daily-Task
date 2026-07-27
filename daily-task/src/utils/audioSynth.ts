/**
 * Ambient Audio Generator using Web Audio API for Study & Focus Timer
 */

class StudyAudioEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentType: 'none' | 'rain' | 'waves' | 'whitenoise' = 'none';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public stop() {
    if (this.currentSource) {
      try {
        (this.currentSource as AudioBufferSourceNode).stop();
      } catch {
        // ignore
      }
      this.currentSource.disconnect();
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.currentType = 'none';
  }

  public playSound(type: 'rain' | 'waves' | 'whitenoise', volume: number = 0.3) {
    this.initContext();
    if (!this.ctx) return;

    this.stop();

    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'rain' || type === 'whitenoise') {
      // Pink/white noise filtering
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          // Soft pink noise
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11; // soft rain level
          b6 = white * 0.115926;
        } else {
          // Smooth white noise
          output[i] = white * 0.08;
        }
      }
    } else if (type === 'waves') {
      // Gentle ocean swell noise
      for (let i = 0; i < bufferSize; i++) {
        const t = i / this.ctx.sampleRate;
        const swell = Math.sin(2 * Math.PI * 0.2 * t) * 0.5 + 0.5;
        output[i] = (Math.random() * 2 - 1) * 0.08 * swell;
      }
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    // Lowpass filter for smooth warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'rain' ? 800 : 1200, this.ctx.currentTime);

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    whiteNoise.start();
    this.currentSource = whiteNoise;
    this.isPlaying = true;
    this.currentType = type;
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public playChime() {
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3); // C6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  public getStatus() {
    return { isPlaying: this.isPlaying, currentType: this.currentType };
  }
}

export const audioSynth = new StudyAudioEngine();
