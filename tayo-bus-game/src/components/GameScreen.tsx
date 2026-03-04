import type { TouchEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { playLaneChange } from '../audio/audioEngine'
import yellowCarObstacle from '../assets/obstacles/yellow_car.svg'
import redCarObstacle from '../assets/obstacles/red_car.svg'
import blueCarObstacle from '../assets/obstacles/blue_car.svg'
import truckObstacle from '../assets/obstacles/truck.svg'
import fuelCarObstacle from '../assets/obstacles/fuel_car.svg'
import oilSlickObstacle from '../assets/obstacles/oil_slick.svg'
import { characters } from '../data/characters'
import { levels } from '../data/levels'
import { useGameStore } from '../store/gameStore'

const GameScreen = () => {
  const {
    currentLevel,
    playerX,
    fuel,
    isSpinning,
    isBoosting,
    score,
    roadCurveOffset,
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
    crashTimerMs,
    crashY,
    countdownValue,
    isEndless,
    obstaclesAvoided,
    steerLeft,
    steerRight,
    setBoost,
    tick,
    pause,
    resume,
    setGameState,
    setPlayfieldWidth,
  } = useGameStore(
    useShallow((state) => ({
      currentLevel: state.currentLevel,
      playerX: state.playerX,
      fuel: state.fuel,
      isSpinning: state.isSpinning,
      isBoosting: state.isBoosting,
      score: state.score,
      roadCurveOffset: state.roadCurveOffset,
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
      crashTimerMs: state.crashTimerMs,
      crashY: state.crashY,
      countdownValue: state.countdownValue,
      isEndless: state.isEndless,
      obstaclesAvoided: state.obstaclesAvoided,
      steerLeft: state.steerLeft,
      steerRight: state.steerRight,
      setBoost: state.setBoost,
      tick: state.tick,
      pause: state.pause,
      resume: state.resume,
      setGameState: state.setGameState,
      setPlayfieldWidth: state.setPlayfieldWidth,
    }))
  )

  const level = levels.find((entry) => entry.id === currentLevel)
  const profile =
    characters.find((character) => character.id === selectedCharacter) ??
    characters[0]
  const theme = level?.theme ?? levels[0].theme
  const levelDistance = level?.distance ?? finishLineDistance

  const safeFinishLineDistance = Math.max(finishLineDistance, 1)
  const progress = Math.min(distanceTraveled / safeFinishLineDistance, 1)
  const progressPercent = Math.max(0, Math.min(100, Math.round(progress * 100)))
  const distanceRounded = Math.round(distanceTraveled)

  const isCrashing = gameState === 'crashing'
  const raceActive = gameState === 'playing' || isCrashing || gameState === 'countdown'

  const crashFocusX = playerX
  const crashFocusY =
    crashY === null ? 248 : Math.max(60, Math.min(334, crashY + 62))

  const weather = level?.theme.weather ?? 'none'
  const envBg = level?.theme.bg ?? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%)'
  const sceneryColor = level?.theme.sceneryColor ?? '#78716c'
  const busRotation = '180deg'
  const busShadow = '0 12px 20px rgba(15, 23, 42, 0.28)'

  const fuelStatus = fuel > 50 ? 'ok' : fuel >= 20 ? 'warn' : 'critical'

  const obstaclePalette = useMemo(
    () => ({
      yellow_car: { width: 46, height: 90, src: yellowCarObstacle },
      red_car: { width: 46, height: 90, src: redCarObstacle },
      blue_car: { width: 50, height: 90, src: blueCarObstacle },
      truck: { width: 56, height: 130, src: truckObstacle },
      fuel_car: { width: 42, height: 80, src: fuelCarObstacle },
      oil_slick: { width: 60, height: 30, src: oilSlickObstacle },
    }),
    []
  )

  const lastFrameRef = useRef<number | null>(null)
  const swipeStartX = useRef<number | null>(null)
  const swipeStartY = useRef<number | null>(null)
  const keysDown = useRef<Set<string>>(new Set())
  const mobileSteerRef = useRef<'left' | 'right' | null>(null)
  const mobileBoostRef = useRef(false)
  const roadRef = useRef<HTMLDivElement>(null)

  const vibrate = useCallback((ms: number) => {
    try { navigator?.vibrate?.(ms) } catch {}
  }, [])

  useEffect(() => {
    const el = roadRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setPlayfieldWidth(entry.contentRect.width)
    })
    ro.observe(el)
    setPlayfieldWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [setPlayfieldWidth])

  // Keyboard listeners: track held keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'p') {
        event.preventDefault()
        if (gameState === 'playing') {
          pause()
        } else if (gameState === 'paused') {
          resume()
        }
        return
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault()
      }

      keysDown.current.add(event.key)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      keysDown.current.delete(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState, pause, resume])

  // Sync boost state with ArrowUp held
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (gameState !== 'playing') return
      const shouldBoost = keysDown.current.has('ArrowUp') || mobileBoostRef.current
      setBoost(shouldBoost)
    }, 50)
    return () => window.clearInterval(interval)
  }, [gameState, setBoost])

  // Vibrate on crash
  useEffect(() => {
    if (isCrashing) {
      vibrate(200)
    }
  }, [isCrashing, vibrate])

  // rAF game loop
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

      // Continuous steering from held keys or mobile buttons
      if (gameState === 'playing') {
        const deltaSeconds = delta / 1000
        const steerDir = mobileSteerRef.current
        if (keysDown.current.has('ArrowLeft') || steerDir === 'left') {
          steerLeft(deltaSeconds)
        }
        if (keysDown.current.has('ArrowRight') || steerDir === 'right') {
          steerRight(deltaSeconds)
        }
      }

      frameId = requestAnimationFrame(loop)
    }

    frameId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frameId)
      lastFrameRef.current = null
    }
  }, [raceActive, tick, gameState, steerLeft, steerRight])

  // Swipe handlers for mobile
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
        steerRight(0.15)
      } else {
        steerLeft(0.15)
      }
      if (audioEnabled) {
        playLaneChange()
      }
    }
  }

  // Mobile control handlers
  const handleMobileSteerDown = useCallback((direction: 'left' | 'right') => {
    mobileSteerRef.current = direction
    vibrate(30)
  }, [vibrate])

  const handleMobileSteerUp = useCallback(() => {
    mobileSteerRef.current = null
  }, [])

  const handleMobileBoostDown = useCallback(() => {
    mobileBoostRef.current = true
  }, [])

  const handleMobileBoostUp = useCallback(() => {
    mobileBoostRef.current = false
  }, [])

  return (
    <section className="space-y-4 animate-fade-up" aria-label={`Level ${currentLevel} gameplay`}>
      <header className="kid-route-header" aria-label="Level progress">
        <div className="flex items-center gap-3">
          <span className="kid-level-bubble" style={{ background: theme.accent }}>
            <span className="text-2xl">{isEndless ? '∞' : (level?.theme.envIcon ?? '🚌')}</span>
          </span>
          <div className="min-w-0">
            <h2 className="kid-route-title truncate">
              {isEndless ? 'Endless Run' : (level?.name ?? 'Road Run')}
            </h2>
            <p className="kid-route-subtitle">{isEndless ? 'Endless' : `Level ${currentLevel} · ${level?.theme.envLabel ?? 'Route'}`}</p>
          </div>
        </div>

        {/* Fuel gauge */}
        <div className="rf-fuel-gauge">
          <div
            className={`rf-fuel-fill rf-fuel-fill-${fuelStatus}`}
            style={{ width: `${Math.max(0, Math.min(100, fuel))}%` }}
          />
          <span className="rf-fuel-label">⛽ {Math.round(fuel)}%</span>
        </div>

        <div className="kid-progress-strip">
          <div className="kid-progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`Level progress: ${progressPercent}%`}>
            <div
              className="kid-progress-fill"
              style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}dd)` }}
            />
            <span className="kid-progress-bus" style={{ left: `${Math.max(2, Math.min(92, progressPercent))}%` }}>🚌</span>
          </div>
          <div className="flex items-center justify-between">
            {isEndless ? (
              <span className="kid-progress-label">🏃 {distanceRounded}m</span>
            ) : (
              <>
                <span className="kid-progress-label">🏁 {progressPercent}%</span>
                <span className="kid-progress-label">{distanceRounded}m / {levelDistance}m</span>
              </>
            )}
          </div>
        </div>
      </header>

      <div className={`kid-road-frame ${isCrashing ? 'kid-warning-shake crash-screen-shake' : ''}`}>
        <div className="kid-road-info">
          <span className="kid-speed-badge" style={{ background: theme.accent }}>⚡ {Math.round(speed)}</span>
          <span className="kid-traffic-badge">🏆 {Math.round(score)}</span>
          {isBoosting && (
            <span className="kid-speed-badge" style={{ background: '#ef4444', boxShadow: '0 0 12px rgba(239,68,68,0.6)' }}>🔥 BOOST</span>
          )}
          {gameState === 'playing' && (
            <button
              type="button"
              onClick={pause}
              className="kid-speed-badge"
              style={{ background: '#64748b', cursor: 'pointer' }}
              aria-label="Pause game"
            >
              ⏸️ Pause
            </button>
          )}
        </div>

        <div
          ref={roadRef}
          className="bus-road-window touch-pan-y"
          style={{
            background: theme.road,
            transform: `perspective(800px) rotateY(${roadCurveOffset * 0.3}deg)`,
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Road barriers */}
          <div className="rf-road-barrier-left" />
          <div className="rf-road-barrier-right" />

          {/* Environment background strip */}
          <div
            className="absolute left-0 right-0 top-0 h-16 opacity-60"
            style={{ background: envBg }}
          >
            <div className="absolute bottom-0 left-0 right-0 h-8">
              <svg className="h-full w-full" viewBox="0 0 400 32" preserveAspectRatio="none">
                {level?.id === 5 ? (
                  <path d="M0 0 Q200 32 400 0 L400 32 L0 32Z" fill={sceneryColor} opacity="0.6" />
                ) : level?.id === 4 ? (
                  <path d="M0 32 L40 10 L80 22 L130 4 L180 18 L220 8 L270 20 L320 6 L360 16 L400 12 L400 32Z" fill={sceneryColor} opacity="0.5" />
                ) : level?.id === 6 ? (
                  <path d="M0 28 Q50 14 100 22 Q150 10 200 18 Q250 8 300 16 Q350 12 400 20 L400 32 L0 32Z" fill={sceneryColor} opacity="0.5" />
                ) : (
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

          {/* Lane dashes */}
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

          {/* Road progress bar overlay */}
          <div className="absolute left-2 right-2 top-2 z-10">
            <div className="kid-road-progress-bar">
              <div
                className="kid-road-progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #fbbf24, #f97316, #ef4444)',
                }}
              />
            </div>
          </div>

          {/* Speed lines */}
          {speed > 60 && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-[4]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`speed-line-${i}`}
                  className="speed-line"
                  style={{
                    left: `${8 + i * 17}%`,
                    height: `${40 + (i % 3) * 20}px`,
                    animationDelay: `${i * 50}ms`,
                    animationDuration: `${200 + (i % 2) * 100}ms`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative h-[430px]">
            {/* Finish line */}
            {finishLineVisible && finishLineY !== null && (
              <div
                className="absolute left-0 right-0 flex items-center justify-center"
                style={{ top: finishLineY }}
              >
                <div className="kid-finish-line">
                  <span className="kid-finish-text">FINISH</span>
                </div>
              </div>
            )}

            {/* Obstacles */}
            {obstacles.map((obstacle) => {
              const style = obstaclePalette[obstacle.variant as keyof typeof obstaclePalette]
              if (!style) return null
              return (
                <div
                  key={obstacle.id}
                  className="absolute"
                  style={{
                    left: `${obstacle.x}%`,
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

            {/* Crash effects */}
            {isCrashing && (
              <>
                <div className="crash-flash-overlay" />
                <div
                  className="pointer-events-none absolute z-20"
                  style={{
                    left: `${crashFocusX}%`,
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

            {/* Player bus */}
            <div
              className="player-bus-glow absolute bottom-8 transition-[left,transform,box-shadow] duration-75 ease-out"
              style={{
                left: `${playerX}%`,
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
                  isCrashing ? 'bus-crash-shake' : ''
                } ${isSpinning ? 'rf-spinout' : ''}`}
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

          {/* Countdown overlay */}
          {gameState === 'countdown' && (
            <div className="countdown-overlay">
              <span key={countdownValue} className={countdownValue > 0 ? 'countdown-number' : 'countdown-go'}>
                {countdownValue > 0 ? countdownValue : 'GO!'}
              </span>
            </div>
          )}

          {/* Pause overlay */}
          {gameState === 'paused' && (
            <div className="pause-overlay">
              <span className="pause-title">⏸️ Paused</span>
              <button type="button" onClick={resume} className="pause-btn pause-btn-resume">
                ▶️ Resume
              </button>
              <button
                type="button"
                onClick={() => setGameState('levelSelect')}
                className="pause-btn pause-btn-quit"
              >
                🚪 Quit to Menu
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard */}
      <div className="kid-dashboard" role="status" aria-label="Game stats and controls">
        <div className="kid-stats-row">
          <div className="kid-stat-bubble" style={{ borderColor: theme.accent }}>
            <span className="text-2xl">⚡</span>
            <span className="kid-stat-number" style={{ color: theme.accent }}>{Math.round(speed)}</span>
          </div>
          <div className="kid-stat-bubble" style={{ borderColor: '#34d399' }}>
            <span className="text-2xl">⛽</span>
            <span className="kid-stat-number" style={{ color: '#34d399' }}>{Math.round(fuel)}</span>
          </div>
          <div className="kid-stat-bubble" style={{ borderColor: '#fbbf24' }}>
            <span className="text-2xl">🏆</span>
            <span className="kid-stat-number" style={{ color: '#fbbf24' }}>{Math.round(score)}</span>
          </div>
          <div className="kid-stat-bubble" style={{ borderColor: '#818cf8' }}>
            <span className="text-2xl">⏱️</span>
            <span className="kid-stat-number" style={{ color: '#818cf8' }}>{Math.round(timeElapsed)}s</span>
          </div>
          {isBoosting && (
            <div className="kid-stat-bubble" style={{ borderColor: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.4)' }}>
              <span className="text-2xl">🔥</span>
              <span className="kid-stat-number" style={{ color: '#ef4444' }}>BOOST</span>
            </div>
          )}
          {isCrashing && (
            <div className="kid-stat-bubble kid-crash-bubble">
              <span className="text-2xl">💥</span>
              <span className="kid-stat-number text-rose-500">Oh no!</span>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="kid-controls">
          <button
            type="button"
            onPointerDown={() => handleMobileSteerDown('left')}
            onPointerUp={handleMobileSteerUp}
            onPointerLeave={handleMobileSteerUp}
            onPointerCancel={handleMobileSteerUp}
            disabled={isCrashing}
            className="kid-drive-btn kid-drive-btn-left"
            aria-label="Steer left"
          >
            <span className="kid-drive-arrow">👈</span>
          </button>
          <div className="kid-drive-center">
            <button
              type="button"
              onPointerDown={handleMobileBoostDown}
              onPointerUp={handleMobileBoostUp}
              onPointerLeave={handleMobileBoostUp}
              onPointerCancel={handleMobileBoostUp}
              disabled={isCrashing}
              className="kid-drive-btn"
              style={{
                background: isBoosting
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #f97316, #ea580c)',
                minWidth: 56,
                minHeight: 56,
                borderRadius: '50%',
              }}
              aria-label="Boost"
            >
              <span className="text-2xl">🔥</span>
            </button>
          </div>
          <button
            type="button"
            onPointerDown={() => handleMobileSteerDown('right')}
            onPointerUp={handleMobileSteerUp}
            onPointerLeave={handleMobileSteerUp}
            onPointerCancel={handleMobileSteerUp}
            disabled={isCrashing}
            className="kid-drive-btn kid-drive-btn-right"
            aria-label="Steer right"
          >
            <span className="kid-drive-arrow">👉</span>
          </button>
        </div>

        <p className="kid-hint">
          Hold arrows to steer! 🏎️
        </p>
      </div>
    </section>
  )
}

export default GameScreen
