import { MyDefault } from "./default";
import { profile } from "profiler/decorator";

@profile
export class MyContructionSite extends MyDefault {
    type: BuildableStructureConstant;

    constructor(site: ConstructionSite) {
        super(site.id);

        this.type = site.structureType;

    }

}
