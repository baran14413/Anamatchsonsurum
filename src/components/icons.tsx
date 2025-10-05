import type { SVGProps } from "react";
import Image from 'next/image';
import bematchLogo from '@/img/bematch.png';

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
  tinderFlame: (props: SVGProps<SVGSVGElement>) => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
       <path d="M15.93,12.38C15.9,13,16,14.28,15,15.56C13.91,16.96,12.5,16.94,12.5,16.94C12.5,16.94,11.39,16.89,10.22,15.5C9,14,9.07,12.33,9.07,12.33A5.4,5.4,0,0,1,10.7,7.56C11.39,6.5,13,6.13,13,6.13A4.29,4.29,0,0,1,17,10.21C17.05,10.71,16.63,11.75,15.93,12.38Z" />
    </svg>
  ),
  facebook: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0,0,256,256" {...props}>
        <g fill="#ffffff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style={{mixBlendMode: 'normal'}}><g transform="scale(5.12,5.12)"><path d="M25,3c-12.15,0 -22,9.85 -22,22c0,11.03 8.125,20.137 18.712,21.728v-15.897h-5.443v-5.783h5.443v-3.848c0,-6.371 3.104,-9.168 8.399,-9.168c2.536,0 3.877,0.188 4.512,0.274v5.048h-3.612c-2.248,0 -3.033,2.131 -3.033,4.533v3.161h6.588l-0.894,5.783h-5.694v15.944c10.738,-1.457 19.022,-10.638 19.022,-21.775c0,-12.15 -9.85,-22 -22,-22z"></path></g></g>
    </svg>
  ),
};
