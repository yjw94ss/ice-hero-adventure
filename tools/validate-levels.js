#!/usr/bin/env node
'use strict';

const core = require('../game-core.js');

function runValidation() {
  return core.validateLevels();
}

if (require.main === module) {
  const result = runValidation();
  result.errors.forEach((error) => console.error('✗ ' + error));
  if (result.errors.length) {
    console.error(`\n关卡验证失败：${result.errors.length} 项问题。`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${result.levelCount} 关结构有效，专属物品不重复。`);
    console.log(`✓ ${result.checkedJumps} 段主路线跳跃均通过实际物理模拟。`);
    console.log(`✓ 安全缺口上限 ${core.MAX_SAFE_JUMP_GAP}px；实测满跳水平距离约 ${core.MAX_JUMP_DISTANCE.toFixed(0)}px。`);
  }
}

module.exports = { runValidation };
