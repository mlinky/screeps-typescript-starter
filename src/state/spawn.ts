import { MyDefault } from "./default";
import { profile } from "profiler/decorator";

@profile
export class MySpawn extends MyDefault {
    name: string;

    constructor(s: StructureSpawn) {
        super(s.id);

        this.name = s.name;

    }

}
