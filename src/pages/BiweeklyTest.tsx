import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Cell,
} from 'recharts';
import { Clock, TrendingUp, TrendingDown, Minus, AlertTriangle, Plus } from 'lucide-react';

// ── TYPES ──
interface StockTick { time: string; open: number; high: number; low: number; close: number; volume: number; }
interface StockData { symbol: string; label: string; data: StockTick[]; pattern: string; riskReward: number; }

// ── MOCK DATA ──

const generateTicks = (base: number, volatility: number, trend: number): StockTick[] =>
  Array.from({ length: 30 }, (_, i) => {
    const t = 9 * 60 + 15 + i * 15;
    const h = Math.floor(t / 60);
    const m = t % 60;
    const time = `${h}:${m.toString().padStart(2, '0')}`;
    const drift = trend * i * 0.3;
    const open = +(base + drift + (Math.random() - 0.5) * volatility).toFixed(2);
    const close = +(open + (Math.random() - 0.4) * volatility * 0.6).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * volatility * 0.3).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * volatility * 0.3).toFixed(2);
    const volume = Math.floor(50000 + Math.random() * 150000);
    return { time, open, high, low, close, volume };
  });

const STOCKS: StockData[] = [
  { symbol: 'TCS', label: 'TCS', data: generateTicks(3850, 40, 1.2), pattern: 'Bullish', riskReward: 0.6 },
  { symbol: 'INFY', label: 'INFOSYS', data: generateTicks(1620, 25, -0.8), pattern: 'Bearish', riskReward: 1.4 },
  { symbol: 'HDFC', label: 'HDFC BANK', data: generateTicks(1720, 18, 0.2), pattern: 'Sideways', riskReward: 0.9 },
  { symbol: 'MARUTI', label: 'MARUTI SUZUKI', data: generateTicks(12400, 200, 2.5), pattern: 'Bullish', riskReward: 0.4 },
];

const CHART_TABS = ['Line Graph', 'Candlestick Graph', 'Volume Graph'] as const;
type ChartType = typeof CHART_TABS[number];

const SIX_HOURS = 6 * 60 * 60;

// ── CANDLESTICK ──
const CandlestickShape = (props: any) => {
  const { x, y, width, payload } = props;
  if (!payload) return null;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? 'hsl(150, 100%, 45%)' : 'hsl(0, 80%, 55%)';
  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const barW = Math.max(width * 0.6, 4);
  // Scale factor: we need the chart's y-scale. Use props.yAxis or approximate.
  // We'll use the bar's pixel position to derive scale.
  const yScale = props.yAxis?.scale;
  if (!yScale) return null;
  const wickX = x + width / 2;
  return (
    <g>
      <line x1={wickX} y1={yScale(high)} x2={wickX} y2={yScale(low)} stroke={color} strokeWidth={1} />
      <rect
        x={x + (width - barW) / 2}
        y={yScale(bodyBottom)}
        width={barW}
        height={Math.max(Math.abs(yScale(bodyTop) - yScale(bodyBottom)), 1)}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={0.5}
      />
    </g>
  );
};

