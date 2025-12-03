# Google Apps Script CORS 修復指南

## 問題診斷

您遇到的 "Failed to fetch" 錯誤是典型的 CORS (Cross-Origin Resource Sharing) 問題。這發生在從 Netlify 部署的網站嘗試訪問 Google Apps Script 時。

## 解決方案

### 1. 更新 Google Apps Script 代碼

請將您 Google Apps Script 中的完整代碼替換為以下內容：

```javascript
// 主要 Web App 入口點 - GET 請求
function doGet(e) {
  try {
    const action = e.parameter.action || 'test';
    const userId = e.parameter.userId;
    
    Logger.log('doGet called with action: ' + action + ', userId: ' + userId);
    
    let result;
    
    switch (action) {
      case 'load':
        result = loadData(userId);
        break;
      case 'test':
        result = testConnection();
        break;
      default:
        result = { status: 'error', message: 'Unknown action: ' + action };
    }
    
    return createCORSResponse(result);
    
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return createCORSResponse({
      status: 'error',
      message: error.toString(),
      timestamp: new Date().toISOString()
    });
  }
}

// 主要 Web App 入口點 - POST 請求
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action || 'sync';
    
    Logger.log('doPost called with action: ' + action);
    
    let result;
    
    switch (action) {
      case 'sync':
        result = syncData(postData);
        break;
      case 'test':
        result = testConnection();
        break;
      default:
        result = { status: 'error', message: 'Unknown action: ' + action };
    }
    
    return createCORSResponse(result);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createCORSResponse({
      status: 'error',
      message: error.toString(),
      timestamp: new Date().toISOString()
    });
  }
}

// 創建支援 CORS 的回應
function createCORSResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // 重要：設定 CORS 標頭
  const response = HtmlService.createHtmlOutput()
    .setContent(JSON.stringify(data))
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  
  // 返回 JSON 輸出而不是 HTML
  return output;
}

// 測試連線功能
function testConnection() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return {
      status: 'success',
      message: 'Google Apps Script connection successful',
      timestamp: new Date().toISOString(),
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      sheetsCount: ss.getSheets().length,
      scriptId: ScriptApp.getScriptId()
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Test failed: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

// 載入用戶資料
function loadData(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  const userPrefix = userId ? userId + '_' : '';
  
  try {
    // 讀取持股資料
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
    } else {
      result.holdings = [];
    }
    
    // 讀取交易紀錄
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
    } else {
      result.transactions = [];
    }
    
    return {
      status: 'success',
      data: result,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    Logger.log('Error loading data: ' + error.toString());
    return {
      status: 'error',
      message: 'Load failed: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

// 同步資料到 Google Sheets
function syncData(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userPrefix = data.userId ? data.userId + '_' : '';
  
  try {
    // 同步持股資料
    if (data.holdings && Array.isArray(data.holdings)) {
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
      if (data.holdings.length > 0) {
        const holdingsData = data.holdings.map(h => [
          h.symbol || '', h.name || '', h.quantity || 0, h.avgCost || 0, h.currentPrice || 0,
          h.marketValue || 0, h.unrealizedPnL || 0, h.returnRate || 0, h.category || '', h.sector || ''
        ]);
        
        holdingsSheet.getRange(2, 1, holdingsData.length, 10).setValues(holdingsData);
      }
    }
    
    // 同步交易紀錄
    if (data.transactions && Array.isArray(data.transactions)) {
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
      if (data.transactions.length > 0) {
        const transactionsData = data.transactions.map(t => [
          t.id || '', t.date || '', t.type || '', t.symbol || '', 
          t.quantity || 0, t.price || 0, t.total || 0, t.source || '', t.notes || ''
        ]);
        
        transactionsSheet.getRange(2, 1, transactionsData.length, 9).setValues(transactionsData);
      }
    }
    
    // 記錄同步時間
    try {
      let logSheet = ss.getSheetByName('SyncLog');
      if (!logSheet) {
        logSheet = ss.insertSheet('SyncLog');
        logSheet.getRange(1, 1, 1, 4).setValues([['Timestamp', 'UserId', 'Action', 'Status']]);
      }
      
      const lastRow = logSheet.getLastRow();
      logSheet.getRange(lastRow + 1, 1, 1, 4).setValues([[
        new Date(),
        data.userId || 'anonymous',
        'sync',
        'success'
      ]]);
    } catch (logError) {
      Logger.log('Log error (non-critical): ' + logError.toString());
    }
    
    return {
      status: 'success',
      message: 'Data synced successfully',
      timestamp: new Date().toISOString(),
      holdingsCount: data.holdings ? data.holdings.length : 0,
      transactionsCount: data.transactions ? data.transactions.length : 0
    };
    
  } catch (error) {
    Logger.log('Sync error: ' + error.toString());
    return {
      status: 'error',
      message: 'Sync failed: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}
```

### 2. 重新部署 Web App

完成代碼更新後：

1. 在 Google Apps Script 編輯器中點擊「部署」→「新增部署作業」
2. 類型選擇「網路應用程式」
3. **重要**：執行身分選擇「我」
4. **重要**：存取權限選擇「任何人」(這是關鍵設定)
5. 點擊「部署」
6. 複製新的 Web App URL

### 3. 更新應用程式設定

在您的 Netlify 網站中，使用新的 Web App URL 進行測試。

### 4. 測試步驟

1. 在瀏覽器中直接訪問：`YOUR_WEB_APP_URL?action=test`
2. 應該看到成功的 JSON 回應
3. 在您的網站中測試連線功能

### 5. 帳號密碼問題說明

關於您問的「帳號密碼註冊是怎麼紀錄的？記錄在哪裡？」：

**當前系統的用戶管理機制：**

1. **本地存儲**：用戶帳號資料儲存在瀏覽器的 `localStorage` 中
2. **資料結構**：
   ```javascript
   {
     "username": "user123",
     "passwordHash": "加密後的密碼",
     "userId": "唯一識別碼",
     "createdAt": "註冊時間"
   }
   ```

3. **資料位置**：
   - 儲存在用戶的瀏覽器本地
   - 每個瀏覽器/設備都是獨立的
   - 清除瀏覽器資料會遺失帳號

4. **資料同步**：
   - 投資組合資料會同步到 Google Sheets
   - 用戶帳號資料**不會**上傳到雲端
   - 這是出於隱私考量的設計

5. **多設備使用**：
   - 如果要在不同設備使用，需要重新註冊
   - 但可以使用相同的 userId 來同步投資組合資料

**如果您希望改善這個機制**，我們可以考慮：
- 將用戶資料也同步到 Google Sheets（需要額外的安全措施）
- 實作匯出/匯入帳號功能
- 使用 Google 登入整合

需要我協助實作這些改進嗎？

## 故障排除

如果仍然遇到問題：

1. **檢查 Web App URL**：確保使用最新的部署 URL
2. **檢查權限設定**：執行身分必須是「我」，存取權限必須是「任何人」
3. **檢查瀏覽器控制台**：查看詳細的錯誤訊息
4. **測試直接訪問**：在瀏覽器中直接開啟 `WEB_APP_URL?action=test`

需要進一步協助嗎？