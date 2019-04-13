import { profile } from '../profiler/decorator';

@profile
export abstract class memoryManager {

  public static run(): void {

    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
      }
    }

  }

}
