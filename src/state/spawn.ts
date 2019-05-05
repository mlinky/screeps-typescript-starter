import { profile } from "profiler/decorator";
import { MyDefault } from "./default";

@profile
export class MySpawn extends MyDefault {
    public name: string;

    constructor(s: StructureSpawn) {
        super(s.id);

        this.name = s.name;

    }

}
