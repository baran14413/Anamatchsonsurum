

"use client";

import * as React from "react";
import { Icons } from "./icons";

interface CircularProgressProps {
  progress: number;
  size?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 40,
}) => {
  return (
    <div
      className="relative flex items-center justify-center bg-white rounded-full shadow-md"
      style={{ width: size, height: size }}
    >
      <Icons.logo width={size * 0.6} height={size * 0.6} className="animate-spin" />
    </div>
  );
};

export default CircularProgress;
