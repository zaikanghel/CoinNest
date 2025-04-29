import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useShepherd } from "react-shepherd";
import { useLocation } from "wouter";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";
import "shepherd.js/dist/css/shepherd.css";

// Define proper types for the Shepherd tour
interface ShepherdTourType {
  start: () => void;
  next: () => void;
  back: () => void;
  cancel: () => void;
  complete: () => void;
  isActive: boolean;
  addSteps: (steps: any[]) => void;
}

type TourContextType = {
  startTour: () => void;
  endTour: () => void;
  isActive: boolean;
};

export const TourContext = createContext<TourContextType | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const shepherd = useShepherd() as unknown as ShepherdTourType;

  useEffect(() => {
    // Check if this is the user's first visit after registration
    const checkFirstVisit = async () => {
      if (user && location === "/dashboard") {
        try {
          const res = await fetch("/api/user/onboarding-status", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setIsFirstVisit(!data.completedOnboarding);
            
            // Automatically start the tour for first-time visitors to the dashboard
            if (!data.completedOnboarding) {
              setupTour();
              shepherd.start();
            }
          }
        } catch (error) {
          console.error("Failed to check onboarding status:", error);
        }
      }
    };

    checkFirstVisit();
  }, [user, location, shepherd]);

  const setupTour = () => {
    // Define tour steps based on the current location
    if (location === "/dashboard") {
      shepherd.addSteps([
        {
          id: "welcome",
          text: `<div>
            <h3 class="text-lg font-bold mb-2">Welcome to CoinNest!</h3>
            <p class="mb-2">Let's take a quick tour to help you get started.</p>
          </div>`,
          attachTo: {
            element: ".dashboard-welcome",
            on: "bottom"
          },
          buttons: [
            {
              text: "Skip Tour",
              action: shepherd.cancel,
              classes: "shepherd-button-secondary"
            },
            {
              text: "Next",
              action: shepherd.next
            }
          ],
          highlightClass: "highlight"
        },
        {
          id: "balance",
          text: `<div>
            <h3 class="text-lg font-bold mb-2">Your Balance</h3>
            <p class="mb-2">This shows your current balance. Earn more by completing tasks and playing games.</p>
          </div>`,
          attachTo: {
            element: ".balance-card",
            on: "bottom"
          },
          buttons: [
            {
              text: "Back",
              action: shepherd.back
            },
            {
              text: "Next",
              action: shepherd.next
            }
          ]
        },
        {
          id: "afk-earning",
          text: `<div>
            <h3 class="text-lg font-bold mb-2">AFK Earning</h3>
            <p class="mb-2">Earn coins passively just by keeping the site open!</p>
          </div>`,
          attachTo: {
            element: ".afk-card",
            on: "bottom"
          },
          buttons: [
            {
              text: "Back",
              action: shepherd.back
            },
            {
              text: "Next",
              action: shepherd.next
            }
          ]
        },
        {
          id: "sidebar",
          text: `<div>
            <h3 class="text-lg font-bold mb-2">Navigation</h3>
            <p class="mb-2">Use the sidebar to access all features of CoinNest.</p>
          </div>`,
          attachTo: {
            element: ".sidebar",
            on: "right"
          },
          buttons: [
            {
              text: "Back",
              action: shepherd.back
            },
            {
              text: "Next",
              action: shepherd.next
            }
          ]
        },
        {
          id: "games",
          text: `<div>
            <h3 class="text-lg font-bold mb-2">Games</h3>
            <p class="mb-2">Play games to earn more coins. Each game has different rewards!</p>
          </div>`,
          attachTo: {
            element: ".games-list",
            on: "top"
          },
          buttons: [
            {
              text: "Back",
              action: shepherd.back
            },
            {
              text: "Next",
              action: shepherd.next
            }
          ]
        },
        {
          id: "activities",
          text: `<div>
            <h3 class="text-lg font-bold mb-2">Recent Activity</h3>
            <p class="mb-2">View your recent earnings and activities here.</p>
          </div>`,
          attachTo: {
            element: ".activity-list",
            on: "top"
          },
          buttons: [
            {
              text: "Back",
              action: shepherd.back
            },
            {
              text: "Finish",
              action: async () => {
                await markOnboardingComplete();
                shepherd.complete();
              }
            }
          ]
        }
      ]);
    }
  };

  const markOnboardingComplete = async () => {
    if (user) {
      try {
        await apiRequest("POST", "/api/user/onboarding-complete", {});
        setIsFirstVisit(false);
      } catch (error) {
        console.error("Failed to mark onboarding as complete:", error);
      }
    }
  };

  const startTour = () => {
    setupTour();
    shepherd.start();
  };

  const endTour = () => {
    shepherd.cancel();
  };

  return (
    <TourContext.Provider value={{ startTour, endTour, isActive: shepherd.isActive }}>
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
