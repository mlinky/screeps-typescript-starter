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
  settings: any;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    help: string;
    report: (clusterName?: string | undefined) => string;
    showSpawnQueue: (clusterName?: string | undefined) => string;
    creepCensus: () => string;
    debug: (type: string, name: string) => void;
    log: any;
  }
}

declare module 'screeps-profiler';
