import { useEffect } from 'react'
import type { Difficulty } from '../store/gameStore'
import { useGameStore } from '../store/gameStore'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
}

const options: Array<{
  id: Difficulty
  label: string
  description: string
}> = [
  {
    id: 'easy',
    label: 'Chill Ride',
    description: 'More breathing room with fewer obstacles.',
  },
  {
    id: 'normal',
    label: 'Road Ready',
    description: 'Balanced traffic and obstacle flow.',
  },
  {
    id: 'hard',
    label: 'Rush Hour',
    description: 'Fast pace with tighter gaps.',
  },
]

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const audioEnabled = useGameStore((state) => state.audioEnabled)
  const toggleAudio = useGameStore((state) => state.toggleAudio)
  const difficulty = useGameStore((state) => state.difficulty)
  const setDifficulty = useGameStore((state) => state.setDifficulty)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Settings
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              Sound &amp; Difficulty
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Audio
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Toggle music + SFX.
              </p>
              <button
                type="button"
                onClick={toggleAudio}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow transition hover:-translate-y-0.5"
              >
                {audioEnabled ? 'Audio On' : 'Audio Off'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Difficulty
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Changes apply immediately to the current run.
            </p>
            <div className="mt-4 grid gap-3">
              {options.map((option) => {
                const isActive = option.id === difficulty
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDifficulty(option.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p
                      className={`mt-1 text-xs ${
                        isActive ? 'text-white/80' : 'text-slate-500'
                      }`}
                    >
                      {option.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
