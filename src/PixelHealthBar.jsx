import { useRef, useEffect } from 'react';

const BASE = '/assets/sprites/ui/pixel_health_bar/';

// Bar dimensions per size
const SIZES = {
  sm: { w:256, h:32,  barW:220, barX:18, barY:8  },
  md: { w:384, h:48,  barW:330, barX:27, barY:12 },
  lg: { w:512, h:64,  barW:440, barX:36, barY:16 },
};

const imgCache = {};
function getImg(key) {
  if (!imgCache[key]) {
    const img = new Image();
    img.src = BASE + key;
    imgCache[key] = img;
  }
  return imgCache[key];
}

// Preload all
['sm','md','lg'].forEach(s => {
  ['health_fill','health_bar_empty','health_bar_gone'].forEach(k => getImg(`${k}_${s}.png`));
});

/**
 * PixelHealthBar
 * size:    'sm' | 'md' | 'lg'
 * current: current HP
 * max:     max HP
 * scale:   CSS display scale (default 1)
 * flashKey: increment to trigger red flash
 */
export default function PixelHealthBar({ size = 'md', current, max, scale = 1, flashKey = 0 }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const flashRef  = useRef(0);
  const propsRef  = useRef({ size, current, max });
  const lastRef   = useRef(null);

  useEffect(() => { propsRef.current = { size, current, max }; }, [size, current, max]);
  useEffect(() => { if (flashKey > 0) flashRef.current = 300; }, [flashKey]);

  useEffect(() => {
    function tick(now) {
      if (!lastRef.current) lastRef.current = now;
      const delta = now - lastRef.current;
      lastRef.current = now;
      if (flashRef.current > 0) flashRef.current = Math.max(0, flashRef.current - delta);

      const { size, current, max } = propsRef.current;
      const dim = SIZES[size];
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(tick); return; }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, dim.w, dim.h);

      const fillImg  = imgCache[`health_fill_${size}.png`];
      const emptyImg = imgCache[`health_bar_empty_${size}.png`];
      const pct = Math.max(0, Math.min(1, current / max));
      const fillW = Math.round(dim.barW * pct);

      // Draw fill clipped to current HP
      if (fillImg?.complete && fillImg.naturalWidth > 0 && fillW > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(dim.barX, dim.barY, fillW, dim.h - dim.barY * 2);
        ctx.clip();
        ctx.drawImage(fillImg, 0, 0, dim.w, dim.h);
        ctx.restore();
      }

      // Draw empty bar frame on top
      if (emptyImg?.complete && emptyImg.naturalWidth > 0) {
        ctx.drawImage(emptyImg, 0, 0, dim.w, dim.h);
      }

      // Flash overlay
      if (flashRef.current > 0) {
        ctx.save();
        ctx.globalAlpha = (flashRef.current / 300) * 0.5;
        ctx.fillStyle   = '#ff2222';
        ctx.fillRect(dim.barX, dim.barY, dim.barW, dim.h - dim.barY * 2);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const dim = SIZES[size];
  return (
    <canvas
      ref={canvasRef}
      width={dim.w}
      height={dim.h}
      style={{ display:'block', imageRendering:'pixelated', width: dim.w * scale, height: dim.h * scale }}
    />
  );
}
