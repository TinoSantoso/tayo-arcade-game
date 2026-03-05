import { useMemo } from 'react'

type SceneryItem = {
  svg: string
  width: number
  height: number
}

type SceneryConfig = {
  items: SceneryItem[]
  groundColor: string
  groundAccent: string
}

// Pixel-art style SVG scenery elements per level theme
const SCENERY_CONFIGS: Record<number, SceneryConfig> = {
  // Level 1: Grassy Plains — bushes, flowers, small trees
  1: {
    groundColor: '#22c55e',
    groundAccent: '#15803d',
    items: [
      {
        // Small bush
        width: 28,
        height: 22,
        svg: `<rect x="4" y="10" width="20" height="12" rx="2" fill="#15803d"/>
              <rect x="8" y="4" width="12" height="10" rx="2" fill="#22c55e"/>
              <rect x="10" y="2" width="8" height="6" rx="1" fill="#4ade80"/>`,
      },
      {
        // Flower
        width: 16,
        height: 24,
        svg: `<rect x="7" y="12" width="2" height="12" fill="#15803d"/>
              <rect x="4" y="6" width="8" height="8" rx="4" fill="#fbbf24"/>
              <rect x="6" y="8" width="4" height="4" rx="2" fill="#fef3c7"/>`,
      },
      {
        // Round tree
        width: 24,
        height: 36,
        svg: `<rect x="10" y="22" width="4" height="14" fill="#78350f"/>
              <rect x="4" y="6" width="16" height="18" rx="8" fill="#22c55e"/>
              <rect x="6" y="4" width="12" height="14" rx="6" fill="#4ade80"/>
              <rect x="8" y="8" width="4" height="4" rx="2" fill="#86efac" opacity="0.6"/>`,
      },
      {
        // Grass tuft
        width: 18,
        height: 12,
        svg: `<rect x="2" y="8" width="14" height="4" rx="1" fill="#15803d"/>
              <rect x="4" y="4" width="2" height="6" fill="#22c55e"/>
              <rect x="8" y="2" width="2" height="8" fill="#4ade80"/>
              <rect x="12" y="5" width="2" height="5" fill="#22c55e"/>`,
      },
    ],
  },

  // Level 2: Bridge Crossing — bridge pillars, cable lines, water splashes
  2: {
    groundColor: '#0ea5e9',
    groundAccent: '#0369a1',
    items: [
      {
        // Bridge pillar
        width: 16,
        height: 40,
        svg: `<rect x="4" y="0" width="8" height="40" fill="#64748b"/>
              <rect x="2" y="0" width="12" height="4" fill="#94a3b8"/>
              <rect x="2" y="36" width="12" height="4" fill="#94a3b8"/>
              <rect x="6" y="8" width="4" height="4" fill="#475569"/>`,
      },
      {
        // Cable tower
        width: 20,
        height: 48,
        svg: `<rect x="8" y="0" width="4" height="48" fill="#475569"/>
              <rect x="6" y="0" width="8" height="6" fill="#64748b"/>
              <line x1="10" y1="6" x2="0" y2="30" stroke="#94a3b8" stroke-width="1"/>
              <line x1="10" y1="6" x2="20" y2="30" stroke="#94a3b8" stroke-width="1"/>`,
      },
      {
        // Water wave
        width: 22,
        height: 10,
        svg: `<path d="M0 6 Q5 2 11 6 Q16 10 22 6" fill="none" stroke="#7dd3fc" stroke-width="2" opacity="0.7"/>
              <path d="M2 8 Q7 4 13 8 Q18 12 22 8" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.5"/>`,
      },
      {
        // Railing post
        width: 10,
        height: 28,
        svg: `<rect x="3" y="0" width="4" height="28" fill="#94a3b8"/>
              <rect x="1" y="0" width="8" height="3" fill="#cbd5e1"/>
              <rect x="0" y="24" width="10" height="4" rx="1" fill="#64748b"/>`,
      },
    ],
  },

  // Level 3: Seashore Highway — palm trees, sand dunes, beach umbrellas
  3: {
    groundColor: '#f59e0b',
    groundAccent: '#92400e',
    items: [
      {
        // Palm tree
        width: 26,
        height: 44,
        svg: `<rect x="11" y="16" width="4" height="28" fill="#92400e" rx="1"/>
              <rect x="12" y="20" width="2" height="24" fill="#78350f"/>
              <path d="M13 16 L2 8 L6 14 L0 10 L8 16Z" fill="#22c55e"/>
              <path d="M13 16 L24 8 L20 14 L26 10 L18 16Z" fill="#15803d"/>
              <path d="M13 14 L8 2 L12 12Z" fill="#4ade80"/>
              <path d="M13 14 L18 2 L14 12Z" fill="#22c55e"/>`,
      },
      {
        // Sand dune
        width: 30,
        height: 14,
        svg: `<path d="M0 14 Q8 2 15 8 Q22 2 30 14Z" fill="#fde68a"/>
              <path d="M2 14 Q10 6 17 10 Q24 6 28 14Z" fill="#fbbf24" opacity="0.6"/>`,
      },
      {
        // Beach umbrella
        width: 22,
        height: 30,
        svg: `<rect x="10" y="10" width="2" height="20" fill="#78350f"/>
              <path d="M0 12 Q11 -2 22 12Z" fill="#ef4444"/>
              <path d="M0 12 Q5 4 11 6Z" fill="#f87171"/>
              <path d="M11 6 Q16 4 22 12Z" fill="#dc2626"/>`,
      },
      {
        // Seashell
        width: 12,
        height: 10,
        svg: `<path d="M2 10 Q6 0 10 10Z" fill="#fef3c7"/>
              <rect x="4" y="6" width="4" height="2" rx="1" fill="#fde68a"/>`,
      },
    ],
  },

  // Level 4: Mountain Pass — rocky peaks, pine trees, boulders
  4: {
    groundColor: '#7c3aed',
    groundAccent: '#4c1d95',
    items: [
      {
        // Mountain peak
        width: 32,
        height: 44,
        svg: `<path d="M0 44 L16 4 L32 44Z" fill="#6d28d9"/>
              <path d="M4 44 L16 10 L28 44Z" fill="#7c3aed"/>
              <path d="M12 18 L16 4 L20 18Z" fill="#e9d5ff" opacity="0.6"/>`,
      },
      {
        // Pine tree
        width: 20,
        height: 36,
        svg: `<rect x="8" y="26" width="4" height="10" fill="#78350f"/>
              <path d="M2 28 L10 14 L18 28Z" fill="#15803d"/>
              <path d="M4 22 L10 8 L16 22Z" fill="#22c55e"/>
              <path d="M6 16 L10 4 L14 16Z" fill="#4ade80"/>`,
      },
      {
        // Boulder
        width: 18,
        height: 14,
        svg: `<rect x="2" y="4" width="14" height="10" rx="3" fill="#57534e"/>
              <rect x="4" y="2" width="10" height="8" rx="2" fill="#78716c"/>
              <rect x="6" y="4" width="4" height="3" rx="1" fill="#a8a29e" opacity="0.5"/>`,
      },
      {
        // Small rock
        width: 12,
        height: 10,
        svg: `<rect x="2" y="4" width="8" height="6" rx="2" fill="#57534e"/>
              <rect x="3" y="3" width="6" height="4" rx="1" fill="#78716c"/>`,
      },
    ],
  },

  // Level 5: Dense Forest — tall trees, mushrooms, logs
  5: {
    groundColor: '#047857',
    groundAccent: '#022c22',
    items: [
      {
        // Tall pine
        width: 22,
        height: 52,
        svg: `<rect x="9" y="36" width="4" height="16" fill="#78350f"/>
              <path d="M1 38 L11 18 L21 38Z" fill="#064e3b"/>
              <path d="M3 30 L11 10 L19 30Z" fill="#065f46"/>
              <path d="M5 22 L11 4 L17 22Z" fill="#047857"/>
              <path d="M7 16 L11 2 L15 16Z" fill="#10b981"/>`,
      },
      {
        // Mushroom
        width: 14,
        height: 16,
        svg: `<rect x="5" y="8" width="4" height="8" fill="#fef3c7"/>
              <path d="M0 10 Q7 0 14 10Z" fill="#ef4444"/>
              <circle cx="4" cy="6" r="1.5" fill="#fff" opacity="0.8"/>
              <circle cx="10" cy="5" r="1" fill="#fff" opacity="0.8"/>`,
      },
      {
        // Tree stump
        width: 16,
        height: 14,
        svg: `<rect x="3" y="4" width="10" height="10" rx="1" fill="#78350f"/>
              <rect x="2" y="2" width="12" height="4" rx="1" fill="#92400e"/>
              <ellipse cx="8" cy="4" rx="5" ry="2" fill="#a16207" opacity="0.4"/>`,
      },
      {
        // Fern
        width: 18,
        height: 18,
        svg: `<rect x="8" y="10" width="2" height="8" fill="#065f46"/>
              <path d="M9 12 L2 6 L5 10Z" fill="#10b981"/>
              <path d="M9 12 L16 6 L13 10Z" fill="#047857"/>
              <path d="M9 8 L4 2 L7 6Z" fill="#34d399"/>
              <path d="M9 8 L14 2 L11 6Z" fill="#10b981"/>`,
      },
    ],
  },

  // Level 6: Night Highway — lampposts, neon signs, city buildings
  6: {
    groundColor: '#1e1b4b',
    groundAccent: '#0f0a1e',
    items: [
      {
        // Lamppost
        width: 14,
        height: 48,
        svg: `<rect x="6" y="8" width="2" height="40" fill="#475569"/>
              <rect x="3" y="4" width="8" height="6" rx="1" fill="#64748b"/>
              <rect x="4" y="0" width="6" height="6" rx="1" fill="#fbbf24"/>
              <rect x="5" y="1" width="4" height="4" rx="1" fill="#fef3c7" opacity="0.9"/>
              <ellipse cx="7" cy="10" rx="6" ry="8" fill="#fbbf24" opacity="0.08"/>`,
      },
      {
        // City building
        width: 24,
        height: 44,
        svg: `<rect x="2" y="6" width="20" height="38" fill="#1e293b"/>
              <rect x="0" y="4" width="24" height="4" fill="#334155"/>
              <rect x="5" y="10" width="3" height="4" fill="#fbbf24" opacity="0.7"/>
              <rect x="10" y="10" width="3" height="4" fill="#38bdf8" opacity="0.5"/>
              <rect x="16" y="10" width="3" height="4" fill="#fbbf24" opacity="0.6"/>
              <rect x="5" y="18" width="3" height="4" fill="#0f172a"/>
              <rect x="10" y="18" width="3" height="4" fill="#fbbf24" opacity="0.5"/>
              <rect x="16" y="18" width="3" height="4" fill="#38bdf8" opacity="0.7"/>
              <rect x="5" y="26" width="3" height="4" fill="#fbbf24" opacity="0.4"/>
              <rect x="10" y="26" width="3" height="4" fill="#0f172a"/>
              <rect x="16" y="26" width="3" height="4" fill="#fbbf24" opacity="0.6"/>
              <rect x="5" y="34" width="3" height="4" fill="#38bdf8" opacity="0.5"/>
              <rect x="10" y="34" width="3" height="4" fill="#fbbf24" opacity="0.3"/>
              <rect x="16" y="34" width="3" height="4" fill="#0f172a"/>`,
      },
      {
        // Neon sign
        width: 18,
        height: 16,
        svg: `<rect x="1" y="2" width="16" height="12" rx="2" fill="#1e1b4b"/>
              <rect x="2" y="3" width="14" height="10" rx="1" fill="#312e81"/>
              <rect x="4" y="5" width="4" height="6" rx="1" fill="#f43f5e" opacity="0.8"/>
              <rect x="10" y="5" width="4" height="6" rx="1" fill="#38bdf8" opacity="0.8"/>`,
      },
      {
        // Traffic cone
        width: 10,
        height: 14,
        svg: `<path d="M2 14 L5 2 L5 2 L8 14Z" fill="#f97316"/>
              <rect x="3" y="6" width="4" height="2" fill="#fff" opacity="0.8"/>
              <rect x="1" y="12" width="8" height="2" rx="1" fill="#f97316"/>`,
      },
    ],
  },
}

