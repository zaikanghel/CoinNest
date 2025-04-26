import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Clock, Award } from "lucide-react";

const CARD_SYMBOLS = ['🍎', '🍌', '🍒', '🍓', '🍇', '🍊', '🍋', '🥝', '🍍', '🥥', '🍉', '🍑'];

type MemoryCard = {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
};

type MemoryGameProps = {
  onClose: () => void;
};

export default function MemoryGame({ onClose }: MemoryGameProps) {
  const { toast } = useToast();
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCount, setFlippedCount] = useState(0);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the game
  const initializeGame = useCallback(() => {
    // Create a deck of cards with pairs
    const symbols = [...CARD_SYMBOLS.slice(0, 8)]; // Use 8 unique symbols
    const deck = [...symbols, ...symbols]; // Create pairs
    
    // Shuffle the deck
    const shuffledDeck = deck
      .map(symbol => ({ symbol, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(item => item.symbol);
    
    // Create card objects
    const newCards = shuffledDeck.map((symbol, index) => ({
      id: index,
      symbol,
      flipped: false,
      matched: false
    }));
    
    setCards(newCards);
    setFlippedCount(0);
    setFlippedIndexes([]);
    setMatchedPairs(0);
    setMoves(0);
    setTimeElapsed(0);
    setScore(0);
    setGameCompleted(false);
  }, []);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Handle timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameStarted && !gameCompleted) {
      timer = setInterval(() => {
        setTimeElapsed(prevTime => prevTime + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStarted, gameCompleted]);

  // Check for game completion
  useEffect(() => {
    if (matchedPairs === 8) { // 8 pairs total
      setGameCompleted(true);
      
      // Calculate score: base 1000 points - 10 points per move - 5 points per second
      const timeDeduction = Math.min(500, timeElapsed * 5);
      const moveDeduction = Math.min(500, moves * 10);
      const calculatedScore = Math.max(100, 1000 - moveDeduction - timeDeduction);
      
      setScore(calculatedScore);
    }
  }, [matchedPairs, timeElapsed, moves]);

  // Flip back unmatched cards after a delay
  useEffect(() => {
    if (flippedCount === 2) {
      const timer = setTimeout(() => {
        flipBackUnmatched();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [flippedCount]);

  // Submit score mutation
  const submitScoreMutation = useMutation({
    mutationFn: async (data: { score: number, timeSpent: number }) => {
      const res = await apiRequest("POST", "/api/games/memory-match/score", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Score submitted!",
        description: `You earned ${data.coinsEarned} coins`,
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/memory-match/leaderboard"] });
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  });

  // Submit the score
  const submitScore = () => {
    setIsSubmitting(true);
    submitScoreMutation.mutate({
      score,
      timeSpent: timeElapsed
    });
  };

  // Handle card flip
  const flipCard = (index: number) => {
    // Don't allow flipping if two cards are already flipped and waiting
    if (flippedCount === 2) return;
    
    // Don't allow flipping cards that are already flipped or matched
    if (cards[index].flipped || cards[index].matched) return;
    
    // Start the game on first flip
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    // Flip the card
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    
    // Add to flipped indexes
    const newFlippedIndexes = [...flippedIndexes, index];
    setFlippedIndexes(newFlippedIndexes);
    setFlippedCount(newFlippedIndexes.length);
    
    // If two cards are flipped, check for a match
    if (newFlippedIndexes.length === 2) {
      const [firstIndex, secondIndex] = newFlippedIndexes;
      if (cards[firstIndex].symbol === cards[secondIndex].symbol) {
        // Match found
        newCards[firstIndex].matched = true;
        newCards[secondIndex].matched = true;
        setCards(newCards);
        setMatchedPairs(prev => prev + 1);
      }
      
      // Count the move
      setMoves(prev => prev + 1);
      
      // Reset flipped indexes
      setFlippedIndexes([]);
    }
  };

  // Flip back unmatched cards
  const flipBackUnmatched = () => {
    const newCards = [...cards];
    
    cards.forEach((card, index) => {
      if (card.flipped && !card.matched) {
        newCards[index].flipped = false;
      }
    });
    
    setCards(newCards);
    setFlippedCount(0);
  };

  // Restart the game
  const restartGame = () => {
    initializeGame();
    setGameStarted(false);
  };

  return (
    <div className="p-2">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          <span className="font-medium">Time: {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s</span>
        </div>
        <div className="flex items-center">
          <Award className="h-5 w-5 mr-2" />
          <span className="font-medium">Moves: {moves}</span>
        </div>
      </div>
      
      {/* Game Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-1">
          <span>Progress</span>
          <span>{matchedPairs}/8 pairs</span>
        </div>
        <Progress value={(matchedPairs / 8) * 100} />
      </div>
      
      {/* Card Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {cards.map((card, index) => (
          <button
            key={card.id}
            className={`aspect-square rounded-lg text-3xl flex items-center justify-center transition-all transform 
              ${card.flipped || card.matched ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-800'}
              ${card.matched ? 'ring-2 ring-green-500' : ''}
              ${!card.flipped && !card.matched ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : ''}
            `}
            onClick={() => flipCard(index)}
            disabled={card.flipped || card.matched || gameCompleted}
          >
            {card.flipped || card.matched ? card.symbol : '?'}
          </button>
        ))}
      </div>
      
      {/* Game Completed UI */}
      {gameCompleted && (
        <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
          <AlertDescription className="flex flex-col items-center py-2">
            <h3 className="text-lg font-bold mb-2">Game Completed!</h3>
            <p className="mb-1">
              <strong>Time:</strong> {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s
            </p>
            <p className="mb-1">
              <strong>Moves:</strong> {moves}
            </p>
            <p className="mb-3">
              <strong>Score:</strong> {score} points
            </p>
            {!isSubmitting ? (
              <div className="flex gap-3">
                <Button variant="outline" onClick={restartGame}>
                  Play Again
                </Button>
                <Button onClick={submitScore}>
                  Submit Score
                </Button>
              </div>
            ) : (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Score...
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Game Instructions */}
      {!gameStarted && !gameCompleted && (
        <Alert className="mb-6">
          <AlertDescription>
            <h3 className="font-medium mb-2">How to Play:</h3>
            <p className="text-sm mb-2">
              Flip cards to find matching pairs. Remember the positions as you play.
              Find all pairs in the fewest moves and shortest time to earn more coins!
            </p>
            <p className="text-sm font-medium">
              Click any card to start the game!
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Bottom Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Exit Game
        </Button>
        {gameStarted && !gameCompleted && (
          <Button variant="outline" onClick={restartGame}>
            Restart
          </Button>
        )}
      </div>
    </div>
  );
}
