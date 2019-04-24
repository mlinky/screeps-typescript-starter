import { log } from "./log";
import { MyCluster } from "state/cluster";
import { gameState } from "defs";

export class MyConsole {

    static init() {
        global.help = this.help();
        global.report = this.report;
        global.showSpawnQueue = this.showSpawnQueue;
        global.debug = this.debug;
    }

    static help() {
        return `Try this
        Or this
        Or this instead`;
    }

    static report(clusterName?: string) {
        let count: number = 0;

        for (const c of Object.values(gameState.clusters)) {
            log.info(`Cluster:   ${c.clusterName}`);
            for (let r in c.creepsAvailable) {
                log.info(`${r}: ${c.creepsAvailable[r]}`);
            }
            ++count;
        }

        return `Clusters reported: ${count}`;

    }

    static showSpawnQueue(clusterName?: string) {

        let totalRequests: number = 0;

        log.info('Showing spawn queue');

        if (clusterName && clusterName != '') {
            log.info(`Showing spawn queue for ${clusterName}`);
            showClusterSpawnQueue(clusterName);
        } else {
            for (let c in gameState.clusters) {
                log.info(`Showing spawn queue for ${c}`);
                showClusterSpawnQueue(c);
            }
        }

        return `${totalRequests} requests in total`;

        function showClusterSpawnQueue(clusterName: string) {

            let clusterRequests: number = 0;

            log.info(`Spawn queue for ${clusterName} has ${gameState.clusters[clusterName].creepRequests.length} entries`);

            for (let r of gameState.clusters[clusterName].creepRequests) {
                log.info(`Cluster: ${r.spawnRoom}\tRole: ${r.creepRole}\tRoom: ${r.workRoom}\tPriority:${r.priority}`);
                clusterRequests++;
                totalRequests++;
            }

            log.info(`Cluster: ${clusterName}\t${clusterRequests} requests.`)

        }

    }

    static debug(type: string, name: string) {

    }
}

