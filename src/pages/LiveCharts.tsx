import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, ComposedChart, Cell } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALPHA_VANTAGE_API_KEY = 'demo'; // Replace with your free key from https://www.alphavantage.co/support/#api-key

const PRESET_STOCKS = ['IBM', 'AAPL', 'MSFT', 'GOOGL', 'TSLA'];
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

const CandlestickBar = (props: any) => {
  const { x, y, width, height, open, close, high, low } = props;
  if (!x || !width) return null;
  const isUp = close >= open;
  const color = isUp ? 'hsl(150, 100%, 45%)' : 'hsl(0, 80%, 55%)';
  const barX = x + width / 2;
  const bodyTop = Math.min(y, y + height);
  const bodyHeight = Math.abs(height) || 1;

  return (
    <g>
      <line x1={barX} y1={props.highY} x2={barX} y2={props.lowY} stroke={color} strokeWidth={1} />
      <rect x={x + 2} y={bodyTop} width={Math.max(width - 4, 2)} height={bodyHeight} fill={color} stroke={color} />
    </g>
  );
};

const LiveCharts = () => {
  const [ticker, setTicker] = useState('IBM');
  const [searchInput, setSearchInput] = useState('');
  const [chartType, setChartType] = useState<ChartType>('Line');
  const [timeRange, setTimeRange] = useState(9999);
  const [data, setData] = useState<StockPoint[]>([]);
  const [meta, setMeta] = useState<StockMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (symbol: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json['Note'] || json['Information']) {
        setError('API rate limit reached. Free tier allows 25 requests/day. Try again later or add your own API key.');
        setLoading(false);
        return;
      }

      const timeSeries = json['Time Series (5min)'];
      if (!timeSeries) {
        setError(`No data found for "${symbol}". Check the ticker symbol.`);
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
    } catch (err) {
      setError('Failed to fetch data. Check your connection.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(ticker);
  }, [ticker, fetchData]);

  const handleSearch = () => {
    const sym = searchInput.trim().toUpperCase();
    if (sym) {
      setTicker(sym);
      setSearchInput('');
    }
  };

  const filteredData = timeRange === 9999
    ? data
    : data.slice(-(timeRange / 5));

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
              {filteredData.map((entry, i) => {
                const isGreen = entry.close >= entry.open;
                return <Cell key={i} fill={isGreen ? 'hsl(150, 100%, 45%)' : 'hsl(0, 80%, 55%)'} />;
              })}
            </Bar>
            <Line type="monotone" dataKey="high" stroke="hsl(185, 100%, 50%)" dot={false} strokeWidth={1} strokeDasharray="2 2" />
            <Line type="monotone" dataKey="low" stroke="hsl(320, 100%, 60%)" dot={false} strokeWidth={1} strokeDasharray="2 2" />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    // Line chart
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-4 p-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="font-display text-xl tracking-wider text-primary text-glow-cyan">
            Live Charts
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
              key={s}
              onClick={() => setTicker(s)}
              className={`px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all ${
                ticker === s
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(185,100%,50%,0.3)]'
                  : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {s}
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
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(meta.lastRefreshed)}
              </div>
            </div>
          </div>
        )}

        {/* Chart Area */}
        <div className="card-cyber p-0 overflow-hidden">
          {/* Chart Controls */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex gap-1">
              {CHART_TYPES.map((ct) => (
                <button
                  key={ct}
                  onClick={() => setChartType(ct)}
                  className={`px-3 py-1 rounded font-mono text-xs transition-all ${
                    chartType === ct
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {ct}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.label}
                  onClick={() => setTimeRange(tr.minutes)}
                  className={`px-2 py-1 rounded font-mono text-xs transition-all ${
                    timeRange === tr.minutes
                      ? 'bg-secondary/20 text-secondary border border-secondary/40'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-[400px] p-3">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                  <span className="font-mono text-xs text-muted-foreground">Fetching market data...</span>
                </div>
              </div>
            ) : data.length > 0 ? (
              renderChart()
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="font-mono text-xs text-muted-foreground">No data available</span>
              </div>
            )}
          </div>
        </div>

        {/* API Key Notice */}
        {ALPHA_VANTAGE_API_KEY === 'demo' && (
          <div className="card-cyber border-primary/30 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              Using demo API key (limited to IBM). Get your free key at{' '}
              <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                alphavantage.co
              </a>{' '}
              and replace it in <code className="text-secondary">src/pages/LiveCharts.tsx</code>
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LiveCharts;
