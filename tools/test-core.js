'use strict';

const assert = require('node:assert/strict');
const core = require('../game-core.js');

assert.equal(core.LEVELS.length, 5, 'game has five authored levels');
assert.equal(new Set(core.LEVELS.map((level) => level.id)).size, 5, 'level ids are unique');
assert.equal(new Set(core.LEVELS.map((level) => level.item.id)).size, 5, 'collectible ids are unique');
assert.equal(new Set(core.LEVELS.map((level) => level.item.type)).size, 5, 'collectible types are unique');

const game = core.createGame(0);
const startY = game.player.y;
core.step(game, { jump: true, jumpHeld: true }, 1 / 60);
assert.ok(game.player.y < startY, 'jump input moves the hero upward');

for (let i = 0; i < 120; i += 1) core.step(game, {}, 1 / 60);
assert.equal(game.player.onGround, true, 'hero lands after a jump');

const windGame = core.createGame(1);
const windZone = windGame.level.windZones[0];
windGame.player.x = windZone.x + 100;
windGame.player.y = windZone.y + 40;
windGame.player.vy = 0;
windGame.player.onGround = false;
windGame.player.supportId = null;
core.step(windGame, {}, 1 / 60);
assert.ok(windGame.player.vy < 0, 'standing in an updraft accelerates the hero upward');

const checkpoint = game.checkpoint;
game.player.y = game.level.height + 80;
core.step(game, {}, 1 / 60);
assert.equal(game.player.x, checkpoint.x, 'falling returns the hero to the active checkpoint');
assert.equal(game.player.onGround, true, 'respawn restores a grounded hero');

const movingGame = core.createGame(2);
const minecart = movingGame.platforms.find((platform) => platform.motion);
assert.ok(minecart, 'mine level includes its moving cart platform');
assert.ok(movingGame.level.route.includes('minecart'), 'minecart is part of the required mine route');
const cartStart = minecart.x;
core.step(movingGame, {}, 1 / 60);
assert.ok(Math.abs(minecart.x - cartStart) < 10, 'minecart does not jump on its first frame');
for (let i = 0; i < 90; i += 1) core.step(movingGame, {}, 1 / 60);
assert.notEqual(minecart.x, cartStart, 'moving cart advances with game time');

const mirrorGame = core.createGame(3);
mirrorGame.player.x = mirrorGame.level.mirrorSwitch.x;
mirrorGame.player.y = mirrorGame.level.mirrorSwitch.y - core.PLAYER_H;
core.step(mirrorGame, { interact: true }, 1 / 60);
assert.equal(mirrorGame.mirrorsActive, true, 'interacting at the mirror reveals its platforms');

const bossGame = core.createGame(4);
bossGame.player.x = 1380;
bossGame.player.y = 450 - core.PLAYER_H;
bossGame.player.onGround = true;
bossGame.player.supportId = 'castle-arena';
core.step(bossGame, { shoot: true }, 1 / 60);
for (let i = 0; i < 20; i += 1) core.step(bossGame, {}, 1 / 60);
assert.equal(bossGame.boss.hp, 2, 'an iceball reduces the aurora boss health');

const brokenStart = structuredClone(core.LEVELS);
brokenStart[0].route[0] = 'village-bridge';
assert.ok(core.validateLevels(brokenStart).errors.some((error) => error.includes('出生点')),
  'route validation rejects a route detached from its spawn platform');
const brokenGoal = structuredClone(core.LEVELS);
brokenGoal[0].route[brokenGoal[0].route.length - 1] = 'village-field';
assert.ok(core.validateLevels(brokenGoal).errors.some((error) => error.includes('终点')),
  'route validation rejects a route that does not reach the goal');
const brokenMirror = structuredClone(core.LEVELS);
brokenMirror[3].mirrorSwitch.x = 1200;
assert.ok(core.validateLevels(brokenMirror).errors.some((error) => error.includes('镜面机关')),
  'route validation requires an accessible mirror switch before a hidden bridge');

console.log('核心行为检查通过：关卡/物品唯一、跳跃落地、上升气流、检查点、矿车、镜面机关、Boss 与路线端点。');
