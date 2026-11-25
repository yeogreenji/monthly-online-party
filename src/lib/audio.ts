export type Mood = 'lofi' | 'jazz' | 'party'

const BPM: Record<Mood, number> = { lofi: 74, jazz: 96, party: 118 }

function noteAt(mood: Mood, step: number): number {
  const table: Record<Mood, number[]> = {
    lofi: [261.63, 293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66],
    jazz: [220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0],
    party: [130.81, 164.81, 196.0, 220.0, 261.63, 220.0, 196.0, 164.81],
  }
  const scale = table[mood]
  return scale[step % scale.length]
}

/**
 * 살롱의 소리. 외부 음원 없이 Web Audio API로 직접 합성합니다.
 * - 잔 부딪히는 소리(짠), 박수, 하트의 작은 종소리
 * - 라운지 BGM 세 가지 무드 (로우파이 · 재즈 · 파티 비트)
 * 브라우저 정책상 사용자가 한 번 누른 뒤에만 소리가 시작됩니다.
 */
export class SalonAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private bgmBus: GainNode | null = null
  private timer: number | null = null
  private nextTime = 0
  private step = 0
  private mood: Mood | null = null

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return this.ctx
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    const ctx = new Ctor()
    const master = ctx.createGain()
    master.gain.value = 0.85
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.knee.value = 18
    comp.ratio.value = 3
    master.connect(comp)
    comp.connect(ctx.destination)
    const bgmBus = ctx.createGain()
    bgmBus.gain.value = 0.0
    bgmBus.connect(master)
    this.ctx = ctx
    this.master = master
    this.bgmBus = bgmBus
    return ctx
  }

  private env(node: AudioNode, at: number, attack: number, decay: number, peak: number): GainNode {
    const ctx = this.ctx
    if (!ctx) throw new Error('no audio context')
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
    node.connect(gain)
    return gain
  }

  /** 맑은 유리잔 소리 */
  clink(): void {
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const at = ctx.currentTime + 0.01
    const partials = [
      { f: 2093, gain: 0.16, decay: 0.5 },
      { f: 3136, gain: 0.1, decay: 0.36 },
      { f: 4699, gain: 0.05, decay: 0.22 },
    ]
    partials.forEach((partial, index) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(partial.f, at)
      osc.frequency.exponentialRampToValueAtTime(partial.f * 0.996, at + partial.decay)
      const gain = this.env(osc, at + index * 0.004, 0.006, partial.decay, partial.gain)
      gain.connect(this.master as GainNode)
      osc.start(at)
      osc.stop(at + partial.decay + 0.1)
    })
    const noise = this.noiseBurst(0.09)
    if (noise) {
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 5200
      bp.Q.value = 1.4
      const gain = this.env(bp, at, 0.004, 0.09, 0.09)
      noise.connect(bp)
      gain.connect(this.master)
      noise.start(at)
      noise.stop(at + 0.16)
    }
  }

  /** 박수 소리 (여러 번의 짧은 노이즈) */
  applause(): void {
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    for (let i = 0; i < 7; i += 1) {
      const at = ctx.currentTime + 0.02 + i * 0.045 + Math.random() * 0.02
      const noise = this.noiseBurst(0.05)
      if (!noise) continue
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 1300 + Math.random() * 700
      bp.Q.value = 0.9
      const gain = this.env(bp, at, 0.003, 0.06, 0.05)
      noise.connect(bp)
      gain.connect(this.master)
      noise.start(at)
      noise.stop(at + 0.12)
    }
  }

  /** 하트 · 알림의 작은 종소리 */
  chime(): void {
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const at = ctx.currentTime + 0.01
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1318.51, at)
    osc.frequency.exponentialRampToValueAtTime(1975.53, at + 0.12)
    const gain = this.env(osc, at, 0.01, 0.34, 0.09)
    gain.connect(this.master)
    osc.start(at)
    osc.stop(at + 0.5)
  }

  private noiseBurst(duration: number): AudioBufferSourceNode | null {
    const ctx = this.ctx
    if (!ctx) return null
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration))
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length)
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    return source
  }

  get currentMood(): Mood | null {
    return this.mood
  }

  play(mood: Mood): void {
    const ctx = this.ensure()
    if (!ctx || !this.bgmBus) return
    this.mood = mood
    this.step = 0
    this.nextTime = ctx.currentTime + 0.08
    this.bgmBus.gain.cancelScheduledValues(ctx.currentTime)
    this.bgmBus.gain.setTargetAtTime(0.5, ctx.currentTime, 0.25)
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = window.setInterval(() => this.schedule(), 100)
    this.schedule()
  }

  stop(): void {
    this.mood = null
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
    if (this.ctx && this.bgmBus) {
      this.bgmBus.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.18)
    }
  }

  toggle(mood: Mood): boolean {
    if (this.mood === mood) {
      this.stop()
      return false
    }
    this.play(mood)
    return true
  }

  private schedule(): void {
    const ctx = this.ctx
    if (!ctx || !this.bgmBus || !this.mood) return
    const stepDur = 60 / BPM[this.mood] / 4
    while (this.nextTime < ctx.currentTime + 0.5) {
      this.playStep(this.mood, this.step, this.nextTime, stepDur)
      this.nextTime += stepDur
      this.step = (this.step + 1) % 64
    }
  }

  private playStep(mood: Mood, step: number, at: number, stepDur: number): void {
    const ctx = this.ctx
    const bus = this.bgmBus
    if (!ctx || !bus) return
    const bar = Math.floor(step / 16) % 4

    if (mood === 'lofi') {
      if (step % 16 === 0) {
        const chords = [
          [220.0, 261.63, 329.63, 392.0],
          [174.61, 220.0, 261.63, 329.63],
          [196.0, 246.94, 293.66, 369.99],
          [164.81, 220.0, 261.63, 329.63],
        ]
        chords[bar].forEach((freq, index) => {
          const osc = ctx.createOscillator()
          osc.type = 'triangle'
          osc.frequency.value = freq
          osc.detune.value = index % 2 === 0 ? -4 : 5
          const gain = this.env(osc, at + index * 0.01, 0.5, 2.6, 0.028)
          gain.connect(bus)
          osc.start(at)
          osc.stop(at + 3.4)
        })
      }
      if ((step === 6 || step === 22 || step === 38 || step === 54) && Math.random() > 0.35) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = noteAt(mood, step) * 2
        const gain = this.env(osc, at, 0.02, 0.7, 0.05)
        gain.connect(bus)
        osc.start(at)
        osc.stop(at + 0.9)
      }
    }

    if (mood === 'jazz') {
      const swing = step % 2 === 1 ? stepDur * 0.22 : 0
      if (step % 16 === 0 || step % 16 === 8) {
        const bass = [110.0, 130.81, 146.83, 98.0][bar]
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = step % 16 === 0 ? bass : bass * 1.25
        const gain = this.env(osc, at + swing, 0.01, 0.42, 0.14)
        gain.connect(bus)
        osc.start(at + swing)
        osc.stop(at + 0.6)
      }
      if (step % 16 === 6 || step % 16 === 14) {
        const chord = [261.63, 329.63, 392.0, 493.88]
        chord.forEach((freq, index) => {
          const osc = ctx.createOscillator()
          osc.type = 'triangle'
          osc.frequency.value = freq
          const gain = this.env(osc, at + swing + index * 0.006, 0.008, 0.24, 0.03)
          gain.connect(bus)
          osc.start(at + swing)
          osc.stop(at + 0.4)
        })
      }
      if (step % 8 === 4 && Math.random() > 0.5) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = noteAt(mood, step) * 2
        const gain = this.env(osc, at + swing, 0.01, 0.3, 0.045)
        gain.connect(bus)
        osc.start(at + swing)
        osc.stop(at + 0.45)
      }
    }

    if (mood === 'party') {
      if (step % 4 === 0) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(130, at)
        osc.frequency.exponentialRampToValueAtTime(48, at + 0.13)
        const gain = this.env(osc, at, 0.004, 0.16, 0.24)
        gain.connect(bus)
        osc.start(at)
        osc.stop(at + 0.26)
      }
      if (step % 2 === 1) {
        const noise = this.noiseBurst(0.04)
        if (noise) {
          const hp = ctx.createBiquadFilter()
          hp.type = 'highpass'
          hp.frequency.value = 7200
          const gain = this.env(hp, at, 0.002, 0.05, 0.045)
          noise.connect(hp)
          gain.connect(bus)
          noise.start(at)
          noise.stop(at + 0.09)
        }
      }
      if (step % 8 === 0) {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.value = noteAt(mood, step) / 2
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 420
        const gain = this.env(filter, at, 0.01, 0.34, 0.05)
        osc.connect(filter)
        gain.connect(bus)
        osc.start(at)
        osc.stop(at + 0.5)
      }
      if (step % 16 === 8) {
        const chord = [261.63, 329.63, 392.0]
        chord.forEach((freq) => {
          const osc = ctx.createOscillator()
          osc.type = 'triangle'
          osc.frequency.value = freq
          const gain = this.env(osc, at, 0.01, 0.18, 0.02)
          gain.connect(bus)
          osc.start(at)
          osc.stop(at + 0.3)
        })
      }
    }
  }
}

export const salonAudio = new SalonAudio()
