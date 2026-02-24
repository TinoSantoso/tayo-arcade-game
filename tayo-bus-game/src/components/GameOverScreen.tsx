import { useGameStore } from '../store/gameStore'

const GameOverScreen = () => {
  const setGameState = useGameStore((state) => state.setGameState)
  const resetRun = useGameStore((state) => state.resetRun)
  const distanceTraveled = useGameStore((state) => state.distanceTraveled)
  const finishLineDistance = useGameStore((state) => state.finishLineDistance)
  const progress = finishLineDistance
    ? Math.min(distanceTraveled / finishLineDistance, 1)
    : 0
  const progressPercent = Math.round(progress * 100)

  return (
    <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr] animate-fade-up">
      <div className="space-y-4">
        <div className="relative h-24 w-24">
          <span className="crash-ring" />
          <span className="crash-ring" style={{ animationDelay: '220ms' }} />
          <div className="absolute inset-5 flex items-center justify-center rounded-2xl bg-rose-500 text-2xl font-bold text-white shadow-lg">
            !
          </div>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-500">
          Game Over
        </p>
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Oops! You hit an obstacle.
        </h2>
        <p className="max-w-lg text-sm text-slate-600 sm:text-base">
          Try again and keep your bus in a clear lane.
        </p>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Progress
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {progressPercent}%
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {Math.round(distanceTraveled)}m / {finishLineDistance}m
          </p>

        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/60 bg-white/85 p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-900 sm:text-xl">What next?</h3>
        <div className="space-y-3">
          <button
            type="button"
            onClick={resetRun}
            className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => setGameState('menu')}
            className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Change Character
          </button>
          <button
            type="button"
            onClick={() => setGameState('levelSelect')}
            className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Level Select
          </button>
        </div>
      </div>
    </section>
  )
}

export default GameOverScreen
