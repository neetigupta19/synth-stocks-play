import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Layout } from '@/components/Layout';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, ComposedChart, Cell
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, Clock, RefreshCw, AlertTriangle, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALPHA_VANTAGE_API_KEY = 'ALPHA_MY_API_KEY';

const PRESET_STOCKS = [
  { symbol: 'IBM', name: 'IBM Corp' },
  { symbol: 'AAPL', name: 'Apple Inc' },
  { symbol: 'MSFT', name: 'Microsoft Corp' },
  { symbol: 'GOOGL', name: 'Alphabet Inc' },
  { symbol: 'TSLA', name: 'Tesla Inc' },
];

const CHART_TYPES = ['Line', 'Candlestick', 'Volume'] as const;
const TIME_RANGES = [
  { label: '15m', minutes: 15 },
  { label: '1h', minutes: 60 },
  { label: '3h', minutes: 180 },
  { label: 'All', minutes: 9999 },
];

type ChartType = typeof CHART_TYPES[number];

interface StockPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockMeta {
  symbol: string;
  lastRefreshed: string;
  interval: string;
}

const LiveTrading = () => {
  const { user, spendCoins, addCoins, updateHoldings, incrementTrades, addTradeMistake } = useUser();

  // Chart state
  const [ticker, setTicker] = useState('IBM');
  const [searchInput, setSearchInput] = useState('');
  const [chartType, setChartType] = useState<ChartType>('Line');
  const [timeRange, setTimeRange] = useState(9999);
  const [data, setData] = useState<StockPoint[]>([]);
  const [meta, setMeta] = useState<StockMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trading state
  const [qty, setQty] = useState(1);
  const [tradeMsg, setTradeMsg] = useState('');

  const fetchData = useCallback(async (symbol: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json['Note'] || json['Information']) {
        setError('API rate limit reached (25 req/day free tier). Try again later.');
        setLoading(false);
        return;
      }

      const timeSeries = json['Time Series (5min)'];
      if (!timeSeries) {
        setError(`No data for "${symbol}". Check the ticker.`);
        setLoading(false);
        return;
      }

      const metaData = json['Meta Data'];
      setMeta({
        symbol: metaData['2. Symbol'],
        lastRefreshed: metaData['3. Last Refreshed'],
        interval: metaData['4. Interval'],
      });

      const points: StockPoint[] = Object.entries(timeSeries)
        .map(([time, values]: [string, any]) => ({
          time,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        }))
        .reverse();

      setData(points);
    } catch {
      setError('Failed to fetch data. Check your connection.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(ticker);
  }, [ticker, fetchData]);

  const handleSearch = () => {
    const sym = searchInput.trim().toUpperCase();
    if (sym) { setTicker(sym); setSearchInput(''); }
  };

  // Derived chart data
  const filteredData = timeRange === 9999 ? data : data.slice(-(timeRange / 5));
  const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const prevPrice = data.length > 1 ? data[data.length - 2].close : currentPrice;
  const priceChange = currentPrice - prevPrice;
  const priceChangePercent = prevPrice ? ((priceChange / prevPrice) * 100) : 0;
  const isUp = priceChange >= 0;
  const dayHigh = data.length > 0 ? Math.max(...data.map(d => d.high)) : 0;
  const dayLow = data.length > 0 ? Math.min(...data.map(d => d.low)) : 0;
  const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);

  const formatTime = (t: string) => {
    const parts = t.split(' ');
    return parts.length > 1 ? parts[1].slice(0, 5) : t;
  };

  // Trading logic using real prices
  const stockName = PRESET_STOCKS.find(s => s.symbol === ticker)?.name || ticker;
  const holding = user?.holdings.find(h => h.symbol === ticker);

  const buy = () => {
    if (!user || currentPrice <= 0) return;
    const cost = Math.round(currentPrice * qty);
    if (!spendCoins(cost)) { setTradeMsg('Not enough coins!'); return; }
    const existing = user.holdings.find(h => h.symbol === ticker);
    let newHoldings;
    if (existing) {
      const totalShares = existing.shares + qty;
      const avgPrice = ((existing.avgPrice * existing.shares) + cost) / totalShares;
      newHoldings = user.holdings.map(h => h.symbol === ticker ? { ...h, shares: totalShares, avgPrice } : h);
    } else {
      newHoldings = [...user.holdings, { symbol: ticker, name: stockName, shares: qty, avgPrice: currentPrice }];
    }
    updateHoldings(newHoldings);
    incrementTrades();
    setTradeMsg(`Bought ${qty} ${ticker} @ $${currentPrice.toFixed(2)} for ${cost.toLocaleString()} coins`);
  };

  const sell = () => {
    if (!user || !holding || holding.shares < qty) { setTradeMsg('Not enough shares!'); return; }
    const revenue = Math.round(currentPrice * qty);
    addCoins(revenue);
    if (currentPrice < holding.avgPrice) {
      const loss = (holding.avgPrice - currentPrice) * qty;
      addTradeMistake({ symbol: ticker, buyPrice: holding.avgPrice, sellPrice: currentPrice, shares: qty, loss });
    }
    const remaining = holding.shares - qty;
    const newHoldings = remaining === 0
      ? user.holdings.filter(h => h.symbol !== ticker)
      : user.holdings.map(h => h.symbol === ticker ? { ...h, shares: remaining } : h);
    updateHoldings(newHoldings);
    incrementTrades();
    setTradeMsg(`Sold ${qty} ${ticker} @ $${currentPrice.toFixed(2)} for ${revenue.toLocaleString()} coins`);
  };

  // Chart rendering
  const renderChart = () => {
    if (filteredData.length === 0) return null;
    const yDomain = [
      Math.min(...filteredData.map(d => d.low)) * 0.999,
      Math.max(...filteredData.map(d => d.high)) * 1.001,
    ];

    if (chartType === 'Volume') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 15%)" />
            <XAxis dataKey="time" tickFormatter={formatTime} tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ background: 'hsl(230, 20%, 10%)', border: '1px solid hsl(185, 40%, 20%)', borderRadius: 8, fontFamily: 'Share Tech Mono' }}
              labelFormatter={formatTime}
              formatter={(v: number) => [v.toLocaleString(), 'Volume']}
            />
            <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
              {filteredData.map((entry, i) => (
                <Cell key={i} fill={entry.close >= entry.open ? 'hsl(150, 100%, 45%)' : 'hsl(0, 80%, 55%)'} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'Candlestick') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 15%)" />
            <XAxis dataKey="time" tickFormatter={formatTime} tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} />
            <YAxis domain={yDomain} tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
            <Tooltip
              contentStyle={{ background: 'hsl(230, 20%, 10%)', border: '1px solid hsl(185, 40%, 20%)', borderRadius: 8, fontFamily: 'Share Tech Mono' }}
              labelFormatter={formatTime}
              formatter={(v: number, name: string) => [`$${v.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
            />
            <Bar dataKey="close" barSize={8}>
              {filteredData.map((entry, i) => (
                <Cell key={i} fill={entry.close >= entry.open ? 'hsl(150, 100%, 45%)' : 'hsl(0, 80%, 55%)'} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="high" stroke="hsl(185, 100%, 50%)" dot={false} strokeWidth={1} strokeDasharray="2 2" />
            <Line type="monotone" dataKey="low" stroke="hsl(320, 100%, 60%)" dot={false} strokeWidth={1} strokeDasharray="2 2" />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filteredData}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 15%)" />
          <XAxis dataKey="time" tickFormatter={formatTime} tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} />
          <YAxis domain={yDomain} tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
          <Tooltip
            contentStyle={{ background: 'hsl(230, 20%, 10%)', border: '1px solid hsl(185, 40%, 20%)', borderRadius: 8, fontFamily: 'Share Tech Mono' }}
            labelFormatter={formatTime}
            formatter={(v: number) => [`$${v.toFixed(2)}`, 'Price']}
          />
          <Line type="monotone" dataKey="close" stroke="hsl(185, 100%, 50%)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'hsl(185, 100%, 50%)' }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-4 p-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="font-display text-xl tracking-wider text-primary text-glow-cyan">
            Live Trading
          </h1>
          <div className="flex gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ticker symbol..."
              className="w-36 font-mono text-xs bg-muted border-border"
            />
            <Button size="sm" onClick={handleSearch} className="bg-primary text-primary-foreground">
              <Search className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => fetchData(ticker)} className="border-border">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stock Tabs */}
        <div className="flex gap-2 flex-wrap">
          {PRESET_STOCKS.map((s) => (
            <button
              key={s.symbol}
              onClick={() => { setTicker(s.symbol); setTradeMsg(''); }}
              className={`px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all ${
                ticker === s.symbol
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(185,100%,50%,0.3)]'
                  : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {s.symbol}
            </button>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card-cyber border-destructive/50 flex items-center gap-3 text-destructive"
            >
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="font-mono text-xs">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Layout: Chart + Trading Panel */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left: Chart Area (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price Header */}
            {meta && data.length > 0 && (
              <div className="card-cyber flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg tracking-wider text-foreground">{meta.symbol}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-2xl text-foreground">${currentPrice.toFixed(2)}</span>
                    <span className={`font-mono text-sm flex items-center gap-1 ${isUp ? 'text-[hsl(150,100%,45%)]' : 'text-destructive'}`}>
                      {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {isUp ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 text-xs font-mono text-muted-foreground">
                  <div>High: <span className="text-[hsl(150,100%,45%)]">${dayHigh.toFixed(2)}</span></div>
                  <div>Low: <span className="text-destructive">${dayLow.toFixed(2)}</span></div>
                  <div>Vol: <span className="text-foreground">{(totalVolume / 1e6).toFixed(2)}M</span></div>
                  <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(meta.lastRefreshed)}</div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="card-cyber p-0 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex gap-1">
                  {CHART_TYPES.map((ct) => (
                    <button key={ct} onClick={() => setChartType(ct)}
                      className={`px-3 py-1 rounded font-mono text-xs transition-all ${
                        chartType === ct ? 'bg-primary/20 text-primary border border-primary/40' : 'text-muted-foreground hover:text-foreground'
                      }`}>{ct}</button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {TIME_RANGES.map((tr) => (
                    <button key={tr.label} onClick={() => setTimeRange(tr.minutes)}
                      className={`px-2 py-1 rounded font-mono text-xs transition-all ${
                        timeRange === tr.minutes ? 'bg-secondary/20 text-secondary border border-secondary/40' : 'text-muted-foreground hover:text-foreground'
                      }`}>{tr.label}</button>
                  ))}
                </div>
              </div>
              <div className="h-[350px] p-3">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                      <span className="font-mono text-xs text-muted-foreground">Fetching market data...</span>
                    </div>
                  </div>
                ) : data.length > 0 ? renderChart() : (
                  <div className="h-full flex items-center justify-center">
                    <span className="font-mono text-xs text-muted-foreground">No data available</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Trading Panel (1/3) */}
          <div className="space-y-4">
            {/* Balance */}
            <div className="card-cyber text-center">
              <p className="font-mono text-xs text-muted-foreground mb-1">Your Balance</p>
              <p className="font-display text-2xl text-primary text-glow-cyan">{user.coins.toLocaleString()}</p>
              <p className="font-mono text-xs text-muted-foreground">coins</p>
            </div>

            {/* Current Stock Info */}
            <div className="card-cyber">
              <p className="font-display text-sm text-foreground mb-2">{ticker} — {stockName}</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="text-muted-foreground">Current Price</div>
                <div className="text-primary text-right">${currentPrice.toFixed(2)}</div>
                <div className="text-muted-foreground">You Hold</div>
                <div className="text-foreground text-right">{holding?.shares ?? 0} shares</div>
                {holding && (
                  <>
                    <div className="text-muted-foreground">Avg Price</div>
                    <div className="text-foreground text-right">${holding.avgPrice.toFixed(2)}</div>
                    <div className="text-muted-foreground">P&L</div>
                    <div className={`text-right ${currentPrice >= holding.avgPrice ? 'text-[hsl(150,100%,45%)]' : 'text-destructive'}`}>
                      {currentPrice >= holding.avgPrice ? '+' : ''}{((currentPrice - holding.avgPrice) * holding.shares).toFixed(2)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quantity & Trade Buttons */}
            <div className="card-cyber">
              <label className="font-mono text-xs text-muted-foreground block mb-2">Quantity</label>
              <div className="flex items-center justify-center gap-3 mb-3">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, +e.target.value))}
                  className="bg-muted border border-border rounded px-3 py-2 w-20 font-mono text-sm text-foreground text-center focus:outline-none focus:border-primary" />
                <button onClick={() => setQty(q => q + 1)}
                  className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="font-mono text-xs text-muted-foreground text-center mb-3">
                Total: <span className="text-primary">{Math.round(currentPrice * qty).toLocaleString()}</span> coins
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={buy}
                  className="py-2 rounded font-mono text-xs font-bold tracking-wider bg-[hsl(150,100%,45%)] text-[hsl(230,20%,10%)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  disabled={currentPrice <= 0}>
                  BUY
                </button>
                <button onClick={sell}
                  className="py-2 rounded font-mono text-xs font-bold tracking-wider bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  disabled={currentPrice <= 0}>
                  SELL
                </button>
              </div>
              <AnimatePresence>
                {tradeMsg && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-mono text-xs text-[hsl(150,100%,45%)] mt-3 text-center"
                  >
                    {tradeMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Holdings Summary */}
            {user.holdings.length > 0 && (
              <div className="card-cyber">
                <p className="font-mono text-xs text-muted-foreground mb-2">Your Holdings</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {user.holdings.map(h => (
                    <div key={h.symbol} className="flex justify-between items-center text-xs font-mono">
                      <span className="text-foreground">{h.symbol}</span>
                      <span className="text-muted-foreground">{h.shares} @ ${h.avgPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveTrading;
