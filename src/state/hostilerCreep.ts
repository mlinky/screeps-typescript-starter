import { profile } from "profiler/decorator";

@profile
export class MyHostileCreep {
    public id: string;
    public bodyParts: BodyPartDefinition[];
    public pos: RoomPosition;

    constructor(creep: Creep) {
        this.id = creep.id;
        this.bodyParts = creep.body;
        this.pos = creep.pos;
    }

}
