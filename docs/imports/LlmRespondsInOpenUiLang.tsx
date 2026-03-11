import svgPaths from "./svg-l2c2kzuful";
const hotelPlazaImg = "/images/home/706ccb488b69a5bdb06bdd002656a2fdfb017071.png";
const hotelGeorgeVImg = "/images/home/6dea3a71b902a0282d8518928f3b06373b617aba.png";
const hotelShangriLaImg = "/images/home/d781d9c958cc5cf8f3fc5fd61562ebcf0c7ba0a5.png";

type CardPreviewData = {
  imageSrc: string;
  tag: string;
  tagClassName: string;
  title: string;
  description: string;
};

const CARD_PREVIEWS: CardPreviewData[] = [
  {
    imageSrc: hotelPlazaImg,
    tag: "Free Wifi",
    tagClassName: "bg-[rgba(13,160,94,0.1)] text-[#067647]",
    title: "Hotel Plaza Athenee",
    description: "Haute couture suites; courtyard dining; Dior spa; near Champs-Elysees.",
  },
  {
    imageSrc: hotelGeorgeVImg,
    tag: "Family-friendly",
    tagClassName: "bg-[rgba(203,63,73,0.1)] text-[#e94852]",
    title: "Four Seasons George V",
    description: "Landmark hotel with opulent rooms, Michelin dining, and a lavish spa.",
  },
  {
    imageSrc: hotelShangriLaImg,
    tag: "Elite",
    tagClassName: "bg-[rgba(0,0,0,0.06)] text-black",
    title: "Shangri-La Hotel",
    description: "Stunning Eiffel Tower views; Michelin dining; serene spa.",
  },
];

function Group() {
  return (
    <div className="absolute contents left-[49px] top-[48px]">
      <div className="absolute bg-black h-[290px] left-[49px] rounded-[16px] top-[48px] w-[443px]" />
      <p className="absolute font-['Andale_Mono:Regular',sans-serif] h-[198px] leading-none left-[73px] not-italic text-[10px] text-white top-[74px] w-[254px] whitespace-pre-wrap">{`root = Carousel([c1, c2, c3])
c1 = CarouselCard(
  "Hotel Plaza Athenee",
  "Haute couture suites; courtyard dining; Dior spa.",
  "https://images.example.com/plaza.jpg",
  "Book"
)
c2 = CarouselCard(
  "Four Seasons George V",
  "Landmark hotel with opulent rooms and spa.",
  "https://images.example.com/george-v.jpg",
  "Book"
)
c3 = CarouselCard(
  "Shangri-La Hotel",
  "Stunning Eiffel Tower views and Michelin dining.",
  "https://images.example.com/shangri-la.jpg",
  "Book"
)`}</p>
      <div className="absolute bg-gradient-to-b from-[rgba(0,0,0,0)] h-[65px] left-[60px] to-black top-[272px] w-[285px]" />
    </div>
  );
}

function Frame({ imageSrc }: { imageSrc: string }) {
  return (
    <div className="aspect-[296/196] bg-[#dbdbdb] overflow-clip relative shrink-0 w-full rounded-[4px]">
      <img
        alt=""
        className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
        src={imageSrc}
      />
    </div>
  );
}

function Frame3({ tag, tagClassName }: Pick<CardPreviewData, "tag" | "tagClassName">) {
  return (
    <div className="content-stretch flex items-start relative shrink-0">
      <div
        className={`content-stretch flex gap-[2.888px] h-[23.1px] items-center px-[5.775px] py-[4.331px] relative shrink-0 ${tagClassName}`}
        data-name="Tag"
      >
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.2] not-italic relative shrink-0 text-[10.11px]">
          {tag}
        </p>
      </div>
    </div>
  );
}

function Frame1({ title, description }: Pick<CardPreviewData, "title" | "description">) {
  return (
    <div className="content-stretch flex flex-col items-start leading-[1.5] not-italic relative shrink-0 text-[11.55px] w-full">
      <p className="font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-black">
        {title}
      </p>
      <p className="font-['Inter:Regular',sans-serif] font-normal min-w-full relative shrink-0 text-[rgba(0,0,0,0.4)] w-[min-content] whitespace-pre-wrap">
        {description}
      </p>
    </div>
  );
}

