import { profile } from "profiler/decorator";
import { MyDefault } from "./default";

@profile
export class MyStorage extends MyDefault {
    public pos: RoomPosition;

    constructor(s: StructureStorage) {
        super(s.id);

        this.pos = s.pos;

    }

}
