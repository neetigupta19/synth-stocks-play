import { useState, useRef, useCallback } from 'react';
import { Bot, Search, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const quickAnswers: Record<string, string> = {
  'stock': 'A stock represents ownership in a company. When you buy shares, you own a piece of that company.',
  'diversification': 'Diversification means spreading your investments across different assets to reduce risk.',
  'candlestick': 'Candlestick charts show open, high, low, and close prices. Green = price up, Red = price down.',
  'stop loss': 'A stop-loss order automatically sells a stock when it drops to a certain price to limit losses.',
  'bull': 'A bull market is when stock prices are rising or expected to rise. Opposite of a bear market.',
  'bear': 'A bear market is when stock prices are falling or expected to fall. Opposite of a bull market.',
  'ipo': 'IPO (Initial Public Offering) is when a company first sells shares to the public on a stock exchange.',
  'dividend': 'A dividend is a payment made by a company to its shareholders from its profits.',
  'portfolio': 'A portfolio is the collection of all your investments including stocks, bonds, and other assets.',
  'risk': 'Never risk more than 2% of your portfolio on a single trade. Use stop-losses and diversify.',
};

export function ChatSearchBar() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const match = Object.entries(quickAnswers).find(([key]) => q.includes(key));
    setAnswer(match ? match[1] : "I don't have an answer for that yet. Try searching for: stock, diversification, candlestick, stop loss, bull, bear, IPO, dividend, portfolio, or risk.");
    setIsOpen(true);
  };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({ x: dragStartRef.current.posX + dx, y: dragStartRef.current.posY + dy });
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={dragRef}
      className="fixed bottom-4 z-50 left-1/2"
      style={{
        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
        width: 'min(95vw, 42rem)',
      }}
    >
      <AnimatePresence>
        {isOpen && answer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-2 px-1"
          >
            <div className="card-cyber relative">
              <button onClick={() => { setIsOpen(false); setAnswer(null); }} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
              <div className="flex gap-2 items-start">
                <Bot className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="font-mono text-xs text-foreground leading-relaxed">{answer}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="bg-card border border-border rounded-lg py-3 px-4 shadow-lg flex items-center gap-2">
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none select-none"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask StockZ AI anything..."
              className="w-full bg-muted border border-border rounded-md pl-10 pr-4 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button type="submit" className="btn-cyber-primary text-xs py-2.5">
            <Bot className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
