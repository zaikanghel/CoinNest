import { useAfk } from "@/hooks/use-afk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { formatTime } from "@/lib/utils";
import VerificationModal from "@/components/verification-modal";
import BannerAd from "@/components/ads/banner-ad";
import VideoAd from "@/components/ads/video-ad";
import { useState, useEffect } from "react";

export default function AfkCard() {
  const {
    isAfkActive,
    startAfkEarning,
    stopAfkEarning,
    afkTime,
    afkRate,
    baseAfkRate,
    dailyLimit,
    baseDailyLimit,
    dailyEarned,
    captchaNeeded,
    verifyCaptcha,
    captchaVerificationPending,
    isLoading,
    lastEarning,
    isTabActive,
    isPaused,
    isPremiumActive,
    premiumMultiplier,
    captchaDisabled
  } = useAfk();

  const [showVideoAd, setShowVideoAd] = useState(false);
  
  // Show video ad every 10 minutes of AFK time (600 seconds)
  useEffect(() => {
    if (isAfkActive && afkTime > 0 && afkTime % 600 === 0) {
      setShowVideoAd(true);
    }
  }, [isAfkActive, afkTime]);

  const dailyProgress = (dailyEarned / dailyLimit) * 100;
  const formattedAfkTime = formatTime(afkTime);

  return (
    <>
      {/* Video Ad Modal */}
      {showVideoAd && (
        <VideoAd 
          duration={15}
          onComplete={() => setShowVideoAd(false)}
          className="mb-4"
        />
      )}
      
      {/* Banner Ad - shows when AFK is active */}
      {isAfkActive && !showVideoAd && (
        <BannerAd 
          className="mb-4" 
          rotationInterval={30000} // Rotate every 30 seconds
        />
      )}
      
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className={`pb-8 relative ${
          isPremiumActive 
            ? "bg-gradient-to-r from-indigo-500/10 to-violet-500/10" 
            : "bg-gradient-to-r from-primary/10 to-accent/10"
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CardTitle className="text-xl font-bold">AFK Earnings</CardTitle>
              {isPremiumActive && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium flex items-center">
                  <span className="mr-0.5">★</span> PREMIUM
                </span>
              )}
            </div>
            {isAfkActive ? (
              isPaused ? (
                <span className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium py-1 px-3 rounded-full">
                  <span className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full"></span>
                  Paused
                </span>
              ) : (
                <span className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium py-1 px-3 rounded-full">
                  <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></span>
                  Active
                </span>
              )
            ) : (
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium py-1 px-3 rounded-full">
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></span>
                Inactive
              </span>
            )}
          </div>
          
          {/* Decorative elements */}
          {isPremiumActive ? (
            <>
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full"></div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-violet-500/5 dark:bg-violet-500/10 rounded-full"></div>
            </>
          ) : (
            <>
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-primary/5 dark:bg-primary/10 rounded-full"></div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-accent/5 dark:bg-accent/10 rounded-full"></div>
            </>
          )}
        </CardHeader>

        <CardContent className="pt-0 relative z-10">
          <div className="flex flex-col items-center justify-center py-5">
            <div className={`w-36 h-36 rounded-full flex items-center justify-center mb-6 
              ${isAfkActive 
                ? isPremiumActive 
                  ? 'bg-gradient-to-br from-indigo-500/10 to-violet-500/20 shadow-xl shadow-indigo-500/10' 
                  : 'bg-gradient-to-br from-primary/10 to-accent/20 shadow-xl shadow-primary/5'
                : 'bg-gray-100 dark:bg-gray-800'} 
              relative overflow-hidden`}
            >
              {/* Animated rings for active state */}
              {isAfkActive && (
                <>
                  {isPremiumActive ? (
                    <>
                      <div className="absolute inset-0 w-full h-full rounded-full border-4 border-indigo-500/20 animate-ping-slow"></div>
                      <div className="absolute inset-4 w-28 h-28 rounded-full border-2 border-violet-500/30 animate-ping-slow" style={{animationDelay: '1s'}}></div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 w-full h-full rounded-full border-4 border-primary/20 animate-ping-slow"></div>
                      <div className="absolute inset-4 w-28 h-28 rounded-full border-2 border-accent/30 animate-ping-slow" style={{animationDelay: '1s'}}></div>
                    </>
                  )}
                </>
              )}
              
              <div className="text-center z-10 bg-white/80 dark:bg-gray-800/80 rounded-xl px-3 py-2 backdrop-blur-sm">
                <span className={`block text-3xl font-bold 
                  ${isAfkActive 
                    ? isPremiumActive
                      ? 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600'
                      : 'bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent' 
                    : 'text-gray-400 dark:text-gray-500'}`}
                >
                  +{afkRate}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  coins/min
                </span>
              </div>
            </div>
            
            {isAfkActive && (
              <div className="text-center mb-5 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">AFK Time</p>
                <p className="text-xl font-bold text-primary dark:text-primary-400">{formattedAfkTime}</p>
                
                {/* Tab status indicator */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    isTabActive 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 mr-1 rounded-full ${
                      isTabActive ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {isTabActive ? 'Tab Active' : 'Tab Inactive'}
                  </span>
                </div>
                
                {lastEarning && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Last earned: <span className="text-green-500 dark:text-green-400">+{lastEarning.amount}</span> coins
                  </div>
                )}
              </div>
            )}
            
            {/* Premium status indicator */}
            {isPremiumActive && (
              <div className="w-full mb-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 mr-2">
                      <span className="text-[10px] text-white font-bold">★</span>
                    </span>
                    <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Premium Benefits</span>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-800/30 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    Active
                  </span>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-white/70 dark:bg-gray-800/30 flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Earnings Rate</span>
                    <div className="flex items-baseline">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{afkRate}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">coins/min</span>
                      <span className="ml-auto text-xs text-green-500 font-medium">{premiumMultiplier}x</span>
                    </div>
                  </div>
                  
                  <div className="p-2 rounded bg-white/70 dark:bg-gray-800/30 flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Daily Limit</span>
                    <div className="flex items-baseline">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{dailyLimit}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">coins</span>
                      <span className="ml-auto text-xs text-green-500 font-medium">+{dailyLimit - baseDailyLimit}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 p-2 rounded bg-white/70 dark:bg-gray-800/30 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Captcha Status</span>
                  </div>
                  <div className="flex items-center">
                    {captchaDisabled ? (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                        Disabled
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                        Enabled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="w-full">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">Daily Limit Progress</span>
                <span className="font-medium">{dailyEarned}/{dailyLimit}</span>
              </div>
              <Progress 
                value={dailyProgress} 
                className={`h-2 ${isAfkActive ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {Math.round(dailyProgress)}% of daily limit reached
                {isPremiumActive && (
                  <span className="ml-1 text-indigo-500 dark:text-indigo-400">
                    (Premium +{dailyLimit - baseDailyLimit} bonus)
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {!isAfkActive ? (
            <Button 
              className="w-full mt-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]" 
              onClick={startAfkEarning}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  Initializing...
                </div>
              ) : (
                <div className="flex items-center">
                  <i className="ri-play-circle-line mr-2"></i> Start Earning
                </div>
              )}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="w-full mt-2 border-primary/20 text-primary dark:border-primary-400/30 dark:text-primary-400" 
              onClick={stopAfkEarning}
            >
              <div className="flex items-center">
                <i className="ri-pause-circle-line mr-2"></i> Stop Earning
              </div>
            </Button>
          )}
          
          {isAfkActive && (
            <div className="mt-4 grid gap-2">
              <div className="text-xs font-medium">Anti-Cheat Status:</div>
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-md ${
                  isTabActive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      isTabActive ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span className="text-xs font-medium">
                      Tab {isTabActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className={`p-2 rounded-md ${
                  isTabActive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      isTabActive ? 'bg-green-500' : 'bg-amber-500'
                    }`}></span>
                    <span className="text-xs font-medium">
                      {isTabActive ? 'Tab Active' : 'Tab Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Alert className={`mt-4 p-3 rounded-lg text-sm flex items-start ${
            isPremiumActive && captchaDisabled 
              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300" 
              : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
          }`}>
            <Info className="h-4 w-4 mr-2 mt-0.5" />
            <AlertDescription>
              {isPremiumActive && captchaDisabled 
                ? "Premium benefit: Captcha verification disabled. You can earn without interruptions!"
                : "Keep this tab open to earn coins. Verification checks help prevent automated farming."
              }
            </AlertDescription>
          </Alert>
        </CardContent>

        {/* Verification Modal */}
        {captchaNeeded && (
          <VerificationModal
            open={captchaNeeded}
            onVerify={verifyCaptcha}
            isVerifying={captchaVerificationPending}
          />
        )}
      </Card>
    </>
  );
}