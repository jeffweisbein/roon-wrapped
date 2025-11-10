"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Compass, BarChart3, Loader2 } from "lucide-react";
import { Progress } from "./ui/progress";

interface DiscoveryStats {
  diversityScore: number;
  discoveryRatio: number;
  uniqueArtists: number;
  totalTracks: number;
  topGenres: Array<{ genre: string; count: number }>;
}

export default function DiscoveryInsightsWidget() {
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoveryStats();
  }, []);

  const fetchDiscoveryStats = async () => {
    try {
      const response = await fetch("/api/recommendations/discovery-stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch discovery stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDiversityLabel = (score: number) => {
    if (score >= 0.7) return "Highly Diverse";
    if (score >= 0.5) return "Moderately Diverse";
    if (score >= 0.3) return "Focused";
    return "Very Focused";
  };

  const getDiversityColor = (score: number) => {
    if (score >= 0.7) return "text-green-500";
    if (score >= 0.5) return "text-blue-500";
    if (score >= 0.3) return "text-yellow-500";
    return "text-orange-500";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Discovery insights will appear after analyzing your listening
            history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="w-5 h-5" />
          Discovery Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Musical Diversity</span>
            <span
              className={`text-sm font-bold ${getDiversityColor(stats.diversityScore)}`}
            >
              {getDiversityLabel(stats.diversityScore)}
            </span>
          </div>
          <Progress value={stats.diversityScore * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.uniqueArtists} unique artists in {stats.totalTracks} plays
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Discovery vs Familiar</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(stats.discoveryRatio * 100)}% new
            </span>
          </div>
          <div className="flex gap-1 h-6">
            <div
              className="bg-primary rounded-l"
              style={{ width: `${(1 - stats.discoveryRatio) * 100}%` }}
            />
            <div
              className="bg-green-500 rounded-r"
              style={{ width: `${stats.discoveryRatio * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Familiar</span>
            <span>Discovery</span>
          </div>
        </div>

        {stats.topGenres && stats.topGenres.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Top Genres
            </h4>
            <div className="space-y-1">
              {stats.topGenres.slice(0, 3).map((genre, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground capitalize">
                    {genre.genre}
                  </span>
                  <span className="text-sm font-medium">{genre.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            AI learns from your listening patterns to improve recommendations
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
