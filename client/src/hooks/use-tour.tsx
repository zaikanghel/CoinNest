import { createContext, ReactNode, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";
import "shepherd.js/dist/css/shepherd.css";
import Shepherd from "shepherd.js";

type TourContextType = {
  startTour: () => void;
  endTour: () => void;
  isActive: boolean;
};

export const TourContext = createContext<TourContextType | null>(null);

// Create type for Shepherd Tour for TypeScript
declare namespace Shepherd {
  interface Tour {
    steps: any[];
    addStep(step: any): void;
    start(): void;
    next(): void;
    back(): void;
    cancel(): void;
    complete(): void;
    isActive(): boolean;
    on(event: string, handler: () => void): void;
  }
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const tourRef = useRef<Shepherd.Tour | null>(null);

  // Mark the onboarding as complete in the backend
  const markOnboardingComplete = useCallback(async () => {
    if (user) {
      try {
        await apiRequest("POST", "/api/user/onboarding-complete", {});
      } catch (error) {
        console.error("Failed to mark onboarding as complete:", error);
      }
    }
  }, [user]);

  // Initialize the tour instance
  useEffect(() => {
    if (!tourRef.current) {
      tourRef.current = new Shepherd.Tour({
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          classes: 'shadow-md rounded-md p-4',
          scrollTo: true,
          highlightClass: 'shepherd-highlight',
          modalOverlayOpeningRadius: 4
        },
        useModalOverlay: true,
        exitOnEsc: true,
        keyboardNavigation: true
      });
      
      // Set up event listeners
      tourRef.current.on('start', () => setIsActive(true));
      tourRef.current.on('complete', () => {
        setIsActive(false);
        markOnboardingComplete();
      });
      tourRef.current.on('cancel', () => setIsActive(false));
    }
    
    // Clean up the tour when component unmounts
    return () => {
      if (tourRef.current && tourRef.current.isActive()) {
        tourRef.current.cancel();
      }
    };
  }, [markOnboardingComplete]);

  // Tour start logic is now in the protected-route.tsx component
  // This avoids duplicate checks and ensures the tour starts on each protected page when needed

  // Function to configure tour steps based on current page
  const setupTourSteps = useCallback(() => {
    if (!tourRef.current) return;
    
    // Clear existing steps
    tourRef.current.steps = [];

    // Dashboard tour steps
    if (location === "/dashboard") {
      // First, log all available target elements in the DOM for debugging
      console.log("Tour targets present in DOM:", {
        dashboardWelcome: document.querySelector(".dashboard-welcome"),
        balanceCard: document.querySelector(".stats-cards"),
        afkCard: document.querySelector(".afk-card"),
        activityList: document.querySelector(".activity-list"),
        gamesHeader: document.querySelector(".games-list")
      });

      tourRef.current.addStep({
        id: "welcome",
        text: `<div>
          <h3 class="text-lg font-bold mb-2">Welcome to CoinNest!</h3>
          <p class="mb-2">Let's take a quick tour to help you get started with earning coins.</p>
        </div>`,
        attachTo: {
          element: ".dashboard-welcome",
          on: "bottom"
        },
        buttons: [
          {
            text: "Skip Tour",
            action: () => tourRef.current?.cancel(),
            classes: "shepherd-button-secondary"
          },
          {
            text: "Next",
            action: () => tourRef.current?.next()
          }
        ]
      });

      tourRef.current.addStep({
        id: "balance",
        text: `<div>
          <h3 class="text-lg font-bold mb-2">Your Balance</h3>
          <p class="mb-2">This shows your current balance. Earn more by completing tasks and playing games.</p>
          <p class="mb-2">Your balance can be withdrawn for real rewards once you reach the minimum threshold.</p>
        </div>`,
        attachTo: {
          element: ".stats-cards",  // Use a more reliable target 
          on: "bottom"
        },
        buttons: [
          {
            text: "Back",
            action: () => tourRef.current?.back()
          },
          {
            text: "Next",
            action: () => tourRef.current?.next()
          }
        ]
      });

      tourRef.current.addStep({
        id: "afk-earning",
        text: `<div>
          <h3 class="text-lg font-bold mb-2">AFK Earning</h3>
          <p class="mb-2">Earn coins passively just by keeping the site open!</p>
          <p class="mb-2">Premium members get double the AFK earning rate. Consider upgrading for more benefits.</p>
        </div>`,
        attachTo: {
          element: ".afk-card",
          on: "bottom"
        },
        buttons: [
          {
            text: "Back",
            action: () => tourRef.current?.back()
          },
          {
            text: "Next",
            action: () => tourRef.current?.next()
          }
        ]
      });

      tourRef.current.addStep({
        id: "daily-streak",
        text: `<div>
          <h3 class="text-lg font-bold mb-2">Daily Rewards</h3>
          <p class="mb-2">Visit every day to claim growing rewards. Build a streak for maximum earnings!</p>
          <p class="mb-2">If you miss a day, your streak will reset, so make sure to log in daily.</p>
        </div>`,
        attachTo: {
          element: ".daily-rewards-card",
          on: "bottom"
        },
        buttons: [
          {
            text: "Back",
            action: () => tourRef.current?.back()
          },
          {
            text: "Next",
            action: () => tourRef.current?.next()
          }
        ]
      });

      tourRef.current.addStep({
        id: "activity-list",
        text: `<div>
          <h3 class="text-lg font-bold mb-2">Recent Activity</h3>
          <p class="mb-2">View your recent earnings and activities here.</p>
          <p class="mb-2">Track your progress and see where your coins are coming from.</p>
        </div>`,
        attachTo: {
          element: ".activity-list",
          on: "top"
        },
        buttons: [
          {
            text: "Back",
            action: () => tourRef.current?.back()
          },
          {
            text: "Finish",
            action: () => tourRef.current?.complete()
          }
        ]
      });
    }
    
    // Games tour steps
    else if (location === "/games") {
      tourRef.current.addStep({
        id: "games-intro",
        text: `<div>
          <h3 class="text-lg font-bold mb-2">Welcome to Games!</h3>
          <p class="mb-2">This is where you can play games to earn coins much faster than AFK earnings.</p>
        </div>`,
        attachTo: {
          element: ".games-header",
          on: "bottom"
        },
        buttons: [
          {
            text: "Skip Tour",
            action: () => tourRef.current?.cancel(),
            classes: "shepherd-button-secondary"
          },
          {
            text: "Next",
            action: () => tourRef.current?.next()
          }
        ]
      });

      tourRef.current.addStep({
        id: "game-cards",
        text: `<div>
          <h3 class="text-lg font-bold mb-2">Available Games</h3>
          <p class="mb-2">Choose from different games, each with unique gameplay and rewards.</p>
          <p class="mb-2">Games have daily earning limits, so try them all to maximize your earnings!</p>
        </div>`,
        attachTo: {
          element: ".game-cards",
          on: "top"
        },
        buttons: [
          {
            text: "Back",
            action: () => tourRef.current?.back()
          },
          {
            text: "Finish",
            action: () => tourRef.current?.complete()
          }
        ]
      });
    }
    
    // AFK tour steps
    else if (location === "/afk") {
      tourRef.current.addStep({
        id: "afk-intro",
        text: `<div>
          <h3 class="text-lg font-bold mb-2">AFK Earning</h3>
          <p class="mb-2">This is where you earn coins just by keeping the app open.</p>
          <p class="mb-2">You don't have to actively use the site to earn - it happens automatically!</p>
        </div>`,
        attachTo: {
          element: ".afk-header",
          on: "bottom"
        },
        buttons: [
          {
            text: "Skip Tour",
            action: () => tourRef.current?.cancel(),
            classes: "shepherd-button-secondary"
          },
          {
            text: "Next",
            action: () => tourRef.current?.next()
          }
        ]
      });

      tourRef.current.addStep({
        id: "afk-rate",
        text: `<div>
          <h3 class="text-lg font-bold mb-2">Earning Rate</h3>
          <p class="mb-2">Your current earning rate is shown here. Upgrade to Premium for faster earnings!</p>
        </div>`,
        attachTo: {
          element: ".afk-rate-card",
          on: "bottom"
        },
        buttons: [
          {
            text: "Back",
            action: () => tourRef.current?.back()
          },
          {
            text: "Finish",
            action: () => tourRef.current?.complete()
          }
        ]
      });
    }
    
    // Wallet tour steps
    else if (location === "/wallet") {
      tourRef.current.addStep({
        id: "wallet-intro",
        text: `<div>
          <h3 class="text-lg font-bold mb-2">Your Wallet</h3>
          <p class="mb-2">This is where you can withdraw your hard-earned coins!</p>
        </div>`,
        attachTo: {
          element: ".wallet-header",
          on: "bottom"
        },
        buttons: [
          {
            text: "Skip Tour",
            action: () => tourRef.current?.cancel(),
            classes: "shepherd-button-secondary"
          },
          {
            text: "Next",
            action: () => tourRef.current?.next()
          }
        ]
      });

      tourRef.current.addStep({
        id: "withdrawal-form",
        text: `<div>
          <h3 class="text-lg font-bold mb-2">Withdrawal Form</h3>
          <p class="mb-2">Once you reach the minimum withdrawal threshold, you can cash out!</p>
          <p class="mb-2">Make sure to enter accurate payment details to receive your rewards.</p>
        </div>`,
        attachTo: {
          element: ".withdrawal-form",
          on: "top"
        },
        buttons: [
          {
            text: "Back",
            action: () => tourRef.current?.back()
          },
          {
            text: "Finish",
            action: () => tourRef.current?.complete()
          }
        ]
      });
    }
  }, [location]);

  // Start the tour
  const startTour = useCallback(() => {
    if (!tourRef.current) return;
    
    setupTourSteps();
    tourRef.current.start();
  }, [setupTourSteps]);

  // End the tour
  const endTour = useCallback(() => {
    if (tourRef.current && tourRef.current.isActive()) {
      tourRef.current.cancel();
    }
  }, []);
  
  // Mark onboarding as completed when tour is finished or canceled
  useEffect(() => {
    if (tourRef.current) {
      // When tour is completed
      tourRef.current.on('complete', async () => {
        console.log('Tour completed, marking onboarding as completed');
        try {
          await fetch('/api/user/onboarding-complete', {
            method: 'POST',
            credentials: 'include'
          });
        } catch (error) {
          console.error('Error marking onboarding as completed:', error);
        }
      });
      
      // When tour is canceled
      tourRef.current.on('cancel', async () => {
        console.log('Tour canceled, marking onboarding as completed');
        try {
          await fetch('/api/user/onboarding-complete', {
            method: 'POST',
            credentials: 'include'
          });
        } catch (error) {
          console.error('Error marking onboarding as completed:', error);
        }
      });
    }
  }, []);
  
  // Context value
  const contextValue = {
    startTour,
    endTour,
    isActive
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
