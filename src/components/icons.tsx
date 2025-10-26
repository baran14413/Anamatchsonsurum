import type { SVGProps } from "react";
import Image, { ImageProps } from 'next/image';
import beGoldLogo from '@/img/begold.png';
import appLogo from '@/img/logo.png';

export const Icons = {
  logo: (props: Omit<ImageProps, 'src' | 'alt'>) => (
    <Image src={appLogo} alt="BeMatch Logo" {...props} />
  ),
  adminLogo: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...props}>
      <path
        fill="hsl(var(--primary))"
        d="M128 24a104 104 0 1 0 104 104A104.12 104.12 0 0 0 128 24m-11 49.61a20.19 20.19 0 0 1 11.27-3.61c8.13 0 12.33 3.49 12.33 8.36v5.22h-12.33v-4.85c0-1.87-.79-2.73-3-2.73s-2.93.86-2.93 2.73v16.14c0 1.87.76 2.73 3 2.73s3-.86 3-2.73v-4.85h12.33v5.22c0 4.87-4.2 8.36-12.33 8.36a20.19 20.19 0 0 1-11.27-3.61c-5.81-3.23-9.5-8.59-9.5-15.09v-1.14c0-6.5 3.69-11.86 9.5-15.09M90.4 116.59l11.45-31.14h13.1l-11.41 31.14zm-1.12 18.23l-7-18.77H69.4l7.15 18.77zm50.62-18.23l11.41-31.14h13.1l-11.45 31.14zm-1.12 18.23l7.15-18.77h12.88l-7 18.77z"
      />
    </svg>
  ),
  tinderFlame: (props: SVGProps<SVGSVGElement>) => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...props}>
      <path
        fill="hsl(var(--primary))"
        d="M128 24a104 104 0 1 0 104 104A104.12 104.12 0 0 0 128 24m-11 49.61a20.19 20.19 0 0 1 11.27-3.61c8.13 0 12.33 3.49 12.33 8.36v5.22h-12.33v-4.85c0-1.87-.79-2.73-3-2.73s-2.93.86-2.93 2.73v16.14c0 1.87.76 2.73 3 2.73s3-.86 3-2.73v-4.85h12.33v5.22c0 4.87-4.2 8.36-12.33 8.36a20.19 20.19 0 0 1-11.27-3.61c-5.81-3.23-9.5-8.59-9.5-15.09v-1.14c0-6.5 3.69-11.86 9.5-15.09M90.4 116.59l11.45-31.14h13.1l-11.41 31.14zm-1.12 18.23l-7-18.77H69.4l7.15 18.77zm50.62-18.23l11.41-31.14h13.1l-11.45 31.14zm-1.12 18.23l7.15-18.77h12.88l-7 18.77z"
      />
    </svg>
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