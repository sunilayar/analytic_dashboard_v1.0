export type AssetClass =
  | "NSE"
  | "BSE"
  | "US"
  | "CRYPTO"
  | "FOREX"
  | "INDEX";

export type Timeframe = "1m" | "5m" | "15m" | "1H" | "1D" | "1W";

export type Instrument = {
  symbol: string;
  name: string;
  exchange: AssetClass;
  currency: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  sector: string;
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type IndicatorSnapshot = {
  rsi: number;
  macd: number;
  macdSignal: number;
  ema9: number;
  ema21: number;
  sma20: number;
  sma50: number;
  bollingerUpper: number;
  bollingerLower: number;
  volumeAverage: number;
  support: number;
  resistance: number;
};

export type AiSignal = {
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  summary: string;
};

export type PortfolioPosition = {
  symbol: string;
  quantity: number;
  avgPrice: number;
};

export type NewsSentiment = {
  headline: string;
  source: string;
  sentiment: "Bullish" | "Neutral" | "Bearish";
};

export const timeframes: Timeframe[] = ["1m", "5m", "15m", "1H", "1D", "1W"];

export const marketUniverse: Instrument[] = [
  {
    symbol: "NSE:RELIANCE",
    name: "Reliance Industries",
    exchange: "NSE",
    currency: "INR",
    price: 2941.2,
    change: 33.4,
    changePct: 1.15,
    volume: 4123980,
    sector: "Energy",
  },
  {
    symbol: "NSE:TCS",
    name: "Tata Consultancy Services",
    exchange: "NSE",
    currency: "INR",
    price: 4011.75,
    change: -28.45,
    changePct: -0.7,
    volume: 2098731,
    sector: "Technology",
  },
  {
    symbol: "BSE:HDFCBANK",
    name: "HDFC Bank",
    exchange: "BSE",
    currency: "INR",
    price: 1688.15,
    change: 11.1,
    changePct: 0.66,
    volume: 3210874,
    sector: "Financials",
  },
  {
    symbol: "NASDAQ:AAPL",
    name: "Apple",
    exchange: "US",
    currency: "USD",
    price: 213.18,
    change: 1.52,
    changePct: 0.72,
    volume: 58214913,
    sector: "Technology",
  },
  {
    symbol: "NASDAQ:NVDA",
    name: "NVIDIA",
    exchange: "US",
    currency: "USD",
    price: 1148.22,
    change: 21.47,
    changePct: 1.91,
    volume: 47120512,
    sector: "Semiconductors",
  },
  {
    symbol: "NYSE:MSFT",
    name: "Microsoft",
    exchange: "US",
    currency: "USD",
    price: 434.9,
    change: -2.96,
    changePct: -0.68,
    volume: 28419743,
    sector: "Technology",
  },
  {
    symbol: "BINANCE:BTCUSDT",
    name: "Bitcoin",
    exchange: "CRYPTO",
    currency: "USD",
    price: 68452.18,
    change: 982.16,
    changePct: 1.46,
    volume: 781249,
    sector: "Crypto",
  },
  {
    symbol: "BINANCE:ETHUSDT",
    name: "Ethereum",
    exchange: "CRYPTO",
    currency: "USD",
    price: 3529.8,
    change: 78.44,
    changePct: 2.27,
    volume: 612484,
    sector: "Crypto",
  },
  {
    symbol: "FX:USDINR",
    name: "USD / INR",
    exchange: "FOREX",
    currency: "INR",
    price: 83.27,
    change: -0.12,
    changePct: -0.14,
    volume: 198732,
    sector: "Forex",
  },
  {
    symbol: "FX:EURUSD",
    name: "EUR / USD",
    exchange: "FOREX",
    currency: "USD",
    price: 1.087,
    change: 0.0031,
    changePct: 0.29,
    volume: 362982,
    sector: "Forex",
  },
  {
    symbol: "INDEX:NIFTY",
    name: "Nifty 50",
    exchange: "INDEX",
    currency: "INR",
    price: 22514.45,
    change: 194.2,
    changePct: 0.87,
    volume: 0,
    sector: "Index",
  },
  {
    symbol: "INDEX:SPX",
    name: "S&P 500",
    exchange: "INDEX",
    currency: "USD",
    price: 5248.61,
    change: 33.1,
    changePct: 0.63,
    volume: 0,
    sector: "Index",
  },
];

export const samplePortfolio: PortfolioPosition[] = [
  { symbol: "NSE:RELIANCE", quantity: 48, avgPrice: 2820.3 },
  { symbol: "NASDAQ:NVDA", quantity: 6, avgPrice: 1039.55 },
  { symbol: "BINANCE:BTCUSDT", quantity: 0.18, avgPrice: 63480.2 },
  { symbol: "NYSE:MSFT", quantity: 12, avgPrice: 421.75 },
];

export const sampleSentiment: NewsSentiment[] = [
  {
    headline: "Semiconductor demand stays elevated as AI infrastructure spending accelerates",
    source: "Market Pulse",
    sentiment: "Bullish",
  },
  {
    headline: "Rupee volatility cools as central bank intervention expectations stabilize",
    source: "FX Wire",
    sentiment: "Neutral",
  },
  {
    headline: "Energy names face margin pressure from softer downstream realizations",
    source: "Street Desk",
    sentiment: "Bearish",
  },
];

const timeframeSeconds: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1H": 3600,
  "1D": 86400,
  "1W": 604800,
};

