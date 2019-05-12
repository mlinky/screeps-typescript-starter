import { Tasks } from "creep-tasks/Tasks";
import { MyCreep } from "creeps/creep";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { MyCluster } from "state/cluster";

@profile
export class CreepManager extends MyCreep {

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {

        // log.info('Manager running');
        if (this.creep.isIdle) {
            this.newTask();
        }

        this.creep.run()

    }

    private newTask() {

        if (this.creep.carry.energy > 0) {
            // Deliver energy to spawn, extension, storage
            // log.info('setting transfer');
            const t = this.findManagerDestination(gameState.rooms[this.homeRoom]);

            if (t) {
                this.creep.task = Tasks.transfer(t);
                return;
            }

        } else {
            // Go get energy
            // log.info('setting collect');
            if (this.creep.room.storage) {
                this.creep.task = Tasks.withdraw(this.creep.room.storage, RESOURCE_ENERGY)
            }
        }
    }

    public static required(cluster: MyCluster): number {
        // How many haulers required for the cluster
        if (gameState.rooms[cluster.clusterName].controller) {
            switch (gameState.rooms[cluster.clusterName].controller!.level()) {
                case 1:
                case 2:
                case 3: {
                    return 1;
                }
                case 4: {
                    return 1;
                }
                case 5: {
                    return 1;
                }
                case 6: {
                    return 1;
                }
                case 7: {
                    return 1;
                }
                case 8: {
                    return 1;
                }
                default: {
                    return 3;
                }

            }
        }
        return 0;
    }
}