function Frame2({ className, data }: { className?: string; data: CardPreviewData }) {
  return (
    <div
      className={`relative bg-white content-stretch flex flex-col gap-[8.663px] items-start p-[8.663px] w-[231px] ${className ?? ""}`}
    >
      <div
        aria-hidden="true"
        className="absolute border-[#e4e4e4] border-[1.023px] border-solid inset-0 pointer-events-none shadow-[-4px_0px_10.1px_0px_rgba(0,0,0,0.25)]"
      />
      <Frame imageSrc={data.imageSrc} />
      <Frame3 tag={data.tag} tagClassName={data.tagClassName} />
      <Frame1 title={data.title} description={data.description} />
      <div
        className="bg-black content-stretch flex h-[25.988px] items-center justify-between px-[8.663px] py-[5.775px] relative shrink-0 w-[213.675px]"
        data-name="Primary Button"
      >
        <div
          aria-hidden="true"
          className="absolute border-[0.722px] border-[rgba(255,255,255,0.08)] border-solid inset-0 pointer-events-none"
        />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.5] not-italic relative shrink-0 text-[11.55px] text-white">
          Book
        </p>
        <div className="relative shrink-0 size-[11.55px]" data-name="Icon Container">
          <div
            className="absolute left-0 overflow-clip size-[11.55px] top-0"
            data-name="16 arrow-right"
          >
            <div className="absolute inset-[20.83%]" data-name="Vector">
              <div className="absolute inset-[-5.36%]">
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 7.45938 7.45938"
                >
                  <path
                    d={svgPaths.p104fe640}
                    id="Vector"
                    stroke="var(--stroke-0, white)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="0.721875"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[3.7%_0_0_35.9%]">
      <svg
        className="absolute block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 391 416"
      >
        <g id="Group 10">
          <path
            d="M317 1.31134e-08L317 416"
            id="Vector"
            stroke="url(#paint0_linear_38_926)"
            strokeOpacity="0.1"
            strokeWidth="0.6"
          />
          <path
            d="M391 92L-3.80158e-06 92"
            id="Vector_2"
            stroke="url(#paint1_linear_38_926)"
            strokeOpacity="0.1"
            strokeWidth="0.6"
          />
          <path
            d="M391 101L-3.80158e-06 101"
            id="Vector_3"
            stroke="url(#paint2_linear_38_926)"
            strokeOpacity="0.1"
            strokeWidth="0.6"
          />
          <path
            d="M391 325L-3.80158e-06 325"
            id="Vector_4"
            stroke="url(#paint3_linear_38_926)"
            strokeOpacity="0.1"
            strokeWidth="0.6"
          />
          <path
            d="M391 351L-3.80158e-06 351"
            id="Vector_5"
            stroke="url(#paint4_linear_38_926)"
            strokeOpacity="0.1"
            strokeWidth="0.6"
          />
          <path
            d="M391 360L-3.80158e-06 360"
            id="Vector_6"
            stroke="url(#paint5_linear_38_926)"
            strokeOpacity="0.1"
            strokeWidth="0.6"
          />
        </g>
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="paint0_linear_38_926"
            x1="342.501"
            x2="339.441"
            y1="411.021"
            y2="-4.97452"
          >
            <stop stopOpacity="0" />
            <stop offset="0.0913462" stopOpacity="0.940594" />
            <stop offset="0.716346" />
            <stop offset="1" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="paint1_linear_38_926"
            x1="4.67954"
            x2="395.678"
            y1="117.5"
            y2="114.798"
          >
            <stop stopOpacity="0" />
            <stop offset="0.283654" stopOpacity="0.940594" />
            <stop offset="0.716346" />
            <stop offset="1" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="paint2_linear_38_926"
            x1="4.67954"
            x2="395.678"
            y1="126.5"
            y2="123.798"
          >
            <stop stopOpacity="0" />
            <stop offset="0.283654" stopOpacity="0.940594" />
            <stop offset="0.716346" />
            <stop offset="1" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="paint3_linear_38_926"
            x1="4.67954"
            x2="395.678"
            y1="350.5"
            y2="347.798"
          >
            <stop stopOpacity="0" />
            <stop offset="0.283654" stopOpacity="0.940594" />
            <stop offset="0.716346" />
            <stop offset="1" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="paint4_linear_38_926"
            x1="4.67954"
            x2="395.678"
            y1="376.5"
            y2="373.798"
          >
            <stop stopOpacity="0" />
            <stop offset="0.283654" stopOpacity="0.940594" />
            <stop offset="0.716346" />
            <stop offset="1" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="paint5_linear_38_926"
            x1="4.67954"
            x2="395.678"
            y1="385.5"
            y2="382.798"
          >
            <stop stopOpacity="0" />
            <stop offset="0.283654" stopOpacity="0.940594" />
            <stop offset="0.716346" />
            <stop offset="1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Group2() {
  return (
    <>
      <Group1 />
      <Frame2 data={CARD_PREVIEWS[0]} className="absolute left-[305px] top-[108px] z-30" />
    </>
  );
}

export default function LlmRespondsInOpenUiLang() {
  return (
    <div
      className="overflow-clip relative rounded-[16px] size-full"
      data-name="LLM responds in OpenUI lang"
    >
      <Group />
      <div className="absolute bottom-0 left-1/2 right-1/2 top-[3.7%]" data-name="Vector">
        <div className="absolute inset-[0_-0.5px]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 1 416"
          >
            <path
              d="M0.5 0V416"
              id="Vector"
              stroke="url(#paint0_linear_36_432)"
              strokeOpacity="0.1"
            />
            <defs>
              <linearGradient
                gradientUnits="userSpaceOnUse"
                id="paint0_linear_36_432"
                x1="26.0005"
                x2="22.9412"
                y1="411.021"
                y2="-4.97452"
              >
                <stop stopOpacity="0" />
                <stop offset="0.0913462" stopOpacity="0.940594" />
                <stop offset="0.716346" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute flex inset-[59.72%_0_40.28%_35.9%] items-center justify-center">
        <div className="flex-none h-[391px] rotate-90 w-px">
          <div className="relative size-full" data-name="Vector">
            <div className="absolute inset-[0_-0.5px]">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 1 391"
              >
                <path
                  d="M0.5 0V391"
                  id="Vector"
                  stroke="url(#paint0_linear_36_428)"
                  strokeOpacity="0.1"
                />
                <defs>
                  <linearGradient
                    gradientUnits="userSpaceOnUse"
                    id="paint0_linear_36_428"
                    x1="26.0005"
                    x2="23.2978"
                    y1="386.32"
                    y2="-4.67803"
                  >
                    <stop stopOpacity="0" />
                    <stop offset="0.283654" stopOpacity="0.940594" />
                    <stop offset="0.716346" />
                    <stop offset="1" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Group2 />
      <p className="absolute font-['Geist_Mono:Medium',sans-serif] font-medium leading-none left-[58px] text-[12px] text-[rgba(0,0,0,0.4)] top-[366px]">
        OPENUI LANG (TOKEN EFFICIENT)
      </p>
    </div>
  );
}
