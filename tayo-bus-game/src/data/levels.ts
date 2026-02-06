export type ObstacleFrequency = 'low' | 'medium' | 'high'

export type LevelTheme = {
  road: string
  lane: string
  accent: string
  obstacleColors: {
    car: string
    cone: string
    bus: string
    barrier: string
  }
}

export type LevelConfig = {
  id: number
  name: string
  distance: number
  baseSpeed: number
  obstacleFrequency: ObstacleFrequency
  theme: LevelTheme
}

export const levels: LevelConfig[] = [
  {
    id: 1,
    name: 'City Street',
    distance: 500,
    baseSpeed: 3,
    obstacleFrequency: 'low',
    theme: {
      road: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
      lane: 'rgba(255,255,255,0.18)',
      accent: '#f97316',
      obstacleColors: {
        car: '#0f172a',
        cone: '#f97316',
        bus: '#1d4ed8',
        barrier: '#64748b',
      },
    },
  },
  {
    id: 2,
    name: 'Main Road',
    distance: 1000,
    baseSpeed: 3.8,
    obstacleFrequency: 'medium',
    theme: {
      road: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
      lane: 'rgba(255,255,255,0.22)',
      accent: '#38bdf8',
      obstacleColors: {
        car: '#1e293b',
        cone: '#fb923c',
        bus: '#22c55e',
        barrier: '#94a3b8',
      },
    },
  },
  {
    id: 3,
    name: 'Highway',
    distance: 1500,
    baseSpeed: 4.6,
    obstacleFrequency: 'high',
    theme: {
      road: 'linear-gradient(180deg, #0b1120 0%, #111827 100%)',
      lane: 'rgba(255,255,255,0.2)',
      accent: '#a855f7',
      obstacleColors: {
        car: '#111827',
        cone: '#f97316',
        bus: '#ef4444',
        barrier: '#475569',
      },
    },
  },
]
