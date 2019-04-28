import { profile } from "profiler/decorator";
import { MyCreep } from "creeps/creep";
import { log } from "log/log";
import { MyCluster } from "state/cluster";
import { Tasks } from "creep-tasks/Tasks";
import { gameState } from "defs";

@profile
export class CreepHauler extends MyCreep {

    constructor(creep: Creep) {
        super(creep);
    }

    run() {

        //log.info('Hauler running');
        if (this.creep.isIdle) {
            this.newTask();
        }

        this.creep.run()

    }

    private newTask() {

        // log.info('running newTask');
        // log.info(`Creep energy ${this.creep.carry.energy}`);
        // log.info(`Creep energy ${Game.creeps[this.name].carry.energy}`);

        if (this.creep.carry.energy > 0) {
            // Deliver energy to spawn, extension, storage
            // log.info('setting transfer');
            this.creep.task = Tasks.transfer(<StructureSpawn>Game.getObjectById('5cbdd7a617d6ac3588f51303'));


        } else {
            // Go get energy
            // log.info('setting collect');
            let r: Resource | undefined = this.findDroppedEnergy(gameState.rooms[this.homeRoom])

            if (r) {
                this.creep.task = Tasks.pickup(r);
            }
        }
    }

    public static required(cluster: MyCluster): number {
        // How many haulers required for the cluster

        return 2;
    }
}
