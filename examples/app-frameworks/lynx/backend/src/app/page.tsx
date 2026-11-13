const codeStyle = {
  borderRadius: 8,
  background: "#eef2ff",
  color: "#3730a3",
  padding: "3px 7px",
} as const;

export default function Home() {
  return (
    <main
      style={{
        boxSizing: "border-box",
        minHeight: "100vh",
        padding: "64px 24px",
        background: "#f8fafc",
        color: "#172033",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <section style={{ maxWidth: 680, margin: "0 auto" }}>
        <p style={{ color: "#6366f1", fontWeight: 700, letterSpacing: 1 }}>OPENUI × LYNX</p>
        <h1 style={{ margin: "12px 0", fontSize: 42 }}>Chat backend is running</h1>
        <p style={{ color: "#64748b", fontSize: 18, lineHeight: 1.6 }}>
          Send a <code style={codeStyle}>POST</code> request to{" "}
          <code style={codeStyle}>/api/chat</code> with a JSON{" "}
          <code style={codeStyle}>messages</code> array. The response is a raw, progressively
          streamed OpenUI Lang program.
        </p>
        <p style={{ marginTop: 28, color: "#475569" }}>
          Model: <strong>{process.env.OPENUI_MODEL || "google/gemini-3.6-flash-free"}</strong> · API
          key: <strong>{process.env.THESYS_API_KEY ? "configured" : "missing"}</strong>
        </p>
      </section>
    </main>
  );
}
