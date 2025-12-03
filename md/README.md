# 個人投資組合管理系統

## 功能特色

### 📈 核心功能
- **多市場支援**：台股、美股、加密貨幣
- **即時價格**：透過 API 取得最新市價
- **損益計算**：自動計算未實現損益、平均成本
- **資產總覽**：折線圖、圓餅圖視覺化分析
- **多幣別支援**：TWD/USD/USDT 自由切換

### 📊 頁面功能
- **首頁**：持有資產總覽、總資產圖表、損益統計
- **交易紀錄**：手動新增交易、FIFO/加權平均成本計算
- **資產配置**：股票vs加密貨幣、各幣種/產業佔比分析
- **設定頁面**：API 配置、Google Sheets 連接

### 🔧 技術架構
- **前端**：Vue.js 3 + Tailwind CSS
- **資料庫**：Google Sheets (透過 Apps Script)
- **圖表**：Chart.js
- **API 整合**：支援多種財經 API

## 安裝與使用

1. 將所有檔案放置於 Web 伺服器目錄
2. 在 Google Sheets 建立資料表
3. 設定 Google Apps Script 並部署為 Web App
4. 在系統設定頁面輸入相關 API 金鑰

## Google Sheets 設定

請參考 `google-sheets-setup.md` 文件進行 Google Sheets 和 Apps Script 的設定。

## 支援的 API

- **台股**：台灣證券交易所 API
- **美股**：Alpha Vantage, Yahoo Finance
- **加密貨幣**：CoinGecko, Binance API
- **匯率**：ExchangeRate API

## 瀏覽器相容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+