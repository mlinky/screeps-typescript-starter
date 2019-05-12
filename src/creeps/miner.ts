import { harvestTargetType } from "creep-tasks/TaskInstances/task_harvest";
import { Tasks } from "creep-tasks/Tasks";
import { MyCreep } from "creeps/creep";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { Debug } from "settings";
import { MyCluster } from "state/cluster";
import { MySource } from "state/source";

@profile
export class CreepMiner extends MyCreep {
    public onContainer: boolean = false;

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {

        log.debug(`Miner ${this.name} running`, Debug.miner);
        // Set max targets
        let targetMax: number = 1;

        if (Game.rooms[this.homeRoom]) {
            // Increase the miner count for
            if (Game.rooms[this.homeRoom].energyCapacityAvailable < 400) {
                // Super low level - spawn max of 3*2 work parts
                targetMax = 3;
            } else if (Game.rooms[this.homeRoom].energyCapacityAvailable < 800) {
                // Cannot spawn a full size miner - spwan 2*3 work parts
                targetMax = 2;
            }
        }

        // Assign a task
        if (!this.creep.task) {
            log.debug(`Miner ${this.name} has no task`, Debug.miner);

            if (gameState.rooms[this.workRoom]) {
                for (const s of Object.values(gameState.rooms[this.workRoom].sources)) {
                    const r: RoomObject | null = Game.getObjectById(s.id);
                    if (r && r.targetedBy.length < targetMax && r.targetedBy.length < s.miningSpots.length) {
                        this.creep.task = Tasks.harvest(r as harvestTargetType);
                    }
                }
            } else {
                // Room not visible yet - just go to the room
                this.creep.task = Tasks.goToRoom(this.workRoom);
            }
        }

        if (this.creep.task) {
            // See if we're on the container
            let runTask: boolean = true;

            // Only force sitting on the container when there's a single miner
            if (gameState.rooms[this.workRoom] && targetMax === 1) {
                if (!this.onContainer) {
                    const s: Source | undefined = this.creep.task.target as Source;

                    if (s && gameState.rooms[this.workRoom].sources[s.id] && gameState.rooms[this.workRoom].sources[s.id].container) {
                        const containerPos: RoomPosition = gameState.rooms[this.workRoom].sources[s.id].container!.pos;

                        // Is the creep on the container?
                        if (this.creep.pos.isEqualTo(containerPos.x, containerPos.y)) {
                            this.onContainer = true;
                        } else {
                            this.creep.travelTo(containerPos);
                            runTask = false;
                        }
                    }
                }
            }

            // Harvest the source
            if (runTask) {
                this.creep.run();
            }
        }
    }

    public static required(cluster: MyCluster): number {
        // How many miners required for the cluster
        // Remote rooms request creeps through flag handling
        if (Game.rooms[cluster.clusterName]) {
            if (Game.rooms[cluster.clusterName].energyCapacityAvailable < 400) {
                // Super low level - spawn max of 3*2 work parts
                return totalSpots(3);
            } else if (Game.rooms[cluster.clusterName].energyCapacityAvailable < 800) {
                // Cannot spawn a full size miner - spwan 2*3 work parts
                return totalSpots(2);
            } else {
                // Just spawn a full size miner for each source
                return Object.keys(gameState.rooms[cluster.clusterName].sources).length;
            }
        }

        return 0;

        function totalSpots(maxRequired: number): number {
            let miningSpots: number = 0;
            for (const s of Object.values(gameState.rooms[cluster.clusterName].sources)) {
                miningSpots += (s.miningSpots.length >= maxRequired ? maxRequired : s.miningSpots.length);
            }
            return miningSpots;
        }

    }
}
