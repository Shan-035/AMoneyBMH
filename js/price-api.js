// 價格 API 整合模組
class PriceAPI {
    constructor(settings) {
        this.settings = settings;
        this.cache = new Map();
        this.rateLimits = new Map();
    }

    // 主要價格取得方法
    async fetchPrice(symbol, category) {
        // 檢查快取
        const cacheKey = `${symbol}_${category}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 300000) { // 5分鐘快取
            return cached.price;
        }

        // 檢查速率限制
        if (this.isRateLimited(category)) {
            throw new Error(`${category} API 速率限制，請稍後再試`);
        }

        let price;
        try {
            switch (category) {
                case '台股':
                    price = await this.fetchTaiwanStock(symbol);
                    break;
                case '美股':
                    price = await this.fetchUSStock(symbol);
                    break;
                case '加密貨幣':
                    price = await this.fetchCrypto(symbol);
                    break;
                default:
                    throw new Error('不支援的市場類型');
            }

            // 更新快取
            this.cache.set(cacheKey, {
                price: price,
                timestamp: Date.now()
            });

            // 更新速率限制
            this.updateRateLimit(category);

            return price;
        } catch (error) {
            console.error(`取得 ${symbol} 價格失敗:`, error);
            // 返回快取價格或預設值
            return cached ? cached.price : 0;
        }
    }

    // 台股價格 API
    async fetchTaiwanStock(symbol) {
        const apis = [
            () => this.fetchFromTWSE(symbol),
            () => this.fetchFromYahooTW(symbol),
            () => this.fetchFromGoodinfo(symbol)
        ];

        for (const api of apis) {
            try {
                const price = await api();
                if (price && price > 0) return price;
            } catch (error) {
                console.warn('台股 API 失敗:', error.message);
            }
        }

        throw new Error('所有台股 API 都無法取得資料');
    }

    // 台灣證券交易所 API
    async fetchFromTWSE(symbol) {
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${date}&stockNo=${symbol}`;
        
        const response = await this.fetchWithTimeout(url, 10000);
        const data = await response.json();
        
        if (data.stat === 'OK' && data.data && data.data.length > 0) {
            // 取得最新一天的收盤價
            const latestData = data.data[data.data.length - 1];
            return parseFloat(latestData[6].replace(/,/g, ''));
        }
        
        throw new Error('TWSE API 無資料');
    }

    // Yahoo Finance 台股 API
    async fetchFromYahooTW(symbol) {
        const fullSymbol = symbol + '.TW';
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${fullSymbol}`;
        
        const response = await this.fetchWithTimeout(url, 8000);
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result.length > 0) {
            const result = data.chart.result[0];
            const prices = result.indicators.quote[0].close;
            const latestPrice = prices[prices.length - 1];
            return latestPrice;
        }
        
        throw new Error('Yahoo Finance TW API 無資料');
    }

    // Goodinfo API (備用)
    async fetchFromGoodinfo(symbol) {
        // 由於 CORS 限制，這個方法需要通過代理伺服器
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = `https://goodinfo.tw/tw/StockDetail.asp?STOCK_ID=${symbol}`;
        
        try {
            const response = await this.fetchWithTimeout(proxyUrl + encodeURIComponent(targetUrl), 15000);
            const html = await response.text();
            
            // 簡單的 HTML 解析來取得股價
            const priceMatch = html.match(/成交價<\/td><td[^>]*>([0-9,]+\.?[0-9]*)/);
            if (priceMatch && priceMatch[1]) {
                return parseFloat(priceMatch[1].replace(/,/g, ''));
            }
        } catch (error) {
            console.warn('Goodinfo API 錯誤:', error);
        }
        
        throw new Error('Goodinfo API 無資料');
    }

    // 美股價格 API
    async fetchUSStock(symbol) {
        const apis = [
            () => this.fetchFromAlphaVantage(symbol),
            () => this.fetchFromYahooUS(symbol),
            () => this.fetchFromFinnhub(symbol)
        ];

        for (const api of apis) {
            try {
                const price = await api();
                if (price && price > 0) return price;
            } catch (error) {
                console.warn('美股 API 失敗:', error.message);
            }
        }

        throw new Error('所有美股 API 都無法取得資料');
    }

    // Alpha Vantage API
    async fetchFromAlphaVantage(symbol) {
        if (!this.settings.alphaVantageKey) {
            throw new Error('請設定 Alpha Vantage API Key');
        }

        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.settings.alphaVantageKey}`;
        
        const response = await this.fetchWithTimeout(url, 10000);
        const data = await response.json();
        
        if (data['Global Quote'] && data['Global Quote']['05. price']) {
            return parseFloat(data['Global Quote']['05. price']);
        }
        
        throw new Error('Alpha Vantage API 無資料');
    }

    // Yahoo Finance 美股 API
    async fetchFromYahooUS(symbol) {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        
        const response = await this.fetchWithTimeout(url, 8000);
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result.length > 0) {
            const result = data.chart.result[0];
            const prices = result.indicators.quote[0].close;
            const latestPrice = prices[prices.length - 1];
            return latestPrice;
        }
        
        throw new Error('Yahoo Finance US API 無資料');
    }

    // Finnhub API (免費版)
    async fetchFromFinnhub(symbol) {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=demo`;
        
        const response = await this.fetchWithTimeout(url, 8000);
        const data = await response.json();
        
        if (data.c && data.c > 0) {
            return data.c; // 當前價格
        }
        
