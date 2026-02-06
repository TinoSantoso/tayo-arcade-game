import type { TouchEvent } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { playLaneChange } from '../audio/audioEngine'
import busObstacle from '../assets/obstacles/bus.svg'
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
    }))
  )

  const level = levels.find((entry) => entry.id === currentLevel)
  const profile =
    characters.find((character) => character.id === selectedCharacter) ??
    characters[0]
  const theme = level?.theme ?? levels[0].theme
  const speedLabel =
    level && Number.isInteger(level.baseSpeed)
      ? level.baseSpeed
      : level?.baseSpeed?.toFixed(1) ?? '0'
  const progress = Math.min(distanceTraveled / finishLineDistance, 1)
  const progressPercent = Math.round(progress * 100)
  const lanePositions = useMemo(() => ['16.5%', '50%', '83.5%'], [])
  const lastFrameRef = useRef<number | null>(null)
  const swipeStartX = useRef<number | null>(null)
  const swipeStartY = useRef<number | null>(null)
  const laneSoundReady = useRef(false)
  const previousLane = useRef<0 | 1 | 2 | null>(null)
  const obstaclePalette = useMemo(
    () => ({
      motorcycle: { width: 34, height: 88, src: motorcycleObstacle },
      car: { width: 50, height: 110, src: carObstacle },
      bus: { width: 60, height: 140, src: busObstacle },
      truck: { width: 64, height: 150, src: truckObstacle },
    }),
    []
  )
  const busRotation = '180deg'
  const busShadow = '0 12px 20px rgba(15, 23, 42, 0.28)'

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

    if (previousLane.current !== playerLane && audioEnabled) {
      playLaneChange()
    }
    previousLane.current = playerLane
  }, [audioEnabled, gameState, playerLane])

  useEffect(() => {
    if (gameState !== 'playing') {
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
  }, [gameState, tick])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (gameState !== 'playing') {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        moveLeft()
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        moveRight()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [gameState, moveLeft, moveRight])

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
        moveRight()
      } else {
        moveLeft()
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
        moveLeft()
      } else if (tappedLane > playerLane) {
        moveRight()
      }
    }
  }

  return (
    <section className="space-y-6 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
            Level {currentLevel}
          </p>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {level?.name ?? 'Road Run'}
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            Distance {level?.distance ?? 0}m • Speed {speedLabel}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow sm:text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
          Progress {progressPercent}% • {Math.round(distanceTraveled)}m
        </div>
      </header>

      <div className="relative grid gap-6 lg:grid-cols-[2.2fr_0.8fr]">
        <div
          className="relative overflow-hidden rounded-[2.5rem] border-4 border-slate-900 shadow-2xl touch-pan-y"
          style={{ background: theme.road }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.08),_transparent)]" />
          <div className="absolute inset-0">
            <div
              className="lane-dash-flow absolute left-[33.5%] top-0 h-full w-2 -translate-x-1/2 opacity-60"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, rgba(255,255,255,0.75) 0 16px, rgba(255,255,255,0) 16px 36px)',
              }}
            />
            <div
              className="lane-dash-flow absolute left-[66.5%] top-0 h-full w-2 -translate-x-1/2 opacity-60"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, rgba(255,255,255,0.75) 0 16px, rgba(255,255,255,0) 16px 36px)',
              }}
            />
            <div className="absolute left-4 top-0 h-full w-1 rounded-full bg-white/40" />
            <div className="absolute right-4 top-0 h-full w-1 rounded-full bg-white/40" />
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
          <div className="absolute left-4 right-4 top-4 rounded-full bg-white/20 p-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: theme.accent,
                }}
              />
            </div>
          </div>
          <div className="relative h-[420px]">
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
                <img
                  key={obstacle.id}
                  src={style.src}
                  alt={obstacle.variant}
                  className="absolute drop-shadow-lg"
                  style={{
                    left: lanePositions[obstacle.lane],
                    top: obstacle.y,
                    width: style.width,
                    height: style.height,
                    transform: 'translateX(-50%)',
                  }}
                  draggable={false}
                />
              )
            })}
            <div
              key={`player-${playerLane}`}
              className="absolute bottom-8 transition-[left,transform,box-shadow] duration-200 ease-out"
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
                className="lane-bump h-full w-full object-contain"
                draggable={false}
              />
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

        <aside className="hidden space-y-4 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-lg lg:block">
          <h3 className="text-lg font-bold text-slate-900">Controls</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>Desktop: ← / → to change lanes</p>
            <p>Mobile: swipe or tap the lane area</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={moveLeft}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Move Left
            </button>
            <button
              type="button"
              onClick={moveRight}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Move Right
            </button>
          </div>
          <div className="rounded-2xl bg-slate-900/5 p-4 text-sm text-slate-600">
            <p>
              Distance: {Math.round(distanceTraveled)}m / {finishLineDistance}m
            </p>
            <p>Time: {timeElapsed.toFixed(1)}s</p>
            <p>Speed: {Math.round(speed)} m/s</p>
            <p>Avoided: {obstaclesAvoided}</p>
          </div>
        </aside>
      </div>

      <div className="grid gap-3 rounded-3xl border border-white/60 bg-white/85 p-4 shadow-lg lg:hidden">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Swipe or tap lanes
        </p>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-900/5 p-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          <span>Time {timeElapsed.toFixed(1)}s</span>
          <span>{Math.round(distanceTraveled)}m</span>
          <span>Avoided {obstaclesAvoided}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={moveLeft}
            className="rounded-2xl border border-slate-300 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            ◀ Left
          </button>
          <button
            type="button"
            onClick={moveRight}
            className="rounded-2xl border border-slate-300 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Right ▶
          </button>
        </div>
      </div>
    </section>
  )
}

export default GameScreen
