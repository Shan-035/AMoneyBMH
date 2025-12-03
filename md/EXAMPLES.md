# 範例配置與測試資料

## 範例投資組合

以下提供一些範例資料，幫助您快速了解系統功能：

### 範例持股資料

```json
{
  "holdings": [
    {
      "symbol": "2330",
      "name": "台積電",
      "quantity": 100,
      "avgCost": 500,
      "currentPrice": 550,
      "marketValue": 55000,
      "unrealizedPnL": 5000,
      "returnRate": 0.1,
      "category": "台股",
      "sector": "半導體"
    },
    {
      "symbol": "2454",
      "name": "聯發科",
      "quantity": 50,
      "avgCost": 800,
      "currentPrice": 850,
      "marketValue": 42500,
      "unrealizedPnL": 2500,
      "returnRate": 0.0625,
      "category": "台股",
      "sector": "半導體"
    },
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "quantity": 10,
      "avgCost": 150,
      "currentPrice": 175,
      "marketValue": 1750,
      "unrealizedPnL": 250,
      "returnRate": 0.167,
      "category": "美股",
      "sector": "科技"
    },
    {
      "symbol": "MSFT",
      "name": "Microsoft Corp.",
      "quantity": 5,
      "avgCost": 300,
      "currentPrice": 350,
      "marketValue": 1750,
      "unrealizedPnL": 250,
      "returnRate": 0.167,
      "category": "美股",
      "sector": "科技"
    },
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "quantity": 0.5,
      "avgCost": 30000,
      "currentPrice": 35000,
      "marketValue": 17500,
      "unrealizedPnL": 2500,
      "returnRate": 0.167,
      "category": "加密貨幣",
      "sector": "加密貨幣"
    },
    {
      "symbol": "ETH",
      "name": "Ethereum",
      "quantity": 2,
      "avgCost": 1800,
      "currentPrice": 2000,
      "marketValue": 4000,
      "unrealizedPnL": 400,
      "returnRate": 0.111,
      "category": "加密貨幣",
      "sector": "加密貨幣"
    }
  ]
}
```

### 範例交易記錄

```json
{
  "transactions": [
    {
      "id": 1,
      "date": "2024-01-15",
      "type": "buy",
      "symbol": "2330",
      "quantity": 50,
      "price": 480,
      "total": 24000,
      "source": "證券商",
      "notes": "長期投資標的"
    },
    {
      "id": 2,
      "date": "2024-02-10",
      "type": "buy",
      "symbol": "2330",
      "quantity": 50,
      "price": 520,
      "total": 26000,
      "source": "證券商",
      "notes": "加碼買進"
    },
    {
      "id": 3,
      "date": "2024-01-20",
      "type": "buy",
      "symbol": "AAPL",
      "quantity": 10,
      "price": 150,
      "total": 1500,
      "source": "證券商",
      "notes": "美股投資"
    },
    {
      "id": 4,
      "date": "2024-02-01",
      "type": "buy",
      "symbol": "BTC",
      "quantity": 0.5,
      "price": 30000,
      "total": 15000,
      "source": "Binance",
      "notes": "加密貨幣投資"
    },
    {
      "id": 5,
      "date": "2024-02-15",
      "type": "buy",
      "symbol": "ETH",
      "quantity": 2,
      "price": 1800,
      "total": 3600,
      "source": "Binance",
      "notes": "以太坊長期持有"
    },
    {
      "id": 6,
      "date": "2024-03-01",
      "type": "buy",
      "symbol": "2454",
      "quantity": 50,
      "price": 800,
      "total": 40000,
      "source": "證券商",
      "notes": "聯發科投資"
    },
    {
      "id": 7,
      "date": "2024-03-15",
      "type": "buy",
      "symbol": "MSFT",
      "quantity": 5,
      "price": 300,
      "total": 1500,
      "source": "證券商",
      "notes": "微軟股票"
    }
  ]
}
```

## 推薦 API 服務商

### 免費方案推薦

#### 台股價格
1. **台灣證券交易所 OpenAPI**
   - 完全免費
   - 官方資料來源
   - 無需註冊

2. **Yahoo Finance API**
   - 免費使用
   - 涵蓋全球市場
   - 穩定性佳

#### 美股價格
1. **Alpha Vantage (免費版)**
   - 每日 100 次查詢
   - 官方支援
   - 資料準確

2. **Yahoo Finance API**
   - 免費使用
   - 即時報價
   - 歷史資料完整

#### 加密貨幣價格
1. **CoinGecko (免費版)**
   - 每分鐘 10-50 次查詢
   - 涵蓋主流加密貨幣
   - 無需註冊

2. **Binance API**
   - 免費使用
   - 即時報價
   - 高頻率查詢

### 付費方案推薦

#### 美股進階功能
1. **Alpha Vantage (付費版)**
   - 月費 $49.99 起
   - 無查詢限制
   - 包含技術指標

