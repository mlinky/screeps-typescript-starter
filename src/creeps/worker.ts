import { Tasks } from "creep-tasks/Tasks";
import { MyCreep } from "creeps/creep";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { MyCluster } from "state/cluster";

@profile
export class CreepWorker extends MyCreep {

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {

        // log.info('Worker running');
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
            // this.creep.task = Tasks.upgrade(gameState.rooms[this.homeRoom].controller!.controller);
            if (assignTaskInRoom(this, this.workRoom)) {
                return;
            }

            if (this.workRoom !== this.homeRoom) {
                if (assignTaskInRoom(this, this.homeRoom)) {
                    return;
                }
            }

            // Default to upgrade instead, if no work to do
            this.creep.task = Tasks.upgrade(gameState.rooms[this.homeRoom].controller!.controller);

        } else {
            // Go get energy
            this.energyPickup(this.workRoom);
        }

        return;

        function assignTaskInRoom(creep: CreepWorker, room: string): boolean {

            // room not visible
            if (!gameState.rooms[room] || !Game.rooms[room]) {
                return false;
            }

            const s: ConstructionSite | undefined = creep.findConstructionSite(gameState.rooms[room]);

            if (s) {
                creep.creep.task = Tasks.build(s);
                return true;
            }

            // Repair stuff?
            const targets = Game.rooms[room].find(FIND_STRUCTURES, {
                filter: object => object.hits < object.hitsMax * 0.8
            });

            if (targets.length > 0) {
                creep.creep.task = Tasks.repair(targets[0]);
                return true;
            }

            return false;

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
                    return 2;
                }
                default: {
                    if (!Game.rooms[cluster.clusterName]) {
                        // No access to the room
                        return 0;
                    }

                    if (!Game.rooms[cluster.clusterName].storage) {
                        // Room has no storage yet - spawn one worker
                        return 1;
                    }

                    if (Game.rooms[cluster.clusterName].storage!.store.energy < 100000) {
                        // Not much storage - only one worker
                        return 1;
                    }

                    if (Game.rooms[cluster.clusterName].storage!.store.energy < 400000) {
                        // Medium storage - two workers
                        return 2;
                    }

                    if (Game.rooms[cluster.clusterName].storage!.store.energy < 800000) {
                        // High storage - three workers
                        return 3;
                    }

                    if (Game.rooms[cluster.clusterName].storage!.store.energy > 800000) {
                        // Surplus storage - three workers
                        return 3;
                    }

                }
            }
        }
        return 1;
    }
}
