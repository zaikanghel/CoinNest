import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Gift, Trophy, Calendar, Check, X } from "lucide-react";

type DailyReward = {
  id: number;
  day: number;
  reward: number;
  description: string;
  updatedAt: string;
};

type UserRewardStatus = {
  canClaim: boolean;
  nextDay: number;
  completedDays: number;
  hasCompletedWeek: boolean;
  lastClaimed: string | null;
  timeToNextClaim: number;
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function DailyRewardsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClaiming, setIsClaiming] = useState(false);

  // Get all daily rewards
  const { data: rewards, isLoading: isLoadingRewards } = useQuery({
    queryKey: ["daily-rewards"],
    queryFn: () => apiRequest<DailyReward[]>("/api/daily-rewards"),
    enabled: !!user
  });

  // Get user's daily reward status
  const { 
    data: userRewardStatus, 
    isLoading: isLoadingStatus,
    error 
  } = useQuery({
    queryKey: ["user-daily-reward"],
    queryFn: () => apiRequest<UserRewardStatus>("/api/user/daily-reward"),
    enabled: !!user,
    refetchInterval: (data) => {
      // Refresh every minute if waiting for next claim
      return data && !data.canClaim ? 60000 : false;
    }
  });

  // Claim daily reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: () => {
      setIsClaiming(true);
      return apiRequest("/api/user/daily-reward/claim", {
        method: "POST"
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Daily Reward Claimed!",
        description: data.message,
        variant: "success"
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["user-daily-reward"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      
      setIsClaiming(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error Claiming Reward",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
      setIsClaiming(false);
    }
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Daily Rewards</h1>
        <p>Please log in to view and claim your daily rewards.</p>
      </div>
    );
  }

  const isLoading = isLoadingRewards || isLoadingStatus;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="w-full md:w-2/3">
          <h1 className="text-3xl font-bold mb-6">Daily Rewards</h1>
          
          {error ? (
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-red-500">Error loading daily rewards: {(error as any).message}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Daily Reward Status
                </CardTitle>
                <CardDescription>
                  Log in every day to maintain your streak and earn rewards!
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : userRewardStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Weekly Progress:</span>
                      <span className="font-semibold">
                        {userRewardStatus.completedDays}/7 days
                      </span>
                    </div>
                    
                    <Progress 
                      value={(userRewardStatus.completedDays / 7) * 100} 
                      className="h-3"
                    />
                    
                    {userRewardStatus.hasCompletedWeek && (
                      <div className="flex items-center mt-2 text-green-500">
                        <Trophy className="w-4 h-4 mr-2" />
                        <span>You've completed a full week! Keep going for more rewards.</span>
                      </div>
                    )}
                    
                    {!userRewardStatus.canClaim && (
                      <div className="flex items-center justify-between mt-4 p-3 bg-muted rounded-md">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Next reward available in:</span>
                        </div>
                        <span className="font-semibold">
                          {formatTime(userRewardStatus.timeToNextClaim)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
              
              <CardFooter>
                <Button 
                  onClick={() => claimRewardMutation.mutate()}
                  disabled={isLoading || isClaiming || (userRewardStatus && !userRewardStatus.canClaim)}
                  className="w-full"
                >
                  {isClaiming ? (
                    <span className="flex items-center">
                      <Skeleton className="h-4 w-4 rounded-full mr-2" />
                      Claiming...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Gift className="w-4 h-4 mr-2" />
                      {userRewardStatus && !userRewardStatus.canClaim 
                        ? `Claim Again in ${formatTime(userRewardStatus.timeToNextClaim)}`
                        : "Claim Today's Reward"}
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Weekly Rewards Schedule</CardTitle>
              <CardDescription>
                See what rewards you can earn each day of the week
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isLoadingRewards ? (
                <div className="space-y-4">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {rewards?.sort((a, b) => a.day - b.day).map((reward) => {
                    const isActive = userRewardStatus?.nextDay === reward.day;
                    const isCompleted = userRewardStatus?.completedDays >= reward.day || 
                                      (userRewardStatus?.nextDay > reward.day && 
                                      userRewardStatus?.nextDay <= 7);
                    
                    return (
                      <div 
                        key={reward.id}
                        className={`flex items-center p-3 rounded-md border 
                          ${isActive ? 'border-primary bg-primary/10' : 'border-border'}
                          ${isCompleted ? 'bg-green-100 dark:bg-green-900/20' : ''}
                        `}
                      >
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full mr-4 
                          ${isActive ? 'bg-primary text-white' : 'bg-muted'}
                          ${isCompleted ? 'bg-green-500 text-white' : ''}
                        `}>
                          {isCompleted ? (
                            <Check className="w-6 h-6" />
                          ) : (
                            <span className="text-lg font-bold">Day {reward.day}</span>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold">{reward.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            {reward.reward} coins reward
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-1/3 mt-6 md:mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Daily Rewards Tips</CardTitle>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Log in daily to maintain your streak and earn consecutive rewards.</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Rewards increase each day of your streak.</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Complete a full week to earn bonus rewards!</span>
                </li>
                <li className="flex items-start">
                  <X className="w-5 h-5 mr-2 text-red-500 shrink-0 mt-0.5" />
                  <span>Missing two consecutive days will reset your streak.</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>If you were referred by another user, they'll get a bonus when you complete 7 days!</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}