import type { SVGProps } from "react";
import Image from 'next/image';
import bematchLogo from '@/img/logo.png';

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
  tinderFlame: (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
     <Image src={bematchLogo} alt="BeMatch Logo" {...props} />
  ),
};
