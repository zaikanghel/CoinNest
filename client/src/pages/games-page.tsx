import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MemoryGame from "@/components/games/memory-game";
import ClickerGame from "@/components/games/clicker-game";
import { useSettings } from "@/hooks/use-settings";
import { Loader2, Info } from "lucide-react";

type GameData = {
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
};

export default function GamesPage() {
  const [gameToPlay, setGameToPlay] = useState<GameData | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const { settings } = useSettings();

  // Fetch available games
  const { data: games, isLoading } = useQuery({
    queryKey: ["/api/games"],
    queryFn: async () => {
      const res = await fetch("/api/games", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json() as Promise<GameData[]>;
    }
  });

  // Fetch user stats for daily limits
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    }
  });

  // Fetch leaderboards for games
  const { data: memoryLeaderboard, isLoading: isLoadingMemoryLeaderboard } = useQuery({
    queryKey: ["/api/games/memory-match/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/games/memory-match/leaderboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    }
  });

  const { data: clickerLeaderboard, isLoading: isLoadingClickerLeaderboard } = useQuery({
    queryKey: ["/api/games/clicker-quest/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/games/clicker-quest/leaderboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    }
  });

  const startGame = (game: GameData) => {
    setGameToPlay(game);
    setShowGameModal(true);
  };

  const closeGameModal = () => {
    setShowGameModal(false);
    setGameToPlay(null);
  };
  
  // Get daily game limit from settings
  const dailyGameLimit = parseInt(settings.game_daily_limit || "1000");
  
  // Calculate daily game progress
  const dailyGamesEarnings = stats?.dailyGamesEarnings || 0;
  const dailyGamesProgress = (dailyGamesEarnings / dailyGameLimit) * 100;

  return (
    <MainLayout pageTitle="Games">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* Daily Limit Card */}
            <Card className="bg-gradient-to-r from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Daily Games Limits</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      You can earn up to {dailyGameLimit} coins per day from games
                    </p>
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{dailyGamesEarnings}/{dailyGameLimit} coins</span>
                      </div>
                      <Progress 
                        value={dailyGamesProgress} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                  {dailyGamesEarnings >= dailyGameLimit && (
                    <Alert className="flex-shrink-0 md:max-w-[280px] bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50">
                      <Info className="h-4 w-4 mt-0.5" />
                      <AlertDescription className="ml-2">
                        You've reached your daily game earnings limit. Come back tomorrow for more!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Games Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Available Games</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {games?.map((game) => (
                    <div key={game.id} className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group">
                      <div className="relative">
                        <img 
                          src={game.imageUrl} 
                          alt={game.name} 
                          className="w-full h-36 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button onClick={() => startGame(game)}>
                            Play Now
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium">{game.name}</h4>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <i className="ri-gamepad-line mr-1"></i>
                          <span>{game.category} • {game.difficulty}</span>
                        </div>
                        <div className="mt-3 flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <i className="ri-coin-line text-amber-500 mr-1"></i>
                              <span className="text-sm font-medium">Up to {game.maxEarning}/hr</span>
                            </div>
                            {game.id === "memory-match" && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                                {game.baseReward} coins/match
                              </span>
                            )}
                            {game.id === "clicker-quest" && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                {game.baseReward} coins/click
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            {game.isNew && (
                              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-none">
                                New
                              </Badge>
                            )}
                            {game.isPopular && (
                              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-none">
                                Popular
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Leaderboards */}
            <Card>
              <CardHeader>
                <CardTitle>Leaderboards</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="memory-match">
                  <TabsList className="grid grid-cols-2 w-[400px] mb-6">
                    <TabsTrigger value="memory-match">Memory Match</TabsTrigger>
                    <TabsTrigger value="clicker-quest">Clicker Quest</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="memory-match">
                    {isLoadingMemoryLeaderboard ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-12 py-2 font-medium text-sm">
                          <div className="col-span-1">Rank</div>
                          <div className="col-span-4">Player</div>
                          <div className="col-span-3">Score</div>
                          <div className="col-span-2">Earned</div>
                          <div className="col-span-2">Date</div>
                        </div>
                        <Separator />
                        {memoryLeaderboard?.map((entry: any, index: number) => (
                          <div key={index} className="grid grid-cols-12 py-2 text-sm">
                            <div className="col-span-1 font-medium">{index + 1}</div>
                            <div className="col-span-4">{entry.user.username}</div>
                            <div className="col-span-3">{entry.score}</div>
                            <div className="col-span-2 text-success-500">{entry.coinsEarned}</div>
                            <div className="col-span-2 text-gray-500">{new Date(entry.date).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="clicker-quest">
                    {isLoadingClickerLeaderboard ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-12 py-2 font-medium text-sm">
                          <div className="col-span-1">Rank</div>
                          <div className="col-span-4">Player</div>
                          <div className="col-span-3">Score</div>
                          <div className="col-span-2">Earned</div>
                          <div className="col-span-2">Date</div>
                        </div>
                        <Separator />
                        {clickerLeaderboard?.map((entry: any, index: number) => (
                          <div key={index} className="grid grid-cols-12 py-2 text-sm">
                            <div className="col-span-1 font-medium">{index + 1}</div>
                            <div className="col-span-4">{entry.user.username}</div>
                            <div className="col-span-3">{entry.score}</div>
                            <div className="col-span-2 text-success-500">{entry.coinsEarned}</div>
                            <div className="col-span-2 text-gray-500">{new Date(entry.date).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Game Modal */}
      <Dialog open={showGameModal} onOpenChange={setShowGameModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{gameToPlay?.name}</DialogTitle>
          </DialogHeader>
          {gameToPlay?.id === "memory-match" && (
            <MemoryGame onClose={closeGameModal} />
          )}
          {gameToPlay?.id === "clicker-quest" && (
            <ClickerGame onClose={closeGameModal} />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
