import { createContext, ReactNode, useState, useEffect, useContext, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  lastMouseMovement: number;
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
  const [lastMouseMovement, setLastMouseMovement] = useState(Date.now());
  
  // Anti-cheat and timer pausing
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  
  // Constants for anti-cheat
  const MOUSE_MOVEMENT_TIMEOUT = 120000; // 2 minutes
  
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
      const res = await apiRequest('POST', '/api/afk/earn', { minutes });
      return res.json();
    },
    onSuccess: (data) => {
      setDailyEarned(data.dailyEarned);
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
      setCaptchaNeeded(false);
      setLastCaptchaTime(Date.now());
      toast({
        title: "Verification successful",
        description: "You can continue earning coins.",
        variant: "default"
      });
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
    
    if (isAfkActive && !captchaNeeded) {
      interval = setInterval(() => {
        const now = Date.now();
        
        // Check for active conditions (tab active + recent mouse movement)
        const timeSinceLastMovement = now - lastMouseMovement;
        const isUserActive = timeSinceLastMovement < MOUSE_MOVEMENT_TIMEOUT;
        const shouldBePaused = !isTabActive || !isUserActive;
        
        // Check if captcha should be shown based on time
        if (captchaInterval > 0 && now - lastCaptchaTime > captchaInterval * 1000) {
          setCaptchaNeeded(true);
        }
        
        // Handle pausing and resuming
        if (shouldBePaused && !isPaused) {
          // Just entered paused state
          setIsPaused(true);
          setPauseStartTime(now);
          
          // Show appropriate warning
          if (!isTabActive) {
            toast({
              title: "Tab inactive",
              description: "AFK timer paused. Keep this tab active to earn coins",
              variant: "destructive"
            });
          } else if (!isUserActive) {
            toast({
              title: "Inactivity detected",
              description: "AFK timer paused. Move your mouse to continue earning",
              variant: "destructive"
            });
          }
        } else if (!shouldBePaused && isPaused) {
          // Just resumed from paused state
          setIsPaused(false);
          const pauseDuration = now - pauseStartTime;
          setTotalPausedTime(prev => prev + pauseDuration);
          
          toast({
            title: "Activity resumed",
            description: "AFK timer and earnings have resumed",
            variant: "default"
          });
        }
        
        // Update AFK time with pause compensation
        if (!isPaused) {
          const effectiveElapsed = Math.floor((now - afkStartTime - totalPausedTime) / 1000);
          setAfkTime(effectiveElapsed);
          
          // Only submit earnings if active and it's time
          if (now - lastEarningSubmit >= 60000) {
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
  }, [isAfkActive, captchaNeeded, afkStartTime, lastCaptchaTime, lastEarningSubmit, captchaInterval, isTabActive, lastMouseMovement]);

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
      
      // Submit final earnings if needed
      const now = Date.now();
      const minutesElapsed = (now - lastEarningSubmit) / 60000;
      if (minutesElapsed > 0.2) { // Only submit if more than 12 seconds have passed
        earnMutation.mutate(minutesElapsed);
      }
    }
  };

  // Function to verify captcha
  const verifyCaptcha = (answer: string, expected: string) => {
    captchaMutation.mutate({ answer, expected });
  };

  // Tab visibility change detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsTabActive(isVisible);
      
      // If the tab becomes inactive, trigger a warning
      if (!isVisible && isAfkActive) {
        toast({
          title: "Tab inactive",
          description: "AFK earnings will be paused until you return to this tab",
          variant: "destructive"
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAfkActive]);
  
  // Mouse movement detection
  useEffect(() => {
    const handleMouseMove = () => {
      setLastMouseMovement(Date.now());
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Check for mouse inactivity
  useEffect(() => {
    let inactivityCheck: NodeJS.Timeout;
    
    if (isAfkActive && !captchaNeeded) {
      inactivityCheck = setInterval(() => {
        const now = Date.now();
        const timeSinceLastMovement = now - lastMouseMovement;
        
        // If mouse hasn't moved for the timeout period, prompt captcha
        if (timeSinceLastMovement > MOUSE_MOVEMENT_TIMEOUT) {
          setCaptchaNeeded(true);
          toast({
            title: "Mouse inactivity detected",
            description: "Please verify you're still active",
            variant: "destructive"
          });
        }
      }, 30000); // Check every 30 seconds
    }
    
    return () => {
      if (inactivityCheck) clearInterval(inactivityCheck);
    };
  }, [isAfkActive, captchaNeeded, lastMouseMovement]);
  
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
        lastMouseMovement,
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
