'use strict';

import { ErrorMapper } from "utils/ErrorMapper";
import { roomManager } from "managers/roomManager";
import { creepManager } from "managers/creepManager";
import { memoryManager } from "managers/memoryManager";
import { USE_PROFILER } from './settings';
import profiler from './profiler/screeps-profiler';
import { GameState } from 'state/state'

// global state
let gameState: GameState = new GameState();

function main(): void {

  memoryManager.run();

  gameState.run();

  roomManager.run();

  creepManager.run();

};

export const loop = ErrorMapper.wrapLoop(() => {
  profiler.wrap(main);
});

// This gets run on each global reset
function onGlobalReset(): void {
  if (USE_PROFILER) profiler.enable();

  // Is this necessary?
  gameState.initState();

}

// Run the global reset code
onGlobalReset();

