import { useCallback, useRef, useState } from "react";

const SALT = "botgpt-trial-v1";

// FNV-1a hash used as a tamper check on the stored count.
const checksum = (value) => {
  const text = `${SALT}:${value}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};

// Display counter for the free requests. The server (api/chat.js) enforces
// the real limit; applyServer() overwrites the local value with its count.
export default function useFreeTrial(limit, storageKey) {
  const memory = useRef(0);

  const read = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) return memory.current;
      const [count, sum] = raw.split(".");
      const n = Number(count);
      if (!Number.isInteger(n) || n < 0 || sum !== checksum(n)) {
        return limit; // tampered
      }
      return n;
    } catch {
      return memory.current;
    }
  }, [storageKey, limit]);

  const write = useCallback(
    (value) => {
      memory.current = value;
      try {
        localStorage.setItem(storageKey, `${value}.${checksum(value)}`);
      } catch {
        // storage blocked: the in-memory value above still applies
      }
    },
    [storageKey]
  );

  const [used, setUsed] = useState(read);

  const isExhausted = useCallback(() => read() >= limit, [read, limit]);

  const sync = useCallback(() => setUsed(read()), [read]);

  const consume = useCallback(() => {
    const next = read() + 1;
    write(next);
    setUsed(next);
  }, [read, write]);

  // Give the message back when a request fails before any answer arrives.
  const refund = useCallback(() => {
    const next = Math.max(0, read() - 1);
    write(next);
    setUsed(next);
  }, [read, write]);

  // Replace the local count with the server's remaining count.
  const applyServer = useCallback(
    (remainingFromServer) => {
      const next = Math.min(limit, Math.max(0, limit - remainingFromServer));
      write(next);
      setUsed(next);
    },
    [limit, write]
  );

  const remaining = Math.max(0, limit - used);

  return {
    used,
    remaining,
    trialEnded: remaining === 0,
    isExhausted,
    sync,
    consume,
    refund,
    applyServer,
  };
}