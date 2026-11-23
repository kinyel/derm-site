/**
 * Worker: checks for hardware-accelerated WebGL2 off the main thread.
 * Creating a WebGL context can take seconds on machines that fall back to software rendering,
 * so the page never does it on the main thread before it knows the answer.
 */
self.onmessage = () => {
  let hardware = false;
  try {
    const gl = new OffscreenCanvas(1, 1).getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
      hardware = !/swiftshader|llvmpipe|software|microsoft basic render/i.test(gpu);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    hardware = false;
  }
  (self as unknown as { postMessage: (m: boolean) => void }).postMessage(hardware);
};
