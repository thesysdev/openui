import { Award, Coins, Heart, Sparkles, Sun, TrainFront, Waves, Wifi } from "lucide-react";
import type { ComparisonExample } from "../types";

/* The homepage's first example: a modern hotel in Paris, as a wall of text
   versus photo cards, quick-fact tiles and a featured hotel card. */
export const PARIS_HOTELS: ComparisonExample = {
  prompt: "I need a hotel with a modern design in Paris",
  left: {
    label: "Without",
    follow: true,
    blocks: [
      { type: "heading", text: "Modern Hotels in Paris" },
      {
        type: "paragraph",
        text: "Paris offers a wide selection of modern-design hotels that blend contemporary architecture, thoughtful interiors, and premium hospitality. Many of these properties are located in central neighborhoods close to major landmarks, shopping districts, and cultural sites, making them convenient bases for both first-time visitors and returning travelers. Modern hotels in the city often emphasize clean lines, natural materials, curated lighting, and spacious layouts, while still preserving elements of Parisian elegance.",
      },
      {
        type: "bullets",
        items: [
          "Le Horizon — A slim glass tower on the edge of the city centre, pairing minimal suites with a rooftop bar that looks out over Paris at sunset. Guests often choose it for its calm design, attentive service, and sweeping views.",
          "Hôtel Atelier — A light-filled modern building a short walk from the Louvre, offering spacious rooms with private balconies, family suites, and a relaxed all-day restaurant, with clean contemporary interiors throughout.",
        ],
      },
      {
        type: "paragraph",
        text: "Across the Paris hospitality market, occupancy rates in upscale hotels have remained relatively consistent in recent months, indicating stable demand rather than sharp seasonal swings. Visitors planning a stay should keep in mind that the local currency is the Euro, and everyday experiences often include sampling classic Parisian foods such as macarons, crêpes, pastries, and café dishes. The city's public transportation system, including the metro, buses, and suburban trains, is extensive and efficient.",
      },
      {
        type: "paragraph",
        text: "Nearby, travellers often visit the Musée d'Orsay on the Left Bank, take a sunset cruise along the Seine, browse the design boutiques of Le Marais, or spend an evening moving between the wine bars of Saint-Germain-des-Prés. Many of these experiences can be booked in advance, and some hotels arrange them through their concierge desks.",
      },
      {
        type: "paragraph",
        text: "In terms of timing, spring is popular for its mild weather, blooming streets, and longer daylight hours, while early autumn offers comfortable temperatures and fewer crowds.",
      },
    ],
  },
  /* Photos: Unsplash License, modern hotel-style buildings; see
     public/homepage/paris/photo-credits.txt. */
  right: {
    label: "With OpenUI",
    blocks: [
      { type: "heading", text: "Modern Hotels in Paris" },
      {
        type: "muted",
        text: "Our best recommendations for a modern stay, picked for your trip.",
      },
      {
        type: "cards",
        variant: "poster",
        cards: [
          {
            image: "/homepage/paris/hotel-1.jpg",
            imageAlt: "A glass tower against a sunset sky",
            badge: { label: "Free Wifi", icon: <Wifi aria-hidden />, tone: "green" },
            title: "Le Horizon",
            description: "Rooftop",
            rating: "4.7",
            priceLevel: 3,
          },
          {
            image: "/homepage/paris/hotel-2.jpg",
            imageAlt: "A white gridded tower seen from below",
            badge: { label: "Family-friendly", icon: <Heart aria-hidden />, tone: "purple" },
            title: "Hôtel Atelier",
            description: "Central",
            rating: "4.5",
            priceLevel: 1,
          },
          {
            image: "/homepage/paris/hotel-3.jpg",
            imageAlt: "A brick and timber building under a pale sky",
            badge: { label: "Spa", icon: <Waves aria-hidden />, tone: "blue" },
            title: "Maison Bois",
            description: "Timber",
            rating: "4.6",
            priceLevel: 2,
          },
          {
            image: "/homepage/paris/hotel-4.jpg",
            imageAlt: "A lit glass tower against an evening sky",
            badge: { label: "Design pick", icon: <Sparkles aria-hidden />, tone: "amber" },
            title: "Verre Seine",
            description: "Riverside",
            rating: "4.8",
            priceLevel: 3,
          },
        ],
      },
      {
        type: "tiles",
        tiles: [
          { icon: <Sun aria-hidden />, tone: "yellow", value: "Sunny, 24° all week" },
          { icon: <TrainFront aria-hidden />, tone: "blue", value: "Metro within 5 minutes" },
          { icon: <Coins aria-hidden />, tone: "green", value: "All prices in euros" },
        ],
      },
      {
        type: "feature",
        badge: { label: "Top pick", icon: <Award aria-hidden />, tone: "amber" },
        image: "/homepage/paris/hotel-feature.jpg",
        imageAlt: "A rounded building wrapped in terracotta fins under a blue sky",
        title: "Villa Lumière",
        rating: "4.9",
        reviews: "(812 reviews)",
        description: "A terracotta boutique hotel in Montmartre, just twelve suites.",
        tags: ["Free Wifi", "Spa", "Montmartre"],
        price: "From €540 / night",
        action: "Book",
      },
    ],
  },
};
