import { create } from 'zustand'
import type { CharacterId } from '../data/characters'
import { levels, type ObstacleFrequency } from '../data/levels'

export type GameState =
  | 'menu'
  | 'levelSelect'
  | 'playing'
  | 'crashing'
  | 'victory'
  | 'gameOver'

export type Obstacle = {
  id: number
  lane: 0 | 1 | 2
  y: number
  variant: 'motorcycle' | 'car' | 'truck'
}

export type Difficulty = 'easy' | 'normal' | 'hard'

type RunStats = {
  timeElapsed: number
  obstaclesAvoided: number
  obstaclesSpawned: number
  stars: 1 | 2 | 3
}

type BestStats = {
  bestTime: number
  bestStars: number
  bestAvoided: number
}

type PersistedProgress = {
  unlockedLevels: number
  selectedCharacter: CharacterId
  bestByLevel: Record<number, BestStats>
  audioEnabled?: boolean
  difficulty?: Difficulty
  distanceProfileVersion?: number
}

type GameStore = {
  gameState: GameState
  selectedCharacter: CharacterId
  currentLevel: number
  unlockedLevels: number
  audioEnabled: boolean
  difficulty: Difficulty
  playerLane: 0 | 1 | 2
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
  crashLane: 0 | 1 | 2 | null
  crashY: number | null
  lastRunStats: RunStats
  bestByLevel: Record<number, BestStats>
  setGameState: (state: GameState) => void
  selectCharacter: (id: CharacterId) => void
  toggleAudio: () => void
  setDifficulty: (difficulty: Difficulty) => void
  startLevel: (levelId: number) => void
  unlockNextLevel: () => void
  resetRun: () => void
  moveLeft: () => void
  moveRight: () => void
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
const DISTANCE_PROFILE_VERSION = 2
const PLAYER_HITBOX = { top: 0.02, bottom: 0.98 }
const OBSTACLE_HITBOX = { top: 0.02, bottom: 0.98 }
const FINISH_LINE_HEIGHT = 48
const LANES: Array<0 | 1 | 2> = [0, 1, 2]
const CRASH_DURATION_MS = 600

const OBSTACLE_SIZES: Record<Obstacle['variant'], { height: number }> = {
  motorcycle: { height: 72 },
  car: { height: 90 },
  truck: { height: 130 },
}

const SPEED_MULTIPLIER_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 0.85,
  normal: 1,
  hard: 1.12,
}

const SPAWN_COOLDOWN_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 2.6,
  normal: 1.7,
  hard: 1.1,
}

const LANE_CLEAR_THRESHOLD_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 400,
  normal: 340,
  hard: 260,
}

const createRunStats = (overrides: Partial<RunStats> = {}): RunStats => ({
  timeElapsed: 0,
  obstaclesAvoided: 0,
  obstaclesSpawned: 0,
  stars: 1,
  ...overrides,
})

const loadProgress = (): Partial<PersistedProgress> => {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as Partial<PersistedProgress>
    const storedVersion =
      typeof parsed.distanceProfileVersion === 'number'
        ? parsed.distanceProfileVersion
        : 1

    if (storedVersion >= DISTANCE_PROFILE_VERSION) {
      return parsed
    }

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
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...progress,
        distanceProfileVersion: DISTANCE_PROFILE_VERSION,
      })
    )
  } catch {
    // Ignore storage errors (e.g. private mode).
  }
}

const computeStars = (timeElapsed: number, parTime: number, avoidedRate: number) => {
  if (timeElapsed <= parTime * 1.1 && avoidedRate >= 0.85) {
    return 3 as const
  }
  if (timeElapsed <= parTime * 1.35 && avoidedRate >= 0.6) {
    return 2 as const
  }
  return 1 as const
}

const getSpawnInterval = (frequency: ObstacleFrequency) => {
  switch (frequency) {
    case 'high':
      return 1.2
    case 'medium':
      return 1.6
    default:
      return 2.1
  }
}

const getDifficultyConfig = (difficulty: Difficulty) => ({
  speed:
    SPEED_MULTIPLIER_BY_DIFFICULTY[difficulty] ??
    SPEED_MULTIPLIER_BY_DIFFICULTY.normal,
  spawn:
    SPAWN_COOLDOWN_BY_DIFFICULTY[difficulty] ??
    SPAWN_COOLDOWN_BY_DIFFICULTY.normal,
})
const getSpawnCooldown = (
  frequency: ObstacleFrequency,
  difficulty: Difficulty
) => getSpawnInterval(frequency) * getDifficultyConfig(difficulty).spawn

