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
  const [processedNotificationIds, setProcessedNotificationIds] = useState<string[]>([]);
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

  // Process premium status changes (both activations and deactivations)
  useEffect(() => {
    if (!user || !premiumStatus) return;
    
    console.log("Processing premium status:", { 
      userIsPremium: user.isPremium,
      premiumStatus
    });
    
    // Create unique identifiers for premium events to prevent duplicate notifications
    const activationId = premiumStatus.isPremium ? `activation-${user.id}-${premiumStatus.premiumUntil}` : null;
    const deactivationId = (!premiumStatus.isPremium && 
                           (premiumStatus.statusChanged || 
                            premiumStatus.premiumJustExpired || 
                            premiumStatus.premiumJustRevoked)) 
                           ? `deactivation-${user.id}-${Date.now()}` : null;
    
    // Check if we've already processed these events
    const isActivationProcessed = !activationId || processedNotificationIds.includes(activationId);
    const isDeactivationProcessed = !deactivationId || processedNotificationIds.includes(deactivationId);
    
    // Handle activation notification (premium just became active)
    if (premiumStatus.isPremium && !isActivationProcessed && activationId) {
      console.log("Premium activation detected!");
      
      // Show toast notification for premium activation
      toast({
        title: "Premium Activated", 
        description: "Your premium subscription is now active. Enjoy your benefits!",
        variant: "default",
        className: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0",
      });
      
      // Mark this activation as processed
      setProcessedNotificationIds(prev => [...prev, activationId]);
    }
    
    // Handle deactivation notification (premium was lost)
    if (!premiumStatus.isPremium && !isDeactivationProcessed && deactivationId) {
      console.log("Premium deactivation detected!", { 
        statusChanged: premiumStatus.statusChanged,
        premiumJustExpired: premiumStatus.premiumJustExpired,
        premiumJustRevoked: premiumStatus.premiumJustRevoked, 
        wasExpired: premiumStatus.wasExpired 
      });
      
      // Set up dialog content based on deactivation reason
      if (premiumStatus.premiumJustRevoked) {
        setDialogTitle("Premium Subscription Revoked");
        setDialogMessage(
          "Your premium subscription has been deactivated by an administrator. " +
          "Please contact support if you believe this is an error."
        );
      } else {
        setDialogTitle("Premium Subscription Expired");
        setDialogMessage(
          "Your premium subscription has expired. " +
          "Renew now to continue enjoying premium benefits!"
        );
      }
      
      // Show the dialog
      setShowDialog(true);
      console.log("Showing premium expiration dialog");
      
      // Mark this deactivation as processed
      setProcessedNotificationIds(prev => [...prev, deactivationId]);
    }
  }, [premiumStatus, user, toast]);

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