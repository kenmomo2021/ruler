import type { RulerState } from './types'

export interface CalibrationHandlers {
  getState: () => RulerState
  setPxPerMm: (pxPerMm: number, userCalibrated: boolean, persist?: boolean) => void
  resetCalibration: () => void
  redetectDpi: () => Promise<void>
}

export function buildCalibrationUI(handlers: CalibrationHandlers): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'calibration'

  const state = handlers.getState()
  const auto = state.pxPerMmAuto || state.pxPerMm

  const title = document.createElement('div')
  title.className = 'menu-label'
  title.textContent = '校准 (1mm = ? 像素)'
  wrap.appendChild(title)

  const slider = document.createElement('input')
  slider.type = 'range'
  slider.min = '0.5'
  slider.max = '2'
  slider.step = '0.01'
  slider.value = String(state.pxPerMm / auto)

  const valueLabel = document.createElement('span')
  valueLabel.className = 'calib-value'

  const sourceLabel = document.createElement('div')
  sourceLabel.className = 'menu-tip'

  function updateLabels(): void {
    const factor = parseFloat(slider.value)
    const pxPerMm = factor * auto
    valueLabel.textContent = `${pxPerMm.toFixed(3)} px/mm`
    sourceLabel.textContent = state.userCalibrated
      ? '已手动校准 · 拿实体尺对齐'
      : `自动检测基准 ${auto.toFixed(3)} px/mm · 可手动微调`
  }
  updateLabels()

  slider.addEventListener('input', () => {
    const factor = parseFloat(slider.value)
    handlers.setPxPerMm(factor * auto, true, false)
    updateLabels()
  })
  slider.addEventListener('change', () => {
    const factor = parseFloat(slider.value)
    handlers.setPxPerMm(factor * auto, true, true)
    updateLabels()
  })

  const row = document.createElement('div')
  row.className = 'calib-row'
  row.appendChild(slider)
  row.appendChild(valueLabel)
  wrap.appendChild(row)

  wrap.appendChild(sourceLabel)

  const btnRow = document.createElement('div')
  btnRow.className = 'calib-btn-row'

  const resetBtn = document.createElement('button')
  resetBtn.className = 'menu-item menu-btn'
  resetBtn.textContent = '重置校准'
  resetBtn.addEventListener('click', () => {
    slider.value = '1'
    handlers.resetCalibration()
    updateLabels()
  })
  btnRow.appendChild(resetBtn)

  const redetectBtn = document.createElement('button')
  redetectBtn.className = 'menu-item menu-btn'
  redetectBtn.textContent = '重新检测'
  redetectBtn.addEventListener('click', async () => {
    redetectBtn.disabled = true
    redetectBtn.textContent = '检测中…'
    await handlers.redetectDpi()
    redetectBtn.disabled = false
    redetectBtn.textContent = '重新检测'
    slider.value = '1'
    updateLabels()
  })
  btnRow.appendChild(redetectBtn)

  wrap.appendChild(btnRow)

  return wrap
}
