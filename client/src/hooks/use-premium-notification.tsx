import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Crown, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type PremiumNotificationContextType = {
  showExpiredDialog: () => void;
};

const PremiumNotificationContext = createContext<PremiumNotificationContextType | null>(null);

export function PremiumNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("Premium Subscription Ended");
  const [dialogMessage, setDialogMessage] = useState("Your premium benefits are no longer active.");
  const [lastPremiumStatus, setLastPremiumStatus] = useState<boolean | null>(null);
  const [isPremiumActivated, setIsPremiumActivated] = useState(false);
  const [hasProcessedInitialStatus, setHasProcessedInitialStatus] = useState(false);
  const { toast } = useToast();

  // Check premium status periodically if user is logged in
  const { data: premiumStatus } = useQuery({
    queryKey: ["/api/premium/status"],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiRequest("GET", "/api/premium/status");
      return res.json();
    },
    enabled: !!user, // Only run query if user is logged in
    refetchInterval: 15000, // Check every 15 seconds
  });

  // Initial login detection
  useEffect(() => {
    if (user && !hasProcessedInitialStatus) {
      console.log("Initial premium status check:", user.isPremium);
      setLastPremiumStatus(!!user.isPremium);
      setHasProcessedInitialStatus(true);
    }
  }, [user, hasProcessedInitialStatus]);

  // Track direct premium status changes from the user object
  useEffect(() => {
    if (!user || !hasProcessedInitialStatus) return;
    
    const currentStatus = !!user.isPremium;
    
    // If premium status changed from false to true (activated)
    if (lastPremiumStatus === false && currentStatus === true) {
      console.log("Premium activated: false → true");
      
      // Show toast notification for premium activation
      toast({
        title: "Premium Activated",
        description: "Your premium subscription is now active. Enjoy your benefits!",
        variant: "default",
        className: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0",
      });
      
      setIsPremiumActivated(true);
    }
    
    // If premium status changed from true to false (deactivated)
    if (lastPremiumStatus === true && currentStatus === false) {
      console.log("Premium deactivated: true → false");
      
      // Show popup for premium deactivation
      setDialogTitle("Premium Subscription Ended");
      setDialogMessage("Your premium subscription has been deactivated. Resubscribe to continue enjoying premium benefits!");
      setShowDialog(true);
    }
    
    // Update last known status
    if (lastPremiumStatus !== currentStatus) {
      setLastPremiumStatus(currentStatus);
    }
  }, [user?.isPremium, lastPremiumStatus, hasProcessedInitialStatus, toast]);

  // Premium status updates from API
  useEffect(() => {
    if (!premiumStatus || !user) return;
    
    console.log("Premium status update from API:", premiumStatus);
    
    // Check if premium status changed (either from server check or direct user object change)
    if (premiumStatus.statusChanged || 
        premiumStatus.premiumJustExpired || 
        premiumStatus.premiumJustRevoked || 
        premiumStatus.wasExpired) {
      
      console.log("Premium status change detected:", { 
        statusChanged: premiumStatus.statusChanged,
        premiumJustExpired: premiumStatus.premiumJustExpired,
        premiumJustRevoked: premiumStatus.premiumJustRevoked, 
        wasExpired: premiumStatus.wasExpired 
      });
      
      // Only show popup if user is not premium and we haven't already shown it for this event
      if (!user.isPremium && (lastPremiumStatus === true || lastPremiumStatus === null)) {
        if (premiumStatus.premiumJustRevoked) {
          // Premium was revoked by admin
          setDialogTitle("Premium Subscription Revoked");
          setDialogMessage("Your premium subscription has been deactivated by an administrator. Please contact support if you believe this is an error.");
        } else {
          // Premium naturally expired
          setDialogTitle("Premium Subscription Expired");
          setDialogMessage("Your premium subscription has expired. Renew now to continue enjoying premium benefits!");
        }
        
        // Show the dialog
        setShowDialog(true);
        console.log("Showing premium expiration dialog");
        
        // Store that we've shown the notification
        setLastPremiumStatus(false);
      }
    }
  }, [premiumStatus, user, lastPremiumStatus]);

  // Expose a function to show the dialog manually
  const showExpiredDialog = () => {
    setShowDialog(true);
  };

  // Handle dialog close
  const handleClose = () => {
    setShowDialog(false);
  };

  // Handle redirect to premium page
  const handleUpgrade = () => {
    navigate("/premium");
    setShowDialog(false);
  };

  return (
    <PremiumNotificationContext.Provider value={{ showExpiredDialog }}>
      {children}

      {/* Premium Expired Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mx-auto mb-2">
              <Crown className="h-8 w-8 text-yellow-500" />
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <DialogTitle className="text-xl">{dialogTitle}</DialogTitle>
            </div>
            <DialogDescription className="text-center">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Premium Benefits You're Missing:</h3>
              <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300/80">
                <li className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  2x AFK earnings rate
                </li>
                <li className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Increased daily earnings limit
                </li>
                <li className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Special premium badge
                </li>
                <li className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Ad-free experience
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="w-full sm:w-auto"
            >
              Not Now
            </Button>
            <Button 
              onClick={handleUpgrade} 
              className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
            >
              Renew Premium
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PremiumNotificationContext.Provider>
  );
}

export function usePremiumNotification() {
  const context = useContext(PremiumNotificationContext);
  if (!context) {
    throw new Error("usePremiumNotification must be used within a PremiumNotificationProvider");
  }
  return context;
}