2. **Finnhub**
   - 月費 $19.99 起
   - 即時資料
   - API 穩定

#### 加密貨幣進階功能
1. **CoinGecko (付費版)**
   - 月費 $129 起
   - 高頻率查詢
   - 更多數據指標

2. **CoinMarketCap API**
   - 月費 $33 起
   - 專業級資料
   - 完整的市場數據

#### AI 分析服務
1. **OpenAI API**
   - 按使用量計費
   - GPT-3.5: $0.002/1K tokens
   - GPT-4: $0.03/1K tokens

## 效能優化設定

### 推薦的 API 查詢頻率

```javascript
// 推薦設定
const apiSettings = {
    // 價格更新頻率 (毫秒)
    priceUpdateInterval: 300000,  // 5分鐘
    
    // 快取時間設定
    priceCache: 300000,          // 5分鐘
    exchangeRateCache: 3600000,  // 1小時
    analysisCache: 3600000,      // 1小時
    
    // API 限制設定
    rateLimits: {
        taiwanStock: { requests: 60, window: 60000 },  // 每分鐘60次
        usStock: { requests: 5, window: 60000 },       // 每分鐘5次
        crypto: { requests: 100, window: 60000 },      // 每分鐘100次
        ai: { requests: 10, window: 3600000 }          // 每小時10次
    }
};
```

### 瀏覽器儲存優化

```javascript
// LocalStorage 清理腳本
function cleanupStorage() {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
        if (key.startsWith('portfolio_cache_')) {
            const item = JSON.parse(localStorage.getItem(key));
            if (now - item.timestamp > 86400000) { // 24小時
                localStorage.removeItem(key);
            }
        }
    });
}

// 建議每日執行一次
setInterval(cleanupStorage, 86400000);
```

## Google Sheets 範本

### Holdings 工作表範本

| A (symbol) | B (name) | C (quantity) | D (avgCost) | E (currentPrice) | F (marketValue) | G (unrealizedPnL) | H (returnRate) | I (category) | J (sector) |
|------------|----------|--------------|-------------|------------------|-----------------|-------------------|----------------|--------------|------------|
| 2330       | 台積電    | 100          | 500         | 550              | 55000           | 5000              | 0.1            | 台股         | 半導體     |
| AAPL       | Apple    | 10           | 150         | 175              | 1750            | 250               | 0.167          | 美股         | 科技       |
| BTC        | Bitcoin  | 0.5          | 30000       | 35000            | 17500           | 2500              | 0.167          | 加密貨幣     | 加密貨幣   |

### Transactions 工作表範本

| A (id) | B (date)     | C (type) | D (symbol) | E (quantity) | F (price) | G (total) | H (source) | I (notes)    |
|--------|--------------|----------|------------|--------------|-----------|-----------|------------|--------------|
| 1      | 2024-01-15   | buy      | 2330       | 100          | 500       | 50000     | 證券商     | 長期投資     |
| 2      | 2024-01-20   | buy      | AAPL       | 10           | 150       | 1500      | 證券商     | 美股投資     |
| 3      | 2024-02-01   | buy      | BTC        | 0.5          | 30000     | 15000     | Binance    | 加密貨幣投資 |

## 常用股票代碼參考

### 台股熱門標的
```
2330 - 台積電
2454 - 聯發科
2317 - 鴻海
2382 - 廣達
2308 - 台達電
2303 - 聯電
1301 - 台塑
1303 - 南亞
2882 - 國泰金
2891 - 中信金
```

### 美股熱門標的
```
AAPL - Apple Inc.
MSFT - Microsoft Corp.
GOOGL - Alphabet Inc.
AMZN - Amazon.com Inc.
TSLA - Tesla Inc.
NVDA - NVIDIA Corp.
META - Meta Platforms Inc.
NFLX - Netflix Inc.
AMD - Advanced Micro Devices
INTC - Intel Corp.
```

### 加密貨幣主流幣種
```
BTC - Bitcoin
ETH - Ethereum
BNB - Binance Coin
ADA - Cardano
SOL - Solana
DOT - Polkadot
DOGE - Dogecoin
AVAX - Avalanche
LINK - Chainlink
UNI - Uniswap
```

## 快速部署腳本

### 本地伺服器啟動 (Python)

```bash
# Python 3
python -m http.server 8000

# 瀏覽器開啟 http://localhost:8000
```

### 簡單的備份腳本

```javascript
// 自動備份腳本
function autoBackup() {
    const data = {
        holdings: JSON.parse(localStorage.getItem('portfolio_holdings') || '[]'),
        transactions: JSON.parse(localStorage.getItem('portfolio_transactions') || '[]'),
        settings: JSON.parse(localStorage.getItem('portfolioSettings') || '{}'),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// 設定每週自動備份
setInterval(autoBackup, 7 * 24 * 60 * 60 * 1000);
```

這個範例配置文件提供了完整的測試資料和設定建議，讓用戶可以快速上手並了解系統的各項功能。