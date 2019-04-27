'use strict';

import 'prototypes/room.prototype';
import 'creep-tasks/prototypes'
import { ErrorMapper } from "utils/ErrorMapper";
import { memoryManager } from "managers/memoryManager";
import { USE_PROFILER } from './settings';
import profiler from './profiler/screeps-profiler';
import { MyConsole } from 'log/console'
import { log } from "log/log";
import { gameState } from "defs";

function main(): void {

  //let used = Game.cpu.getUsed();

  memoryManager.run();

  //used = reportCPU('memoryManager', used);

  gameState.run();

  //used = reportCPU('gameState', used);

  // roomManager.run();

  // used = reportCPU('roomManager', used);

  // creepManager.run();

  // used = reportCPU('creepManager', used);

};

// export const loop = ErrorMapper.wrapLoop(() => {
//   profiler.wrap(main);
// });

export const loop = function () {
  profiler.wrap(main);
};

// This gets run on each global reset
function onGlobalReset(): void {
  if (USE_PROFILER) profiler.enable();

  MyConsole.init();
  gameState.initState();

}

function reportCPU(label: string, lastCPU: number): number {

  log.info(`CPU used for ${label}: ${(Game.cpu.getUsed() - lastCPU).toFixed(2)}`);

  return Game.cpu.getUsed();

}

// Run the global reset code
onGlobalReset();

