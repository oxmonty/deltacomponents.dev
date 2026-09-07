"use client";

import { Code } from "@/registry/default/code";

const LONG_SAMPLE = `import { useEffect, useState } from "react";

export function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}`;

export default function CodeExpandable() {
  return (
    <div className="w-full max-w-[520px]">
      <Code
        filename="hooks.ts"
        language="typescript"
        code={LONG_SAMPLE}
        expandable
        collapsedHeight="10rem"
      />
    </div>
  );
}
