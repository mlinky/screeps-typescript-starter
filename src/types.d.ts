// memory extension samples
interface CreepMemory {
  role: string;
  room?: string;
  homeRoom: string;
  workRoom: string;
  working?: boolean;
}

interface Memory {
  uuid: number;
  log: any;
  profiler?: any;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    //    Profiler: Profiler;
    log: any;
  }
}

declare module 'screeps-profiler'
