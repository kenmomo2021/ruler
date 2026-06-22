import { screen } from 'electron'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const FALLBACK_PX_PER_MM = 96 / 25.4

interface WmiMonitor {
  InstanceName: string
  MaxHorizontalImageSize: number
  MaxVerticalImageSize: number
}

interface DisplayMatch {
  logicalW: number
  logicalH: number
  physMmW: number
  physMmH: number
}

function aspectRatio(w: number, h: number): number {
  return w / h
}

function diagonalPxPerMm(w: number, h: number, mmW: number, mmH: number): number {
  const diagPx = Math.sqrt(w * w + h * h)
  const diagMm = Math.sqrt(mmW * mmW + mmH * mmH)
  return diagPx / diagMm
}

async function getWindowsMonitors(): Promise<WmiMonitor[]> {
  const ps =
    'Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBasicDisplayParams | ' +
    'Select-Object InstanceName,MaxHorizontalImageSize,MaxVerticalImageSize | ' +
    'ConvertTo-Json -Compress'
  try {
    const { stdout } = await execAsync(
      `powershell -NoProfile -NonInteractive -Command "${ps.replace(/"/g, '\\"')}"`,
      { timeout: 8000, windowsHide: true }
    )
    const trimmed = stdout.trim()
    if (!trimmed) return []
    const parsed = JSON.parse(trimmed) as WmiMonitor | WmiMonitor[]
    const list = Array.isArray(parsed) ? parsed : [parsed]
    return list.filter((m) => m.MaxHorizontalImageSize > 0 && m.MaxVerticalImageSize > 0)
  } catch {
    return []
  }
}

async function detectWindows(): Promise<number | null> {
  const monitors = await getWindowsMonitors()
  if (monitors.length === 0) return null

  const primary = screen.getPrimaryDisplay()
  const logicalW = primary.size.width
  const logicalH = primary.size.height
  const logicalAspect = aspectRatio(logicalW, logicalH)

  let best: DisplayMatch | null = null
  let bestDelta = Infinity
  for (const m of monitors) {
    const physMmW = m.MaxHorizontalImageSize * 10
    const physMmH = m.MaxVerticalImageSize * 10
    if (physMmW <= 0 || physMmH <= 0) continue
    const physAspect = aspectRatio(physMmW, physMmH)
    const delta = Math.abs(physAspect - logicalAspect)
    if (delta < bestDelta) {
      bestDelta = delta
      best = { logicalW, logicalH, physMmW, physMmH }
    }
  }

  if (!best) return null
  const pxPerMm = diagonalPxPerMm(best.logicalW, best.logicalH, best.physMmW, best.physMmH)
  if (!isFinite(pxPerMm) || pxPerMm <= 0) return null
  return pxPerMm
}

async function detectMac(): Promise<number | null> {
  return null
}

async function detectLinux(): Promise<number | null> {
  return null
}

export async function detectPxPerMm(): Promise<{ value: number; source: 'auto' | 'fallback' }> {
  let value: number | null = null
  try {
    if (process.platform === 'win32') value = await detectWindows()
    else if (process.platform === 'darwin') value = await detectMac()
    else if (process.platform === 'linux') value = await detectLinux()
  } catch {
    value = null
  }
  if (value === null || !isFinite(value) || value <= 0) {
    return { value: FALLBACK_PX_PER_MM, source: 'fallback' }
  }
  return { value, source: 'auto' }
}

export const DEFAULT_PX_PER_MM = FALLBACK_PX_PER_MM
