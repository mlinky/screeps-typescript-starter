import { MyDefault } from "./default";
import { profile } from "profiler/decorator";

@profile
export class MyController extends MyDefault {

}
