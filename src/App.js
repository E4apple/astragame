import { useState, useCallback, useRef, useEffect } from "react";
import EnemySprite from "./EnemySprite";
import AttackVFX from "./AttackVFX";

// ─── CARD DATABASE ───
const CARDS = {
  // Attacks
  strike: { id:"strike", name:"Strike", type:"attack", cost:1, damage:6, block:0, desc:"Deal 6 damage.", rarity:"starter", emoji:"⚔️", vfx:"strike" },
  heavy_strike: { id:"heavy_strike", name:"Heavy Strike", type:"attack", cost:2, damage:12, block:0, desc:"Deal 12 damage.", rarity:"common", emoji:"🗡️", vfx:"heavy_strike" },
  divine_arrow: { id:"divine_arrow", name:"Divine Arrow", type:"attack", cost:1, damage:8, block:0, desc:"Deal 8 damage. Piercing.", rarity:"uncommon", emoji:"🏹", effect:"pierce", vfx:"pierce" },
  trishul: { id:"trishul", name:"Trishul", type:"attack", cost:2, damage:8, block:0, desc:"Deal 8 damage 2 times.", rarity:"rare", emoji:"🔱", hits:2, vfx:"hits2" },
  agni: { id:"agni", name:"Agni's Flame", type:"attack", cost:2, damage:5, block:0, desc:"Deal 5 damage to ALL enemies.", rarity:"uncommon", emoji:"🔥", effect:"aoe", vfx:"aoe" },
  vajra_strike: { id:"vajra_strike", name:"Vajra Strike", type:"attack", cost:3, damage:20, block:0, desc:"Deal 20 damage. Exhaust.", rarity:"rare", emoji:"⚡", effect:"exhaust", vfx:"exhaust" },
  serpent_fang: { id:"serpent_fang", name:"Serpent Fang", type:"attack", cost:1, damage:4, block:0, desc:"Deal 4 damage. Apply 3 Poison.", rarity:"uncommon", emoji:"🐍", effect:"poison", poisonAmt:3, vfx:"poison" },
  // Skills
  defend: { id:"defend", name:"Defend", type:"skill", cost:1, damage:0, block:5, desc:"Gain 5 Block.", rarity:"starter", emoji:"🛡️", vfx:"defend" },
  divine_shield: { id:"divine_shield", name:"Divine Shield", type:"skill", cost:2, damage:0, block:12, desc:"Gain 12 Block.", rarity:"uncommon", emoji:"🔷", vfx:"defend" },
  shiva_grace: { id:"shiva_grace", name:"Shiva's Grace", type:"skill", cost:1, damage:0, block:0, desc:"Gain 2 Strength.", rarity:"rare", emoji:"🕉️", effect:"strength", strAmt:2, vfx:"strength" },
  lakshmi_gift: { id:"lakshmi_gift", name:"Lakshmi's Gift", type:"skill", cost:0, damage:0, block:0, desc:"Gain 1 Energy. Draw 1 card.", rarity:"uncommon", emoji:"✨", effect:"energy_draw", vfx:"strength" },
  vishnu_aura: { id:"vishnu_aura", name:"Vishnu's Aura", type:"skill", cost:1, damage:0, block:8, desc:"Gain 8 Block. Draw 1.", rarity:"rare", emoji:"💠", effect:"block_draw", vfx:"defend" },
  karma: { id:"karma", name:"Karma", type:"skill", cost:1, damage:0, block:0, desc:"Deal damage equal to your Block.", rarity:"rare", emoji:"☯️", effect:"karma", vfx:"karma" },
  durga_wrath: { id:"durga_wrath", name:"Durga's Wrath", type:"skill", cost:1, damage:0, block:0, desc:"Gain 3 Strength. Lose 3 HP.", rarity:"rare", emoji:"🗡️", effect:"wrath", strAmt:3, vfx:"wrath" },
  // Powers
  hanuman_devotion: { id:"hanuman_devotion", name:"Hanuman's Devotion", type:"power", cost:2, damage:0, block:0, desc:"At end of turn, gain 3 Block.", rarity:"rare", emoji:"🐒", effect:"auto_block", vfx:"strength" },
  kavacha: { id:"kavacha", name:"Karna's Kavacha", type:"power", cost:1, damage:0, block:0, desc:"Start each turn with 4 Block.", rarity:"rare", emoji:"☀️", effect:"start_block", vfx:"defend" },
};

const makeCard = (id) => ({ ...CARDS[id], uid: `${id}_${Math.random().toString(36).slice(2,8)}` });

const STARTER_DECK = [
  "strike","strike","strike","strike","strike",
  "defend","defend","defend","defend",
  "divine_arrow",
];

// ─── ENEMY DATABASE ───
const ENEMIES = [
  { id:"rakshasa", name:"Rakshasa", emoji:"👹", sprite:"flying_eye", maxHp:42, moveset:[
    { type:"attack", damage:8, intent:"⚔️", label:"8" },
    { type:"attack", damage:12, intent:"⚔️⚔️", label:"12" },
    { type:"defend", block:6, intent:"🛡️", label:"Block" },
    { type:"buff", strAmt:2, intent:"💪", label:"+2 STR" },
  ]},
  { id:"naga_king", name:"Naga King", emoji:"🐍", sprite:"mushroom", maxHp:55, moveset:[
    { type:"attack", damage:7, intent:"⚔️", label:"7" },
    { type:"poison", poisonAmt:5, intent:"☠️", label:"5 Poison" },
    { type:"attack", damage:14, intent:"⚔️⚔️", label:"14" },
    { type:"defend", block:10, intent:"🛡️", label:"Block" },
  ]},
  { id:"asura", name:"Asura Lord", emoji:"😈", sprite:"goblin", maxHp:70, moveset:[
    { type:"attack", damage:10, intent:"⚔️", label:"10" },
    { type:"attack", damage:18, intent:"💀", label:"18" },
    { type:"buff", strAmt:3, intent:"💪", label:"+3 STR" },
    { type:"attack", damage:6, intent:"⚔️", label:"6" },
    { type:"defend", block:12, intent:"🛡️", label:"Block" },
  ]},
  { id:"yaksha", name:"Yaksha Guardian", emoji:"🗿", sprite:"skeleton", maxHp:48, moveset:[
    { type:"attack", damage:9, intent:"⚔️", label:"9" },
    { type:"defend", block:14, intent:"🛡️🛡️", label:"Block" },
    { type:"attack", damage:11, intent:"⚔️", label:"11" },
  ]},
];

const BOSSES = [
  { id:"ravana", name:"Ravana", emoji:"👑", sprite:"flying_eye", maxHp:110, moveset:[
    { type:"attack", damage:12, intent:"⚔️", label:"12" },
    { type:"multi", damage:4, hits:3, intent:"⚔️×3", label:"4×3" },
    { type:"buff", strAmt:3, intent:"💪", label:"+3 STR" },
    { type:"attack", damage:22, intent:"💀", label:"22" },
    { type:"defend", block:15, intent:"🛡️", label:"Block" },
  ]},
];

