import { profile } from "profiler/decorator";
import { MyCreep } from "creeps/creep";
import { log } from "log/log";
import { MyCluster } from "state/cluster";
import { Tasks } from "creep-tasks/Tasks";
import { gameState } from "defs";

@profile
export class CreepUpgrader extends MyCreep {

    constructor(creep: Creep) {
        super(creep);
    }

    run() {

        // log.info('Upgrader running');
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
            // Go do upgrade
            // log.info('setting upgrade');
            this.creep.task = Tasks.upgrade(gameState.rooms[this.homeRoom].controller!.controller);

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
        // How many upgraders required for the cluster
        if (gameState.rooms[cluster.clusterName].controller) {
            switch (gameState.rooms[cluster.clusterName].controller!.controller.level) {
                case 1: {
                    return 2;
                }
                default: {
                    return 3;
                }

            }
        }
        return 1;
    }
}
