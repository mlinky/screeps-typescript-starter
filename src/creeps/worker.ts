import { profile } from "profiler/decorator";
import { MyCreep } from "creeps/creep";
import { log } from "log/log";
import { MyCluster } from "state/cluster";
import { Tasks } from "creep-tasks/Tasks";
import { gameState } from "defs";

@profile
export class CreepWorker extends MyCreep {

    constructor(creep: Creep) {
        super(creep);
    }

    run() {

        //log.info('Worker running');
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
            // Emergency repair
            // Build
            // Normal repair
            //this.creep.task = Tasks.upgrade(gameState.rooms[this.homeRoom].controller!.controller);
            let s: ConstructionSite | undefined = this.findConstructionSite(gameState.rooms[this.homeRoom]);

            if (s) {
                this.creep.task = Tasks.build(s);
                return;
            }

            let targets = gameState.rooms[this.homeRoom].room.find(FIND_STRUCTURES, {
                filter: object => object.hits < object.hitsMax * 0.8
            });

            if (targets.length > 0) {
                this.creep.task = Tasks.repair(targets[0]);
                return;
            }

            // Default to upgrade instead, if no work to do
            this.creep.task = Tasks.upgrade(gameState.rooms[this.homeRoom].controller!.controller);

        } else {
            // Go get energy
            // log.info('setting collect');
            this.energyPickup();
        }
    }

    public static required(cluster: MyCluster): number {
        // How many miners required for the cluster
        if (gameState.rooms[cluster.clusterName].controller) {
            switch (gameState.rooms[cluster.clusterName].controller!.controller.level) {
                case 1: {
                    return 2;
                }
                case 2: {
                    return 2;
                }
                case 3: {
                    return 4;
                }
                case 4: {
                    return 2;
                }
                case 5: {
                    return 2;
                }
                case 6: {
                    return 2;
                }
                case 7: {
                    return 2;
                }
                case 8: {
                    return 2;
                }
                default: {
                    return 5;
                }
            }
        }
        return 1;
    }
}
