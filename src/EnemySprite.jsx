import { useRef, useEffect } from 'react';

const BASE = '/assets/sprites/';
const FPS = 10;

// Animation definitions per sprite key
const ANIM_DATA = {
  goblin: {
    idle:     { file:'monsters/goblin/goblin_idle.png',     frames:4,  fw:256, fh:256, loop:true  },
    attack:   { file:'monsters/goblin/goblin_attack.png',   frames:8,  fw:256, fh:256, loop:false },
    take_hit: { file:'monsters/goblin/goblin_take_hit.png', frames:4,  fw:256, fh:256, loop:false },
    death:    { file:'monsters/goblin/goblin_death.png',    frames:4,  fw:256, fh:256, loop:false },
  },
  skeleton: {
    idle:     { file:'monsters/skeleton/skeleton_idle.png',     frames:4,  fw:256, fh:256, loop:true  },
    attack:   { file:'monsters/skeleton/skeleton_attack.png',   frames:8,  fw:256, fh:256, loop:false },
    take_hit: { file:'monsters/skeleton/skeleton_take_hit.png', frames:4,  fw:256, fh:256, loop:false },
    death:    { file:'monsters/skeleton/skeleton_death.png',    frames:4,  fw:256, fh:256, loop:false },
  },
  mushroom: {
    idle:     { file:'monsters/mushroom/mushroom_idle.png',     frames:4,  fw:256, fh:256, loop:true  },
    attack:   { file:'monsters/mushroom/mushroom_attack.png',   frames:8,  fw:256, fh:256, loop:false },
    take_hit: { file:'monsters/mushroom/mushroom_take_hit.png', frames:4,  fw:256, fh:256, loop:false },
    death:    { file:'monsters/mushroom/mushroom_death.png',    frames:4,  fw:256, fh:256, loop:false },
  },
  flying_eye: {
    idle:     { file:'monsters/flying_eye/flying_eye_flight.png',   frames:8,  fw:256, fh:256, loop:true  },
    attack:   { file:'monsters/flying_eye/flying_eye_attack.png',   frames:8,  fw:256, fh:256, loop:false },
    take_hit: { file:'monsters/flying_eye/flying_eye_take_hit.png', frames:4,  fw:256, fh:256, loop:false },
    death:    { file:'monsters/flying_eye/flying_eye_death.png',    frames:4,  fw:256, fh:256, loop:false },
  },
};

// Global image cache — persists across renders
const imgCache = {};
function getImg(file) {
  if (!imgCache[file]) {
    const img = new Image();
    img.src = BASE + file;
    imgCache[file] = img;
  }
  return imgCache[file];
}

export default function EnemySprite({ spriteKey, animState = 'idle', onAnimDone, size = 160 }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const cbRef     = useRef(onAnimDone);
  const loopRef   = useRef({ frame:0, elapsed:0, lastTime:null, done:false, def:null, img:null });

  // Keep callback ref current without restarting the loop
  useEffect(() => { cbRef.current = onAnimDone; }, [onAnimDone]);

  useEffect(() => {
    const anims = ANIM_DATA[spriteKey];
    if (!anims) return;

    const def = anims[animState] || anims['idle'];
    const img = getImg(def.file);

    // Reset playhead for new animation
    const s = loopRef.current;
    s.frame   = 0;
    s.elapsed = 0;
    s.lastTime = null;
    s.done    = false;
    s.def     = def;
    s.img     = img;

    const interval = 1000 / FPS;

    function tick(now) {
      if (!s.lastTime) s.lastTime = now;
      const delta = now - s.lastTime;
      s.lastTime = now;

      // Advance frame
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

      // Draw
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (s.img.complete && s.img.naturalWidth > 0) {
          ctx.drawImage(s.img, s.frame * s.def.fw, 0, s.def.fw, s.def.fh, 0, 0, size, size);
        }
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
