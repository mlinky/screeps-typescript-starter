import '../prototypes/creep.prototype';
import { profile } from "profiler/decorator";
import { log } from 'log/log';
import { MyCluster } from 'state/cluster';
import { MyRoom } from 'state/room';

@profile
export class MyCreep {
    name: string;
    role: string;
    homeRoom: string;
    workRoom: string;

    constructor(creep: Creep) {
        this.name = creep.name;
        this.role = creep.role;
        this.homeRoom = creep.homeRoom;
        this.workRoom = creep.workRoom;
    }

    get creep() {
        return Game.creeps[this.name];
    }

    check() {


    }

    run() {

        //log.info('Base creep running');

    }

    required(cluster: MyCluster) {

    }

    findDroppedEnergy(room: MyRoom): Resource | undefined {

        for (let r of room.room.droppedResource) {
            if (r.resourceType == RESOURCE_ENERGY) {
                return r;
            }
        }

        return;

    }

}
