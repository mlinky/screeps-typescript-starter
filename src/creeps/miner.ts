import { gameState } from "defs";
import { MyCreep } from "creeps/creep";
import { MySource } from "state/source";
import { profile } from "profiler/decorator";
import { log } from "log/log";
import { MyCluster } from "state/cluster";
import { Tasks } from "creep-tasks/Tasks";
import { harvestTargetType } from "creep-tasks/TaskInstances/task_harvest";

@profile
export class CreepMiner extends MyCreep {

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {

        //log.info('Miner running');

        if (!this.creep.task) {
            for (let s of Object.values(gameState.rooms[this.workRoom].sources)) {
                let r: RoomObject | null = Game.getObjectById(s.id);
                if (r && r.targetedBy.length == 0) {
                    this.creep.task = Tasks.harvest(<harvestTargetType>r);
                }
            }
        }

        this.creep.run()

    }

    public static required(cluster: MyCluster): number {
        // How many miners required for the cluster
        let required: number = 1;

        // Just do the number of sources
        required = Object.keys(gameState.rooms[cluster.clusterName].sources).length;

        //log.info(`Miners required:${required}`);

        return required;
    }
}
