import { createContext, ReactNode, useContext, useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";
import "shepherd.js/dist/css/shepherd.css";
import Shepherd from 'shepherd.js';

type TourContextType = {
  startTour: () => void;
  endTour: () => void;
  isActive: boolean;
};

export const TourContext = createContext<TourContextType | null>(null);

// Tour steps for each page
const getDashboardSteps = (onComplete: () => Promise<void>) => [
  {
    id: "welcome",
    attachTo: { element: ".dashboard-welcome", on: "bottom" },
    buttons: [
      { text: "Skip", action: function() { return this.cancel(); }, classes: "shepherd-button-secondary" },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "Welcome to CoinNest!",
    text: ["Let's take a quick tour to help you get started with earning coins."],
  },
  {
    id: "balance",
    attachTo: { element: ".balance-card", on: "bottom" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "Your Balance",
    text: [
      "This shows your current balance. Earn more by completing tasks and playing games.",
      "Your balance can be withdrawn for real rewards once you reach the minimum threshold."
    ],
  },
  {
    id: "afk-earning",
    attachTo: { element: ".afk-card", on: "bottom" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "AFK Earning",
    text: [
      "Earn coins passively just by keeping the site open!",
      "Premium members get double the AFK earning rate. Consider upgrading for more benefits."
    ],
  },
  {
    id: "daily-streak",
    attachTo: { element: ".daily-rewards-card", on: "bottom" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "Daily Rewards",
    text: [
      "Visit every day to claim growing rewards. Build a streak for maximum earnings!",
      "If you miss a day, your streak will reset, so make sure to log in daily."
    ],
  },
  {
    id: "sidebar",
    attachTo: { element: ".sidebar", on: "right" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "Navigation",
    text: [
      "Use the sidebar to access all features of CoinNest.",
      "Try exploring each section to discover all the ways you can earn."
    ],
  },
  {
    id: "games-list",
    attachTo: { element: ".games-list", on: "top" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "Games",
    text: [
      "Play games to earn more coins. Each game has different rewards!",
      "Try to beat your high score to climb the leaderboards."
    ],
  },
  {
    id: "activities",
    attachTo: { element: ".activity-list", on: "top" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Finish", action: function() { onComplete(); return this.complete(); } }
    ],
    title: "Recent Activity",
    text: [
      "View your recent earnings and activities here.",
      "Track your progress and see where your coins are coming from."
    ],
  }
];

const getGamesSteps = (onComplete: () => Promise<void>) => [
  {
    id: "games-intro",
    attachTo: { element: ".games-header", on: "bottom" },
    buttons: [
      { text: "Skip", action: function() { return this.cancel(); }, classes: "shepherd-button-secondary" },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "Welcome to Games!",
    text: ["This is where you can play games to earn coins much faster than AFK earnings."]
  },
  {
    id: "games-list",
    attachTo: { element: ".game-cards", on: "top" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "Available Games",
    text: [
      "Choose from different games, each with unique gameplay and rewards.",
      "Games have daily earning limits, so try them all to maximize your earnings!"
    ]
  },
  {
    id: "games-leaderboard",
    attachTo: { element: ".leaderboard-section", on: "bottom" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Finish", action: function() { onComplete(); return this.complete(); } }
    ],
    title: "Game Leaderboards",
    text: [
      "Compete with other players and claim your spot at the top!",
      "Higher rankings might earn you special rewards in the future."
    ]
  }
];

const getAfkSteps = (onComplete: () => Promise<void>) => [
  {
    id: "afk-intro",
    attachTo: { element: ".afk-header", on: "bottom" },
    buttons: [
      { text: "Skip", action: function() { return this.cancel(); }, classes: "shepherd-button-secondary" },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "AFK Earning",
    text: [
      "This is where you earn coins just by keeping the app open.",
      "You don't have to actively use the site to earn - it happens automatically!"
    ]
  },
  {
    id: "afk-rate",
    attachTo: { element: ".afk-rate-card", on: "bottom" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "Earning Rate",
    text: ["Your current earning rate is shown here. Upgrade to Premium for faster earnings!"]
  },
  {
    id: "afk-limit",
    attachTo: { element: ".daily-limit-card", on: "bottom" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Finish", action: function() { onComplete(); return this.complete(); } }
    ],
    title: "Daily Limit",
    text: [
      "There's a cap on how much you can earn from AFK each day.",
      "This resets at midnight, so make sure to maximize your earnings every day!"
    ]
  }
];

const getWalletSteps = (onComplete: () => Promise<void>) => [
  {
    id: "wallet-intro",
    attachTo: { element: ".wallet-header", on: "bottom" },
    buttons: [
      { text: "Skip", action: function() { return this.cancel(); }, classes: "shepherd-button-secondary" },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "Your Wallet",
    text: ["This is where you can withdraw your hard-earned coins!"]
  },
  {
    id: "balance-info",
    attachTo: { element: ".balance-info-card", on: "bottom" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Next", action: function() { return this.next(); } }
    ],
    title: "Balance & Conversion",
    text: [
      "Your current balance and its real-world value is shown here.",
      "The conversion rate determines how your coins translate to real currency."
    ]
  },
  {
    id: "withdrawal-form",
    attachTo: { element: ".withdrawal-form", on: "top" },
    buttons: [
      { text: "Back", action: function() { return this.back(); } },
      { text: "Finish", action: function() { onComplete(); return this.complete(); } }
    ],
    title: "Withdrawal Form",
    text: [
      "Once you reach the minimum withdrawal threshold, you can cash out!",
      "Make sure to enter accurate payment details to receive your rewards."
    ]
  }
];

export function TourProvider({ children }: { children: ReactNode }) {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [location] = useLocation();
  const { user } = useAuth();
  
  const markOnboardingComplete = useCallback(async () => {
    if (user) {
      try {
        await apiRequest("POST", "/api/user/onboarding-complete", {});
        setIsFirstVisit(false);
      } catch (error) {
        console.error("Failed to mark onboarding as complete:", error);
      }
    }
  }, [user]);
  
  // Configure tour options
  const tourOptions = {
    defaultStepOptions: {
      classes: "shadow-md rounded-md p-4",
      scrollTo: true,
      cancelIcon: { enabled: true },
      highlightClass: "shepherd-highlight",
      modalOverlayOpeningRadius: 4
    },
    useModalOverlay: true,
    exitOnEsc: true,
    keyboardNavigation: true
  };
  
  // Get the appropriate tour steps based on current page
  const getSteps = () => {
    if (location === "/dashboard") {
      return getDashboardSteps(markOnboardingComplete);
    } else if (location === "/games") {
      return getGamesSteps(markOnboardingComplete);
    } else if (location === "/afk") {
      return getAfkSteps(markOnboardingComplete);
    } else if (location === "/wallet") {
      return getWalletSteps(markOnboardingComplete);
    }
    return [];
  };
  
  // Initialize the tour
  const tour = useShepherdTour({
    tourOptions,
    steps: getSteps(),
    useEffect
  });
  
  // Handle tour events
  useEffect(() => {
    if (tour.isActive) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [tour.isActive]);
  

  useEffect(() => {
    // Check if this is the user's first visit after registration
    const checkFirstVisit = async () => {
      if (user && ['/dashboard', '/games', '/afk', '/wallet'].includes(location)) {
        try {
          const res = await fetch("/api/user/onboarding-status", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setIsFirstVisit(!data.completedOnboarding);
            
            // Automatically start the tour for first-time visitors to the valid pages
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
    // Clear existing steps if any
    shepherd.addSteps([]);

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
              action: () => shepherd.cancel(),
              classes: "shepherd-button-secondary"
            },
            {
              text: "Next",
              action: () => shepherd.next()
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
    if (shepherd) {
      shepherd.start();
    }
  };

  const endTour = () => {
    if (shepherd) {
      shepherd.cancel();
    }
  };

  return (
    <TourContext.Provider value={{ startTour, endTour, isActive: shepherd?.isActive || false }}>
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
