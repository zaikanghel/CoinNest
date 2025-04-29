import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import TermsOfServicePage from "@/pages/terms-of-service";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import ContactPage from "@/pages/contact";
import DashboardPage from "@/pages/dashboard-page";
import GamesPage from "@/pages/games-page";
import AfkPage from "@/pages/afk-page";
import LeaderboardPage from "@/pages/leaderboard-page";
import WalletPage from "@/pages/wallet-page";
import ReferralsPage from "@/pages/referrals-page";
import AdminPage from "@/pages/admin-page";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import HelpPage from "@/pages/help-page";
import PremiumPage from "@/pages/premium-page";
import DailyRewardsPage from "@/pages/daily-rewards-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AfkProvider } from "@/hooks/use-afk";
import { useAuth } from "@/hooks/use-auth";
import { SettingsProvider } from "@/hooks/use-settings";
import { PremiumNotificationProvider } from "@/hooks/use-premium-notification";
import { TourProvider } from "@/hooks/use-tour";
import { ShepherdJourneyProvider } from "react-shepherd";

function App() {
  const { user } = useAuth();
  
  return (
    <TooltipProvider>
      <SettingsProvider>
        <PremiumNotificationProvider>
          <AfkProvider>
            <ShepherdJourneyProvider>
              <TourProvider>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                  <Switch>
                    <Route path="/" component={LandingPage} />
                    <Route path="/auth" component={AuthPage} />
                    <Route path="/terms-of-service" component={TermsOfServicePage} />
                    <Route path="/privacy-policy" component={PrivacyPolicyPage} />
                    <Route path="/contact" component={ContactPage} />
                    <ProtectedRoute path="/dashboard" component={DashboardPage} />
                    <ProtectedRoute path="/games" component={GamesPage} />
                    <ProtectedRoute path="/afk" component={AfkPage} />
                    <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
                    <ProtectedRoute path="/wallet" component={WalletPage} />
                    <ProtectedRoute path="/referrals" component={ReferralsPage} />
                    <ProtectedRoute path="/admin" component={AdminPage} />
                    <ProtectedRoute path="/profile" component={ProfilePage} />
                    <ProtectedRoute path="/settings" component={SettingsPage} />
                    <ProtectedRoute path="/help" component={HelpPage} />
                    <ProtectedRoute path="/premium" component={PremiumPage} />
                    <ProtectedRoute path="/daily-rewards" component={DailyRewardsPage} />
                    <Route component={NotFound} />
                  </Switch>
                </div>
              </TourProvider>
            </ShepherdJourneyProvider>
          </AfkProvider>
        </PremiumNotificationProvider>
      </SettingsProvider>
    </TooltipProvider>
  );
}

export default App;
