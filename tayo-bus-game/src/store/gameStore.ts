import { create } from 'zustand'
import type { CharacterId } from '../data/characters'
import { levels, type ObstacleFrequency } from '../data/levels'

export type GameState =
  | 'menu'
  | 'levelSelect'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'crashing'
  | 'victory'
  | 'gameOver'

export type Obstacle = {
  id: number
  x: number
  y: number
  variant: 'yellow_car' | 'red_car' | 'blue_car' | 'truck' | 'fuel_car' | 'oil_slick'
  speed: number
  hasActed: boolean
  swerveTargetX: number | null
}

export type Difficulty = 'easy' | 'normal' | 'hard'

export type AchievementDef = {
  id: string
  name: string
  description: string
  icon: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_win', name: 'First Win!', description: 'Complete any stage', icon: '🏆' },
  { id: 'fuel_master', name: 'Fuel Master', description: 'Finish a stage with 50%+ fuel', icon: '⛽' },
  { id: 'triple_star', name: 'Triple Star', description: 'Get 3 stars on any stage', icon: '⭐' },
  { id: 'no_spin', name: 'Steady Driver', description: 'Complete a stage without spinning out', icon: '🎯' },
  { id: 'all_levels', name: 'Road Warrior', description: 'Complete all 6 stages', icon: '🗺️' },
  { id: 'all_stars', name: 'Superstar', description: 'Get 3 stars on all stages', icon: '🌟' },
]

type RunStats = {
  timeElapsed: number
  obstaclesAvoided: number
  obstaclesSpawned: number
  score: number
  fuelRemaining: number
  stars: 1 | 2 | 3
  spinCount: number
}

type BestStats = {
  bestTime: number
  bestStars: number
  bestAvoided: number
  bestScore: number
}

type PersistedProgress = {
  unlockedLevels: number
  selectedCharacter: CharacterId
  bestByLevel: Record<number, BestStats>
  audioEnabled?: boolean
  difficulty?: Difficulty
  distanceProfileVersion?: number
  unlockedAchievements?: string[]
  bestEndlessDistance?: number
}

type SoundEvent = 'fuelPickup' | 'oilSlick' | 'wallHit' | 'spinout' | 'boostStart' | 'fuelWarning' | 'nearMiss'

type GameStore = {
  gameState: GameState
  selectedCharacter: CharacterId
  currentLevel: number
  unlockedLevels: number
  audioEnabled: boolean
  difficulty: Difficulty
  playerX: number
  fuel: number
  maxFuel: number
  isSpinning: boolean
  spinTimer: number
  spinCount: number
  isBoosting: boolean
  score: number
  distanceTraveled: number
  finishLineDistance: number
  finishLineVisible: boolean
  finishLineY: number | null
  timeElapsed: number
  speed: number
  obstacles: Obstacle[]
  obstacleFrequency: ObstacleFrequency
  spawnTimer: number
  nextObstacleId: number
  obstaclesAvoided: number
  obstaclesSpawned: number
  crashTimerMs: number
  crashY: number | null
  lastRunStats: RunStats
  bestByLevel: Record<number, BestStats>
  countdownValue: number
  countdownTimer: number
  fuelCarSpawnTimer: number
  oilSlickSpawnTimer: number
  roadCurveOffset: number
  roadCurveTarget: number
  curveChangeTimer: number
  isEndless: boolean
  bestEndlessDistance: number
  unlockedAchievements: string[]
  newAchievement: string | null
  playfieldWidth: number
  pendingSounds: SoundEvent[]
  setGameState: (state: GameState) => void
  setPlayfieldWidth: (width: number) => void
  selectCharacter: (id: CharacterId) => void
  toggleAudio: () => void
  setDifficulty: (difficulty: Difficulty) => void
  startLevel: (levelId: number) => void
  unlockNextLevel: () => void
  resetRun: () => void
  steerLeft: (deltaSeconds: number) => void
  steerRight: (deltaSeconds: number) => void
  setBoost: (active: boolean) => void
  pause: () => void
  resume: () => void
  dismissAchievement: () => void
  startEndless: () => void
  consumeSounds: () => SoundEvent[]
  tick: (deltaMs: number) => void
}

const SPEED_MULTIPLIER = 12
const PIXELS_PER_METER = 2.4
const FINISH_BUFFER = 50
const PLAYFIELD_HEIGHT = 430
const PLAYER_HEIGHT = 128
const PLAYER_BOTTOM_OFFSET = 32
const PLAYER_Y = PLAYFIELD_HEIGHT - PLAYER_BOTTOM_OFFSET - PLAYER_HEIGHT
const FINISH_VISIBLE_DISTANCE = 200
const MAX_FRAME_DELTA_MS = 80
const STORAGE_KEY = 'tayo-bus-progress-v1'
const DISTANCE_PROFILE_VERSION = 3
const PLAYER_HITBOX_TOP = 0.02
const PLAYER_HITBOX_BOTTOM = 0.98
const FINISH_LINE_HEIGHT = 48
const CRASH_DURATION_MS = 600
const COUNTDOWN_STEP_MS = 800
const ENDLESS_SPEED_RAMP = 0.35

