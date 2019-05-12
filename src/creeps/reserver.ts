import { profile } from "profiler/decorator";

import { CreepClaimer } from "./claimer";

@profile
export class CreepReserver extends CreepClaimer {

    constructor(creep: Creep) {
        super(creep);
    }

}
