import ganiPortrait from '../assets/characters/gani.png'
import laniPortrait from '../assets/characters/lani.png'
import rogiPortrait from '../assets/characters/rogi.png'
import tayoPortrait from '../assets/characters/tayo.png'
import ganiTopDown from '../assets/topdown/gani.svg'
import laniTopDown from '../assets/topdown/lani.svg'
import rogiTopDown from '../assets/topdown/rogi.svg'
import tayoTopDown from '../assets/topdown/tayo.svg'

export type CharacterId = 'tayo' | 'gani' | 'lani' | 'rogi'

export type CharacterProfile = {
  id: CharacterId
  name: string
  color: string
  accent: string
  vibe: string
  portrait: string
  topDown: string
}

export const characters: CharacterProfile[] = [
  {
    id: 'tayo',
    name: 'Tayo',
    color: '#3b82f6',
    accent: '#1d4ed8',
    vibe: 'Friendly, brave, and always ready to help.',
    portrait: tayoPortrait,
    topDown: tayoTopDown,
  },
  {
    id: 'gani',
    name: 'Gani',
    color: '#ef4444',
    accent: '#b91c1c',
    vibe: 'Cool and calm with a steady driving style.',
    portrait: ganiPortrait,
    topDown: ganiTopDown,
  },
  {
    id: 'lani',
    name: 'Lani',
    color: '#fbbf24',
    accent: '#b45309',
    vibe: 'Cheerful, bright, and full of energy.',
    portrait: laniPortrait,
    topDown: laniTopDown,
  },
  {
    id: 'rogi',
    name: 'Rogi',
    color: '#22c55e',
    accent: '#15803d',
    vibe: 'Bold, fast, and always up for a challenge.',
    portrait: rogiPortrait,
    topDown: rogiTopDown,
  },
]
