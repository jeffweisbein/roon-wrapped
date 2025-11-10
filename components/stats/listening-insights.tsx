import { useEffect, useState } from "react";

import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDuration } from "@/src/lib/utils";
import { formatNumber } from "@/lib/utils";

interface InsightData {
  title: string;
  description: string;
  gradient: string;
  type: "stat" | "comparison" | "pattern";
  icon?: string;
}

interface GlobalComparison {
  artist: {
    name: string;
    yourPlays: number;
    globalListeners: number;
    globalPlays: number;
  };
  track?: {
    name: string;
    artist: string;
    yourPlays: number;
    globalListeners: number;
    globalPlays: number;
  };
}

interface ListeningInsightsProps {
  topArtistsByPlays: Array<{ name: string; artist: string; count: number }>;
  topAlbumsByPlays: Array<{ name: string; artist: string; count: number }>;
  topTracksByPlays: Array<{
    name: string;
    title: string;
    artist: string;
    count: number;
    genre?: string;
    year?: number;
    bpm?: number;
  }>;
  totalTracksPlayed: number;
  uniqueArtistsCount: number;
  uniqueAlbumsCount: number;
  uniqueTracksCount: number;
  totalListeningTimeSeconds: number;
  listeningPatterns: {
    timeOfDay: {
      morningPlays: number;
      afternoonPlays: number;
      eveningPlays: number;
      nightPlays: number;
    };
    dayOfWeekPlays: {
      sunday: number;
      monday: number;
      tuesday: number;
      wednesday: number;
      thursday: number;
      friday: number;
      saturday: number;
    };
  };
}

interface Horoscope {
  sign: string;
  prediction: string;
  theme: string;
}

