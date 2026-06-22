export interface RulerState {
  cx: number
  cy: number
  lengthMm: number
  angleDeg: number
  pxPerMm: number
  pxPerMmAuto: number
  userCalibrated: boolean
  thicknessMm: number
  alwaysOnTop: boolean
  screenWidth?: number
  screenHeight?: number
}

export interface RulerApi {
  setIgnoreMouseEvents: (ignore: boolean, opts?: { forward: boolean }) => void
  setAlwaysOnTop: (onTop: boolean) => void
  quit: () => void
  store: {
    get: () => Promise<RulerState>
    set: (partial: Partial<RulerState>) => Promise<RulerState>
    redetectDpi: () => Promise<RulerState>
  }
  onInit: (cb: (state: RulerState) => void) => () => void
}

declare global {
  interface Window {
    ruler: RulerApi
  }
}

export {}
