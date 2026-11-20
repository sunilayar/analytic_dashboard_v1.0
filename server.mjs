import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const host = "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname: host, port });
const handle = app.getRequestHandler();

const symbols = [
  { symbol: "NSE:RELIANCE", price: 2941.2, change: 33.4, changePct: 1.15, volume: 4123980 },
  { symbol: "NSE:TCS", price: 4011.75, change: -28.45, changePct: -0.7, volume: 2098731 },
  { symbol: "BSE:HDFCBANK", price: 1688.15, change: 11.1, changePct: 0.66, volume: 3210874 },
  { symbol: "NASDAQ:AAPL", price: 213.18, change: 1.52, changePct: 0.72, volume: 58214913 },
  { symbol: "NASDAQ:NVDA", price: 1148.22, change: 21.47, changePct: 1.91, volume: 47120512 },
  { symbol: "NYSE:MSFT", price: 434.9, change: -2.96, changePct: -0.68, volume: 28419743 },
  { symbol: "BINANCE:BTCUSDT", price: 68452.18, change: 982.16, changePct: 1.46, volume: 781249 },
  { symbol: "BINANCE:ETHUSDT", price: 3529.8, change: 78.44, changePct: 2.27, volume: 612484 },
  { symbol: "FX:USDINR", price: 83.27, change: -0.12, changePct: -0.14, volume: 198732 },
  { symbol: "FX:EURUSD", price: 1.087, change: 0.0031, changePct: 0.29, volume: 362982 },
  { symbol: "INDEX:NIFTY", price: 22514.45, change: 194.2, changePct: 0.87, volume: 0 },
  { symbol: "INDEX:SPX", price: 5248.61, change: 33.1, changePct: 0.63, volume: 0 },
];

function evolveMarket() {
  return symbols.map((item, index) => {
    const drift = Math.sin(Date.now() / 14000 + index) * item.price * 0.0009;
    const micro = (Math.random() - 0.5) * item.price * 0.0012;
    item.price = Math.max(0.0001, item.price + drift + micro);
    item.change = item.change + drift * 0.18 + micro * 0.42;
    item.changePct = (item.change / Math.max(item.price - item.change, 0.0001)) * 100;
    item.volume = Math.max(0, Math.round(item.volume + Math.random() * 3000));

    return {
      symbol: item.symbol,
      price: Number(item.price.toFixed(item.price > 1000 ? 2 : 4)),
      change: Number(item.change.toFixed(4)),
      changePct: Number(item.changePct.toFixed(2)),
      volume: item.volume,
    };
  });
}

await app.prepare();

const httpServer = createServer((req, res) => handle(req, res));
const io = new Server(httpServer, {
  path: "/socket.io",
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.emit("market:snapshot", evolveMarket());
});

setInterval(() => {
  io.emit("market:tick", evolveMarket());
}, 2200);

httpServer.listen(port, host, () => {
  console.log(`> PulseGrid ready on http://localhost:${port}`);
});
