import { log } from "log/log";
import { MyCreep } from "./creep";
import { MyCluster } from "./cluster";
import { roomManager } from "managers/roomManager";

// State.ts - core gamestate to store on the heap
const _DEBUG_GAMESTATE: boolean = true;

export class GameState {
    initialised: boolean;
    creeps: { [creepName: string]: MyCreep };
    clusters: { [clusterHub: string]: MyCluster };

    constructor() {
        this.creeps = {};
        this.clusters = {};
        this.initialised = false;
    }

    refresh(): void {

        refreshCreeps(this.creeps);

        refreshClusters(this.clusters);

        // Log that a refresh has happened
        log.debug('Gamestate refresh completed', _DEBUG_GAMESTATE);

        this.initialised = true;
    }
}

function refreshCreeps(creeps: { [creepName: string]: MyCreep }) {

    creeps = {};

    for (const c of Object.values(Game.creeps)) {
        creeps[c.name] = new MyCreep(c.name);
    }

}

function refreshClusters(clusters: { [clusterHub: string]: MyCluster }) {

    let pass2Rooms: Room[] = [];
    clusters = {};

    for (const r of Object.values(Game.rooms)) {

        // In case room is undefined
        if (r == undefined) {
            continue;
        }

        // Collect rooms with spawns first
        if (r.hasSpawns()) {
            clusters[r.name] = new MyCluster(r.name);
        } else {
            // Store 'other' rooms for a second pass - below
            pass2Rooms.push(r);
        }
    }

    // TODO - handle pss2Rooms
    if (pass2Rooms.length > 0) {
        log.error('pass2Rooms not implemented yet');
    }

    // Update each cluster state
    for (const c of Object.values(clusters)) {

        c.initState();

    }


}