const characterIds: CharacterId[] = ['tayo', 'gani', 'lani', 'rogi']
const initialProgress = loadProgress()
const initialSelected =
  initialProgress.selectedCharacter &&
  characterIds.includes(initialProgress.selectedCharacter)
    ? initialProgress.selectedCharacter
    : 'tayo'
const initialUnlocked = Math.max(1, initialProgress.unlockedLevels ?? 1)
const initialBestByLevel = initialProgress.bestByLevel ?? {}
const initialAudioEnabled =
  typeof initialProgress.audioEnabled === 'boolean'
    ? initialProgress.audioEnabled
    : true
const initialDifficulty = initialProgress.difficulty ?? 'normal'
const initialDifficultyConfig = getDifficultyConfig(initialDifficulty)

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  selectedCharacter: initialSelected,
  currentLevel: 1,
  unlockedLevels: initialUnlocked,
  audioEnabled: initialAudioEnabled,
  difficulty: initialDifficulty,
  playerLane: 1,
  distanceTraveled: 0,
  finishLineDistance: levels[0]?.distance ?? 500,
  finishLineVisible: false,
  finishLineY: null,
  timeElapsed: 0,
  speed: (levels[0]?.baseSpeed ?? 3) * SPEED_MULTIPLIER * initialDifficultyConfig.speed,
  obstacles: [],
  obstacleFrequency: levels[0]?.obstacleFrequency ?? 'low',
  spawnTimer:
    getSpawnCooldown(levels[0]?.obstacleFrequency ?? 'low', initialDifficulty),
  nextObstacleId: 1,
  obstaclesAvoided: 0,
  obstaclesSpawned: 0,
  crashTimerMs: 0,
  crashLane: null,
  crashY: null,
  lastRunStats: createRunStats(),
  bestByLevel: initialBestByLevel,
  setGameState: (state) => set({ gameState: state }),
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
      const level = levels.find((entry) => entry.id === state.currentLevel)
      const baseSpeed = level?.baseSpeed ?? 3
      const config = getDifficultyConfig(difficulty)
      const updates: Partial<GameStore> = {
        difficulty,
      }
      if (state.gameState === 'playing') {
        const currentCooldown = getSpawnCooldown(
          state.obstacleFrequency,
          state.difficulty
        )
        const nextCooldown = getSpawnCooldown(state.obstacleFrequency, difficulty)
        const cooldownRatio =
          currentCooldown > 0 ? state.spawnTimer / currentCooldown : 1
        updates.speed = baseSpeed * SPEED_MULTIPLIER * config.speed
        updates.spawnTimer = Math.max(
          0.08,
          Math.min(nextCooldown, cooldownRatio * nextCooldown)
        )
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
  startLevel: (levelId) => {
    const level = levels.find((entry) => entry.id === levelId)
    const baseSpeed = level?.baseSpeed ?? 3
    const finishLineDistance = level?.distance ?? 500
    const obstacleFrequency = level?.obstacleFrequency ?? 'low'
    const config = getDifficultyConfig(get().difficulty)

    set({
      currentLevel: levelId,
      gameState: 'playing',
      playerLane: 1,
      distanceTraveled: 0,
      finishLineDistance,
      finishLineVisible: false,
      finishLineY: null,
      timeElapsed: 0,
      speed: baseSpeed * SPEED_MULTIPLIER * config.speed,
      obstacles: [],
      obstacleFrequency,
      spawnTimer: getSpawnCooldown(obstacleFrequency, get().difficulty),
      nextObstacleId: 1,
      obstaclesAvoided: 0,
      obstaclesSpawned: 0,
      crashTimerMs: 0,
      crashLane: null,
      crashY: null,
      lastRunStats: createRunStats(),
    })
  },
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
    const levelId = get().currentLevel
    const level = levels.find((entry) => entry.id === levelId)
    const baseSpeed = level?.baseSpeed ?? 3
    const finishLineDistance = level?.distance ?? 500
    const obstacleFrequency = level?.obstacleFrequency ?? 'low'
    const config = getDifficultyConfig(get().difficulty)

    set({
      gameState: 'playing',
      playerLane: 1,
      distanceTraveled: 0,
      finishLineDistance,
      finishLineVisible: false,
      finishLineY: null,
      timeElapsed: 0,
      speed: baseSpeed * SPEED_MULTIPLIER * config.speed,
      obstacles: [],
      obstacleFrequency,
      spawnTimer: getSpawnCooldown(obstacleFrequency, get().difficulty),
      nextObstacleId: 1,
      obstaclesAvoided: 0,
      obstaclesSpawned: 0,
      crashTimerMs: 0,
      crashLane: null,
      crashY: null,
      lastRunStats: createRunStats(),
    })
  },
  moveLeft: () =>
    set((state) => ({ playerLane: Math.max(0, state.playerLane - 1) as 0 | 1 | 2 })),
  moveRight: () =>
    set((state) => ({ playerLane: Math.min(2, state.playerLane + 1) as 0 | 1 | 2 })),
  tick: (deltaMs) =>
    set((state) => {
      if (state.gameState !== 'playing' && state.gameState !== 'crashing') {
        return state
      }

      const clampedDeltaMs = Math.min(deltaMs, MAX_FRAME_DELTA_MS)
      if (state.gameState === 'crashing') {
        const nextCrashTimer = Math.max(0, state.crashTimerMs - clampedDeltaMs)
        if (nextCrashTimer <= 0) {
          return {
            gameState: 'gameOver',
            crashTimerMs: 0,
            crashLane: null,
            crashY: null,
          }
        }

        return {
          crashTimerMs: nextCrashTimer,
        }
      }

      const levelCfg = levels.find((l) => l.id === state.currentLevel)
      const deltaSeconds = clampedDeltaMs / 1000
      const distanceDelta = state.speed * deltaSeconds
      const distanceTraveled = Math.min(
        state.distanceTraveled + distanceDelta,
        state.finishLineDistance
      )
      const progressRemaining = state.finishLineDistance - distanceTraveled
      const finishVisible = progressRemaining <= FINISH_VISIBLE_DISTANCE

      const playerTop = PLAYER_Y + PLAYER_HEIGHT * PLAYER_HITBOX.top
      const playerBottom = PLAYER_Y + PLAYER_HEIGHT * PLAYER_HITBOX.bottom
      const playerAvoidY = PLAYER_Y + PLAYER_HEIGHT * 0.9
      const obstacleSpeed = distanceDelta * PIXELS_PER_METER
      let newlyAvoided = 0
      const movedObstacles = state.obstacles
        .map((obstacle) => {
          const obstacleHeight = OBSTACLE_SIZES[obstacle.variant].height
          const nextY = obstacle.y + obstacleSpeed
          const passedPlayer =
            obstacle.y + obstacleHeight < playerAvoidY &&
            nextY + obstacleHeight >= playerAvoidY

          if (passedPlayer) {
            newlyAvoided += 1
          }

          return {
            ...obstacle,
            y: nextY,
          }
        })
        .filter((obstacle) => obstacle.y < 520)
      const collidedObstacle = movedObstacles.find((obstacle) => {
        if (obstacle.lane !== state.playerLane) {
          return false
        }
        const obstacleHeight = OBSTACLE_SIZES[obstacle.variant].height
        const obstacleTop = obstacle.y + obstacleHeight * OBSTACLE_HITBOX.top
        const obstacleBottom =
          obstacle.y + obstacleHeight * OBSTACLE_HITBOX.bottom
        return playerBottom >= obstacleTop && playerTop <= obstacleBottom
      })

      if (collidedObstacle) {
        return {
          ...state,
          gameState: 'crashing',
          obstacles: movedObstacles,
          crashTimerMs: CRASH_DURATION_MS,
          crashLane: collidedObstacle.lane,
          crashY: collidedObstacle.y,
          obstaclesAvoided: state.obstaclesAvoided + newlyAvoided,
        }
      }

      const playerMidY = PLAYER_Y + PLAYER_HEIGHT * 0.5
      const finishLineY = finishVisible
        ? Math.max(
            -FINISH_LINE_HEIGHT,
            (1 - progressRemaining / FINISH_VISIBLE_DISTANCE) *
              playerMidY -
              FINISH_LINE_HEIGHT
          )
        : null
      const finishLineCrossed =
        finishLineY !== null &&
        finishLineY + FINISH_LINE_HEIGHT >= playerMidY

      if (distanceTraveled >= state.finishLineDistance && finishLineCrossed) {
        const finalTime = state.timeElapsed + deltaSeconds
        const finalAvoided = state.obstaclesAvoided + newlyAvoided
        const totalSpawned = state.obstaclesSpawned
        const avoidedRate =
          totalSpawned > 0 ? finalAvoided / totalSpawned : 1
        const parTime = state.finishLineDistance / state.speed
        const stars = computeStars(finalTime, parTime, avoidedRate)
        const runStats = createRunStats({
          timeElapsed: finalTime,
          obstaclesAvoided: finalAvoided,
          obstaclesSpawned: totalSpawned,
          stars,
        })
        const prevBest = state.bestByLevel[state.currentLevel]
        const nextBest: BestStats = prevBest
          ? {
              bestTime: Math.min(prevBest.bestTime, finalTime),
              bestStars: Math.max(prevBest.bestStars, stars),
              bestAvoided: Math.max(prevBest.bestAvoided, finalAvoided),
            }
          : {
              bestTime: finalTime,
              bestStars: stars,
              bestAvoided: finalAvoided,
            }
        const nextBestByLevel = {
          ...state.bestByLevel,
          [state.currentLevel]: nextBest,
        }
        const nextUnlocked = Math.max(state.unlockedLevels, state.currentLevel + 1)
        saveProgress({
          unlockedLevels: nextUnlocked,
          selectedCharacter: state.selectedCharacter,
          bestByLevel: nextBestByLevel,
          audioEnabled: state.audioEnabled,
          difficulty: state.difficulty,
        })

        return {
          ...state,
          gameState: 'victory',
          obstacles: movedObstacles,
          distanceTraveled,
          timeElapsed: finalTime,
          finishLineVisible: finishVisible,
          finishLineY,
          obstaclesAvoided: finalAvoided,
          unlockedLevels: nextUnlocked,
          lastRunStats: runStats,
          bestByLevel: nextBestByLevel,
        }
      }

      let spawnTimer = state.spawnTimer - deltaSeconds
      let obstacles = movedObstacles
      let nextObstacleId = state.nextObstacleId
      let obstaclesSpawned = state.obstaclesSpawned
      const spawnCooldown = getSpawnCooldown(
        state.obstacleFrequency,
        state.difficulty
      )
      const laneClearThreshold =
        LANE_CLEAR_THRESHOLD_BY_DIFFICULTY[state.difficulty] ??
        LANE_CLEAR_THRESHOLD_BY_DIFFICULTY.hard

      const canSpawn = progressRemaining > FINISH_BUFFER
      if (canSpawn) {
        let spawnPasses = 0
        while (spawnTimer <= 0 && spawnPasses < 2) {
          spawnPasses += 1
          const recentObstacles = obstacles.filter(
            (obstacle) => obstacle.y < laneClearThreshold
          )
          const occupiedLanes = new Set(recentObstacles.map((obstacle) => obstacle.lane))
          const availableLanes = LANES.filter((lane) => !occupiedLanes.has(lane))

          if (availableLanes.length > 0) {
            const lane =
              availableLanes[Math.floor(Math.random() * availableLanes.length)]
            const pool = levelCfg?.theme.obstaclePool ?? ['motorcycle', 'car', 'truck']
            const variant = pool[Math.floor(Math.random() * pool.length)] as Obstacle['variant']

            obstacles = [
              ...obstacles,
              {
                id: nextObstacleId,
                lane,
                y: -240,
                variant,
              },
            ]
            nextObstacleId += 1
            obstaclesSpawned += 1
            spawnTimer += spawnCooldown
          } else {
            spawnTimer = Math.max(spawnTimer + 0.18, 0.12)
            break
          }
        }
      }

      return {
        distanceTraveled,
        timeElapsed: state.timeElapsed + deltaSeconds,
        finishLineVisible: finishVisible,
        finishLineY,
        obstacles,
        spawnTimer,
        nextObstacleId,
        obstaclesAvoided: state.obstaclesAvoided + newlyAvoided,
        obstaclesSpawned,
      }
    }),
}))
