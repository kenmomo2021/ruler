import type { RulerState } from './types'

export const HANDLE_HIT_PADDING = 6
export const ROTATE_HANDLE_OFFSET = 18
export const ROTATE_HANDLE_RADIUS = 7

const SVG_NS = 'http://www.w3.org/2000/svg'

export interface Geometry {
  cx: number
  cy: number
  halfLenPx: number
  halfThickPx: number
  angleDeg: number
  ux: number
  uy: number
  vx: number
  vy: number
}

export function computeGeometry(state: RulerState): Geometry {
  const halfLenPx = (state.lengthMm * state.pxPerMm) / 2
  const halfThickPx = (state.thicknessMm * state.pxPerMm) / 2
  const rad = (state.angleDeg * Math.PI) / 180
  const ux = Math.cos(rad)
  const uy = Math.sin(rad)
  const vx = -Math.sin(rad)
  const vy = Math.cos(rad)
  return {
    cx: state.cx,
    cy: state.cy,
    halfLenPx,
    halfThickPx,
    angleDeg: state.angleDeg,
    ux,
    uy,
    vx,
    vy
  }
}

export function localToScreen(g: Geometry, lx: number, ly: number): { x: number; y: number } {
  return {
    x: g.cx + lx * g.ux + ly * g.vx,
    y: g.cy + lx * g.uy + ly * g.vy
  }
}

export function isPointOnRuler(
  g: Geometry,
  sx: number,
  sy: number,
  includeRotateHandle = true
): boolean {
  const dx = sx - g.cx
  const dy = sy - g.cy
  const localU = dx * g.ux + dy * g.uy
  const localV = dx * g.vx + dy * g.vy
  const lenHit = g.halfLenPx + HANDLE_HIT_PADDING
  const thickHit = g.halfThickPx + HANDLE_HIT_PADDING
  if (localU >= -lenHit && localU <= lenHit && localV >= -thickHit && localV <= thickHit) {
    return true
  }
  if (includeRotateHandle) {
    const rpos = rotateHandlePos(g)
    const rdx = sx - rpos.x
    const rdy = sy - rpos.y
    if (rdx * rdx + rdy * rdy <= (ROTATE_HANDLE_RADIUS + HANDLE_HIT_PADDING) ** 2) {
      return true
    }
  }
  return false
}

export function rotateHandlePos(g: Geometry): { x: number; y: number } {
  const lx = g.halfLenPx + ROTATE_HANDLE_OFFSET
  const ly = 0
  return localToScreen(g, lx, ly)
}

export function nearestResizeCursor(angleDeg: number): string {
  const a = ((angleDeg % 180) + 180) % 180
  const cursors = ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize']
  const idx = Math.round(a / 45) % 4
  return cursors[idx]
}

function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {}
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K]
  for (const [k, v] of Object.entries(attrs)) {
    node.setAttribute(k, String(v))
  }
  return node
}

