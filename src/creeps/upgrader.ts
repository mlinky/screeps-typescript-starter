import { profile } from "profiler/decorator";
import { MyCreep } from "creeps/creep";
import { log } from "log/log";
import { MyCluster } from "state/cluster";
import { Tasks } from "creep-tasks/Tasks";
import { gameState } from "defs";

@profile
export class CreepUpgrader extends MyCreep {
    controllerID: string = '';
    containerID: string = '';

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

        // Grab container ID
        if (this.controllerID == '' && gameState.rooms[this.homeRoom].controller) {
            this.controllerID = gameState.rooms[this.homeRoom].controller!.id;
        }

        // Grab containerID
        if (this.containerID == '' && this.controllerID != '' && gameState.rooms[this.homeRoom].controller && gameState.rooms[this.homeRoom].controller!.container) {
            this.containerID = gameState.rooms[this.homeRoom].controller!.container!.id;
        }

        if (this.creep.carry.energy > 0) {
            // Go do upgrade
            this.creep.task = Tasks.upgrade(<StructureController>Game.getObjectById(this.controllerID));
        } else {
            // Go get energy
            if (this.containerID != '') {
                let c: StructureContainer = <StructureContainer>Game.getObjectById(this.containerID);

                if (c && c.store[RESOURCE_ENERGY] > 0) {
                    this.creep.task = Tasks.withdraw(c, RESOURCE_ENERGY);
                    return;
                }
            }

            // Get energy elsewhere
            this.energyPickup();

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
