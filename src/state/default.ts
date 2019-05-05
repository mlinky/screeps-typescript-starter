import { profile } from "profiler/decorator";

@profile
export class MyDefault {
    public id: string;

    constructor(id: string) {
        this.id = id;
    }

}
