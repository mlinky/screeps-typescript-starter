import { profile } from "profiler/decorator";
import { MyDefault } from "./default";

@profile
export class MyExtension extends MyDefault {

}
