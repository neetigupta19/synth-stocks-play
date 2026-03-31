import React, { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Layout } from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { createChart, IChartApi, LineSeries, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { Clock, TrendingUp, TrendingDown, Minus, AlertTriangle, Plus } from 'lucide-react';

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: any) { console.error("ErrorBoundary caught:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 bg-background text-destructive flex-col gap-4 h-full min-h-[500px]">
          <AlertTriangle className="w-16 h-16" />
          <h2 className="text-2xl font-bold font-mono">CRITICAL RENDERING CRASH</h2>
          <pre className="bg-destructive/10 p-4 rounded text-sm text-left max-w-[800px] overflow-auto border border-destructive/20">{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()} className="px-4 py-2 mt-4 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded font-bold">REBOOT DATALINK</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── TYPES ──
interface StockTick { time: number; open: number; high: number; low: number; close: number; volume: number; }
interface StockData { symbol: string; label: string; data: StockTick[]; pattern: string; riskReward: number; }

const getDefaultStocks = (): StockData[] => [
  { symbol: 'TCS', label: 'TCS', data: [], pattern: 'Steady Base', riskReward: 1.0 },
  { symbol: 'INFY', label: 'INFOSYS', data: [], pattern: 'Steady Base', riskReward: 1.0 },
  { symbol: 'HDFCBANK', label: 'HDFC BANK', data: [], pattern: 'Steady Base', riskReward: 1.0 },
  { symbol: 'MARUTI', label: 'MARUTI SUZUKI', data: [], pattern: 'Steady Base', riskReward: 1.0 },
];

const CHART_TABS = ['Line Graph', 'Candlestick Graph', 'Volume Graph'] as const;
type ChartType = typeof CHART_TABS[number];
const SIX_HOURS = 6 * 60 * 60;

const BiweeklyTestContent = () => {
  const [stocks, setStocks] = useState<StockData[]>(getDefaultStocks);
  const [newsList, setNewsList] = useState<string[]>([]);
  const [activeStock, setActiveStock] = useState(0);
  const [activeChart, setActiveChart] = useState<ChartType>('Line Graph');
  const [quantity, setQuantity] = useState(1);
  const [balance, setBalance] = useState(50000);
  const [timeLeft, setTimeLeft] = useState(() => {
    const stored = sessionStorage.getItem('bw_timer_end');
    if (stored) {
      const remaining = Math.floor((+stored - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    const end = Date.now() + SIX_HOURS * 1000;
    sessionStorage.setItem('bw_timer_end', String(end));
    return SIX_HOURS;
  });

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  // Use refs in websocket to avoid stale closures rendering whole component
  const activeStockRef = useRef(activeStock);
  const activeChartRef = useRef(activeChart);
  const stocksRef = useRef(stocks);

  useEffect(() => { activeStockRef.current = activeStock; }, [activeStock]);
  useEffect(() => { activeChartRef.current = activeChart; }, [activeChart]);
  useEffect(() => { stocksRef.current = stocks; }, [stocks]);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── INIT LIGHTWEIGHT CHART ──
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid' as any, color: 'transparent' }, textColor: 'hsl(220,10%,50%)' },
      grid: { vertLines: { color: 'hsl(230,15%,18%)' }, horzLines: { color: 'hsl(230,15%,18%)' } },
      timeScale: { timeVisible: true, secondsVisible: true, rightOffset: 5 },
      crosshair: { mode: 0 as any },
    });
    chartRef.current = chart;
    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // ── SWAP SERIES ON TAB OR STOCK CHANGE ──
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    if (seriesRef.current) {
      try {
        chart.removeSeries(seriesRef.current);
      } catch (e) {
        console.warn("Safeguard caught unmounted series removal:", e);
      }
      seriesRef.current = null;
    }

    const stock = stocks[activeStock];
    let newSeries: any;

    if (activeChart === 'Line Graph') {
      newSeries = chart.addSeries(LineSeries, {
        color: 'hsl(185, 100%, 50%)',
        lineWidth: 2,
      });

      const lineData = stock.data.map(d => ({
        time: Math.floor(d.time) as any,
        value: d.close,
      }));

      newSeries.setData(lineData);

    } else if (activeChart === 'Candlestick Graph') {
      newSeries = chart.addSeries(CandlestickSeries, {
        upColor: 'hsl(150, 100%, 45%)',
        downColor: 'hsl(0, 80%, 55%)',
        borderVisible: false,
        wickUpColor: 'hsl(150, 100%, 45%)',
        wickDownColor: 'hsl(0, 80%, 55%)',
      });

      const candleData = stock.data.map(d => ({
        time: Math.floor(d.time) as any,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      newSeries.setData(candleData);

    } else if (activeChart === 'Volume Graph') {
      newSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        base: 0,
      });

      const volData = stock.data.map(d => ({
        time: Math.floor(d.time) as any,
        value: d.volume,
        color: d.close >= d.open
          ? 'hsl(150, 100%, 45%, 0.7)'
          : 'hsl(0, 80%, 55%, 0.7)',
      }));

      newSeries.setData(volData);
    }

    seriesRef.current = newSeries;

  }, [activeStock, activeChart]); // only run when series completely uninitialized

  // ── WEBSOCKET ──
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'history') {
        setStocks(prev => prev.map(s => {
          if (s.symbol === data.stock) {
            // Protect history payload from NaN and sort it!
            let validHistory = data.data
              .filter((d: any) => typeof d.time === 'number' && !isNaN(d.time))
              .map((d: any) => ({ ...d, time: Math.floor(d.time) }))
              .sort((a: any, b: any) => a.time - b.time);

            // Deduplicate history by keeping the last occurrence of each time
            const uniqueMap = new Map();
            validHistory.forEach((d: any) => uniqueMap.set(d.time, d));
            validHistory = Array.from(uniqueMap.values());

            return { ...s, data: validHistory };
          }
          return s;
        }));
      } else if (data.type === 'candle') {
        const newTick = { time: Math.floor(data.time), open: data.open, high: data.high, low: data.low, close: data.close, volume: data.volume };
        let isValidUpdate = true;

        setStocks(prev => prev.map(s => {
          if (s.symbol === data.stock) {
            const last = s.data.length > 0 ? s.data[s.data.length - 1] : null;
            let newData;

            if (last && newTick.time === last.time) {
              // Update the current candle (in-place replacement)
              newData = [...s.data.slice(0, -1), newTick];
              isValidUpdate = true;
            } else if (last && newTick.time < last.time) {
              // Discard chaotic network out-of-order tick to protect graph
              newData = [...s.data];
              isValidUpdate = false;
            } else {
              // Strictly increasing, push normally
              newData = [...s.data, newTick].slice(-200);
              isValidUpdate = true;
            }

            return { ...s, data: newData };
          }
          return s;
        }));

        // Instantly update chart if it's the active one and valid
        if (isValidUpdate && data.stock === stocksRef.current[activeStockRef.current].symbol && seriesRef.current) {
          const timeSec = Math.floor(data.time) as any;
          if (activeChartRef.current === 'Line Graph') {
            seriesRef.current.update({ time: timeSec, value: data.close });
          } else if (activeChartRef.current === 'Candlestick Graph') {
            seriesRef.current.update({ time: timeSec, open: data.open, high: data.high, low: data.low, close: data.close });
          } else if (activeChartRef.current === 'Volume Graph') {
            seriesRef.current.update({ time: timeSec, value: data.volume, color: data.close >= data.open ? 'hsl(150, 100%, 45%, 0.7)' : 'hsl(0, 80%, 55%, 0.7)' });
          }
        }
      } else if (data.type === 'news_batch') {
        // Expects array of news objects
        const batch = data.news.map((n: any) => `[${n.target}] ${n.headline}`);
        setNewsList(batch);
      } else if (data.type === 'analytics') {
        setStocks(prev => prev.map(s => s.symbol === data.stock ? { ...s, pattern: data.pattern, riskReward: data.riskReward } : s));
      }
    };
    return () => ws.close();
  }, []);

  const fmt = useCallback((s: number) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }, []);

  const stock = stocks[activeStock];
  const lastPrice = stock.data.length > 0 ? stock.data[stock.data.length - 1].close : 0;
  const isTimeUp = timeLeft === 0;

  const handleBuy = () => {
    const cost = lastPrice * quantity;
    if (cost <= balance) setBalance(b => b - cost);
  };

  const handleSell = () => { setBalance(b => b + lastPrice * quantity); };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-5rem)] max-h-[900px]">
      {/* ═══ LEFT HALF ═══ */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* NEWS TERMINAL */}
        <div className="card-cyber p-0 flex items-center overflow-hidden bg-background/50 border border-primary/20 relative rounded-md h-[70px] shrink-0">
          <style>{`
              @keyframes scroll-news {
                0% { transform: translateX(0); }
                100% { transform: translateX(-100%); }
              }
              .news-marquee {
                display: inline-block;
                white-space: nowrap;
                animation: scroll-news 100s linear infinite;
                will-change: transform;
                padding-left: 100%;
              }
            `}</style>
          <h3 className="font-display text-xl tracking-widest text-primary shrink-0 z-10 px-6 bg-background flex items-center h-full absolute left-0 top-0 bottom-0 shadow-[16px_0_16px_hsl(var(--background))] border-r border-primary/20">
            NEWS<span className="animate-pulse">_</span>
          </h3>
          <div className="flex-1 overflow-hidden h-full flex items-center rounded-md">
            <div className="news-marquee font-mono text-[30px] font-bold text-primary/90 tracking-wider">
              {newsList.length > 0 ? newsList.join("   ///   ") : "[AWAITING LIVE DATA STREAM...] /// [INITIALIZING...]"}
            </div>
          </div>
        </div>

        {/* STOCK TABS */}
        <div className="flex gap-1 flex-wrap">
          {stocks.map((s, i) => (
            <button key={s.symbol} onClick={() => setActiveStock(i)}
              className={`px-3 py-1.5 rounded font-display text-xs tracking-wider transition-all ${i === activeStock
                ? 'bg-primary text-primary-foreground shadow-[0_0_12px_hsl(185_100%_50%/0.35)]'
                : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* CHART AREA */}
        <div className="flex-1 flex gap-2 min-h-0">
          <div className="flex flex-col gap-1">
            {CHART_TABS.map(ct => (
              <button key={ct} onClick={() => setActiveChart(ct)}
                className={`px-2 py-2 rounded text-[10px] font-display tracking-wider writing-mode-vertical transition-all whitespace-nowrap ${ct === activeChart ? 'bg-primary text-primary-foreground shadow-[0_0_10px_hsl(185_100%_50%/0.3)]' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}
              >
                {ct}
              </button>
            ))}
          </div>

          <div className="flex-1 card-cyber p-3 min-h-0 overflow-hidden">
            {/* LIGHTWEIGHT CHART CONTAINER */}
            <div ref={chartContainerRef} className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* ═══ RIGHT HALF ═══ */}
      <div className="w-full lg:w-[380px] flex flex-col gap-3">
        {/* TIMER */}
        <div className="card-cyber p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-display text-xs tracking-widest text-muted-foreground">TIME REMAINING</span>
          </div>
          {isTimeUp ? (
            <div>
              <p className="font-display text-xl text-destructive font-bold tracking-wider">TIME IS UP!</p>
              <p className="font-mono text-xs text-muted-foreground mt-1">All your stocks will be automatically sold</p>
            </div>
          ) : (
            <p className="font-mono text-3xl text-primary text-glow-cyan">{fmt(timeLeft)}</p>
          )}
        </div>

        {/* BALANCE */}
        <div className="card-cyber p-4">
          <span className="font-display text-xs tracking-widest text-muted-foreground">BALANCE</span>
          <p className="font-mono text-2xl text-foreground mt-1">
            {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-primary text-sm">Coins</span>
          </p>
        </div>

        {/* TRADING CONTROLS */}
        <div className="card-cyber p-4 space-y-4">
          <div>
            <span className="font-display text-xs tracking-widest text-muted-foreground">
              {stock.label} — <span className="text-primary">₹{lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-display text-xs text-muted-foreground tracking-wider">QTY</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded bg-muted flex items-center justify-center text-foreground hover:bg-border transition-colors">
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-mono text-lg text-foreground w-12 text-center">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 rounded bg-muted flex items-center justify-center text-foreground hover:bg-border transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="font-mono text-xs text-muted-foreground ml-auto">
              Total: <span className="text-primary">{(lastPrice * quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBuy} disabled={isTimeUp}
              className="flex-1 btn-cyber bg-[hsl(150,100%,45%)] text-background hover:shadow-[0_0_20px_hsl(150,100%,45%/0.4)] disabled:opacity-40 text-xs">
              BUY
            </button>
            <button onClick={handleSell} disabled={isTimeUp}
              className="flex-1 btn-cyber bg-destructive text-destructive-foreground hover:shadow-[0_0_20px_hsl(0,80%,55%/0.4)] disabled:opacity-40 text-xs">
              SELL
            </button>
          </div>
        </div>

        {/* ANALYTICS */}
        <div className="card-cyber p-4 space-y-3">
          <h3 className="font-display text-xs tracking-widest text-muted-foreground">ANALYTICS</h3>
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-muted-foreground">Risk/Reward Ratio</span>
            <span className={`font-mono text-sm font-semibold ${stock.riskReward > 1 ? 'text-destructive' : 'text-[hsl(150,100%,45%)]'}`}>
              {stock.riskReward.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-muted-foreground">Pattern</span>
            <span className="flex items-center gap-1 font-mono text-sm text-foreground">
              {stock.pattern === 'Bullish' && <TrendingUp className="h-3.5 w-3.5 text-[hsl(150,100%,45%)]" />}
              {stock.pattern === 'Bearish' && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
              {stock.pattern === 'Sideways' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
              {stock.pattern}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {stock.riskReward > 1 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="border border-destructive rounded-lg p-3 bg-destructive/10 flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <span className="font-mono text-xs text-destructive">⚠️ Risk exceeds reward</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const BiweeklyTest = () => (
  <Layout>
    <ErrorBoundary>
      <BiweeklyTestContent />
    </ErrorBoundary>
  </Layout>
);

export default BiweeklyTest;
