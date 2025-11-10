import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

interface Genre {
  genre: string;
  count: number;
}

interface TopGenresProps {
  genres?: Genre[];
  limit?: number;
}

export function TopGenres({ genres, limit = 25 }: TopGenresProps) {
  const genreList = Array.isArray(genres) ? genres.slice(0, limit) : [];

  return (
    <Card className="border-white/10 bg-black/20 backdrop-blur-lg">
      <CardHeader>
        <p className="text-xs text-white/60">Your favorite genres</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {genreList.map((genre, index) => (
            <div
              key={`${genre.genre}-${index}`}
              className="flex items-start gap-3 transform transition-all hover:translate-x-2"
            >
              <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/10 text-sm text-white font-mono">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-white truncate">
                  {genre.genre}
                </div>
              </div>
              <div className="flex-none text-white/60 text-xs tabular-nums">
                {formatNumber(genre.count)} tracks
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
