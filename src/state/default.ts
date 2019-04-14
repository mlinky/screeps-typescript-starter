import { profile } from "profiler/decorator";

@profile
export class MyDefault {
    id: string;

    constructor(id: string) {
        this.id = id;
    }

}