        throw new Error('Finnhub API 無資料');
    }

    // 加密貨幣價格 API
    async fetchCrypto(symbol) {
        const apis = [
            () => this.fetchFromCoinGecko(symbol),
            () => this.fetchFromBinance(symbol),
            () => this.fetchFromCoinMarketCap(symbol)
        ];

        for (const api of apis) {
            try {
                const price = await api();
                if (price && price > 0) return price;
            } catch (error) {
                console.warn('加密貨幣 API 失敗:', error.message);
            }
        }

        throw new Error('所有加密貨幣 API 都無法取得資料');
    }

    // CoinGecko API
    async fetchFromCoinGecko(symbol) {
        const coinId = this.getCoinGeckoId(symbol);
        let url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
        
        // 如果有 API Key，使用 Pro API
        if (this.settings.coinGeckoKey) {
            url = `https://pro-api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
        }
        
        const response = await this.fetchWithTimeout(url, 8000, {
            headers: this.settings.coinGeckoKey ? {
                'x-cg-pro-api-key': this.settings.coinGeckoKey
            } : {}
        });
        
        const data = await response.json();
        
        if (data[coinId] && data[coinId].usd) {
            return data[coinId].usd;
        }
        
        throw new Error('CoinGecko API 無資料');
    }

    // Binance API
    async fetchFromBinance(symbol) {
        const pair = symbol.toUpperCase() + 'USDT';
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`;
        
        const response = await this.fetchWithTimeout(url, 6000);
        const data = await response.json();
        
        if (data.price) {
            return parseFloat(data.price);
        }
        
        throw new Error('Binance API 無資料');
    }

    // CoinMarketCap API (需要 API Key)
    async fetchFromCoinMarketCap(symbol) {
        if (!this.settings.coinMarketCapKey) {
            throw new Error('需要 CoinMarketCap API Key');
        }

        const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol.toUpperCase()}`;
        
        const response = await this.fetchWithTimeout(url, 8000, {
            headers: {
                'X-CMC_PRO_API_KEY': this.settings.coinMarketCapKey
            }
        });
        
        const data = await response.json();
        
        if (data.data && data.data[symbol.toUpperCase()]) {
            return data.data[symbol.toUpperCase()].quote.USD.price;
        }
        
        throw new Error('CoinMarketCap API 無資料');
    }

    // 匯率 API
    async fetchExchangeRate(from, to) {
        const cacheKey = `${from}_${to}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1小時快取
            return cached.rate;
        }

        try {
            let rate;
            if (this.settings.exchangeRateKey) {
                rate = await this.fetchFromExchangeRateAPI(from, to);
            } else {
                rate = await this.fetchFromFreeExchangeAPI(from, to);
            }

            this.cache.set(cacheKey, {
                rate: rate,
                timestamp: Date.now()
            });

            return rate;
        } catch (error) {
            console.error('取得匯率失敗:', error);
            return cached ? cached.rate : 1;
        }
    }

    // ExchangeRate-API (付費)
    async fetchFromExchangeRateAPI(from, to) {
        const url = `https://v6.exchangerate-api.com/v6/${this.settings.exchangeRateKey}/latest/${from}`;
        
        const response = await this.fetchWithTimeout(url, 8000);
        const data = await response.json();
        
        if (data.conversion_rates && data.conversion_rates[to]) {
            return data.conversion_rates[to];
        }
        
        throw new Error('ExchangeRate API 無資料');
    }

    // 免費匯率 API
    async fetchFromFreeExchangeAPI(from, to) {
        const url = `https://api.exchangerate-api.com/v4/latest/${from}`;
        
        const response = await this.fetchWithTimeout(url, 8000);
        const data = await response.json();
        
        if (data.rates && data.rates[to]) {
            return data.rates[to];
        }
        
        throw new Error('免費匯率 API 無資料');
    }

    // 工具方法
    getCoinGeckoId(symbol) {
        const mapping = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'BNB': 'binancecoin',
            'ADA': 'cardano',
            'SOL': 'solana',
            'DOT': 'polkadot',
            'DOGE': 'dogecoin',
            'AVAX': 'avalanche-2',
            'LINK': 'chainlink',
            'UNI': 'uniswap'
        };
        
        return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
    }

    async fetchWithTimeout(url, timeout = 10000, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('請求超時');
            }
            throw error;
        }
    }

    isRateLimited(category) {
        const limit = this.rateLimits.get(category);
        if (!limit) return false;
        
        const now = Date.now();
        const limits = {
            '台股': { requests: 60, window: 60000 }, // 每分鐘60次
            '美股': { requests: 5, window: 60000 },   // 每分鐘5次
            '加密貨幣': { requests: 100, window: 60000 } // 每分鐘100次
        };
        
        const categoryLimit = limits[category] || { requests: 10, window: 60000 };
        
        // 清理過期記錄
        limit.requests = limit.requests.filter(time => now - time < categoryLimit.window);
        
        return limit.requests.length >= categoryLimit.requests;
    }

    updateRateLimit(category) {
        if (!this.rateLimits.has(category)) {
            this.rateLimits.set(category, { requests: [] });
        }
        
        this.rateLimits.get(category).requests.push(Date.now());
    }

    // 批量取得價格
    async fetchMultiplePrices(symbols) {
        const results = {};
        const promises = symbols.map(async ({ symbol, category }) => {
            try {
                const price = await this.fetchPrice(symbol, category);
                results[symbol] = { price, error: null };
            } catch (error) {
                results[symbol] = { price: null, error: error.message };
            }
        });

        await Promise.all(promises);
        return results;
    }

    // 清理快取
    clearCache() {
        this.cache.clear();
    }

    // 取得快取統計
    getCacheStats() {
        const now = Date.now();
        let valid = 0;
        let expired = 0;

        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp < 300000) {
                valid++;
            } else {
                expired++;
            }
        }

        return { total: this.cache.size, valid, expired };
    }
}

// 導出給 Vue 應用使用
window.PriceAPI = PriceAPI;