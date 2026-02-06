import { useEffect, useState } from 'react'
import {
  playCrash,
  playVictory,
  primeAudio,
  setAudioEnabled,
  startMusic,
  stopMusic,
} from './audio/audioEngine'
import CharacterSelection from './components/CharacterSelection'
import GameOverScreen from './components/GameOverScreen'
import GameScreen from './components/GameScreen'
import LevelSelect from './components/LevelSelect'
import SettingsModal from './components/SettingsModal'
import VictoryScreen from './components/VictoryScreen'
import { levels } from './data/levels'
import { useGameStore } from './store/gameStore'

function App() {
  const gameState = useGameStore((state) => state.gameState)
  const audioEnabled = useGameStore((state) => state.audioEnabled)
  const difficulty = useGameStore((state) => state.difficulty)
  const unlockedLevels = useGameStore((state) => state.unlockedLevels)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isGameplay = gameState === 'playing' || gameState === 'crashing'
  const unlockedCount = Math.min(unlockedLevels, levels.length)
  const stateLabel =
    gameState === 'menu'
      ? 'Character Select'
      : gameState === 'levelSelect'
        ? 'Level Select'
        : gameState === 'playing'
          ? 'In Run'
          : gameState === 'crashing'
            ? 'Crash'
          : gameState === 'victory'
            ? 'Victory'
            : 'Game Over'

  useEffect(() => {
    setAudioEnabled(audioEnabled)
  }, [audioEnabled])

  useEffect(() => {
    const unlock = () => {
      primeAudio()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  useEffect(() => {
    if (!audioEnabled) {
      stopMusic()
      return
    }
    if (gameState === 'playing') {
      startMusic()
    } else {
      stopMusic()
    }
    if (gameState === 'victory') {
      playVictory()
    }
    if (gameState === 'crashing') {
      playCrash()
    }
  }, [audioEnabled, gameState])

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-16 top-8 h-48 w-48 rounded-full bg-orange-200/60 blur-3xl" />
        <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl" />
      </div>
      <div className={`mx-auto max-w-6xl ${isGameplay ? 'space-y-5' : 'space-y-8'}`}>
        <header
          className={`flex flex-wrap items-center justify-between gap-4 ${
            isGameplay
              ? 'rounded-3xl border border-slate-200 bg-white/78 px-4 py-3 backdrop-blur'
              : ''
          }`}
        >
          <div className="space-y-1">
            <p
              className={`text-xs font-semibold uppercase ${
                isGameplay
                  ? 'tracking-[0.3em] text-slate-500'
                  : 'tracking-[0.4em] text-slate-400'
              }`}
            >
              {isGameplay ? 'Driver Console' : 'Tayo Bus Arcade'}
            </p>
            <h1
              className={`font-extrabold text-slate-900 ${
                isGameplay ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'
              }`}
            >
              {isGameplay ? 'Bus Operations' : 'Road Dash'}
            </h1>
          </div>
          <div className={`flex items-center ${isGameplay ? 'gap-2' : 'gap-3'}`}>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] shadow transition ${
                isGameplay
                  ? 'border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400'
                  : 'border-slate-300 bg-white/80 text-slate-600 hover:border-slate-400'
              }`}
            >
              Settings
            </button>
            <div
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] shadow ${
                isGameplay
                  ? 'border-slate-300 bg-slate-100 text-slate-700'
                  : 'border-white/80 bg-white/80 text-slate-600'
              }`}
            >
              {stateLabel}
            </div>
            <div
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] shadow ${
                isGameplay
                  ? 'hidden border-slate-300 bg-slate-100 text-slate-700 sm:block'
                  : 'border-white/80 bg-white/80 text-slate-600'
              }`}
            >
              Levels {unlockedCount}/{levels.length}
            </div>
            <div
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] shadow ${
                isGameplay
                  ? 'hidden border-slate-300 bg-slate-100 text-slate-700 md:block'
                  : 'border-white/80 bg-white/80 text-slate-600'
              }`}
            >
              {difficulty}
            </div>
          </div>
        </header>

        <main
          className={`relative rounded-[2rem] border shadow-2xl backdrop-blur sm:rounded-[2.5rem] ${
            isGameplay
              ? 'border-slate-200/80 bg-white/72 p-4 sm:p-6'
              : 'border-white/60 bg-white/65 p-5 sm:p-10'
          }`}
        >
          {gameState === 'menu' && <CharacterSelection />}
          {gameState === 'levelSelect' && <LevelSelect />}
          {(gameState === 'playing' || gameState === 'crashing') && (
            <GameScreen />
          )}
          {gameState === 'victory' && <VictoryScreen />}
          {gameState === 'gameOver' && <GameOverScreen />}
        </main>
      </div>
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}

export default App
