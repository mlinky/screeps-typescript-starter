import { log } from "log/log";
import { MyCreep } from "./creep";
import { MyCluster } from "./cluster";
import { roomManager } from "managers/roomManager";
import { Perfmon } from "utils/perfmon";
import { profile } from "profiler/decorator";

// State.ts - core gamestate to store on the heap
const _DEBUG_GAMESTATE: boolean = false;

@profile
export class GameState {
    creeps: { [creepName: string]: MyCreep };
    clusters: { [clusterHub: string]: MyCluster };
    perfmon: Perfmon;

    initialised: boolean;

    constructor() {
        this.creeps = {};
        this.clusters = {};
        this.initialised = false;
        this.perfmon = new Perfmon();
    }

    initState(): void {

        if (_DEBUG_GAMESTATE) {
            // Start a performance timer
            this.perfmon.start();
        }

        this.initCreeps();

        this.initClusters();

        if (_DEBUG_GAMESTATE) {
            // Stop the timer
            this.perfmon.stop();

            // Log that a refresh has happened
            log.debug(`Gamestate refresh completed using ${this.perfmon.getUsed()} CPU.`, _DEBUG_GAMESTATE);
        }

        this.initialised = true;

    }

    initCreeps() {

        if (_DEBUG_GAMESTATE) {
            // Start a performance timer
            this.perfmon.start();
        }

        this.creeps = {};

        for (const c of Object.values(Game.creeps)) {
            this.creeps[c.name] = new MyCreep(c.name);
        }

        if (_DEBUG_GAMESTATE) {
            // Stop the timer
            this.perfmon.stop();

            // Log that a refresh has happened
            log.debug(`Creep initialise completed using ${this.perfmon.getUsed()} CPU.`, _DEBUG_GAMESTATE);
        }
    }

    initClusters() {

        if (_DEBUG_GAMESTATE) {
            // Start a performance timer
            this.perfmon.start();
        }

        let pass2Rooms: Room[] = [];
        this.clusters = {};

        for (const r of Object.values(Game.rooms)) {

            // In case room is undefined
            if (r == undefined) {
                continue;
            }

            // Collect rooms with spawns first
            if (r.hasSpawns()) {
                this.clusters[r.name] = new MyCluster(r.name);
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
        for (const c of Object.values(this.clusters)) {

            c.initCluster();

        }

        if (_DEBUG_GAMESTATE) {
            // Stop the timer
            this.perfmon.stop();

            // Log that a refresh has happened
            log.debug(`Cluster initialise completed using ${this.perfmon.getUsed()} CPU.`, _DEBUG_GAMESTATE);
        }
    }

    run() {

    }
}

