import { levels } from '../data/levels'
import { useGameStore } from '../store/gameStore'

const confettiPieces = [
  { left: '6%', size: 8, color: '#f97316', delay: '0ms', duration: '1700ms' },
  { left: '14%', size: 6, color: '#22c55e', delay: '300ms', duration: '1500ms' },
  { left: '22%', size: 10, color: '#38bdf8', delay: '120ms', duration: '1800ms' },
  { left: '31%', size: 7, color: '#facc15', delay: '500ms', duration: '1600ms' },
  { left: '42%', size: 9, color: '#fb7185', delay: '240ms', duration: '1900ms' },
  { left: '52%', size: 6, color: '#a855f7', delay: '80ms', duration: '1700ms' },
  { left: '61%', size: 8, color: '#34d399', delay: '420ms', duration: '1550ms' },
  { left: '70%', size: 10, color: '#60a5fa', delay: '180ms', duration: '1850ms' },
  { left: '78%', size: 7, color: '#fbbf24', delay: '360ms', duration: '1650ms' },
  { left: '88%', size: 9, color: '#fb7185', delay: '260ms', duration: '1750ms' },
  { left: '94%', size: 6, color: '#f97316', delay: '600ms', duration: '1500ms' },
]

const VictoryScreen = () => {
  const currentLevel = useGameStore((state) => state.currentLevel)
  const setGameState = useGameStore((state) => state.setGameState)
  const resetRun = useGameStore((state) => state.resetRun)
  const startLevel = useGameStore((state) => state.startLevel)
  const lastRunStats = useGameStore((state) => state.lastRunStats)

  const hasNextLevel = currentLevel < levels.length
  const minutes = Math.floor(lastRunStats.timeElapsed / 60)
  const seconds = Math.floor(lastRunStats.timeElapsed % 60)
  const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const stars = lastRunStats.stars

  return (
    <section className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] animate-fade-up">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {confettiPieces.map((piece, index) => (
          <span
            key={`${piece.left}-${index}`}
            className="confetti-piece"
            style={{
              left: piece.left,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
            }}
          />
        ))}
      </div>
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500">
          Level Complete
        </p>
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          You cleared Level {currentLevel}!
        </h2>
        <p className="max-w-lg text-sm text-slate-600 sm:text-base">
          Great driving. Score stars and unlock the next route.
        </p>

        <div className="flex items-center gap-2 text-2xl text-yellow-400">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={index < stars ? 'text-yellow-400' : 'text-slate-300'}
            >
              ★
            </span>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 shadow">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Time
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">{timeLabel}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Avoided
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {lastRunStats.obstaclesAvoided}
              {lastRunStats.obstaclesSpawned > 0 && (
                <span className="text-sm font-semibold text-slate-400">
                  {' '}
                  / {lastRunStats.obstaclesSpawned}
                </span>
              )}
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Stars
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">{stars}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/60 bg-white/85 p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-900 sm:text-xl">Next steps</h3>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              if (hasNextLevel) {
                startLevel(currentLevel + 1)
              } else {
                setGameState('levelSelect')
              }
            }}
            className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            {hasNextLevel ? 'Next Level' : 'Level Select'}
          </button>
          <button
            type="button"
            onClick={resetRun}
            className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Replay Level
          </button>
          <button
            type="button"
            onClick={() => setGameState('menu')}
            className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Change Character
          </button>
        </div>
      </div>
    </section>
  )
}

export default VictoryScreen
