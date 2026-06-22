import { isPointOnRuler, type Geometry } from './ruler'

let paused = false

export function pauseHitTest(): void {
  paused = true
  window.ruler.setIgnoreMouseEvents(false)
}

export function resumeHitTest(): void {
  paused = false
}

export function setupHitTest(getGeometry: () => Geometry): void {
  window.addEventListener('mousemove', (e) => {
    if (paused) return
    const g = getGeometry()
    const onRuler = isPointOnRuler(g, e.clientX, e.clientY, true)
    window.ruler.setIgnoreMouseEvents(!onRuler, { forward: true })
  })

  window.addEventListener('mouseleave', () => {
    if (paused) return
    window.ruler.setIgnoreMouseEvents(true, { forward: true })
  })
}
