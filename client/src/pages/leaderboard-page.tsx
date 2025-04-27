import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrophyIcon, Calendar, Users } from "lucide-react";
import { getColorFromString, getUserInitials } from "@/lib/utils";

// Type definitions for the leaderboard data
interface GameEntry {
  score: number;
  coinsEarned: number;
  date: string;
  user: {
    id: number;
    username: string;
  };
}

interface TopEarner {
  rank: number;
  username: string;
  totalEarned: number;
  afkEarned: number;
  gamesEarned: number;
  referralEarned: number;
}

export default function LeaderboardPage() {
  const [leaderboardType, setLeaderboardType] = useState("games");

  // Fetch games leaderboard
  const { data: gamesLeaderboard, isLoading: isLoadingGamesLeaderboard } = useQuery<GameEntry[]>({
    queryKey: ["/api/games/memory-match/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/games/memory-match/leaderboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    }
  });

  // Fetch clicker game leaderboard
  const { data: clickerLeaderboard, isLoading: isLoadingClickerLeaderboard } = useQuery<GameEntry[]>({
    queryKey: ["/api/games/clicker-quest/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/games/clicker-quest/leaderboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    }
  });

  // Fetch top earners for the earnings leaderboard
  const { data: topEarners, isLoading: isLoadingTopEarners } = useQuery<TopEarner[]>({
    queryKey: ["/api/leaderboard/top-earners"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard/top-earners", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch top earners");
      return res.json();
    }
  });

  const isLoading = isLoadingGamesLeaderboard || isLoadingClickerLeaderboard || isLoadingTopEarners;

  return (
    <MainLayout pageTitle="Leaderboard">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* Top Banner */}
            <Card className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrophyIcon className="h-10 w-10 mr-4" />
                  <div>
                    <h2 className="text-2xl font-bold">CoinNest Leaderboards</h2>
                    <p className="text-white/80">Compete with other players and earn rewards</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard Navigation */}
            <div className="flex justify-between items-center">
              <Tabs 
                defaultValue="games" 
                value={leaderboardType} 
                onValueChange={setLeaderboardType}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-[400px]">
                  <TabsTrigger value="games">
                    <Users className="h-4 w-4 mr-2" />
                    Game Scores
                  </TabsTrigger>
                  <TabsTrigger value="earnings">
                    <Calendar className="h-4 w-4 mr-2" />
                    Top Earners
                  </TabsTrigger>
                </TabsList>

                {/* Game Scores Tab */}
                <TabsContent value="games" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Memory Match Leaderboard</CardTitle>
                      <CardDescription>
                        Top players based on memory game scores
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 py-2 font-medium text-sm text-gray-500 dark:text-gray-400">
                          <div className="col-span-1">Rank</div>
                          <div className="col-span-3">Player</div>
                          <div className="col-span-3">Score</div>
                          <div className="col-span-3">Earned</div>
                          <div className="col-span-2">Date</div>
                        </div>
                        <Separator />
                        {gamesLeaderboard && gamesLeaderboard.length > 0 ? (
                          gamesLeaderboard.map((entry: GameEntry, index: number) => (
                            <div key={index} className="grid grid-cols-12 py-3 text-sm items-center">
                              <div className="col-span-1">
                                {index === 0 ? (
                                  <Badge className="bg-amber-500 hover:bg-amber-600">{index + 1}</Badge>
                                ) : index === 1 ? (
                                  <Badge className="bg-gray-400 hover:bg-gray-500">{index + 1}</Badge>
                                ) : index === 2 ? (
                                  <Badge className="bg-amber-700 hover:bg-amber-800">{index + 1}</Badge>
                                ) : (
                                  <span className="font-medium">{index + 1}</span>
                                )}
                              </div>
                              <div className="col-span-3 flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback className={getColorFromString(entry.user.username)}>
                                    {getUserInitials(entry.user.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{entry.user.username}</span>
                              </div>
                              <div className="col-span-3 font-medium">{entry.score}</div>
                              <div className="col-span-3 text-success-500">+{entry.coinsEarned} coins</div>
                              <div className="col-span-2 text-gray-500 dark:text-gray-400">
                                {new Date(entry.date).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 text-gray-500">
                            No leaderboard data available
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Clicker Quest Leaderboard</CardTitle>
                      <CardDescription>
                        Top players based on clicker game scores
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 py-2 font-medium text-sm text-gray-500 dark:text-gray-400">
                          <div className="col-span-1">Rank</div>
                          <div className="col-span-3">Player</div>
                          <div className="col-span-3">Score</div>
                          <div className="col-span-3">Earned</div>
                          <div className="col-span-2">Date</div>
                        </div>
                        <Separator />
                        {clickerLeaderboard && clickerLeaderboard.length > 0 ? (
                          clickerLeaderboard.map((entry: GameEntry, index: number) => (
                            <div key={index} className="grid grid-cols-12 py-3 text-sm items-center">
                              <div className="col-span-1">
                                {index === 0 ? (
                                  <Badge className="bg-amber-500 hover:bg-amber-600">{index + 1}</Badge>
                                ) : index === 1 ? (
                                  <Badge className="bg-gray-400 hover:bg-gray-500">{index + 1}</Badge>
                                ) : index === 2 ? (
                                  <Badge className="bg-amber-700 hover:bg-amber-800">{index + 1}</Badge>
                                ) : (
                                  <span className="font-medium">{index + 1}</span>
                                )}
                              </div>
                              <div className="col-span-3 flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback className={getColorFromString(entry.user.username)}>
                                    {getUserInitials(entry.user.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{entry.user.username}</span>
                              </div>
                              <div className="col-span-3 font-medium">{entry.score}</div>
                              <div className="col-span-3 text-success-500">+{entry.coinsEarned} coins</div>
                              <div className="col-span-2 text-gray-500 dark:text-gray-400">
                                {new Date(entry.date).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 text-gray-500">
                            No leaderboard data available
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Top Earners Tab */}
                <TabsContent value="earnings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>All-Time Top Earners</CardTitle>
                      <CardDescription>
                        Players who have earned the most coins on CoinNest
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 py-2 font-medium text-sm text-gray-500 dark:text-gray-400">
                          <div className="col-span-1">Rank</div>
                          <div className="col-span-3">Player</div>
                          <div className="col-span-2">Total</div>
                          <div className="col-span-2">AFK</div>
                          <div className="col-span-2">Games</div>
                          <div className="col-span-2">Referrals</div>
                        </div>
                        <Separator />
                        {topEarners && topEarners.length > 0 ? (
                          topEarners.map((user: TopEarner, index: number) => (
                            <div key={index} className="grid grid-cols-12 py-3 text-sm items-center">
                              <div className="col-span-1">
                                {index === 0 ? (
                                  <Badge className="bg-amber-500 hover:bg-amber-600">{index + 1}</Badge>
                                ) : index === 1 ? (
                                  <Badge className="bg-gray-400 hover:bg-gray-500">{index + 1}</Badge>
                                ) : index === 2 ? (
                                  <Badge className="bg-amber-700 hover:bg-amber-800">{index + 1}</Badge>
                                ) : (
                                  <span className="font-medium">{index + 1}</span>
                                )}
                              </div>
                              <div className="col-span-3 flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback className={getColorFromString(user.username)}>
                                    {getUserInitials(user.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.username}</span>
                              </div>
                              <div className="col-span-2 font-medium">{user.totalEarned.toLocaleString()}</div>
                              <div className="col-span-2">{user.afkEarned.toLocaleString()}</div>
                              <div className="col-span-2">{user.gamesEarned.toLocaleString()}</div>
                              <div className="col-span-2">{user.referralEarned.toLocaleString()}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 text-gray-500">
                            No earnings data available
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
