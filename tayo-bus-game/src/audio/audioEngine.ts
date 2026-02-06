let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let musicTimer: number | null = null
let musicStep = 0
let audioEnabled = true

const musicPattern = [220, 277, 330, 392, 330, 277]

const ensureContext = () => {
  if (typeof window === 'undefined') {
    return null
  }
  if (!audioContext) {
    audioContext = new AudioContext()
    masterGain = audioContext.createGain()
    masterGain.gain.value = 0.22
    masterGain.connect(audioContext.destination)
  }
  return audioContext
}

const resumeContext = () => {
  const context = ensureContext()
  if (!context) {
    return
  }
  if (context.state === 'suspended') {
    void context.resume()
  }
}

const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  when = 0
) => {
  if (!audioEnabled) {
    return
  }
  const context = ensureContext()
  if (!context || !masterGain) {
    return
  }
  resumeContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const startTime = context.currentTime + when
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  oscillator.connect(gain)
  gain.connect(masterGain)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

const playSweep = (
  startFrequency: number,
  endFrequency: number,
  duration: number,
  volume: number
) => {
  if (!audioEnabled) {
    return
  }
  const context = ensureContext()
  if (!context || !masterGain) {
    return
  }
  resumeContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const startTime = context.currentTime
  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(startFrequency, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration)
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  oscillator.connect(gain)
  gain.connect(masterGain)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

export const primeAudio = () => {
  resumeContext()
}

export const setAudioEnabled = (enabled: boolean) => {
  audioEnabled = enabled
  if (!enabled) {
    stopMusic()
  }
}

export const startMusic = () => {
  if (!audioEnabled || musicTimer) {
    return
  }
  ensureContext()
  musicStep = 0
  musicTimer = window.setInterval(() => {
    if (!audioEnabled) {
      return
    }
    const frequency = musicPattern[musicStep]
    playTone(frequency, 0.22, 'sine', 0.05)
    musicStep = (musicStep + 1) % musicPattern.length
  }, 360)
}

export const stopMusic = () => {
  if (musicTimer) {
    window.clearInterval(musicTimer)
    musicTimer = null
  }
}

export const playLaneChange = () => {
  playTone(520, 0.08, 'triangle', 0.08)
}

export const playVictory = () => {
  playTone(523, 0.14, 'triangle', 0.12)
  playTone(659, 0.16, 'triangle', 0.12, 0.16)
  playTone(784, 0.18, 'triangle', 0.12, 0.34)
}

export const playCrash = () => {
  playSweep(240, 60, 0.32, 0.18)
  playTone(90, 0.2, 'square', 0.06, 0.04)
}
