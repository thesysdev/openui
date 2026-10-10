import { useEffect, useRef } from "react";

/* A port of the docs site's "Faded Dither" (docs/app/(home)/components/
 * FadedDither): a soft sine wave run through a Bayer 8x8 ordered dither.
 * The site renders it with the `shaders` package, which is WebGPU only and too
 * heavy to ship in this library, so this is the same maths in one WebGL
 * fragment shader with the preset's values.
 *
 * Only the stipple is drawn. The site lays the dither over a solid base that
 * matches its band; here the page itself is the base, so the canvas stays
 * transparent and the stipple colour comes from CSS (`color` on the canvas),
 * which lets it follow the theme.
 */

const WAVE = {
  angle: 24,
  frequency: 0.5,
  amplitude: 0.15,
  thickness: 0.4,
  softness: 0.7,
  speed: 1.2,
  position: { x: 0.69, y: 0.7 },
};
/* How far, in CSS px, the ink reaches out from the composer as it appears.
   Over the canvas's CSS animation this pulls in to nothing, so the dots run
   toward the input and merge into it. */
const FALLOFF = 360;
/* >1 holds the spread a beat, then pulls in fast. */
const CONVERGE_EASE = 1.6;

const DITHER = { threshold: 0.41, spread: 1, pixelSize: 4 };

const VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_pixel;
uniform float u_time;
uniform vec4 u_color;
// The composer's box in canvas pixels (centre xy, half size zw), y up.
uniform vec4 u_box;
uniform float u_falloff;

const float TAU = 6.28318530718;

float bayerQuad(float a, float b) {
  return b * 3.0 + a * 2.0 - a * b * 4.0;
}

float bayer8(vec2 coord) {
  vec2 t = mod(coord, 8.0);
  vec2 c2 = mod(t, 2.0);
  vec2 c4 = floor(mod(t, 4.0) / 2.0);
  vec2 c8 = floor(t / 4.0);
  return (bayerQuad(c2.x, c2.y) * 16.0 + bayerQuad(c4.x, c4.y) * 4.0 + bayerQuad(c8.x, c8.y)) / 64.0;
}

float sineWave(vec2 uv) {
  float aspect = u_resolution.x / max(u_resolution.y, 1e-6);
  vec2 p = vec2(uv.x * aspect - ${WAVE.position.x.toFixed(4)} * aspect, uv.y - (1.0 - ${WAVE.position.y.toFixed(4)}));
  float a = radians(${WAVE.angle.toFixed(4)});
  vec2 r = vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
  float wave = sin(r.x * ${WAVE.frequency.toFixed(4)} * TAU + u_time) * ${WAVE.amplitude.toFixed(4)};
  float d = abs(r.y - wave);
  float halfThickness = ${(WAVE.thickness / 2).toFixed(4)};
  float halfSoftness = ${(WAVE.softness / 2).toFixed(4)};
  return 1.0 - smoothstep(halfThickness - halfSoftness, halfThickness + halfSoftness, d);
}

void main() {
  vec2 coord = floor(gl_FragCoord.xy / u_pixel);
  vec2 uv = (coord + 0.5) * u_pixel / u_resolution;
  // Ink thickens towards the composer: distance to its box drives a ramp,
  // and the site's wave only modulates it, so the motion stays but the
  // picture reads as a gradient into the input.
  vec2 q = abs((coord + 0.5) * u_pixel - u_box.xy) - u_box.zw;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float ramp = 1.0 - smoothstep(0.0, u_falloff, d);
  float luminance = ramp * ramp * mix(0.65, 1.0, sineWave(uv));
  float threshold = 0.5 + (bayer8(coord) - 0.5) * ${DITHER.spread.toFixed(4)};
  float on = step(threshold, luminance + ${(DITHER.threshold - 0.5).toFixed(4)});
  gl_FragColor = vec4(u_color.rgb * u_color.a * on, u_color.a * on);
}
`;

/* getComputedStyle hands back rgb()/rgba() or, for color-mix, color(srgb ...);
   both list the channels in order, rgb as 0-255 and srgb as 0-1. */
function readColor(el: Element): [number, number, number, number] {
  const value = getComputedStyle(el).color;
  const nums = (value.match(/[\d.]+/g) ?? []).map(Number);
  if (value.startsWith("color(")) {
    const [r = 0, g = 0, b = 0, a = 1] = nums;
    return [r, g, b, a];
  }
  const [r = 0, g = 0, b = 0, a = 1] = nums;
  return [r / 255, g / 255, b / 255, a];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Draws the dither every frame until unmounted. The caller owns when it shows
 * and fades (through CSS on `className`); this only draws frames.
 */
export const WelcomeDither = ({
  className,
  onDone,
}: {
  className?: string;
  /** Fires when the canvas's CSS animation ends, so drawing can stop. */
  onDone?: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Hidden by CSS under reduced motion, where no animationend would come.
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uPixel = gl.getUniformLocation(program, "u_pixel");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uColor = gl.getUniformLocation(program, "u_color");
    const uBox = gl.getUniformLocation(program, "u_box");
    const uFalloff = gl.getUniformLocation(program, "u_falloff");

    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolution, width, height);
      gl.uniform1f(uPixel, DITHER.pixelSize * dpr);
      gl.uniform4f(uColor, ...readColor(canvas));
      // The canvas sits inside the composer's wrapper, so that is the box.
      const box = canvas.parentElement?.getBoundingClientRect() ?? rect;
      gl.uniform4f(
        uBox,
        (box.left + box.width / 2 - rect.left) * dpr,
        (rect.bottom - (box.top + box.height / 2)) * dpr,
        (box.width / 2) * dpr,
        (box.height / 2) * dpr,
      );
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // Converge over the same window as the CSS fade (delay + duration).
    const style = getComputedStyle(canvas);
    const delayMs = (parseFloat(style.animationDelay) || 0) * 1000;
    const durationMs = (parseFloat(style.animationDuration) || 1) * 1000;

    let frame = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const progress = Math.min(Math.max((now - start - delayMs) / durationMs, 0), 1);
      const dpr = window.devicePixelRatio || 1;
      gl.uniform1f(uFalloff, Math.max(FALLOFF * (1 - progress ** CONVERGE_EASE), 1) * dpr);
      gl.uniform1f(uTime, ((now - start) / 1000) * WAVE.speed);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onDone?.();
      }}
    />
  );
};
