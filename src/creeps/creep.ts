import '../prototypes/creep.prototype';
import { profile } from "profiler/decorator";
import { log } from 'log/log';
import { MyCluster } from 'state/cluster';
import { MyRoom } from 'state/room';
import { gameState } from 'defs';
import { Tasks } from 'creep-tasks/Tasks';

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
            if (r.resourceType == RESOURCE_ENERGY && r.amount >= this.creep.carryCapacity) {
                return r;
            }
        }

        return;

    }

    findConstructionSite(room: MyRoom): ConstructionSite | undefined {

        for (let i in gameState.rooms[this.workRoom].constructionSites) {
            let o = <ConstructionSite>Game.getObjectById(i);

            if (o) {
                // Object is valid
                return o;
            } else {
                // Construction complete
                gameState.rooms[this.workRoom].constructionComplete(i);
            }
        }
        return;
    }
}
