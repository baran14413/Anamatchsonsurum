import type { SVGProps } from "react";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" {...svgProps} {...props} fill="currentColor">
       <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
       <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" opacity="0.5"/>
    </svg>
  ),
  tinderFlame: (props: SVGProps<SVGSVGElement>) => (
     <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="currentColor">
       <path d="M15.93,12.38C15.9,13,16,14.28,15,15.56C13.91,16.96,12.5,16.94,12.5,16.94C12.5,16.94,11.39,16.89,10.22,15.5C9,14,9.07,12.33,9.07,12.33A5.4,5.4,0,0,1,10.7,7.56C11.39,6.5,13,6.13,13,6.13A4.29,4.29,0,0,1,17,10.21C17.05,10.71,16.63,11.75,15.93,12.38Z" />
    </svg>
  ),
};
