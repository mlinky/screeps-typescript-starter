import { Tasks } from "creep-tasks/Tasks";
import { MyCreep } from "creeps/creep";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { MyCluster } from "state/cluster";

@profile
export class CreepHauler extends MyCreep {

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {

        // log.info('Hauler running');
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
            const t = this.findEnergyDestination(gameState.rooms[this.workRoom]);

            if (t) {
                this.creep.task = Tasks.transfer(t);
                return;
            }

        } else {
            // Go get energy
            // log.info('setting collect');
            this.energyPickup();
        }
    }

    public static required(cluster: MyCluster): number {
        // How many haulers required for the cluster
        if (gameState.rooms[cluster.clusterName].controller) {
            switch (gameState.rooms[cluster.clusterName].controller!.controller.level) {
                case 1: {
                    return 2;
                }
                case 2: {
                    return 2;
                }
                case 3: {
                    return 3;
                }
                case 4: {
                    return 3;
                }
                case 5: {
                    return 3;
                }
                case 6: {
                    return 3;
                }
                case 7: {
                    return 3;
                }
                case 8: {
                    return 3;
                }
                default: {
                    return 3;
                }

            }
        }
        return 2;
    }
}
