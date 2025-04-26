import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useToast } from "./use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AfkContextType {
  isAfkActive: boolean;
  startAfkEarning: () => void;
  stopAfkEarning: () => void;
  afkTime: number;
  afkRate: number;
  dailyLimit: number;
  dailyEarned: number;
  captchaNeeded: boolean;
  verifyCaptcha: (answer: string, expected: string) => void;
  captchaVerificationPending: boolean;
  isLoading: boolean;
  lastEarning: {
    amount: number;
    timestamp: number;
  } | null;
  isTabActive: boolean;
  isPaused: boolean;
}

export const AfkContext = createContext<AfkContextType | null>(null);

export function AfkProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isAfkActive, setIsAfkActive] = useState(false);
  const [afkTime, setAfkTime] = useState(0);
  const [afkRate, setAfkRate] = useState(2);
  const [dailyLimit, setDailyLimit] = useState(200);
  const [dailyEarned, setDailyEarned] = useState(0);
  const [captchaInterval, setCaptchaInterval] = useState(1200);
  const [lastCaptchaTime, setLastCaptchaTime] = useState(0);
  const [captchaNeeded, setCaptchaNeeded] = useState(false);
  const [lastEarningSubmit, setLastEarningSubmit] = useState(0);
  const [afkStartTime, setAfkStartTime] = useState(0);
  const [lastEarning, setLastEarning] = useState<{amount: number, timestamp: number} | null>(null);
  const [isTabActive, setIsTabActive] = useState(true);
  
  // Anti-cheat and timer pausing - only tab activity tracking
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  
  // Toast notification debounce
  const lastResumeToastRef = useRef(0);
  
  // Constants for anti-cheat
  const RESUME_TOAST_COOLDOWN = 3000; // 3 seconds cooldown between resume notifications
  
  // Start AFK session
  const { isLoading, refetch: refetchAfkSettings } = useQuery({
    queryKey: ['/api/afk/start'],
    queryFn: async () => {
      const res = await apiRequest('POST', '/api/afk/start');
      return res.json();
    },
    enabled: false,
    staleTime: Infinity
  });

  // Submit earned coins
  const earnMutation = useMutation({
    mutationFn: async (minutes: number) => {
      // Only check tab active status and pause state - strict check
      if (isPaused || !isTabActive) {
        console.log("Prevented earning during paused state");
        return { earned: 0, dailyEarned: dailyEarned, dailyLimit, captchaRequired: false };
      }
      
      // Normalize minutes to prevent exploits
      const cappedMinutes = Math.min(minutes, 1.2); // Cap at slightly more than 1 minute
      
      // Add isPaused flag to API request to ensure server-side validation
      const res = await apiRequest('POST', '/api/afk/earn', { 
        minutes: cappedMinutes,
        isTabActive: isTabActive, // Send tab state to server
        isPaused: isPaused // Send pause state to server
      });
      return res.json();
    },
    onSuccess: (data) => {
      setDailyEarned(data.dailyEarned);
      
      // Only set last earning if we actually earned something
      if (data.earned > 0) {
        setLastEarning({
          amount: data.earned,
          timestamp: Date.now()
        });
        toast({
          title: "Coins earned",
          description: `You earned ${data.earned} coins!`,
          variant: "default"
        });
        
        // Refresh user data and stats
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit earnings: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Verify captcha
  const captchaMutation = useMutation({
    mutationFn: async ({ answer, expected }: { answer: string, expected: string }) => {
      const res = await apiRequest('POST', '/api/afk/verify', { answer, expected });
      return res.json();
    },
    onSuccess: () => {
      // Reset captcha state
      setCaptchaNeeded(false);
      const now = Date.now();
      setLastCaptchaTime(now);
      
      // Resume AFK earnings after successful verification
      if (isPaused) {
        // Calculate the pause duration and add it to the total paused time
        const pauseDuration = now - pauseStartTime;
        setTotalPausedTime(prev => prev + pauseDuration);
        
        // Resume timer and earning
        setIsPaused(false);
        
        // Update the lastEarningSubmit to now so we don't immediately try to earn
        setLastEarningSubmit(now);
        
        // Show success message
        toast({
          title: "Verification successful",
          description: "AFK earnings have resumed.",
          variant: "default"
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Interval to increment AFK time and check for captcha
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAfkActive) {
      interval = setInterval(() => {
        const now = Date.now();
        
        // Consider both tab inactive and captcha needed for pausing
        const shouldBePaused = !isTabActive || captchaNeeded;
        
        // Check if captcha should be shown based on time - improved consistency
        if (!captchaNeeded && captchaInterval > 0) {
          // Calculate exact elapsed time in seconds
          const timeElapsedSinceCaptcha = (now - lastCaptchaTime) / 1000;
          
          // Show captcha only at specific intervals (every captchaInterval seconds)
          // FOR TESTING: Use 60 seconds instead of captchaInterval
          if (timeElapsedSinceCaptcha >= 60) { // Temporary change for testing
            console.log("Showing verification captcha after 60 seconds");
            setCaptchaNeeded(true);
            // Pause timer immediately when captcha appears
            setIsPaused(true);
            setPauseStartTime(now);
            
            // Only show notification if cooldown passed
            if (now - lastResumeToastRef.current > RESUME_TOAST_COOLDOWN) {
              toast({
                title: "Verification required",
                description: "Please verify that you're still active. Timer paused until verified.",
                variant: "destructive"
              });
              lastResumeToastRef.current = now;
            }
          }
        }
        
        // Handle pausing due to tab inactivity
        if (!isTabActive && !isPaused) {
          // Just entered paused state
          setIsPaused(true);
          setPauseStartTime(now);
          
          // Show tab inactive warning
          if (now - lastResumeToastRef.current > RESUME_TOAST_COOLDOWN) {
            toast({
              title: "Tab inactive",
              description: "AFK timer paused. Keep this tab active to earn coins",
              variant: "destructive"
            });
            lastResumeToastRef.current = now;
          }
        } 
        // Resume AFK when tab becomes active again (only if captcha is not needed)
        else if (isTabActive && isPaused && !captchaNeeded) {
          // Just resumed from paused state
          setIsPaused(false);
          const pauseDuration = now - pauseStartTime;
          setTotalPausedTime(prev => prev + pauseDuration);
          
          // Show resume toast with cooldown to prevent spam
          if (now - lastResumeToastRef.current > RESUME_TOAST_COOLDOWN) {
            toast({
              title: "Activity resumed",
              description: "AFK timer and earnings have resumed",
              variant: "default"
            });
            lastResumeToastRef.current = now;
          }
        }
        
        // IMPORTANT: Only update time if NOT paused - critical fix for tab inactive issue and captcha
        if (!isPaused) {
          const effectiveElapsed = Math.floor((now - afkStartTime - totalPausedTime) / 1000);
          setAfkTime(effectiveElapsed);
          
          // Only submit earnings if active and it's time AND not paused AND no captcha needed
          if (now - lastEarningSubmit >= 60000 && !captchaNeeded) {
            const minutesElapsed = (now - lastEarningSubmit) / 60000;
            earnMutation.mutate(minutesElapsed);
            setLastEarningSubmit(now);
          }
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAfkActive, captchaNeeded, afkStartTime, lastCaptchaTime, lastEarningSubmit, captchaInterval, isTabActive]);

  // Function to start AFK earning
  const startAfkEarning = async () => {
    const now = Date.now();
    setAfkStartTime(now);
    setLastEarningSubmit(now);
    setLastCaptchaTime(now);
    setAfkTime(0);
    
    try {
      const data = await refetchAfkSettings();
      if (data.data) {
        setAfkRate(data.data.afkRate);
        setDailyLimit(data.data.dailyLimit);
        setDailyEarned(data.data.dailyEarned);
        setCaptchaInterval(data.data.captchaInterval);
      }
      setIsAfkActive(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to start AFK earnings: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Function to stop AFK earning
  const stopAfkEarning = () => {
    if (isAfkActive) {
      setIsAfkActive(false);
      
      // Submit final earnings if needed and not paused
      if (!isPaused) {
        const now = Date.now();
        const minutesElapsed = (now - lastEarningSubmit) / 60000;
        if (minutesElapsed > 0.2) { // Only submit if more than 12 seconds have passed
          earnMutation.mutate(minutesElapsed);
        }
      }
    }
  };

  // Function to verify captcha
  const verifyCaptcha = (answer: string, expected: string) => {
    captchaMutation.mutate({ answer, expected });
  };

  // Tab visibility change detection - simplified
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      
      // Important: Only update if the visibility actually changed
      if (isVisible !== isTabActive) {
        setIsTabActive(isVisible);
        
        // If the tab becomes inactive, trigger a warning and pause immediately
        if (!isVisible && isAfkActive) {
          setIsPaused(true);
          setPauseStartTime(Date.now());
          
          // Immediately sync the pause state to prevent any earnings
          // This ensures consistency between dashboard and AFK page
          const now = Date.now();
          const effectiveElapsed = Math.floor((now - afkStartTime - totalPausedTime) / 1000);
          setAfkTime(effectiveElapsed); // Freeze time at current value
          
          // Only show toast if cooldown has passed
          if (now - lastResumeToastRef.current > RESUME_TOAST_COOLDOWN) {
            toast({
              title: "Tab inactive",
              description: "AFK earnings will be paused until you return to this tab",
              variant: "destructive"
            });
            lastResumeToastRef.current = now;
          }
        } 
        // When tab becomes active again
        else if (isVisible && isAfkActive && isPaused) {
          // Calculate duration of pause
          const now = Date.now();
          const pauseDuration = now - pauseStartTime;
          
          // Add pause time to total (ensures timer jumps ahead correctly)
          if (pauseDuration > 0) {
            setTotalPausedTime(prev => prev + pauseDuration);
          }
          
          // Resume AFK earning - always resume on tab focus
          setIsPaused(false);
          
          // Only show resume toast if cooldown has passed
          if (now - lastResumeToastRef.current > RESUME_TOAST_COOLDOWN) {
            toast({
              title: "Tab active",
              description: "AFK timer and earnings have resumed",
              variant: "default"
            });
            lastResumeToastRef.current = now;
          }
        }
      }
    };
    
    // Run once on component mount to ensure proper initial state
    handleVisibilityChange();
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAfkActive, isTabActive, isPaused, afkStartTime, totalPausedTime, pauseStartTime]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isAfkActive) {
        stopAfkEarning();
      }
    };
  }, []);

  return (
    <AfkContext.Provider
      value={{
        isAfkActive,
        startAfkEarning,
        stopAfkEarning,
        afkTime,
        afkRate,
        dailyLimit,
        dailyEarned,
        captchaNeeded,
        verifyCaptcha,
        captchaVerificationPending: captchaMutation.isPending,
        isLoading,
        lastEarning,
        isTabActive,
        isPaused
      }}
    >
      {children}
    </AfkContext.Provider>
  );
}

export function useAfk() {
  const context = useContext(AfkContext);
  if (!context) {
    throw new Error("useAfk must be used within an AfkProvider");
  }
  return context;
}