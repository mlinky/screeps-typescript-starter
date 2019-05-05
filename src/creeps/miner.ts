import { harvestTargetType } from "creep-tasks/TaskInstances/task_harvest";
import { Tasks } from "creep-tasks/Tasks";
import { MyCreep } from "creeps/creep";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { MyCluster } from "state/cluster";
import { MySource } from "state/source";

@profile
export class CreepMiner extends MyCreep {
    public onContainer: boolean = false;

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {

        // log.info('Miner running');

        if (!this.creep.task) {
            for (const s of Object.values(gameState.rooms[this.workRoom].sources)) {
                const r: RoomObject | null = Game.getObjectById(s.id);
                if (r && r.targetedBy.length === 0) {
                    this.creep.task = Tasks.harvest(r as harvestTargetType);
                }
            }
        }

        if (this.creep.task) {
            // See if we're on the container
            let runTask: boolean = true;

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

            // Harvest the source
            if (runTask) {
                this.creep.run();
            }
        }
    }

    public static required(cluster: MyCluster): number {
        // How many miners required for the cluster
        let required: number = 1;

        // Just do the number of sources
        required = Object.keys(gameState.rooms[cluster.clusterName].sources).length;

        // log.info(`Miners required:${required}`);

        return required;
    }
}
