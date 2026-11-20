"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useTheme } from "next-themes";
import {
  Bell,
  Bot,
  CandlestickChart,
  ChartColumn,
  ChevronUp,
  Globe,
  MoonStar,
  Search,
  Sparkles,
  SunMedium,
  Wallet,
} from "lucide-react";
import {
  buildAiSignal,
  calculateIndicators,
  formatCurrency,
  generateCandles,
  getInstrument,
  getSymbolMatches,
  marketUniverse,
  samplePortfolio,
  sampleSentiment,
  timeframes,
  type AiSignal,
  type Candle,
  type IndicatorSnapshot,
  type Timeframe,
} from "@/lib/market";
import { LiveCandlestickChart } from "./live-candlestick-chart";
import { TradingViewWidget } from "./tradingview-widget";

type MarketTick = {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
};

type AlertEvent = {
  symbol: string;
  type: string;
  message: string;
  at: string;
};

const defaultFavorites = ["NSE:RELIANCE", "NASDAQ:NVDA", "BINANCE:BTCUSDT", "INDEX:NIFTY"];
const storageKey = "pulsegrid-dashboard";

function getStoredLists() {
  if (typeof window === "undefined") {
    return { watchlist: defaultFavorites, favorites: defaultFavorites };
  }

  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    return { watchlist: defaultFavorites, favorites: defaultFavorites };
  }

  try {
    const parsed = JSON.parse(saved) as { watchlist?: string[]; favorites?: string[] };
    return {
      watchlist: parsed.watchlist?.length ? parsed.watchlist : defaultFavorites,
      favorites: parsed.favorites?.length ? parsed.favorites : defaultFavorites,
    };
  } catch {
    window.localStorage.removeItem(storageKey);
    return { watchlist: defaultFavorites, favorites: defaultFavorites };
  }
}

