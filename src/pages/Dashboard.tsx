import { useUser } from '@/contexts/UserContext';
import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Coins, BarChart3, Star, Shield, Zap, BookOpen } from 'lucide-react';

const badgeIcons: Record<string, typeof Award> = {
  Newcomer: Star, Veteran: Shield, Elite: Zap, Scholar: BookOpen, Trader: TrendingUp, 'Day Trader': TrendingUp,
};

const ranks = ['Rookie', 'Apprentice', 'Trader', 'Analyst', 'Strategist', 'Expert', 'Master', 'Legend'];

const Dashboard = () => {
  const { user } = useUser();
  if (!user) return null;

  const stats = [
    { label: 'Coins', value: user.coins.toLocaleString(), icon: Coins, color: 'text-primary' },
    { label: 'Level', value: user.level, icon: TrendingUp, color: 'text-neon-green' },
    { label: 'XP', value: user.xp, icon: BarChart3, color: 'text-neon-purple' },
    { label: 'Badges', value: user.badges.length, icon: Award, color: 'text-secondary' },
  ];

  const portfolioValue = user.holdings.reduce((sum, h) => sum + h.shares * h.avgPrice, 0);
  const rank = ranks[Math.min(user.level - 1, ranks.length - 1)];
  const daysSinceJoin = Math.max(1, Math.floor((Date.now() - user.joinedAt) / 86400000));

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-cyber flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-muted border-2 border-primary flex items-center justify-center border-glow-cyan flex-shrink-0">
            <span className="font-display text-2xl text-primary">{user.username[0].toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl tracking-wider text-primary text-glow-cyan">{user.username}</h2>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">{rank} • Level {user.level} • Member for {daysSinceJoin} day{daysSinceJoin !== 1 ? 's' : ''}</p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card-cyber">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className={`font-display text-xl ${s.color}`}>{s.value}</p>
              <p className="font-mono text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Portfolio */}
          <div className="card-cyber">
            <h3 className="font-display text-sm tracking-wider text-primary mb-4">Portfolio</h3>
            {user.holdings.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">No holdings yet. Start trading!</p>
            ) : (
              <div className="space-y-2">
                {user.holdings.map(h => (
                  <div key={h.symbol} className="flex justify-between items-center font-mono text-xs">
                    <span className="text-foreground">{h.symbol}</span>
                    <span className="text-muted-foreground">{h.shares} shares</span>
                    <span className="text-primary">{(h.shares * h.avgPrice).toLocaleString()} coins</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="text-primary">{portfolioValue.toLocaleString()} coins</span>
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="card-cyber">
            <h3 className="font-display text-sm tracking-wider text-primary mb-4">Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-muted-foreground">Modules Completed</span>
                  <span className="text-foreground">{user.modules.filter(m => m.completed).length}/5</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(user.modules.filter(m => m.completed).length / 5) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-muted-foreground">Total Trades</span>
                  <span className="text-foreground">{user.trades}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-muted-foreground">XP to Next Level</span>
                  <span className="text-foreground">{500 - (user.xp % 500)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-neon-purple rounded-full transition-all" style={{ width: `${((user.xp % 500) / 500) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="card-cyber">
          <h3 className="font-display text-sm tracking-wider text-primary mb-4">Badges</h3>
          <div className="flex flex-wrap gap-3">
            {user.badges.map(badge => {
              const Icon = badgeIcons[badge] || Award;
              return (
                <motion.div key={badge} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5 border border-border">
                  <Icon className="h-3.5 w-3.5 text-secondary" />
                  <span className="font-mono text-xs text-foreground">{badge}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Level Progress */}
        <div className="card-cyber">
          <h3 className="font-display text-sm tracking-wider text-primary mb-4">Level Progress</h3>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${((user.xp % 500) / 500) * 100}%` }}
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" />
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-2">{user.xp % 500}/500 XP to Level {user.level + 1}</p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
