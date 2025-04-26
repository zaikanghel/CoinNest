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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Popular Games</h3>
        <Link href="/games">
          <a className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">
            View All Games
          </a>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayGames.map((game) => (
          <Card key={game.id} className="overflow-hidden group">
            <div className="relative">
              <img 
                src={game.imageUrl} 
                alt={game.name} 
                className="w-full h-36 object-cover" 
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity flex items-center justify-center group-hover:opacity-100 game-overlay">
                <Link href={`/games?game=${game.id}`}>
                  <Button>
                    Play Now
                  </Button>
                </Link>
              </div>
            </div>
            <CardContent className="p-4">
              <h4 className="font-medium">{game.name}</h4>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                <i className="ri-gamepad-line mr-1"></i>
                <span>{game.category} • {game.difficulty}</span>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <div className="flex items-center">
                  <i className="ri-coin-line text-amber-500 mr-1"></i>
                  <span className="text-sm font-medium">Up to {game.maxEarning}/hr</span>
                </div>
                {game.isNew && (
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-none">
                    New
                  </Badge>
                )}
                {game.isPopular && (
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-none">
                    Popular
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
