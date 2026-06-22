import { buildCalibrationUI, type CalibrationHandlers } from './calibration'
import { pauseHitTest, resumeHitTest } from './hit-test'

export interface MenuHandlers extends CalibrationHandlers {
  setAngle: (deg: number) => void
  toggleAlwaysOnTop: (onTop: boolean) => void
  quit: () => void
}

export function setupMenu(menuEl: HTMLElement, handlers: MenuHandlers): void {
  let isOpen = false

  function hide(): void {
    if (!isOpen) return
    isOpen = false
    menuEl.classList.add('hidden')
    menuEl.innerHTML = ''
    resumeHitTest()
  }

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    show(e.clientX, e.clientY)
  })

  document.addEventListener('mousedown', (e) => {
    if (!isOpen) return
    if (e.target instanceof Node && !menuEl.contains(e.target)) hide()
  })

  menuEl.addEventListener('click', (e) => {
    e.stopPropagation()
    const t = e.target
    if (t instanceof HTMLButtonElement) {
      return
    }
  })

  function show(x: number, y: number): void {
    if (isOpen) hide()
    isOpen = true
    pauseHitTest()
    menuEl.innerHTML = ''
    const state = handlers.getState()

    const calib = buildCalibrationUI(handlers)
    menuEl.appendChild(calib)

    menuEl.appendChild(divider())

    const topItem = checkboxItem('置顶', state.alwaysOnTop, (checked) => {
      handlers.toggleAlwaysOnTop(checked)
    })
    menuEl.appendChild(topItem)

    menuEl.appendChild(divider())

    menuEl.appendChild(
      actionItem('水平对齐', () => {
        handlers.setAngle(0)
        hide()
      })
    )
    menuEl.appendChild(
      actionItem('垂直对齐', () => {
        handlers.setAngle(90)
        hide()
      })
    )
    menuEl.appendChild(
      actionItem('重置角度', () => {
        handlers.setAngle(0)
        hide()
      })
    )

    menuEl.appendChild(divider())

    menuEl.appendChild(actionItem('退出', () => handlers.quit()))

    menuEl.classList.remove('hidden')
    const rect = menuEl.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const nx = Math.min(x, vw - rect.width - 8)
    const ny = Math.min(y, vh - rect.height - 8)
    menuEl.style.left = `${Math.max(8, nx)}px`
    menuEl.style.top = `${Math.max(8, ny)}px`
  }
}

function divider(): HTMLElement {
  const d = document.createElement('div')
  d.className = 'menu-divider'
  return d
}

function checkboxItem(
  label: string,
  checked: boolean,
  onChange: (checked: boolean) => void
): HTMLElement {
  const item = document.createElement('label')
  item.className = 'menu-item menu-check'
  const cb = document.createElement('input')
  cb.type = 'checkbox'
  cb.checked = checked
  cb.addEventListener('change', () => onChange(cb.checked))
  const span = document.createElement('span')
  span.textContent = label
  item.appendChild(cb)
  item.appendChild(span)
  return item
}

function actionItem(label: string, onClick: () => void): HTMLElement {
  const btn = document.createElement('button')
  btn.className = 'menu-item menu-btn'
  btn.textContent = label
  btn.addEventListener('click', onClick)
  return btn
}
