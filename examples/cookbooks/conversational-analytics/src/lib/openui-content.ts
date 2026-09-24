// Cloud's inline envelope is display metadata, not OpenUI Lang.
// Keep the stored response intact; extract only the program for the Renderer.
const markers = ["]]>openui:content", "]]>openui:context", "]]>openui:end"];

export function extractProgram(raw: string): string {
  let program = raw;
  const content = program.lastIndexOf(markers[0]);
  if (content !== -1) {
    const newline = program.indexOf("\n", content);
    if (newline === -1) return "";
    program = program.slice(newline + 1);
  }
  for (const marker of markers.slice(1)) {
    const index = program.indexOf(marker);
    if (index !== -1) program = program.slice(0, index);
  }
  // A delta may stop halfway through a marker. Hide that tail until it arrives.
  for (const marker of markers) {
    for (let length = marker.length - 1; length > 0; length--) {
      if (program.endsWith(marker.slice(0, length))) {
        program = program.slice(0, -length);
        break;
      }
    }
  }
  return program.trimEnd();
}
