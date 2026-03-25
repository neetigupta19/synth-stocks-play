import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';
import { CheckCircle, Lock, BookOpen } from 'lucide-react';

interface Quiz { question: string; options: string[]; correct: number; }

const modulesData = [
  {
    id: 1, title: 'Stock Market Basics', desc: 'Learn what stocks are and how markets work.',
    content: [
      'A stock (also known as equity) represents ownership in a company. When you buy a stock, you own a small piece of that company — this is called a share.',
      'Stock prices are determined by supply and demand in the market. When more people want to buy a stock (demand), the price goes up. When more people want to sell (supply), the price goes down.',
      'The stock market is where buyers and sellers come together. Major exchanges include NYSE (New York Stock Exchange) and NASDAQ.',
      'Key terms to know:\n• Market Cap — the total value of a company\'s shares\n• Volume — the number of shares traded in a period\n• Ticker Symbol — the abbreviation used to identify a stock (e.g., AAPL for Apple)\n• IPO — Initial Public Offering, when a company first sells shares to the public',
    ],
    quiz: [
      { question: 'What does a stock represent?', options: ['A loan to a company', 'Ownership in a company', 'A bond', 'A derivative'], correct: 1 },
      { question: 'What determines stock prices?', options: ['The government', 'Supply and demand', 'Company CEO', 'Random'], correct: 1 },
      { question: 'What is a ticker symbol?', options: ['A company\'s phone number', 'An abbreviation to identify a stock', 'A type of bond', 'The stock price'], correct: 1 },
    ] as Quiz[],
    reward: 200,
  },
  {
    id: 2, title: 'Reading Charts', desc: 'Understand candlestick charts and trends.',
    content: [
      'Candlestick charts are the most popular way to visualize stock price movement. Each candlestick shows four data points for a time period: Open, High, Low, and Close (OHLC).',
      'Green (bullish) candles mean the closing price was higher than the opening price — the stock went up. Red (bearish) candles mean the closing price was lower — the stock went down.',
      'The body of the candle shows the range between open and close. The wicks (thin lines) show the high and low extremes reached during that period.',
      'Common patterns:\n• Doji — open and close are nearly equal, signaling indecision\n• Hammer — small body with a long lower wick, often signals a reversal\n• Engulfing — a larger candle completely covers the previous one\n• Support & Resistance — price levels where stocks tend to stop falling or rising',
      'Trends can be identified by connecting consecutive highs (resistance) or lows (support). An uptrend has higher highs and higher lows. A downtrend has lower highs and lower lows.',
    ],
    quiz: [
      { question: 'What does a green candle mean?', options: ['Price went down', 'Price stayed same', 'Price went up', 'Market closed'], correct: 2 },
      { question: 'What do candlesticks show?', options: ['Only close price', 'Open, high, low, close', 'Volume only', 'Market cap'], correct: 1 },
      { question: 'What does a Doji pattern signal?', options: ['Strong buying', 'Strong selling', 'Indecision in the market', 'Market crash'], correct: 2 },
    ] as Quiz[],
    reward: 300,
  },
  {
    id: 3, title: 'Risk Management', desc: 'Learn to protect your portfolio from big losses.',
    content: [
      'Risk management is the most important skill in trading. Without it, even the best strategy will eventually fail. The goal is to protect your capital so you can trade another day.',
      'The 2% Rule: Never risk more than 2% of your total portfolio on a single trade. If you have 10,000 coins, your maximum risk per trade should be 200 coins.',
      'Stop-Loss Orders: A stop-loss automatically sells your position when the price drops to a certain level. This limits your downside. For example, if you buy at 100, you might set a stop-loss at 95.',
      'Position Sizing: Calculate how many shares to buy based on your risk tolerance.\nFormula: Position Size = (Risk Amount) / (Entry Price - Stop Loss Price)\nExample: Risk 200 coins, buy at 100, stop at 95 → Position = 200/5 = 40 shares',
      'Diversification: Don\'t put all your eggs in one basket. Spread investments across different sectors (tech, healthcare, energy) and asset types to reduce overall risk.',
      'Risk/Reward Ratio: Only take trades where the potential reward is at least 2x the risk. If you risk 100 coins, your target profit should be at least 200 coins.',
    ],
    quiz: [
      { question: 'Max risk per trade rule of thumb?', options: ['10%', '50%', '2%', '25%'], correct: 2 },
      { question: 'What is diversification?', options: ['Buying one stock', 'Spreading investments', 'Selling everything', 'Day trading'], correct: 1 },
      { question: 'A good risk/reward ratio is at least?', options: ['1:1', '1:2', '3:1', '1:0.5'], correct: 1 },
    ] as Quiz[],
    reward: 300,
  },
  {
    id: 4, title: 'Order Types', desc: 'Market orders, limit orders, and stop orders.',
    content: [
      'Understanding order types is crucial for executing trades effectively. Different orders serve different purposes depending on your strategy.',
      'Market Order: Executes immediately at the current best available price. Use when you want to buy or sell right now. Downside: you might get a slightly different price than expected (slippage).',
      'Limit Order: You set a specific price. A limit buy executes only at your price or lower. A limit sell executes at your price or higher. Use when you want price control but aren\'t in a rush.',
      'Stop Order (Stop-Loss): Triggers a market order when the price reaches your specified level. Used to limit losses. A stop at $95 means "sell at market if price drops to $95."',
      'Stop-Limit Order: Combines stop and limit orders. When the stop price is hit, it places a limit order instead of a market order. More control but may not execute if the price moves too fast.',
      'Key tips:\n• Use market orders for liquid stocks with tight spreads\n• Use limit orders when the bid-ask spread is wide\n• Always set stop-losses to protect against unexpected drops\n• Consider time-in-force: Day orders expire at market close, GTC (Good Til Canceled) stays active',
    ],
    quiz: [
      { question: 'Which executes immediately?', options: ['Limit order', 'Stop order', 'Market order', 'None'], correct: 2 },
      { question: 'A limit buy order executes at?', options: ['Any price', 'Your price or lower', 'Your price or higher', 'Random price'], correct: 1 },
      { question: 'What does GTC stand for?', options: ['Get The Cash', 'Good Til Canceled', 'Global Trade Center', 'Great Trade Call'], correct: 1 },
    ] as Quiz[],
    reward: 250,
  },
  {
    id: 5, title: 'Portfolio Strategy', desc: 'Build a balanced long-term portfolio.',
    content: [
      'A well-built portfolio balances risk and reward based on your goals, time horizon, and risk tolerance. There\'s no one-size-fits-all approach.',
      'Asset Allocation: Decide how to split your money. A common split: 60% stocks, 30% bonds, 10% cash. Younger investors can afford more stocks (higher growth, higher risk).',
      'Growth Stocks vs Value Stocks:\n• Growth stocks are companies expected to grow revenue fast (e.g., tech startups). Higher potential returns but more volatile.\n• Value stocks are undervalued companies with stable earnings. Lower growth but more predictable.',
      'Rebalancing: Over time, your portfolio drifts from its target allocation. If stocks surge, they might become 80% of your portfolio. Rebalancing means selling some winners and buying more of the underperformers to return to your target mix.',
      'Dollar-Cost Averaging (DCA): Invest a fixed amount regularly regardless of price. This reduces the impact of volatility. You buy more shares when prices are low and fewer when prices are high.',
      'Key principles:\n• Don\'t try to time the market\n• Stay diversified across sectors and geographies\n• Keep fees low — they compound over time\n• Have an emergency fund before investing\n• Review and rebalance quarterly',
    ],
    quiz: [
      { question: 'What should a balanced portfolio include?', options: ['Only stocks', 'Stocks, bonds, cash', 'Only crypto', 'Only bonds'], correct: 1 },
      { question: 'Growth stocks are?', options: ['Low risk low return', 'Higher risk higher return', 'Always profitable', 'Government bonds'], correct: 1 },
      { question: 'What is Dollar-Cost Averaging?', options: ['Buying at the lowest price', 'Investing fixed amounts regularly', 'Only buying in dollars', 'Selling at the highest price'], correct: 1 },
    ] as Quiz[],
    reward: 400,
  },
];

