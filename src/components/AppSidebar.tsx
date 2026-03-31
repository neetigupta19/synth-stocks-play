import { LayoutDashboard, BookOpen, Clock, MessageSquare, User, LogOut, CandlestickChart } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useUser } from '@/contexts/UserContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Modules', url: '/modules', icon: BookOpen },
  { title: 'Live Trading', url: '/live-trading', icon: CandlestickChart },
  { title: 'Bi-weekly Test', url: '/biweekly', icon: Clock },
  { title: 'TradeTalk', url: '/tradetalk', icon: MessageSquare },
];

export function AppSidebar() {
  const { user, logout } = useUser();

  return (
    <Sidebar className="border-r border-border">
      <div className="p-5 border-b border-border">
        <h1 className="font-display text-xl tracking-widest text-primary text-glow-cyan">
          STOCK<span className="text-secondary">Z</span>
        </h1>
        {user && (
          <div className="mt-3 font-mono text-xs text-muted-foreground">
            <span className="text-primary">{user.coins.toLocaleString()}</span> coins
          </div>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-mono transition-colors hover:bg-muted"
                      activeClassName="bg-muted text-primary border-l-2 border-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user && (
        <SidebarFooter className="p-4 border-t border-border">
          <button onClick={logout} className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-destructive transition-colors w-full">
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
