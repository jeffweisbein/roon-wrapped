import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface OverviewProps {
  data: {
    patterns: {
      hourly: Record<number, number>;
      weekday: Record<number, number>;
    };
  };
}

export function Overview({ data }: OverviewProps) {
  const hourLabels = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const ampm = i < 12 ? "AM" : "PM";
    return `${hour}${ampm}`;
  });

  const weekdayLabels = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const hourlyData = hourLabels.map((_, i) => data.patterns.hourly[i] || 0);
  const weekdayData = weekdayLabels.map(
    (_, i) => data.patterns.weekday[i] || 0,
  );

  const chartData = {
    labels: hourLabels,
    datasets: [
      {
        label: "Plays by Hour",
        data: hourlyData,
        backgroundColor: "rgba(147, 51, 234, 0.5)",
        borderColor: "rgb(147, 51, 234)",
        borderWidth: 1,
      },
    ],
  };

  const weekdayChartData = {
    labels: weekdayLabels,
    datasets: [
      {
        label: "Plays by Day",
        data: weekdayData,
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      <Bar data={chartData} options={options} />
      <Bar data={weekdayChartData} options={options} />
    </div>
  );
}
