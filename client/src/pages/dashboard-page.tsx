import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import StatsCard, { ProgressConfig } from "@/components/dashboard/stats-card";
import AfkCard from "@/components/dashboard/afk-card";
import ActivityList from "@/components/dashboard/activity-list";
import GamesList from "@/components/dashboard/games-list";
import { Loader2, Crown } from "lucide-react";
import { AfkProvider } from "@/hooks/use-afk";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface StatsResponse {
  balance: number;
  totalEarnings: string;
  dailyEarnings: number;
  dailyLimit: number;
  baseDailyLimit: number;
  isPremiumActive: boolean;
  dailyProgress: string;
  dailyProgressPercent: number;
  gameEarnings: number;
  dailyGameLimit: number;
  baseDailyGameLimit: number;
  referralEarnings: number;
  totalReferrals: number;
}

interface Game {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  category: string;
  maxEarning: number;
  baseReward: number;
  isNew: boolean;
  isPopular: boolean;
  imageUrl: string;
}

interface GamesResponse {
  games: Game[];
  dailyGameLimit: number;
  baseDailyGameLimit: number;
  isPremiumActive: boolean;
  dailyLimitBonus: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  // Fetch user stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<StatsResponse>({
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
  const { data: games, isLoading: isLoadingGames } = useQuery<GamesResponse>({
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
      <div className="space-y-8 dashboard-header">
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
            <div className="dashboard-welcome relative overflow-hidden bg-gradient-to-r from-primary to-accent rounded-2xl shadow-lg">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mt-20 -mr-20 z-0"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -mb-16 -ml-16 z-0"></div>
              
              <div className="relative z-10 px-8 py-6 text-white">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Welcome to Your CoinNest Dashboard
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stats-cards">
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
                progress={
                  stats ? {
                    value: stats.dailyEarnings,
                    max: stats.dailyLimit,
                    color: "bg-warning-500",
                    premium: stats.isPremiumActive ? {
                      baseMax: stats.baseDailyLimit,
                      bonus: stats.dailyLimit - stats.baseDailyLimit
                    } : undefined
                  } as ProgressConfig : undefined
                }
                iconClass={stats?.isPremiumActive 
                  ? "bg-gradient-to-r from-amber-100 to-yellow-200 dark:from-amber-900/30 dark:to-yellow-800/30 text-amber-600"
                  : "bg-warning-100 dark:bg-warning-900/30 text-warning-500"
                }
              />
              
              <StatsCard
                title="Game Earnings"
                value={stats?.gameEarnings.toString() || "0"}
                icon="ri-gamepad-line"
                progress={
                  stats ? {
                    value: stats.gameEarnings,
                    max: stats.dailyGameLimit,
                    color: "bg-indigo-500",
                    premium: stats.isPremiumActive ? {
                      baseMax: stats.baseDailyGameLimit,
                      bonus: stats.dailyGameLimit - stats.baseDailyGameLimit
                    } : undefined
                  } as ProgressConfig : undefined
                }
                iconClass={stats?.isPremiumActive 
                  ? "bg-gradient-to-r from-indigo-100 to-purple-200 dark:from-indigo-900/30 dark:to-purple-800/30 text-indigo-600"
                  : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300"
                }
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
                  <div className="afk-card">
                    <AfkCard />
                  </div>
                </AfkProvider>
              </div>
              
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="activity-list">
                  <ActivityList activities={activities || []} />
                </div>
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
              <div className="games-list">
                <GamesList games={games?.games || []} />
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
