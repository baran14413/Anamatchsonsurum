import type { SVGProps } from "react";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  stroke: "currentColor",
  strokeWidth: "1",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="currentColor">
      <path d="M15.93,12.38C15.9,13,16,14.28,15,15.56C13.91,16.96,12.5,16.94,12.5,16.94C12.5,16.94,11.39,16.89,10.22,15.5C9,14,9.07,12.33,9.07,12.33A5.4,5.4,0,0,1,10.7,7.56C11.39,6.5,13,6.13,13,6.13A4.29,4.29,0,0,1,17,10.21C17.05,10.71,16.63,11.75,15.93,12.38Z" />
    </svg>
  ),
  tinderFlame: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M15.93,12.38C15.9,13,16,14.28,15,15.56C13.91,16.96,12.5,16.94,12.5,16.94C12.5,16.94,11.39,16.89,10.22,15.5C9,14,9.07,12.33,9.07,12.33A5.4,5.4,0,0,1,10.7,7.56C11.39,6.5,13,6.13,13,6.13A4.29,4.29,0,0,1,17,10.21C17.05,10.71,16.63,11.75,15.93,12.38Z" />
    </svg>
  ),
};