function symbolSeed(symbol: string) {
  return Array.from(symbol).reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);
}

export function generateCandles(symbol: string, timeframe: Timeframe, basePrice: number): Candle[] {
  const seed = symbolSeed(symbol);
  const interval = timeframeSeconds[timeframe];
  const count = timeframe === "1W" ? 96 : timeframe === "1D" ? 120 : 180;
  const now = Math.floor(Date.now() / 1000);
  let close = basePrice * (0.92 + (seed % 13) / 100);

  return Array.from({ length: count }, (_, index) => {
    const phase = (seed % 17) * 0.03 + index * 0.17;
    const drift = Math.sin(phase) * basePrice * 0.0035;
    const impulse = Math.cos(index * 0.11 + seed) * basePrice * 0.0018;
    const open = close;
    close = Math.max(basePrice * 0.72, open + drift + impulse);
    const high = Math.max(open, close) + Math.abs(Math.sin(phase * 1.2)) * basePrice * 0.0025;
    const low = Math.min(open, close) - Math.abs(Math.cos(phase * 0.8)) * basePrice * 0.0022;
    const volume = Math.round((basePrice * 420 + (seed % 1000) * 12) * (1 + Math.abs(Math.sin(phase))));

    return {
      time: now - (count - index) * interval,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume,
    };
  });
}

export function calculateIndicators(candles: Candle[]): IndicatorSnapshot {
  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);
  const sma20 = average(closes.slice(-20));
  const sma50 = average(closes.slice(-50));
  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const rsi = calculateRsi(closes, 14);
  const { macd, signal } = calculateMacd(closes);
  const bollingerBase = sma20;
  const deviation = stdDev(closes.slice(-20));
  const support = Math.min(...candles.slice(-30).map((candle) => candle.low));
  const resistance = Math.max(...candles.slice(-30).map((candle) => candle.high));

  return {
    rsi: round2(rsi),
    macd: round2(macd),
    macdSignal: round2(signal),
    ema9: round2(ema9),
    ema21: round2(ema21),
    sma20: round2(sma20),
    sma50: round2(sma50),
    bollingerUpper: round2(bollingerBase + deviation * 2),
    bollingerLower: round2(bollingerBase - deviation * 2),
    volumeAverage: Math.round(average(volumes.slice(-20))),
    support: round2(support),
    resistance: round2(resistance),
  };
}

export function buildAiSignal(
  price: number,
  indicators: IndicatorSnapshot,
  changePct: number,
): AiSignal {
  let score = 0;
  score += indicators.ema9 > indicators.ema21 ? 18 : -18;
  score += indicators.macd > indicators.macdSignal ? 16 : -16;
  score += indicators.rsi > 45 && indicators.rsi < 65 ? 12 : indicators.rsi >= 70 ? -14 : 8;
  score += price > indicators.sma20 ? 10 : -10;
  score += price > indicators.support * 1.01 ? 8 : -8;
  score += changePct > 0 ? 6 : -6;

  if (score >= 20) {
    return {
      action: "BUY",
      confidence: Math.min(94, 55 + score),
      summary: "Momentum, moving averages, and trend structure align for an upside continuation bias.",
    };
  }

  if (score <= -20) {
    return {
      action: "SELL",
      confidence: Math.min(92, 55 + Math.abs(score)),
      summary: "Weak momentum and deteriorating structure suggest trimming risk or waiting for confirmation.",
    };
  }

  return {
    action: "HOLD",
    confidence: 62,
    summary: "Signals are mixed. Wait for a break above resistance or a pullback into support for higher conviction.",
  };
}

export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "INR" ? 2 : value > 1000 ? 0 : 2,
  }).format(value);
}

export function getInstrument(symbol: string) {
  return marketUniverse.find((instrument) => instrument.symbol === symbol) ?? marketUniverse[0];
}

export function getSymbolMatches(query: string) {
  const normalized = query.toLowerCase();
  return marketUniverse.filter(
    (instrument) =>
      instrument.symbol.toLowerCase().includes(normalized) ||
      instrument.name.toLowerCase().includes(normalized) ||
      instrument.exchange.toLowerCase().includes(normalized),
  );
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function ema(values: number[], period: number) {
  const multiplier = 2 / (period + 1);
  return values.reduce((acc, value, index) => {
    if (index === 0) return value;
    return (value - acc) * multiplier + acc;
  }, values[0] ?? 0);
}

function calculateRsi(values: number[], period: number) {
  const deltas = values.slice(1).map((value, index) => value - values[index]);
  const gains = deltas.map((delta) => (delta > 0 ? delta : 0));
  const losses = deltas.map((delta) => (delta < 0 ? Math.abs(delta) : 0));
  const avgGain = average(gains.slice(-period));
  const avgLoss = average(losses.slice(-period));

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateMacd(values: number[]) {
  const macdLine = ema(values, 12) - ema(values, 26);
  const signal = ema(values.slice(-35), 9);
  return { macd: macdLine, signal };
}

function stdDev(values: number[]) {
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
