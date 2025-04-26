import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Game = {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  category: string;
  maxEarning: number;
  isNew: boolean;
  isPopular: boolean;
  imageUrl: string;
};

type GamesListProps = {
  games: Game[];
  limit?: number;
};

export default function GamesList({ games, limit = 4 }: GamesListProps) {
  // Apply limit to games
  const displayGames = limit ? games.slice(0, limit) : games;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {displayGames.map((game) => (
          <Card 
            key={game.id} 
            className="overflow-hidden group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px]"
          >
            <div className="relative">
              <img 
                src={game.imageUrl} 
                alt={game.name} 
                className="w-full h-40 object-cover" 
              />
              
              {/* Game difficulty indicator */}
              <div className="absolute top-3 left-3">
                <div className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm font-medium
                  ${game.difficulty === 'Easy' ? 'bg-green-500/70 text-white' : 
                    game.difficulty === 'Medium' ? 'bg-yellow-500/70 text-white' : 
                    'bg-red-500/70 text-white'}`
                }>
                  {game.difficulty}
                </div>
              </div>
              
              {/* Game badges */}
              <div className="absolute top-3 right-3 flex space-x-1">
                {game.isNew && (
                  <Badge className="bg-blue-500/70 text-white backdrop-blur-sm border-0">
                    New
                  </Badge>
                )}
                {game.isPopular && (
                  <Badge className="bg-purple-500/70 text-white backdrop-blur-sm border-0">
                    Hot
                  </Badge>
                )}
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity flex flex-col items-center justify-end p-4 group-hover:opacity-100">
                <Link to={`/games?game=${game.id}`}>
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 shadow-lg px-6">
                    <div className="flex items-center">
                      <i className="ri-gamepad-line mr-2"></i> Play Now
                    </div>
                  </Button>
                </Link>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg">{game.name}</h4>
                <div className="flex items-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full text-xs font-medium">
                  <i className="ri-coin-line mr-1"></i>
                  <span>{game.maxEarning}</span>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  <i className="ri-gamepad-line mr-1"></i>
                  <span>{game.category}</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 line-clamp-2">
                {game.description || "Play this exciting game to earn coins and have fun!"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
