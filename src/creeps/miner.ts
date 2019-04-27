import { gameState } from "defs";
import { MyCreep } from "creeps/creep";
import { MySource } from "state/source";
import { profile } from "profiler/decorator";
import { log } from "log/log";
import { MyCluster } from "state/cluster";
import { Tasks } from "creep-tasks/Tasks";

@profile
export class CreepMiner extends MyCreep {

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {

        //log.info('Miner running');

        if (this.creep.isIdle) {
            this.creep.task = Tasks.harvest(<Source>Game.getObjectById('c44207728e621fc'));
        }

        this.creep.run()

    }

    public static required(cluster: MyCluster): number {
        // How many miners required for the cluster
        let required: number = 1;

        // Just do the number of sources
        required = Object.keys(gameState.rooms[cluster.clusterName].sources).length;

        return required;
    }
}
