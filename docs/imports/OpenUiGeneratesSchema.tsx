import svgPaths from "./svg-pr6qxiizdt";

function Group() {
  return (
    <div className="absolute contents left-[49px] top-[48px]">
      <div className="absolute h-[290px] left-[49px] top-[48px] w-[443px]">
        <svg
          className="absolute block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 443 290"
        >
          <path d={svgPaths.p1bd62700} fill="var(--fill-0, black)" id="Rectangle 34662625" />
        </svg>
      </div>
      <p className="absolute font-['Andale_Mono:Regular',sans-serif] h-[262px] leading-none left-[73px] not-italic text-[10px] text-white top-[71px] w-[254px] whitespace-pre-wrap">{`# generate system prompt from library
npx @openuidev/cli@latest generate ./src/library.ts

# use in your backend
const completion = await client.chat.completions.create({
  model: "gpt-5.2",
  stream: true,
  messages: [{ role: "system", content: systemPrompt }, ...messages]
})`}</p>
      <div className="absolute bg-gradient-to-b from-[rgba(0,0,0,0)] h-[64px] left-[60px] to-black top-[272px] w-[285px]" />
    </div>
  );
}

function Frame() {
  return (
    <div className="aspect-[296/196] bg-[#3e3e3e] relative shrink-0 w-full">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <div className="absolute h-[129.5px] left-[6.84px] top-[6.84px] w-[200px]">
          <div className="absolute inset-[-0.32%_-0.14%]">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 200.544 130.339"
            >
              <path
                d={svgPaths.p38c9e300}
                id="Vector 32"
                stroke="var(--stroke-0, black)"
                strokeDasharray="2 2"
                strokeOpacity="0.25"
              />
            </svg>
          </div>
        </div>
        <div className="absolute flex h-[129.5px] items-center justify-center left-[6.84px] top-[6.84px] w-[200px]">
          <div className="-scale-y-100 flex-none rotate-180">
            <div className="h-[129.5px] relative w-[200px]">
              <div className="absolute inset-[-0.32%_-0.14%]">
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 200.544 130.339"
                >
                  <path
                    d={svgPaths.p38c9e300}
                    id="Vector 33"
                    stroke="var(--stroke-0, black)"
                    strokeDasharray="2 2"
                    strokeOpacity="0.25"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute border border-[#646464] border-solid inset-0 pointer-events-none"
      />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0">
      <div
        className="content-stretch flex gap-[2.888px] h-[23.1px] items-center px-[5.775px] py-[4.331px] relative shrink-0"
        data-name="Tag"
      >
        <div
          aria-hidden="true"
          className="absolute border border-[#646464] border-solid inset-0 pointer-events-none"
        />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.2] not-italic relative shrink-0 text-[10.11px] text-white">
          TAG
        </p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="relative shrink-0 w-full">
      <div
        aria-hidden="true"
        className="absolute border border-[#414141] border-solid inset-0 pointer-events-none"
      />
      <div className="content-stretch flex flex-col items-start leading-[1.5] not-italic p-[4px] relative text-[11.55px] text-white w-full">
        <p className="font-['Inter:Medium',sans-serif] font-medium relative shrink-0">Name</p>
        <p className="font-['Inter:Regular',sans-serif] font-normal min-w-full relative shrink-0 w-[min-content] whitespace-pre-wrap">
          Description goes here
        </p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute bg-[#2c2c2c] content-stretch flex flex-col gap-[8.663px] items-start left-[305px] p-[8.663px] top-[108px] w-[231px]">
      <div
        aria-hidden="true"
        className="absolute border-[1.023px] border-black border-solid inset-0 pointer-events-none shadow-[-4px_0px_10.1px_0px_rgba(0,0,0,0.25),4.093px_4.093px_8.185px_0px_rgba(174,174,192,0.4)]"
      />
      <Frame />
      <Frame3 />
      <Frame1 />
      <div
        className="content-stretch flex h-[25.988px] items-center justify-between px-[8.663px] py-[5.775px] relative shrink-0 w-[213.675px]"
        data-name="Primary Button"
      >
        <div
          aria-hidden="true"
          className="absolute border-[0.722px] border-[rgba(255,255,255,0.26)] border-solid inset-0 pointer-events-none"
        />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.5] not-italic relative shrink-0 text-[11.55px] text-white">
          Action
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

export default function OpenUiGeneratesSchema() {
  return (
    <div
      className="overflow-clip relative rounded-[16px] size-full"
      data-name="OpenUI generates prompt"
    >
      <Group />
      <Frame2 />
      <p className="absolute font-['Geist_Mono:Medium',sans-serif] font-medium leading-none left-[58px] text-[12px] text-[rgba(0,0,0,0.4)] top-[366px]">
        SEND SYSTEM PROMPT TO LLM
      </p>
    </div>
  );
}
