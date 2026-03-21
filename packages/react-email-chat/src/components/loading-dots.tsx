"use client";

export function LoadingDots({ color }: { color: string }) {
  return (
    <>
      <style>{`
        @keyframes email-bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: color,
              animation: `email-bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
            }}
          />
        ))}
      </div>
    </>
  );
}
