# Changelog

本项目所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [1.0.0] - 2026-06-18

### Added

- 首个正式版本。
- 屏幕直尺：毫米刻度（1mm 短线 / 5mm 中线 / 10mm 长线 + 数字标注）。
- 拖动移动：在尺身主体左键拖动，光标 `move`。
- 调整长度：拖拽两端端边，光标按角度自动选最接近的 resize 样式，另一端固定。
- 自由旋转：拖动端外蓝色圆点手柄，任意角度，光标 `grab`/`grabbing`。
- 透明无边框窗口：无标题栏、背景透明、跳过任务栏、默认置顶。
- 点击穿透：尺外透明区不挡桌面操作，鼠标移回尺子自动恢复（Electron `setIgnoreMouseEvents` + `forward: true`）。
- DPI 自动检测：Windows 通过 WMI 读取显示器物理尺寸，对角线法算真实 px/mm，多显示器按宽高比匹配主显示器；macOS/Linux 回退默认值。
- 手动校准：右键菜单滑块（相对自动值 0.5×~2×），含重置校准、重新检测。
- 右键菜单快捷项：水平对齐 / 垂直对齐 / 重置角度 / 置顶开关 / 退出。
- 状态持久化：位置、长度、角度、校准值（区分自动/手动）、置顶状态，存于 `userData/ruler-config.json`。

### Fixed

- 修复旋转手柄双重变换导致的位置偏移和命中失联。
- 修复右键菜单点击穿透冲突导致菜单按钮无响应。
- 修复 `hitTest` 端边判定缺下界，导致菜单打开时 resize 区沿尺子轴向无限延伸。