export function renderRuler(svg: SVGSVGElement, state: RulerState): Geometry {
  const g = computeGeometry(state)
  const w = window.innerWidth
  const h = window.innerHeight
  svg.setAttribute('width', String(w))
  svg.setAttribute('height', String(h))
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  svg.innerHTML = ''

  const root = el('g', {
    transform: `translate(${g.cx} ${g.cy}) rotate(${g.angleDeg})`
  })
  svg.appendChild(root)

  const bodyW = g.halfLenPx * 2
  const bodyH = g.halfThickPx * 2

  const body = el('rect', {
    x: String(-g.halfLenPx),
    y: String(-g.halfThickPx),
    width: String(bodyW),
    height: String(bodyH),
    rx: '4',
    ry: '4',
    class: 'ruler-body'
  })
  root.appendChild(body)

  const ticksGroup = el('g', { class: 'ticks' })
  root.appendChild(ticksGroup)

  const totalMm = Math.floor(state.lengthMm)
  const pxPerMm = state.pxPerMm
  for (let mm = 0; mm <= totalMm; mm++) {
    const x = -g.halfLenPx + mm * pxPerMm
    let tickLen: number
    let cls: string
    if (mm % 10 === 0) {
      tickLen = g.halfThickPx * 0.65
      cls = 'tick-major'
    } else if (mm % 5 === 0) {
      tickLen = g.halfThickPx * 0.42
      cls = 'tick-mid'
    } else {
      tickLen = g.halfThickPx * 0.25
      cls = 'tick-minor'
    }
    ticksGroup.appendChild(
      el('line', {
        x1: String(x),
        y1: String(-g.halfThickPx),
        x2: String(x),
        y2: String(-g.halfThickPx + tickLen),
        class: cls
      })
    )
    ticksGroup.appendChild(
      el('line', {
        x1: String(x),
        y1: String(g.halfThickPx),
        x2: String(x),
        y2: String(g.halfThickPx - tickLen),
        class: cls
      })
    )

    if (mm % 10 === 0 && mm > 0 && mm < totalMm) {
      const label = el('text', {
        x: String(x),
        y: String(g.halfThickPx - g.halfThickPx * 0.7),
        class: 'tick-label',
        'text-anchor': 'middle',
        'dominant-baseline': 'middle'
      })
      label.textContent = String(mm)
      ticksGroup.appendChild(label)
    }
  }

  const endA = el('rect', {
    x: String(-g.halfLenPx - HANDLE_HIT_PADDING / 2),
    y: String(-g.halfThickPx - HANDLE_HIT_PADDING / 2),
    width: String(HANDLE_HIT_PADDING),
    height: String(bodyH + HANDLE_HIT_PADDING),
    class: 'end-handle end-handle-a',
    'data-handle': 'a'
  })
  root.appendChild(endA)

  const endB = el('rect', {
    x: String(g.halfLenPx - HANDLE_HIT_PADDING / 2),
    y: String(-g.halfThickPx - HANDLE_HIT_PADDING / 2),
    width: String(HANDLE_HIT_PADDING),
    height: String(bodyH + HANDLE_HIT_PADDING),
    class: 'end-handle end-handle-b',
    'data-handle': 'b'
  })
  root.appendChild(endB)

  const rotateGroup = el('g', {
    class: 'rotate-handle',
    'data-handle': 'rotate',
    transform: `translate(${g.halfLenPx + ROTATE_HANDLE_OFFSET} 0)`
  })
  root.appendChild(rotateGroup)
  rotateGroup.appendChild(
    el('circle', { cx: '0', cy: '0', r: String(ROTATE_HANDLE_RADIUS), class: 'rotate-circle' })
  )
  rotateGroup.appendChild(
    el('line', {
      x1: String(-ROTATE_HANDLE_OFFSET),
      y1: '0',
      x2: '0',
      y2: '0',
      class: 'rotate-stem'
    })
  )

  return g
}

export type HitKind = 'body' | 'end-a' | 'end-b' | 'rotate' | null

export function hitTest(g: Geometry, sx: number, sy: number): HitKind {
  const rpos = rotateHandlePos(g)
  const rdx = sx - rpos.x
  const rdy = sy - rpos.y
  if (rdx * rdx + rdy * rdy <= (ROTATE_HANDLE_RADIUS + HANDLE_HIT_PADDING) ** 2) return 'rotate'

  const dx = sx - g.cx
  const dy = sy - g.cy
  const localU = dx * g.ux + dy * g.uy
  const localV = dx * g.vx + dy * g.vy

  const endHit = HANDLE_HIT_PADDING
  const vLo = -g.halfThickPx - endHit
  const vHi = g.halfThickPx + endHit
  if (localV >= vLo && localV <= vHi) {
    if (localU >= -g.halfLenPx - endHit && localU <= -g.halfLenPx + endHit) return 'end-a'
    if (localU >= g.halfLenPx - endHit && localU <= g.halfLenPx + endHit) return 'end-b'
  }

  if (Math.abs(localU) <= g.halfLenPx && Math.abs(localV) <= g.halfThickPx) {
    return 'body'
  }
  return null
}
