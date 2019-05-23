import { profile } from "profiler/decorator";
import { MyDefault } from "./default";

@profile
export class MyContructionSite extends MyDefault {
    public type: BuildableStructureConstant;
    public pos: RoomPosition;

    constructor(site: ConstructionSite) {
        super(site.id);

        this.type = site.structureType;

        this.pos = site.pos;

    }

}
