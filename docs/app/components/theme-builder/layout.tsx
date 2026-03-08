import {
  DM_Sans,
  Lato,
  Merriweather,
  Montserrat,
  Nunito,
  Playfair_Display,
  Poppins,
  Roboto,
  Source_Sans_3,
} from "next/font/google";
import type { ReactNode } from "react";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fontClassName = [
  roboto.variable,
  poppins.variable,
  lato.variable,
  montserrat.variable,
  nunito.variable,
  playfairDisplay.variable,
  merriweather.variable,
  sourceSans3.variable,
  dmSans.variable,
].join(" ");

export default function ThemeBuilderLayout({ children }: { children: ReactNode }) {
  return <div className={fontClassName}>{children}</div>;
}
