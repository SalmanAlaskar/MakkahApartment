"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export function SignaturePad({
  inputName,
  clearLabel,
  emptyHint,
}: {
  inputName: string;
  clearLabel: string;
  emptyHint: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const hasDrawnRef = useRef(false);

  // A native listener on the closest <form> fires when the submit event reaches its target
  // (the form), which happens before React's own delegated bubble-phase submit handler at the
  // root -- so the hidden input is populated before formAction reads FormData. Attaching this
  // via React's onSubmit on an ancestor of the form wouldn't work: this component renders
  // INSIDE the form, and submit only propagates to the target's ancestors, never its
  // descendants.
  useEffect(() => {
    const form = canvasRef.current?.closest("form");
    if (!form) return;
    const handler = () => {
      const canvas = canvasRef.current;
      if (!canvas || !hiddenInputRef.current) return;
      hiddenInputRef.current.value = hasDrawnRef.current ? canvas.toDataURL("image/png") : "";
    };
    form.addEventListener("submit", handler, true);
    return () => form.removeEventListener("submit", handler, true);
  }, []);

  function getContext() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function pointFromEvent(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const ctx = getContext();
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = getContext();
    if (!ctx) return;
    const { x, y } = pointFromEvent(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e2a37";
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true;
      setHasDrawn(true);
    }
  }

  function handlePointerUp() {
    drawingRef.current = false;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setHasDrawn(false);
    if (hiddenInputRef.current) hiddenInputRef.current.value = "";
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg border border-stone-dark bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="block h-[150px] w-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {!hasDrawn && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-ink-faint">
            {emptyHint}
          </p>
        )}
      </div>
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={handleClear} className="text-xs font-medium text-ink-muted hover:text-brand">
          {clearLabel}
        </button>
      </div>
      <input ref={hiddenInputRef} type="hidden" name={inputName} />
    </div>
  );
}
