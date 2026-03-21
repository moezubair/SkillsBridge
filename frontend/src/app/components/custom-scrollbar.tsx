import { useEffect, useRef, useState, useCallback } from "react";

export function CustomScrollbar() {
  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const update = useCallback(() => {
    const doc = document.documentElement;
    const viewH = window.innerHeight;
    const scrollH = doc.scrollHeight;
    if (scrollH <= viewH) {
      setThumbHeight(0);
      return;
    }
    const ratio = viewH / scrollH;
    const trackH = viewH - 24; // 12px padding top+bottom
    const thumb = Math.max(ratio * trackH, 32);
    const scrollFraction = doc.scrollTop / (scrollH - viewH);
    const top = scrollFraction * (trackH - thumb);
    setThumbHeight(thumb);
    setThumbTop(top);
  }, []);

  const showScrollbar = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!dragging) setVisible(false);
    }, 1200);
  }, [dragging]);

  useEffect(() => {
    update();
    const onScroll = () => {
      update();
      showScrollbar();
    };
    const onResize = () => update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [update, showScrollbar]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStartY.current = e.clientY;
    dragStartScroll.current = document.documentElement.scrollTop;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const doc = document.documentElement;
      const viewH = window.innerHeight;
      const scrollH = doc.scrollHeight;
      const trackH = viewH - 24;
      const delta = e.clientY - dragStartY.current;
      const scrollDelta = (delta / (trackH - thumbHeight)) * (scrollH - viewH);
      window.scrollTo(0, dragStartScroll.current + scrollDelta);
    };
    const onUp = () => {
      setDragging(false);
      hideTimer.current = setTimeout(() => setVisible(false), 1200);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, thumbHeight]);

  const onTrackClick = (e: React.MouseEvent) => {
    if (e.target === thumbRef.current) return;
    const doc = document.documentElement;
    const viewH = window.innerHeight;
    const scrollH = doc.scrollHeight;
    const trackH = viewH - 24;
    const trackRect = trackRef.current!.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const fraction = clickY / trackH;
    window.scrollTo({ top: fraction * (scrollH - viewH), behavior: "smooth" });
  };

  if (thumbHeight === 0) return null;

  return (
    <div
      ref={trackRef}
      onClick={onTrackClick}
      className="fixed top-3 right-1 bottom-3 w-3 z-[9999] cursor-pointer"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => {
        if (!dragging) setVisible(false);
      }}
    >
      {/* Thumb */}
      <div
        ref={thumbRef}
        onPointerDown={onPointerDown}
        className="absolute left-1 right-1 rounded-full transition-opacity duration-300 cursor-grab active:cursor-grabbing"
        style={{
          height: thumbHeight,
          top: thumbTop,
          opacity: visible || dragging ? 1 : 0,
          backgroundColor: "#9B1B30",
        }}
      />
    </div>
  );
}
