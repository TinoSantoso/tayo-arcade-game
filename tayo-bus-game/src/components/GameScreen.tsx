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
      motorcycle: { width: 40, height: 90, src: motorcycleObstacle },
      car: { width: 56, height: 112, src: carObstacle },
      truck: { width: 70, height: 160, src: truckObstacle },
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
    <section className="space-y-5 animate-fade-up">
      <header className="bus-route-strip relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(135deg, currentColor 0 2px, transparent 2px 12px)' }} />
        <div className="relative flex min-w-0 items-center gap-3">
          <span className="bus-route-badge" style={{ background: theme.accent, color: '#fff' }}>{routeCode}</span>
          <div className="min-w-0">
            <p className="bus-strip-label">{level?.theme.envIcon} Current Route</p>
            <h2 className="truncate text-xl font-bold text-slate-950 sm:text-2xl">
              {level?.name ?? 'Road Run'}
            </h2>
          </div>
        </div>

        <div className="relative bus-strip-right">
          <div className="bus-segment-track" role="presentation">
            <div
              className="bus-segment-fill"
              style={{ width: `${progressPercent}%`, backgroundColor: theme.accent }}
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 sm:text-xs">
            <span className="truncate">{level?.theme.envLabel ?? 'Route'} {progressPercent >= 100 ? '🏁 Terminal' : ''}</span>
            <span className="tabular-nums">{distanceRounded}m / {levelDistance}m</span>
          </div>
        </div>
      </header>

      <div className={`bus-road-frame ${isCrashing ? 'bus-warning-live' : ''}`}>
        <div className="bus-road-header">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: theme.accent, boxShadow: `0 0 8px ${theme.accent}` }} />
            Level {currentLevel}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 sm:text-xs">
            <span>⚡ {speedLabel} m/s</span>
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            <span style={{ color: theme.accent }}>🚦 {level?.obstacleFrequency ?? 'low'}</span>
          </div>
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

          <div className="absolute left-3 right-3 top-3 z-10 rounded-2xl bg-black/30 p-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{progressPercent}%</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}dd)`,
                    boxShadow: `0 0 12px ${theme.accent}88`,
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-white/80">{distanceRounded}m</span>
            </div>
          </div>

          <div className="relative h-[430px]">
            {finishLineVisible && finishLineY !== null && (
              <div
                className="absolute left-0 right-0 flex items-center justify-center"
                style={{ top: finishLineY }}
              >
                <div className="relative flex w-full max-w-[92%] items-center gap-3 rounded-full border-2 border-white/70 bg-white/95 px-4 py-2 shadow-xl">
                  <div
                    className="absolute -left-6 top-1/2 h-16 w-3 -translate-y-1/2 rounded-full shadow-md"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <div
                    className="absolute -right-6 top-1/2 h-16 w-3 -translate-y-1/2 rounded-full shadow-md"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <div className="h-7 flex-1 rounded-full bg-[linear-gradient(90deg,_#111827_0_8%,_#f8fafc_8%_16%,_#111827_16%_24%,_#f8fafc_24%_32%,_#111827_32%_40%,_#f8fafc_40%_48%,_#111827_48%_56%,_#f8fafc_56%_64%,_#111827_64%_72%,_#f8fafc_72%_80%,_#111827_80%_88%,_#f8fafc_88%_96%,_#111827_96%_100%)]" />
                  <span className="text-xs font-bold uppercase tracking-[0.5em] text-slate-900">
                    Finish
                  </span>
                  <div className="h-7 flex-1 rounded-full bg-[linear-gradient(90deg,_#111827_0_8%,_#f8fafc_8%_16%,_#111827_16%_24%,_#f8fafc_24%_32%,_#111827_32%_40%,_#f8fafc_40%_48%,_#111827_48%_56%,_#f8fafc_56%_64%,_#111827_64%_72%,_#f8fafc_72%_80%,_#111827_80%_88%,_#f8fafc_88%_96%,_#111827_96%_100%)]" />
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
                width: 68,
                height: 150,
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

      <div className="bus-dashboard-strip">
        <div className="bus-dashboard-grid">
          <article className="bus-meter-card group">
            <p className="bus-meter-label">⚡ Speed</p>
            <p className="bus-meter-value" style={{ color: theme.accent }}>{Math.round(speed)} m/s</p>
            <div className="bus-meter-track">
              <div
                className="bus-meter-fill"
                style={{ width: `${speedGaugePercent}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}cc)` }}
              />
            </div>
          </article>

          <article className="bus-meter-card">
            <p className="bus-meter-label">⏱ Run Time</p>
            <p className="bus-meter-value">{timeElapsed.toFixed(1)}s</p>
            <p className={`text-xs font-semibold ${timeElapsed <= parTime * 1.1 ? 'text-emerald-500' : timeElapsed <= parTime * 1.35 ? 'text-amber-500' : 'text-rose-500'}`}>
              🎯 Par {parTime.toFixed(1)}s
            </p>
          </article>

          <article className="bus-meter-card">
            <p className="bus-meter-label">📍 Route Progress</p>
            <p className="bus-meter-value">{progressPercent}%</p>
            <p className="text-xs font-semibold text-slate-500">{distanceRounded}m / {levelDistance}m</p>
          </article>

          <article className="bus-meter-card">
            <p className="bus-meter-label">🛡 Obstacles Avoided</p>
            <p className="bus-meter-value">{obstaclesAvoided}</p>
            {isCrashing ? (
              <p className="text-xs font-bold text-rose-500 animate-pulse">
                💥 Impact {Math.ceil(crashTimerMs)}ms
              </p>
            ) : (
              <p className="text-xs font-semibold text-emerald-500">✅ Driving stable</p>
            )}
          </article>
        </div>

        <div className="bus-control-panel">
          <div className="bus-signal-row" role="presentation">
            <span
              className={`bus-lamp ${
                visibleTurnSignal === 'left' ? 'bus-lamp-on' : ''
              }`}
            >
              ◀
            </span>
            <span className={`bus-lamp ${isCrashing ? 'bus-lamp-warning' : ''}`}>
              !
            </span>
            <span
              className={`bus-lamp ${
                visibleTurnSignal === 'right' ? 'bus-lamp-on' : ''
              }`}
            >
              ▶
            </span>
          </div>

          <div className="bus-lane-indicator" role="presentation">
            {lanePositions.map((_, index) => (
              <span
                key={`lane-indicator-${index}`}
                className={`bus-lane-dot ${playerLane === index ? 'is-active' : ''}`}
              />
            ))}
          </div>

          <div className="grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleMoveLeft}
              disabled={isCrashing}
              className="bus-drive-button group"
            >
              <span className="text-lg transition-transform group-active:scale-90">◀</span>
              <span>Left</span>
            </button>
            <button
              type="button"
              onClick={handleMoveRight}
              disabled={isCrashing}
              className="bus-drive-button group"
            >
              <span>Right</span>
              <span className="text-lg transition-transform group-active:scale-90">▶</span>
            </button>
          </div>

          <p className="bus-control-hint">
            ⌨️ <span className="font-bold">← / →</span> · 📱 swipe or tap lane
          </p>
        </div>
      </div>
    </section>
  )
}

export default GameScreen