const PLAYER_VISUAL_WIDTH_PX = 58
const OBSTACLE_VISUAL_WIDTHS_PX: Record<Obstacle['variant'], number> = {
  yellow_car: 46,
  red_car: 46,
  blue_car: 50,
  truck: 56,
  fuel_car: 42,
  oil_slick: 60,
}
const BODY_INSET_PX = 6
const SWERVE_SPEED = 22
const OBSTACLE_HEIGHTS: Record<Obstacle['variant'], number> = {
  yellow_car: 90,
  red_car: 90,
  blue_car: 90,
  truck: 130,
  fuel_car: 80,
  oil_slick: 30,
}
const FUEL_LOSS_COLLISION = 6
const FUEL_LOSS_WALL = 4
const FUEL_GAIN_PICKUP = 15
const SPIN_DURATION_COLLISION = 800
const SPIN_DURATION_OIL = 600
const WALL_MIN_X = 12
const WALL_MAX_X = 88
const STEER_SPEED = 40

const SPEED_MULTIPLIER_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 0.85,
  normal: 1,
  hard: 1.25,
}

const SPAWN_COOLDOWN_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 2.6,
  normal: 1.7,
  hard: 0.8,
}

const FUEL_DRAIN_MULTIPLIER_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 0.8,
  normal: 1,
  hard: 1.5,
}

const FUEL_GAIN_MULTIPLIER_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 1.2,
  normal: 1,
  hard: 0.6,
}

const SWERVE_AGGRESSION_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 0.4,
  normal: 0.7,
  hard: 1.0,
}

const OBSTACLE_SPEED_MULTIPLIER_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 0.85,
  normal: 1,
  hard: 1.3,
}

const createRunStats = (overrides: Partial<RunStats> = {}): RunStats => ({
  timeElapsed: 0,
  obstaclesAvoided: 0,
  obstaclesSpawned: 0,
  score: 0,
  fuelRemaining: 100,
  stars: 1,
  spinCount: 0,
  ...overrides,
})

const loadProgress = (): Partial<PersistedProgress> => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<PersistedProgress>
    const storedVersion = typeof parsed.distanceProfileVersion === 'number' ? parsed.distanceProfileVersion : 1
    if (storedVersion >= DISTANCE_PROFILE_VERSION) return parsed
    const migrated: Partial<PersistedProgress> = {
      ...parsed,
      bestByLevel: {},
      distanceProfileVersion: DISTANCE_PROFILE_VERSION,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    return migrated
  } catch {
    return {}
  }
}

const saveProgress = (progress: PersistedProgress) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...progress, distanceProfileVersion: DISTANCE_PROFILE_VERSION })
    )
  } catch {
    // Ignore
  }
}

const computeStars = (score: number, fuelRemaining: number, timeElapsed: number, parTime: number) => {
  const fuelBonus = fuelRemaining / 100
  if (timeElapsed <= parTime * 1.1 && fuelBonus >= 0.4) return 3 as const
  if (timeElapsed <= parTime * 1.35 && fuelBonus >= 0.2) return 2 as const
  return 1 as const
}

const getSpawnInterval = (frequency: ObstacleFrequency) => {
  switch (frequency) {
    case 'high': return 1.2
    case 'medium': return 1.6
    default: return 2.1
  }
}

const getDifficultyConfig = (difficulty: Difficulty) => ({
  speed: SPEED_MULTIPLIER_BY_DIFFICULTY[difficulty] ?? SPEED_MULTIPLIER_BY_DIFFICULTY.normal,
  spawn: SPAWN_COOLDOWN_BY_DIFFICULTY[difficulty] ?? SPAWN_COOLDOWN_BY_DIFFICULTY.normal,
  fuelDrain: FUEL_DRAIN_MULTIPLIER_BY_DIFFICULTY[difficulty] ?? 1,
  fuelGain: FUEL_GAIN_MULTIPLIER_BY_DIFFICULTY[difficulty] ?? 1,
  swerveAggression: SWERVE_AGGRESSION_BY_DIFFICULTY[difficulty] ?? 0.7,
  obstacleSpeed: OBSTACLE_SPEED_MULTIPLIER_BY_DIFFICULTY[difficulty] ?? 1,
})

const getSpawnCooldown = (frequency: ObstacleFrequency, difficulty: Difficulty) =>
  getSpawnInterval(frequency) * getDifficultyConfig(difficulty).spawn

