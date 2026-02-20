import type { TouchEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { playLaneChange } from '../audio/audioEngine'
import carObstacle from '../assets/obstacles/car.svg'
import motorcycleObstacle from '../assets/obstacles/motorcycle.svg'
import truckObstacle from '../assets/obstacles/truck.svg'
import { characters } from '../data/characters'
import { levels } from '../data/levels'
import { useGameStore } from '../store/gameStore'

const GameScreen = () => {
  const {
    currentLevel,
    playerLane,
    distanceTraveled,
    finishLineDistance,
    finishLineVisible,
    finishLineY,
    timeElapsed,
    speed,
    obstacles,
    selectedCharacter,
    gameState,
    audioEnabled,
    moveLeft,
    moveRight,
    tick,
    obstaclesAvoided,
    crashTimerMs,
    crashLane,
    crashY,
  } = useGameStore(
    useShallow((state) => ({
      currentLevel: state.currentLevel,
      playerLane: state.playerLane,
      distanceTraveled: state.distanceTraveled,
      finishLineDistance: state.finishLineDistance,
      finishLineVisible: state.finishLineVisible,
      finishLineY: state.finishLineY,
      timeElapsed: state.timeElapsed,
      speed: state.speed,
      obstacles: state.obstacles,
      selectedCharacter: state.selectedCharacter,
      gameState: state.gameState,
      audioEnabled: state.audioEnabled,
      moveLeft: state.moveLeft,
      moveRight: state.moveRight,
      tick: state.tick,
      obstaclesAvoided: state.obstaclesAvoided,
      crashTimerMs: state.crashTimerMs,
      crashLane: state.crashLane,
      crashY: state.crashY,
    }))
  )

  const level = levels.find((entry) => entry.id === currentLevel)
  const profile =
    characters.find((character) => character.id === selectedCharacter) ??
    characters[0]
  const theme = level?.theme ?? levels[0].theme
  const levelDistance = level?.distance ?? finishLineDistance
  const speedLabel =
    level && Number.isInteger(level.baseSpeed)
      ? level.baseSpeed
      : level?.baseSpeed?.toFixed(1) ?? '0'

  const safeFinishLineDistance = Math.max(finishLineDistance, 1)
  const progress = Math.min(distanceTraveled / safeFinishLineDistance, 1)
  const progressPercent = Math.max(0, Math.min(100, Math.round(progress * 100)))
  const distanceRounded = Math.round(distanceTraveled)
  const routeCode = `R-${String(currentLevel).padStart(2, '0')}`
  const speedGaugePercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (speed /
          Math.max(1, (typeof level?.baseSpeed === 'number' ? level.baseSpeed : 1) *
            1.9)) *
          100
      )
    )
  )

  const lanePositions = useMemo(() => ['16.5%', '50%', '83.5%'], [])
  const lastFrameRef = useRef<number | null>(null)
  const swipeStartX = useRef<number | null>(null)
  const swipeStartY = useRef<number | null>(null)
  const laneSoundReady = useRef(false)
  const previousLane = useRef<0 | 1 | 2 | null>(null)
  const signalTimerRef = useRef<number | null>(null)
  const [turnSignal, setTurnSignal] = useState<'left' | 'right' | null>(null)

  const obstaclePalette = useMemo(
    () => ({
      motorcycle: { width: 32, height: 72, src: motorcycleObstacle },
      car: { width: 46, height: 90, src: carObstacle },
      truck: { width: 56, height: 130, src: truckObstacle },
    }),
    []
  )

  const weather = level?.theme.weather ?? 'none'
  const envBg = level?.theme.bg ?? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%)'
  const sceneryColor = level?.theme.sceneryColor ?? '#78716c'
  const parTime = levelDistance / (level?.baseSpeed ?? 3) / 12
  const busRotation = '180deg'
  const busShadow = '0 12px 20px rgba(15, 23, 42, 0.28)'
  const isCrashing = gameState === 'crashing'
  const raceActive = gameState === 'playing' || isCrashing
  const visibleTurnSignal = gameState === 'playing' ? turnSignal : null
  const crashFocusLane = crashLane ?? playerLane
  const crashFocusY =
    crashY === null ? 248 : Math.max(60, Math.min(334, crashY + 62))

  const flashTurnSignal = useCallback((direction: 'left' | 'right') => {
    setTurnSignal(direction)
    if (signalTimerRef.current !== null) {
      window.clearTimeout(signalTimerRef.current)
    }
    signalTimerRef.current = window.setTimeout(() => {
      setTurnSignal(null)
      signalTimerRef.current = null
    }, 420)
  }, [])

  const handleMoveLeft = useCallback(() => {
    if (gameState !== 'playing') {
      return
    }
    if (playerLane > 0) {
      flashTurnSignal('left')
    }
    moveLeft()
  }, [flashTurnSignal, gameState, moveLeft, playerLane])

  const handleMoveRight = useCallback(() => {
    if (gameState !== 'playing') {
      return
    }
    if (playerLane < 2) {
      flashTurnSignal('right')
    }
    moveRight()
  }, [flashTurnSignal, gameState, moveRight, playerLane])

  useEffect(() => {
    return () => {
      if (signalTimerRef.current !== null) {
        window.clearTimeout(signalTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (gameState !== 'playing') {
      laneSoundReady.current = false
      previousLane.current = null
      return
    }

    if (!laneSoundReady.current) {
      laneSoundReady.current = true
      previousLane.current = playerLane
      return
    }

    if (previousLane.current !== playerLane) {
      if (audioEnabled) {
        playLaneChange()
      }
    }

    previousLane.current = playerLane
  }, [audioEnabled, gameState, playerLane])

  useEffect(() => {
    if (!raceActive) {
      return
    }

    let frameId = 0
    const loop = (time: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = time
      }
      const delta = time - lastFrameRef.current
      lastFrameRef.current = time
      tick(delta)
      frameId = requestAnimationFrame(loop)
    }

    frameId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frameId)
      lastFrameRef.current = null
    }
  }, [raceActive, tick])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (gameState !== 'playing') {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handleMoveLeft()
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleMoveRight()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [gameState, handleMoveLeft, handleMoveRight])

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') {
      return
    }
    const touch = event.touches[0]
    swipeStartX.current = touch.clientX
    swipeStartY.current = touch.clientY
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') {
      return
    }
    if (swipeStartX.current === null || swipeStartY.current === null) {
      return
    }
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - swipeStartX.current
    const deltaY = touch.clientY - swipeStartY.current
    swipeStartX.current = null
    swipeStartY.current = null

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const isSwipe = absX >= 42 && absX > absY + 8

    if (isSwipe) {
      if (deltaX > 0) {
        handleMoveRight()
      } else {
        handleMoveLeft()
      }
      return
    }

    const isTap = absX <= 14 && absY <= 14
    if (isTap) {
      const bounds = event.currentTarget.getBoundingClientRect()
      if (bounds.width <= 0) {
        return
      }
      const relativeX = touch.clientX - bounds.left
      const rawLane = Math.floor((relativeX / bounds.width) * 3)
      const tappedLane = Math.max(0, Math.min(2, rawLane)) as 0 | 1 | 2
      if (tappedLane < playerLane) {
        handleMoveLeft()
      } else if (tappedLane > playerLane) {
        handleMoveRight()
      }
    }
  }

  return (
    <section className="space-y-4 animate-fade-up">
      <header className="kid-route-header">
        <div className="flex items-center gap-3">
          <span className="kid-level-bubble" style={{ background: theme.accent }}>
            <span className="text-2xl">{level?.theme.envIcon ?? '🚌'}</span>
          </span>
          <div className="min-w-0">
            <h2 className="kid-route-title truncate">
              {level?.name ?? 'Road Run'}
            </h2>
            <p className="kid-route-subtitle">Level {currentLevel} · {level?.theme.envLabel ?? 'Route'}</p>
          </div>
        </div>
        <div className="kid-progress-strip">
          <div className="kid-progress-track">
            <div
              className="kid-progress-fill"
              style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}dd)` }}
            />
            <span className="kid-progress-bus" style={{ left: `${Math.max(2, Math.min(92, progressPercent))}%` }}>🚌</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="kid-progress-label">🏁 {progressPercent}%</span>
            <span className="kid-progress-label">{distanceRounded}m / {levelDistance}m</span>
          </div>
        </div>
      </header>

      <div className={`kid-road-frame ${isCrashing ? 'kid-warning-shake' : ''}`}>
        <div className="kid-road-info">
          <span className="kid-speed-badge" style={{ background: theme.accent }}>⚡ {Math.round(speed)}</span>
          <span className="kid-traffic-badge">🚗 {level?.obstacleFrequency === 'high' ? 'Busy!' : level?.obstacleFrequency === 'medium' ? 'Watch out!' : 'Easy!'}</span>
        </div>

        <div
          className="bus-road-window touch-pan-y"
          style={{ background: theme.road }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Environment background strip */}
          <div
            className="absolute left-0 right-0 top-0 h-16 opacity-60"
            style={{ background: envBg }}
          >
            {/* Scenery silhouettes */}
            <div className="absolute bottom-0 left-0 right-0 h-8">
              <svg className="h-full w-full" viewBox="0 0 400 32" preserveAspectRatio="none">
                {level?.id === 5 ? (
                  /* Tunnel: arch ceiling */
                  <path d="M0 0 Q200 32 400 0 L400 32 L0 32Z" fill={sceneryColor} opacity="0.6" />
                ) : level?.id === 4 ? (
                  /* Mountain: peaks */
                  <path d="M0 32 L40 10 L80 22 L130 4 L180 18 L220 8 L270 20 L320 6 L360 16 L400 12 L400 32Z" fill={sceneryColor} opacity="0.5" />
                ) : level?.id === 6 ? (
                  /* Countryside: rolling hills */
                  <path d="M0 28 Q50 14 100 22 Q150 10 200 18 Q250 8 300 16 Q350 12 400 20 L400 32 L0 32Z" fill={sceneryColor} opacity="0.5" />
                ) : (
                  /* City/Road: buildings */
                  <path d="M0 32 L0 18 L20 18 L20 10 L40 10 L40 20 L60 20 L60 6 L80 6 L80 14 L110 14 L110 22 L140 22 L140 8 L160 8 L160 18 L190 18 L190 12 L210 12 L210 24 L240 24 L240 4 L260 4 L260 16 L290 16 L290 10 L310 10 L310 20 L340 20 L340 14 L360 14 L360 26 L380 26 L380 8 L400 8 L400 32Z" fill={sceneryColor} opacity="0.4" />
                )}
              </svg>
            </div>
          </div>

          {/* Weather particles */}
          {weather !== 'none' && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-[5]">
              {Array.from({ length: weather === 'rain' ? 20 : 12 }).map((_, i) => (
                <span
                  key={`weather-${i}`}
                  className={`weather-particle weather-${weather}`}
                  style={{
                    left: `${(i * 8.3 + 2) % 100}%`,
                    animationDelay: `${(i * 137) % 1800}ms`,
                    animationDuration: weather === 'rain' ? '600ms' : weather === 'dust' ? '2200ms' : '1800ms',
                  }}
                />
              ))}
            </div>
          )}

          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.08),_transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(15,23,42,0.12)_0%,_transparent_22%,_transparent_78%,_rgba(15,23,42,0.12)_100%)]" />
          <div className="absolute inset-0">
            <div
              className="lane-dash-flow absolute left-[33.5%] top-0 h-full w-1.5 -translate-x-1/2 opacity-75"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, rgba(255,255,255,0.82) 0 16px, rgba(255,255,255,0) 16px 36px)',
              }}
            />
            <div
              className="lane-dash-flow absolute left-[66.5%] top-0 h-full w-1.5 -translate-x-1/2 opacity-75"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, rgba(255,255,255,0.82) 0 16px, rgba(255,255,255,0) 16px 36px)',
              }}
            />
            <div className="absolute left-4 top-0 h-full w-1 rounded-full bg-white/35" />
            <div className="absolute right-4 top-0 h-full w-1 rounded-full bg-white/35" />
          </div>

          <div className="absolute inset-0 flex">
            <div
              className="flex-1 border-r-2 border-dashed"
              style={{ borderColor: theme.lane }}
            />
            <div
              className="flex-1 border-r-2 border-dashed"
              style={{ borderColor: theme.lane }}
            />
            <div className="flex-1" />
          </div>

          <div className="absolute left-2 right-2 top-2 z-10">
            <div className="kid-road-progress-bar">
              <div
                className="kid-road-progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  background: `linear-gradient(90deg, #fbbf24, #f97316, #ef4444)`,
                }}
              />
            </div>
          </div>

          <div className="relative h-[430px]">
            {finishLineVisible && finishLineY !== null && (
              <div
                className="absolute left-0 right-0 flex items-center justify-center"
                style={{ top: finishLineY }}
              >
                <div className="kid-finish-line">
                  <span className="text-xl">🏁</span>
                  <span className="kid-finish-text">FINISH!</span>
                  <span className="text-xl">🏁</span>
                </div>
              </div>
            )}

            {obstacles.map((obstacle) => {
              const style = obstaclePalette[obstacle.variant]
              return (
                <div
                  key={obstacle.id}
                  className="absolute"
                  style={{
                    left: lanePositions[obstacle.lane],
                    top: obstacle.y,
                    width: style.width,
                    height: style.height,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <img
                    src={style.src}
                    alt={obstacle.variant}
                    className={`obstacle-2d obstacle-vehicle obstacle-${obstacle.variant} h-full w-full`}
                    draggable={false}
                  />
                </div>
              )
            })}

            {isCrashing && (
              <>
                <div className="crash-flash-overlay" />
                <div
                  className="pointer-events-none absolute z-20"
                  style={{
                    left: lanePositions[crashFocusLane],
                    top: crashFocusY,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span className="crash-impact-ring" />
                  <span
                    className="crash-impact-ring"
                    style={{ animationDelay: '120ms' }}
                  />
                  <span className="crash-smoke h-3 w-3 left-[-24px] top-[-12px]" />
                  <span
                    className="crash-smoke h-4 w-4 left-[12px] top-[-8px]"
                    style={{ animationDelay: '80ms' }}
                  />
                  <span
                    className="crash-smoke h-2.5 w-2.5 left-[-8px] top-[8px]"
                    style={{ animationDelay: '160ms' }}
                  />
                </div>
              </>
            )}

            <div
              key={`player-${playerLane}`}
              className="player-bus-glow absolute bottom-8 transition-[left,transform,box-shadow] duration-200 ease-out"
              style={{
                left: lanePositions[playerLane],
                width: 58,
                height: 128,
                boxShadow: busShadow,
                transform: `translateX(-50%) rotate(${busRotation})`,
              }}
            >
              <img
                src={profile.topDown}
                alt={profile.name}
                className={`h-full w-full object-contain ${
                  isCrashing ? 'bus-crash-shake' : 'lane-bump'
                }`}
                draggable={false}
              />
              <span className="player-headlight-glint player-headlight-glint-left" />
              <span className="player-headlight-glint player-headlight-glint-right" />
              <span
                className="sparkle left-2 top-6 h-2 w-2 bg-white/80"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="sparkle bottom-6 right-3 h-1.5 w-1.5 bg-white/70"
                style={{ animationDelay: '260ms' }}
              />
              <span
                className="sparkle -top-2 right-6 h-2.5 w-2.5 bg-white/70"
                style={{ animationDelay: '520ms' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="kid-dashboard">
        <div className="kid-stats-row">
          <div className="kid-stat-bubble" style={{ borderColor: theme.accent }}>
            <span className="text-2xl">⚡</span>
            <span className="kid-stat-number" style={{ color: theme.accent }}>{Math.round(speed)}</span>
          </div>
          <div className="kid-stat-bubble" style={{ borderColor: '#818cf8' }}>
            <span className="text-2xl">⏱️</span>
            <span className="kid-stat-number" style={{ color: '#818cf8' }}>{Math.round(timeElapsed)}s</span>
          </div>
          <div className="kid-stat-bubble" style={{ borderColor: '#34d399' }}>
            <span className="text-2xl">⭐</span>
            <span className="kid-stat-number" style={{ color: '#34d399' }}>{obstaclesAvoided}</span>
          </div>
          {isCrashing && (
            <div className="kid-stat-bubble kid-crash-bubble">
              <span className="text-2xl">💥</span>
              <span className="kid-stat-number text-rose-500">Oh no!</span>
            </div>
          )}
        </div>

        <div className="kid-lane-dots" role="presentation">
          {lanePositions.map((_, index) => (
            <span
              key={`lane-indicator-${index}`}
              className={`kid-lane-pip ${playerLane === index ? 'kid-lane-pip-active' : ''}`}
              style={playerLane === index ? { background: theme.accent, borderColor: theme.accent } : undefined}
            />
          ))}
        </div>

        <div className="kid-controls">
          <button
            type="button"
            onClick={handleMoveLeft}
            disabled={isCrashing}
            className="kid-drive-btn kid-drive-btn-left"
          >
            <span className="kid-drive-arrow">👈</span>
          </button>
          <div className="kid-drive-center">
            <span className={`text-3xl ${isCrashing ? 'kid-crash-shake' : 'kid-bounce'}`}>
              {isCrashing ? '😵' : '😊'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleMoveRight}
            disabled={isCrashing}
            className="kid-drive-btn kid-drive-btn-right"
          >
            <span className="kid-drive-arrow">👉</span>
          </button>
        </div>

        <p className="kid-hint">
          Swipe or tap the big buttons! 🎮
        </p>
      </div>
    </section>
  )
}

export default GameScreen