const ZODIAC_SIGNS = [
  { name: "Aries", dates: [321, 419], traits: ["energetic", "adventurous"] },
  { name: "Taurus", dates: [420, 520], traits: ["reliable", "patient"] },
  { name: "Gemini", dates: [521, 620], traits: ["adaptable", "curious"] },
  { name: "Cancer", dates: [621, 722], traits: ["emotional", "intuitive"] },
  { name: "Leo", dates: [723, 822], traits: ["dramatic", "creative"] },
  { name: "Virgo", dates: [823, 922], traits: ["analytical", "practical"] },
  { name: "Libra", dates: [923, 1022], traits: ["harmonious", "diplomatic"] },
  { name: "Scorpio", dates: [1023, 1121], traits: ["passionate", "intense"] },
  {
    name: "Sagittarius",
    dates: [1122, 1221],
    traits: ["optimistic", "adventurous"],
  },
  {
    name: "Capricorn",
    dates: [1222, 119],
    traits: ["ambitious", "disciplined"],
  },
  { name: "Aquarius", dates: [120, 218], traits: ["original", "independent"] },
  { name: "Pisces", dates: [219, 320], traits: ["artistic", "dreamy"] },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateMusicHoroscope(
  data: ListeningInsightsProps,
): Horoscope | null {
  const topArtists = data.topArtistsByPlays.slice(0, 10);
  const topTracks = data.topTracksByPlays.slice(0, 10);
  if (!topArtists.length || !topTracks.length) return null;

  // Instead of using today's date, randomly select a zodiac sign
  const randomSignInfo =
    ZODIAC_SIGNS[Math.floor(Math.random() * ZODIAC_SIGNS.length)];
  if (!randomSignInfo) return null;

  // Get random artists and tracks for the prediction
  const randomArtist =
    topArtists[Math.floor(Math.random() * topArtists.length)];
  // Get a random track by the same artist
  const artistTracks = topTracks.filter(
    (track) => track.artist === randomArtist.name,
  );
  const randomTrack =
    artistTracks.length > 0
      ? artistTracks[Math.floor(Math.random() * artistTracks.length)]
      : topTracks[Math.floor(Math.random() * topTracks.length)];

  // Different themes for horoscopes
  const themes = [
    {
      theme: "Musical Journey",
      template: (sign: string, artist: string, trait: string) =>
        `As a ${sign}, your ${trait} nature aligns perfectly with ${artist}'s music today. The stars suggest exploring their lesser-known tracks for unexpected inspiration.`,
    },
    {
      theme: "Emotional Connection",
      template: (sign: string, track: string, artist: string) =>
        `Your ${trait} ${sign} energy resonates strongly with "${track}" by ${artist}. Let this song guide your decisions today.`,
    },
    {
      theme: "Creative Flow",
      template: (sign: string, artist: string, track: string) =>
        `The alignment of planets suggests that ${artist}'s "${track}" holds a special message for you today. Let your ${sign} intuition decode its meaning.`,
    },
    {
      theme: "Musical Transformation",
      template: (sign: string, artist: string, trait: string) =>
        `As ${sign} enters a new phase, your ${trait} connection with ${artist}'s music will reveal unexpected opportunities. Stay open to their influence.`,
    },
  ];

  const selectedTheme = themes[Math.floor(Math.random() * themes.length)];
  const trait =
    randomSignInfo.traits[
      Math.floor(Math.random() * randomSignInfo.traits.length)
    ];

  let prediction = "";
  switch (selectedTheme.theme) {
    case "Musical Journey":
      prediction = selectedTheme.template(
        randomSignInfo.name,
        randomArtist.name,
        trait,
      );
      break;
    case "Emotional Connection":
      prediction = selectedTheme.template(
        randomSignInfo.name,
        randomTrack.title,
        randomTrack.artist,
      );
      break;
    case "Creative Flow":
      prediction = selectedTheme.template(
        randomSignInfo.name,
        randomTrack.artist,
        randomTrack.title,
      );
      break;
    case "Musical Transformation":
      prediction = selectedTheme.template(
        randomSignInfo.name,
        randomArtist.name,
        trait,
      );
      break;
  }

  return {
    sign: randomSignInfo.name,
    prediction,
    theme: selectedTheme.theme,
  };
}

function generateInsights(
  data: ListeningInsightsProps,
  globalData?: GlobalComparison,
): InsightData[] {
  const allPossibleInsights: InsightData[] = [];

  // Add multiple horoscope insights (35% chance for each zodiac sign)
  const seenSigns = new Set<string>();
  for (let i = 0; i < 3; i++) {
    // Try to add up to 3 different horoscopes
    const horoscope = generateMusicHoroscope(data);
    if (horoscope && !seenSigns.has(horoscope.sign) && Math.random() < 0.35) {
      seenSigns.add(horoscope.sign);
      allPossibleInsights.push({
        title: `${horoscope.sign} Music Horoscope`,
        description: horoscope.prediction,
        gradient: "from-purple-500 via-pink-500 to-red-500",
        type: "pattern",
      });
    }
  }

  // Get top 10 artists for more variety
  const topArtists = data.topArtistsByPlays.slice(0, 10);
  if (topArtists.length > 0) {
    // Randomly select an artist for Artist Loyalty insight
    const randomArtist =
      topArtists[Math.floor(Math.random() * topArtists.length)];
    const artistLoyalty = (
      (randomArtist.count / data.totalTracksPlayed) *
      100
    ).toFixed(1);
    allPossibleInsights.push({
      title: "Artist Loyalty",
      description: `${artistLoyalty}% of your plays are from ${randomArtist.name}`,
      gradient: "from-violet-500 to-purple-500",
      type: "stat",
    });

    // Add insights for other top artists (limit to 3 random artists to avoid too many similar insights)
    const randomTopArtists = shuffleArray(topArtists).slice(0, 3);
    randomTopArtists.forEach((artist) => {
      const artistPercentage = (
        (artist.count / data.totalTracksPlayed) *
        100
      ).toFixed(1);
      allPossibleInsights.push({
        title: `${artist.name} Fan`,
        description: `You've played ${artist.name} ${formatNumber(artist.count)} times, making up ${artistPercentage}% of your total listening`,
        gradient: "from-purple-500 to-indigo-500",
        type: "stat",
      });
    });

    // Add multiple artist comparison insights
    if (topArtists.length >= 3) {
      const [artist1, artist2, artist3] = shuffleArray(topArtists).slice(0, 3);
      const ratio1 = (artist1.count / artist2.count).toFixed(1);
      const ratio2 = (artist2.count / artist3.count).toFixed(1);

      allPossibleInsights.push({
        title: "Artist Balance",
        description: `You listen to ${artist1.name} ${ratio1}x more than ${artist2.name}, who you listen to ${ratio2}x more than ${artist3.name}`,
        gradient: "from-violet-500 to-fuchsia-500",
        type: "comparison",
      });
    }
  }

  // Explorer Rating
  const explorationRate = (
    (data.uniqueTracksCount / data.totalTracksPlayed) *
    100
  ).toFixed(1);
  allPossibleInsights.push({
    title: "Explorer Rating",
    description: `${explorationRate}% of your plays are unique songs, showing your ${Number(explorationRate) > 50 ? "love for discovering new music" : "preference for familiar tunes"}`,
    gradient: "from-emerald-500 to-teal-500",
    type: "pattern",
  });

  // Time Preference
  const timeOfDay = data.listeningPatterns.timeOfDay;
  const totalDayPlays = Object.values(timeOfDay).reduce((a, b) => a + b, 0);
  const timeEntries = Object.entries(timeOfDay);
  const [preferredTime, preferredCount] = timeEntries.reduce((max, current) =>
    current[1] > max[1] ? current : max,
  );
  const preferredTimePercentage = (
    (preferredCount / totalDayPlays) *
    100
  ).toFixed(1);
  const timeMap = {
    morningPlays: "morning",
    afternoonPlays: "afternoon",
    eveningPlays: "evening",
    nightPlays: "night",
  };

  // Add time preference insights for random top artists
  if (topArtists.length > 0) {
    const randomArtistForTime =
      topArtists[Math.floor(Math.random() * topArtists.length)];
    allPossibleInsights.push({
      title: "Time Preference",
      description: `You're a ${timeMap[preferredTime as keyof typeof timeMap]} person! ${preferredTimePercentage}% of your listening happens during the ${timeMap[preferredTime as keyof typeof timeMap]}, especially ${randomArtistForTime.name}`,
      gradient: "from-orange-500 to-amber-500",
      type: "pattern",
    });
  }

  // Album Affinity
  const albumDiversity = (
    (data.uniqueAlbumsCount / data.uniqueTracksCount) *
    100
  ).toFixed(1);
  allPossibleInsights.push({
    title: "Album Affinity",
    description: `With ${albumDiversity}% album-to-track ratio, you're ${Number(albumDiversity) > 50 ? "an album enthusiast" : "more of a singles person"}`,
    gradient: "from-pink-500 to-rose-500",
    type: "comparison",
  });

  // Song Length with artist context
  const avgSongLength = Math.round(
    data.totalListeningTimeSeconds / data.totalTracksPlayed,
  );
  if (topArtists.length > 0) {
    const randomArtistForLength =
      topArtists[Math.floor(Math.random() * topArtists.length)];
    allPossibleInsights.push({
      title: "Song Length",
      description: `Your average song is ${formatDuration(avgSongLength)} long, with ${randomArtistForLength.name} being one of your favorite artists for ${avgSongLength > 240 ? "longer, more complex pieces" : "concise, punchy songs"}`,
      gradient: "from-blue-500 to-cyan-500",
      type: "stat",
    });
  }

  // Weekend Warrior with artist context
  const weekdayPlays = data.listeningPatterns.dayOfWeekPlays;
  const totalWeekPlays = Object.values(weekdayPlays).reduce((a, b) => a + b, 0);
  const weekendPlays = weekdayPlays.saturday + weekdayPlays.sunday;
  const weekendPercentage = ((weekendPlays / totalWeekPlays) * 100).toFixed(1);
  if (topArtists.length > 0) {
    const randomArtistForWeekend =
      topArtists[Math.floor(Math.random() * topArtists.length)];
    allPossibleInsights.push({
      title: "Weekend Warrior",
      description: `${weekendPercentage}% of your listening happens on weekends, with ${randomArtistForWeekend.name} being a frequent choice for your ${Number(weekendPercentage) > 30 ? "weekend sessions" : "consistent listening schedule"}`,
      gradient: "from-red-500 to-orange-500",
      type: "pattern",
    });
  }

  // Genre Analysis with artist context
  const genres = new Map<string, number>();
  data.topTracksByPlays.forEach((track) => {
    if (track.genre) {
      genres.set(track.genre, (genres.get(track.genre) || 0) + track.count);
    }
  });

  if (genres.size > 0) {
    const [topGenre, topGenreCount] = Array.from(genres.entries()).sort(
      ([, a], [, b]) => b - a,
    )[0];
    const genrePercentage = (
      (topGenreCount / data.totalTracksPlayed) *
      100
    ).toFixed(1);
    if (topArtists.length > 0) {
      const randomArtistForGenre =
        topArtists[Math.floor(Math.random() * topArtists.length)];
      allPossibleInsights.push({
        title: "Genre Affinity",
        description: `${genrePercentage}% of your plays are ${topGenre}, with artists like ${randomArtistForGenre.name} defining your taste`,
        gradient: "from-indigo-500 to-blue-500",
        type: "pattern",
      });
    }
  }

  // BPM Analysis
  const bpmTracks = data.topTracksByPlays.filter((track) => track.bpm);
  if (bpmTracks.length > 0) {
    const avgBpm = Math.round(
      bpmTracks.reduce((sum, track) => sum + (track.bpm || 0), 0) /
        bpmTracks.length,
    );
    let energyLevel = "medium-energy";
    if (avgBpm < 100) energyLevel = "chill";
    else if (avgBpm > 120) energyLevel = "high-energy";

    if (topArtists.length > 0) {
      const randomArtistForBpm =
        topArtists[Math.floor(Math.random() * topArtists.length)];
      allPossibleInsights.push({
        title: "Energy Level",
        description: `With an average tempo of ${avgBpm} BPM and frequent plays of ${randomArtistForBpm.name}, your music taste leans ${energyLevel}`,
        gradient: "from-fuchsia-500 to-pink-500",
        type: "stat",
      });
    }
  }

  // Release Year Analysis with artist context
  const yearTracks = data.topTracksByPlays.filter((track) => track.year);
  if (yearTracks.length > 0) {
    const years = yearTracks.map((track) => track.year || 0);
    const avgYear = Math.round(
      years.reduce((sum, year) => sum + year, 0) / years.length,
    );
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - avgYear;
    let eraDescription = "";
    if (yearDiff < 2) eraDescription = "current hits";
    else if (yearDiff < 5) eraDescription = "recent releases";
    else if (yearDiff < 10) eraDescription = "music from the last decade";
    else if (yearDiff < 20)
      eraDescription = "classics from the past two decades";
    else eraDescription = "timeless classics";

    if (topArtists.length > 0) {
      const randomArtistForEra =
        topArtists[Math.floor(Math.random() * topArtists.length)];
      allPossibleInsights.push({
        title: "Musical Era",
        description: `Your music centers around ${avgYear}, with ${randomArtistForEra.name} being one of your favorite artists from the ${eraDescription} era`,
        gradient: "from-emerald-500 to-green-500",
        type: "pattern",
      });
    }
  }

  // Global Comparisons
  if (globalData?.artist) {
    const { artist } = globalData;
    const playsPerListener = Math.round(
      artist.globalPlays / artist.globalListeners,
    );
    const yourPlaysRatio = artist.yourPlays / playsPerListener;
    let fanLevel = "casual listener";
    if (yourPlaysRatio > 5) fanLevel = "super fan";
    else if (yourPlaysRatio > 2) fanLevel = "dedicated fan";
    allPossibleInsights.push({
      title: "Fan Status",
      description: `You've played ${artist.name} ${formatNumber(artist.yourPlays)} times, while the average listener plays them ${formatNumber(playsPerListener)} times, making you a ${fanLevel}`,
      gradient: "from-purple-500 to-indigo-500",
      type: "comparison",
    });
  }

  if (globalData?.track) {
    const { track } = globalData;
    const playsPerListener = Math.round(
      track.globalPlays / track.globalListeners,
    );
    const yourPlaysRatio = track.yourPlays / playsPerListener;
    allPossibleInsights.push({
      title: "Song Dedication",
      description: `Your ${formatNumber(track.yourPlays)} plays of "${track.name}" is ${yourPlaysRatio > 1 ? Math.round(yourPlaysRatio) + "x more than" : "similar to"} the average listener`,
      gradient: "from-yellow-500 to-orange-500",
      type: "comparison",
    });
  }

  return shuffleArray(allPossibleInsights);
}

export function ListeningInsights(props: ListeningInsightsProps) {
  const [_globalData, setGlobalData] = useState<GlobalComparison | undefined>();
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(true);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localData, setLocalData] = useState<ListeningInsightsProps>(props);
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const fetchGlobalData = async () => {
    try {
      const topArtist = localData.topArtistsByPlays[0];
      if (!topArtist) return;

      const topTrack = localData.topTracksByPlays[0];
      const response = await fetch(
        `/api/lastfm?artist=${encodeURIComponent(topArtist.name)}${
          topTrack ? `&track=${encodeURIComponent(topTrack.title)}` : ""
        }`,
      );

      if (!response.ok) throw new Error("Failed to fetch global data");

      const data = await response.json();

      return {
        artist: {
          name: topArtist.name,
          yourPlays: topArtist.count,
          globalListeners: parseInt(data.artist?.stats?.listeners || "0"),
          globalPlays: parseInt(data.artist?.stats?.playcount || "0"),
        },
        ...(topTrack && data.track
          ? {
              track: {
                name: topTrack.title,
                artist: topTrack.artist,
                yourPlays: topTrack.count,
                globalListeners: parseInt(data.track.listeners || "0"),
                globalPlays: parseInt(data.track.playcount || "0"),
              },
            }
          : {}),
      };
    } catch (error) {
      console.error("Error fetching global data:", error);
      return undefined;
    }
  };

  const fetchFreshData = async () => {
    try {
      const response = await fetch(
        `/api/history/wrapped?period=${new URLSearchParams(window.location.search).get("period") || "all"}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Insights] Failed to fetch fresh data:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(
          `Failed to fetch fresh data: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[Insights] Error fetching fresh data:", error);
      return null;
    }
  };

  const refreshInsights = async () => {
    setIsRefreshing(true);
    try {
      // Update the refresh key to force new random selection
      setRefreshKey(Date.now());

      // Fetch fresh data and global data
      const freshData = await fetchFreshData();
      if (freshData) {
        setLocalData(freshData);
        const newGlobalData = await fetchGlobalData();
        setGlobalData(newGlobalData);

        // Get all possible insights with the fresh data
        const allInsights = generateInsights(freshData, newGlobalData);

        // Ensure we have at least one of each type in our selection
        const insightsByType = {
          stat: allInsights.filter((i) => i.type === "stat"),
          pattern: allInsights.filter((i) => i.type === "pattern"),
          comparison: allInsights.filter((i) => i.type === "comparison"),
        };

        let selectedInsights: InsightData[] = [];

        // First, select one of each type if available
        Object.values(insightsByType).forEach((typeInsights) => {
          if (typeInsights.length > 0) {
            const randomIndex = Math.floor(Math.random() * typeInsights.length);
            selectedInsights.push(typeInsights[randomIndex]);
            // Remove the selected insight from allInsights
            const index = allInsights.indexOf(typeInsights[randomIndex]);
            if (index > -1) allInsights.splice(index, 1);
          }
        });

        // Then fill the remaining slots randomly
        while (selectedInsights.length < 6 && allInsights.length > 0) {
          const randomIndex = Math.floor(Math.random() * allInsights.length);
          selectedInsights.push(allInsights[randomIndex]);
          allInsights.splice(randomIndex, 1);
        }

        // Shuffle the final selection
        setInsights(shuffleArray(selectedInsights));
      }
    } catch (error) {
      console.error("Error refreshing insights:", error);
    } finally {
      setIsRefreshing(false);
      setIsLoadingGlobal(false);
    }
  };

  useEffect(() => {
    setLocalData(props);
    refreshInsights();
  }, [props.topArtistsByPlays, props.topTracksByPlays]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Listening Insights</h2>
        <div className="flex items-center gap-4">
          {isLoadingGlobal && (
            <div className="text-sm text-zinc-400">
              Loading global comparisons...
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshInsights}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Insights
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((insight, index) => (
          <Card
            key={`${insight.title}-${index}-${refreshKey}`}
            className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm"
          >
            <div
              className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br ${insight.gradient}`}
            />

            <div className="relative p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3
                  className={`text-lg font-semibold bg-gradient-to-r ${insight.gradient} bg-clip-text text-transparent`}
                >
                  {insight.title}
                </h3>
                <Badge
                  variant="outline"
                  className={`bg-gradient-to-r ${insight.gradient} text-white border-0`}
                >
                  {insight.type}
                </Badge>
              </div>

              <p className="text-zinc-300 leading-relaxed">
                {insight.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
