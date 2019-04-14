import { MyDefault } from "./default";
import { profile } from "profiler/decorator";

@profile
export class MyExtension extends MyDefault {

}
