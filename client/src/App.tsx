import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import GamesPage from "@/pages/games-page";
import AfkPage from "@/pages/afk-page";
import LeaderboardPage from "@/pages/leaderboard-page";
import WalletPage from "@/pages/wallet-page";
import ReferralsPage from "@/pages/referrals-page";
import AdminPage from "@/pages/admin-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AfkProvider } from "@/hooks/use-afk";
import { useAuth } from "@/hooks/use-auth";

function App() {
  const { user } = useAuth();
  
  return (
    <TooltipProvider>
      <AfkProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <ProtectedRoute path="/" component={DashboardPage} />
            <ProtectedRoute path="/games" component={GamesPage} />
            <ProtectedRoute path="/afk" component={AfkPage} />
            <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
            <ProtectedRoute path="/wallet" component={WalletPage} />
            <ProtectedRoute path="/referrals" component={ReferralsPage} />
            <ProtectedRoute path="/admin" component={AdminPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </AfkProvider>
    </TooltipProvider>
  );
}

export default App;
