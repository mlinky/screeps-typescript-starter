import { MyDefault } from "./default";
import { profile } from "profiler/decorator";

@profile
export class MyController extends MyDefault {
    controller: StructureController

    constructor(controller: StructureController) {

        super(controller.id);

        this.controller = controller;

    }

}
