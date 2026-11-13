import { useCallback, useEffect, useRef } from "react";

// Reveals streamed text a little each frame. The bigger the backlog, the
// faster it reveals, so the display never falls far behind the API.
//
//   start(onFrame, onComplete)  begin a new reveal
//   push(text)                  add newly received text
//   finish()                    no more text is coming
//   cancel()                    stop immediately
export default function useTypewriter() {
  const state = useRef({ received: "", shown: 0, finished: false, raf: null });

  const cancel = useCallback(() => {
    const s = state.current;
    if (s.raf !== null) cancelAnimationFrame(s.raf);
    s.raf = null;
  }, []);

  // Stop the animation loop if the component unmounts mid-stream.
  useEffect(() => cancel, [cancel]);

  const start = useCallback(
    (onFrame, onComplete) => {
      cancel();
      const s = state.current;
      s.received = "";
      s.shown = 0;
      s.finished = false;

      const tick = () => {
        const backlog = s.received.length - s.shown;
        if (backlog > 0) {
          s.shown = Math.min(s.received.length, s.shown + Math.max(3, Math.ceil(backlog / 8)));
          onFrame(s.received.slice(0, s.shown));
        }
        if (s.finished && s.shown >= s.received.length) {
          s.raf = null;
          onComplete?.();
          return;
        }
        s.raf = requestAnimationFrame(tick);
      };

      s.raf = requestAnimationFrame(tick);
    },
    [cancel]
  );

  const push = useCallback((text) => {
    state.current.received += text;
  }, []);

  const finish = useCallback(() => {
    state.current.finished = true;
  }, []);

  return { start, push, finish, cancel };
}
