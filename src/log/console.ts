import { gameState } from "defs";
import { MyCluster } from "state/cluster";
import { log } from "./log";

export class MyConsole {

    public static init() {
        global.help = this.help();
        global.report = this.report;
        global.showSpawnQueue = this.showSpawnQueue;
        global.debug = this.debug;
    }

    public static help() {
        return `Try this
        Or this
        Or this instead`;
    }

    public static report(clusterName?: string) {
        let count: number = 0;

        for (const c of Object.values(gameState.clusters)) {
            log.info(`Cluster:   ${c.clusterName}`);
            for (const r in c.creepsAvailable) {
                log.info(`${r}: ${c.creepsAvailable[r]}`);
            }
            ++count;
        }

        return `Clusters reported: ${count}`;

    }

    public static showSpawnQueue(clusterName?: string) {

        let totalRequests: number = 0;

        log.info('Showing spawn queue');

        if (clusterName && clusterName !== '') {
            log.info(`Showing spawn queue for ${clusterName}`);
            showClusterSpawnQueue(clusterName);
        } else {
            for (const c in gameState.clusters) {
                log.info(`Showing spawn queue for ${c}`);
                showClusterSpawnQueue(c);
            }
        }

        return `${totalRequests} requests in total`;

        function showClusterSpawnQueue(name: string) {

            let clusterRequests: number = 0;

            log.info(`Spawn queue for ${clusterName} has ${gameState.clusters[name].creepRequests.length} entries`);

            for (const r of gameState.clusters[name].creepRequests) {
                log.info(`Cluster: ${r.spawnRoom}\tRole: ${r.creepRole}\tRoom: ${r.workRoom}\tPriority:${r.priority}`);
                clusterRequests++;
                totalRequests++;
            }

            log.info(`Cluster: ${clusterName}\t${clusterRequests} requests.`)

        }

    }

    public static debug(type: string, name: string) {
        log.info('debug not implemented yet');
    }
}

