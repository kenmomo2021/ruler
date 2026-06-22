import type { RulerState } from './types'
import { renderRuler, computeGeometry, type Geometry } from './ruler'
import { setupInteractions } from './interactions'
import { setupHitTest } from './hit-test'
import { setupMenu } from './menu'

const FALLBACK_PX_PER_MM = 96 / 25.4

const state: RulerState = {
  cx: 0,
  cy: 0,
  lengthMm: 150,
  angleDeg: 0,
  pxPerMm: FALLBACK_PX_PER_MM,
  pxPerMmAuto: FALLBACK_PX_PER_MM,
  userCalibrated: false,
  thicknessMm: 30,
  alwaysOnTop: true
}

let svg: SVGSVGElement
let menuEl: HTMLElement
let currentGeometry: Geometry = computeGeometry(state)

function getState(): RulerState {
  return state
}

let persistTimer: number | null = null
function schedulePersist(): void {
  if (persistTimer !== null) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    persistTimer = null
    void window.ruler.store.set({
      cx: state.cx,
      cy: state.cy,
      lengthMm: state.lengthMm,
      angleDeg: state.angleDeg,
      pxPerMm: state.pxPerMm,
      thicknessMm: state.thicknessMm,
      alwaysOnTop: state.alwaysOnTop
    })
  }, 400)
}

function apply(partial: Partial<RulerState>, persist = false): void {
  Object.assign(state, partial)
  currentGeometry = renderRuler(svg, state)
  if (persist) {
    if (persistTimer !== null) {
      window.clearTimeout(persistTimer)
      persistTimer = null
    }
    void window.ruler.store.set(partial)
  } else {
    schedulePersist()
  }
}

function init(): void {
  svg = document.getElementById('canvas') as unknown as SVGSVGElement
  menuEl = document.getElementById('menu') as HTMLElement

  window.addEventListener('resize', () => {
    currentGeometry = renderRuler(svg, state)
  })

  window.ruler.onInit((initState) => {
    Object.assign(state, initState)
    currentGeometry = renderRuler(svg, state)
  })

  setupInteractions(svg, getState, apply, () => currentGeometry)
  setupHitTest(() => currentGeometry)
  setupMenu(menuEl, {
    getState,
    setPxPerMm: (pxPerMm, userCalibrated, persist) => apply({ pxPerMm, userCalibrated }, persist),
    resetCalibration: () => apply({ pxPerMm: state.pxPerMmAuto, userCalibrated: false }, true),
    redetectDpi: async () => {
      const updated = await window.ruler.store.redetectDpi()
      Object.assign(state, updated)
      currentGeometry = renderRuler(svg, state)
    },
    setAngle: (deg) => apply({ angleDeg: deg }, true),
    toggleAlwaysOnTop: (onTop) => {
      window.ruler.setAlwaysOnTop(onTop)
      apply({ alwaysOnTop: onTop }, true)
    },
    quit: () => window.ruler.quit()
  })

  currentGeometry = renderRuler(svg, state)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
