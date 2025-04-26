import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Clock, MousePointer, Coins, ArrowUp, Award } from "lucide-react";

type Upgrade = {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: number;
  owned: number;
};

type ClickerGameProps = {
  onClose: () => void;
};

export default function ClickerGame({ onClose }: ClickerGameProps) {
  const { toast } = useToast();
  const [score, setScore] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoClickPower, setAutoClickPower] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [level, setLevel] = useState(1);
  const [nextLevelThreshold, setNextLevelThreshold] = useState(100);
  const [elapsedFormatted, setElapsedFormatted] = useState("00:00");
  
  // Upgrades
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: "click_power",
      name: "Better Clicker",
      description: "Increase points per click",
      cost: 10,
      effect: 1,
      owned: 0
    },
    {
      id: "auto_clicker",
      name: "Auto Clicker",
      description: "Automatically click every second",
      cost: 25,
      effect: 1,
      owned: 0
    },
    {
      id: "super_clicker",
      name: "Super Clicker",
      description: "Significantly increases points per click",
      cost: 100,
      effect: 5,
      owned: 0
    }
  ]);
  
  // Timer reference for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoClickerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto clicker effect
  useEffect(() => {
    if (autoClickPower > 0) {
      autoClickerRef.current = setInterval(() => {
        setScore(prev => prev + autoClickPower);
      }, 1000);
    }
    
    return () => {
      if (autoClickerRef.current) {
        clearInterval(autoClickerRef.current);
      }
    };
  }, [autoClickPower]);
  
  // Update level based on score
  useEffect(() => {
    const newLevel = Math.floor(Math.log2(score + 10) / Math.log2(5)) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      setNextLevelThreshold(Math.pow(5, newLevel));
      
      if (newLevel > level) {
        toast({
          title: "Level Up!",
          description: `You've reached level ${newLevel}!`,
          variant: "default"
        });
      }
    }
    
    // End game after 2 minutes
    if (timeElapsed >= 120 && !gameCompleted) {
      setGameCompleted(true);
    }
  }, [score, level, timeElapsed, gameCompleted, toast]);
  
  // Timer for the game
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        // Format the time as mm:ss
        const minutes = Math.floor(newTime / 60).toString().padStart(2, '0');
        const seconds = (newTime % 60).toString().padStart(2, '0');
        setElapsedFormatted(`${minutes}:${seconds}`);
        
        return newTime;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Click handler
  const handleClick = () => {
    setScore(prev => prev + clickPower);
    setClickCount(prev => prev + 1);
  };
  
  // Calculate progress to next level
  const calculateLevelProgress = useCallback(() => {
    const prevThreshold = level === 1 ? 0 : Math.pow(5, level - 1);
    const currentThreshold = Math.pow(5, level);
    const range = currentThreshold - prevThreshold;
    const currentWithinRange = score - prevThreshold;
    
    return Math.min(100, Math.max(0, (currentWithinRange / range) * 100));
  }, [level, score]);
  
  // Buy an upgrade
  const buyUpgrade = (upgradeId: string) => {
    const upgradeIndex = upgrades.findIndex(u => u.id === upgradeId);
    if (upgradeIndex === -1) return;
    
    const upgrade = upgrades[upgradeIndex];
    
    if (score < upgrade.cost) {
      toast({
        title: "Not enough points",
        description: `You need ${upgrade.cost - score} more points`,
        variant: "destructive"
      });
      return;
    }
    
    // Apply the upgrade
    setScore(prev => prev - upgrade.cost);
    
    // Update the upgrade
    const newUpgrades = [...upgrades];
    newUpgrades[upgradeIndex] = {
      ...upgrade,
      owned: upgrade.owned + 1,
      cost: Math.round(upgrade.cost * 1.5), // Increase the cost for next purchase
    };
    setUpgrades(newUpgrades);
    
    // Apply effects
    if (upgradeId === "click_power" || upgradeId === "super_clicker") {
      setClickPower(prev => prev + upgrade.effect);
    } else if (upgradeId === "auto_clicker") {
      setAutoClickPower(prev => prev + upgrade.effect);
    }
    
    toast({
      title: "Upgrade Purchased",
      description: `You bought ${upgrade.name}`,
      variant: "default"
    });
  };
  
  // Submit score mutation
  const submitScoreMutation = useMutation({
    mutationFn: async (data: { score: number, timeSpent: number }) => {
      const res = await apiRequest("POST", "/api/games/clicker-quest/score", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Score submitted!",
        description: `You earned ${data.coinsEarned} coins`,
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/clicker-quest/leaderboard"] });
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  });
  
  // Submit the score
  const submitScore = () => {
    setIsSubmitting(true);
    submitScoreMutation.mutate({
      score: score,
      timeSpent: timeElapsed
    });
  };
  
  // Restart the game
  const restartGame = () => {
    setScore(0);
    setClickPower(1);
    setAutoClickPower(0);
    setTimeElapsed(0);
    setGameCompleted(false);
    setClickCount(0);
    setLevel(1);
    setNextLevelThreshold(100);
    setUpgrades([
      {
        id: "click_power",
        name: "Better Clicker",
        description: "Increase points per click",
        cost: 10,
        effect: 1,
        owned: 0
      },
      {
        id: "auto_clicker",
        name: "Auto Clicker",
        description: "Automatically click every second",
        cost: 25,
        effect: 1,
        owned: 0
      },
      {
        id: "super_clicker",
        name: "Super Clicker",
        description: "Significantly increases points per click",
        cost: 100,
        effect: 5,
        owned: 0
      }
    ]);
  };
  
  return (
    <div className="p-2">
      {/* Game Header */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center">
            <Coins className="h-5 w-5 mr-2 text-amber-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
              <p className="font-bold text-xl">{Math.floor(score)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Time</p>
              <p className="font-bold text-xl">{elapsedFormatted}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Level</p>
              <p className="font-bold text-xl">{level}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Level Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-1">
          <span>Level Progress</span>
          <span>Level {level}</span>
        </div>
        <Progress value={calculateLevelProgress()} />
      </div>
      
      {/* Main Clicker */}
      <div className="flex justify-center mb-6">
        <button 
          className="w-32 h-32 rounded-full bg-primary-100 dark:bg-primary-900/50 hover:bg-primary-200 dark:hover:bg-primary-800/60 flex flex-col items-center justify-center transform transition-transform active:scale-95 active:bg-primary-300 dark:active:bg-primary-700/70 border-4 border-primary-300 dark:border-primary-700"
          onClick={handleClick}
          disabled={gameCompleted}
        >
          <MousePointer className="h-8 w-8 mb-2 text-primary-600 dark:text-primary-400" />
          <span className="font-bold text-primary-800 dark:text-primary-300">CLICK</span>
          <span className="text-xs text-primary-600 dark:text-primary-400">+{clickPower} points</span>
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Click Power</p>
            <div className="flex items-center mt-1">
              <MousePointer className="h-4 w-4 mr-1 text-primary-500" />
              <p className="font-bold">{clickPower} per click</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Auto Click</p>
            <div className="flex items-center mt-1">
              <ArrowUp className="h-4 w-4 mr-1 text-green-500" />
              <p className="font-bold">{autoClickPower} per second</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Upgrades */}
      <h3 className="font-semibold mb-3">Upgrades</h3>
      <div className="grid grid-cols-1 gap-3 mb-6">
        {upgrades.map(upgrade => (
          <Card key={upgrade.id} className={score >= upgrade.cost ? "" : "opacity-75"}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center">
                    <p className="font-medium">{upgrade.name}</p>
                    {upgrade.owned > 0 && (
                      <Badge variant="outline" className="ml-2">
                        Lvl {upgrade.owned}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {upgrade.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={score >= upgrade.cost ? "default" : "outline"}
                  onClick={() => buyUpgrade(upgrade.id)}
                  disabled={score < upgrade.cost || gameCompleted}
                >
                  <Coins className="h-4 w-4 mr-1" />
                  {upgrade.cost}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Game Completed UI */}
      {gameCompleted && (
        <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
          <AlertDescription className="flex flex-col items-center py-2">
            <h3 className="text-lg font-bold mb-2">Game Completed!</h3>
            <div className="grid grid-cols-2 gap-4 w-full mb-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Final Score</p>
                <p className="font-bold text-lg">{Math.floor(score)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Clicks</p>
                <p className="font-bold text-lg">{clickCount}</p>
              </div>
            </div>
            
            <Separator className="mb-3" />
            
            {!isSubmitting ? (
              <div className="flex gap-3">
                <Button variant="outline" onClick={restartGame}>
                  Play Again
                </Button>
                <Button onClick={submitScore}>
                  Submit Score
                </Button>
              </div>
            ) : (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Score...
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Bottom Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Exit Game
        </Button>
        {!gameCompleted && (
          <Button variant="outline" onClick={restartGame}>
            Restart
          </Button>
        )}
      </div>
    </div>
  );
}
