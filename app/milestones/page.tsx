import { ArtistMilestoneTracker } from "@/components/artist-milestone-tracker";

export default function MilestonesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Artist Performance Tracker</h1>
        <p className="text-muted-foreground">
          Track how quickly artists reach listening milestones and compare their growth trajectories
        </p>
      </div>
      <ArtistMilestoneTracker />
    </div>
  );
}