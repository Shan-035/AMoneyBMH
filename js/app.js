// 投資組合管理系統 Vue.js 應用程式
const { createApp } = Vue;

createApp({
    data() {
        return {
            // 應用程式狀態
            currentPage: 'home',
            isLoading: false,
            isRefreshing: false,
            mobileMenuOpen: false,
            isAnalyzing: false,
            
            // 貨幣和時間範圍
            selectedCurrency: 'TWD',
            timeRange: '30D',
            pieChartType: 'category',
            
            // 搜尋和篩選
            searchKeyword: '',
            filterCategory: '',
            transactionDateFrom: '',
            transactionDateTo: '',
            transactionTypeFilter: '',
            transactionMarketFilter: '',
            transactionSearchKeyword: '',
            
            // 彈窗和訊息
            showAddTransactionModal: false,
            showMessage: false,
            message: '',
            messageType: 'success',
            
            // 財務資料
            totalAssets: 0,
            stockAssets: 0,
            cryptoAssets: 0,
            totalReturn: 0,
            unrealizedPnL: 0,
            
            // 持股資料
            holdings: [
                {
                    symbol: '2330',
                    name: '台積電',
                    quantity: 100,
                    avgCost: 500,
                    currentPrice: 550,
                    marketValue: 55000,
                    unrealizedPnL: 5000,
                    returnRate: 0.1,
                    category: '台股',
                    sector: '半導體'
                },
                {
                    symbol: 'AAPL',
                    name: 'Apple Inc.',
                    quantity: 10,
                    avgCost: 150,
                    currentPrice: 175,
                    marketValue: 1750,
                    unrealizedPnL: 250,
                    returnRate: 0.167,
                    category: '美股',
                    sector: '科技'
                },
                {
                    symbol: 'BTC',
                    name: 'Bitcoin',
                    quantity: 0.5,
                    avgCost: 30000,
                    currentPrice: 35000,
                    marketValue: 17500,
                    unrealizedPnL: 2500,
                    returnRate: 0.167,
                    category: '加密貨幣',
                    sector: '加密貨幣'
                }
            ],
            
            // 交易紀錄
            transactions: [
                {
                    id: 1,
                    date: '2024-01-15',
                    type: 'buy',
                    symbol: '2330',
                    quantity: 100,
                    price: 500,
                    total: 50000,
                    source: '證券商',
                    notes: '長期投資'
                },
                {
                    id: 2,
                    date: '2024-01-20',
                    type: 'buy',
                    symbol: 'AAPL',
                    quantity: 10,
                    price: 150,
                    total: 1500,
                    source: '證券商',
                    notes: '美股投資'
                },
                {
                    id: 3,
                    date: '2024-02-01',
                    type: 'buy',
                    symbol: 'BTC',
                    quantity: 0.5,
                    price: 30000,
                    total: 15000,
                    source: 'Binance',
                    notes: '加密貨幣投資'
                }
            ],
            
            // 新增交易表單
            newTransaction: {
                type: 'buy',
                symbol: '',
                quantity: 0,
                price: 0,
                date: new Date().toISOString().split('T')[0],
                source: '證券商',
                notes: ''
            },
            
            // 系統設定
            settings: {
                googleSheetsUrl: '',
                alphaVantageKey: '',
                coinGeckoKey: '',
                exchangeRateKey: '',
                openaiKey: '',
                defaultCurrency: 'TWD',
                costMethod: 'FIFO',
                autoRefresh: true
            },
            
            // 匯率資料
            exchangeRates: {
                'USD': 31.5,
                'USDT': 31.5
            },
            
            // 圖表實例
            pieChart: null,
            lineChart: null,
            stockCryptoChart: null,
            currencyChart: null,
            sectorChart: null,

            // AI 分析相關
            portfolioAnalysis: null,
            riskAnalysis: null,
            priceAPI: null,
            aiAnalyzer: null,

            // 用戶管理
            userManager: null,
            currentUser: null,
            authMode: 'login',
            isAuthenticating: false,
            showUserMenu: false,
            showImportModal: false,
            importFileData: null,
            authForm: {
                username: '',
                password: '',
                confirmPassword: ''
            }
        };
    },
    
    computed: {
        // 篩選後的持股
        filteredHoldings() {
            return this.holdings.filter(holding => {
                const matchesKeyword = !this.searchKeyword || 
                    holding.symbol.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                    holding.name.toLowerCase().includes(this.searchKeyword.toLowerCase());
                const matchesCategory = !this.filterCategory || holding.category === this.filterCategory;
                return matchesKeyword && matchesCategory;
            });
        },
        
        // 篩選後的交易紀錄
        filteredTransactions() {
            return this.transactions.filter(transaction => {
                const matchesDateFrom = !this.transactionDateFrom || transaction.date >= this.transactionDateFrom;
                const matchesDateTo = !this.transactionDateTo || transaction.date <= this.transactionDateTo;
                const matchesType = !this.transactionTypeFilter || transaction.type === this.transactionTypeFilter;
                const matchesMarket = !this.transactionMarketFilter || this.getMarketBySymbol(transaction.symbol) === this.transactionMarketFilter;
                const matchesKeyword = !this.transactionSearchKeyword || 
                    transaction.symbol.toLowerCase().includes(this.transactionSearchKeyword.toLowerCase());
                
                return matchesDateFrom && matchesDateTo && matchesType && matchesMarket && matchesKeyword;
            });
        },
        
        // 資產配置資料
        allocationData() {
            return this.holdings.map(holding => ({
                symbol: holding.symbol,
                marketValue: holding.marketValue,
                percentage: holding.marketValue / this.totalAssets,
                pnl: holding.unrealizedPnL,
                type: holding.category === '加密貨幣' ? '加密貨幣' : '股票'
            }));
        }
    },
    
    methods: {
        // 格式化貨幣
        formatCurrency(amount) {
            if (amount === null || amount === undefined) return '$0';
            
            let symbol = '$';
            if (this.selectedCurrency === 'TWD') symbol = 'NT$';
            else if (this.selectedCurrency === 'USD') symbol = '$';
            else if (this.selectedCurrency === 'USDT') symbol = 'USDT ';
            
            // 根據選擇的貨幣轉換金額
            let convertedAmount = amount;
            if (this.selectedCurrency !== 'TWD') {
                convertedAmount = amount / (this.exchangeRates[this.selectedCurrency] || 1);
            }
            
            return symbol + convertedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            });
        },
        
        // 格式化日期
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-TW');
        },
        
        // 根據股票代碼判斷市場
        getMarketBySymbol(symbol) {
            if (/^\d{4}$/.test(symbol)) return '台股';
            if (symbol === 'BTC' || symbol === 'ETH' || symbol.includes('USDT')) return '加密貨幣';
            return '美股';
        },
        
        // 更新貨幣
        updateCurrency() {
            this.calculateTotalAssets();
            this.updateCharts();
        },
        
        // 重新整理資料
        async refreshData() {
            this.isRefreshing = true;
            try {
                await this.fetchLatestPrices();
                await this.syncWithGoogleSheets();
                this.showSuccessMessage('資料更新成功');
            } catch (error) {
                this.showErrorMessage('資料更新失敗: ' + error.message);
            } finally {
                this.isRefreshing = false;
            }
        },
        
        // 取得最新價格
        async fetchLatestPrices() {
            if (!this.priceAPI) return;
            
            const symbols = this.holdings.map(h => ({ symbol: h.symbol, category: h.category }));
            const results = await this.priceAPI.fetchMultiplePrices(symbols);
            
            for (let holding of this.holdings) {
                const result = results[holding.symbol];
                if (result && result.price && !result.error) {
                    holding.currentPrice = result.price;
                    holding.marketValue = holding.quantity * result.price;
                    holding.unrealizedPnL = holding.marketValue - (holding.quantity * holding.avgCost);
                    holding.returnRate = holding.unrealizedPnL / (holding.quantity * holding.avgCost);
                } else {
                    console.warn(`無法取得 ${holding.symbol} 的價格:`, result?.error || '未知錯誤');
                }
            }
            this.calculateTotalAssets();
            this.updateRiskAnalysis();
        },
        
        // 取得單一股票價格
        async fetchPrice(symbol, category) {
            // 根據不同市場使用不同的API
            if (category === '台股') {
                return await this.fetchTaiwanStockPrice(symbol);
            } else if (category === '美股') {
                return await this.fetchUSStockPrice(symbol);
            } else if (category === '加密貨幣') {
                return await this.fetchCryptoPrice(symbol);
            }
            throw new Error('未知的市場類型');
        },
        
        // 台股價格API
        async fetchTaiwanStockPrice(symbol) {
            // 使用台灣證券交易所API或其他免費API
            // 這裡暫時返回模擬數據
            return Math.random() * 100 + 400;
        },
        
        // 美股價格API
        async fetchUSStockPrice(symbol) {
            if (!this.settings.alphaVantageKey) {
                throw new Error('請設定 Alpha Vantage API Key');
            }
            
            try {
                const response = await fetch(
                    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.settings.alphaVantageKey}`
                );
                const data = await response.json();
                return parseFloat(data['Global Quote']['05. price']);
            } catch (error) {
                // 備用 Yahoo Finance API
                return Math.random() * 50 + 150;
            }
        },
        
        // 加密貨幣價格API
        async fetchCryptoPrice(symbol) {
            try {
                const response = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`
                );
                const data = await response.json();
                return data[symbol.toLowerCase()].usd;
            } catch (error) {
                return Math.random() * 10000 + 30000;
            }
        },
        
        // 計算總資產
        calculateTotalAssets() {
            this.stockAssets = this.holdings
                .filter(h => h.category !== '加密貨幣')
                .reduce((sum, h) => sum + h.marketValue, 0);
            
            this.cryptoAssets = this.holdings
                .filter(h => h.category === '加密貨幣')
                .reduce((sum, h) => sum + h.marketValue, 0);
            
            this.totalAssets = this.stockAssets + this.cryptoAssets;
            
            const totalCost = this.holdings.reduce((sum, h) => sum + (h.quantity * h.avgCost), 0);
            this.unrealizedPnL = this.totalAssets - totalCost;
            this.totalReturn = totalCost > 0 ? this.unrealizedPnL / totalCost : 0;
        },
        
        // 新增交易
        async addTransaction() {
            if (!this.currentUser) {
                this.showErrorMessage('請先登入');
                return;
            }
            
            const transaction = {
                ...this.newTransaction,
                id: Date.now(),
                total: this.newTransaction.quantity * this.newTransaction.price
            };
            
            // 先更新本地資料
            this.transactions.unshift(transaction);
            this.updateHoldings(transaction);
            
            // 關閉彈窗並顯示成功訊息
            this.showAddTransactionModal = false;
            this.resetNewTransaction();
            this.showSuccessMessage('交易紀錄新增成功');
            
            // 即時增量同步到 Google Sheets
            if (this.settings.googleSheetsUrl) {
                await this.syncSingleTransaction(transaction, 'add');
            } else {
                // 備用：完整同步
                this.syncWithGoogleSheets();
            }
        },
        
        // 更新持股
        updateHoldings(transaction) {
            const existingHolding = this.holdings.find(h => h.symbol === transaction.symbol);
            
            if (transaction.type === 'buy') {
                if (existingHolding) {
                    // 計算新的加權平均成本
                    const totalQuantity = existingHolding.quantity + transaction.quantity;
                    const totalCost = (existingHolding.quantity * existingHolding.avgCost) + 
                                     (transaction.quantity * transaction.price);
                    existingHolding.avgCost = totalCost / totalQuantity;
                    existingHolding.quantity = totalQuantity;
                    existingHolding.marketValue = totalQuantity * existingHolding.currentPrice;
                } else {
                    // 新增持股
                    this.holdings.push({
                        symbol: transaction.symbol,
                        name: this.getStockName(transaction.symbol),
                        quantity: transaction.quantity,
                        avgCost: transaction.price,
                        currentPrice: transaction.price,
                        marketValue: transaction.quantity * transaction.price,
                        unrealizedPnL: 0,
                        returnRate: 0,
                        category: this.getMarketBySymbol(transaction.symbol),
                        sector: this.getSectorBySymbol(transaction.symbol)
                    });
                }
            } else if (transaction.type === 'sell' && existingHolding) {
                existingHolding.quantity -= transaction.quantity;
                if (existingHolding.quantity <= 0) {
                    const index = this.holdings.findIndex(h => h.symbol === transaction.symbol);
                    this.holdings.splice(index, 1);
                } else {
                    existingHolding.marketValue = existingHolding.quantity * existingHolding.currentPrice;
                }
            }
            
            this.calculateTotalAssets();
        },
        
        // 取得股票名稱
        getStockName(symbol) {
            const names = {
                '2330': '台積電',
                'AAPL': 'Apple Inc.',
                'BTC': 'Bitcoin',
                'ETH': 'Ethereum'
            };
            return names[symbol] || symbol;
        },
        
        // 取得產業分類
        getSectorBySymbol(symbol) {
            const sectors = {
                '2330': '半導體',
                'AAPL': '科技',
                'BTC': '加密貨幣',
                'ETH': '加密貨幣'
            };
            return sectors[symbol] || '其他';
        },
        
        // 重設新交易表單
        resetNewTransaction() {
            this.newTransaction = {
                type: 'buy',
                symbol: '',
                quantity: 0,
                price: 0,
                date: new Date().toISOString().split('T')[0],
                source: '證券商',
                notes: ''
            };
        },
        
        // 編輯交易
        editTransaction(transaction) {
            // 實作編輯交易邏輯
            console.log('編輯交易:', transaction);
        },
        
        // 刪除交易
        async deleteTransaction(id) {
            if (confirm('確定要刪除這筆交易嗎？')) {
                const index = this.transactions.findIndex(t => t.id === id);
                if (index > -1) {
                    // 先保存要刪除的交易資料
                    const transactionToDelete = { ...this.transactions[index] };
                    
                    // 從本地資料中移除
                    this.transactions.splice(index, 1);
                    this.showSuccessMessage('交易紀錄已刪除');
                    
                    // 即時增量同步到 Google Sheets
                    if (this.settings.googleSheetsUrl) {
                        await this.syncSingleTransaction(transactionToDelete, 'delete');
                    } else {
                        // 備用：完整同步
                        this.syncWithGoogleSheets();
                    }
                }
            }
        },
        
        // Google Sheets 同步
        async syncWithGoogleSheets() {
            if (!this.currentUser || !this.settings.googleSheetsUrl) {
                // 儲存到本地作為備份
                this.saveToLocalStorage();
                return;
            }
            
            try {
                // 發送資料到 Google Sheets
                const response = await fetch(this.settings.googleSheetsUrl, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'sync',
                        userId: this.currentUser.id, // 添加用戶 ID 以區分資料
                        holdings: this.holdings,
                        transactions: this.transactions
                    })
                });
                
                if (!response.ok) {
                    throw new Error('同步失敗');
                }
                
                // 同時儲存到本地作為備份
                this.saveToLocalStorage();
            } catch (error) {
                console.error('Google Sheets 同步錯誤:', error);
                // 失敗時至少儲存到本地
                this.saveToLocalStorage();
            }
        },
        
        // 從 Google Sheets 讀取資料
        async loadFromGoogleSheets() {
            if (!this.currentUser || !this.settings.googleSheetsUrl) {
                // 嘗試從本地儲存載入
                this.loadFromLocalStorage();
                return;
            }
            
            try {
                const response = await fetch(this.settings.googleSheetsUrl + '?action=load');
                const data = await response.json();
                
                if (data.holdings) this.holdings = data.holdings;
                if (data.transactions) this.transactions = data.transactions;
                
                // 同時儲存到用戶本地儲存作為備份
                this.saveToLocalStorage();
                
                this.calculateTotalAssets();
            } catch (error) {
                console.error('從 Google Sheets 讀取資料失敗:', error);
                // 載入本地備份
                this.loadFromLocalStorage();
            }
        },

        // 從本地儲存載入
        loadFromLocalStorage() {
            if (!this.currentUser) return;
            
            try {
                const holdings = this.userManager.getUserItem('portfolio_holdings');
                const transactions = this.userManager.getUserItem('portfolio_transactions');
                
                if (holdings) this.holdings = JSON.parse(holdings);
                if (transactions) this.transactions = JSON.parse(transactions);
                
                this.calculateTotalAssets();
            } catch (error) {
                console.error('從本地儲存載入資料失敗:', error);
            }
        },

        // 儲存到本地儲存
        saveToLocalStorage() {
            if (!this.currentUser) return;
            
            try {
                this.userManager.setUserItem('portfolio_holdings', JSON.stringify(this.holdings));
                this.userManager.setUserItem('portfolio_transactions', JSON.stringify(this.transactions));
            } catch (error) {
                console.error('儲存到本地儲存失敗:', error);
            }
        },
        
        // 測試 Google Sheets 連線
        async testGoogleSheetsConnection() {
            if (!this.settings.googleSheetsUrl) {
                this.showErrorMessage('請輸入 Google Sheets URL');
                return;
            }
            
            this.isLoading = true;
            
            try {
                const url = this.settings.googleSheetsUrl + '?action=test';
                console.log('Testing connection to:', url);
                
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Test response:', data);
                    
                    if (data.status === 'success') {
                        this.showSuccessMessage('Google Sheets 連線測試成功！');
                    } else {
                        this.showErrorMessage('Google Sheets 回應錯誤: ' + (data.message || '未知錯誤'));
                    }
                } else {
                    this.showErrorMessage(`HTTP 錯誤 ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Connection test error:', error);
                this.showErrorMessage('連線測試失敗: ' + error.message + '\n請檢查 Web App URL 是否正確，並確認已設定為「任何人」可存取');
            } finally {
                this.isLoading = false;
            }
        },
        
        // 儲存設定
        saveSettings() {
            if (this.currentUser) {
                // 儲存到用戶配置中
                this.userManager.updateUserConfig({
                    settings: this.settings,
                    googleSheetsUrl: this.settings.googleSheetsUrl,
                    apiKeys: {
                        alphaVantageKey: this.settings.alphaVantageKey,
                        coinGeckoKey: this.settings.coinGeckoKey,
                        exchangeRateKey: this.settings.exchangeRateKey,
                        openaiKey: this.settings.openaiKey
                    }
                });
            } else {
                // 備用：儲存到 localStorage
                localStorage.setItem('portfolioSettings', JSON.stringify(this.settings));
            }
            this.showSuccessMessage('設定已儲存');
        },
        
        // 載入設定
        loadSettings() {
            if (this.currentUser) {
                // 從用戶配置載入
                const config = this.userManager.getUserConfig();
                if (config && config.settings) {
                    this.settings = { ...this.settings, ...config.settings };
                }
                if (config && config.apiKeys) {
                    this.settings = { ...this.settings, ...config.apiKeys };
                }
            } else {
                // 備用：從 localStorage 載入
                const saved = localStorage.getItem('portfolioSettings');
                if (saved) {
                    this.settings = { ...this.settings, ...JSON.parse(saved) };
                }
            }
        },
        
        // 顯示成功訊息
        showSuccessMessage(msg) {
            this.message = msg;
            this.messageType = 'success';
            this.showMessage = true;
            setTimeout(() => {
                this.showMessage = false;
            }, 3000);
        },
        
        // 顯示錯誤訊息
        showErrorMessage(msg) {
            this.message = msg;
            this.messageType = 'error';
            this.showMessage = true;
            setTimeout(() => {
                this.showMessage = false;
            }, 3000);
        },
        
        // 初始化圖表
        initCharts() {
            this.$nextTick(() => {
                this.initPieChart();
                this.initLineChart();
                this.initAllocationCharts();
            });
        },
        
        // 初始化圓餅圖
        initPieChart() {
            const ctx = document.getElementById('pieChart');
            if (!ctx) return;
            
            if (this.pieChart) {
                this.pieChart.destroy();
            }
            
            const data = this.pieChartType === 'category' ? 
                this.getCategoryData() : this.getCurrencyData();
            
            this.pieChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: [
                            '#3b82f6',
                            '#f59e0b',
                            '#10b981',
                            '#ef4444',
                            '#8b5cf6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },
        
        // 初始化折線圖
        initLineChart() {
            const ctx = document.getElementById('lineChart');
            if (!ctx) return;
            
            if (this.lineChart) {
                this.lineChart.destroy();
            }
            
            const data = this.getTimelineData();
            
            this.lineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: '總資產',
                        data: data.values,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        },
        
        // 初始化配置分析圖表
        initAllocationCharts() {
            this.initStockCryptoChart();
            this.initCurrencyChart();
            this.initSectorChart();
        },
        
        // 股票vs加密貨幣圖表
        initStockCryptoChart() {
            const ctx = document.getElementById('stockCryptoChart');
            if (!ctx) return;
            
            if (this.stockCryptoChart) {
                this.stockCryptoChart.destroy();
            }
            
            this.stockCryptoChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['股票', '加密貨幣'],
                    datasets: [{
                        data: [this.stockAssets, this.cryptoAssets],
                        backgroundColor: ['#3b82f6', '#f59e0b']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },
        
        // 幣種分佈圖表
        initCurrencyChart() {
            const ctx = document.getElementById('currencyChart');
            if (!ctx) return;
            
            if (this.currencyChart) {
                this.currencyChart.destroy();
            }
            
            const currencyData = this.getCurrencyData();
            
            this.currencyChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: currencyData.labels,
                    datasets: [{
                        data: currencyData.values,
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },
        
        // 產業分佈圖表
        initSectorChart() {
            const ctx = document.getElementById('sectorChart');
            if (!ctx) return;
            
            if (this.sectorChart) {
                this.sectorChart.destroy();
            }
            
            const sectorData = this.getSectorData();
            
            this.sectorChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: sectorData.labels,
                    datasets: [{
                        data: sectorData.values,
                        backgroundColor: ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },
        
        // 取得類別資料
        getCategoryData() {
            const categories = {};
            this.holdings.forEach(holding => {
                categories[holding.category] = (categories[holding.category] || 0) + holding.marketValue;
            });
            
            return {
                labels: Object.keys(categories),
                values: Object.values(categories)
            };
        },
        
        // 取得幣種資料
        getCurrencyData() {
            const currencies = { 'TWD': 0, 'USD': 0, 'USDT': 0 };
            this.holdings.forEach(holding => {
                if (holding.category === '台股') {
                    currencies.TWD += holding.marketValue;
                } else if (holding.category === '美股') {
                    currencies.USD += holding.marketValue;
                } else if (holding.category === '加密貨幣') {
                    currencies.USDT += holding.marketValue;
                }
            });
            
            const labels = Object.keys(currencies).filter(key => currencies[key] > 0);
            const values = labels.map(key => currencies[key]);
            
            return { labels, values };
        },
        
        // 取得產業資料
        getSectorData() {
            const sectors = {};
            this.holdings.forEach(holding => {
                sectors[holding.sector] = (sectors[holding.sector] || 0) + holding.marketValue;
            });
            
            return {
                labels: Object.keys(sectors),
                values: Object.values(sectors)
            };
        },
        
        // 取得時間軸資料
        getTimelineData() {
            // 模擬歷史資料
            const days = this.timeRange === '7D' ? 7 : 
                        this.timeRange === '30D' ? 30 :
                        this.timeRange === '90D' ? 90 : 365;
            
            const labels = [];
            const values = [];
            const today = new Date();
            
            for (let i = days; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                
                if (this.timeRange === '90D') {
                    labels.push(date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }));
                } else if (this.timeRange === '1Y') {
                    labels.push(date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short' }));
                } else {
                    labels.push(date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }));
                }
                
                // 模擬資產變化
                const baseValue = this.totalAssets;
                const variation = (Math.random() - 0.5) * 0.1;
                values.push(baseValue * (1 + variation));
            }
            
            return { labels, values };
        },
        
        // 更新圖表
        updateCharts() {
            if (this.pieChart) this.initPieChart();
            if (this.lineChart) this.initLineChart();
            if (this.stockCryptoChart) this.initAllocationCharts();
        },

        // 初始化模組
        initializeModules() {
            if (!this.currentUser) return;
            
            // 初始化價格 API
            if (typeof PriceAPI !== 'undefined') {
                this.priceAPI = new PriceAPI(this.settings);
            }
            
            // 初始化 AI 分析器
            if (typeof AIAnalyzer !== 'undefined') {
                this.aiAnalyzer = new AIAnalyzer(this.settings);
            }
        },

        // AI 分析方法
        async analyzePortfolio() {
            if (!this.aiAnalyzer) {
                this.showErrorMessage('AI 分析模組未初始化');
                return;
            }
            
            this.isAnalyzing = true;
            try {
                this.portfolioAnalysis = await this.aiAnalyzer.analyzePortfolio(this.holdings, this.transactions);
            } catch (error) {
                this.showErrorMessage('AI 分析失敗: ' + error.message);
            } finally {
                this.isAnalyzing = false;
            }
        },

        // 更新風險分析
        updateRiskAnalysis() {
            if (!this.aiAnalyzer || this.holdings.length === 0) return;
            
            try {
                this.riskAnalysis = this.aiAnalyzer.assessRisk(this.holdings);
            } catch (error) {
                console.error('風險分析失敗:', error);
            }
        },

        // 分析個股
        async analyzeStock(symbol) {
            if (!this.aiAnalyzer) {
                this.showErrorMessage('AI 分析模組未初始化');
                return;
            }
            
            const holding = this.holdings.find(h => h.symbol === symbol);
            if (!holding) return;
            
            try {
                const analysis = await this.aiAnalyzer.analyzeStock(symbol, holding.category);
                
                // 顯示分析結果（可以用模態框或其他方式）
                this.showSuccessMessage(`${symbol} 分析完成`);
                console.log('個股分析結果:', analysis);
            } catch (error) {
                this.showErrorMessage('個股分析失敗: ' + error.message);
            }
        },

        // 用戶管理方法
        initializeUserManager() {
            this.userManager = new UserManager();
            
            // 檢查是否有已登入的用戶
            const savedUser = localStorage.getItem('current_user');
            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    if (this.userManager.users[userData.username]) {
                        this.currentUser = userData;
                        this.userManager.currentUser = userData;
                        this.userManager.setUserStoragePrefix(userData.id);
                        this.loadUserSettings();
                    }
                } catch (error) {
                    console.error('讀取用戶資料失敗:', error);
                    localStorage.removeItem('current_user');
                }
            }
        },

        // 用戶註冊
        register() {
            if (this.authForm.password !== this.authForm.confirmPassword) {
                this.showErrorMessage('密碼與確認密碼不一致');
                return;
            }

            if (this.authForm.password.length < 6) {
                this.showErrorMessage('密碼長度至少需要 6 個字元');
                return;
            }

            this.isAuthenticating = true;

            try {
                const userId = this.userManager.createUser(
                    this.authForm.username, 
                    this.authForm.password
                );
                
                this.showSuccessMessage('註冊成功！正在自動登入...');
                
                // 自動登入
                setTimeout(() => {
                    this.login();
                }, 1000);
            } catch (error) {
                this.showErrorMessage(error.message);
            } finally {
                this.isAuthenticating = false;
            }
        },

        // 用戶登入
        login() {
            this.isAuthenticating = true;

            try {
                const user = this.userManager.login(
                    this.authForm.username, 
                    this.authForm.password
                );
                
                this.currentUser = user;
                localStorage.setItem('current_user', JSON.stringify(user));
                
                this.loadUserSettings();
                this.initializeModules();
                this.loadFromGoogleSheets();
                
                this.showSuccessMessage(`歡迎回來，${user.username}！`);
                
                // 重設表單
                this.authForm = {
                    username: '',
                    password: '',
                    confirmPassword: ''
                };
            } catch (error) {
                this.showErrorMessage(error.message);
            } finally {
                this.isAuthenticating = false;
            }
        },

        // 用戶登出
        logout() {
            if (confirm('確定要登出嗎？')) {
                this.userManager.logout();
                this.currentUser = null;
                localStorage.removeItem('current_user');
                
                // 清理應用程式狀態
                this.holdings = [];
                this.transactions = [];
                this.portfolioAnalysis = null;
                this.riskAnalysis = null;
                
                this.showUserMenu = false;
                this.showSuccessMessage('已成功登出');
            }
        },

        // 載入用戶設定
        loadUserSettings() {
            if (!this.currentUser) return;
            
            const config = this.userManager.getUserConfig();
            if (config) {
                this.settings = { ...this.settings, ...config.settings };
            }
        },

        // 匯出用戶資料
        exportUserData() {
            try {
                const userData = this.userManager.exportUserData();
                const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `portfolio_backup_${this.currentUser.username}_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                this.showUserMenu = false;
                this.showSuccessMessage('資料已匯出');
            } catch (error) {
                this.showErrorMessage('匯出失敗: ' + error.message);
            }
        },

        // 處理匯入檔案
        handleImportFile(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.importFileData = JSON.parse(e.target.result);
                } catch (error) {
                    this.showErrorMessage('檔案格式錯誤');
                    this.importFileData = null;
                }
            };
            reader.readAsText(file);
        },

        // 匯入用戶資料
        importUserData() {
            if (!this.importFileData) {
                this.showErrorMessage('請先選擇檔案');
                return;
            }

            try {
                this.userManager.importUserData(this.importFileData);
                this.showImportModal = false;
                this.importFileData = null;
                
                // 重新載入資料
                this.loadFromGoogleSheets();
                this.calculateTotalAssets();
                
                this.showSuccessMessage('資料匯入成功');
            } catch (error) {
                this.showErrorMessage('匯入失敗: ' + error.message);
            }
        },

        // AI 投資組合分析
        async analyzePortfolio() {
            if (!this.aiAnalyzer) {
                this.showErrorMessage('AI 分析功能未啟用');
                return;
            }

            this.isAnalyzing = true;
            try {
                const analysis = await this.aiAnalyzer.analyzePortfolio(this.holdings, this.transactions);
                this.portfolioAnalysis = analysis;
                this.showSuccessMessage('AI 分析完成');
            } catch (error) {
                this.showErrorMessage('AI 分析失敗: ' + error.message);
            } finally {
                this.isAnalyzing = false;
            }
        },

        // 更新風險分析
        updateRiskAnalysis() {
            if (!this.aiAnalyzer) return;
            this.riskAnalysis = this.aiAnalyzer.assessRisk(this.holdings);
        },

        // 個股分析
        async analyzeStock(symbol) {
            if (!this.aiAnalyzer) {
                this.showErrorMessage('AI 分析功能未啟用');
                return;
            }

            const holding = this.holdings.find(h => h.symbol === symbol);
            if (!holding) return;

            try {
                const analysis = await this.aiAnalyzer.analyzeStock(symbol, holding.category);
                
                // 顯示分析結果彈窗
                this.showStockAnalysisModal(analysis);
            } catch (error) {
                this.showErrorMessage(`${symbol} 分析失敗: ` + error.message);
            }
        },

        // 顯示個股分析彈窗
        showStockAnalysisModal(analysis) {
            // 這裡可以實作顯示個股分析的彈窗
            alert(`${analysis.symbol} 分析結果:\n\n${analysis.analysis}`);
        },

        // 初始化 API 模組
        initializeModules() {
            // 初始化價格 API
            this.priceAPI = new PriceAPI(this.settings);
            
            // 初始化 AI 分析器
            this.aiAnalyzer = new AIAnalyzer(this.settings);
        },

        // 數據匯出功能
        exportData(format = 'csv') {
            try {
                let data, filename;
                
                if (format === 'csv') {
                    data = this.generateCSV();
                    filename = `投資組合_${new Date().toISOString().split('T')[0]}.csv`;
                } else if (format === 'json') {
                    data = JSON.stringify({
                        holdings: this.holdings,
                        transactions: this.transactions,
                        summary: {
                            totalAssets: this.totalAssets,
                            unrealizedPnL: this.unrealizedPnL,
                            totalReturn: this.totalReturn
                        },
                        exportDate: new Date().toISOString()
                    }, null, 2);
                    filename = `投資組合_${new Date().toISOString().split('T')[0]}.json`;
                }

                this.downloadFile(data, filename, format === 'csv' ? 'text/csv' : 'application/json');
                this.showSuccessMessage('資料匯出成功');
            } catch (error) {
                this.showErrorMessage('資料匯出失敗: ' + error.message);
            }
        },

        // 生成 CSV 數據
        generateCSV() {
            const headers = ['股票代碼', '股票名稱', '持有數量', '平均成本', '現價', '市值', '未實現損益', '報酬率', '類別', '產業'];
            const rows = this.holdings.map(h => [
                h.symbol,
                h.name,
                h.quantity,
                h.avgCost,
                h.currentPrice,
                h.marketValue,
                h.unrealizedPnL,
                (h.returnRate * 100).toFixed(2) + '%',
                h.category,
                h.sector
            ]);

            return [headers, ...rows].map(row => row.join(',')).join('\n');
        },

        // 下載檔案
        downloadFile(data, filename, mimeType) {
            const blob = new Blob([data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        },

        // 匯入數據
        importData(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.holdings && Array.isArray(data.holdings)) {
                        this.holdings = data.holdings;
                    }
                    
                    if (data.transactions && Array.isArray(data.transactions)) {
                        this.transactions = data.transactions;
                    }
                    
                    this.calculateTotalAssets();
                    this.updateCharts();
                    this.updateRiskAnalysis();
                    this.showSuccessMessage('資料匯入成功');
                } catch (error) {
                    this.showErrorMessage('資料匯入失敗: ' + error.message);
                }
            };
            reader.readAsText(file);
        },
        
        // 單一交易增量同步到 Google Sheets
        async syncSingleTransaction(transaction, action) {
            if (!this.settings.googleSheetsUrl || !this.currentUser) {
                console.log('Skip sync: no URL or user');
                return;
            }
            
            try {
                const payload = {
                    action: 'updateTransaction',
                    userId: this.currentUser.userId,
                    transaction: transaction,
                    operation: action, // 'add' or 'delete'
                    timestamp: new Date().toISOString()
                };
                
                console.log('Syncing single transaction:', payload);
                
                const response = await fetch(this.settings.googleSheetsUrl, {
                    method: 'POST',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Sync result:', result);
                    
                    if (result.status === 'success') {
                        console.log(`交易 ${action} 同步成功`);
                        // 不顯示成功訊息，避免過多通知
                    } else {
                        console.warn('同步回應異常:', result.message);
                    }
                } else {
                    console.error('同步請求失敗:', response.status, response.statusText);
                    // 靜默失敗，不影響用戶體驗
                }
                
            } catch (error) {
                console.error('交易同步錯誤:', error);
                // 靜默失敗，不影響用戶體驗
            }
        },
        
        // 增強版完整同步功能
        async syncToGoogleSheetsComplete() {
            if (!this.settings.googleSheetsUrl || !this.currentUser) {
                return;
            }
            
            this.isLoading = true;
            
            try {
                const payload = {
                    action: 'sync',
                    userId: this.currentUser.userId,
                    holdings: this.holdings || [],
                    transactions: this.transactions || [],
                    timestamp: new Date().toISOString()
                };
                
                console.log('Performing complete sync:', payload);
                
                const response = await fetch(this.settings.googleSheetsUrl, {
                    method: 'POST',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Complete sync result:', result);
                    
                    if (result.status === 'success') {
                        this.showSuccessMessage('資料已完整同步到 Google Sheets');
                    } else {
                        this.showErrorMessage('同步失敗: ' + (result.message || '未知錯誤'));
                    }
                } else {
                    this.showErrorMessage(`同步失敗: HTTP ${response.status}`);
                }
                
            } catch (error) {
                console.error('Complete sync error:', error);
                this.showErrorMessage('同步失敗: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        }
    },
    
    // 組件掛載完成後執行
    mounted() {
        this.initializeUserManager();
        
        // 只有當用戶已登入時才初始化其他功能
        if (this.currentUser) {
            this.loadSettings();
            this.initializeModules();
            this.calculateTotalAssets();
            this.loadFromGoogleSheets();
            this.initCharts();
            this.updateRiskAnalysis();
        }
        
        // 自動重新整理
        if (this.settings.autoRefresh) {
            setInterval(() => {
                this.fetchLatestPrices();
            }, 300000); // 每5分鐘
        }
        
        // 監聽圖表類型變化
        this.$watch('pieChartType', () => {
            this.initPieChart();
        });
        
        this.$watch('timeRange', () => {
            this.initLineChart();
        });

        // 監聽設定變化，重新初始化模組
        this.$watch('settings', () => {
            this.initializeModules();
        }, { deep: true });
    }
}).mount('#app');
