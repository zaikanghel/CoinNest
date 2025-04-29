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
            <p class="mb-2">Let's take a quick tour to help you get started with earning coins.</p>
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
            <p class="mb-2">Your balance can be withdrawn for real rewards once you reach the minimum threshold.</p>
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
            <p class="mb-2">Premium members get double the AFK earning rate. Consider upgrading for more benefits.</p>
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
            <p class="mb-2">Try exploring each section to discover all the ways you can earn.</p>
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
            <p class="mb-2">Try to beat your high score to climb the leaderboards.</p>
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
            <p class="mb-2">Track your progress and see where your coins are coming from.</p>
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
    } else if (location === "/games") {
      shepherd.addSteps([
        {
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
              action: shepherd.cancel,
              classes: "shepherd-button-secondary"
            },
            {
              text: "Next",
              action: shepherd.next
            }
          ]
        },
        {
          id: "games-list",
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
              action: shepherd.back
            },
            {
              text: "Next",
              action: shepherd.next
            }
          ]
        },
        {
          id: "games-leaderboard",
          text: `<div>
            <h3 class="text-lg font-bold mb-2">Game Leaderboards</h3>
            <p class="mb-2">Compete with other players and claim your spot at the top!</p>
            <p class="mb-2">Higher rankings might earn you special rewards in the future.</p>
          </div>`,
          attachTo: {
            element: ".leaderboard-section",
            on: "bottom"
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
    } else if (location === "/afk") {
      shepherd.addSteps([
        {
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
              action: shepherd.cancel,
              classes: "shepherd-button-secondary"
            },
            {
              text: "Next",
              action: shepherd.next
            }
          ]
        },
        {
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
              action: shepherd.back
            },
            {
              text: "Next",
              action: shepherd.next
            }
          ]
        },
        {
          id: "afk-limit",
          text: `<div>
            <h3 class="text-lg font-bold mb-2">Daily Limit</h3>
            <p class="mb-2">There's a cap on how much you can earn from AFK each day.</p>
            <p class="mb-2">This resets at midnight, so make sure to maximize your earnings every day!</p>
          </div>`,
          attachTo: {
            element: ".daily-limit-card",
            on: "bottom"
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
    } else if (location === "/wallet") {
      shepherd.addSteps([
        {
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
              action: shepherd.cancel,
              classes: "shepherd-button-secondary"
            },
            {
              text: "Next",
              action: shepherd.next
            }
          ]
        },
        {
          id: "balance-info",
          text: `<div>
            <h3 class="text-lg font-bold mb-2">Balance & Conversion</h3>
            <p class="mb-2">Your current balance and its real-world value is shown here.</p>
            <p class="mb-2">The conversion rate determines how your coins translate to real currency.</p>
          </div>`,
          attachTo: {
            element: ".balance-info-card",
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
              action: shepherd.back
            },
            {
              text: "Next",
              action: shepherd.next
            }
          ]
        },
        {
          id: "withdrawal-history",
          text: `<div>
            <h3 class="text-lg font-bold mb-2">Withdrawal History</h3>
            <p class="mb-2">Keep track of all your withdrawal requests here.</p>
            <p class="mb-2">Processing usually takes 1-3 business days.</p>
          </div>`,
          attachTo: {
            element: ".withdrawal-history",
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
