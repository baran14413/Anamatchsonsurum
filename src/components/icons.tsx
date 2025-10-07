
import type { SVGProps } from "react";
import Image from 'next/image';
import bematchLogo from '@/img/logo.png';
import beGoldLogo from '@/img/begold.png';

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icons = {
  logo: (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
    <Image src={bematchLogo} alt="BeMatch Logo" {...props} />
  ),
  adminLogo: (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
    <Image src={bematchLogo} alt="Admin Logo" {...props} />
  ),
  tinderFlame: (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
     <Image src={bematchLogo} alt="BeMatch Logo" {...props} />
  ),
  bmIcon: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" {...props}>
      <rect width="100" height="100" rx="20" fill="hsl(var(--primary))" />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="50" fontWeight="bold" fill="hsl(var(--primary-foreground))">
        BM
      </text>
    </svg>
  ),
  beGold: (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
    <Image src={beGoldLogo} alt="BeMatch Gold" {...props} />
  ),
   Bot: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  ),
};
