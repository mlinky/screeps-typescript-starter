import '../prototypes/creep.prototype';
import { profile } from "profiler/decorator";
import { log } from 'log/log';

@profile
export class MyCreep {
    creep: Creep;
    name: string;
    role: string;
    homeRoom: string;
    workRoom: string;

    constructor(creep: Creep) {
        this.creep = creep;
        this.name = creep.name;
        this.role = creep.role;
        this.homeRoom = creep.homeRoom;
        this.workRoom = creep.workRoom;
    }

    check() {


    }

    run() {

        //log.info('Base creep running');

    }


}
