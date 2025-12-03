// AI 投資分析模組
class AIAnalyzer {
    constructor(settings) {
        this.settings = settings;
        this.analysisCache = new Map();
    }

    // 主要分析方法
    async analyzePortfolio(holdings, transactions) {
        try {
            if (!this.settings.openaiKey) {
                throw new Error('請設定 OpenAI API Key');
            }

            const analysis = await this.performAnalysis(holdings, transactions);
            return analysis;
        } catch (error) {
            console.error('AI 分析失敗:', error);
            return this.getFallbackAnalysis(holdings, transactions);
        }
    }

    // 執行 OpenAI 分析
    async performAnalysis(holdings, transactions) {
        const prompt = this.buildAnalysisPrompt(holdings, transactions);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.settings.openaiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一個專業的投資顧問，專長於台股、美股和加密貨幣分析。請提供客觀、平衡的投資建議，並強調風險管理的重要性。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            const analysisText = data.choices[0].message.content;
            return this.parseAnalysisResponse(analysisText);
        }

        throw new Error('AI 回應格式錯誤');
    }

    // 建立分析提示
    buildAnalysisPrompt(holdings, transactions) {
        const totalAssets = holdings.reduce((sum, h) => sum + h.marketValue, 0);
        const totalPnL = holdings.reduce((sum, h) => sum + h.unrealizedPnL, 0);
        const totalReturn = totalPnL / (totalAssets - totalPnL);

        const stockValue = holdings.filter(h => h.category !== '加密貨幣').reduce((sum, h) => sum + h.marketValue, 0);
        const cryptoValue = holdings.filter(h => h.category === '加密貨幣').reduce((sum, h) => sum + h.marketValue, 0);

        const recentTransactions = transactions.slice(0, 10);
        
        return `請分析以下投資組合：

總資產: ${this.formatCurrency(totalAssets)}
未實現損益: ${this.formatCurrency(totalPnL)} (${(totalReturn * 100).toFixed(2)}%)
股票資產: ${this.formatCurrency(stockValue)} (${((stockValue / totalAssets) * 100).toFixed(1)}%)
加密貨幣資產: ${this.formatCurrency(cryptoValue)} (${((cryptoValue / totalAssets) * 100).toFixed(1)}%)

持股明細:
${holdings.map(h => `${h.symbol} (${h.name}): 持有 ${h.quantity} 股/幣，成本 ${this.formatCurrency(h.avgCost)}，現價 ${this.formatCurrency(h.currentPrice)}，損益 ${this.formatCurrency(h.unrealizedPnL)} (${(h.returnRate * 100).toFixed(2)}%)`).join('\n')}

最近交易記錄:
${recentTransactions.map(t => `${t.date}: ${t.type === 'buy' ? '買入' : '賣出'} ${t.symbol} ${t.quantity} 單位，價格 ${this.formatCurrency(t.price)}`).join('\n')}

請提供以下分析：
1. 投資組合整體評估
2. 資產配置建議
3. 個股表現分析
4. 風險評估
5. 具體投資建議

請用繁體中文回答，並格式化為 JSON 格式：
{
  "overallAssessment": "整體評估內容",
  "allocationAdvice": "資產配置建議",
  "stockAnalysis": [{"symbol": "代碼", "analysis": "分析內容"}],
  "riskAssessment": "風險評估內容",
  "recommendations": ["建議1", "建議2", "建議3"],
  "score": 85
}`;
    }

    // 解析 AI 回應
    parseAnalysisResponse(response) {
        try {
            // 嘗試解析 JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                return this.validateAnalysis(analysis);
            }
        } catch (error) {
            console.warn('AI 回應解析失敗，使用文字解析:', error);
        }

        // 備用文字解析
        return this.parseTextResponse(response);
    }

    // 文字回應解析
    parseTextResponse(response) {
        const sections = response.split(/\d+\.\s*/);
        
        return {
            overallAssessment: this.extractSection(response, ['整體評估', '總體評估']),
            allocationAdvice: this.extractSection(response, ['資產配置', '配置建議']),
            stockAnalysis: this.extractStockAnalysis(response),
            riskAssessment: this.extractSection(response, ['風險評估', '風險分析']),
            recommendations: this.extractRecommendations(response),
            score: this.calculateScore(response)
        };
    }

    // 提取文字段落
    extractSection(text, keywords) {
        for (const keyword of keywords) {
            const regex = new RegExp(`${keyword}[：:](.*?)(?=\\n\\n|\\d+\\.|$)`, 'si');
            const match = text.match(regex);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return '暫無相關分析';
    }

    // 提取個股分析
    extractStockAnalysis(text) {
        const analysis = [];
        const stockMatches = text.match(/([A-Z0-9]+)\s*[（(].*?[）)].*?：.*?(?=\n|$)/g);
        
        if (stockMatches) {
            stockMatches.forEach(match => {
                const symbolMatch = match.match(/([A-Z0-9]+)/);
                if (symbolMatch) {
                    analysis.push({
                        symbol: symbolMatch[1],
                        analysis: match.replace(/^[A-Z0-9]+\s*[（(].*?[）)]\s*：?\s*/, '')
                    });
                }
            });
        }

        return analysis;
    }

    // 提取建議
    extractRecommendations(text) {
        const recommendations = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (line.match(/^[\d-•]\s*/) || line.includes('建議') || line.includes('應該')) {
                const cleaned = line.replace(/^[\d-•]\s*/, '').trim();
                if (cleaned.length > 10) {
                    recommendations.push(cleaned);
                }
            }
        }

        return recommendations.slice(0, 5); // 最多5個建議
    }

    // 計算評分
    calculateScore(text) {
        const positiveWords = ['優秀', '良好', '穩健', '成長', '潛力', '建議持有'];
        const negativeWords = ['風險', '虧損', '下跌', '謹慎', '建議賣出', '高風險'];
        
        let score = 70; // 基礎分數
        
        positiveWords.forEach(word => {
            const matches = (text.match(new RegExp(word, 'gi')) || []).length;
            score += matches * 2;
        });
        
        negativeWords.forEach(word => {
            const matches = (text.match(new RegExp(word, 'gi')) || []).length;
            score -= matches * 3;
        });

        return Math.max(0, Math.min(100, score));
    }

    // 驗證分析結果
    validateAnalysis(analysis) {
        const required = ['overallAssessment', 'allocationAdvice', 'riskAssessment'];
        
        for (const field of required) {
            if (!analysis[field]) {
                analysis[field] = '暫無相關分析';
            }
        }

        if (!analysis.stockAnalysis || !Array.isArray(analysis.stockAnalysis)) {
            analysis.stockAnalysis = [];
        }

        if (!analysis.recommendations || !Array.isArray(analysis.recommendations)) {
            analysis.recommendations = ['建議定期檢視投資組合'];
        }

        if (!analysis.score || analysis.score < 0 || analysis.score > 100) {
            analysis.score = 70;
        }

        return analysis;
    }

    // 備用分析 (無 AI)
    getFallbackAnalysis(holdings, transactions) {
        const totalAssets = holdings.reduce((sum, h) => sum + h.marketValue, 0);
        const totalPnL = holdings.reduce((sum, h) => sum + h.unrealizedPnL, 0);
        const totalReturn = totalPnL / (totalAssets - totalPnL);

        const stockValue = holdings.filter(h => h.category !== '加密貨幣').reduce((sum, h) => sum + h.marketValue, 0);
        const cryptoValue = holdings.filter(h => h.category === '加密貨幣').reduce((sum, h) => sum + h.marketValue, 0);

        const stockPercent = (stockValue / totalAssets) * 100;
        const cryptoPercent = (cryptoValue / totalAssets) * 100;

        // 基礎分析邏輯
        let assessment = '';
        if (totalReturn > 0.1) {
            assessment = '投資組合表現優秀，總回報率超過 10%。';
        } else if (totalReturn > 0.05) {
            assessment = '投資組合表現良好，總回報率在 5-10% 之間。';
        } else if (totalReturn > 0) {
            assessment = '投資組合小幅獲利，表現穩健。';
        } else {
            assessment = '投資組合目前處於虧損狀態，需要謹慎評估。';
        }

        const recommendations = [];
        if (cryptoPercent > 30) {
            recommendations.push('加密貨幣佔比較高，建議適度降低風險');
        }
        if (stockPercent < 50) {
            recommendations.push('可考慮增加股票投資比重');
        }
        if (holdings.length < 5) {
            recommendations.push('建議增加投資標的以分散風險');
        }

        return {
            overallAssessment: assessment,
            allocationAdvice: `目前股票佔 ${stockPercent.toFixed(1)}%，加密貨幣佔 ${cryptoPercent.toFixed(1)}%。建議股票:加密貨幣比例維持在 7:3 或 8:2。`,
            stockAnalysis: holdings.map(h => ({
                symbol: h.symbol,
                analysis: h.returnRate > 0.1 ? '表現優異，建議持續持有' : h.returnRate < -0.1 ? '表現不佳，需密切關注' : '表現平穩'
            })),
            riskAssessment: cryptoPercent > 30 ? '風險偏高，加密貨幣波動較大' : '風險適中，投資組合相對穩健',
            recommendations: recommendations.length > 0 ? recommendations : ['建議定期檢視投資組合'],
            score: Math.max(0, Math.min(100, 70 + (totalReturn * 100)))
        };
    }

    // 市場趨勢分析
    async analyzeMarketTrend(category) {
        try {
            if (!this.settings.openaiKey) {
                return this.getFallbackTrendAnalysis(category);
            }

            const prompt = `請分析當前${category}市場趨勢，包括：
1. 近期市場表現
2. 主要影響因素
3. 短期展望 (1-3個月)
4. 投資建議

請提供簡潔專業的分析，字數控制在300字內。`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.openaiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一個專業的市場分析師，請提供客觀的市場分析。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            
            if (data.choices && data.choices[0]) {
                return {
                    category: category,
                    analysis: data.choices[0].message.content,
                    timestamp: new Date().toISOString()
                };
            }

            throw new Error('AI 回應格式錯誤');
        } catch (error) {
            console.error('市場趨勢分析失敗:', error);
            return this.getFallbackTrendAnalysis(category);
        }
    }

    // 備用趨勢分析
    getFallbackTrendAnalysis(category) {
        const analyses = {
            '台股': '台股市場受到全球經濟環境及美國聯準會政策影響，建議關注科技股及傳產股的輪動機會。短期內可能面臨震盪，長期看好台灣半導體產業發展。',
            '美股': '美股市場關注通膨數據及聯準會政策方向，科技股波動較大。建議關注AI概念股及傳統價值股的平衡配置。',
            '加密貨幣': '加密貨幣市場波動劇烈，受到監管政策及機構投資者動向影響。建議謹慎投資，做好風險管控。'
        };

        return {
            category: category,
            analysis: analyses[category] || '請關注市場基本面變化，做好風險管理。',
            timestamp: new Date().toISOString()
        };
    }

    // 個股深度分析
    async analyzeStock(symbol, category, priceHistory = []) {
        try {
            if (!this.settings.openaiKey) {
                return this.getFallbackStockAnalysis(symbol, category);
            }

            const prompt = `請分析 ${symbol} (${category}) 這檔股票/加密貨幣：
${priceHistory.length > 0 ? `價格趨勢: ${priceHistory.slice(-10).join(', ')}` : ''}

請提供：
1. 基本面分析
2. 技術面分析
3. 風險評估
4. 投資建議 (買入/持有/賣出)
5. 目標價位 (如適用)

請提供簡潔專業的分析。`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.openaiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一個專業的股票分析師，請提供客觀的投資分析。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 600,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            
            if (data.choices && data.choices[0]) {
                return {
                    symbol: symbol,
                    category: category,
                    analysis: data.choices[0].message.content,
                    timestamp: new Date().toISOString()
                };
            }

            throw new Error('AI 回應格式錯誤');
        } catch (error) {
            console.error(`${symbol} 分析失敗:`, error);
            return this.getFallbackStockAnalysis(symbol, category);
        }
    }

    // 備用個股分析
    getFallbackStockAnalysis(symbol, category) {
        return {
            symbol: symbol,
            category: category,
            analysis: `${symbol} 屬於${category}市場，建議關注基本面變化及技術指標走勢。投資前請做好風險評估，建議分批佈局降低風險。`,
            timestamp: new Date().toISOString()
        };
    }

    // 風險評估
    assessRisk(holdings) {
        let riskScore = 0;
        let riskFactors = [];

        // 集中度風險
        const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
        const maxHolding = Math.max(...holdings.map(h => h.marketValue));
        const concentration = maxHolding / totalValue;
        
        if (concentration > 0.5) {
            riskScore += 30;
            riskFactors.push('持股過度集中，單一標的佔比超過 50%');
        } else if (concentration > 0.3) {
            riskScore += 15;
            riskFactors.push('持股集中度偏高，建議分散投資');
        }

        // 市場分散度
        const markets = [...new Set(holdings.map(h => h.category))];
        if (markets.length === 1) {
            riskScore += 20;
            riskFactors.push('投資市場過於單一，缺乏分散');
        }

        // 加密貨幣比例
        const cryptoValue = holdings.filter(h => h.category === '加密貨幣').reduce((sum, h) => sum + h.marketValue, 0);
        const cryptoRatio = cryptoValue / totalValue;
        
        if (cryptoRatio > 0.3) {
            riskScore += 25;
            riskFactors.push('加密貨幣佔比過高，波動風險較大');
        } else if (cryptoRatio > 0.2) {
            riskScore += 10;
            riskFactors.push('加密貨幣佔比偏高，需注意波動風險');
        }

        // 虧損標的比例
        const losers = holdings.filter(h => h.unrealizedPnL < 0);
        const loserRatio = losers.length / holdings.length;
        
        if (loserRatio > 0.6) {
            riskScore += 20;
            riskFactors.push('多數持股處於虧損狀態');
        }

        return {
            score: Math.min(100, riskScore),
            level: riskScore < 20 ? '低' : riskScore < 50 ? '中' : '高',
            factors: riskFactors
        };
    }

    // 工具方法
    formatCurrency(amount) {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // 快取管理
    clearAnalysisCache() {
        this.analysisCache.clear();
    }

    getCachedAnalysis(key) {
        const cached = this.analysisCache.get(key);
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1小時有效
            return cached.data;
        }
        return null;
    }

    setCachedAnalysis(key, data) {
        this.analysisCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
}

// 導出給 Vue 應用使用
window.AIAnalyzer = AIAnalyzer;