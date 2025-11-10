"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Music,
  TrendingUp,
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "./ui/use-toast";

interface Recommendation {
  artist?: string;
  name?: string;
  similarity?: number;
  reason?: string;
  type?: string;
  score?: number;
  reasons?: string[];
  isFamiliar?: boolean;
  genres?: string[];
  id?: string;
}

interface FeedbackState {
  [key: string]: "liked" | "disliked" | "dismissed" | null;
}

export default function RecommendationsWidget() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"personalized" | "now-playing">(
    "personalized",
  );
  const [feedback, setFeedback] = useState<FeedbackState>({});
  const [sendingFeedback, setSendingFeedback] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const endpoint =
        activeTab === "personalized"
          ? "/api/recommendations/personalized?limit=10"
          : "/api/recommendations/now-playing";

      const response = await fetch(endpoint);
      const data = await response.json();

      if (activeTab === "personalized") {
        setRecommendations(
          (data.recommendations || []).map((rec: Recommendation, idx: number) => ({
            ...rec,
            id: rec.id || `${rec.artist || rec.name}_${idx}_${Date.now()}`,
          }))
        );
      } else {
        setRecommendations(
          (data.recommendations || []).map((rec: Recommendation, idx: number) => ({
            ...rec,
            id: rec.id || `${rec.artist || rec.name}_${idx}_${Date.now()}`,
          }))
        );
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationKey = (rec: Recommendation, index: number) => {
    return `${rec.artist || rec.name || ""}_${index}`;
  };

  const handleFeedback = async (
    rec: Recommendation,
    index: number,
    feedbackType: "liked" | "disliked" | "dismissed",
  ) => {
    const key = getRecommendationKey(rec, index);
    setSendingFeedback(key);

    try {
      // Update local state immediately for better UX
      setFeedback((prev) => ({ ...prev, [key]: feedbackType }));

      // Send feedback to backend
      await fetch("/api/recommendations/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendation: {
            artist: rec.artist || rec.name,
            genres: rec.genres || [],
            type: rec.type || "similar_artist",
            context: activeTab,
          },
          action: feedbackType,
        }),
      });

      // If liked or disliked, get a replacement recommendation
      if ((feedbackType === "liked" || feedbackType === "disliked") && activeTab === "personalized") {
        const currentArtists = recommendations.map(
          (r) => r.artist || r.name || "",
        );
        
        const replacementRes = await fetch("/api/recommendations/replacement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            excludeArtists: currentArtists,
          }),
        });

        if (replacementRes.ok) {
          const { recommendation: replacement } = await replacementRes.json();
          
          // Replace the recommendation with the new one
          setRecommendations((prev) => {
            const newRecs = [...prev];
            newRecs[index] = {
              ...replacement,
              id: `replacement_${Date.now()}_${index}`,
            };
            return newRecs;
          });
          
          // Clear the feedback state for the old key
          setFeedback((prev) => {
            const newFeedback = { ...prev };
            delete newFeedback[key];
            return newFeedback;
          });
        }
      }

      // Show success toast
      const messages = {
        liked: "👍 Great choice! Finding you something new...",
        disliked: "👎 Got it! Finding you something different...",
        dismissed: "Recommendation hidden",
      };

      toast({
        description: messages[feedbackType],
        duration: 2000,
      });
    } catch (err) {
      console.error("Failed to send feedback:", err);
      // Revert on error
      setFeedback((prev) => ({ ...prev, [key]: null }));
      toast({
        description: "Failed to save preference. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setSendingFeedback(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Recommendations
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={activeTab === "personalized" ? "default" : "outline"}
              onClick={() => setActiveTab("personalized")}
            >
              For You
            </Button>
            <Button
              size="sm"
              variant={activeTab === "now-playing" ? "default" : "outline"}
              onClick={() => setActiveTab("now-playing")}
            >
              Based on Now Playing
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-center text-muted-foreground py-8">{error}</p>
        ) : recommendations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {activeTab === "now-playing"
              ? "Play something to get recommendations"
              : "No recommendations available yet"}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recommendations.slice(0, 6).map((rec, index) => {
              const key = getRecommendationKey(rec, index);
              const currentFeedback = feedback[key];
              const isLoading = sendingFeedback === key;

              return (
                <div
                  key={rec.id || `${rec.artist || rec.name}_${index}`}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    currentFeedback === "dismissed" && "opacity-40",
                    currentFeedback === "liked" &&
                      "bg-green-500/10 border border-green-500/20",
                    currentFeedback === "disliked" &&
                      "bg-red-500/10 border border-red-500/20",
                    !currentFeedback && "bg-secondary/20 hover:bg-secondary/30",
                  )}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {rec.type === "deep_dive" ? (
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                    ) : rec.type === "similar_artist" ? (
                      <TrendingUp className="w-5 h-5 text-primary" />
                    ) : (
                      <Music className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {rec.name || rec.artist}
                    </p>
                    {rec.type === "similar_track" && rec.artist && (
                      <p className="text-sm text-muted-foreground truncate">
                        {rec.artist}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground truncate">
                      {rec.reason || rec.reasons?.[0]}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {(rec.similarity || rec.score) && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round((rec.similarity || rec.score || 0) * 100)}
                          %
                        </Badge>
                      )}
                      {rec.type === "deep_dive" ? (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-yellow-500/20"
                        >
                          Explore
                        </Badge>
                      ) : (
                        rec.isFamiliar === false && (
                          <Badge variant="outline" className="text-xs">
                            New
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-8 w-8 p-0 transition-all",
                        currentFeedback === "liked" &&
                          "text-green-500 bg-green-500/20 hover:bg-green-500/30",
                      )}
                      onClick={() => handleFeedback(rec, index, "liked")}
                      disabled={isLoading}
                    >
                      <ThumbsUp
                        className={cn(
                          "w-4 h-4 transition-transform",
                          currentFeedback === "liked" && "scale-110",
                        )}
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-8 w-8 p-0 transition-all",
                        currentFeedback === "disliked" &&
                          "text-red-500 bg-red-500/20 hover:bg-red-500/30",
                      )}
                      onClick={() => handleFeedback(rec, index, "disliked")}
                      disabled={isLoading}
                    >
                      <ThumbsDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          currentFeedback === "disliked" && "scale-110",
                        )}
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-8 w-8 p-0 transition-all",
                        currentFeedback === "dismissed" &&
                          "text-muted-foreground bg-muted",
                      )}
                      onClick={() => handleFeedback(rec, index, "dismissed")}
                      disabled={isLoading}
                    >
                      <X
                        className={cn(
                          "w-4 h-4 transition-transform",
                          currentFeedback === "dismissed" && "scale-110",
                        )}
                      />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
