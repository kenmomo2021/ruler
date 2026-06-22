## 开发环境准备 / Prerequisites

- Node.js >= 18（推荐 20+）
- npm >= 9
- Windows 需要 WebView2（Win10/11 自带）
- 首次安装若 Electron 二进制下载超时，设置镜像：
  ```powershell
  $env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
  ```

## 本地启动 / Local setup

```bash
git clone https://github.com/kenmomo2021/ruler.git
cd ruler
npm install
npm run dev
```

## 常用脚本 / Scripts

| 命令                   | 作用                                   |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | 开发模式（热重载）                     |
| `npm run typecheck`    | TypeScript 类型检查（main + renderer） |
| `npm run lint`         | ESLint 检查                            |
| `npm run lint:fix`     | ESLint 自动修复                        |
| `npm run format`       | Prettier 格式化全部文件                |
| `npm run format:check` | Prettier 格式检查（CI 用）             |
| `npm run build`        | 构建产物到 `out/`                      |
| `npm run build:win`    | 打包 Windows .exe                      |
| `npm run build:mac`    | 打包 macOS .dmg                        |
| `npm run build:linux`  | 打包 Linux AppImage                    |

## 代码规范 / Code style

- 使用 ESLint + Prettier 统一风格，提交前请运行 `npm run lint && npm run format`
- TypeScript 严格模式（`strict: true`），不要用 `any` 除非必要
- 无注释策略：除非逻辑非常晦涩，否则不加注释（让代码自解释）
- 提交前确保 `npm run typecheck` 通过

## 提交规范 / Commit convention

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <subject>

feat:     新功能
fix:      修复 bug
docs:     文档变更
style:    代码格式（不影响功能）
refactor: 重构
perf:     性能优化
test:     测试
chore:    构建/工具变更
```

示例：

```
feat(renderer): 支持双击翻转尺子方向
fix(ruler): 修复旋转后端边命中区域无限延伸
docs: 更新 README DPI 说明
```

## PR 流程 / Pull request workflow

1. Fork 仓库并创建分支：`feat/my-feature` 或 `fix/my-bugfix`
2. 保持分支与 main 同步
3. 确保 CI 通过（typecheck + lint + build）
4. PR 描述清楚改动内容和动机
5. 关联相关 issue（如 `Closes #12`）

## 项目结构 / Project structure

详见 [README.md](./README.md) 的"Project Structure"章节。三进程架构：

- `src/main/` — 主进程（Node.js 环境）
- `src/preload/` — 预加载脚本（Node + 受限渲染上下文）
- `src/renderer/` — 渲染进程（浏览器环境，SVG 渲染和交互）

## 发布 / Release

维护者可通过 GitHub Actions 自动打包发布，或本地执行 `npm run build:<platform>`。版本号遵循 [Semver](https://semver.org/)，变更记录在 [CHANGELOG.md](./CHANGELOG.md)。
