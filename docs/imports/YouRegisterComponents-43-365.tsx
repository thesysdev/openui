import svgPaths from "./svg-7fdz4sm9ln";
const hotelPlazaImg = "/images/home/706ccb488b69a5bdb06bdd002656a2fdfb017071.png";

function Frame() {
  return (
    <div className="aspect-[296/196] bg-[#ffb4b4] overflow-clip relative rounded-[8.663px] shrink-0 w-full">
      <div
        className="absolute h-[168.919px] left-[-5.78px] top-[-13.72px] w-[225.225px]"
        data-name="image 1"
      >
        <img
          alt=""
          className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
          src={hotelPlazaImg}
        />
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0">
      <div
        className="bg-[rgba(13,160,94,0.1)] content-stretch flex gap-[2.888px] h-[23.1px] items-center px-[5.775px] py-[4.331px] relative rounded-[6.139px] shrink-0"
        data-name="Tag"
      >
        <div className="relative shrink-0 size-[10.106px]" data-name="Icon Container">
          <div
            className="absolute left-0 overflow-clip size-[10.106px] top-0"
            data-name="24 clover"
          >
            <div className="absolute inset-[12.52%_12.52%_8.33%_8.33%]" data-name="Vector">
              <div className="absolute inset-[-4.51%]">
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 8.72034 8.72033"
                >
                  <path
                    d={svgPaths.p73dbf00}
                    id="Vector"
                    stroke="var(--stroke-0, #067647)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="0.721875"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.2] not-italic relative shrink-0 text-[#067647] text-[10.11px]">
          Free Wifi
        </p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col items-start leading-[1.5] not-italic relative shrink-0 text-[11.55px] w-full">
      <p className="font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-black">
        Hotel Plaza Athenee
      </p>
      <p className="font-['Inter:Regular',sans-serif] font-normal min-w-full relative shrink-0 text-[rgba(0,0,0,0.4)] w-[min-content] whitespace-pre-wrap">
        Haute couture suites; courtyard dining; Dior spa; near Champs-Élysées.
      </p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col gap-[8.663px] items-start left-[305px] p-[8.663px] rounded-[16.37px] top-[108px] w-[231px]">
      <div
        aria-hidden="true"
        className="absolute border-[#e4e4e4] border-[1.023px] border-solid inset-0 pointer-events-none rounded-[16.37px] shadow-[4.093px_4.093px_8.185px_0px_rgba(174,174,192,0.4)]"
      />
      <Frame />
      <Frame3 />
      <Frame1 />
      <div
        className="bg-black content-stretch flex h-[25.988px] items-center justify-between px-[8.663px] py-[5.775px] relative rounded-[8.185px] shrink-0 w-[213.675px]"
        data-name="Primary Button"
      >
        <div
          aria-hidden="true"
          className="absolute border-[0.722px] border-[rgba(255,255,255,0.08)] border-solid inset-0 pointer-events-none rounded-[8.185px]"
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

export default function YouRegisterComponents() {
  return (
    <div className="relative size-full" data-name="You register components">
      <div
        className="absolute h-[432px] left-0 rounded-[16px] top-0 w-[610px]"
        data-name="image 4"
      />
      <div className="absolute bg-black h-[350px] left-[49px] rounded-[16px] top-[48px] w-[443px]" />
      <p className="absolute font-['Andale_Mono:Regular',sans-serif] h-[262px] leading-none left-[73px] not-italic text-[10px] text-white top-[71px] w-[254px] whitespace-pre-wrap">{`
import { z } from "zod"
import { Carousel, CarouselCard } from "components/Carousel"
import { defineComponent, createLibrary } from "@openuidev/react-lang"

const CarouselCard = defineComponent({
  name: "CarouselCard",
  props: z.object({
    title: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().url(),
    ctaLabel: z.string(),
  }),
  component: ({ props }) => <CarouselCard {...props} />,
})

const Carousel = defineComponent({
  name: "Carousel",
  props: z.object({
    cards: z.array(CarouselCard.ref),
  }),
  component: ({ props }) => <Carousel {...props} />,
})

export const library = createLibrary({
  root: "Carousel",
  components: [Carousel, CarouselCard],
})`}</p>
      <p className="absolute font-['Geist_Mono:Medium',sans-serif] font-medium leading-none left-[58px] text-[12px] text-[rgba(0,0,0,0.4)] top-[366px]">
        DEFINE COMPONENT + LIBRARY
      </p>
      <Frame2 />
    </div>
  );
}
