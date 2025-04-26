import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import StatsCard from "@/components/dashboard/stats-card";
import AfkCard from "@/components/dashboard/afk-card";
import ActivityList from "@/components/dashboard/activity-list";
import GamesList from "@/components/dashboard/games-list";
import { Loader2, Crown } from "lucide-react";
import { AfkProvider } from "@/hooks/use-afk";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePremiumNotification } from "@/hooks/use-premium-notification";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuth();
  const { showExpiredDialog } = usePremiumNotification();
  // Fetch user stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    }
  });

  // Fetch activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const res = await fetch("/api/activities?limit=4", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    }
  });

  // Fetch games
  const { data: games, isLoading: isLoadingGames } = useQuery({
    queryKey: ["/api/games"],
    queryFn: async () => {
      const res = await fetch("/api/games", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json();
    }
  });

  const isLoading = isLoadingStats || isLoadingActivities || isLoadingGames;

  return (
    <MainLayout pageTitle="Dashboard">
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your earnings data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-primary to-accent rounded-2xl shadow-lg">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mt-20 -mr-20 z-0"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -mb-16 -ml-16 z-0"></div>
              
              <div className="relative z-10 px-8 py-6 text-white">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Welcome to Your IdleCash Dashboard
                </h2>
                <p className="mt-2 max-w-2xl opacity-90">
                  Start earning passively by keeping this tab open or boost your earnings by playing games!
                </p>
                
                <div className="mt-4 inline-flex items-center space-x-4">
                  <div className="flex items-center bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                    <i className="ri-money-dollar-circle-line text-yellow-300 mr-2"></i>
                    <span className="text-white font-medium">
                      Total Balance: <span className="font-bold">{stats?.balance || 0}</span> coins
                    </span>
                  </div>
                  
                  <div className="hidden md:flex items-center bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                    <i className="ri-exchange-dollar-line text-green-300 mr-2"></i>
                    <span className="text-white">
                      Value: <span className="font-bold">${stats?.totalEarnings || "0.00"}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatsCard
                title="Total Earnings"
                value={`$${stats?.totalEarnings || "0.00"}`}
                icon="ri-money-dollar-circle-line"
                trend={{ value: 12, label: "vs last week" }}
                iconClass="bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300"
              />
              
              <StatsCard
                title="Today's Earnings"
                value={stats?.dailyEarnings.toString() || "0"}
                icon="ri-calendar-check-line"
                progress={{
                  value: stats?.dailyEarnings || 0,
                  max: stats?.dailyLimit || 200,
                  color: "bg-warning-500"
                }}
                iconClass="bg-warning-100 dark:bg-warning-900/30 text-warning-500"
              />
              
              <StatsCard
                title="Game Earnings"
                value={stats?.gameEarnings.toString() || "0"}
                icon="ri-gamepad-line"
                trend={{ value: 8, label: "vs last week" }}
                iconClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300"
              />
              
              <StatsCard
                title="Referral Earnings"
                value={stats?.referralEarnings.toString() || "0"}
                icon="ri-user-add-line"
                detail={{ label: "Total Referrals", value: stats?.totalReferrals || 0 }}
                iconClass="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300"
              />
            </div>
            
            {/* AFK and Activity Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* AFK Earnings */}
              <div className="lg:col-span-1">
                <AfkProvider>
                  <AfkCard />
                </AfkProvider>
              </div>
              
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <ActivityList activities={activities || []} />
              </div>
            </div>
            
            {/* Games Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Play & Earn More</h2>
                <Link to="/games">
                  <span className="flex items-center text-primary hover:underline cursor-pointer">
                    View all games <i className="ri-arrow-right-line ml-1"></i>
                  </span>
                </Link>
              </div>
              <GamesList games={games || []} />
            </div>
            
            {/* Test section for developers - will be hidden in production */}
            {user?.isAdmin && (
              <div className="mt-8 p-4 border border-dashed border-amber-300 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <div className="flex flex-col space-y-3">
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 flex items-center">
                    <Crown className="h-5 w-5 mr-2" /> 
                    Premium Features Testing Panel
                  </h3>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded border border-amber-200 dark:border-amber-800">
                    <h4 className="font-medium text-amber-800 dark:text-amber-300">How to Test Premium Notification Popup:</h4>
                    <ol className="list-decimal ml-5 mt-2 text-sm text-amber-700 dark:text-amber-400 space-y-2">
                      <li>First click "Set Premium (1 min)" to add premium status with short expiry</li>
                      <li>Wait for 1 minute for automatic expiration <strong>OR</strong> click "Revoke Premium" to immediately remove premium</li>
                      <li>The popup should appear automatically when premium status changes</li>
                      <li>You can also manually trigger the popup with "Test Premium Dialog" for immediate feedback</li>
                    </ol>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <Button 
                      variant="outline" 
                      onClick={showExpiredDialog}
                      className="bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-800"
                    >
                      <Crown className="h-4 w-4 mr-2 text-amber-500" />
                      Test Premium Dialog
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/admin/test-premium-expiration/${user?.id}`, {
                            method: 'GET',
                            credentials: 'include'
                          });
                          const data = await res.json();
                          alert(data.message);
                        } catch (error) {
                          alert('Error: ' + (error as Error).message);
                        }
                      }}
                      className="bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-800"
                    >
                      <Crown className="h-4 w-4 mr-2 text-amber-500" />
                      Simulate Expired Premium
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        try {
                          // Set premium for 1 minute
                          const expiresIn = new Date();
                          expiresIn.setMinutes(expiresIn.getMinutes() + 1);
                          
                          const res = await fetch(`/api/admin/premium/${user?.id}`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ 
                              months: 0,  // Will be interpreted as a very short duration
                              customExpiry: expiresIn.toISOString() 
                            }),
                            credentials: 'include'
                          });
                          const data = await res.json();
                          alert(`User set as premium until ${new Date(data.user.premiumUntil).toLocaleTimeString()}. The popup should appear after expiration.`);
                        } catch (error) {
                          alert('Error: ' + (error as Error).message);
                        }
                      }}
                      className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                    >
                      <Crown className="h-4 w-4 mr-2 text-green-500" />
                      Set Premium (1 min)
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/admin/premium/${user?.id}`, {
                            method: 'DELETE',
                            credentials: 'include'
                          });
                          const data = await res.json();
                          alert(`Premium status revoked. The popup should appear shortly.`);
                        } catch (error) {
                          alert('Error: ' + (error as Error).message);
                        }
                      }}
                      className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
                    >
                      <Crown className="h-4 w-4 mr-2 text-red-500" />
                      Revoke Premium
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
