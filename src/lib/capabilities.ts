export type Capabilities = {
  webgl: boolean;
  webgl2: boolean;
  reducedMotion: boolean;
  coarsePointer: boolean;
  lowPower: boolean;
  mobile: boolean;
  gpu: string;
};

let cached: Capabilities | null = null;

export function detectCapabilities(): Capabilities {
  if (cached) return cached;
  if (typeof window === "undefined") {
    return {
      webgl: false,
      webgl2: false,
      reducedMotion: false,
      coarsePointer: false,
      lowPower: false,
      mobile: false,
      gpu: "",
    };
  }
  let webgl = false,
    webgl2 = false,
    gpu = "";
  try {
    const c = document.createElement("canvas");
    const gl2 = c.getContext("webgl2");
    webgl2 = !!gl2;
    const gl = (gl2 || c.getContext("webgl")) as WebGLRenderingContext | null;
    webgl = !!gl;
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    webgl = false;
  }
  const mq = (q: string) => window.matchMedia?.(q).matches ?? false;
  const coarsePointer = mq("(pointer: coarse)");
  const mobile = coarsePointer && Math.min(window.innerWidth, window.innerHeight) < 820;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8;
  const softwareGpu = /swiftshader|llvmpipe|software/i.test(gpu);
  cached = {
    webgl,
    webgl2,
    reducedMotion: mq("(prefers-reduced-motion: reduce)"),
    coarsePointer,
    mobile,
    lowPower: cores <= 4 || mem <= 4 || softwareGpu,
    gpu,
  };
  return cached;
}
