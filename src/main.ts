'use strict';

import 'creep-tasks/prototypes'
import { gameState } from "defs";
import { MyConsole } from 'log/console'
import { log } from "log/log";
import { memoryManager } from "managers/memoryManager";
import 'prototypes/room.prototype';
import { ErrorMapper } from "utils/ErrorMapper";
import profiler from './profiler/screeps-profiler';
import { USE_PROFILER } from './settings';

function main(): void {

  // let used = Game.cpu.getUsed();

  memoryManager.run();

  // used = reportCPU('memoryManager', used);

  gameState.run();

  // used = reportCPU('gameState', used);

  // roomManager.run();

  // used = reportCPU('roomManager', used);

  // creepManager.run();

  // used = reportCPU('creepManager', used);

};

// export const loop = ErrorMapper.wrapLoop(() => {
//   profiler.wrap(main);
// });

// tslint:disable-next-line:only-arrow-functions
export const loop = function () {
  profiler.wrap(main);
};

// This gets run on each global reset
function onGlobalReset(): void {
  if (USE_PROFILER) { profiler.enable(); }

  MyConsole.init();
  gameState.initState();

}

function reportCPU(label: string, lastCPU: number): number {

  log.info(`CPU used for ${label}: ${(Game.cpu.getUsed() - lastCPU).toFixed(2)}`);

  return Game.cpu.getUsed();

}

// Run the global reset code
onGlobalReset();

