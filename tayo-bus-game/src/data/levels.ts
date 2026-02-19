export type ObstacleFrequency = 'low' | 'medium' | 'high'

export type ObstacleVariant = 'motorcycle' | 'car' | 'bus' | 'truck'

export type Weather = 'none' | 'rain' | 'snow' | 'leaves' | 'dust'

export type LevelTheme = {
  road: string
  lane: string
  accent: string
  bg: string
  sceneryColor: string
  weather: Weather
  envIcon: string
  envLabel: string
  obstaclePool: ObstacleVariant[]
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
      bg: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%)',
      sceneryColor: '#78716c',
      weather: 'none',
      envIcon: '🏙️',
      envLabel: 'Urban',
      obstaclePool: ['motorcycle', 'car'],
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
      bg: 'linear-gradient(180deg, #7dd3fc 0%, #38bdf8 40%, #0284c7 100%)',
      sceneryColor: '#65a30d',
      weather: 'none',
      envIcon: '🛣️',
      envLabel: 'Suburban',
      obstaclePool: ['motorcycle', 'car', 'bus'],
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
      bg: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)',
      sceneryColor: '#6366f1',
      weather: 'none',
      envIcon: '🚀',
      envLabel: 'Highway',
      obstaclePool: ['car', 'bus', 'truck'],
    },
  },
  {
    id: 4,
    name: 'Mountain Pass',
    distance: 1800,
    baseSpeed: 4.2,
    obstacleFrequency: 'medium',
    theme: {
      road: 'linear-gradient(180deg, #1c1917 0%, #292524 100%)',
      lane: 'rgba(255,255,255,0.15)',
      accent: '#10b981',
      bg: 'linear-gradient(180deg, #86efac 0%, #22c55e 40%, #166534 100%)',
      sceneryColor: '#14532d',
      weather: 'leaves',
      envIcon: '⛰️',
      envLabel: 'Mountain',
      obstaclePool: ['motorcycle', 'car', 'bus'],
    },
  },
  {
    id: 5,
    name: 'Tunnel',
    distance: 1200,
    baseSpeed: 5,
    obstacleFrequency: 'high',
    theme: {
      road: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      lane: 'rgba(255,200,50,0.25)',
      accent: '#f59e0b',
      bg: 'linear-gradient(180deg, #0a0a0a 0%, #1c1917 40%, #0a0a0a 100%)',
      sceneryColor: '#44403c',
      weather: 'dust',
      envIcon: '🚇',
      envLabel: 'Tunnel',
      obstaclePool: ['car', 'bus', 'truck'],
    },
  },
  {
    id: 6,
    name: 'Countryside',
    distance: 2200,
    baseSpeed: 5.5,
    obstacleFrequency: 'high',
    theme: {
      road: 'linear-gradient(180deg, #292524 0%, #1c1917 100%)',
      lane: 'rgba(255,255,255,0.18)',
      accent: '#f43f5e',
      bg: 'linear-gradient(180deg, #fde68a 0%, #fb923c 40%, #ea580c 100%)',
      sceneryColor: '#a16207',
      weather: 'leaves',
      envIcon: '🌾',
      envLabel: 'Countryside',
      obstaclePool: ['motorcycle', 'car', 'bus', 'truck'],
    },
  },
]
