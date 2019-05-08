import { harvestTargetType } from "creep-tasks/TaskInstances/task_harvest";
import { Tasks } from "creep-tasks/Tasks";
import { MyCreep } from "creeps/creep";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { MyCluster } from "state/cluster";
import { MySource } from "state/source";

const _DEBUG_MINER: boolean = false;

@profile
export class CreepMiner extends MyCreep {
    public onContainer: boolean = false;

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {

        log.debug(`Miner ${this.name} running`, _DEBUG_MINER);

        if (!this.creep.task) {
            log.debug(`Miner ${this.name} has no task`, _DEBUG_MINER);

            if (gameState.rooms[this.workRoom]) {
                for (const s of Object.values(gameState.rooms[this.workRoom].sources)) {
                    const r: RoomObject | null = Game.getObjectById(s.id);
                    if (r && r.targetedBy.length === 0) {
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

            if (gameState.rooms[this.workRoom]) {
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

        if (gameState.rooms[cluster.clusterName] && gameState.rooms[cluster.clusterName].sources) {
            return Object.keys(gameState.rooms[cluster.clusterName].sources).length;
        }

        return 0;
    }
}
