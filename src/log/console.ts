import { gameState } from "defs";
import { Debug } from "settings";
import { Visuals } from "state/room";
import { log } from "./log";

export class MyConsole {

    public static init() {
        global.help = this.help();
        global.report = this.report;
        global.showSpawnQueue = this.showSpawnQueue;
        global.creepCensus = this.creepCensus;
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
                log.info(`Cluster: ${r.spawnRoom}\tRoom: ${r.workRoom}\tPriority:${r.priority}\tRole: ${r.creepRole}`);
                clusterRequests++;
                totalRequests++;
            }

            log.info(`Cluster: ${clusterName}\t${clusterRequests} requests.`)

        }

    }

    public static creepCensus(): string {
        const census: { [room: string]: { [role: string]: number } } = {};
        let count: number = 0;

        for (const c of Object.values(gameState.creeps)) {
            if (!census[c.workRoom]) {
                census[c.workRoom] = {};
            }
            if (census[c.workRoom][c.role]) {
                census[c.workRoom][c.role]++;
            } else {
                census[c.workRoom][c.role] = 1;
            }
            count++;
        }

        for (const room in census.room) {
            const line: string = `Room ${room}`;
            for (const role in census[room]) {
                line.concat(` ${role}:${census[room][role]}`)
            }
            log.info(line);
        }

        log.info(`${JSON.stringify(census)}`)
        return `${count} creeps in total`;

    }

    public static debug(toggle: string): string {

        if (toggle === '') {
            // List possible debug items
            for (const d in Debug) {
                let font: string = '#ff0000';
                if (Debug[d]) {
                    font = '#00ff00'
                }
                console.log(`${d} <font color="#${font}">${Debug[d]}</font>`);
            }
            return 'blank toggle';

        } else {
            for (const d in Debug) {
                if (d === toggle) {
                    // Found the flag to switch
                    Debug[d] = !Debug[d];
                    return `Changed Debug[${d}] from ${(!Debug[d] ? '<font color="#00ff00">true</font>' : '<font color="#ff0000">false</font>')} to ${(Debug[d] ? '<font color="#00ff00">true</font>' : '<font color="#ff0000">false</font>')}`;
                }
            }
            return 'No matching debug option';
        }
    }

    public static visuals(toggle: string): string {
        if (toggle === '') {
            // List possible debug items
            for (const d in Visuals) {
                let font: string = '#ff0000';
                if (Visuals[d]) {
                    font = '#00ff00'
                }
                console.log(`${d} <font color="#${font}">${Visuals[d]}</font>`);
            }
            return 'blank toggle';

        } else {
            for (const d in Visuals) {
                if (d === toggle) {
                    // Found the flag to switch
                    Visuals[d] = !Visuals[d];
                    return `Changed Visuals[${d}] from ${(!Visuals[d] ? '<font color="#00ff00">true</font>' : '<font color="#ff0000">false</font>')} to ${(Visuals[d] ? '<font color="#00ff00">true</font>' : '<font color="#ff0000">false</font>')}`;
                }
            }
            return 'No matching visuals option';
        }
    }

}

