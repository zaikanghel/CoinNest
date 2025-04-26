import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Play, Pause, Volume2, VolumeX } from "lucide-react";

// Mock video ad data - in a real app, these would come from an ad network
const mockVideoAds = [
  {
    id: 1,
    title: "Premium Membership",
    description: "Double your earnings with premium access",
    thumbnailBg: "bg-gradient-to-r from-blue-500 to-indigo-600",
    // In a real application, these would be actual video URLs
    videoPlaceholder: "premium-membership-ad"
  },
  {
    id: 2,
    title: "Weekend Tournament",
    description: "Join now and win exclusive rewards",
    thumbnailBg: "bg-gradient-to-r from-purple-500 to-pink-600",
    videoPlaceholder: "weekend-tournament-ad"
  }
];

interface VideoAdProps {
  className?: string;
  onComplete?: () => void;
  duration?: number; // in seconds
}

export default function VideoAd({ className = "", onComplete, duration = 15 }: VideoAdProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showAd, setShowAd] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentAd = mockVideoAds[currentAdIndex];

  // Start the ad timer when component mounts
  useEffect(() => {
    if (showAd && isPlaying) {
      // Update progress bar
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / (duration * 10));
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 100);

      // End the ad after duration
      timerRef.current = setTimeout(() => {
        handleAdComplete();
      }, duration * 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [showAd, isPlaying, duration]);

  // Handle ad completion
  const handleAdComplete = () => {
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    // Move to next ad or complete
    const nextIndex = currentAdIndex + 1;
    if (nextIndex < mockVideoAds.length) {
      setCurrentAdIndex(nextIndex);
      setProgress(0);
      
      // Restart the timer for the next ad
      timerRef.current = setTimeout(() => {
        handleAdComplete();
      }, duration * 1000);
      
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / (duration * 10));
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 100);
    } else {
      // All ads completed
      setShowAd(false);
      if (onComplete) onComplete();
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    if (!isPlaying) {
      // Calculate remaining time based on progress
      const remainingTime = ((100 - progress) / 100) * duration * 1000;
      
      timerRef.current = setTimeout(() => {
        handleAdComplete();
      }, remainingTime);
      
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / (duration * 10));
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 100);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!showAd) return null;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0 relative">
        {/* Video placeholder (would be a real video in production) */}
        <div className={`w-full aspect-video flex items-center justify-center ${currentAd.thumbnailBg} relative`}>
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Ad {currentAdIndex + 1}/{mockVideoAds.length}
          </div>
          
          {/* Skip button after 5 seconds (common in video ads) */}
          {progress > 33 && (
            <button
              onClick={handleAdComplete}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white px-2 py-1 rounded-md text-xs"
            >
              Skip Ad
            </button>
          )}
          
          {/* Center logo or placeholder for video content */}
          <div className="text-white text-center">
            <h3 className="text-lg font-bold">{currentAd.title}</h3>
            <p className="text-sm">{currentAd.description}</p>
          </div>
          
          {/* Video controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 flex items-center">
            <button onClick={togglePlay} className="p-1 hover:bg-white/20 rounded-full mr-2">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            
            <button onClick={toggleMute} className="p-1 hover:bg-white/20 rounded-full mr-2">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            
            <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <span className="ml-2 text-xs">
              {Math.ceil((duration * (100 - progress)) / 100)}s
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}