"use client";

import svgPaths from "@/imports/svg-urruvoh2be";
import mascotSvgPaths from "@/imports/svg-xeurqn3j1r";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface SocialLink {
  label: string;
  href: string;
  viewBox: string;
  path: string;
  /** Optional wrapper for icons that need precise positioning */
  wrapperClass?: string;
  clipId?: string;
  clipSize?: { width: string; height: string };
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Discord",
    href: "#",
    viewBox: "0 0 24 24",
    path: svgPaths.pa1e7100,
  },
  {
    label: "Twitter",
    href: "#",
    viewBox: "0 0 21.9611 17",
    path: svgPaths.p3885cd00,
    wrapperClass: "inset-[10.82%_4.33%_18.35%_4.17%]",
  },
  {
    label: "YouTube",
    href: "#",
    viewBox: "0 0 22 15.4688",
    path: svgPaths.p23dbbd00,
    wrapperClass: "-translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 h-[15.469px] w-[22px]",
    clipId: "clip_yt",
    clipSize: { width: "22", height: "15.4688" },
  },
  {
    label: "LinkedIn",
    href: "#",
    viewBox: "0 0 19 19",
    path: svgPaths.p26fc3100,
    wrapperClass: "-translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 size-[19px]",
    clipId: "clip_li",
    clipSize: { width: "19", height: "19" },
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SocialIcon({ link }: { link: SocialLink }) {
  const svgContent = link.clipId ? (
    <svg className="absolute block size-full" fill="none" viewBox={link.viewBox}>
      <g clipPath={`url(#${link.clipId})`}>
        <path d={link.path} fill="black" fillOpacity="0.4" />
      </g>
      <defs>
        <clipPath id={link.clipId}>
          <rect fill="white" height={link.clipSize!.height} width={link.clipSize!.width} />
        </clipPath>
      </defs>
    </svg>
  ) : (
    <svg className="absolute block size-full" fill="none" viewBox={link.viewBox}>
      <path d={link.path} fill="black" fillOpacity="0.4" />
    </svg>
  );

  return (
    <a href={link.href} className="size-6 relative" aria-label={link.label}>
      {link.wrapperClass ? (
        <div className={`absolute ${link.wrapperClass}`}>{svgContent}</div>
      ) : (
        svgContent
      )}
    </a>
  );
}

function SocialIcons() {
  return (
    <div className="flex gap-6">
      {SOCIAL_LINKS.map((link) => (
        <SocialIcon key={link.label} link={link} />
      ))}
    </div>
  );
}

function ThesysLogo() {
  return (
    <div className="h-12 w-[124px] relative">
      <svg className="absolute block size-full" fill="none" viewBox="0 0 123.871 49.5484">
        <path d={svgPaths.p16775200} fill="black" />
        <path clipRule="evenodd" d={svgPaths.p29abae30} fill="black" fillRule="evenodd" />
        <path d={svgPaths.p318aaf80} fill="black" />
        <path d={svgPaths.p3f22cf00} fill="black" />
        <path d={svgPaths.p27013980} fill="black" />
        <path d={svgPaths.p21b7f300} fill="black" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Footer() {
  return (
    <footer className="w-full">
      {/* Handcrafted */}
      <div className="w-full px-5 lg:px-8">
        <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-2.5 py-16">
          <div className="relative shrink-0 size-[140px]">
            <svg
              className="absolute block"
              style={{ inset: "9.29% 0 10% 0" }}
              fill="none"
              preserveAspectRatio="xMidYMid meet"
              viewBox="0 0 141.2 114.2"
            >
              <path d={mascotSvgPaths.p395b3c00} fill="black" stroke="black" strokeWidth="0.6" />
              <path d={mascotSvgPaths.p3b251e80} fill="black" />
              <path d={mascotSvgPaths.p2718bc80} fill="black" stroke="black" strokeWidth="0.6" />
              <path d={mascotSvgPaths.p37ab5b0} fill="black" stroke="black" strokeWidth="0.6" />
              <path d={mascotSvgPaths.p2ac89300} fill="black" />
              <path d={mascotSvgPaths.p2b8b4380} fill="black" />
              <path d={mascotSvgPaths.p15c14e00} fill="black" stroke="black" strokeWidth="0.6" />
              <path d={mascotSvgPaths.p4076200} fill="black" stroke="black" strokeWidth="0.6" />
            </svg>
          </div>
          <p className="font-['Playwrite_US_Trad',serif] text-base lg:text-[22px] text-black leading-[1.2] text-center">
            Handcrafted with a lot of love.
          </p>
        </div>
      </div>

      {/* Footer content */}
      <div className="bg-white px-5 lg:px-8 pt-[60px] pb-4">
        <div className="max-w-[1200px] mx-auto">
          {/* Desktop */}
          <div className="hidden lg:flex flex-col items-center">
            <ThesysLogo />
          </div>
          {/* Mobile */}
          <div className="lg:hidden flex w-full flex-col items-center">
            <ThesysLogo />
          </div>

          {/* Bottom bar */}
          <div className="mt-10 lg:mt-[60px] border-t border-black/4 py-4 lg:py-4">
            <div className="hidden lg:flex items-center justify-between gap-2">
              <p className="font-['Inter',sans-serif] text-[15px] text-black/40 leading-[1.5] text-left">
                355 Bryant St, San Francisco, CA 94107
              </p>
              <SocialIcons />
              <p className="font-['Inter',sans-serif] text-[15px] text-black/40 leading-[1.5] text-right">
                © {new Date().getFullYear()} Thesys Inc. All Rights Reserved
              </p>
            </div>

            <div className="lg:hidden flex flex-col items-center justify-start pt-10 pb-5">
              <SocialIcons />
              <div className="mt-10 text-center">
                <p className="font-['Inter',sans-serif] text-xs text-black/40 leading-[1.5]">
                  © {new Date().getFullYear()} Thesys Inc. All Rights Reserved
                </p>
                <p className="font-['Inter',sans-serif] text-xs text-black/40 leading-[1.5]">
                  355 Bryant St, San Francisco, CA 94107
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
