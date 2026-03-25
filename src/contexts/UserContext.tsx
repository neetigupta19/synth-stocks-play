import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ModuleProgress {
  moduleId: number;
  completed: boolean;
  score: number;
}

export interface ForumReply {
  author: string;
  content: string;
  timestamp: number;
}

export interface ForumPost {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  likes: number;
  dislikes: number;
  replies: ForumReply[];
}

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
}

export interface User {
  username: string;
  coins: number;
  xp: number;
  level: number;
  joinedAt: number;
  modules: ModuleProgress[];
  holdings: Holding[];
  trades: number;
  badges: string[];
}

interface UserContextType {
  user: User | null;
  signup: (username: string) => void;
  logout: () => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addXp: (amount: number) => void;
  completeModule: (moduleId: number, score: number) => void;
  updateHoldings: (holdings: Holding[]) => void;
  incrementTrades: () => void;
  addBadge: (badge: string) => void;
  forumPosts: ForumPost[];
  addForumPost: (content: string) => void;
  addReply: (postId: string, content: string) => void;
  likePost: (postId: string) => void;
  dislikePost: (postId: string) => void;
  deletePost: (postId: string) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be within UserProvider');
  return ctx;
};

const STORAGE_KEY = 'stockz_user';
const FORUM_KEY = 'stockz_forum';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [forumPosts, setForumPosts] = useState<ForumPost[]>(() => {
    const saved = localStorage.getItem(FORUM_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(FORUM_KEY, JSON.stringify(forumPosts));
  }, [forumPosts]);

  const signup = (username: string) => {
    setUser({
      username, coins: 0, xp: 0, level: 1,
      joinedAt: Date.now(), modules: [], holdings: [],
      trades: 0, badges: ['Newcomer'],
    });
  };

  const logout = () => setUser(null);

  const addCoins = (amount: number) => setUser(u => u ? { ...u, coins: u.coins + amount } : u);

  const spendCoins = (amount: number) => {
    if (!user || user.coins < amount) return false;
    setUser(u => u ? { ...u, coins: u.coins - amount } : u);
    return true;
  };

  const addXp = (amount: number) => setUser(u => {
    if (!u) return u;
    const newXp = u.xp + amount;
    const newLevel = Math.floor(newXp / 500) + 1;
    const newBadges = [...u.badges];
    if (newLevel >= 5 && !newBadges.includes('Veteran')) newBadges.push('Veteran');
    if (newLevel >= 10 && !newBadges.includes('Elite')) newBadges.push('Elite');
    return { ...u, xp: newXp, level: newLevel, badges: newBadges };
  });

  const completeModule = (moduleId: number, score: number) => setUser(u => {
    if (!u) return u;
    const existing = u.modules.find(m => m.moduleId === moduleId);
    if (existing && existing.completed) return u;
    const modules = existing
      ? u.modules.map(m => m.moduleId === moduleId ? { ...m, completed: true, score } : m)
      : [...u.modules, { moduleId, completed: true, score }];
    const newBadges = [...u.badges];
    if (modules.filter(m => m.completed).length >= 3 && !newBadges.includes('Scholar')) newBadges.push('Scholar');
    return { ...u, modules, badges: newBadges };
  });

  const updateHoldings = (holdings: Holding[]) => setUser(u => u ? { ...u, holdings } : u);

  const incrementTrades = () => setUser(u => {
    if (!u) return u;
    const trades = u.trades + 1;
    const newBadges = [...u.badges];
    if (trades >= 5 && !newBadges.includes('Trader')) newBadges.push('Trader');
    if (trades >= 20 && !newBadges.includes('Day Trader')) newBadges.push('Day Trader');
    return { ...u, trades, badges: newBadges };
  });

  const addBadge = (badge: string) => setUser(u => {
    if (!u || u.badges.includes(badge)) return u;
    return { ...u, badges: [...u.badges, badge] };
  });

  const addForumPost = (content: string) => {
    if (!user) return;
    setForumPosts(p => [{
      id: crypto.randomUUID(), author: user.username,
      content, timestamp: Date.now(), replies: [],
    }, ...p]);
  };

  const addReply = (postId: string, content: string) => {
    if (!user) return;
    setForumPosts(posts => posts.map(p =>
      p.id === postId ? { ...p, replies: [...p.replies, { author: user.username, content, timestamp: Date.now() }] } : p
    ));
  };

  return (
    <UserContext.Provider value={{
      user, signup, logout, addCoins, spendCoins, addXp,
      completeModule, updateHoldings, incrementTrades, addBadge,
      forumPosts, addForumPost, addReply,
    }}>
      {children}
    </UserContext.Provider>
  );
};
