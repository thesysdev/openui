export default function Home() {
  return (
    <main style={{ padding: 32, fontFamily: "monospace" }}>
      <h1>Chat API</h1>
      <p>
        POST <code>/api/chat</code> with <code>{"{ messages: [{ role, content }] }"}</code>
      </p>
    </main>
  );
}
