# Ruler · 屏幕直尺

[![CI](https://github.com/kenmomo2021/ruler/actions/workflows/ci.yml/badge.svg)](https://github.com/kenmomo2021/ruler/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)

一个跨平台桌面小工具：启动后屏幕上出现一把可拖动的直尺，毫米刻度，可自由旋转、调整长度，窗口完全透明无边框，只显示尺子本身。

> 截图 / GIF 待补充。

## 功能特性

- **毫米刻度**：每 1mm 短线、每 5mm 中线、每 10mm 长线 + 数字标注
- **拖动移动**：在尺身主体上左键拖动，光标变为 `move`
- **调整长度**：拖拽尺子两端的「端边」，光标按角度自动选最接近的 resize 样式，另一端固定
- **自由旋转**：拖动尺子右端外侧的蓝色圆点手柄，任意角度旋转，光标 `grab`/`grabbing`
- **点击穿透**：尺子外的透明区域不挡桌面操作，鼠标移回尺子时自动恢复接收事件
- **透明无边框**：无标题栏、背景透明、跳过任务栏、默认置顶
- **DPI 自动检测**：启动时自动读取显示器物理尺寸（Windows 用 WMI）算出真实 px/mm，毫米刻度物理准确；多显示器按宽高比匹配主显示器
- **手动校准**：右键菜单拖动滑块微调（相对自动值 0.5×~2×），拿实体尺对齐；可一键重置回自动值或重新检测
- **快捷对齐**：右键菜单一键水平/垂直对齐、重置角度
- **置顶开关**：右键菜单可切换是否始终置顶
- **状态持久化**：位置、长度、角度、校准值（含自动/手动区分）、置顶状态下次启动自动恢复

## 技术栈

| 层     | 选型                                                  |
| ------ | ----------------------------------------------------- |
| 框架   | Electron 33+                                          |
| 构建   | electron-vite                                         |
| 语言   | TypeScript（main / preload / renderer 三进程）        |
| 渲染   | SVG（原生 `transform="rotate()"` + 浏览器命中测试）   |
| 持久化 | Node `fs` + `app.getPath('userData')` 自写 JSON store |
| 打包   | electron-builder                                      |

## 项目结构

```
ruler/
├── package.json
├── electron.vite.config.ts        # main/preload/renderer 三进程构建配置
├── electron-builder.yml           # 打包配置（Win/Mac/Linux）
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── src/
│   ├── main/
│   │   ├── index.ts               # 主进程：透明窗口、JSON store、IPC
│   │   ├── dpi.ts                 # DPI 自动检测（Windows WMI + 多屏匹配）
│   │   └── ipc.ts                 # 点击穿透/置顶/退出 IPC
│   ├── preload/
│   │   └── index.ts               # contextBridge 安全 API
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.ts            # 渲染入口，串联各模块
│           ├── ruler.ts           # SVG 渲染 + 几何计算 + 命中测试
│           ├── interactions.ts    # 移动/改长度/旋转三交互
│           ├── hit-test.ts        # 点击穿透命中检测
│           ├── calibration.ts     # DPI 校准 UI
│           ├── menu.ts            # 右键菜单
│           ├── types.ts           # 类型声明
│           └── styles.css
└── out/                           # 构建产物
```

## 环境要求

- Node.js ≥ 18（推荐 20+）
- npm ≥ 9
- Windows 需要 WebView2（Win10/11 默认自带）
- 首次安装 Electron 二进制若超时，可设置镜像：
  ```powershell
  $env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
  ```

## 开发与构建

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 类型检查
npm run typecheck

# 仅构建（产出 out/ 目录）
npm run build

# 打包可执行文件
npm run build:win     # Windows: .exe 便携版 + NSIS 安装包
npm run build:mac     # macOS: .dmg（需 macOS 环境）
npm run build:linux   # Linux: AppImage
```

打包产物输出到 `dist/` 目录。

## 使用说明

启动后屏幕中央出现一把半透明深色直尺。

| 操作   | 方式                             | 光标                                     |
| ------ | -------------------------------- | ---------------------------------------- |
| 移动   | 在尺身主体上左键拖动             | `move`                                   |
| 改长度 | 在尺子两端的端边上左键拖动       | `ew/ns/nesw/nwse-resize`（按角度自动选） |
| 旋转   | 在尺子右端外侧蓝色圆点上左键拖动 | `grab` / `grabbing`                      |
| 菜单   | 右键任意位置                     | —                                        |

**右键菜单功能：**

- 校准滑块（相对自动检测值 0.5× ~ 2×，实时预览，显示当前 px/mm）
- 重置校准（恢复到自动检测值）
- 重新检测（再次读取显示器物理尺寸）
- 置顶开关（勾选项，持久化）
- 水平对齐 / 垂直对齐 / 重置角度
- 退出

**DPI 自动检测：** 启动时主进程读取显示器物理尺寸（Windows 通过 WMI `WmiMonitorBasicDisplayParams`，单位厘米），结合 Electron 主显示器逻辑分辨率，用对角线法算出真实 px/mm：

```
pxPerMm = √(逻辑W² + 逻辑H²) / √(物理Wmm² + 物理Hmm²)
```

多显示器时按物理/逻辑宽高比最接近的原则匹配主显示器。macOS/Linux 暂回退到 96/25.4 默认值，可手动校准。

**校准方法：** 若自动检测值仍有偏差（WMI 物理尺寸精度有限），拿一把实体尺贴在屏幕上，拖动校准滑块直到屏幕刻度与实体尺刻度对齐。

## 实现要点

### 透明窗口 + 点击穿透

窗口配置 `frame:false / transparent:true / skipTaskbar:true / alwaysOnTop:true`。启动时 `setIgnoreMouseEvents(true, { forward:true })` —— `forward:true` 让穿透状态下仍把 `mousemove` 转发给渲染进程，从而能在鼠标移回尺子时切换回接收状态。命中检测在 `hit-test.ts`，基于点-旋转矩形测试。菜单显示期间暂停穿透逻辑，保证菜单可点击。

### SVG 渲染

一个 `<g transform="translate(cx,cy) rotate(angle)">` 包住所有元素，子元素用尺子局部坐标系（u 轴沿尺长方向，v 轴沿厚度方向）。旋转手柄直接用局部坐标 `translate(halfLenPx+offset, 0)` 定位，避免双重变换。

### 三交互

拖拽开始时捕获起始几何（中心、单位向量、半长）作为参考系。改长度时把鼠标位移投影到尺子轴向单位向量换算 mm 增量，另一端固定，中心同步移动。旋转用 `atan2(mouseY-cy, mouseX-cx)` 直接算角度。

### 持久化

自写 JSON store（`src/main/index.ts`），存于 `app.getPath('userData')/ruler-config.json`。渲染进程通过 IPC 读写，拖拽期间 debounce 400ms 落盘，拖拽结束立即落盘。DPI 校准区分自动值（`pxPerMmAuto`，启动时更新）和用户值（`pxPerMm`，手动滑块设置），用 `userCalibrated` 标志区分：未手动校准时跟随自动值，手动调过后保留用户值，"重置校准"恢复自动值。

## 贡献

见 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解本地启动、脚本、代码规范、提交规范和 PR 流程。

## 更新日志

见 [CHANGELOG.md](./CHANGELOG.md)。

## 许可证

MIT — 见 [LICENSE](./LICENSE)。版权所有 (c) 2026 kenmomo2021。
