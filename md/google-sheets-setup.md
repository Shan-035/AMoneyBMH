# Google Sheets 設定指南

## 步驟 1: 建立 Google 試算表

1. 前往 [Google Sheets](https://sheets.google.com)
2. 建立新的空白試算表
3. 將試算表命名為「投資組合管理」
4. 建立以下工作表：
   - `Holdings`（持股資料）
   - `Transactions`（交易紀錄）
   - `Settings`（設定）

## 步驟 2: 設定工作表結構

### Holdings 工作表 (第一行為標題)
| A      | B      | C        | D       | E           | F          | G            | H           | I        | J      |
|--------|--------|----------|---------|-------------|------------|--------------|-------------|----------|--------|
| symbol | name   | quantity | avgCost | currentPrice| marketValue| unrealizedPnL| returnRate  | category | sector |
| 2330   | 台積電   | 100      | 500     | 550         | 55000      | 5000         | 0.1         | 台股     | 半導體  |

### Transactions 工作表 (第一行為標題)
| A  | B    | C    | D      | E        | F     | G     | H     | I    |
|----|------|------|--------|----------|-------|-------|-------|------|
| id | date | type | symbol | quantity | price | total | source| notes|
| 1  | 2024-01-15 | buy | 2330 | 100 | 500 | 50000 | 證券商 | 長期投資 |

### Settings 工作表
| A              | B                    |
|----------------|---------------------|
| defaultCurrency| TWD                 |
| costMethod     | FIFO                |
| autoRefresh    | TRUE                |

## 步驟 3: 建立 Google Apps Script

1. 在試算表中，點擊「擴充功能」→「Apps Script」
2. 刪除預設程式碼，貼上以下程式碼：

```javascript
// Google Apps Script 程式碼 - 複製下方完整程式碼
function doPost(e) {
  // 設定 CORS 標頭
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'sync') {
      syncData(data);
      return output.setContent(JSON.stringify({
        status: 'success',
        timestamp: new Date().toISOString()
      }));
    }
    
    return output.setContent(JSON.stringify({
      status: 'error', 
      message: 'Unknown action'
    }));
      
  } catch (error) {
    return output.setContent(JSON.stringify({
      status: 'error', 
      message: error.toString()
    }));
  }
}

function doGet(e) {
  // 設定 CORS 標頭以支援跨網域請求
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const action = e.parameter.action || 'test';
    
    if (action === 'load') {
      const data = loadData();
      return output.setContent(JSON.stringify({
        status: 'success',
        data: data,
        timestamp: new Date().toISOString()
      }));
    }
    
    if (action === 'test') {
      return output.setContent(JSON.stringify({
        status: 'success', 
        message: 'Connection test successful',
        timestamp: new Date().toISOString(),
        source: 'Google Apps Script'
      }));
    }
    
    return output.setContent(JSON.stringify({
      status: 'error', 
      message: 'Unknown action: ' + action
    }));
      
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return output.setContent(JSON.stringify({
      status: 'error', 
      message: error.toString(),
      timestamp: new Date().toISOString()
    }));
  }
}

// 新增：清理測試函數
function testConnection() {
  return {
    status: 'success',
    message: 'Google Apps Script is working properly',
    timestamp: new Date().toISOString(),
    sheetsCount: SpreadsheetApp.getActiveSpreadsheet().getSheets().length,
    scriptId: ScriptApp.getScriptId()
  };
}

function syncData(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 如果有用戶 ID，使用用戶專用的工作表
  const userPrefix = data.userId ? data.userId + '_' : '';
  
  try {
    // 同步持股資料
    if (data.holdings && data.holdings.length > 0) {
      const sheetName = userPrefix + 'Holdings';
      let holdingsSheet = ss.getSheetByName(sheetName);
      
      if (!holdingsSheet) {
        holdingsSheet = ss.insertSheet(sheetName);
      }
      
      holdingsSheet.clear();
      
      // 設定標題列
      holdingsSheet.getRange(1, 1, 1, 10).setValues([[
        'symbol', 'name', 'quantity', 'avgCost', 'currentPrice',
        'marketValue', 'unrealizedPnL', 'returnRate', 'category', 'sector'
      ]]);
      
      // 寫入資料
      const holdingsData = data.holdings.map(h => [
        h.symbol, h.name, h.quantity, h.avgCost, h.currentPrice,
        h.marketValue, h.unrealizedPnL, h.returnRate, h.category, h.sector
      ]);
      
      if (holdingsData.length > 0) {
        holdingsSheet.getRange(2, 1, holdingsData.length, 10).setValues(holdingsData);
      }
    }
    
    // 同步交易紀錄
    if (data.transactions && data.transactions.length > 0) {
      const sheetName = userPrefix + 'Transactions';
      let transactionsSheet = ss.getSheetByName(sheetName);
      
      if (!transactionsSheet) {
        transactionsSheet = ss.insertSheet(sheetName);
      }
      
      transactionsSheet.clear();
      
      // 設定標題列
      transactionsSheet.getRange(1, 1, 1, 9).setValues([[
        'id', 'date', 'type', 'symbol', 'quantity', 'price', 'total', 'source', 'notes'
      ]]);
      
      // 寫入資料
      const transactionsData = data.transactions.map(t => [
        t.id, t.date, t.type, t.symbol, t.quantity, t.price, t.total, t.source, t.notes
      ]);
      
      if (transactionsData.length > 0) {
        transactionsSheet.getRange(2, 1, transactionsData.length, 9).setValues(transactionsData);
      }
    }
    
    // 記錄同步時間
    const logSheet = ss.getSheetByName('SyncLog') || ss.insertSheet('SyncLog');
    const lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow + 1, 1, 1, 4).setValues([[
      new Date(),
      data.userId || 'anonymous',
      'sync',
      'success'
    ]]);
    
  } catch (error) {
    Logger.log('Sync error: ' + error.toString());
    throw error;
  }
}

function loadData(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  
  // 如果有用戶 ID，使用用戶專用的工作表
  const userPrefix = userId ? userId + '_' : '';
  
  // 讀取持股資料
  try {
    const holdingsSheet = ss.getSheetByName(userPrefix + 'Holdings');
    if (holdingsSheet && holdingsSheet.getLastRow() > 1) {
      const holdingsData = holdingsSheet.getDataRange().getValues();
      if (holdingsData.length > 1) {
        result.holdings = holdingsData.slice(1).map(row => ({
          symbol: row[0],
          name: row[1],
          quantity: row[2],
          avgCost: row[3],
          currentPrice: row[4],
          marketValue: row[5],
          unrealizedPnL: row[6],
          returnRate: row[7],
          category: row[8],
          sector: row[9]
        }));
      }
    }
  } catch (e) {
    Logger.log('Error loading holdings: ' + e.toString());
  }
  
  // 讀取交易紀錄
  try {
    const transactionsSheet = ss.getSheetByName(userPrefix + 'Transactions');
    if (transactionsSheet && transactionsSheet.getLastRow() > 1) {
      const transactionsData = transactionsSheet.getDataRange().getValues();
      if (transactionsData.length > 1) {
        result.transactions = transactionsData.slice(1).map(row => ({
          id: row[0],
          date: row[1],
          type: row[2],
          symbol: row[3],
          quantity: row[4],
          price: row[5],
          total: row[6],
          source: row[7],
          notes: row[8]
        }));
      }
    }
  } catch (e) {
    Logger.log('Error loading transactions: ' + e.toString());
  }
  
  return result;
}

// 新增：清理測試函數
function testConnection() {
  return {
    status: 'success',
    message: 'Google Apps Script is working properly',
    timestamp: new Date().toISOString(),
    sheetsCount: SpreadsheetApp.getActiveSpreadsheet().getSheets().length
  };
}
```

## 步驟 4: 部署為 Web App

1. 在 Apps Script 編輯器中，點擊右上角的「部署」按鈕
2. 選擇「新增部署作業」
3. 在「類型」中選擇「網路應用程式」
4. 設定以下選項：
   - 描述：投資組合管理 API
   - 執行身分：我
   - 存取權限：任何人
5. 點擊「部署」
6. 複製產生的「網路應用程式 URL」

## 步驟 5: 在前端系統中設定

1. 開啟投資組合管理系統
2. 前往「設定」頁面
3. 在「Google Apps Script URL」欄位中貼上剛才複製的 URL
4. 點擊「測試連線」確認設定正確

## 注意事項

1. **權限設定**：確保 Apps Script 有存取試算表的權限
2. **CORS 問題**：Web App 需要設定為「任何人」才能從前端存取
3. **資料安全**：建議定期備份試算表資料
4. **API 限制**：Google Apps Script 有執行時間和頻率限制

## 疑難排解

### 常見錯誤
1. **403 錯誤**：檢查 Apps Script 權限設定
2. **連線失敗**：確認 URL 正確且 Web App 已部署
3. **資料不同步**：檢查試算表工作表名稱是否正確

### 測試方法
1. 直接在瀏覽器中訪問 `{你的URL}?action=test`
2. 應該會返回成功訊息的 JSON

## 進階功能

### 自動備份
可以在 Apps Script 中設定定時觸發器來自動備份資料：

```javascript
function createBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const backupName = '投資組合備份_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  ss.copy(backupName);
}
```

### 資料驗證
在同步資料時加入驗證邏輯：

```javascript
function validateData(data) {
  // 驗證必要欄位
  if (!data.symbol || !data.quantity) {
    throw new Error('缺少必要欄位');
  }
  
  // 驗證數值格式
  if (isNaN(data.quantity) || isNaN(data.price)) {
    throw new Error('數值格式錯誤');
  }
  
  return true;
}
```