import { useRef, useEffect } from 'react';

const BASE = '/assets/sprites/';
const VFX_SIZE = 192;

// Card vfx key → single holy spell animation
const ATTACK_ANIMATIONS = {
  strike:       { file:'holy_spells/holy_crescent.png',  frames:4,  fps:39 },
  heavy_strike: { file:'holy_spells/holy_wind_slash.png',frames:16, fps:39 },
  pierce:       { file:'holy_spells/holy_orb_spin.png',  frames:16, fps:34 },
  aoe:          { file:'holy_spells/fire_swirl.png',     frames:8,  fps:39 },
  exhaust:      { file:'holy_spells/ancient_spiral.png', frames:10, fps:39 },
  poison:       { file:'holy_spells/shadow_swirl.png',   frames:10, fps:34 },
  karma:        { file:'holy_spells/holy_mandala.png',   frames:7,  fps:34 },
  wrath:        { file:'holy_spells/fire_swirl.png',     frames:8,  fps:45 },
  hits2:        { file:'holy_spells/holy_wind_slash.png',frames:16, fps:45 },
  default:      { file:'holy_spells/holy_orb_spin.png',  frames:16, fps:34 },
};

// Image cache
const imgCache = {};
function getImg(file) {
  if (!imgCache[file]) {
    const img = new Image();
    img.src = BASE + file;
    imgCache[file] = img;
  }
  return imgCache[file];
}

/**
 * AttackVFX — overlays a hit effect animation on top of the enemy.
 * Props:
 *   vfxKey   — key from ATTACK_ANIMATIONS (e.g. "strike", "poison")
 *   trigger  — increment to play the animation
 *   onDone   — called when the full effect+impact sequence finishes
 *   size     — canvas size in px (default 192)
 */
export default function AttackVFX({ vfxKey = 'default', trigger = 0, onDone, size = VFX_SIZE }) {
  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const stateRef   = useRef({ active:false });
  const cbRef      = useRef(onDone);
  useEffect(() => { cbRef.current = onDone; }, [onDone]);

  useEffect(() => {
    if (trigger === 0) return;

    const config = ATTACK_ANIMATIONS[vfxKey] || ATTACK_ANIMATIONS.default;
    const img = getImg(config.file);

    const s = stateRef.current;
    s.frame   = 0;
    s.elapsed = 0;
    s.lastTime = null;
    s.config  = config;
    s.img     = img;

    const interval = 1000 / config.fps;

    function tick(now) {
      if (!s.lastTime) s.lastTime = now;
      const delta = now - s.lastTime;
      s.lastTime = now;
      s.elapsed += delta;

      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(tick); return; }
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      while (s.elapsed >= interval) {
        s.elapsed -= interval;
        s.frame++;
        if (s.frame >= s.config.frames) {
          ctx.clearRect(0, 0, size, size);
          cbRef.current?.();
          return;
        }
      }

      if (s.img.complete && s.img.naturalWidth > 0) {
        ctx.drawImage(s.img, s.frame * 64, 0, 64, 64, 0, 0, size, size);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger, vfxKey, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        position:'absolute',
        top:'45%', left:'50%',
        transform:'translate(-50%, -50%)',
        imageRendering:'pixelated',
        pointerEvents:'none',
        zIndex:10,
      }}
    />
  );
}
