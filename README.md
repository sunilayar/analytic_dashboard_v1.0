# PulseGrid Terminal

Real-time market analytics dashboard built with Next.js, Socket.IO, Lightweight Charts, and TradingView widgets.

## Included

- Multi-asset coverage for `NSE`, `BSE`, `US Stocks`, `Crypto`, `Forex`, and `Indices`
- Live dashboard updates over WebSockets
- Candlestick visualization with volume overlay
- Technical indicators:
  - `RSI`
  - `MACD`
  - `EMA / SMA`
  - `Bollinger Bands`
  - `Volume Analysis`
  - `Support / Resistance`
- TradingView advanced chart embed with built-in studies
- Timeframe filters: `1m`, `5m`, `15m`, `1H`, `1D`, `1W`
- AI-style buy/sell recommendation engine
- Search, watchlist, favorites, alerts
- Portfolio tracking and unrealized P&L analytics
- Market heatmap, sentiment panel, strategy backtest snapshot, paper trading readiness
- Dark and light mode responsive trading interface

## Stack

- Frontend: `Next.js 16`, `React 19`, `Tailwind CSS 4`
- Real-time Engine: `Socket.IO`
- Charting: `TradingView Widget`, `lightweight-charts`
- Runtime: custom `Node` server for websocket streaming

## Local Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run start
```

## Architecture Notes

- [`server.mjs`](/c:/Users/sunil/OneDrive/Desktop/StockPlotter/server.mjs) hosts Next.js and emits live market ticks over Socket.IO.
- [`src/components/trading-dashboard.tsx`](/c:/Users/sunil/OneDrive/Desktop/StockPlotter/src/components/trading-dashboard.tsx) drives the multi-panel terminal UI.
- [`src/components/live-candlestick-chart.tsx`](/c:/Users/sunil/OneDrive/Desktop/StockPlotter/src/components/live-candlestick-chart.tsx) renders the live candlestick + volume chart.
- [`src/components/tradingview-widget.tsx`](/c:/Users/sunil/OneDrive/Desktop/StockPlotter/src/components/tradingview-widget.tsx) embeds TradingView with live studies.
- [`src/lib/market.ts`](/c:/Users/sunil/OneDrive/Desktop/StockPlotter/src/lib/market.ts) contains market universe data, indicator calculations, and AI recommendation logic.

## TradingView Integration

This implementation embeds the public TradingView advanced chart widget for live visual market context.

The internal websocket feed currently uses simulated streaming market data so the app is runnable without credentials. For production deployment, replace the in-memory stream with:

- a licensed market data provider
- broker/exchange websocket feeds
- TradingView-compatible market data infrastructure where your agreement allows it

## Recommended Next Production Steps

1. Add authentication with `JWT` or `OAuth`.
2. Persist watchlists, portfolio, alerts, and paper trades in `PostgreSQL` or `Supabase`.
3. Replace the simulated websocket engine with real exchange or broker feeds.
4. Add server-side alert rules, order simulation, and backtesting jobs.
5. Connect news and sentiment providers for live NLP-based scoring.
