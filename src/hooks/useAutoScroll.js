import { useEffect } from "react";

// Keeps the newest message in view. "auto" while text is typing avoids a
// jittery smooth-scroll on every frame; "smooth" otherwise.
export default function useAutoScroll(bottomRef, { messages, loading, screen, streaming }) {
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth" });
  }, [bottomRef, messages, loading, screen, streaming]);
}
