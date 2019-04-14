import { profile } from "profiler/decorator";

@profile
export class MyCreep {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

}
