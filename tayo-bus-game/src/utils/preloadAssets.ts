import carObstacle from '../assets/obstacles/car.svg'
import motorcycleObstacle from '../assets/obstacles/motorcycle.svg'
import truckObstacle from '../assets/obstacles/truck.svg'
import { characters } from '../data/characters'

const imageSources = [
  carObstacle,
  motorcycleObstacle,
  truckObstacle,
  ...characters.map((c) => c.portrait),
  ...characters.map((c) => c.topDown),
]

export const preloadAssets = (): Promise<void> => {
  const promises = imageSources.map(
    (src) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => resolve()
        img.src = src
      })
  )
  return Promise.all(promises).then(() => undefined)
}
