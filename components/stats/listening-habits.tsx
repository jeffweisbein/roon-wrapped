interface ListeningHabitsProps {
  uniqueTracks: number;
  totalHours: number;
  dailyAverageTracks: number;
  peakHour: string;
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

export function ListeningHabits({
  uniqueTracks,
  totalHours,
  dailyAverageTracks,
  peakHour,
  currentStreak,
  longestStreak,
  totalDays,
}: ListeningHabitsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Hours Played"
        value={totalHours.toFixed(1)}
        description="hours of music"
        gradient="from-yellow-400 to-orange-500"
      />
      <StatCard
        title="Songs Played"
        value={uniqueTracks.toString()}
        description="different songs"
        gradient="from-orange-400 to-red-500"
      />
      <StatCard
        title="Songs Per Day"
        value={dailyAverageTracks.toFixed(1)}
        description="tracks per day"
        gradient="from-pink-400 to-purple-500"
      />
      <StatCard
        title="Most Active Time"
        value={peakHour}
        description="most active time"
        gradient="from-purple-400 to-blue-500"
      />
      <StatCard
        title="Play Streak"
        value={currentStreak.toString()}
        description="days in a row"
        gradient="from-blue-400 to-cyan-500"
      />
      <StatCard
        title="Longest Play Streak"
        value={longestStreak.toString()}
        description="consecutive days"
        gradient="from-cyan-400 to-teal-500"
      />
      <StatCard
        title="Total Days"
        value={totalDays.toString()}
        description="days of listening"
        gradient="from-teal-400 to-emerald-500"
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  gradient,
}: {
  title: string;
  value: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group bg-white/5 hover:bg-white/10 backdrop-blur-lg border border-white/10 hover:border-white/20 p-6 rounded-2xl transition-all">
      <h3
        className={`text-sm font-medium text-neutral-400 bg-gradient-to-r ${gradient} bg-clip-text text-transparent group-hover:opacity-100 opacity-80`}
      >
        {title}
      </h3>
      <p className="mt-2 text-3xl font-bold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  );
}
