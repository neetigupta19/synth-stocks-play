import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

const dummyLeaders = [
  { username: 'AlphaVolt', coins: 48200, level: 12, trades: 156 },
  { username: 'PixelWhale', coins: 35800, level: 9, trades: 98 },
  { username: 'CyberTrader99', coins: 27500, level: 7, trades: 73 },
  { username: 'NeonBull', coins: 21300, level: 6, trades: 61 },
  { username: 'DataMiner42', coins: 18900, level: 5, trades: 45 },
  { username: 'QuantumFox', coins: 14200, level: 4, trades: 38 },
  { username: 'ShadowBear', coins: 11600, level: 3, trades: 29 },
  { username: 'ByteRunner', coins: 8400, level: 3, trades: 22 },
  { username: 'VoltEdge', coins: 5100, level: 2, trades: 14 },
  { username: 'GridPulse', coins: 2800, level: 1, trades: 7 },
];

const rankIcon = (index: number) => {
  if (index === 0) return <Crown className="h-5 w-5 text-secondary" />;
  if (index === 1) return <Medal className="h-5 w-5 text-muted-foreground" />;
  if (index === 2) return <Medal className="h-5 w-5 text-accent" />;
  return <span className="font-mono text-xs text-muted-foreground w-5 text-center">{index + 1}</span>;
};

const Leaderboard = () => {
  const { user } = useUser();

  const allLeaders = user
    ? [...dummyLeaders, { username: user.username, coins: user.coins, level: user.level, trades: user.trades }]
        .sort((a, b) => b.coins - a.coins)
    : dummyLeaders;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl tracking-wider text-primary text-glow-cyan">Leaderboard</h2>
        </div>

        <div className="card-cyber">
          <div className="grid grid-cols-[40px_1fr_100px_80px_80px] gap-2 font-mono text-xs text-muted-foreground uppercase tracking-wider pb-3 border-b border-border mb-2">
            <span>#</span>
            <span>Trader</span>
            <span className="text-right">Coins</span>
            <span className="text-right">Level</span>
            <span className="text-right">Trades</span>
          </div>

          {allLeaders.map((leader, i) => {
            const isCurrentUser = user && leader.username === user.username;
            return (
              <motion.div
                key={leader.username}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`grid grid-cols-[40px_1fr_100px_80px_80px] gap-2 items-center py-2.5 font-mono text-sm ${
                  isCurrentUser ? 'bg-primary/10 -mx-5 px-5 rounded border border-primary/30' : ''
                } ${i < allLeaders.length - 1 && !isCurrentUser ? 'border-b border-border/50' : ''}`}
              >
                <div className="flex items-center justify-center">{rankIcon(i)}</div>
                <span className={isCurrentUser ? 'text-primary font-bold' : 'text-foreground'}>
                  {leader.username} {isCurrentUser && <span className="text-xs text-muted-foreground">(you)</span>}
                </span>
                <span className="text-right text-primary">{leader.coins.toLocaleString()}</span>
                <span className="text-right text-foreground">{leader.level}</span>
                <span className="text-right text-muted-foreground">{leader.trades}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
