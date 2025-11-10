import { formatNumber } from "@/lib/utils";

interface Artist {
  name: string;
  count: number;
  image_key: string | null;
  album: string;
}

interface TopArtistsProps {
  artists: Artist[];
  limit?: number;
}

export function TopArtists({ artists, limit = 5 }: TopArtistsProps) {
  const displayArtists = artists.slice(0, limit);

  if (!displayArtists.length) {
    return <div className="text-neutral-400">No artists found</div>;
  }

  const maxCount = Math.max(...displayArtists.map((artist) => artist.count));

  return (
    <div className="space-y-4">
      {displayArtists.map((artist) => (
        <div
          key={artist.name}
          className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-lg border border-white/10 hover:border-white/20 p-4 rounded-xl transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-12 h-12">
              {artist.image_key ? (
                <img
                  src={`/api/roon/image/${artist.image_key}`}
                  alt={artist.name}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                  loading="lazy"
                  onError={(e) => {
                    // If image fails to load, show fallback icon
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.parentElement
                      ?.querySelector(".fallback-icon")
                      ?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full bg-white/10 rounded-lg flex items-center justify-center fallback-icon ${artist.image_key ? "hidden" : ""}`}
              >
                <span className="text-2xl">👤</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white group-hover:text-yellow-400 transition-colors truncate">
                {artist.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
                    style={{
                      width: `${(artist.count / maxCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-neutral-400 tabular-nums">
                  {formatNumber(artist.count)} tracks
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
