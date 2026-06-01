import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Package,
} from "lucide-react";

export const DashboardCards = () => {
  const cards = [
    {
      title: "Total Revenue",
      value: "$2,847,392",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "bg-blue-500",
    },
    {
      title: "Gross Margin",
      value: "34.2%",
      change: "+2.1%",
      trend: "up",
      icon: Percent,
      color: "bg-green-500",
    },
    {
      title: "Open Backlog",
      value: "$1,234,567",
      change: "-3.2%",
      trend: "down",
      icon: Package,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const TrendIcon = card.trend === "up" ? TrendingUp : TrendingDown;

        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} rounded-lg p-3`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  card.trend === "up"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <TrendIcon className="h-3 w-3" />
                <span>{card.change}</span>
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {card.value}
              </p>
              <p className="text-sm text-gray-600">{card.title}</p>
            </div>

            {/* Mini trend line */}
            <div className="mt-4">
              <svg className="w-full h-8" viewBox="0 0 120 20">
                <path
                  d={`M0,${card.trend === "up" ? "15" : "5"} Q30,${card.trend === "up" ? "10" : "18"} 60,${card.trend === "up" ? "8" : "12"} T120,${card.trend === "up" ? "3" : "15"}`}
                  fill="none"
                  stroke={card.trend === "up" ? "#10b981" : "#ef4444"}
                  strokeWidth="2"
                  className="opacity-60"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};
