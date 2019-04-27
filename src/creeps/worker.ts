import { profile } from "profiler/decorator";
import { MyCreep } from "creeps/creep";
import { log } from "log/log";
import { MyCluster } from "state/cluster";

@profile
export class CreepWorker extends MyCreep {

    constructor(creep: Creep) {
        super(creep);
    }

    run() {

        //log.info('Worker running');

    }

    public static required(cluster: MyCluster): number {
        // How many miners required for the cluster

        return 1;
    }
}
