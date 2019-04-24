import { profile } from "profiler/decorator";

@profile
export class MyHostileCreep {
    creepID: string;

    constructor(creep: Creep) {
        this.creepID = creep.id;
    }

}
