import { useRef, useEffect } from 'react';

const BASE = '/assets/sprites/';
const FPS  = 10;

// ── ANIMATION DATA ──────────────────────────────────────────────
// fw/fh = individual frame size in the sprite sheet
// frames = number of frames in the horizontal strip
// chroma = strip green background (for JPG sheets without transparency)
const ANIM_DATA = {
  goblin: {
    idle:     { file:'monsters/goblin/goblin_idle.png',     frames:4, fw:256, fh:256, loop:true  },
    attack:   { file:'monsters/goblin/goblin_attack.png',   frames:8, fw:256, fh:256, loop:false },
    take_hit: { file:'monsters/goblin/goblin_take_hit.png', frames:4, fw:256, fh:256, loop:false },
    death:    { file:'monsters/goblin/goblin_death.png',    frames:4, fw:256, fh:256, loop:false },
  },
  skeleton: {
    idle:     { file:'monsters/skeleton/skeleton_idle.png',     frames:4, fw:256, fh:256, loop:true  },
    attack:   { file:'monsters/skeleton/skeleton_attack.png',   frames:8, fw:256, fh:256, loop:false },
    take_hit: { file:'monsters/skeleton/skeleton_take_hit.png', frames:4, fw:256, fh:256, loop:false },
    death:    { file:'monsters/skeleton/skeleton_death.png',    frames:4, fw:256, fh:256, loop:false },
  },
  mushroom: {
    idle:     { file:'monsters/mushroom/mushroom_idle.png',     frames:4, fw:256, fh:256, loop:true  },
    attack:   { file:'monsters/mushroom/mushroom_attack.png',   frames:8, fw:256, fh:256, loop:false },
    take_hit: { file:'monsters/mushroom/mushroom_take_hit.png', frames:4, fw:256, fh:256, loop:false },
    death:    { file:'monsters/mushroom/mushroom_death.png',    frames:4, fw:256, fh:256, loop:false },
  },
  flying_eye: {
    idle:     { file:'monsters/flying_eye/flying_eye_flight.png',   frames:8, fw:256, fh:256, loop:true  },
    attack:   { file:'monsters/flying_eye/flying_eye_attack.png',   frames:8, fw:256, fh:256, loop:false },
    take_hit: { file:'monsters/flying_eye/flying_eye_take_hit.png', frames:4, fw:256, fh:256, loop:false },
    death:    { file:'monsters/flying_eye/flying_eye_death.png',    frames:4, fw:256, fh:256, loop:false },
  },
  // ── RAKSHASA (green-screen JPG sheets) ──
  rakshasa: {
    idle:     { file:'monsters/rakshasa/rakshasa_idle.jpg', frames:8, fw:250, fh:341, loop:true,  chroma:true },
    attack:   { file:'monsters/rakshasa/rakshasa_idle.jpg', frames:8, fw:250, fh:341, loop:false, chroma:true },
    take_hit: { file:'monsters/rakshasa/rakshasa_idle.jpg', frames:4, fw:250, fh:341, loop:false, chroma:true },
    death:    { file:'monsters/rakshasa/rakshasa_idle.jpg', frames:8, fw:250, fh:341, loop:false, chroma:true },
  },
};

// ── IMAGE + CHROMA CACHE ─────────────────────────────────────────
// Raw images
const imgCache = {};
// Processed offscreen canvases (after chroma key)
const chromaCache = {};

function getImg(file) {
  if (!imgCache[file]) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = BASE + file;
    imgCache[file] = img;
  }
  return imgCache[file];
}

// Strip green background from an image — returns an offscreen canvas.
// Cached after first call so we only pay the cost once per file.
function getChromaCanvas(file, img) {
  if (chromaCache[file]) return chromaCache[file];
  if (!img.complete || !img.naturalWidth) return null;

  const oc  = document.createElement('canvas');
  oc.width  = img.naturalWidth;
  oc.height = img.naturalHeight;
  const ctx = oc.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, oc.width, oc.height);
  const d = imageData.data;

  // Threshold for "close enough to chroma-green"
  // JPEG compression smears the exact #00FF00, so use a loose distance check
  const THRESHOLD = 90;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const dr = r - 0, dg = g - 255, db = b - 0;
    if (Math.sqrt(dr * dr + dg * dg + db * db) < THRESHOLD) {
      d[i + 3] = 0; // fully transparent
    }
  }

  ctx.putImageData(imageData, 0, 0);
  chromaCache[file] = oc;
  return oc;
}

// ── COMPONENT ────────────────────────────────────────────────────
export default function EnemySprite({ spriteKey, animState = 'idle', onAnimDone, size = 160 }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const cbRef     = useRef(onAnimDone);
  const loopRef   = useRef({ frame:0, elapsed:0, lastTime:null, done:false, def:null, img:null });

  useEffect(() => { cbRef.current = onAnimDone; }, [onAnimDone]);

  useEffect(() => {
    const anims = ANIM_DATA[spriteKey];
    if (!anims) return;

    const def = anims[animState] || anims['idle'];
    const img = getImg(def.file);

    const s = loopRef.current;
    s.frame    = 0;
    s.elapsed  = 0;
    s.lastTime = null;
    s.done     = false;
    s.def      = def;
    s.img      = img;

    const interval = 1000 / FPS;

    // Render aspect — keep character proportions, fit in square canvas
    const aspect = def.fw / def.fh;
    const drawH  = size;
    const drawW  = size * aspect;
    const offX   = (size - drawW) / 2;

    function drawFrame(source) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(
        source,
        s.frame * def.fw, 0, def.fw, def.fh,  // source slice
        offX, 0, drawW, drawH,                  // dest (centred)
      );
    }

    function tick(now) {
      if (!s.lastTime) s.lastTime = now;
      const delta = now - s.lastTime;
      s.lastTime  = now;

      if (!s.done) {
        s.elapsed += delta;
        while (s.elapsed >= interval) {
          s.elapsed -= interval;
          s.frame++;
          if (s.frame >= s.def.frames) {
            if (s.def.loop) {
              s.frame = 0;
            } else {
              s.frame = s.def.frames - 1;
              s.done  = true;
              cbRef.current?.();
            }
          }
        }
      }

      // For chroma sheets: use processed offscreen canvas
      if (def.chroma) {
        const cc = getChromaCanvas(def.file, s.img);
        if (cc) {
          drawFrame(cc);
        } else {
          // Image not ready yet — try again next frame, set onload to force redraw
          if (!s.img._chromaListenerSet) {
            s.img._chromaListenerSet = true;
            s.img.onload = () => { s.img._chromaListenerSet = false; };
          }
        }
      } else {
        if (s.img.complete && s.img.naturalWidth > 0) drawFrame(s.img);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [spriteKey, animState, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ imageRendering:'pixelated', display:'block' }}
    />
  );
}