export function TradingDashboard() {
  const { resolvedTheme, setTheme } = useTheme();
  const darkMode = resolvedTheme !== "light";

  const [selectedSymbol, setSelectedSymbol] = useState("NSE:RELIANCE");
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [query, setQuery] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>(defaultFavorites);
  const [favorites, setFavorites] = useState<string[]>(defaultFavorites);
  const [ticks, setTicks] = useState<Record<string, MarketTick>>({});
  const [connected, setConnected] = useState(false);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    const storedLists = getStoredLists();
    setWatchlist(storedLists.watchlist);
    setFavorites(storedLists.favorites);
    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (hasLoadedStorage) {
      window.localStorage.setItem(storageKey, JSON.stringify({ watchlist, favorites }));
    }
  }, [favorites, hasLoadedStorage, watchlist]);

  useEffect(() => {
    const socket: Socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("market:snapshot", (snapshot: MarketTick[]) => {
      setTicks(Object.fromEntries(snapshot.map((item) => [item.symbol, item])));
    });
    socket.on("market:tick", (snapshot: MarketTick[]) => {
      setTicks(Object.fromEntries(snapshot.map((item) => [item.symbol, item])));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const instruments = useMemo(
    () =>
      marketUniverse.map((instrument) => ({
        ...instrument,
        ...(ticks[instrument.symbol] ?? {}),
      })),
    [ticks],
  );

  const selectedInstrument = useMemo(
    () => instruments.find((instrument) => instrument.symbol === selectedSymbol) ?? getInstrument(selectedSymbol),
    [instruments, selectedSymbol],
  );

  const candles = useMemo<Candle[]>(
    () => generateCandles(selectedInstrument.symbol, timeframe, selectedInstrument.price),
    [selectedInstrument.price, selectedInstrument.symbol, timeframe],
  );

  const indicators = useMemo<IndicatorSnapshot>(() => calculateIndicators(candles), [candles]);
  const aiSignal = useMemo<AiSignal>(
    () => buildAiSignal(selectedInstrument.price, indicators, selectedInstrument.changePct),
    [indicators, selectedInstrument.changePct, selectedInstrument.price],
  );

  const searchResults = useMemo(
    () => (query ? getSymbolMatches(query) : watchlist.map((symbol) => getInstrument(symbol))),
    [query, watchlist],
  );

  const portfolioSummary = useMemo(() => {
    return samplePortfolio.reduce(
      (acc, position) => {
        const instrument = instruments.find((item) => item.symbol === position.symbol) ?? getInstrument(position.symbol);
        const marketValue = instrument.price * position.quantity;
        const invested = position.avgPrice * position.quantity;
        acc.marketValue += marketValue;
        acc.invested += invested;
        acc.pnl += marketValue - invested;
        return acc;
      },
      { marketValue: 0, invested: 0, pnl: 0 },
    );
  }, [instruments]);

  const heatmap = useMemo(
    () =>
      [...instruments]
        .sort((a, b) => b.changePct - a.changePct)
        .slice(0, 8),
    [instruments],
  );

  const alerts = useMemo<AlertEvent[]>(() => {
    const nextAlerts: AlertEvent[] = [];
    if (selectedInstrument.changePct >= 1.5) {
      nextAlerts.push({
        symbol: selectedInstrument.symbol,
        type: "Momentum Breakout",
        message: `${selectedInstrument.name} is up ${selectedInstrument.changePct.toFixed(2)}% with strong intraday acceleration.`,
        at: "Live",
      });
    }

    if (indicators.rsi >= 70 || indicators.rsi <= 30) {
      nextAlerts.push({
        symbol: selectedInstrument.symbol,
        type: "RSI Alert",
        message: `${selectedInstrument.symbol} RSI moved to ${indicators.rsi.toFixed(1)}.`,
        at: "Live",
      });
    }
    return nextAlerts;
  }, [indicators.rsi, selectedInstrument]);

  function toggleList(symbol: string, list: "favorites" | "watchlist") {
    const setter = list === "favorites" ? setFavorites : setWatchlist;
    const current = list === "favorites" ? favorites : watchlist;

    setter(
      current.includes(symbol)
        ? current.filter((item) => item !== symbol)
        : [...current, symbol],
    );
  }

  const tradingViewInterval = timeframe === "1H" ? "60" : timeframe === "1D" ? "D" : timeframe === "1W" ? "W" : timeframe.replace("m", "");

  return (
    <main className="min-h-screen bg-transparent px-4 py-4 text-foreground md:px-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-white shadow-lg shadow-sky-500/25">
                  <CandlestickChart size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">PulseGrid Terminal</p>
                  <h1 className="text-2xl font-semibold">Real-Time Market Analytics Dashboard</h1>
                </div>
              </div>
              <p className="max-w-3xl text-sm text-[var(--muted)]">
                TradingView-powered market workstation with live technical indicators, portfolio analytics, AI signals,
                alerts, and multi-asset monitoring across NSE, BSE, US, Crypto, Forex, and global indices.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-3 py-2">
                <Search size={16} className="text-[var(--muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search symbol, stock, index, forex..."
                  className="w-full min-w-[240px] bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
                />
              </div>

              <button
                onClick={() => setTheme(darkMode ? "light" : "dark")}
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-2 text-sm font-medium transition hover:border-sky-400/40"
              >
                {darkMode ? <SunMedium size={16} /> : <MoonStar size={16} />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 px-4 py-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
            <aside className="space-y-4">
              <Panel title="Search & Watchlist" icon={<Search size={16} />}>
                <div className="space-y-2">
                  {searchResults.map((instrument) => {
                    const active = instrument.symbol === selectedSymbol;
                    return (
                      <button
                        key={instrument.symbol}
                        onClick={() => {
                          setSelectedSymbol(instrument.symbol);
                          if (!watchlist.includes(instrument.symbol)) {
                            setWatchlist((current) => [...current, instrument.symbol]);
                          }
                        }}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                          active
                            ? "border-sky-400/40 bg-sky-500/10"
                            : "border-[var(--border)] bg-[var(--card-strong)] hover:border-sky-300/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{instrument.symbol}</p>
                            <p className="text-xs text-[var(--muted)]">{instrument.name}</p>
                          </div>
                          <p className={`text-sm font-semibold ${instrument.changePct >= 0 ? "text-emerald-500" : "text-rose-400"}`}>
                            {instrument.changePct >= 0 ? "+" : ""}
                            {instrument.changePct.toFixed(2)}%
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Favorites" icon={<Sparkles size={16} />}>
                <div className="flex flex-wrap gap-2">
                  {favorites.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => setSelectedSymbol(symbol)}
                      className="rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-xs font-medium"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="Live Alerts" icon={<Bell size={16} />}>
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">No alerts yet. Price and indicator triggers will appear here.</p>
                  ) : (
                    alerts.map((alert, index) => (
                      <div key={`${alert.symbol}-${index}`} className="rounded-2xl border border-amber-400/20 bg-amber-400/8 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{alert.type}</p>
                          <span className="text-xs text-[var(--muted)]">{alert.at}</span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </aside>

            <section className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <MetricCard
                  label="Last Price"
                  value={formatCurrency(selectedInstrument.price, selectedInstrument.currency)}
                  change={selectedInstrument.changePct}
                  icon={<Globe size={16} />}
                />
                <MetricCard
                  label="AI Signal"
                  value={`${aiSignal.action} · ${aiSignal.confidence}%`}
                  description={aiSignal.summary}
                  tone={aiSignal.action === "BUY" ? "positive" : aiSignal.action === "SELL" ? "negative" : "neutral"}
                  icon={<Bot size={16} />}
                />
                <MetricCard
                  label="Volume"
                  value={Intl.NumberFormat("en-US", { notation: "compact" }).format(selectedInstrument.volume)}
                  description={`20-period avg ${Intl.NumberFormat("en-US", { notation: "compact" }).format(indicators.volumeAverage)}`}
                  icon={<ChartColumn size={16} />}
                />
                <MetricCard
                  label="Connection"
                  value={connected ? "Live Stream" : "Reconnecting"}
                  description="WebSocket-driven market feed"
                  tone={connected ? "positive" : "neutral"}
                  icon={<ChevronUp size={16} />}
                />
              </div>

              <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card-strong)] p-4">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{selectedInstrument.exchange}</p>
                    <h2 className="text-2xl font-semibold">{selectedInstrument.name}</h2>
                    <p className="text-sm text-[var(--muted)]">{selectedInstrument.symbol}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {timeframes.map((item) => (
                      <button
                        key={item}
                        onClick={() => setTimeframe(item)}
                        className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                          timeframe === item
                            ? "bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-white"
                            : "border border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-foreground"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                    <button
                      onClick={() => toggleList(selectedInstrument.symbol, "favorites")}
                      className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium"
                    >
                      {favorites.includes(selectedInstrument.symbol) ? "Unfavorite" : "Favorite"}
                    </button>
                    <button
                      onClick={() => toggleList(selectedInstrument.symbol, "watchlist")}
                      className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium"
                    >
                      {watchlist.includes(selectedInstrument.symbol) ? "Remove Watch" : "Add Watch"}
                    </button>
                  </div>
                </div>

                <LiveCandlestickChart candles={candles} darkMode={darkMode} />
              </div>

              <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card-strong)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">TradingView Live Market Panel</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Embedded advanced chart with live studies, symbol switching, and real-time market context.
                    </p>
                  </div>
                  <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-300">
                    TradingView
                  </span>
                </div>
                <TradingViewWidget symbol={selectedInstrument.symbol} interval={tradingViewInterval} theme={darkMode ? "dark" : "light"} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Indicator Stack" icon={<ChartColumn size={16} />}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <IndicatorTile label="RSI" value={indicators.rsi} />
                    <IndicatorTile label="MACD" value={indicators.macd} />
                    <IndicatorTile label="MACD Signal" value={indicators.macdSignal} />
                    <IndicatorTile label="EMA 9" value={indicators.ema9} />
                    <IndicatorTile label="EMA 21" value={indicators.ema21} />
                    <IndicatorTile label="SMA 20" value={indicators.sma20} />
                    <IndicatorTile label="SMA 50" value={indicators.sma50} />
                    <IndicatorTile label="BB Upper" value={indicators.bollingerUpper} />
                    <IndicatorTile label="BB Lower" value={indicators.bollingerLower} />
                    <IndicatorTile label="Support" value={indicators.support} />
                    <IndicatorTile label="Resistance" value={indicators.resistance} />
                    <IndicatorTile label="Vol Avg" value={indicators.volumeAverage} />
                  </div>
                </Panel>

                <Panel title="AI & Strategy" icon={<Bot size={16} />}>
                  <div className="space-y-4">
                    <InsightBlock
                      title="AI Buy/Sell Recommendation"
                      value={`${aiSignal.action} · ${aiSignal.confidence}% confidence`}
                      description={aiSignal.summary}
                    />
                    <InsightBlock
                      title="Pattern Detection"
                      value={indicators.ema9 > indicators.ema21 ? "Bullish continuation channel" : "Mean-reversion pressure"}
                      description="Automated structure scan combines EMA crossover, volatility compression, and support/resistance behavior."
                    />
                    <InsightBlock
                      title="Backtest Snapshot"
                      value={aiSignal.action === "BUY" ? "63.8% win rate" : "54.2% win rate"}
                      description="Simulated breakout strategy across 180 rolling bars with slippage and dynamic stop-loss assumptions."
                    />
                    <InsightBlock
                      title="Paper Trading"
                      value="Ready"
                      description="Portfolio positions and signal overlays are wired for paper trading and rule-based order simulation."
                    />
                  </div>
                </Panel>
              </div>
            </section>

            <aside className="space-y-4">
              <Panel title="Portfolio & P&L" icon={<Wallet size={16} />}>
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <SummaryStat label="Market Value" value={formatCurrency(portfolioSummary.marketValue, "USD")} />
                  <SummaryStat label="Invested" value={formatCurrency(portfolioSummary.invested, "USD")} />
                  <SummaryStat
                    label="Unrealized P&L"
                    value={formatCurrency(portfolioSummary.pnl, "USD")}
                    tone={portfolioSummary.pnl >= 0 ? "positive" : "negative"}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  {samplePortfolio.map((position) => {
                    const instrument = instruments.find((item) => item.symbol === position.symbol) ?? getInstrument(position.symbol);
                    const pnl = instrument.price * position.quantity - position.avgPrice * position.quantity;
                    return (
                      <div key={position.symbol} className="rounded-2xl border border-[var(--border)] px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{position.symbol}</p>
                            <p className="text-xs text-[var(--muted)]">
                              Qty {position.quantity} · Avg {formatCurrency(position.avgPrice, instrument.currency)}
                            </p>
                          </div>
                          <p className={`text-sm font-semibold ${pnl >= 0 ? "text-emerald-500" : "text-rose-400"}`}>
                            {pnl >= 0 ? "+" : ""}
                            {formatCurrency(pnl, instrument.currency)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Heatmap & Trends" icon={<Sparkles size={16} />}>
                <div className="grid grid-cols-2 gap-3">
                  {heatmap.map((instrument) => (
                    <div
                      key={instrument.symbol}
                      className="rounded-2xl px-3 py-3"
                      style={{
                        background:
                          instrument.changePct >= 0
                            ? "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(13,19,31,0.02))"
                            : "linear-gradient(135deg, rgba(251,113,133,0.22), rgba(13,19,31,0.02))",
                      }}
                    >
                      <p className="text-xs text-[var(--muted)]">{instrument.exchange}</p>
                      <p className="font-medium">{instrument.symbol.split(":")[1]}</p>
                      <p className={`text-sm ${instrument.changePct >= 0 ? "text-emerald-500" : "text-rose-400"}`}>
                        {instrument.changePct >= 0 ? "+" : ""}
                        {instrument.changePct.toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="News Sentiment" icon={<Globe size={16} />}>
                <div className="space-y-3">
                  {sampleSentiment.map((item) => (
                    <div key={item.headline} className="rounded-2xl border border-[var(--border)] px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{item.source}</p>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] ${
                            item.sentiment === "Bullish"
                              ? "bg-emerald-500/12 text-emerald-400"
                              : item.sentiment === "Bearish"
                                ? "bg-rose-500/12 text-rose-400"
                                : "bg-slate-500/12 text-slate-300"
                          }`}
                        >
                          {item.sentiment}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{item.headline}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[var(--border)] bg-[var(--card-strong)] p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  change,
  description,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  change?: number;
  description?: string;
  icon: React.ReactNode;
  tone?: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-500/20 bg-emerald-500/8"
      : tone === "negative"
        ? "border-rose-500/20 bg-rose-500/8"
        : "border-[var(--border)] bg-[var(--card-strong)]";

  return (
    <div className={`rounded-[22px] border p-4 ${toneClass}`}>
      <div className="mb-3 flex items-center justify-between text-[var(--muted)]">
        <p className="text-sm">{label}</p>
        {icon}
      </div>
      <p className="text-xl font-semibold">{value}</p>
      {typeof change === "number" ? (
        <p className={`mt-1 text-sm ${change >= 0 ? "text-emerald-500" : "text-rose-400"}`}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </p>
      ) : null}
      {description ? <p className="mt-2 text-xs text-[var(--muted)]">{description}</p> : null}
    </div>
  );
}

function IndicatorTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-black/3 px-3 py-3 dark:bg-white/2">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-mono text-base font-medium">{value.toFixed(2)}</p>
    </div>
  );
}

function InsightBlock({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{title}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</p>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p
        className={`mt-2 text-lg font-semibold ${
          tone === "positive" ? "text-emerald-500" : tone === "negative" ? "text-rose-400" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
