"use client";

interface NowPlayingTrack {
  title: string;
  artist: string;
  album: string;
  zone: string;
  length: number;
  seek_position: number;
  image_key?: string;
  playing: boolean;
}

interface NowPlayingProps {
  tracks: NowPlayingTrack[];
}

export function NowPlaying({ tracks }: NowPlayingProps) {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl">
        <p className="text-neutral-400 text-lg">Nothing playing right now</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tracks.map((track, index) => (
        <div
          key={`${track.title}-${track.zone}-${index}`}
          className="group bg-white/5 hover:bg-white/10 backdrop-blur-lg border border-white/10 hover:border-white/20 p-6 rounded-2xl transition-all"
        >
          <div className="flex items-start space-x-4">
            {track.image_key && (
              <div className="relative w-20 h-20 flex-shrink-0">
                <img
                  src={`/api/roon/image/${track.image_key}`}
                  alt={track.title}
                  className="rounded-xl object-cover w-full h-full group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-yellow-400 transition-colors">
                {track.title || "Unknown Title"}
              </h3>
              <p className="text-neutral-400 truncate">
                {track.artist || "Unknown Artist"}
              </p>
              <p className="text-neutral-500 text-sm truncate mt-1">
                {track.album || "Unknown Album"}
              </p>
              <div className="mt-3 flex items-center space-x-2">
                <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000"
                    style={{
                      width: `${(track.seek_position / track.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-neutral-500 tabular-nums">
                  {formatTime(track.seek_position)} / {formatTime(track.length)}
                </span>
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-neutral-400">
                  {track.zone}
                </span>
                {track.playing && (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                    Playing
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
