import mascotSvgPaths from "@/imports/svg-10waxq0xyc";
import svgPaths from "@/imports/svg-urruvoh2be";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface UILibrary {
  name: string;
  /** Desktop-only name override (optional) */
  desktopName?: string;
  /** Mobile-only name override (optional) */
  mobileName?: string;
  iconBg: string;
  iconSize: string;
  iconOffset: string;
  iconDesktopOffset: string;
  iconViewBox: string;
  iconPath: string;
  iconFill: string;
  clipId?: string;
  clipSize?: string;
  isMascot?: boolean;
}

const LIBRARIES: UILibrary[] = [
  {
    name: "OpenUI Design system",
    iconBg: "bg-black/8",
    iconSize: "",
    iconOffset: "",
    iconDesktopOffset: "",
    iconViewBox: "",
    iconPath: "",
    iconFill: "black",
    isMascot: true,
  },
  {
    name: "ShadCN",
    iconBg: "bg-black",
    iconSize: "size-4 lg:size-6",
    iconOffset: "left-2 lg:left-3 top-2 lg:top-3",
    iconDesktopOffset: "",
    iconViewBox: "0 0 24 24",
    iconPath: svgPaths.p46a4800,
    iconFill: "white",
    clipId: "clip_shadcn",
    clipSize: "24",
  },
  {
    name: "Material Design system",
    mobileName: "Material Design system Guidelines",
    iconBg: "bg-[#a485ff]",
    iconSize: "size-5 lg:size-[30px]",
    iconOffset: "left-1.5 lg:left-[9px] top-1.5 lg:top-[9px]",
    iconDesktopOffset: "",
    iconViewBox: "0 0 30 30",
    iconPath: svgPaths.p3a7bdd80,
    iconFill: "white",
    clipId: "clip_material",
    clipSize: "30",
  },
];

// ---------------------------------------------------------------------------
// Library card
// ---------------------------------------------------------------------------

function LibraryCard({ lib }: { lib: UILibrary }) {
  const displayName = lib.mobileName ? (
    <>
      <span className="lg:hidden">{lib.mobileName}</span>
      <span className="hidden lg:inline">{lib.desktopName ?? lib.name}</span>
    </>
  ) : (
    lib.name
  );

  const iconContent = lib.clipId ? (
    <svg className="absolute block size-full" fill="none" viewBox={lib.iconViewBox}>
      <g clipPath={`url(#${lib.clipId})`}>
        <path d={lib.iconPath} fill={lib.iconFill} />
      </g>
      <defs>
        <clipPath id={lib.clipId}>
          <rect fill="white" height={lib.clipSize} width={lib.clipSize} />
        </clipPath>
      </defs>
    </svg>
  ) : (
    <svg className="absolute block size-full" fill="none" viewBox={lib.iconViewBox}>
      <path d={lib.iconPath} fill={lib.iconFill} />
    </svg>
  );

  return (
    <div className="bg-white h-14 lg:h-20 rounded-[14px] lg:rounded-2xl relative border border-black/10 shadow-[0px_8px_16px_-4px_rgba(22,34,51,0.08)] flex-1">
      <div className="flex items-center gap-4 p-3 lg:p-4 h-full">
        {/* Icon */}
        <div
          className={`${lib.iconBg} rounded-[6.4px] lg:rounded-[9.6px] size-8 lg:size-12 shrink-0 relative overflow-hidden`}
        >
          {lib.isMascot ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rotate-[-16.49deg] size-[22px] lg:size-[37px] relative">
                <div className="absolute inset-[-1.16%_-0.94%]">
                  <svg
                    className="block size-full"
                    fill="none"
                    preserveAspectRatio="xMidYMid meet"
                    viewBox="0 0 37.6937 30.558"
                  >
                    <path
                      d={mascotSvgPaths.p581fa00}
                      fill="black"
                      stroke="black"
                      strokeWidth="0.346875"
                    />
                    <path d={mascotSvgPaths.p3ea20780} fill="black" />
                    <path
                      d={mascotSvgPaths.pf52e280}
                      fill="black"
                      stroke="black"
                      strokeWidth="0.346875"
                    />
                    <path
                      d={mascotSvgPaths.pa685a00}
                      fill="black"
                      stroke="black"
                      strokeWidth="0.346875"
                    />
                    <path d={mascotSvgPaths.p371d6000} fill="black" />
                    <path d={mascotSvgPaths.p1cace000} fill="black" />
                    <path
                      d={mascotSvgPaths.p1d3dca00}
                      fill="black"
                      stroke="black"
                      strokeWidth="0.346875"
                    />
                    <path
                      d={mascotSvgPaths.p11103600}
                      fill="black"
                      stroke="black"
                      strokeWidth="0.346875"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className={`absolute ${lib.iconOffset} ${lib.iconSize}`}>{iconContent}</div>
          )}
        </div>

        {/* Name */}
        <span className="font-['Inter_Display',sans-serif] font-medium text-base lg:text-[22px] text-black leading-[1.4]">
          {displayName}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function UILibrariesSection() {
  return (
    <div className="w-full px-5 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h2 className="font-['Inter',sans-serif] font-semibold text-[22px] lg:text-[32px] text-black leading-[1.25]">
            <span className="lg:hidden">
              Works with any UI library.
              <br />
              Including yours.
            </span>
            <span className="hidden lg:inline">Works with any UI library. Including yours.</span>
          </h2>
        </div>

        {/* Library cards */}
        <div className="flex flex-col lg:flex-row gap-3">
          {LIBRARIES.map((lib) => (
            <LibraryCard key={lib.name} lib={lib} />
          ))}
        </div>
      </div>
    </div>
  );
}
