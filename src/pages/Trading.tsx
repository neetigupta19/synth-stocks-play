import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';

const STOCKS = [
  { symbol: 'NEON', name: 'NeonTech Corp', price: 245 },
  { symbol: 'CYBR', name: 'CyberDyne Systems', price: 512 },
  { symbol: 'GRID', name: 'GridNet Inc', price: 89 },
  { symbol: 'FLUX', name: 'Flux Energy', price: 178 },
  { symbol: 'VOID', name: 'Void Labs', price: 34 },
  { symbol: 'SYNTH', name: 'Synthwave AI', price: 420 },
];

const Trading = () => {
  const { user, spendCoins, addCoins, updateHoldings, incrementTrades, addTradeMistake } = useUser();
  const [selected, setSelected] = useState(STOCKS[0]);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');

  if (!user) return null;

  const holding = user.holdings.find(h => h.symbol === selected.symbol);

  const buy = () => {
    const cost = selected.price * qty;
    if (!spendCoins(cost)) { setMsg('Not enough coins!'); return; }
    const existing = user.holdings.find(h => h.symbol === selected.symbol);
    let newHoldings;
    if (existing) {
      const totalShares = existing.shares + qty;
      const avgPrice = ((existing.avgPrice * existing.shares) + cost) / totalShares;
      newHoldings = user.holdings.map(h => h.symbol === selected.symbol ? { ...h, shares: totalShares, avgPrice } : h);
    } else {
      newHoldings = [...user.holdings, { symbol: selected.symbol, name: selected.name, shares: qty, avgPrice: selected.price }];
    }
    updateHoldings(newHoldings);
    incrementTrades();
    setMsg(`Bought ${qty} ${selected.symbol} for ${cost.toLocaleString()} coins`);
  };

  const sell = () => {
    if (!holding || holding.shares < qty) { setMsg('Not enough shares!'); return; }
    const revenue = selected.price * qty;
    addCoins(revenue);
    // Track losing trade
    if (selected.price < holding.avgPrice) {
      const loss = (holding.avgPrice - selected.price) * qty;
      addTradeMistake({
        symbol: selected.symbol,
        buyPrice: holding.avgPrice,
        sellPrice: selected.price,
        shares: qty,
        loss,
      });
    }
    const remaining = holding.shares - qty;
    const newHoldings = remaining === 0
      ? user.holdings.filter(h => h.symbol !== selected.symbol)
      : user.holdings.map(h => h.symbol === selected.symbol ? { ...h, shares: remaining } : h);
    updateHoldings(newHoldings);
    incrementTrades();
    setMsg(`Sold ${qty} ${selected.symbol} for ${revenue.toLocaleString()} coins`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="font-display text-2xl tracking-wider text-primary text-glow-cyan">Mock Trading</h2>

        <div className="grid md:grid-cols-3 gap-3">
          {STOCKS.map(s => (
            <motion.button key={s.symbol}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSelected(s); setMsg(''); }}
              className={`card-cyber text-left transition-colors ${selected.symbol === s.symbol ? 'border-primary' : 'hover:border-muted-foreground'}`}
            >
              <p className="font-display text-sm text-foreground">{s.symbol}</p>
              <p className="font-mono text-xs text-muted-foreground">{s.name}</p>
              <p className="font-mono text-lg text-primary mt-1">{s.price}</p>
            </motion.button>
          ))}
        </div>

        <div className="card-cyber">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">Quantity</label>
              <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, +e.target.value))}
                className="bg-muted border border-border rounded px-3 py-2 w-24 font-mono text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              <p>Cost: <span className="text-primary">{(selected.price * qty).toLocaleString()}</span> coins</p>
              <p>You hold: <span className="text-foreground">{holding?.shares ?? 0}</span> {selected.symbol}</p>
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={buy} className="btn-cyber-primary text-xs">Buy</button>
              <button onClick={sell} className="btn-cyber-secondary text-xs">Sell</button>
            </div>
          </div>
          {msg && <p className="font-mono text-xs text-neon-green mt-3">{msg}</p>}
        </div>
      </div>
    </Layout>
  );
};

export default Trading;
