import { profile } from "profiler/decorator";

@profile
export class MyHostileCreep {
    public creepID: string;

    constructor(creep: Creep) {
        this.creepID = creep.id;
    }

}