const Modules = () => {
  const { user, completeModule, addCoins, addXp, addQuizMistake } = useUser();
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  const mod = activeModule !== null ? modulesData.find(m => m.id === activeModule) : null;
  const isCompleted = (id: number) => user.modules.some(m => m.moduleId === id && m.completed);

  const handleSubmitQuiz = () => {
    if (!mod) return;
    const score = mod.quiz.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);
    const pct = Math.round((score / mod.quiz.length) * 100);
    // Record wrong answers as mistakes
    mod.quiz.forEach((q, i) => {
      if (answers[i] !== q.correct) {
        addQuizMistake({
          moduleTitle: mod.title,
          question: q.question,
          yourAnswer: q.options[answers[i]] ?? 'No answer',
          correctAnswer: q.options[q.correct],
        });
      }
    });
    if (pct >= 50) {
      completeModule(mod.id, pct);
      addCoins(mod.reward);
      addXp(mod.reward);
    }
    setSubmitted(true);
  };

  if (mod) {
    const completed = isCompleted(mod.id);
    const score = mod.quiz.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);

    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <button onClick={() => { setActiveModule(null); setQuizMode(false); setAnswers([]); setSubmitted(false); }}
            className="font-mono text-xs text-muted-foreground hover:text-primary mb-4 inline-block">
            ← Back to Modules
          </button>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-cyber">
            <h2 className="font-display text-lg tracking-wider text-primary mb-1">{mod.title}</h2>
            {completed && <span className="font-mono text-xs text-neon-green">✓ Completed</span>}

            {!quizMode ? (
              <div className="mt-4 space-y-4">
                {mod.content.map((paragraph, pi) => (
                  <div key={pi} className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {paragraph}
                  </div>
                ))}
                <div className="border-t border-border pt-4 mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-mono text-xs text-muted-foreground">Ready to test your knowledge?</span>
                  </div>
                  {!completed && (
                    <button onClick={() => { setQuizMode(true); setAnswers([]); setSubmitted(false); }}
                      className="btn-cyber-primary text-xs">
                      Take Quiz — Earn {mod.reward} Coins
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-6">
                {mod.quiz.map((q, qi) => (
                  <div key={qi}>
                    <p className="font-mono text-sm text-foreground mb-2">{qi + 1}. {q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <button key={oi}
                          onClick={() => !submitted && setAnswers(a => { const n = [...a]; n[qi] = oi; return n; })}
                          className={`block w-full text-left px-3 py-2 rounded text-xs font-mono border transition-colors ${
                            submitted
                              ? oi === q.correct ? 'border-neon-green text-neon-green bg-neon-green/10'
                                : answers[qi] === oi ? 'border-destructive text-destructive bg-destructive/10'
                                : 'border-border text-muted-foreground'
                              : answers[qi] === oi ? 'border-primary text-primary bg-primary/10'
                              : 'border-border text-muted-foreground hover:border-muted-foreground'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!submitted ? (
                  <button onClick={handleSubmitQuiz} disabled={answers.length < mod.quiz.length}
                    className="btn-cyber-primary text-xs disabled:opacity-40">
                    Submit
                  </button>
                ) : (
                  <div className="card-cyber border-primary/30">
                    <p className="font-mono text-sm">
                      Score: <span className="text-primary">{score}/{mod.quiz.length}</span>
                      {score / mod.quiz.length >= 0.5
                        ? <span className="text-neon-green ml-2">+{mod.reward} coins & XP!</span>
                        : <span className="text-destructive ml-2">Need 50% to pass. Try again.</span>}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="font-display text-2xl tracking-wider text-primary text-glow-cyan">Modules</h2>
        <div className="space-y-3">
          {modulesData.map((m, i) => {
            const done = isCompleted(m.id);
            return (
              <motion.button key={m.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActiveModule(m.id)}
                className="card-cyber w-full text-left flex items-center gap-4 hover:border-primary/50 transition-colors"
              >
                {done ? <CheckCircle className="h-5 w-5 text-neon-green flex-shrink-0" />
                  : <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                <div className="flex-1">
                  <p className="font-display text-sm tracking-wider text-foreground">{m.title}</p>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
                <span className="font-mono text-xs text-primary">{m.reward} coins</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Modules;
