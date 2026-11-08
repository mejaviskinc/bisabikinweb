import {useEffect, useRef, useState} from 'react';

/**
 * Accessible seamless auto-scrolling announcement.
 * Repeats are visual-only; screen readers get the promotion once.
 */
export default function AnnouncementTicker({message}: {message:string}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sampleRef = useRef<HTMLSpanElement>(null);
  const segmentRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(3);
  const [duration, setDuration] = useState(26);

  useEffect(() => {
    const viewport = viewportRef.current;
    const sample = sampleRef.current;
    if (!viewport || !sample) return;
    const recalc = () => {
      const vw = viewport.getBoundingClientRect().width;
      const textWidth = sample.getBoundingClientRect().width;
      if (!vw || !textWidth) return;
      // Enough copies to cover the entire ribbon, including shorter promotions.
      const needed = Math.min(24, Math.max(2, Math.ceil(vw / textWidth) + 1));
      setCopies(current => current === needed ? current : needed);
    };
    recalc();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', recalc);
      return () => window.removeEventListener('resize', recalc);
    }
    const observer = new ResizeObserver(recalc);
    observer.observe(viewport);
    observer.observe(sample);
    return () => observer.disconnect();
  }, [message]);

  useEffect(() => {
    const width = segmentRef.current?.getBoundingClientRect().width || 0;
    if (!width) return;
    const seconds = Math.max(18, Math.min(90, Math.round(width / 38)));
    setDuration(current => current === seconds ? current : seconds);
  }, [copies, message]);

  return (
    <div
      ref={viewportRef}
      className="announcement-ticker"
      role="marquee"
      aria-label={message}
      aria-live="off"
    >
      <div
        className="announcement-track"
        aria-hidden="true"
        style={{animationDuration: duration + 's'}}
      >
        {[0,1].map(group => (
          <div
            className="announcement-segment"
            key={group}
            ref={group === 0 ? segmentRef : undefined}
          >
            {Array.from({length:copies}, (_,i) => (
              <span
                className="announcement-text"
                key={i}
                ref={group === 0 && i === 0 ? sampleRef : undefined}
              >{message}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