const characterIds: CharacterId[] = ['tayo', 'gani', 'lani', 'rogi']
const initialProgress = loadProgress()
const initialSelected =
  initialProgress.selectedCharacter && characterIds.includes(initialProgress.selectedCharacter)
    ? initialProgress.selectedCharacter
    : 'tayo'
const initialUnlocked = Math.max(1, initialProgress.unlockedLevels ?? 1)
const initialBestByLevel = initialProgress.bestByLevel ?? {}
const initialAudioEnabled = typeof initialProgress.audioEnabled === 'boolean' ? initialProgress.audioEnabled : true
const initialDifficulty = initialProgress.difficulty ?? 'normal'
const initialDifficultyConfig = getDifficultyConfig(initialDifficulty)
const initialAchievements = initialProgress.unlockedAchievements ?? []
const initialBestEndless = initialProgress.bestEndlessDistance ?? 0

const checkAchievements = (state: GameStore): string[] => {
  const newly: string[] = []
  const has = (id: string) => state.unlockedAchievements.includes(id)

  if (!has('first_win')) newly.push('first_win')
  if (!has('fuel_master') && state.fuel >= 50) newly.push('fuel_master')
  if (!has('triple_star') && state.lastRunStats.stars === 3) newly.push('triple_star')
  if (!has('no_spin') && state.spinCount === 0) newly.push('no_spin')
  if (!has('all_levels') && state.unlockedLevels > levels.length) newly.push('all_levels')
  if (!has('all_stars')) {
    const allThreeStars = levels.every((l) => {
      const best = state.bestByLevel[l.id]
      return best && best.bestStars >= 3
    })
    if (allThreeStars) newly.push('all_stars')
  }
  return newly
}

const randomObstacleSpeed = (variant: Obstacle['variant']): number => {
  switch (variant) {
    case 'yellow_car': return 0.7 + Math.random() * 0.2
    case 'red_car': return 0.75 + Math.random() * 0.2
    case 'blue_car': return 0.8 + Math.random() * 0.2
    case 'truck': return 0.5 + Math.random() * 0.2
    case 'fuel_car': return 0.6
    case 'oil_slick': return 1.0
  }
}

