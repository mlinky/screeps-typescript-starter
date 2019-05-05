import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { _REFRESH, checkRefresh } from "utils/refresh";
import { MyCluster } from "./cluster";
import { MyDefault } from "./default";

const _DEBUG_FLAGS: boolean = true;

@profile
export abstract class Flags {

    public static check() {

        if (!checkRefresh(_REFRESH.flags)) {
            return;
        }

        // Check for new flags
        for (const f of Object.values(Game.flags)) {

            if (gameState.flags[f.name]) {
                // Already know about this flag
                continue;
            }

            log.debug(`Found flag ${f.name}`, _DEBUG_FLAGS);

            gameState.flags[f.name] = new MyFlag(f);

        }

        // Check that existing flags are valid
        for (const f of Object.values(gameState.flags)) {
            if (!Game.flags[f.name]) {
                log.warning(`Flag ${f.name} not found - removing from gamestate`);
                delete gameState.flags[f.name];
            }
        }
    }

    public static run() {
        log.info('Feature flag.run not implemented');
    }
}

@profile
export class MyFlag extends MyDefault {
    public cluster: string = '';
    public room: string = '';
    public name: string = '';

    constructor(flag: Flag) {
        super(flag.name);

        this.name = flag.name;
        this.room = flag.pos.roomName;
        this.setCluster(flag);

        this.initFlag();

    }

    private setCluster(flag: Flag) {
        switch (flag.color) {
            case COLOR_YELLOW: {
                // Remote room
                // Select a cluster
                // Store the room
                // Store the cluster
                const selectedCluster: MyCluster | undefined = this.findClosestCluster(flag);

                if (selectedCluster) {
                    this.cluster = selectedCluster.clusterName;
                }

                break;

            }
            default: {
                log.error(`Unhandled ${flag.color} flag ${flag.name} in ${flag.pos.roomName}`);
                break;
            }
        }
    }

    private findClosestCluster(flag: Flag): MyCluster | undefined {
        let selectedCluster: MyCluster | undefined;
        let minCost: number = 9999;

        for (const c of Object.values(gameState.clusters)) {

            if (!c.origin) {
                continue;
            }

            const p = PathFinder.search(c.origin, { pos: flag.pos, range: 1 });

            if (p && !p.incomplete && p.cost < minCost) {
                selectedCluster = c;
                minCost = p.cost;
            }
        }

        if (selectedCluster) {
            log.debug(`Flag ${flag.name} assigned to cluster ${selectedCluster.clusterName}`, _DEBUG_FLAGS);
        } else {
            log.error(`Failed to assign flag ${flag.name} to a cluster`);
        }

        return selectedCluster;
    }

    private initFlag() {
        log.info('initFlag not implemented');
    }

}
