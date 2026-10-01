"use client";

import { FinishLine } from "./finish-line";
import { Car3D } from "./car-3d";
import { Texture } from "./texture";

const swatch = (background: string, label: string, color: string) => (
  <div
    key={label}
    style={{ position: "relative", height: 140, background, borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "flex-end", padding: 12 }}
  >
    <span style={{ position: "relative", zIndex: 1, color, fontWeight: 700, fontSize: 13 }}>{label}</span>
    <Texture />
  </div>
);

export function TexturePreview() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {swatch("#E10600", "Red", "#F7F4F1")}
        {swatch("#15151E", "Carbon", "#F7F4F1")}
        {swatch("#F7F4F1", "Warm white", "#15151E")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <div style={{ position: "relative", height: 140, background: "#FF8000", borderRadius: 8, overflow: "hidden" }}>
          <Texture ink="#1E1919" dotSpacing={6} dotSize={1} blend="color-burn" />
        </div>
        <div style={{ position: "relative", height: 140, background: "#15151E", borderRadius: 8, overflow: "hidden" }}>
          <Texture paper="#E10600" dotSpacing={3} grain={1} />
        </div>
      </div>
      <p className="ref-note">
        Drop it last inside any <code>position: relative</code> box: <code>{"<Texture />"}</code>. Props:{" "}
        <code>ink</code>, <code>paper</code>, <code>dotSpacing</code>, <code>dotSize</code>, <code>grain</code>,{" "}
        <code>blend</code>, <code>opacity</code>.
      </p>
    </div>
  );
}

export function FinishLinePreview() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ borderRadius: 8, overflow: "hidden" }}>
        <FinishLine
          onFloor={
            <div style={{ position: "absolute", left: "50%", top: "38%", transform: "translateX(-50%)" }}>
              <Car3D width={170} />
            </div>
          }
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <div style={{ borderRadius: 8, overflow: "hidden", background: "#FFFFFF" }}>
          <FinishLine colorA="#F6B4B2" colorB="#F7F4F1" height={300} columns={18} />
        </div>
        <div style={{ borderRadius: 8, overflow: "hidden" }}>
          <FinishLine colorA="#E0DEDC" colorB="#F7F4F1" background="#FFFFFF" height={300} perspective={0} band={0.35} texture />
        </div>
      </div>
      <p className="ref-note">
        A static SVG floor, plain by default; <code>texture</code> adds the Texture print masked to its tiles, so the open area stays transparent.{" "}
        <code>onFloor</code> lays content (like the car) on the floor with the same perspective; children sit flat on top.
        Props: <code>onFloor</code>, <code>colorA</code>, <code>colorB</code>, <code>background</code>, <code>columns</code>,{" "}
        <code>band</code>, <code>fadeRows</code>, <code>perspective</code>, <code>texture</code>, <code>ink</code>,{" "}
        <code>paper</code>, <code>height</code>.
      </p>
    </div>
  );
}
