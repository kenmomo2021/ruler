import type { RulerState } from './types'
import { hitTest, nearestResizeCursor, type Geometry, type HitKind } from './ruler'

export type StateSink = (partial: Partial<RulerState>, persist?: boolean) => void
export type GeometryGetter = () => Geometry

interface DragContext {
  kind: Exclude<HitKind, null>
  startMx: number
  startMy: number
  startCx: number
  startCy: number
  startLengthMm: number
  pxPerMm: number
  ux: number
  uy: number
  startHalfLenPx: number
  fixedEndU: number
}

export function setupInteractions(
  svg: SVGSVGElement,
  getState: () => RulerState,
  sink: StateSink,
  getGeometry: GeometryGetter
): void {
  let drag: DragContext | null = null

  function cursorFor(kind: HitKind): string {
    const g = getGeometry()
    switch (kind) {
      case 'body':
        return 'move'
      case 'end-a':
      case 'end-b':
        return nearestResizeCursor(g.angleDeg)
      case 'rotate':
        return 'grab'
      default:
        return 'default'
    }
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return
    const g = getGeometry()
    const kind = hitTest(g, e.clientX, e.clientY)
    if (!kind) return
    e.preventDefault()
    const state = getState()
    const startHalfLenPx = (state.lengthMm * state.pxPerMm) / 2
    drag = {
      kind,
      startMx: e.clientX,
      startMy: e.clientY,
      startCx: state.cx,
      startCy: state.cy,
      startLengthMm: state.lengthMm,
      pxPerMm: state.pxPerMm,
      ux: g.ux,
      uy: g.uy,
      startHalfLenPx,
      fixedEndU: kind === 'end-a' ? startHalfLenPx : kind === 'end-b' ? -startHalfLenPx : 0
    }
    svg.setPointerCapture(e.pointerId)
    document.body.style.cursor = kind === 'rotate' ? 'grabbing' : cursorFor(kind)
  }

  function onPointerMove(e: PointerEvent): void {
    if (!drag) {
      const g = getGeometry()
      const kind = hitTest(g, e.clientX, e.clientY)
      document.body.style.cursor = cursorFor(kind)
      return
    }
    const d = drag
    const dx = e.clientX - d.startMx
    const dy = e.clientY - d.startMy

    if (d.kind === 'body') {
      sink({ cx: d.startCx + dx, cy: d.startCy + dy }, false)
    } else if (d.kind === 'end-a' || d.kind === 'end-b') {
      const proj = dx * d.ux + dy * d.uy
      const draggedEndU0 = -d.fixedEndU
      const newDraggedEndU = draggedEndU0 + proj
      const newCenterLocalU = (d.fixedEndU + newDraggedEndU) / 2
      const newHalfLenPx = Math.abs(d.fixedEndU - newDraggedEndU) / 2
      const newLengthMm = Math.max(20, Math.round((newHalfLenPx * 2) / d.pxPerMm))
      sink(
        {
          cx: d.startCx + newCenterLocalU * d.ux,
          cy: d.startCy + newCenterLocalU * d.uy,
          lengthMm: newLengthMm
        },
        false
      )
    } else if (d.kind === 'rotate') {
      const ang = Math.atan2(e.clientY - d.startCy, e.clientX - d.startCx) * (180 / Math.PI)
      sink({ angleDeg: ang }, false)
    }
  }

  function endDrag(e: PointerEvent): void {
    if (!drag) return
    try {
      svg.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    drag = null
    document.body.style.cursor = 'default'
    sink({}, true)
  }

  svg.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
}
