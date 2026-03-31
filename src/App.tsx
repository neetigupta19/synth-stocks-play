// App entry
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Modules from "./pages/Modules";
import LiveTrading from "./pages/LiveTrading";
import Discussion from "./pages/Discussion";

import BiweeklyTest from "./pages/BiweeklyTest";
import Leaderboard from "./pages/Leaderboard";
import MistakeAnalysis from "./pages/MistakeAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/modules" element={<Modules />} />
            <Route path="/live-trading" element={<LiveTrading />} />
            <Route path="/tradetalk" element={<Discussion />} />
            <Route path="/biweekly" element={<BiweeklyTest />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/mistakes" element={<MistakeAnalysis />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
