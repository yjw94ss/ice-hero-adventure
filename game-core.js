/* 《冰人奇境》纯游戏逻辑：关卡、平台物理、机关、收集物和 Node 验证接口。 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IceHeroCore = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PLAYER_W = 28;
  var PLAYER_H = 38;
  var GRAVITY = 1500;
  var JUMP_SPEED = 570;
  var MOVE_SPEED = 260;
  var MAX_JUMP_DISTANCE = 2 * JUMP_SPEED * MOVE_SPEED / GRAVITY;
  var MAX_SAFE_JUMP_GAP = Math.floor(MAX_JUMP_DISTANCE * 0.68);
  var MAX_SAFE_RISE = 82;
  var WORLD_HEIGHT = 540;
  var LEVEL_WIDTH = 1880;

  function p(id, x, y, w, extra) {
    var platform = { id: id, x: x, y: y, w: w, h: 18 };
    if (extra) Object.keys(extra).forEach(function (key) { platform[key] = extra[key]; });
    return platform;
  }

  var LEVELS = [
    {
      id: 'crystal-village', name: '冰晶村', subtitle: '跟着霜花路标，学会起跳和踩雪团。',
      gimmickId: 'rolling-snowball', gimmick: '滚雪球怪', palette: ['#bfeeff', '#f8fcff', '#86c9e8', '#4b91bd'],
      width: 1880, height: WORLD_HEIGHT, spawn: { x: 54, platformId: 'village-start' },
      platforms: [
        p('village-start', 0, 450, 340), p('village-bridge', 440, 450, 290),
        p('village-rise', 810, 405, 260), p('village-field', 1160, 450, 340),
        p('village-gate', 1600, 450, 280)
      ],
      route: ['village-start', 'village-bridge', 'village-rise', 'village-field', 'village-gate'],
      checkpoints: [{ x: 870, platformId: 'village-rise' }],
      hazards: [{ x: 340, y: 500, w: 100, h: 60, kind: 'snow-pit' }, { x: 730, y: 500, w: 80, h: 60, kind: 'snow-pit' }],
      enemies: [{ id: 'snowball', type: '滚雪球怪', x: 520, y: 420, w: 34, h: 28, minX: 470, maxX: 670, speed: 72 }],
      windZones: [], iceZones: [], mirrorSwitch: null,
      item: { id: 'item-frostflower', type: 'frostflower-seal', name: '霜花徽记', x: 910, y: 360, glyph: '✿', color: '#f16ab1' },
      goal: { x: 1795, y: 388, w: 44, h: 62 }, boss: null
    },
    {
      id: 'pine-windwood', name: '风雪松林', subtitle: '站进蓝色风柱，借上升气流登上松枝。',
      gimmickId: 'updraft-columns', gimmick: '上升气流柱', palette: ['#d5f5ff', '#e9fff4', '#6fae83', '#36755a'],
      width: 1660, height: WORLD_HEIGHT, spawn: { x: 48, platformId: 'forest-start' },
      platforms: [
        p('forest-start', 0, 450, 280), p('forest-root', 360, 420, 190),
        p('forest-bough', 630, 380, 210), p('forest-clearing', 920, 440, 240),
        p('forest-exit', 1240, 420, 420)
      ],
      route: ['forest-start', 'forest-root', 'forest-bough', 'forest-clearing', 'forest-exit'],
      checkpoints: [{ x: 960, platformId: 'forest-clearing' }],
      hazards: [{ x: 280, y: 500, w: 80, h: 60, kind: 'pine-pit' }, { x: 840, y: 500, w: 80, h: 60, kind: 'pine-pit' }, { x: 1160, y: 500, w: 80, h: 60, kind: 'pine-pit' }],
      enemies: [{ id: 'pine-owl', type: '松果猫头鹰', x: 990, y: 410, w: 34, h: 30, minX: 950, maxX: 1110, speed: 56 }],
      windZones: [{ x: 560, y: 220, w: 270, h: 250, force: 1900, color: 'rgba(94,220,255,.20)' }],
      iceZones: [], mirrorSwitch: null,
      item: { id: 'item-windbell-core', type: 'windbell-core', name: '风铃核心', x: 720, y: 324, glyph: '♫', color: '#ffc44f' },
      goal: { x: 1575, y: 358, w: 44, h: 62 }, boss: null
    },
    {
      id: 'obsidian-mine', name: '熔岩矿坑', subtitle: '搭上往返矿车，穿过红光闪烁的矿道。',
      gimmickId: 'moving-minecart', gimmick: '来回矿车平台', palette: ['#ffccb0', '#482c37', '#9d5460', '#613b4c'],
      width: 1780, height: WORLD_HEIGHT, spawn: { x: 52, platformId: 'mine-start' },
      platforms: [
        p('mine-start', 0, 450, 320), p('mine-track-a', 410, 430, 180),
        p('mine-ridge', 680, 390, 180),
        p('minecart', 1104, 365, 150, { motion: { minX: 930, maxX: 1180, period: 4.8, phase: 0.4 } }),
        p('mine-track-b', 980, 450, 290), p('mine-exit', 1360, 450, 420)
      ],
      route: ['mine-start', 'mine-track-a', 'mine-ridge', 'minecart', 'mine-track-b', 'mine-exit'],
      checkpoints: [{ x: 1050, platformId: 'mine-track-b' }],
      hazards: [{ x: 320, y: 500, w: 90, h: 60, kind: 'lava' }, { x: 590, y: 500, w: 90, h: 60, kind: 'lava' }, { x: 860, y: 500, w: 120, h: 60, kind: 'lava' }, { x: 1270, y: 500, w: 90, h: 60, kind: 'lava' }],
      enemies: [{ id: 'magma-mole', type: '熔岩鼹鼠', x: 1090, y: 420, w: 34, h: 30, minX: 1010, maxX: 1210, speed: 64 }],
      windZones: [], iceZones: [], mirrorSwitch: null,
      item: { id: 'item-obsidian-ice', type: 'obsidian-ice', name: '玄冰矿石', x: 760, y: 334, glyph: '◆', color: '#68dcff' },
      goal: { x: 1690, y: 388, w: 44, h: 62 }, boss: null
    },
    {
      id: 'mirror-lake', name: '镜湖遗迹', subtitle: '靠近镜台按 E / 互动，显出湖心银桥。',
      gimmickId: 'mirror-bridge', gimmick: '显隐镜面平台', palette: ['#d9f5ff', '#effaff', '#80b6d1', '#527d9e'],
      width: 1810, height: WORLD_HEIGHT, spawn: { x: 52, platformId: 'lake-start' },
      platforms: [
        p('lake-start', 0, 450, 320), p('lake-mirror-bank', 405, 410, 165),
        p('lake-hidden-bridge', 600, 350, 170, { hidden: true }),
        p('lake-shore', 840, 410, 190), p('lake-ice-drift', 1120, 430, 200),
        p('lake-exit', 1410, 450, 400)
      ],
      route: ['lake-start', 'lake-mirror-bank', 'lake-hidden-bridge', 'lake-shore', 'lake-ice-drift', 'lake-exit'],
      checkpoints: [{ x: 1180, platformId: 'lake-ice-drift' }],
      hazards: [{ x: 320, y: 500, w: 85, h: 60, kind: 'thin-ice' }, { x: 770, y: 500, w: 70, h: 60, kind: 'thin-ice' }, { x: 1030, y: 500, w: 90, h: 60, kind: 'thin-ice' }, { x: 1320, y: 500, w: 90, h: 60, kind: 'thin-ice' }],
      enemies: [{ id: 'mirror-wisp', type: '镜湖光灵', x: 1180, y: 400, w: 30, h: 30, minX: 1140, maxX: 1280, speed: 52 }],
      windZones: [], iceZones: [{ x: 1120, y: 410, w: 200, h: 18 }],
      mirrorSwitch: { x: 470, y: 410, radius: 74 },
      item: { id: 'item-moon-mirror', type: 'moon-mirror-shard', name: '月镜碎片', x: 675, y: 300, glyph: '◈', color: '#bd8cff' },
      goal: { x: 1730, y: 388, w: 44, h: 62 }, boss: null
    },
    {
      id: 'aurora-castle', name: '极光城堡', subtitle: '连续发射冰球冻住守门人，三次命中即可胜利。',
      gimmickId: 'iceball-boss', gimmick: '冰球冻结 Boss', palette: ['#d4dcff', '#f6efff', '#7e73bc', '#484269'],
      width: 1710, height: WORLD_HEIGHT, spawn: { x: 50, platformId: 'castle-start' },
      platforms: [
        p('castle-start', 0, 450, 320), p('castle-step-a', 400, 420, 180),
        p('castle-step-b', 660, 380, 190), p('castle-step-c', 930, 420, 180),
        p('castle-arena', 1200, 450, 510)
      ],
      route: ['castle-start', 'castle-step-a', 'castle-step-b', 'castle-step-c', 'castle-arena'],
      checkpoints: [{ x: 1235, platformId: 'castle-arena' }],
      hazards: [{ x: 320, y: 500, w: 80, h: 60, kind: 'abyss' }, { x: 580, y: 500, w: 80, h: 60, kind: 'abyss' }, { x: 850, y: 500, w: 80, h: 60, kind: 'abyss' }, { x: 1110, y: 500, w: 90, h: 60, kind: 'abyss' }],
      enemies: [], windZones: [], iceZones: [], mirrorSwitch: null,
      item: { id: 'item-aurora-heart', type: 'aurora-heart', name: '极光之心', x: 760, y: 322, glyph: '✦', color: '#fff17a' },
      goal: { x: 1645, y: 388, w: 44, h: 62 },
      boss: { id: 'aurora-warden', name: '极光守门人', x: 1455, y: 410, w: 52, h: 40, hp: 3 }
    }
  ];

  function cloneObject(value) {
    if (Array.isArray(value)) return value.map(cloneObject);
    if (value && typeof value === 'object') {
      var copy = {};
      Object.keys(value).forEach(function (key) { copy[key] = cloneObject(value[key]); });
      return copy;
    }
    return value;
  }

  function makePlayer(level) {
    var start = level.platforms.find(function (platform) { return platform.id === level.spawn.platformId; });
    return {
      x: level.spawn.x, y: start.y - PLAYER_H, vx: 0, vy: 0,
      w: PLAYER_W, h: PLAYER_H, onGround: true, supportId: start.id,
      coyote: 0.1, jumpBuffer: 0, invuln: 0, facing: 1, lives: 3
    };
  }

  function createGame(index) {
    var safeIndex = Math.max(0, Math.min(LEVELS.length - 1, index | 0));
    var level = LEVELS[safeIndex];
    var boss = level.boss ? cloneObject(level.boss) : null;
    if (boss) { boss.invuln = 0; boss.frozen = 0; }
    return {
      levelIndex: safeIndex, level: level,
      platforms: cloneObject(level.platforms), enemies: cloneObject(level.enemies),
      projectiles: [], elapsed: 0, player: makePlayer(level),
      checkpoint: { x: level.spawn.x, platformId: level.spawn.platformId },
      mirrorsActive: false, itemCollected: false, boss: boss,
      completed: false, lastJump: false, lastShoot: false, lastInteract: false,
      shootCooldown: 0, events: []
    };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function usablePlatform(game, platform) {
    return !platform.hidden || game.mirrorsActive;
  }

  function platformXAt(platform, elapsed) {
    if (!platform.motion) return platform.x;
    var motion = platform.motion;
    var phase = (Math.sin((elapsed / motion.period) * Math.PI * 2 + (motion.phase || 0)) + 1) / 2;
    return motion.minX + (motion.maxX - motion.minX) * phase;
  }

  function updatePlatforms(game) {
    game.platforms.forEach(function (platform) {
      if (!platform.motion) return;
      var oldX = platform.x;
      platform.x = platformXAt(platform, game.elapsed);
      if (game.player.supportId === platform.id && game.player.onGround) game.player.x += platform.x - oldX;
    });
  }

  function zoneAtPlayer(player, zones) {
    return zones.find(function (zone) {
      return player.x + player.w / 2 > zone.x && player.x + player.w / 2 < zone.x + zone.w &&
        player.y + player.h > zone.y && player.y < zone.y + zone.h;
    });
  }

  function advancePlayer(game, input, dt) {
    var player = game.player;
    var direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    var oldBottom = player.y + player.h;
    var wasGrounded = player.onGround;

    if (input.jump && !game.lastJump) player.jumpBuffer = 0.12;
    else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    game.lastJump = !!input.jump;
    player.coyote = wasGrounded ? 0.1 : Math.max(0, player.coyote - dt);
    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -JUMP_SPEED;
      player.jumpBuffer = 0;
      player.coyote = 0;
      player.onGround = false;
      player.supportId = null;
    }

    if (!input.jumpHeld && player.vy < 0) player.vy += GRAVITY * 1.05 * dt;
    var ice = wasGrounded && zoneAtPlayer(player, game.level.iceZones || []);
    var targetSpeed = direction * MOVE_SPEED;
    var horizontalAccel = player.onGround ? (ice ? 620 : 2100) : 1550;
    if (direction) player.facing = direction;
    if (Math.abs(targetSpeed - player.vx) <= horizontalAccel * dt) player.vx = targetSpeed;
    else player.vx += Math.sign(targetSpeed - player.vx) * horizontalAccel * dt;
    if (!direction && player.onGround) {
      var friction = ice ? 175 : 2500;
      if (Math.abs(player.vx) <= friction * dt) player.vx = 0;
      else player.vx -= Math.sign(player.vx) * friction * dt;
    }

    var wind = zoneAtPlayer(player, game.level.windZones || []);
    if (wind) player.vy -= wind.force * dt;
    player.vy = Math.min(player.vy + GRAVITY * dt, 980);
    player.x += player.vx * dt;
    player.x = Math.max(0, Math.min(game.level.width - player.w, player.x));
    player.y += player.vy * dt;
    player.onGround = false;
    player.supportId = null;

    if (player.vy >= 0) {
      var landing = null;
      game.platforms.forEach(function (platform) {
        if (!usablePlatform(game, platform)) return;
        var horizontallyOver = player.x < platform.x + platform.w && player.x + player.w > platform.x;
        var crossedTop = oldBottom <= platform.y + 4 && player.y + player.h >= platform.y;
        if (horizontallyOver && crossedTop && (!landing || platform.y < landing.y)) landing = platform;
      });
      if (landing) {
        player.y = landing.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.supportId = landing.id;
      }
    }
  }

  function respawn(game, reason) {
    var player = game.player;
    var platform = game.platforms.find(function (entry) { return entry.id === game.checkpoint.platformId; });
    if (!platform) platform = game.platforms.find(function (entry) { return entry.id === game.level.spawn.platformId; });
    player.x = game.checkpoint.x;
    player.y = platform.y - player.h;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    player.supportId = platform.id;
    player.invuln = 1.15;
    player.lives -= 1;
    if (player.lives <= 0) player.lives = 3;
    game.events.push({ type: 'respawn', reason: reason || 'fall' });
  }

  function updateEnemies(game, dt) {
    game.enemies.forEach(function (enemy) {
      if (enemy.dead) return;
      enemy.x += enemy.speed * dt * (enemy.direction || 1);
      if (enemy.x < enemy.minX) { enemy.x = enemy.minX; enemy.direction = 1; }
      if (enemy.x + enemy.w > enemy.maxX) { enemy.x = enemy.maxX - enemy.w; enemy.direction = -1; }
    });
  }

  function damagePlayer(game, reason) {
    if (game.player.invuln > 0) return;
    respawn(game, reason);
  }

  function fireIceball(game) {
    var player = game.player;
    game.projectiles.push({
      x: player.facing > 0 ? player.x + player.w : player.x - 12,
      y: player.y + 12, w: 14, h: 14, vx: player.facing * 420, life: 1.6
    });
    game.shootCooldown = 0.32;
    game.events.push({ type: 'shoot' });
  }

  function updateProjectiles(game, dt) {
    game.projectiles = game.projectiles.filter(function (shot) {
      shot.x += shot.vx * dt;
      shot.life -= dt;
      if (shot.life <= 0 || shot.x < 0 || shot.x > game.level.width) return false;
      var hit = false;
      game.enemies.forEach(function (enemy) {
        if (!enemy.dead && overlap(shot, enemy)) {
          enemy.dead = true;
          hit = true;
          game.events.push({ type: 'enemy-frozen', id: enemy.id });
        }
      });
      if (game.boss && game.boss.hp > 0 && game.boss.invuln <= 0 && overlap(shot, game.boss)) {
        game.boss.hp -= 1;
        game.boss.invuln = 0.42;
        game.boss.frozen = 0.82;
        hit = true;
        game.events.push({ type: 'boss-hit', hp: game.boss.hp });
      }
      return !hit;
    });
  }

  function step(game, input, delta) {
    if (!game || game.completed) return [];
    input = input || {};
    var dt = Math.max(0, Math.min(0.05, Number(delta) || 1 / 60));
    game.events = [];
    game.elapsed += dt;
    game.shootCooldown = Math.max(0, game.shootCooldown - dt);
    if (game.boss) {
      game.boss.invuln = Math.max(0, game.boss.invuln - dt);
      game.boss.frozen = Math.max(0, game.boss.frozen - dt);
    }
    game.player.invuln = Math.max(0, game.player.invuln - dt);
    updatePlatforms(game);
    updateEnemies(game, dt);
    advancePlayer(game, input, dt);

    var player = game.player;
    if (player.y > game.level.height + 30) respawn(game, 'fall');
    if (player.invuln <= 0) {
      var hazard = (game.level.hazards || []).find(function (entry) { return overlap(player, entry); });
      if (hazard) respawn(game, hazard.kind);
    }

    if (!game.itemCollected && overlap(player, {
      x: game.level.item.x - 12, y: game.level.item.y - 12, w: 24, h: 24
    })) {
      game.itemCollected = true;
      game.events.push({ type: 'item', name: game.level.item.name });
    }

    (game.level.checkpoints || []).forEach(function (checkpoint) {
      if (player.supportId === checkpoint.platformId && Math.abs(player.x - checkpoint.x) < 30 &&
          game.checkpoint.platformId !== checkpoint.platformId) {
        game.checkpoint = { x: checkpoint.x, platformId: checkpoint.platformId };
        game.events.push({ type: 'checkpoint' });
      }
    });

    if (game.level.mirrorSwitch && input.interact && !game.lastInteract) {
      var sw = game.level.mirrorSwitch;
      var dx = player.x + player.w / 2 - sw.x;
      var dy = player.y + player.h / 2 - sw.y;
      if (Math.sqrt(dx * dx + dy * dy) <= sw.radius) {
        game.mirrorsActive = !game.mirrorsActive;
        game.events.push({ type: 'mirror', active: game.mirrorsActive });
      }
    }
    game.lastInteract = !!input.interact;

    game.enemies.forEach(function (enemy) {
      if (enemy.dead || player.invuln > 0 || !overlap(player, enemy)) return;
      var previousBottom = player.y + player.h - player.vy * dt;
      if (player.vy > 0 && previousBottom <= enemy.y + 10) {
        enemy.dead = true;
        player.vy = -300;
        player.onGround = false;
        game.events.push({ type: 'enemy-stomp', id: enemy.id });
      } else damagePlayer(game, 'enemy');
    });

    if (input.shoot && !game.lastShoot && game.shootCooldown <= 0) fireIceball(game);
    game.lastShoot = !!input.shoot;
    updateProjectiles(game, dt);
    if (game.boss && game.boss.hp <= 0) game.events.push({ type: 'boss-defeated' });

    var goalOpen = !game.boss || game.boss.hp <= 0;
    if (goalOpen && overlap(player, game.level.goal)) {
      game.completed = true;
      game.events.push({ type: 'complete', itemCollected: game.itemCollected });
    }
    return game.events.slice();
  }

  function canJumpBetween(level, from, to) {
    if (!from || !to) return false;
    if (from.y - to.y > MAX_SAFE_RISE) return false;
    var period = Math.max(from.motion ? from.motion.period : 0, to.motion ? to.motion.period : 0);
    var phaseCount = period ? 24 : 1;
    var holdOptions = [12, 24, 36];
    for (var phaseIndex = 0; phaseIndex < phaseCount; phaseIndex += 1) {
      var startTime = period ? period * phaseIndex / phaseCount : 0;
      for (var h = 0; h < holdOptions.length; h += 1) {
        var source = cloneObject(from);
        var target = cloneObject(to);
        source.x = platformXAt(source, startTime);
        target.x = platformXAt(target, startTime);
        var horizontalGap = Math.max(0, target.x - (source.x + source.w), source.x - (target.x + target.w));
        if (horizontalGap > MAX_SAFE_JUMP_GAP) continue;
        var game = {
          level: {
            width: Math.max(source.x + source.w, target.x + target.w) + 100,
            height: level.height || WORLD_HEIGHT,
            windZones: [], iceZones: []
          },
          platforms: [source, target], mirrorsActive: true, elapsed: startTime,
          player: {
            x: Math.max(source.x, source.x + source.w - PLAYER_W - 5),
            y: source.y - PLAYER_H, vx: 0, vy: 0,
            w: PLAYER_W, h: PLAYER_H, onGround: true, supportId: source.id,
            coyote: 0.1, jumpBuffer: 0, facing: 1
          },
          lastJump: false
        };
        var direction = target.x + target.w / 2 >= source.x + source.w / 2 ? 1 : -1;
        for (var frame = 0; frame < 105; frame += 1) {
          game.elapsed += 1 / 60;
          updatePlatforms(game);
          advancePlayer(game, {
            left: direction < 0, right: direction > 0,
            jump: frame === 0, jumpHeld: frame < holdOptions[h]
          }, 1 / 60);
          if (game.player.onGround && game.player.supportId === target.id) return true;
          if (game.player.y > game.level.height) break;
          if (game.player.onGround && game.player.supportId === source.id && frame > holdOptions[h] + 8) break;
        }
      }
    }
    return false;
  }

  function validateLevels(levelsToCheck) {
    var levels = Array.isArray(levelsToCheck) ? levelsToCheck : LEVELS;
    var errors = [];
    var checkedJumps = 0;
    var ids = new Set();
    var itemIds = new Set();
    var itemTypes = new Set();
    var gimmicks = new Set();
    if (levels.length !== 5) errors.push('必须恰好有五关。');

    levels.forEach(function (level) {
      if (ids.has(level.id)) errors.push(level.name + '：关卡 ID 重复。');
      ids.add(level.id);
      if (itemIds.has(level.item.id)) errors.push(level.name + '：收集物 ID 重复。');
      itemIds.add(level.item.id);
      if (itemTypes.has(level.item.type)) errors.push(level.name + '：收集物类型重复。');
      itemTypes.add(level.item.type);
      if (gimmicks.has(level.gimmickId)) errors.push(level.name + '：关卡机关重复。');
      gimmicks.add(level.gimmickId);
      if (!level.item.name || !level.item.glyph) errors.push(level.name + '：专属收集物信息不完整。');
      if (!level.platforms.some(function (platform) { return platform.id === level.spawn.platformId; })) {
        errors.push(level.name + '：出生平台不存在。');
      }
      if (!level.route || level.route.length < 2) {
        errors.push(level.name + '：主路线必须至少包含起点和终点平台。');
        return;
      }
      if (level.route[0] !== level.spawn.platformId) {
        errors.push(level.name + '：主路线未连接出生点。');
      }
      var routeEnd = level.platforms.find(function (platform) { return platform.id === level.route[level.route.length - 1]; });
      if (routeEnd && (level.goal.x < routeEnd.x || level.goal.x + level.goal.w > routeEnd.x + routeEnd.w ||
          Math.abs(level.goal.y + level.goal.h - routeEnd.y) > 6)) {
        errors.push(level.name + '：主路线末端没有接上终点。');
      }
      for (var i = 0; i < level.route.length - 1; i += 1) {
        var from = level.platforms.find(function (platform) { return platform.id === level.route[i]; });
        var to = level.platforms.find(function (platform) { return platform.id === level.route[i + 1]; });
        if (!from || !to) {
          errors.push(level.name + '：主路线引用了不存在的平台。');
          continue;
        }
        if (to.hidden) {
          var switchPoint = level.mirrorSwitch;
          if (!switchPoint || switchPoint.x < from.x || switchPoint.x > from.x + from.w ||
              Math.abs(switchPoint.y - from.y) > PLAYER_H + 8) {
            errors.push(level.name + '：进入镜面机关平台前，镜面开关不可到达。');
          }
        }
        checkedJumps += 1;
        var sampleGap = Math.max(0, to.x - (from.x + from.w), from.x - (to.x + to.w));
        if (from.motion) sampleGap = Math.min(sampleGap, Math.max(0, to.x - (from.motion.maxX + from.w), from.motion.minX - (to.x + to.w)));
        if (to.motion) sampleGap = Math.min(sampleGap, Math.max(0, to.motion.minX - (from.x + from.w), from.x - (to.motion.maxX + to.w)));
        var gap = sampleGap;
        if (gap > MAX_SAFE_JUMP_GAP) errors.push(level.name + '：' + from.id + ' 到 ' + to.id + ' 的缺口超出安全余量。');
        if (from.y - to.y > MAX_SAFE_RISE) errors.push(level.name + '：' + to.id + ' 高度超出安全攀升范围。');
        if (!canJumpBetween(level, from, to)) errors.push(level.name + '：实际物理模拟无法从 ' + from.id + ' 跳到 ' + to.id + '。');
      }
    });
    return { errors: errors, checkedJumps: checkedJumps, levelCount: levels.length };
  }

  return {
    PLAYER_W: PLAYER_W, PLAYER_H: PLAYER_H,
    GRAVITY: GRAVITY, JUMP_SPEED: JUMP_SPEED, MOVE_SPEED: MOVE_SPEED,
    MAX_JUMP_DISTANCE: MAX_JUMP_DISTANCE, MAX_SAFE_JUMP_GAP: MAX_SAFE_JUMP_GAP,
    LEVELS: LEVELS, createGame: createGame, step: step,
    canJumpBetween: canJumpBetween, validateLevels: validateLevels
  };
}));
