
"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 40,
  strokeWidth = 4,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const isComplete = progress >= 100;

  return (
    <div
      className="relative flex items-center justify-center bg-background rounded-full shadow-md"
      style={{ width: size, height: size }}
    >
      <svg className="absolute w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-muted"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn(
            "transition-all duration-300 ease-in-out",
            isComplete ? "text-green-500" : "text-primary"
          )}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {isComplete ? (
        <Check className="h-5 w-5 text-green-500 animate-in fade-in zoom-in" />
      ) : (
        <span className="text-xs font-bold text-primary">{`${Math.round(
          progress
        )}%`}</span>
      )}
    </div>
  );
};

export default CircularProgress;
