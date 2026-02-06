import { characters } from '../data/characters'
import { useGameStore } from '../store/gameStore'

const CharacterSelection = () => {
  const selectedCharacter = useGameStore((state) => state.selectedCharacter)
  const selectCharacter = useGameStore((state) => state.selectCharacter)
  const setGameState = useGameStore((state) => state.setGameState)

  const selectedProfile =
    characters.find((character) => character.id === selectedCharacter) ??
    characters[0]

  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] animate-fade-up">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
            Character Select
          </p>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Pick your favorite Tayo bus
          </h2>
          <p className="max-w-xl text-sm text-slate-600 sm:text-base">
            Choose a bus and hit the road. Each character has a unique look
            and vibe. You can always swap later.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {characters.map((character) => {
            const isSelected = character.id === selectedCharacter

            return (
              <button
                key={character.id}
                type="button"
                onClick={() => selectCharacter(character.id)}
                className={`group relative overflow-hidden rounded-3xl border-2 px-5 py-6 text-left transition ${
                  isSelected
                    ? 'border-slate-900 bg-white shadow-lg'
                    : 'border-transparent bg-white/70 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25"
                  style={{ backgroundColor: character.color }}
                />
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-28 items-center justify-center rounded-2xl bg-white shadow-inner">
                    <img
                      src={character.portrait}
                      alt={character.name}
                      className="h-16 w-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {character.name}
                    </p>
                    <p className="text-sm text-slate-500">{character.vibe}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: character.accent }}
                  />
                  {isSelected ? 'Selected' : 'Tap to choose'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-white/50 bg-white/80 p-6 shadow-lg backdrop-blur">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Preview
          </p>
          <h3 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
            {selectedProfile.name}
          </h3>
          <p className="mt-2 text-sm text-slate-600">{selectedProfile.vibe}</p>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 p-6">
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute -left-10 top-8 h-40 w-40 rounded-full"
              style={{ backgroundColor: selectedProfile.color }}
            />
            <div
              className="absolute bottom-6 right-4 h-24 w-24 rounded-full"
              style={{ backgroundColor: selectedProfile.accent }}
            />
          </div>
          <div className="relative z-10 flex flex-col items-start gap-4 text-white">
            <div className="flex h-32 w-48 items-center justify-center rounded-3xl border-2 border-white/70 bg-white/10">
              <img
                src={selectedProfile.portrait}
                alt={selectedProfile.name}
                className="h-24 w-auto object-contain"
                loading="lazy"
              />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">Ready for the road</p>
              <p className="text-sm text-white/80">
                Left &amp; right only. Dodge obstacles and reach the finish line.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setGameState('levelSelect')}
          className="w-full rounded-full bg-orange-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-400"
        >
          Start Game
        </button>
      </div>
    </section>
  )
}

export default CharacterSelection
