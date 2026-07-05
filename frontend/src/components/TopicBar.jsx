import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function TopicBar({ mastery }) {
  // Extract topics and values
  const topics = Object.keys(mastery);
  
  // Map values (scale 0-1 to 0-100 if stored as fraction, or use directly if percentage)
  const accuracies = topics.map((t) => {
    const acc = mastery[t].accuracy;
    // If accuracy is a fraction (e.g. 0.34), scale to percentage. If already scaled (e.g. 34.0), use directly.
    return acc <= 1.0 && acc > 0.0 ? acc * 100 : acc;
  });

  // Determine bar colors based on accuracy levels: Green >= 65%, Orange/Yellow 40-65%, Red < 40%
  const backgroundColors = accuracies.map((acc) => {
    if (acc >= 65) return "#10b981"; // Green
    if (acc >= 40) return "#d97706"; // Golden/Orange
    return "#ef4444"; // Red
  });

  const borderColors = accuracies.map((acc) => {
    if (acc >= 65) return "#059669";
    if (acc >= 40) return "#b45309";
    return "#dc2626";
  });

  const data = {
    labels: topics,
    datasets: [
      {
        label: "Mastery Level (%)",
        data: accuracies,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 32
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Hide legend to match clean mockup style
      },
      tooltip: {
        backgroundColor: "#1a120e",
        titleColor: "#faf5f0",
        bodyColor: "#faf5f0",
        borderColor: "#d97706",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `Mastery: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10,
          color: "#7c6a5f",
          font: {
            family: "Outfit, sans-serif",
            weight: "600",
            size: 11
          }
        },
        grid: {
          color: "#dfd3c340"
        },
        border: {
          dash: [4, 4]
        }
      },
      x: {
        ticks: {
          color: "#2c1b12",
          font: {
            family: "Outfit, sans-serif",
            weight: "600",
            size: 11
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="w-full h-80 bg-white rounded-xl border border-brand-border-light p-4 shadow-sm">
      <Bar data={data} options={options} />
    </div>
  );
}
