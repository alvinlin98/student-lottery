<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# 🎒 班級隨機抽籤與分組工具 (Student Lottery & Team Grouper)

專為教師設計的隨堂助手，支援匯入名冊、無重複隨機抽籤、視覺化隨機分組與拖拽/點擊微調。 
 
---

## 🛠️ 開發環境與運行指南

### 1. 前置需求 (Prerequisites)
* **Node.js**：本專案使用 **Vite 6**，需要 **Node.js >= 18.0.0** (建議使用 **v20** 或更高版本)。
* 建議使用 `nvm` 管理 Node 版本：
  ```bash
  nvm use 20.18.0
  ```

---

### 2. 本地開發步驟 (Local Development)

#### 步驟 A：安裝依賴套件
```bash
npm install
```
> ⚠️ **注意**：若系統的 Node.js 版本低於 18 (例如 v16)，安裝時會缺少 `@tailwindcss/oxide` 等原生綁定套件。請務必升級 Node.js 或透過本機的 `.node/node.exe` 執行。

#### 步驟 B：設定環境變數
將 `.env.example` 複製並命名為 `.env.local`：
```bash
cp .env.example .env.local
```
並填入您的 Gemini API 金鑰（若有使用 AI 功能）：
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 步驟 C：啟動開發伺服器
```bash
npm run dev
```
啟動後可在瀏覽器開啟 `http://localhost:3000` 進行預覽與開發。

#### 步驟 D：生產環境打包
```bash
npm run build
```
打包後的靜態檔案將會輸出至 `dist/` 資料夾中。

---

## 🚀 GitHub Actions 自動化部署

本專案已配置 GitHub Actions 腳本（於 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)），每次推送到 `main` 分支時，會自動編譯並部署到 **GitHub Pages**。

### 設定步驟：
1. **設定 GitHub Pages 來源**：
   * 前往 GitHub 專案頁面，點選 **Settings** > **Pages**。
   * 在 **Build and deployment** 下方的 **Source** 選擇 **GitHub Actions**。
2. **推送代碼**：
   * 將代碼推送到 `main` 分支後，GitHub Actions 將會自動啟動並完成部署。
   * 部署成功後，您可以在 Pages 設定頁面中看到上線後的網站網址。

---

## 📂 專案結構與 Git 規範

* **`.gitignore`** 已完成優化，排除了以下不必要的檔案與敏感資料：
  * 依賴套件資料夾 (`node_modules/`)
  * 本地暫存或自訂 Node 執行檔 (`.node/`)
  * 編譯輸出 (`dist/`, `build/`)
  * 環境變數隱私檔 (`.env`, `.env.local` 等)
  * 各系統暫存檔 (`.DS_Store`, `Thumbs.db`)
  * IDE 設定資料夾 (`.vscode/`, `.idea/`)
* 建議提交 `package-lock.json` 以確保 CI/CD 流程能進行穩定的 `npm ci` 建置。