// Default fallback for endless mode or unknown levels
const DEFAULT_CONFIG: SceneryConfig = SCENERY_CONFIGS[1]

type Props = {
  levelId: number
  speed: number
  side: 'left' | 'right'
}

const RoadScenery = ({ levelId, speed, side }: Props) => {
  const config = SCENERY_CONFIGS[levelId] ?? DEFAULT_CONFIG

  // Generate a deterministic pattern of scenery items
  const elements = useMemo(() => {
    const seed = side === 'left' ? 37 : 73
    const result: { item: SceneryItem; yOffset: number; index: number }[] = []
    let y = 10
    let idx = 0
    while (y < 900) {
      const itemIndex = (idx * seed + (side === 'left' ? 0 : 2)) % config.items.length
      const spacing = 50 + ((idx * 31 + seed) % 40)
      result.push({ item: config.items[itemIndex], yOffset: y, index: idx })
      y += spacing
      idx++
    }
    return result
  }, [config, side])

  // Animation speed based on game speed
  const animDuration = Math.max(1.5, 18 - speed * 0.12)

  return (
    <div
      className={`scenery-strip scenery-strip-${side}`}
      style={{
        ['--scenery-bg' as string]: config.groundColor,
        ['--scenery-accent' as string]: config.groundAccent,
      }}
    >
      <div
        className="scenery-scroll"
        style={{ animationDuration: `${animDuration}s` }}
      >
        {elements.map(({ item, yOffset, index }) => (
          <div
            key={`${side}-${index}`}
            className="scenery-item"
            style={{
              top: yOffset,
              [side === 'left' ? 'right' : 'left']: `${2 + ((index * 17) % 14)}px`,
            }}
          >
            <svg
              width={item.width}
              height={item.height}
              viewBox={`0 0 ${item.width} ${item.height}`}
              className="scenery-pixel-art"
              dangerouslySetInnerHTML={{ __html: item.svg }}
            />
          </div>
        ))}
      </div>
      {/* Duplicate for seamless loop */}
      <div
        className="scenery-scroll scenery-scroll-copy"
        style={{ animationDuration: `${animDuration}s` }}
      >
        {elements.map(({ item, yOffset, index }) => (
          <div
            key={`${side}-copy-${index}`}
            className="scenery-item"
            style={{
              top: yOffset,
              [side === 'left' ? 'right' : 'left']: `${2 + ((index * 17) % 14)}px`,
            }}
          >
            <svg
              width={item.width}
              height={item.height}
              viewBox={`0 0 ${item.width} ${item.height}`}
              className="scenery-pixel-art"
              dangerouslySetInnerHTML={{ __html: item.svg }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default RoadScenery
