import { Tasks } from "creep-tasks/Tasks";
import { MyCreep } from "creeps/creep";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { Debug } from "settings";
import { MyCluster } from "state/cluster";
import { ManagerPos } from "utils/managerPos";

@profile
export class CreepManager extends MyCreep {
    public managerID: string = '';
    private walkPath: string = '';
    private walkIndex: number = 0;
    private startTick: number = 0;
    private finishTick: number = 0;

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {

        // log.info('Manager running');
        if (this.managerID === '') {
            this.setManagerID();
        }

        // Do nothing if we do not have an ID
        if (this.managerID === '') { return };

        if (this.finishTick > 0 && this.finishTick < gameState.clusters[this.workRoom].spawnTick) {
            this.startTick = Game.time;
            this.finishTick = 0;
        }

        if (this.finishTick === 0) {
            if (this.creep.isIdle) {
                this.newTask();
            }

            this.creep.run();

        }
    }

    private newTask() {

        if (this.creep.carry.energy > 0) {
            // Deliver energy to spawn, extension, storage
            // log.info('setting transfer');
            const cluster: MyCluster = gameState.clusters[this.workRoom];

            if (this.fillAround(cluster)) { return };

            if (this.moveToNextSpot(cluster)) { return };

            this.managerMoveToPost(this.creep.room.name, this.managerID);

        } else {
            // Go get energy
            // log.info('setting collect');
            this.managerEnergyPickup(this.creep.room.name, this.managerID);

        }
    }

    private fillAround(cluster: MyCluster): boolean {
        const creep: CreepManager = this;

        log.debug(`${JSON.stringify(cluster.managerPaths)}`, Debug.manager);

        if (this.walkIndex < cluster.managerPaths[this.walkPath].length) {

            return fillAroundInternal(cluster.managerPaths[this.walkPath][this.walkIndex])

        }

        return false;

        function fillAroundInternal(mPos: ManagerPos): boolean {
            let somethingFilled: boolean = false;

            for (const t of mPos.towers) {
                const tower: StructureTower = Game.getObjectById(t) as StructureTower;

                if (tower.energy < tower.energyCapacity) {
                    creep.creep.task = Tasks.transfer(tower, RESOURCE_ENERGY);
                    somethingFilled = true;
                }
            }

            for (const s of mPos.spawns) {
                const spawn: StructureSpawn = Game.getObjectById(s) as StructureSpawn;

                if (spawn.energy < spawn.energyCapacity) {
                    creep.creep.task = Tasks.transfer(spawn, RESOURCE_ENERGY);
                    somethingFilled = true;
                }
            }

            for (const e of mPos.extensions) {
                const extension: StructureExtension = Game.getObjectById(e) as StructureExtension;

                if (extension.energy < extension.energyCapacity) {
                    creep.creep.task = Tasks.transfer(extension, RESOURCE_ENERGY);
                    somethingFilled = true;
                }
            }

            return somethingFilled
        }

    }

    private moveToNextSpot(cluster: MyCluster): boolean {

        if (this.walkIndex === cluster.managerPaths[this.walkPath].length - 1) {
            this.walkIndex = 0;
            this.creep.task = Tasks.goTo(cluster.managerPaths[this.walkPath][this.walkIndex]);
            if (gameState.clusters[this.workRoom].spawnTick > this.startTick) {
                this.finishTick = 0;
            } else {
                this.finishTick = Game.time;
            }
        } else {
            this.walkIndex += 1;
            // Move to next spot
            this.finishTick = 0;
            this.creep.task = Tasks.goTo(cluster.managerPaths[this.walkPath][this.walkIndex]);
        }

        return true
    }

    private setManagerID() {
        const cluster: MyCluster = gameState.clusters[this.homeRoom];

        if (!cluster) { return };


        if (gameState.rooms[cluster.clusterName].controller) {
            switch (gameState.rooms[cluster.clusterName].controller!.level()) {
                case 1:
                case 2:
                case 3:
                    return;
                case 4: {
                    this.managerID = 'TL';
                    this.walkPath = 'TL';
                    cluster.managerAvailable[this.managerID] = true;
                    cluster.hasManager = true;
                }
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
                    return 1;
                }

            }
        }
        return 0;
    }
}
