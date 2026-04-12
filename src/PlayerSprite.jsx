import { useRef, useEffect } from 'react';

const BASE = '/assets/sprites/player_character/side/';
const FPS  = 10;

const ANIMS = {
  idle:             { file:'side_idle.png',            frames:8,  loop:true  },
  attack:           { file:'side_attack1.png',         frames:4,  loop:false },
  attack2:          { file:'side_attack2.png',         frames:10, loop:false },
  spin_attack:      { file:'side_spin_attack.png',     frames:4,  loop:false },
  spin_attack_full: { file:'side_spin_attack_full.png',frames:12, loop:false },
  defend:           { file:'side_defend.png',          frames:3,  loop:false },
  hurt:             { file:'side_hurt.png',            frames:4,  loop:false },
  dodge:            { file:'side_dodge.png',           frames:7,  loop:false },
  run:              { file:'side_run.png',             frames:8,  loop:true  },
};

const imgCache = {};
function getImg(file) {
  if (!imgCache[file]) {
    const img = new Image();
    img.src = BASE + file;
    imgCache[file] = img;
  }
  return imgCache[file];
}
// Preload idle
getImg(ANIMS.idle.file);

export default function PlayerSprite({ animState = 'idle', onAnimDone, size = 160, flip = false }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const cbRef     = useRef(onAnimDone);
  const loopRef   = useRef({ frame:0, elapsed:0, lastTime:null, done:false, def:null, img:null });

  useEffect(() => { cbRef.current = onAnimDone; }, [onAnimDone]);

  useEffect(() => {
    const def = ANIMS[animState] || ANIMS.idle;
    const img = getImg(def.file);
    const s   = loopRef.current;

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

      if (!s.done) {
        s.elapsed += delta;
        while (s.elapsed >= interval) {
          s.elapsed -= interval;
          s.frame++;
          if (s.frame >= s.def.frames) {
            if (s.def.loop) { s.frame = 0; }
            else { s.frame = s.def.frames - 1; s.done = true; cbRef.current?.(); }
          }
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        if (s.img.complete && s.img.naturalWidth > 0) {
          if (flip) {
            ctx.save();
            ctx.translate(size, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(s.img, s.frame * 256, 0, 256, 256, 0, 0, size, size);
            ctx.restore();
          } else {
            ctx.drawImage(s.img, s.frame * 256, 0, 256, 256, 0, 0, size, size);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [animState, size, flip]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display:'block', imageRendering:'pixelated' }}
    />
  );
}
