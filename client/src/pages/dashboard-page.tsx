import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import StatsCard from "@/components/dashboard/stats-card";
import AfkCard from "@/components/dashboard/afk-card";
import ActivityList from "@/components/dashboard/activity-list";
import GamesList from "@/components/dashboard/games-list";
import { Loader2 } from "lucide-react";
import { AfkProvider } from "@/hooks/use-afk";

export default function DashboardPage() {
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
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <GamesList games={games || []} />
          </>
        )}
      </div>
    </MainLayout>
  );
}