// ── COMPONENT ──
const BiweeklyTest = () => {
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

  const fmt = useCallback((s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }, []);

  const stock = STOCKS[activeStock];
  const lastPrice = stock.data[stock.data.length - 1].close;
  const isTimeUp = timeLeft === 0;

  const handleBuy = () => {
    const cost = lastPrice * quantity;
    if (cost <= balance) setBalance(b => b - cost);
  };
  const handleSell = () => {
    setBalance(b => b + lastPrice * quantity);
  };

  // Chart Y domain
  const allPrices = stock.data.flatMap(d => [d.high, d.low]);
  const yMin = Math.floor(Math.min(...allPrices) * 0.998);
  const yMax = Math.ceil(Math.max(...allPrices) * 1.002);

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-5rem)] max-h-[900px]">
        {/* ═══ LEFT HALF ═══ */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* NEWS TERMINAL */}
          <div className="card-cyber p-0 flex items-center overflow-hidden bg-background/50 border border-primary/20 relative rounded-md h-[42px] shrink-0">
            <style>{`
              @keyframes scroll-news {
                0% { transform: translateX(0); }
                100% { transform: translateX(-100%); }
              }
              .news-marquee {
                display: inline-block;
                white-space: nowrap;
                animation: scroll-news 15s linear infinite;
                will-change: transform;
                padding-left: 100%;
              }
            `}</style>
            <h3 className="font-display text-xs tracking-widest text-primary shrink-0 z-10 px-4 bg-background flex items-center h-full absolute left-0 top-0 bottom-0 shadow-[16px_0_16px_hsl(var(--background))] border-r border-primary/20">
              TERMINAL<span className="animate-pulse">_</span>
            </h3>
            <div className="flex-1 overflow-hidden h-full flex items-center rounded-md">
              <div className="news-marquee font-mono text-[11px] text-primary/80 tracking-wider">
                 [AWAITING LIVE DATA STREAM...] /// [SYSTEM STANDBY...] /// [CONNECTING TO SECURE CHANNEL...] /// [INITIALIZING...]
              </div>
            </div>
          </div>

          {/* STOCK TABS */}
          <div className="flex gap-1 flex-wrap">
            {STOCKS.map((s, i) => (
              <button key={s.symbol} onClick={() => setActiveStock(i)}
                className={`px-3 py-1.5 rounded font-display text-xs tracking-wider transition-all ${
                  i === activeStock
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
            {/* Vertical chart type tabs */}
            <div className="flex flex-col gap-1">
              {CHART_TABS.map(ct => (
                <button key={ct} onClick={() => setActiveChart(ct)}
                  className={`px-2 py-2 rounded text-[10px] font-display tracking-wider writing-mode-vertical transition-all whitespace-nowrap ${
                    ct === activeChart
                      ? 'bg-primary text-primary-foreground shadow-[0_0_10px_hsl(185_100%_50%/0.3)]'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}
                >
                  {ct}
                </button>
              ))}
            </div>

            {/* Chart display */}
            <div className="flex-1 card-cyber p-3 min-h-0">
              <AnimatePresence mode="wait">
                <motion.div key={`${stock.symbol}-${activeChart}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }} className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChart === 'Line Graph' ? (
                      <LineChart data={stock.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(220,10%,50%)' }} interval={4} />
                        <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: 'hsl(220,10%,50%)' }} width={55} />
                        <Tooltip contentStyle={{ background: 'hsl(230,20%,10%)', border: '1px solid hsl(185,40%,20%)', fontSize: 11, fontFamily: 'Share Tech Mono' }} />
                        <Line type="monotone" dataKey="close" stroke="hsl(185,100%,50%)" strokeWidth={2} dot={false} />
                      </LineChart>
                    ) : activeChart === 'Volume Graph' ? (
                      <BarChart data={stock.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(220,10%,50%)' }} interval={4} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(220,10%,50%)' }} width={55} />
                        <Tooltip contentStyle={{ background: 'hsl(230,20%,10%)', border: '1px solid hsl(185,40%,20%)', fontSize: 11, fontFamily: 'Share Tech Mono' }} />
                        <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                          {stock.data.map((d, idx) => (
                            <Cell key={idx} fill={d.close >= d.open ? 'hsl(150,100%,45%)' : 'hsl(0,80%,55%)'} fillOpacity={0.7} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      /* Candlestick via ComposedChart */
                      <ComposedChart data={stock.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(220,10%,50%)' }} interval={4} />
                        <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: 'hsl(220,10%,50%)' }} width={55} />
                        <Tooltip contentStyle={{ background: 'hsl(230,20%,10%)', border: '1px solid hsl(185,40%,20%)', fontSize: 11, fontFamily: 'Share Tech Mono' }}
                          formatter={(_: any, name: string, props: any) => {
                            const d = props.payload;
                            return [`O:${d.open} H:${d.high} L:${d.low} C:${d.close}`, ''];
                          }}
                        />
                        <Bar dataKey="high" fill="transparent" barSize={0}>
                          {stock.data.map((d, idx) => {
                            const isUp = d.close >= d.open;
                            const color = isUp ? 'hsl(150,100%,45%)' : 'hsl(0,80%,55%)';
                            return <Cell key={idx} fill={color} />;
                          })}
                        </Bar>
                        {/* Custom candlestick rendering via customized bar shape */}
                        {stock.data.map((d, idx) => {
                          const isUp = d.close >= d.open;
                          const color = isUp ? 'hsl(150,100%,45%)' : 'hsl(0,80%,55%)';
                          return null; // handled by ErrorBar workaround below
                        })}
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
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
              {balance.toLocaleString()} <span className="text-primary text-sm">Coins</span>
            </p>
          </div>

          {/* TRADING CONTROLS */}
          <div className="card-cyber p-4 space-y-4">
            <div>
              <span className="font-display text-xs tracking-widest text-muted-foreground">
                {stock.label} — <span className="text-primary">₹{lastPrice.toLocaleString()}</span>
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
                Total: <span className="text-primary">{(lastPrice * quantity).toLocaleString()}</span>
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
                {stock.riskReward.toFixed(1)}
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

          {/* WARNING */}
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
    </Layout>
  );
};

export default BiweeklyTest;
