import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, TrendingDown, Lightbulb, XCircle, CheckCircle } from 'lucide-react';

const COMMON_PATTERNS = [
  {
    title: 'FOMO Buying',
    icon: '🔥',
    description: 'Buying a stock just because the price is going up rapidly, without doing proper research. This often leads to buying at the peak.',
    tip: 'Always have a thesis before entering a trade. Ask: "Would I buy this if it hadn\'t gone up?"',
  },
  {
    title: 'No Stop-Loss',
    icon: '🛑',
    description: 'Holding a losing position without a predetermined exit point, hoping it will recover. Small losses can become devastating.',
    tip: 'Set a stop-loss before every trade. The 2% rule: never risk more than 2% of your portfolio on one trade.',
  },
  {
    title: 'Overtrading',
    icon: '⚡',
    description: 'Making too many trades driven by emotion rather than strategy. Each trade has costs and increases your exposure to mistakes.',
    tip: 'Quality over quantity. Wait for high-probability setups that match your strategy.',
  },
  {
    title: 'Revenge Trading',
    icon: '😤',
    description: 'Immediately entering a new trade after a loss to "make it back." This emotional response leads to impulsive, poorly planned trades.',
    tip: 'After a loss, step away. Review what went wrong before your next trade.',
  },
  {
    title: 'Ignoring Diversification',
    icon: '🥚',
    description: 'Putting all your capital into a single stock or sector. If that investment drops, your entire portfolio suffers.',
    tip: 'Spread across at least 3-5 different sectors. No single position should exceed 20% of your portfolio.',
  },
  {
    title: 'Chasing Tips',
    icon: '📱',
    description: 'Buying stocks based on social media hype or "hot tips" without personal analysis. By the time you hear about it, smart money has already moved.',
    tip: 'Do your own research. If everyone is talking about it, the opportunity may have already passed.',
  },
];

type Tab = 'quiz' | 'trades' | 'patterns';

const MistakeAnalysis = () => {
  const { quizMistakes, tradeMistakes } = useUser();
  const [tab, setTab] = useState<Tab>('patterns');

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'patterns', label: 'Common Patterns', icon: <Lightbulb className="h-4 w-4" /> },
    { key: 'quiz', label: 'Quiz Mistakes', icon: <BookOpen className="h-4 w-4" />, count: quizMistakes.length },
    { key: 'trades', label: 'Losing Trades', icon: <TrendingDown className="h-4 w-4" />, count: tradeMistakes.length },
  ];

  const totalLoss = tradeMistakes.reduce((s, t) => s + t.loss, 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-primary animate-pulse-glow" />
          <h2 className="font-display text-2xl tracking-wider text-primary text-glow-cyan">Mistake Analysis</h2>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card-cyber text-center">
            <p className="font-mono text-xs text-muted-foreground">Quiz Errors</p>
            <p className="font-display text-2xl text-destructive">{quizMistakes.length}</p>
          </div>
          <div className="card-cyber text-center">
            <p className="font-mono text-xs text-muted-foreground">Losing Trades</p>
            <p className="font-display text-2xl text-destructive">{tradeMistakes.length}</p>
          </div>
          <div className="card-cyber text-center">
            <p className="font-mono text-xs text-muted-foreground">Total Loss</p>
            <p className="font-display text-2xl text-destructive">{totalLoss.toLocaleString()} <span className="text-xs text-muted-foreground">coins</span></p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs transition-colors border ${
                tab === t.key
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="bg-destructive/20 text-destructive px-1.5 py-0.5 rounded text-[10px]">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'patterns' && (
          <div className="space-y-3">
            {COMMON_PATTERNS.map((pattern, i) => (
              <motion.div
                key={pattern.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-cyber"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{pattern.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-display text-sm tracking-wider text-foreground">{pattern.title}</h3>
                    <p className="font-mono text-xs text-muted-foreground mt-1 leading-relaxed">{pattern.description}</p>
                    <div className="mt-3 flex items-start gap-2 bg-primary/5 border border-primary/20 rounded px-3 py-2">
                      <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="font-mono text-xs text-primary leading-relaxed">{pattern.tip}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'quiz' && (
          <div className="space-y-3">
            {quizMistakes.length === 0 ? (
              <div className="card-cyber text-center py-8">
                <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-mono text-xs text-muted-foreground">No quiz mistakes yet. Complete some module quizzes to track errors here.</p>
              </div>
            ) : (
              quizMistakes.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card-cyber"
                >
                  <p className="font-mono text-[10px] text-muted-foreground mb-1">{m.moduleTitle} • {new Date(m.timestamp).toLocaleDateString()}</p>
                  <p className="font-mono text-sm text-foreground mb-2">{m.question}</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                      <span className="font-mono text-xs text-destructive">Your answer: {m.yourAnswer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-neon-green flex-shrink-0" />
                      <span className="font-mono text-xs text-neon-green">Correct: {m.correctAnswer}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {tab === 'trades' && (
          <div className="space-y-3">
            {tradeMistakes.length === 0 ? (
              <div className="card-cyber text-center py-8">
                <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-mono text-xs text-muted-foreground">No losing trades yet. Your trade losses will appear here when you sell below your buy price.</p>
              </div>
            ) : (
              tradeMistakes.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card-cyber"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-sm text-foreground">{t.symbol}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{new Date(t.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                    <div>
                      <p className="text-muted-foreground">Bought at</p>
                      <p className="text-foreground">{t.buyPrice.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sold at</p>
                      <p className="text-destructive">{t.sellPrice.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Shares</p>
                      <p className="text-foreground">{t.shares}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Loss</p>
                      <p className="text-destructive">-{t.loss.toFixed(0)} coins</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MistakeAnalysis;
