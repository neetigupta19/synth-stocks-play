import { ReactNode } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ChatSearchBar } from '@/components/ChatSearchBar';
import {
  LayoutDashboard, BookOpen, CandlestickChart, Clock, LineChart,
  MessageSquare, User, Trophy, AlertTriangle, LogOut,
} from 'lucide-react';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Modules', url: '/modules', icon: BookOpen },
  { title: 'Live Trading', url: '/live-trading', icon: CandlestickChart },
  { title: 'Bi-weekly Test', url: '/biweekly', icon: Clock },
  { title: 'Discussion', url: '/discussion', icon: MessageSquare },
  { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'Mistake Analysis', url: '/mistakes', icon: AlertTriangle },
  { title: 'Profile', url: '/profile', icon: User },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background bg-grid scanline">
      {/* Top Nav Bar */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="font-display text-lg tracking-widest text-primary text-glow-cyan">
            STOCK<span className="text-secondary">Z</span>
          </h1>
          <span className="font-mono text-xs text-muted-foreground">
            <span className="text-primary">{user.coins.toLocaleString()}</span> coins
          </span>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-destructive transition-colors">
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </header>

      {/* Section Navigation */}
      <nav className="border-b border-border bg-card/80 overflow-x-auto flex-shrink-0">
        <div className="flex items-center gap-1 px-4 py-2 min-w-max">
          {navItems.map(item => {
            const isActive = location.pathname === item.url;
            return (
              <button
                key={item.url}
                onClick={() => navigate(item.url)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md font-mono text-xs transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto pb-20">
        {children}
      </main>

      {/* Persistent Chat Search Bar */}
      <ChatSearchBar />
    </div>
  );
}
