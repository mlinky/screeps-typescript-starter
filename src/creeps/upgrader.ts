import { Tasks } from "creep-tasks/Tasks";
import { MyCreep } from "creeps/creep";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { MyCluster } from "state/cluster";

@profile
export class CreepUpgrader extends MyCreep {
    public controllerID: string = '';
    public containerID: string = '';

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {

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
        if (this.controllerID === '' && gameState.rooms[this.homeRoom].controller) {
            this.controllerID = gameState.rooms[this.homeRoom].controller!.id;
        }

        // Grab containerID
        if (this.containerID === '' && this.controllerID !== '' && gameState.rooms[this.homeRoom].controller && gameState.rooms[this.homeRoom].controller!.container) {
            this.containerID = gameState.rooms[this.homeRoom].controller!.container!.id;
        }

        if (this.creep.carry.energy > 0) {
            // Go do upgrade
            this.creep.task = Tasks.upgrade(Game.getObjectById(this.controllerID) as StructureController);
        } else {
            // Go get energy
            if (this.containerID !== '') {
                const c: StructureContainer = Game.getObjectById(this.containerID) as StructureContainer;

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
                case 2: {
                    return 2;
                }
                case 3: {
                    return 2;
                }
                default: {
                    if (!Game.rooms[cluster.clusterName]) {
                        // No access to the room
                        return 0;
                    }

                    if (!Game.rooms[cluster.clusterName].storage) {
                        // Room has no storage yet - just 1 upgrader
                        return 1;
                    }

                    if (Game.rooms[cluster.clusterName].storage!.store.energy < 100000) {
                        // Not much storage - only one upgrader
                        return 1;
                    }

                    if (Game.rooms[cluster.clusterName].storage!.store.energy < 400000) {
                        // Medium storage - two upgraders
                        return 2;
                    }

                    if (Game.rooms[cluster.clusterName].storage!.store.energy < 800000) {
                        // High storage - four upgraders
                        return 4;
                    }

                    if (Game.rooms[cluster.clusterName].storage!.store.energy > 800000) {
                        // Surplus storage - six upgraders
                        return 6;
                    }

                }
            }
        }
        return 1;
    }
}
