// Renders the mascot artwork from public/mascot.svg. Replace that file to change the mascot.
export function Mascot({ size = 240, alt = "OpenUI x F1 mascot" }: { size?: number; alt?: string }) {
  return <img className="mascot" src="/mascot.svg" alt={alt} width={size} height={size} />;
}
