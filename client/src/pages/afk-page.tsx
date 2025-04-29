import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatTime } from "@/lib/utils";
import { useAfk, AfkProvider } from "@/hooks/use-afk";
import VerificationModal from "@/components/verification-modal";
import BannerAd from "@/components/ads/banner-ad";
import VideoAd from "@/components/ads/video-ad";
import { AlertCircle, Info } from "lucide-react";

function AfkEarningContent() {
  const {
    isAfkActive,
    startAfkEarning,
    stopAfkEarning,
    afkTime,
    afkRate,
    dailyLimit,
    dailyEarned,
    captchaNeeded,
    verifyCaptcha,
    captchaVerificationPending,
    isLoading,
    lastEarning,
    isTabActive,
    isPaused
  } = useAfk();

  const [showLastEarning, setShowLastEarning] = useState(false);
  const [showVideoAd, setShowVideoAd] = useState(false);

  // Show the last earning notification for 5 seconds
  useEffect(() => {
    if (lastEarning) {
      setShowLastEarning(true);
      const timer = setTimeout(() => {
        setShowLastEarning(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [lastEarning]);
  
  // Show video ad every 10 minutes of AFK time (600 seconds)
  useEffect(() => {
    if (isAfkActive && afkTime > 0 && afkTime % 600 === 0) {
      setShowVideoAd(true);
    }
  }, [isAfkActive, afkTime]);

  const dailyProgress = (dailyEarned / dailyLimit) * 100;
  const formattedAfkTime = formatTime(afkTime);
  const coinsPerHour = afkRate * 60;

  return (
    <div className="space-y-6">
      {/* Video Ad Modal */}
      {showVideoAd && (
        <VideoAd 
          duration={15}
          onComplete={() => setShowVideoAd(false)}
          className="mb-4"
        />
      )}
      
      {/* Banner Ad - shows when AFK is active */}
      {isAfkActive && (
        <BannerAd 
          className="mb-4" 
          rotationInterval={30000} // Rotate every 30 seconds
        />
      )}
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>AFK Earnings</CardTitle>
            {isAfkActive ? (
              isPaused ? (
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium py-1 px-3 rounded-full">
                  <span className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mr-1 inline-block"></span>
                  Paused
                </span>
              ) : (
                <span className="bg-success-500/10 text-success-500 text-xs font-medium py-1 px-2 rounded">
                  <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse mr-1 inline-block"></span>
                  Active
                </span>
              )
            ) : (
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium py-1 px-2 rounded">
                Inactive
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <div className={`w-32 h-32 rounded-full ${
              isAfkActive 
                ? isPaused
                  ? 'bg-amber-50 dark:bg-amber-900/30' 
                  : 'bg-primary-50 dark:bg-primary-900/30 afk-pulse'
                : 'bg-gray-100 dark:bg-gray-800'
            } flex items-center justify-center mb-6`}>
              <div className="text-center">
                <span className={`block text-3xl font-bold ${
                  isAfkActive 
                    ? isPaused
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  +{afkRate}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  coins/min
                </span>
              </div>
            </div>
            
            {isAfkActive && (
              <>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">AFK Time</p>
                  <p className="text-xl font-semibold">{formattedAfkTime}</p>
                </div>
                
                <div className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
                  <h4 className="text-sm font-medium mb-2">Anti-Cheat Status</h4>
                  <div className={`w-full text-center mb-2 py-1 px-2 rounded ${
                    isPaused
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' 
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    {isPaused 
                      ? 'Earning paused - Interact to resume' 
                      : 'Earning active - Keep tab open'
                    }
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center gap-1 p-2 rounded ${
                      isTabActive 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        isTabActive ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      <span className="text-xs ml-1">
                        Tab {isTabActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className={`flex items-center gap-1 p-2 rounded ${
                      !isPaused
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        !isPaused ? 'bg-green-500' : 'bg-amber-500'
                      }`}></span>
                      <span className="text-xs ml-1">
                        {!isPaused ? 'Active Earning' : 'Paused'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div className="w-full daily-limit-card">
              <div className="flex justify-between text-xs mb-1">
                <span>Daily limit</span>
                <span>{dailyEarned}/{dailyLimit}</span>
              </div>
              <Progress value={dailyProgress} className="h-2" />
            </div>
            
            {!isAfkActive ? (
              <Button 
                className="mt-6 w-full" 
                onClick={startAfkEarning}
                disabled={isLoading}
              >
                Start Earning
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="mt-6 w-full" 
                onClick={stopAfkEarning}
              >
                Stop Earning
              </Button>
            )}
            
            {showLastEarning && lastEarning && (
              <Alert className="mt-4 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <AlertDescription className="flex items-center">
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    +{lastEarning.amount} coins
                  </span>
                  <span className="ml-1 text-gray-600 dark:text-gray-400">
                    earned!
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
            <Info className="h-4 w-4 mr-2" />
            <AlertDescription>
              Keep this tab open to earn coins. Verification required every minute (during testing).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>How AFK Earning Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-primary-100 dark:bg-primary-900/50 p-2 rounded mr-3 text-primary-600 dark:text-primary-400">
                <i className="ri-time-line text-lg"></i>
              </div>
              <div>
                <h3 className="font-medium">Keep The Tab Open</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Earn {afkRate} coins per minute just by keeping this tab open and active
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded mr-3 text-blue-600 dark:text-blue-400">
                <i className="ri-user-follow-line text-lg"></i>
              </div>
              <div>
                <h3 className="font-medium">Verification Checks</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You'll need to solve simple math problems occasionally to prove you're active
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start">
              <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded mr-3 text-amber-600 dark:text-amber-400">
                <i className="ri-calendar-check-line text-lg"></i>
              </div>
              <div>
                <h3 className="font-medium">Daily Limits</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can earn up to {dailyLimit} coins per day ({Math.floor(dailyLimit / coinsPerHour)} hours of AFK time)
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start">
              <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded mr-3 text-green-600 dark:text-green-400">
                <i className="ri-vip-crown-line text-lg"></i>
              </div>
              <div>
                <h3 className="font-medium">Premium Benefits</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upgrade to premium to earn 2x AFK coins and higher daily limits
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Verification Modal */}
      {captchaNeeded && (
        <VerificationModal
          open={captchaNeeded}
          onVerify={verifyCaptcha}
          isVerifying={captchaVerificationPending}
        />
      )}
    </div>
  );
}

export default function AfkPage() {
  return (
    <MainLayout pageTitle="AFK Earning">
      <div className="afk-header">
        <AfkProvider>
          <div className="afk-content">
            <div className="afk-rate-card">
              <AfkEarningContent />
            </div>
          </div>
        </AfkProvider>
      </div>
    </MainLayout>
  );
}
