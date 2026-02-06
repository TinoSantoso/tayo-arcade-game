import { levels } from '../data/levels'
import { useGameStore } from '../store/gameStore'

const LevelSelect = () => {
  const unlockedLevels = useGameStore((state) => state.unlockedLevels)
  const bestByLevel = useGameStore((state) => state.bestByLevel)
  const startLevel = useGameStore((state) => state.startLevel)
  const setGameState = useGameStore((state) => state.setGameState)

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  const formatSpeed = (speed: number) =>
    Number.isInteger(speed) ? speed.toString() : speed.toFixed(1)

  return (
    <section className="space-y-8 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
            Level Select
          </p>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Choose your route
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
            Each level gets longer and faster. Clear one to unlock the next.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setGameState('menu')}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          Change Character
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((level) => {
          const isLocked = level.id > unlockedLevels
          const best = bestByLevel[level.id]

          return (
            <div
              key={level.id}
              className={`relative overflow-hidden rounded-3xl border-2 bg-white/80 p-5 shadow-lg transition ${
                isLocked
                  ? 'border-slate-200 opacity-70'
                  : 'border-transparent hover:border-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Level {level.id}
                </p>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white shadow"
                  style={{ backgroundColor: level.theme.accent }}
                >
                  {level.obstacleFrequency}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-slate-900">
                {level.name}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {level.distance}m • Base speed {formatSpeed(level.baseSpeed)}
              </p>

              {best ? (
                <div className="mt-4 rounded-2xl border border-white/70 bg-white/80 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-500">Best run</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span>{formatTime(best.bestTime)}</span>
                    <span className="text-yellow-500">
                      {'★'.repeat(best.bestStars).padEnd(3, '☆')}
                    </span>
                  </div>
                  <p className="mt-1">Avoided: {best.bestAvoided}</p>
                </div>
              ) : (
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  No best yet
                </p>
              )}

              <button
                type="button"
                disabled={isLocked}
                onClick={() => startLevel(level.id)}
                className={`mt-5 w-full rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isLocked
                    ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                    : 'bg-slate-900 text-white hover:-translate-y-0.5'
                }`}
              >
                {isLocked ? 'Locked' : 'Play Level'}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default LevelSelect