const CARD_REWARDS_POOL = [
  "heavy_strike","divine_arrow","trishul","agni","vajra_strike","serpent_fang",
  "divine_shield","shiva_grace","lakshmi_gift","vishnu_aura","karma","durga_wrath",
  "hanuman_devotion","kavacha",
];

const RARITY_CLR = {
  starter:"#718096", common:"#a0aec0", uncommon:"#48bb78", rare:"#f6ad55", boss:"#fc8181"
};
const TYPE_CLR = { attack:"#fc8181", skill:"#63b3ed", power:"#d6bcfa" };

// ─── HELPERS ───
function shuffle(arr) { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function pickRandom(arr,n=1){ const s=shuffle(arr); return s.slice(0,n); }

// ─── MAIN COMPONENT ───
export default function AstraSTS() {
  // Run state
  const [screen, setScreen] = useState("title"); // title, map, battle, reward, rest, shop, victory, death
  const [floor, setFloor] = useState(0);
  const [gold, setGold] = useState(50);
  const [masterDeck, setMasterDeck] = useState(STARTER_DECK.map(makeCard));
  const [playerMaxHp, setPlayerMaxHp] = useState(72);
  const [playerHp, setPlayerHp] = useState(72);
  const [potions, setPotions] = useState([
    { id:"heal", name:"Healing Potion", desc:"Heal 20 HP", emoji:"❤️‍🩹" },
  ]);
  const [relics, setRelics] = useState([
    { id:"vajra", name:"Vajra", desc:"+1 Strength at start of combat", emoji:"💎" },
  ]);
  const [powers, setPowers] = useState([]); // active powers in combat

  // Map
  const [mapTiers, setMapTiers]           = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [visitedNodeIds, setVisitedNodeIds] = useState(new Set());

  // Battle state
  const [enemy, setEnemy] = useState(null);
  const [enemyHp, setEnemyHp] = useState(0);
  const [enemyMaxHp, setEnemyMaxHp] = useState(0);
  const [enemyBlock, setEnemyBlock] = useState(0);
  const [enemyStr, setEnemyStr] = useState(0);
  const [enemyPoison, setEnemyPoison] = useState(0);
  const [enemyMoveIdx, setEnemyMoveIdx] = useState(0);
  const [drawPile, setDrawPile] = useState([]);
  const [hand, setHand] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [, setExhaustPile] = useState([]);
  const [energy, setEnergy] = useState(3);
  const [maxEnergy] = useState(3);
  const [block, setBlock] = useState(0);
  const [strength, setStrength] = useState(0);
  const [playerPoison, setPlayerPoison] = useState(0);
  const [turn, setTurn] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [enemyActing, setEnemyActing] = useState(false);
  const [rewardCards, setRewardCards] = useState([]);
  const [rewardGold, setRewardGold] = useState(0);
  const [enemyAnimState, setEnemyAnimState]   = useState("idle");
  const [, setPlayerAnimState] = useState("idle");
  const [, setPlayerFlashKey]  = useState(0);
  const [vfxKey, setVfxKey]                 = useState("strike");
  const [vfxTrigger, setVfxTrigger]         = useState(0);
  const logRef = useRef(null);
  const onEnemyAnimDone = useCallback(() => setEnemyAnimState("idle"), []);

  const log = useCallback((msg) => setBattleLog(p => [...p.slice(-50), msg]), []);

  useEffect(() => { if(logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [battleLog]);

  // ─── MAP GENERATION (tier-based, top → boss) ───
  function generateMap() {
    // Each inner array = one row of nodes (types). Shuffled per run.
    const TIER_TEMPLATES = [
      ['room', 'room'],
      ['room', 'rest',    'room'],
      ['elite','room',    'mystery'],
      ['rest', 'shop'],
      ['room', 'elite',   'room'],
      ['rest', 'room'],
      ['boss'],
    ];

    const rnd = () => Math.random() - 0.5;
    const tiers = TIER_TEMPLATES.map((types, t) => {
      const shuffled = (t === 0 || t === TIER_TEMPLATES.length - 1)
        ? [...types]
        : [...types].sort(rnd);
      return shuffled.map((type, slot) => ({
        id: `t${t}s${slot}_${Math.random().toString(36).slice(2,6)}`,
        type, tier: t, slot, connections: [],
      }));
    });

    // Wire connections tier-by-tier
    for (let t = 0; t < tiers.length - 1; t++) {
      const from = tiers[t];
      const to   = tiers[t + 1];

      from.forEach((node, fi) => {
        const ratio    = from.length === 1 ? 0.5 : fi / (from.length - 1);
        const toIdx    = Math.round(ratio * (to.length - 1));
        node.connections.push(to[toIdx].id);
        // ~35% chance of a second branch
        if (Math.random() < 0.35 && to.length > 1) {
          const alt = toIdx > 0 ? toIdx - 1 : 1;
          if (!node.connections.includes(to[alt].id)) node.connections.push(to[alt].id);
        }
      });

      // Ensure every "to" node has at least one incoming edge
      const reached = new Set(from.flatMap(n => n.connections));
      to.forEach((node, ti) => {
        if (!reached.has(node.id)) {
          const fi = Math.round((ti / (to.length - 1 || 1)) * (from.length - 1));
          from[fi].connections.push(node.id);
        }
      });
    }

    setMapTiers(tiers);
    setCurrentNodeId(null);
    setVisitedNodeIds(new Set());
  }

  // ─── START BATTLE ───
  function startBattle(enemyData) {
    const e = { ...enemyData };
    setEnemy(e);
    setEnemyHp(e.maxHp);
    setEnemyMaxHp(e.maxHp);
    setEnemyBlock(0);
    setEnemyStr(0);
    setEnemyPoison(0);
    setEnemyMoveIdx(0);
    setBlock(0);
    setStrength(relics.some(r => r.id === "vajra") ? 1 : 0);
    setPlayerPoison(0);
    setPowers([]);
    setExhaustPile([]);
    setEnergy(maxEnergy);
    setTurn(1);
    setBattleLog(["⚔️ Combat begins!"]);
    setSelectedCard(null);
    setEnemyActing(false);
    setEnemyAnimState("idle");

    const deckCopy = masterDeck.map(c => ({ ...c, uid: `${c.id}_${Math.random().toString(36).slice(2,8)}` }));
    const shuffled = shuffle(deckCopy);
    const h = shuffled.slice(0, 5);
    const d = shuffled.slice(5);
    setHand(h);
    setDrawPile(d);
    setDiscardPile([]);

    // Start block from kavacha
    if (relics.some(r => r.id === "kavacha_relic")) {
      setBlock(4);
    }

    setScreen("battle");
  }

  // ─── PLAY CARD ───
  function playCard(card) {
    if (enemyActing) return;
    if (card.cost > energy) return;

    setEnergy(e => e - card.cost);
    setHand(h => h.filter(c => c.uid !== card.uid));
    if (card.vfx && (card.type === "attack" || card.effect === "karma")) {
      setVfxKey(card.vfx);
      setVfxTrigger(t => t + 1);
      setPlayerAnimState("attack");
    }
    
    if (card.effect === "exhaust") {
      setExhaustPile(p => [...p, card]);
    } else {
      setDiscardPile(p => [...p, card]);
    }

    let totalDmg = (card.damage || 0) + strength;
    if (card.effect === "pierce") totalDmg += 2;
    const hits = card.hits || 1;

    if (card.type === "attack" || card.damage > 0) {
      if (card.effect === "karma") {
        totalDmg = block;
      }
      for (let i = 0; i < hits; i++) {
        dealDamageToEnemy(totalDmg);
      }
      if (hits > 1) log(`${card.emoji} ${card.name} hits ${hits}× for ${totalDmg} each!`);
      else log(`${card.emoji} ${card.name} deals ${totalDmg} damage!`);
    }

    if (card.block > 0) {
      setBlock(b => b + card.block);
      log(`${card.emoji} ${card.name} grants ${card.block} Block!`);
    }

    if (card.effect === "poison" && card.poisonAmt) {
      setEnemyPoison(p => p + card.poisonAmt);
      log(`🐍 Applied ${card.poisonAmt} Poison!`);
    }
    if (card.effect === "strength" && card.strAmt) {
      setStrength(s => s + card.strAmt);
      log(`${card.emoji} Gained ${card.strAmt} Strength!`);
    }
    if (card.effect === "energy_draw") {
      setEnergy(e => e + 1);
      drawCards(1);
      log(`${card.emoji} +1 Energy, drew a card!`);
    }
    if (card.effect === "block_draw") {
      setBlock(b => b + 8);
      drawCards(1);
      log(`${card.emoji} +8 Block, drew a card!`);
    }
    if (card.effect === "wrath") {
      setStrength(s => s + card.strAmt);
      setPlayerHp(h => Math.max(1, h - 3));
      log(`${card.emoji} +${card.strAmt} Strength! Lost 3 HP.`);
    }
    if (card.effect === "auto_block") {
      setPowers(p => [...p, { id:"auto_block", name:"Hanuman's Devotion", value:3 }]);
      log(`${card.emoji} Power active: +3 Block each turn end!`);
    }
    if (card.effect === "start_block") {
      setPowers(p => [...p, { id:"start_block", name:"Karna's Kavacha", value:4 }]);
      log(`${card.emoji} Power active: Start turns with 4 Block!`);
    }

    setSelectedCard(null);
  }

  function dealDamageToEnemy(rawDmg) {
    if (rawDmg <= 0) return;
    setShakeEnemy(true);
    setEnemyAnimState("take_hit");
    setTimeout(() => setShakeEnemy(false), 350);

    setEnemyBlock(prevBlock => {
      const absorbed = Math.min(prevBlock, rawDmg);
      const remaining = rawDmg - absorbed;
      if (remaining > 0) {
        setEnemyHp(prevHp => {
          const newHp = Math.max(0, prevHp - remaining);
          if (newHp <= 0) {
            setEnemyAnimState("death");
            setTimeout(() => endBattle(true), 800);
          }
          return newHp;
        });
      }
      return prevBlock - absorbed;
    });
  }

  function dealDamageToPlayer(rawDmg) {
    if (rawDmg <= 0) return;
    setShakePlayer(true);
    setPlayerAnimState("hurt");
    setPlayerFlashKey(k => k + 1);
    setTimeout(() => setShakePlayer(false), 350);

    setBlock(prevBlock => {
      const absorbed = Math.min(prevBlock, rawDmg);
      const remaining = rawDmg - absorbed;
      if (remaining > 0) {
        setPlayerHp(prevHp => {
          const newHp = Math.max(0, prevHp - remaining);
          if (newHp <= 0) {
            setTimeout(() => setScreen("death"), 600);
          }
          return newHp;
        });
      }
      return prevBlock - absorbed;
    });
  }

  function drawCards(count) {
    setDrawPile(prevDraw => {
      setDiscardPile(prevDiscard => {
        setHand(prevHand => {
          let dp = [...prevDraw];
          let disc = [...prevDiscard];
          let h = [...prevHand];

          for (let i = 0; i < count; i++) {
            if (dp.length === 0 && disc.length > 0) {
              dp = shuffle(disc);
              disc = [];
            }
            if (dp.length > 0) {
              h.push(dp.pop());
            }
          }
          // We need to set all three at once — use a trick
          setTimeout(() => {
            setDrawPile(dp);
            setDiscardPile(disc);
            setHand(h);
          }, 0);
          return prevHand; // will be overridden
        });
        return prevDiscard;
      });
      return prevDraw;
    });
  }

  // ─── END TURN ───
  function endTurn() {
    if (enemyActing) return;
    setEnemyActing(true);

    // End of turn powers
    let bonusBlock = 0;
    powers.forEach(p => {
      if (p.id === "auto_block") bonusBlock += p.value;
    });
    if (bonusBlock > 0) {
      setBlock(b => b + bonusBlock);
      log(`🐒 Devotion grants ${bonusBlock} Block!`);
    }

    // Discard hand
    setDiscardPile(prev => [...prev, ...hand]);
    setHand([]);

    // Enemy poison tick
    if (enemyPoison > 0) {
      setEnemyHp(prev => {
        const newHp = Math.max(0, prev - enemyPoison);
        if (newHp <= 0) setTimeout(() => endBattle(true), 400);
        return newHp;
      });
      log(`☠️ Poison deals ${enemyPoison} to ${enemy.name}!`);
      setEnemyPoison(p => Math.max(0, p - 1));
    }

    // Enemy acts after delay
    setTimeout(() => {
      if (!enemy) return;
      const move = enemy.moveset[enemyMoveIdx % enemy.moveset.length];
      setEnemyBlock(0); // enemy block resets

      if (move.type === "attack") {
        const dmg = move.damage + enemyStr;
        setEnemyAnimState("attack");
        dealDamageToPlayer(dmg);
        log(`${enemy.emoji} ${enemy.name} attacks for ${dmg}!`);
      } else if (move.type === "multi") {
        const dmg = move.damage + enemyStr;
        setEnemyAnimState("attack");
        for (let i = 0; i < move.hits; i++) {
          dealDamageToPlayer(dmg);
        }
        log(`${enemy.emoji} ${enemy.name} attacks ${move.hits}× for ${dmg}!`);
      } else if (move.type === "defend") {
        setEnemyBlock(move.block);
        log(`${enemy.emoji} ${enemy.name} gains ${move.block} Block!`);
      } else if (move.type === "buff") {
        setEnemyStr(s => s + move.strAmt);
        log(`${enemy.emoji} ${enemy.name} gains ${move.strAmt} Strength!`);
      } else if (move.type === "poison") {
        setPlayerPoison(p => p + move.poisonAmt);
        log(`${enemy.emoji} ${enemy.name} poisons you for ${move.poisonAmt}!`);
      }

      setEnemyMoveIdx(i => i + 1);

      // Player turn starts
      setTimeout(() => {
        // Player poison tick
        setPlayerPoison(prev => {
          if (prev > 0) {
            dealDamageToPlayer(prev);
            log(`☠️ You take ${prev} Poison damage!`);
            return Math.max(0, prev - 1);
          }
          return prev;
        });

        // Reset block
        setBlock(() => {
          let startB = 0;
          powers.forEach(p => { if (p.id === "start_block") startB += p.value; });
          return startB;
        });
        setEnergy(maxEnergy);
        setTurn(t => t + 1);

        // Draw 5
        setDrawPile(prevDraw => {
          setDiscardPile(prevDiscard => {
            let dp = [...prevDraw];
            let disc = [...prevDiscard];
            let h = [];
            for (let i = 0; i < 5; i++) {
              if (dp.length === 0 && disc.length > 0) {
                dp = shuffle(disc);
                disc = [];
              }
              if (dp.length > 0) h.push(dp.pop());
            }
            setTimeout(() => {
              setDrawPile(dp);
              setDiscardPile(disc);
              setHand(h);
            }, 0);
            return prevDiscard;
          });
          return prevDraw;
        });

        setEnemyActing(false);
        log("⚔️ Your turn!");
      }, 700);
    }, 800);
  }

  // ─── END BATTLE ───
  function endBattle(won) {
    if (won) {
      const gld = 15 + Math.floor(Math.random() * 20);
      setGold(g => g + gld);
      setRewardGold(gld);
      const pool = CARD_REWARDS_POOL.filter(id => !masterDeck.some(c => c.id === id));
      setRewardCards(pickRandom(pool.length > 3 ? pool : CARD_REWARDS_POOL, 3).map(makeCard));
      setScreen("reward");
      log(`🏆 Victory! Earned ${gld} gold.`);
    }
  }

  function pickRewardCard(card) {
    setMasterDeck(d => [...d, card]);
    setScreen("map");
  }
  function skipReward() { setScreen("map"); }

  // ─── USE POTION ───
  function drinkPotion(idx) {
    const pot = potions[idx];
    if (!pot) return;
    if (pot.id === "heal") {
      setPlayerHp(h => Math.min(playerMaxHp, h + 20));
      log("❤️‍🩹 Healed 20 HP!");
    }
    setPotions(p => p.filter((_, i) => i !== idx));
  }

  // ─── REST SITE ───
  function restHeal() {
    setPlayerHp(h => Math.min(playerMaxHp, h + Math.floor(playerMaxHp * 0.3)));
    setScreen("map");
  }

  // ─── MAP NAVIGATION ───
  function getReachableIds() {
    if (mapTiers.length === 0) return new Set();
    if (currentNodeId === null) return new Set(mapTiers[0].map(n => n.id));
    for (const tier of mapTiers) {
      const node = tier.find(n => n.id === currentNodeId);
      if (node) return new Set(node.connections);
    }
    return new Set();
  }

  function advanceMap(nodeId) {
    let node = null;
    for (const tier of mapTiers) { node = tier.find(n => n.id === nodeId); if (node) break; }
    if (!node) return;

    setCurrentNodeId(nodeId);
    setVisitedNodeIds(v => new Set([...v, nodeId]));
    setFloor(f => f + 1);

    if (node.type === "boss") {
      startBattle(BOSSES[0]);
    } else if (node.type === "elite") {
      startBattle(ENEMIES.find(e => e.id === "asura") || ENEMIES[2]);
    } else if (node.type === "room") {
      startBattle(ENEMIES[Math.floor(Math.random() * ENEMIES.length)]);
    } else if (node.type === "rest") {
      setScreen("rest");
    } else if (node.type === "shop") {
      setGold(g => g + 30); setScreen("map");
    } else if (node.type === "mystery") {
      setGold(g => g + 25); setScreen("map");
    }
  }

  function startRun() {
    setPlayerHp(72);
    setPlayerMaxHp(72);
    setGold(50);
    setMasterDeck(STARTER_DECK.map(makeCard));
    setPotions([{ id:"heal", name:"Healing Potion", desc:"Heal 20 HP", emoji:"❤️‍🩹" }]);
    setRelics([{ id:"vajra", name:"Vajra", desc:"+1 STR at combat start", emoji:"💎" }]);
    setFloor(0);
    generateMap();
    setScreen("map");
  }

  // ─── ENEMY INTENT ───
  const getIntent = () => {
    if (!enemy) return null;
    const move = enemy.moveset[enemyMoveIdx % enemy.moveset.length];
    return move;
  };

  // ─── FULLSCREEN ───
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsHint, setFsHint] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  function toggleFullscreen() {
    if (isIOS) {
      setFsHint(true);
      setTimeout(() => setFsHint(false), 3500);
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  // ─── CSS ───
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; height: 100dvh; overflow: hidden; }
    body { overflow: hidden; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: #b4530955; border-radius: 2px; }
    @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
    @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes cardHover { 0%{box-shadow:0 0 0 transparent} 100%{box-shadow:0 0 20px rgba(245,158,11,.4)} }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes glow { 0%,100%{filter:drop-shadow(0 0 8px rgba(245,158,11,.3))} 50%{filter:drop-shadow(0 0 20px rgba(245,158,11,.6))} }
    .card-hand:hover { transform: translateY(-12px) scale(1.05) !important; z-index:10 !important; }
  `;

  const bg = {
    width:"100%", minHeight:"100dvh",
    background:"linear-gradient(170deg, #0a0612 0%, #1a0a2e 30%, #16213e 60%, #0d1117 100%)",
    fontFamily:"'Crimson Text', Georgia, serif",
    color:"#e8dcc8",
    position:"relative", overflow:"hidden",
  };

  const screenBg = (imgUrl) => ({
    ...bg,
    backgroundImage: `linear-gradient(rgba(0,0,0,0.68), rgba(0,0,0,0.72)), url(${imgUrl})`,
    backgroundSize:"cover",
    backgroundPosition:"center",
  });

  const overlay = {
    position:"absolute", inset:0, pointerEvents:"none",
    backgroundImage:`
      radial-gradient(ellipse at 30% 20%, rgba(245,158,11,0.04) 0%, transparent 60%),
      radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.03) 0%, transparent 60%)`,
  };

  // ─── FULLSCREEN BUTTON (shown on all screens) ───
  const fsBtn = (
    <>
      <button
        onClick={toggleFullscreen}
        style={{
          position:"fixed", bottom:20, right:16, zIndex:9999,
          width:34, height:34, borderRadius:"50%",
          background:"rgba(0,0,0,.6)", border:"1px solid rgba(255,255,255,.25)",
          color:"#ccc", fontSize:15, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          backdropFilter:"blur(4px)",
        }}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? "↙" : "↗"}
      </button>
      {fsHint && (
        <div style={{
          position:"fixed", bottom:64, right:12, zIndex:9999,
          background:"rgba(0,0,0,.85)", border:"1px solid rgba(255,255,255,.2)",
          borderRadius:8, padding:"10px 14px", maxWidth:200,
          fontSize:12, color:"#e8dcc8", lineHeight:1.5,
          backdropFilter:"blur(8px)",
        }}>
          📱 Tap <strong>Share → Add to Home Screen</strong> to play fullscreen on iPhone
        </div>
      )}
    </>
  );

  // ─── TITLE SCREEN ───
  if (screen === "title") {
    return (
      <div style={screenBg("/assets/backgrounds/title_bg.jpg")}>
        <style>{css}</style>{fsBtn}
        <div style={overlay}/>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100dvh", gap:16, position:"relative", zIndex:1,
          background:"radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)", padding:"40px 20px" }}>
          <div style={{ fontSize:56, animation:"float 3s ease infinite" }}>🔱</div>
          <h1 style={{ fontFamily:"'Cinzel',serif", fontSize:64, fontWeight:900, letterSpacing:14,
            background:"linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #f59e0b 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            filter:"drop-shadow(0 0 30px rgba(245,158,11,.3))" }}>ASTRA</h1>
          <p style={{ fontFamily:"'Cinzel',serif", fontSize:12, letterSpacing:4, color:"#e8d5a3", textTransform:"uppercase", textShadow:"0 2px 8px rgba(0,0,0,.9)", whiteSpace:"nowrap" }}>Mythological Deck Battler</p>
          <button onClick={startRun} style={{
            marginTop:40, padding:"16px 56px", fontFamily:"'Cinzel',serif", fontSize:18, fontWeight:700, letterSpacing:6,
            background:"linear-gradient(135deg, #92400e, #b45309, #d97706)", color:"#fef3c7",
            border:"2px solid #f59e0b", borderRadius:2, cursor:"pointer", textTransform:"uppercase",
            boxShadow:"0 0 40px rgba(245,158,11,.25), inset 0 1px 0 rgba(255,255,255,.1)",
            transition:"all .2s"
          }}
          onMouseEnter={e=>{e.target.style.boxShadow="0 0 60px rgba(245,158,11,.45)";e.target.style.transform="scale(1.04)"}}
          onMouseLeave={e=>{e.target.style.boxShadow="0 0 40px rgba(245,158,11,.25)";e.target.style.transform="scale(1)"}}
          >Begin Ascent</button>
          <p style={{ marginTop:40, maxWidth:380, textAlign:"center", fontSize:15, color:"#d4b896", lineHeight:1.7, textShadow:"0 2px 8px rgba(0,0,0,.9)" }}>
            Climb through battles. Collect divine cards.<br/>Defeat the demon king Ravana.
          </p>
        </div>
      </div>
    );
  }

  // ─── DEATH ───
  if (screen === "death") {
    return (
      <div style={screenBg("/assets/backgrounds/battle_bg.jpg")}>
        <style>{css}</style>{fsBtn}<div style={overlay}/>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100dvh", gap:20, zIndex:1, position:"relative" }}>
          <div style={{ fontSize:64 }}>💀</div>
          <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:36, color:"#fc8181", letterSpacing:6 }}>DEFEATED</h2>
          <p style={{ color:"#8a7a6a", fontSize:16 }}>Floor {floor} • {masterDeck.length} cards</p>
          <button onClick={()=>setScreen("title")} style={{
            marginTop:24, padding:"14px 40px", fontFamily:"'Cinzel',serif", fontSize:16, fontWeight:700,
            background:"linear-gradient(135deg,#92400e,#b45309)", color:"#fef3c7",
            border:"2px solid #f59e0b", borderRadius:2, cursor:"pointer", letterSpacing:4, textTransform:"uppercase"
          }}>Try Again</button>
        </div>
      </div>
    );
  }

  // ─── VICTORY ───
  if (screen === "victory") {
    return (
      <div style={screenBg("/assets/backgrounds/map_bg.jpg")}>
        <style>{css}</style>{fsBtn}<div style={overlay}/>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100dvh", gap:20, zIndex:1, position:"relative" }}>
          <div style={{ fontSize:64, animation:"glow 2s ease infinite" }}>🏆</div>
          <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:36, color:"#fbbf24", letterSpacing:6 }}>VICTORY</h2>
          <p style={{ color:"#a89070", fontSize:16 }}>Ravana has been vanquished!</p>
          <p style={{ color:"#8a7a6a" }}>Floor {floor} • {gold} gold • {masterDeck.length} cards</p>
          <button onClick={()=>setScreen("title")} style={{
            marginTop:24, padding:"14px 40px", fontFamily:"'Cinzel',serif", fontSize:16, fontWeight:700,
            background:"linear-gradient(135deg,#92400e,#b45309)", color:"#fef3c7",
            border:"2px solid #f59e0b", borderRadius:2, cursor:"pointer", letterSpacing:4, textTransform:"uppercase"
          }}>New Run</button>
        </div>
      </div>
    );
  }

  // ─── MAP ───
  if (screen === "map") {
    const reachable = getReachableIds();

    // Layout constants
    const W  = 340;   // canvas width
    const TH = 78;    // px between tier row centres
    const NS = 48;    // node display size px
    const XG = 88;    // x gap between nodes in same tier
    const PT = 36;    // top/bottom padding

    // Compute node centre positions
    const nodePos = (t, s, len) => ({
      x: W / 2 + (s - (len - 1) / 2) * XG,
      y: PT + t * TH,
    });

    // Build SVG connection lines
    const lines = [];
    const nodeById = {};
    for (const tier of mapTiers) for (const n of tier) nodeById[n.id] = n;
    for (const tier of mapTiers) {
      for (const node of tier) {
        const p1 = nodePos(node.tier, node.slot, tier.length);
        for (const cid of node.connections) {
          const c = nodeById[cid]; if (!c) continue;
          const p2 = nodePos(c.tier, c.slot, mapTiers[c.tier]?.length || 1);
          const cleared = visitedNodeIds.has(node.id) && visitedNodeIds.has(cid);
          lines.push({ x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y, cleared });
        }
      }
    }

    const totalH = PT + (mapTiers.length - 1) * TH + PT + NS;

    return (
      <div style={screenBg("/assets/backgrounds/map_bg.jpg")}>
        <style>{css}</style>{fsBtn}
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.75)" }}/>
        <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", height:"100dvh" }}>

          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"13px 20px", background:"rgba(0,0,0,.55)", borderBottom:"1px solid rgba(245,158,11,.2)", flexShrink:0 }}>
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:18, fontWeight:700, color:"#f59e0b", letterSpacing:2 }}>🔱 ASTRA</span>
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:12, color:"#a89070", letterSpacing:2 }}>FLOOR {floor} / 7</span>
            <span style={{ fontSize:13, color:"#fbbf24", fontWeight:600 }}>💰 {gold}</span>
          </div>

          {/* Player status */}
          <div style={{ padding:"10px 20px", background:"rgba(0,0,0,.4)", borderBottom:"1px solid rgba(255,255,255,.06)", flexShrink:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
              <span style={{ fontSize:13, color:"#f87171", fontWeight:600 }}>❤️ {playerHp} / {playerMaxHp}</span>
              <span style={{ fontSize:12, color:"#8a7a6a" }}>📜 {masterDeck.length} cards</span>
              <div style={{ display:"flex", gap:6 }}>
                {relics.map((r,i)=><span key={i} title={`${r.name}: ${r.desc}`} style={{fontSize:18,cursor:"help"}}>{r.emoji}</span>)}
                {potions.map((p,i)=><span key={`p${i}`} title={`${p.name}: ${p.desc}`} style={{fontSize:18,cursor:"help",opacity:.85}}>{p.emoji}</span>)}
              </div>
            </div>
            <div style={{ height:5, background:"rgba(0,0,0,.5)", borderRadius:3, overflow:"hidden", border:"1px solid rgba(255,255,255,.08)" }}>
              <div style={{ width:`${(playerHp/playerMaxHp)*100}%`, height:"100%", borderRadius:3,
                background: playerHp>playerMaxHp*.5?"linear-gradient(90deg,#22c55e,#4ade80)":playerHp>playerMaxHp*.25?"linear-gradient(90deg,#eab308,#facc15)":"linear-gradient(90deg,#ef4444,#f87171)" }}/>
            </div>
          </div>

          {/* Map */}
          <div style={{ flex:1, overflowY:"auto", display:"flex", justifyContent:"center", padding:"0 0 16px" }}>
            <div style={{ position:"relative", width:W, height:totalH, flexShrink:0 }}>

              {/* SVG lines */}
              <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
                {lines.map((l, i) => (
                  <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                    stroke={l.cleared ? "rgba(245,158,11,.55)" : "rgba(255,255,255,.14)"}
                    strokeWidth={l.cleared ? 2 : 1.5}
                    strokeDasharray="5 5"
                  />
                ))}
              </svg>

              {/* Nodes */}
              {mapTiers.map((tier, t) => tier.map((node) => {
                const pos       = nodePos(t, node.slot, tier.length);
                const isVisited = visitedNodeIds.has(node.id);
                const isReach   = reachable.has(node.id);
                const isCurrent = node.id === currentNodeId;

                return (
                  <div
                    key={node.id}
                    onClick={() => isReach && advanceMap(node.id)}
                    style={{
                      position:"absolute",
                      left: pos.x - NS / 2,
                      top:  pos.y - NS / 2,
                      width: NS, height: NS,
                      borderRadius:"50%",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      cursor: isReach ? "pointer" : "default",
                      opacity: isVisited && !isCurrent ? 0.18 : !isReach && !isCurrent && !isVisited ? 0.35 : 1,
                      filter: isVisited && !isCurrent ? "grayscale(1) brightness(.6)" : "none",
                      transform: isCurrent ? "scale(1.28)" : isReach ? "scale(1.12)" : "scale(1)",
                      transition: "all .2s",
                      boxShadow: isCurrent
                        ? "0 0 18px 6px rgba(255,215,0,.85)"
                        : isReach
                        ? "0 0 14px 4px rgba(255,255,255,.55)"
                        : "none",
                      zIndex: isCurrent ? 10 : isReach ? 5 : 1,
                    }}
                  >
                    <img
                      src={`/assets/map_nodes/node_${node.type}.png`}
                      alt={node.type}
                      style={{ width:"100%", height:"100%", imageRendering:"pixelated", display:"block" }}
                    />
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display:"flex", justifyContent:"center", gap:12, padding:"9px 16px",
            background:"rgba(0,0,0,.45)", borderTop:"1px solid rgba(255,255,255,.06)", flexShrink:0, flexWrap:"wrap" }}>
            {[["room","⚔️","Enemy"],["elite","💀","Elite"],["rest","🔥","Rest"],["shop","🏺","Shop"],["mystery","❓","Mystery"],["boss","👑","Boss"]].map(([type,icon,label]) => (
              <div key={type} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <img src={`/assets/map_nodes/node_${type}.png`} style={{ width:18, height:18, imageRendering:"pixelated" }} alt="" />
                <span style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontFamily:"'Cinzel',serif", letterSpacing:.5 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── REST SITE ───
  if (screen === "rest") {
    return (
      <div style={screenBg("/assets/backgrounds/rest_bg.jpg")}>
        <style>{css}</style>{fsBtn}<div style={overlay}/>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100dvh", gap:24, zIndex:1, position:"relative" }}>
          <div style={{ fontSize:56 }}>🏕️</div>
          <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:28, color:"#fbbf24", letterSpacing:4 }}>Rest Site</h2>
          <p style={{ color:"#8a7a6a", fontSize:15 }}>❤️ {playerHp}/{playerMaxHp}</p>
          <button onClick={restHeal} style={{
            padding:"14px 36px", fontFamily:"'Cinzel',serif", fontSize:16, fontWeight:700,
            background:"linear-gradient(135deg,#065f46,#059669)", color:"#d1fae5",
            border:"2px solid #34d399", borderRadius:4, cursor:"pointer", letterSpacing:3,
          }}>🔥 Rest — Heal {Math.floor(playerMaxHp * 0.3)} HP</button>
          <button onClick={()=>setScreen("map")} style={{
            padding:"10px 24px", fontFamily:"'Cinzel',serif", fontSize:14,
            background:"transparent", color:"#8a7a6a",
            border:"1px solid rgba(255,255,255,.1)", borderRadius:4, cursor:"pointer",
          }}>Skip</button>
        </div>
      </div>
    );
  }

  // ─── REWARD ───
  if (screen === "reward") {
    return (
      <div style={screenBg("/assets/backgrounds/battle_bg.jpg")}>
        <style>{css}</style>{fsBtn}<div style={overlay}/>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100dvh", gap:20, zIndex:1, position:"relative" }}>
          <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:28, color:"#fbbf24", letterSpacing:4 }}>Victory!</h2>
          <p style={{ color:"#a89070" }}>💰 +{rewardGold} Gold</p>
          <p style={{ fontFamily:"'Cinzel',serif", fontSize:16, color:"#8a7a6a", letterSpacing:2, marginTop:8 }}>Choose a card to add to your deck:</p>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center", marginTop:8 }}>
            {rewardCards.map(card => (
              <div key={card.uid} onClick={() => pickRewardCard(card)} style={{
                width:140, padding:16, cursor:"pointer",
                background:`linear-gradient(160deg, ${RARITY_CLR[card.rarity]}22, rgba(0,0,0,.6))`,
                border:`2px solid ${RARITY_CLR[card.rarity]}88`,
                borderRadius:10, textAlign:"center", transition:"all .2s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.boxShadow=`0 8px 24px ${RARITY_CLR[card.rarity]}33`}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}
              >
                <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:1, color:TYPE_CLR[card.type], fontWeight:700, marginBottom:4 }}>{card.type}</div>
                <div style={{ fontSize:32, margin:"4px 0" }}>{card.emoji}</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:14, fontWeight:700 }}>{card.name}</div>
                <div style={{ fontSize:12, color:"#a89070", margin:"6px 0", lineHeight:1.4 }}>{card.desc}</div>
                <div style={{ fontSize:11, color:"#93c5fd" }}>Cost: {card.cost} ⚡</div>
                <div style={{ fontSize:10, color:RARITY_CLR[card.rarity], textTransform:"uppercase", marginTop:4, letterSpacing:1 }}>{card.rarity}</div>
              </div>
            ))}
          </div>
          <button onClick={skipReward} style={{
            marginTop:16, padding:"10px 24px", fontFamily:"'Cinzel',serif", fontSize:14,
            background:"transparent", color:"#6b5e50",
            border:"1px solid rgba(255,255,255,.1)", borderRadius:4, cursor:"pointer",
          }}>Skip — Add nothing</button>
        </div>
      </div>
    );
  }

  // ─── BATTLE SCREEN ───
  const intent = getIntent();

  return (
    <div style={{...screenBg("/assets/backgrounds/battle_bg.jpg"), display:"flex", flexDirection:"column", height:"100dvh"}}>
      <style>{css}</style>{fsBtn}
      <div style={overlay}/>

      {/* TOP BAR */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 16px",
        background:"rgba(0,0,0,.5)", borderBottom:"1px solid rgba(245,158,11,.15)", position:"relative", zIndex:2, flexShrink:0 }}>
        <span style={{ fontFamily:"'Cinzel',serif", fontSize:16, fontWeight:700, color:"#f59e0b" }}>🔱 Floor {floor}</span>
        <span style={{ fontSize:12, color:"#6b5e50" }}>Turn {turn}</span>
        <div style={{ display:"flex", gap:6 }}>
          {potions.map((p,i) => (
            <button key={i} onClick={()=>drinkPotion(i)} title={p.desc} style={{
              fontSize:18, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)",
              borderRadius:4, padding:"2px 6px", cursor:"pointer"
            }}>{p.emoji}</button>
          ))}
        </div>
      </div>

      {/* ENEMY SECTION — fixed height, everything overlaid on sprite */}
      <div style={{ flex:"0 0 280px", position:"relative", zIndex:1, overflow:"hidden" }}>

        {/* Sprite + VFX — fills the whole section */}
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
          animation: shakeEnemy ? "shake .35s ease" : "none" }}>
          {enemy?.sprite
            ? <div style={{ marginTop:"-80px" }}><EnemySprite spriteKey={enemy.sprite} animState={enemyAnimState} onAnimDone={onEnemyAnimDone} size={340} /></div>
            : <div style={{ fontSize:160, lineHeight:1 }}>{enemy?.emoji}</div>
          }
          <AttackVFX vfxKey={vfxKey} trigger={vfxTrigger} size={120} />
        </div>

        {/* Intent — top center */}
        {intent && (
          <div style={{ position:"absolute", top:8, left:0, right:0, display:"flex", justifyContent:"center", zIndex:2 }}>
            <div style={{ padding:"3px 12px", borderRadius:20, fontSize:12, backdropFilter:"blur(4px)",
              background: intent.type==="attack"||intent.type==="multi" ? "rgba(239,68,68,.3)" : intent.type==="defend" ? "rgba(59,130,246,.3)" : "rgba(168,85,247,.3)",
              border: `1px solid ${intent.type==="attack"||intent.type==="multi"?"rgba(239,68,68,.6)":intent.type==="defend"?"rgba(59,130,246,.6)":"rgba(168,85,247,.6)"}`,
              color: intent.type==="attack"||intent.type==="multi"?"#fca5a5":intent.type==="defend"?"#93c5fd":"#c4b5fd",
            }}>
              {intent.intent} {intent.label}
            </div>
          </div>
        )}

        {/* Name + HP + statuses — bottom overlay */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:2,
          background:"linear-gradient(transparent, rgba(0,0,0,0.75))", padding:"16px 12px 8px", textAlign:"center" }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:16, fontWeight:700, textShadow:"0 2px 8px rgba(0,0,0,.9)", marginBottom:4 }}>{enemy?.name}</div>
          <div style={{ width:160, height:8, background:"rgba(0,0,0,.6)", borderRadius:4, overflow:"hidden", margin:"0 auto 4px", border:"1px solid rgba(239,68,68,.3)" }}>
            <div style={{ width:`${(enemyHp/enemyMaxHp)*100}%`, height:"100%", borderRadius:4, transition:"width .3s", background:"linear-gradient(90deg,#dc2626,#ef4444)" }}/>
          </div>
          <div style={{ fontSize:12, display:"flex", justifyContent:"center", gap:10, fontWeight:600, textShadow:"0 1px 4px rgba(0,0,0,.9)" }}>
            <span>❤️ {enemyHp}/{enemyMaxHp}</span>
            {enemyBlock > 0 && <span style={{ color:"#93c5fd" }}>🛡️ {enemyBlock}</span>}
            {enemyStr > 0 && <span style={{ color:"#fbbf24" }}>💪 {enemyStr}</span>}
            {enemyPoison > 0 && <span style={{ color:"#86efac" }}>☠️ {enemyPoison}</span>}
          </div>
        </div>

      </div>

      {/* BATTLE LOG — last 2 lines only, no scroll */}
      <div style={{ flexShrink:0, padding:"4px 16px 2px", background:"rgba(0,0,0,.3)", borderTop:"1px solid rgba(255,255,255,.05)", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
        {battleLog.slice(-2).map((msg, i, arr) => (
          <div key={i} style={{
            fontSize: i === arr.length - 1 ? 13 : 11,
            color:     i === arr.length - 1 ? "#f5e6c8" : "#6b5e50",
            fontWeight:i === arr.length - 1 ? 600 : 400,
            padding:"2px 0",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          }}>{msg}</div>
        ))}
      </div>

      {/* PLAYER SECTION */}
      <div style={{ flexShrink:0, position:"relative", zIndex:1 }}>
        {/* Player status */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 16px",
          animation: shakePlayer ? "shake .35s ease" : "none" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:28 }}>🏹</span>
            <div>
              <div style={{ width:120, height:8, background:"rgba(0,0,0,.6)", borderRadius:4, overflow:"hidden", border:"1px solid rgba(239,68,68,.3)" }}>
                <div style={{ width:`${(playerHp/playerMaxHp)*100}%`, height:"100%", background:"linear-gradient(90deg,#ef4444,#f87171)", borderRadius:4 }}/>
              </div>
              <div style={{ fontSize:12, marginTop:3, display:"flex", gap:8, fontWeight:600, textShadow:"0 1px 4px rgba(0,0,0,.9)" }}>
                <span>❤️ {playerHp}/{playerMaxHp}</span>
                {block > 0 && <span style={{ color:"#93c5fd" }}>🛡️ {block}</span>}
                {strength > 0 && <span style={{ color:"#fbbf24" }}>💪 {strength}</span>}
                {playerPoison > 0 && <span style={{ color:"#86efac" }}>☠️ {playerPoison}</span>}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Energy orb */}
            <div style={{ width:44, height:44, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
              background:"radial-gradient(circle, #f59e0b44, transparent)", border:"2px solid #f59e0b88",
              fontFamily:"'Cinzel',serif", fontSize:20, fontWeight:900, color:"#fbbf24" }}>{energy}</div>
            {/* Piles */}
            <div style={{ textAlign:"center", fontSize:12, color:"#d4b896", fontWeight:600, textShadow:"0 1px 4px rgba(0,0,0,.9)" }}>
              <div>📚 {drawPile.length}</div>
              <div>♻️ {discardPile.length}</div>
            </div>
          </div>
        </div>

        {/* Hand */}
        <div style={{ display:"flex", gap:6, justifyContent:"center", padding:"6px 8px 4px", overflowX:"auto", flexWrap:"nowrap" }}>
          {hand.map((card, idx) => {
            const canPlay = !enemyActing && energy >= card.cost;
            const isSel = selectedCard?.uid === card.uid;
            return (
              <div key={card.uid} className="card-hand"
                onClick={() => {
                  if (!canPlay) return;
                  if (isSel) { playCard(card); }
                  else { setSelectedCard(card); }
                }}
                style={{
                  width:100, flexShrink:0, position:"relative",
                  cursor: canPlay ? "pointer" : "not-allowed",
                  opacity: canPlay ? 1 : .4,
                  transform: isSel ? "translateY(-16px) scale(1.08)" : "none",
                  filter: isSel ? `drop-shadow(0 0 10px ${RARITY_CLR[card.rarity]})` : canPlay ? "none" : "grayscale(60%)",
                  transition:"all .15s", zIndex: isSel ? 10 : 1,
                  animation:`slideUp .3s ease ${idx * .05}s both`,
                }}>
                {/* Card frame */}
                <img src="/assets/ui/cards/card_frame.png" alt="" style={{ width:"100%", display:"block" }} />
                {/* Overlaid content — aligned to frame zones */}
                <div style={{ position:"absolute", inset:0 }}>
                  {/* Cost badge — top left */}
                  <div style={{ position:"absolute", top:5, left:5, width:22, height:22, borderRadius:"50%",
                    background:"radial-gradient(circle, #1a1a2e, #0d0d1a)",
                    border:"2px solid #f59e0b", display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"'Cinzel',serif", fontSize:11, fontWeight:900, color:"#fbbf24",
                    boxShadow:"0 0 6px rgba(245,158,11,.6)", zIndex:3 }}>{card.cost}</div>
                  {/* Type — top right */}
                  <div style={{ position:"absolute", top:7, right:7, fontSize:7, textTransform:"uppercase",
                    color:TYPE_CLR[card.type], fontWeight:700, letterSpacing:.3 }}>{card.type}</div>
                  {/* Art area — top 55% */}
                  <div style={{ position:"absolute", top:"8%", left:0, right:0, height:"47%",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img
                      src={card.type === "attack" ? "/assets/ui/cards/attack.png" : card.block > 0 ? "/assets/ui/cards/defense.png" : "/assets/ui/cards/skill.png"}
                      alt={card.type}
                      style={{ width:"60%", height:"60%", objectFit:"contain" }}
                    />
                  </div>
                  {/* Name — golden banner strip ~55-70% */}
                  <div style={{ position:"absolute", top:"55%", left:"6%", right:"6%", height:"15%",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ fontFamily:"'Cinzel',serif", fontSize:9.5, fontWeight:900,
                      color:"#fff", textAlign:"center", lineHeight:1.1,
                      textShadow:"0 1px 4px rgba(0,0,0,.9), 0 0 8px rgba(0,0,0,.6)" }}>{card.name}</div>
                  </div>
                  {/* Desc — bottom area ~70-95% */}
                  <div style={{ position:"absolute", top:"71%", left:"8%", right:"8%", bottom:"5%",
                    display:"flex", alignItems:"flex-start", justifyContent:"center" }}>
                    <div style={{ fontSize:7.5, color:"#3d1f00", lineHeight:1.3, textAlign:"center", fontWeight:600 }}>
                      {isSel ? <span style={{ color:"#b45309", fontWeight:700 }}>▶ TAP TO PLAY</span> : card.desc}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* End Turn */}
        <div style={{ padding:"8px 16px 12px", display:"flex", justifyContent:"center" }}>
          <button onClick={endTurn} disabled={enemyActing} style={{
            padding:"10px 32px", fontFamily:"'Cinzel',serif", fontSize:14, fontWeight:700, letterSpacing:4,
            background: enemyActing ? "rgba(80,80,80,.3)" : "linear-gradient(135deg,#92400e,#b45309)",
            color: enemyActing ? "#555" : "#fef3c7",
            border:`1px solid ${enemyActing ? "#444" : "#d97706"}`,
            borderRadius:4, cursor: enemyActing ? "not-allowed" : "pointer", textTransform:"uppercase",
            boxShadow: enemyActing ? "none" : "0 0 20px rgba(245,158,11,.15)",
            transition:"all .2s",
          }}
          onMouseEnter={e=>{if(!enemyActing){e.target.style.boxShadow="0 0 30px rgba(245,158,11,.3)"}}}
          onMouseLeave={e=>{e.target.style.boxShadow=enemyActing?"none":"0 0 20px rgba(245,158,11,.15)"}}
          >End Turn</button>
        </div>
      </div>
    </div>
  );
}