const initLevel = (levelId: number, difficulty: Difficulty, isEndless: boolean) => {
  const level = levels.find((l) => l.id === levelId)
  const baseSpeed = level?.baseSpeed ?? 3
  const finishLineDistance = isEndless ? 999999 : (level?.distance ?? 800)
  const obstacleFrequency = level?.obstacleFrequency ?? 'low'
  const config = getDifficultyConfig(difficulty)

  return {
    currentLevel: levelId,
    gameState: 'countdown' as const,
    countdownValue: 3,
    countdownTimer: COUNTDOWN_STEP_MS,
    playerX: 50,
    fuel: 100,
    maxFuel: 100,
    isSpinning: false,
    spinTimer: 0,
    spinCount: 0,
    isBoosting: false,
    score: 0,
    distanceTraveled: 0,
    finishLineDistance,
    finishLineVisible: false,
    finishLineY: null as number | null,
    timeElapsed: 0,
    speed: baseSpeed * SPEED_MULTIPLIER * config.speed,
    obstacles: [] as Obstacle[],
    obstacleFrequency,
    spawnTimer: getSpawnCooldown(obstacleFrequency, difficulty),
    nextObstacleId: 1,
    obstaclesAvoided: 0,
    obstaclesSpawned: 0,
    crashTimerMs: 0,
    crashY: null as number | null,
    lastRunStats: createRunStats(),
    fuelCarSpawnTimer: level?.fuelCarFrequency ?? 8,
    oilSlickSpawnTimer: level?.oilSlickFrequency ?? 0,
    roadCurveOffset: 0,
    roadCurveTarget: 0,
    curveChangeTimer: 3 + Math.random() * 3,
    isEndless,
    newAchievement: null as string | null,
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  selectedCharacter: initialSelected,
  currentLevel: 1,
  unlockedLevels: initialUnlocked,
  audioEnabled: initialAudioEnabled,
  difficulty: initialDifficulty,
  playerX: 50,
  fuel: 100,
  maxFuel: 100,
  isSpinning: false,
  spinTimer: 0,
  spinCount: 0,
  isBoosting: false,
  score: 0,
  distanceTraveled: 0,
  finishLineDistance: levels[0]?.distance ?? 800,
  finishLineVisible: false,
  finishLineY: null,
  timeElapsed: 0,
  speed: (levels[0]?.baseSpeed ?? 3) * SPEED_MULTIPLIER * initialDifficultyConfig.speed,
  obstacles: [],
  obstacleFrequency: levels[0]?.obstacleFrequency ?? 'low',
  spawnTimer: getSpawnCooldown(levels[0]?.obstacleFrequency ?? 'low', initialDifficulty),
  nextObstacleId: 1,
  obstaclesAvoided: 0,
  obstaclesSpawned: 0,
  crashTimerMs: 0,
  crashY: null,
  lastRunStats: createRunStats(),
  bestByLevel: initialBestByLevel,
  countdownValue: 0,
  countdownTimer: 0,
  fuelCarSpawnTimer: levels[0]?.fuelCarFrequency ?? 8,
  oilSlickSpawnTimer: levels[0]?.oilSlickFrequency ?? 0,
  roadCurveOffset: 0,
  roadCurveTarget: 0,
  curveChangeTimer: 5,
  isEndless: false,
  bestEndlessDistance: initialBestEndless,
  unlockedAchievements: initialAchievements,
  newAchievement: null,
  playfieldWidth: 400,
  pendingSounds: [],

  setGameState: (state) => set({ gameState: state }),
  setPlayfieldWidth: (width) => set({ playfieldWidth: width }),

  selectCharacter: (id) => {
    set({ selectedCharacter: id })
    const state = get()
    saveProgress({
      unlockedLevels: state.unlockedLevels,
      selectedCharacter: id,
      bestByLevel: state.bestByLevel,
      audioEnabled: state.audioEnabled,
      difficulty: state.difficulty,
    })
  },

  toggleAudio: () =>
    set((state) => {
      const nextEnabled = !state.audioEnabled
      saveProgress({
        unlockedLevels: state.unlockedLevels,
        selectedCharacter: state.selectedCharacter,
        bestByLevel: state.bestByLevel,
        audioEnabled: nextEnabled,
        difficulty: state.difficulty,
      })
      return { audioEnabled: nextEnabled }
    }),

  setDifficulty: (difficulty) =>
    set((state) => {
      const level = levels.find((l) => l.id === state.currentLevel)
      const baseSpeed = level?.baseSpeed ?? 3
      const maxSpeed = level?.maxSpeed ?? 5
      const config = getDifficultyConfig(difficulty)
      const updates: Partial<GameStore> = { difficulty }
      if (state.gameState === 'playing') {
        updates.speed = (state.isBoosting ? maxSpeed : baseSpeed) * SPEED_MULTIPLIER * config.speed
      }
      saveProgress({
        unlockedLevels: state.unlockedLevels,
        selectedCharacter: state.selectedCharacter,
        bestByLevel: state.bestByLevel,
        audioEnabled: state.audioEnabled,
        difficulty,
      })
      return updates
    }),

  startLevel: (levelId) => set(() => initLevel(levelId, get().difficulty, false)),

  unlockNextLevel: () => {
    const nextLevel = get().currentLevel + 1
    set((state) => ({
      unlockedLevels: Math.max(state.unlockedLevels, nextLevel),
      gameState: 'victory',
    }))
    const state = get()
    saveProgress({
      unlockedLevels: state.unlockedLevels,
      selectedCharacter: state.selectedCharacter,
      bestByLevel: state.bestByLevel,
      audioEnabled: state.audioEnabled,
      difficulty: state.difficulty,
    })
  },

  resetRun: () => {
    const state = get()
    if (state.isEndless) return get().startEndless()
    set(initLevel(state.currentLevel, state.difficulty, false))
  },

  steerLeft: (deltaSeconds) =>
    set((state) => {
      if (state.gameState !== 'playing' || state.isSpinning) return state
      return { playerX: Math.max(WALL_MIN_X, state.playerX - STEER_SPEED * deltaSeconds) }
    }),

  steerRight: (deltaSeconds) =>
    set((state) => {
      if (state.gameState !== 'playing' || state.isSpinning) return state
      return { playerX: Math.min(WALL_MAX_X, state.playerX + STEER_SPEED * deltaSeconds) }
    }),

  setBoost: (active) =>
    set((state) => {
      if (active && !state.isBoosting && state.gameState === 'playing') {
        return { isBoosting: true, pendingSounds: [...state.pendingSounds, 'boostStart'] }
      }
      return { isBoosting: active }
    }),

  pause: () =>
    set((state) => (state.gameState === 'playing' ? { gameState: 'paused' } : {})),

  resume: () =>
    set((state) => (state.gameState === 'paused' ? { gameState: 'playing' } : {})),

  dismissAchievement: () => set({ newAchievement: null }),

  consumeSounds: () => {
    const sounds = get().pendingSounds
    if (sounds.length > 0) set({ pendingSounds: [] })
    return sounds
  },

  startEndless: () => {
    const diff = get().difficulty
    set({
      ...initLevel(0, diff, true),
      isEndless: true,
      obstacleFrequency: 'medium',
      speed: 3.5 * SPEED_MULTIPLIER * getDifficultyConfig(diff).speed,
    })
  },

  tick: (deltaMs) =>
    set((state) => {
      if (
        state.gameState !== 'playing' &&
        state.gameState !== 'crashing' &&
        state.gameState !== 'countdown'
      )
        return state

      const clampedDeltaMs = Math.min(deltaMs, MAX_FRAME_DELTA_MS)

      // --- Countdown ---
      if (state.gameState === 'countdown') {
        const nextTimer = state.countdownTimer - clampedDeltaMs
        if (nextTimer <= 0) {
          const nextValue = state.countdownValue - 1
          if (nextValue <= 0) return { gameState: 'playing', countdownValue: 0, countdownTimer: 0 }
          return { countdownValue: nextValue, countdownTimer: COUNTDOWN_STEP_MS }
        }
        return { countdownTimer: nextTimer }
      }

      // --- Crashing ---
      if (state.gameState === 'crashing') {
        const nextCrashTimer = Math.max(0, state.crashTimerMs - clampedDeltaMs)
        if (nextCrashTimer <= 0) {
          const endUpdate: Partial<GameStore> = {
            gameState: 'gameOver',
            crashTimerMs: 0,
            crashY: null,
          }
          if (state.isEndless) {
            const bestEndless = Math.max(state.bestEndlessDistance, state.distanceTraveled)
            endUpdate.bestEndlessDistance = bestEndless
            endUpdate.lastRunStats = createRunStats({
              timeElapsed: state.timeElapsed,
              obstaclesAvoided: state.obstaclesAvoided,
              obstaclesSpawned: state.obstaclesSpawned,
              score: state.score,
              fuelRemaining: state.fuel,
              stars: 1,
              spinCount: state.spinCount,
            })
            saveProgress({
              unlockedLevels: state.unlockedLevels,
              selectedCharacter: state.selectedCharacter,
              bestByLevel: state.bestByLevel,
              audioEnabled: state.audioEnabled,
              difficulty: state.difficulty,
              bestEndlessDistance: bestEndless,
              unlockedAchievements: state.unlockedAchievements,
            })
          }
          return endUpdate
        }
        return { crashTimerMs: nextCrashTimer }
      }

      // --- Playing ---
      const levelCfg = levels.find((l) => l.id === state.currentLevel)
      const deltaSeconds = clampedDeltaMs / 1000
      const baseSpeed = levelCfg?.baseSpeed ?? 3
      const maxSpeed = levelCfg?.maxSpeed ?? 5
      const config = getDifficultyConfig(state.difficulty)
      const currentSpeed = (state.isBoosting ? maxSpeed : baseSpeed) * SPEED_MULTIPLIER * config.speed

      // Fuel depletion
      const fuelDrainRate = levelCfg?.fuelDrainRate ?? 0.8
      const fuelDrain = fuelDrainRate * deltaSeconds * (state.isBoosting ? 2 : 1) * config.fuelDrain
      let fuel = Math.max(0, state.fuel - fuelDrain)

      // Fuel empty = game over
      if (fuel <= 0) {
        return {
          ...state,
          fuel: 0,
          gameState: 'gameOver',
          lastRunStats: createRunStats({
            timeElapsed: state.timeElapsed,
            obstaclesAvoided: state.obstaclesAvoided,
            obstaclesSpawned: state.obstaclesSpawned,
            score: state.score,
            fuelRemaining: 0,
            stars: 1,
            spinCount: state.spinCount,
          }),
        }
      }

      const sounds: SoundEvent[] = []

      // Spinout timer
      let isSpinning = state.isSpinning
      let spinTimer = state.spinTimer
      let spinCount = state.spinCount
      if (isSpinning) {
        spinTimer = Math.max(0, spinTimer - clampedDeltaMs)
        if (spinTimer <= 0) {
          isSpinning = false
          spinTimer = 0
        }
      }

      // Wall collision
      let playerX = state.playerX
      if (playerX < WALL_MIN_X) {
        playerX = WALL_MIN_X + 2
        fuel = Math.max(0, fuel - FUEL_LOSS_WALL)
        if (!isSpinning) {
          isSpinning = true
          spinTimer = SPIN_DURATION_OIL
          spinCount += 1
        }
        sounds.push('wallHit')
      } else if (playerX > WALL_MAX_X) {
        playerX = WALL_MAX_X - 2
        fuel = Math.max(0, fuel - FUEL_LOSS_WALL)
        if (!isSpinning) {
          isSpinning = true
          spinTimer = SPIN_DURATION_OIL
          spinCount += 1
        }
        sounds.push('wallHit')
      }

      const distanceDelta = currentSpeed * deltaSeconds
      const distanceTraveled = Math.min(
        state.distanceTraveled + distanceDelta,
        state.finishLineDistance
      )
      const progressRemaining = state.finishLineDistance - distanceTraveled
      const finishVisible = progressRemaining <= FINISH_VISIBLE_DISTANCE

      const playerTop = PLAYER_Y + PLAYER_HEIGHT * PLAYER_HITBOX_TOP
      const playerBottom = PLAYER_Y + PLAYER_HEIGHT * PLAYER_HITBOX_BOTTOM
      const playerAvoidY = PLAYER_Y + PLAYER_HEIGHT * 0.9
      const obstacleSpeed = distanceDelta * PIXELS_PER_METER * config.obstacleSpeed

      // Score
      let score = state.score + distanceDelta * 10

      // Move obstacles + AI
      let newlyAvoided = 0
      const pw = state.playfieldWidth || 400
      const movedObstacles = state.obstacles
        .map((ob) => {
          const relativeSpeed = obstacleSpeed * ob.speed
          let nextY = ob.y + relativeSpeed
          let nextX = ob.x
          let acted = ob.hasActed
          let swerveTargetX = ob.swerveTargetX

          // Red car AI: set swerve target once when near player
          if (ob.variant === 'red_car' && !acted && ob.y > 80 && ob.y < 280) {
            const dx = playerX - ob.x
            const agg = config.swerveAggression
            swerveTargetX = ob.x + Math.sign(dx) * Math.min(Math.abs(dx) * agg, 15 + agg * 10)
            swerveTargetX = Math.max(WALL_MIN_X, Math.min(WALL_MAX_X, swerveTargetX))
            acted = true
          }

          // Blue car AI: set swerve target once when entering danger zone
          if (ob.variant === 'blue_car' && !acted && ob.y > 40 && ob.y < 200) {
            const dx = playerX - ob.x
            const agg = config.swerveAggression
            swerveTargetX = ob.x + Math.sign(dx) * Math.min(Math.abs(dx) * agg, 18 + agg * 12)
            swerveTargetX = Math.max(WALL_MIN_X, Math.min(WALL_MAX_X, swerveTargetX))
            acted = true
          }

          // Smooth lerp toward swerve target
          if (swerveTargetX !== null) {
            const dx = swerveTargetX - nextX
            if (Math.abs(dx) > 0.2) {
              nextX += Math.sign(dx) * Math.min(Math.abs(dx), SWERVE_SPEED * deltaSeconds)
            } else {
              nextX = swerveTargetX
              swerveTargetX = null
            }
            nextX = Math.max(WALL_MIN_X, Math.min(WALL_MAX_X, nextX))
          }

          const obstacleHeight = OBSTACLE_HEIGHTS[ob.variant]
          const passedPlayer =
            ob.y + obstacleHeight < playerAvoidY &&
            nextY + obstacleHeight >= playerAvoidY
          if (passedPlayer && ob.variant !== 'fuel_car' && ob.variant !== 'oil_slick') {
            newlyAvoided += 1
          }

          return { ...ob, y: nextY, x: nextX, hasActed: acted, swerveTargetX }
        })
        .filter((ob) => ob.y < 520)

      // Collision detection (pixel-based body-to-body)
      let obstacles = movedObstacles
      let gameOver = false
      let crashY: number | null = null
      const playerBodyHalfPx = (PLAYER_VISUAL_WIDTH_PX - BODY_INSET_PX * 2) / 2

      for (const ob of movedObstacles) {
        const obVisualW = OBSTACLE_VISUAL_WIDTHS_PX[ob.variant]
        const obHeight = OBSTACLE_HEIGHTS[ob.variant]
        const obBodyHalfPx = (obVisualW - BODY_INSET_PX * 2) / 2
        const playerCenterPx = (playerX / 100) * pw
        const obCenterPx = (ob.x / 100) * pw
        const xOverlap = Math.abs(playerCenterPx - obCenterPx) < playerBodyHalfPx + obBodyHalfPx
        const obTop = ob.y
        const obBottom = ob.y + obHeight
        const yOverlap = playerBottom >= obTop && playerTop <= obBottom

        if (xOverlap && yOverlap) {
          if (ob.variant === 'fuel_car') {
            fuel = Math.min(state.maxFuel, fuel + FUEL_GAIN_PICKUP * config.fuelGain)
            score += 100
            obstacles = obstacles.filter((o) => o.id !== ob.id)
            sounds.push('fuelPickup')
          } else if (ob.variant === 'oil_slick') {
            if (!isSpinning) {
              isSpinning = true
              spinTimer = SPIN_DURATION_OIL
              spinCount += 1
            }
            obstacles = obstacles.filter((o) => o.id !== ob.id)
            sounds.push('oilSlick')
          } else if (ob.variant === 'truck') {
            gameOver = true
            crashY = ob.y
            break
          } else {
            // Regular car collision: fuel loss + spinout
            fuel = Math.max(0, fuel - FUEL_LOSS_COLLISION)
            if (!isSpinning) {
              isSpinning = true
              spinTimer = SPIN_DURATION_COLLISION
              spinCount += 1
              sounds.push('spinout')
            }
            obstacles = obstacles.filter((o) => o.id !== ob.id)
          }
        }
      }

      // Fuel warning
      if (fuel > 0 && fuel <= 20 && state.fuel > 20) {
        sounds.push('fuelWarning')
      }

      if (gameOver) {
        return {
          ...state,
          gameState: 'crashing',
          obstacles,
          crashTimerMs: CRASH_DURATION_MS,
          crashY,
          distanceTraveled,
          timeElapsed: state.timeElapsed + deltaSeconds,
          score,
          fuel,
          obstaclesAvoided: state.obstaclesAvoided + newlyAvoided,
          playerX,
          isSpinning,
          spinTimer,
          spinCount,
          pendingSounds: sounds,
        }
      }

      if (fuel <= 0) {
        return {
          ...state,
          fuel: 0,
          gameState: 'gameOver',
          obstacles,
          distanceTraveled,
          timeElapsed: state.timeElapsed + deltaSeconds,
          score,
          obstaclesAvoided: state.obstaclesAvoided + newlyAvoided,
          playerX,
          isSpinning,
          spinTimer,
          spinCount,
          pendingSounds: sounds,
          lastRunStats: createRunStats({
            timeElapsed: state.timeElapsed + deltaSeconds,
            obstaclesAvoided: state.obstaclesAvoided + newlyAvoided,
            obstaclesSpawned: state.obstaclesSpawned,
            score,
            fuelRemaining: 0,
            stars: 1,
            spinCount,
          }),
        }
      }

      // Finish line
      const playerMidY = PLAYER_Y + PLAYER_HEIGHT * 0.5
      const finishLineY = finishVisible
        ? Math.max(
            -FINISH_LINE_HEIGHT,
            (1 - progressRemaining / FINISH_VISIBLE_DISTANCE) * playerMidY - FINISH_LINE_HEIGHT
          )
        : null
      const finishLineCrossed =
        finishLineY !== null && finishLineY + FINISH_LINE_HEIGHT >= playerMidY

      if (!state.isEndless && distanceTraveled >= state.finishLineDistance && finishLineCrossed) {
        const finalTime = state.timeElapsed + deltaSeconds
        const finalAvoided = state.obstaclesAvoided + newlyAvoided
        const parTime = state.finishLineDistance / baseSpeed / 12
        const stars = computeStars(score, fuel, finalTime, parTime)
        const runStats = createRunStats({
          timeElapsed: finalTime,
          obstaclesAvoided: finalAvoided,
          obstaclesSpawned: state.obstaclesSpawned,
          score,
          fuelRemaining: fuel,
          stars,
          spinCount,
        })
        const prevBest = state.bestByLevel[state.currentLevel]
        const nextBest: BestStats = prevBest
          ? {
              bestTime: Math.min(prevBest.bestTime, finalTime),
              bestStars: Math.max(prevBest.bestStars, stars),
              bestAvoided: Math.max(prevBest.bestAvoided, finalAvoided),
              bestScore: Math.max(prevBest.bestScore ?? 0, score),
            }
          : { bestTime: finalTime, bestStars: stars, bestAvoided: finalAvoided, bestScore: score }
        const nextBestByLevel = { ...state.bestByLevel, [state.currentLevel]: nextBest }
        const nextUnlocked = Math.max(state.unlockedLevels, state.currentLevel + 1)

        const victoryState: GameStore = {
          ...state,
          gameState: 'victory',
          obstacles,
          distanceTraveled,
          timeElapsed: finalTime,
          finishLineVisible: finishVisible,
          finishLineY,
          obstaclesAvoided: finalAvoided,
          score,
          fuel,
          unlockedLevels: nextUnlocked,
          lastRunStats: runStats,
          bestByLevel: nextBestByLevel,
          playerX,
          isSpinning,
          spinTimer,
          spinCount,
        }

        const newlyUnlocked = checkAchievements(victoryState)
        const allUnlocked = [...state.unlockedAchievements, ...newlyUnlocked]

        saveProgress({
          unlockedLevels: nextUnlocked,
          selectedCharacter: state.selectedCharacter,
          bestByLevel: nextBestByLevel,
          audioEnabled: state.audioEnabled,
          difficulty: state.difficulty,
          unlockedAchievements: allUnlocked,
        })

        return {
          ...victoryState,
          unlockedAchievements: allUnlocked,
          newAchievement: newlyUnlocked.length > 0 ? newlyUnlocked[0] : null,
        }
      }

      // --- Spawn obstacles ---
      let spawnTimer = state.spawnTimer - deltaSeconds
      let nextObstacleId = state.nextObstacleId
      let obstaclesSpawned = state.obstaclesSpawned
      const spawnCooldown = getSpawnCooldown(state.obstacleFrequency, state.difficulty)

      const canSpawn = state.isEndless || progressRemaining > FINISH_BUFFER
      if (canSpawn) {
        let spawnPasses = 0
        while (spawnTimer <= 0 && spawnPasses < 2) {
          spawnPasses += 1
          const pool = levelCfg?.theme.obstaclePool ?? ['yellow_car', 'red_car', 'blue_car']
          const trafficPool = pool.filter(
            (v) => v !== 'fuel_car' && v !== 'oil_slick'
          )
          const variant = trafficPool[Math.floor(Math.random() * trafficPool.length)] as Obstacle['variant']
          const x = WALL_MIN_X + 5 + Math.random() * (WALL_MAX_X - WALL_MIN_X - 10)
          obstacles = [
            ...obstacles,
            {
              id: nextObstacleId,
              x,
              y: -OBSTACLE_HEIGHTS[variant] - 20,
              variant,
              speed: randomObstacleSpeed(variant),
              hasActed: false,
              swerveTargetX: null,
            },
          ]
          nextObstacleId += 1
          obstaclesSpawned += 1
          spawnTimer += spawnCooldown
        }
      }

      // --- Spawn fuel cars ---
      let fuelCarSpawnTimer = state.fuelCarSpawnTimer - deltaSeconds
      const fuelCarFreq = levelCfg?.fuelCarFrequency ?? 8
      if (canSpawn && fuelCarSpawnTimer <= 0) {
        const x = WALL_MIN_X + 5 + Math.random() * (WALL_MAX_X - WALL_MIN_X - 10)
        obstacles = [
          ...obstacles,
          {
            id: nextObstacleId,
            x,
            y: -100,
            variant: 'fuel_car' as const,
            speed: 0.6,
            hasActed: false,
            swerveTargetX: null,
          },
        ]
        nextObstacleId += 1
        fuelCarSpawnTimer = fuelCarFreq + (Math.random() - 0.5) * 4
      }

      // --- Spawn oil slicks ---
      let oilSlickSpawnTimer = state.oilSlickSpawnTimer - deltaSeconds
      const oilFreq = levelCfg?.oilSlickFrequency ?? 0
      if (canSpawn && oilFreq > 0 && oilSlickSpawnTimer <= 0) {
        const x = WALL_MIN_X + 8 + Math.random() * (WALL_MAX_X - WALL_MIN_X - 16)
        obstacles = [
          ...obstacles,
          {
            id: nextObstacleId,
            x,
            y: -50,
            variant: 'oil_slick' as const,
            speed: 1.0,
            hasActed: false,
            swerveTargetX: null,
          },
        ]
        nextObstacleId += 1
        oilSlickSpawnTimer = oilFreq + (Math.random() - 0.5) * 4
      }

      // --- Road curves ---
      let roadCurveOffset = state.roadCurveOffset
      let roadCurveTarget = state.roadCurveTarget
      let curveChangeTimer = state.curveChangeTimer - deltaSeconds
      const curveIntensity = levelCfg?.theme.curveIntensity ?? 0.2

      if (curveChangeTimer <= 0) {
        roadCurveTarget = (Math.random() - 0.5) * 60 * curveIntensity
        curveChangeTimer = 3 + Math.random() * 5
      }

      const curveLerp = Math.min(1, deltaSeconds * 1.5)
      roadCurveOffset += (roadCurveTarget - roadCurveOffset) * curveLerp

      // --- Endless mode speed ramp ---
      const nextSpeed = state.isEndless ? currentSpeed + ENDLESS_SPEED_RAMP * deltaSeconds : currentSpeed

      // Near miss detection
      if (newlyAvoided > 0) {
        sounds.push('nearMiss')
      }

      return {
        distanceTraveled,
        timeElapsed: state.timeElapsed + deltaSeconds,
        speed: nextSpeed,
        finishLineVisible: finishVisible,
        finishLineY,
        obstacles,
        spawnTimer,
        nextObstacleId,
        obstaclesAvoided: state.obstaclesAvoided + newlyAvoided,
        obstaclesSpawned,
        fuel,
        score,
        playerX,
        isSpinning,
        spinTimer,
        spinCount,
        fuelCarSpawnTimer,
        oilSlickSpawnTimer,
        roadCurveOffset,
        roadCurveTarget,
        curveChangeTimer,
        pendingSounds: sounds,
      }
    }),
}))
