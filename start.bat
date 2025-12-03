@echo off
echo 正在啟動投資組合管理系統...
echo.
echo 請選擇啟動方式:
echo 1. 使用預設瀏覽器直接開啟
echo 2. 啟動本地伺服器 (需要 Python)
echo 3. 顯示使用說明
echo.
set /p choice="請輸入選項 (1-3): "

if "%choice%"=="1" (
    echo 正在開啟投資組合管理系統...
    start index.html
    goto end
)

if "%choice%"=="2" (
    echo 正在啟動本地伺服器...
    echo 服務位址: http://localhost:8000
    echo 按 Ctrl+C 可停止服務
    python -m http.server 8000
    goto end
)

if "%choice%"=="3" (
    echo.
    echo ==========================================
    echo 投資組合管理系統 v1.0.0
    echo ==========================================
    echo.
    echo 功能特色:
    echo - 支援台股、美股、加密貨幣
    echo - 即時價格更新
    echo - AI 智能投資分析
    echo - Google Sheets 雲端同步
    echo - 完整的交易記錄管理
    echo - 風險評估與資產配置分析
    echo.
    echo 使用說明:
    echo 1. 首次使用請先閱讀 USER_GUIDE.md
    echo 2. 設定 Google Sheets 請參考 google-sheets-setup.md
    echo 3. 範例配置請查看 EXAMPLES.md
    echo.
    echo 技術支援:
    echo - 確保瀏覽器版本為 Chrome 90+ 或同等版本
    echo - 需要穩定的網路連線以取得即時價格
    echo - 建議使用 1920x1080 以上解析度
    echo.
    pause
    goto start
)

echo 無效的選項，請重新選擇。
pause
goto start

:start
cls
goto :eof

:end
echo.
echo 感謝使用投資組合管理系統！
pause