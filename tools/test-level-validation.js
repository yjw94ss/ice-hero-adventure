'use strict';

const assert = require('node:assert/strict');
const { runValidation } = require('./validate-levels.js');

const result = runValidation();
assert.deepEqual(result.errors, [], 'all authored levels and route jumps are valid');
assert.equal(result.levelCount, 5, 'all five levels are checked');
assert.equal(result.checkedJumps, 22, 'every main-route jump is simulated');
console.log('关卡校验测试通过：五关结构、专属物品与 22 段主路线跳跃全部合格。');
