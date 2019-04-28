import '../prototypes/creep.prototype';
import { log } from "log/log";
import { MyCreep } from "../creeps/creep";
import { MyCluster } from "./cluster";
import { MyRoom } from './room';
import { Perfmon } from "utils/perfmon";
import { profile } from "profiler/decorator";
import { CreepMiner } from 'creeps/miner';
import { CreepHauler } from 'creeps/hauler';
import { CreepWorker } from 'creeps/worker';
import { CreepUpgrader } from 'creeps/upgrader';

// State.ts - core gamestate to store on the heap
const _DEBUG_GAMESTATE: boolean = false;

@profile
export class GameState {
    creeps: { [creepName: string]: MyCreep } = {};
    clusters: { [clusterHub: string]: MyCluster } = {};
    rooms: { [roomName: string]: MyRoom } = {};
    perfmon: Perfmon;

    initialised: boolean;

    constructor() {
        this.initialised = false;
        this.perfmon = new Perfmon();
    }

    initState(): void {

        if (_DEBUG_GAMESTATE) {
            // Start a performance timer
            this.perfmon.start();
        }

        this.initClusters();

        this.initCreeps();

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
            this.addCreep(c, true);
        }

        if (_DEBUG_GAMESTATE) {
            // Stop the timer
            this.perfmon.stop();

            // Log that a refresh has happened
            log.debug(`Creep initialise completed using ${this.perfmon.getUsed()} CPU.`, _DEBUG_GAMESTATE);
        }
    }

    addCreep(creep: Creep, updateAvailable?: boolean) {

        switch (creep.role) {
            case 'miner': {
                this.creeps[creep.name] = new CreepMiner(creep);
                break;
            }
            case 'hauler': {
                this.creeps[creep.name] = new CreepHauler(creep);
                break;
            }
            case 'worker': {
                this.creeps[creep.name] = new CreepWorker(creep);
                break;
            }
            case 'upgrader': {
                this.creeps[creep.name] = new CreepUpgrader(creep);
                break;
            }
            default: {
                log.error(`Error in addCreep role ${creep.role} not found`);
            }
        }

        this.clusters[creep.homeRoom].checkDefined(creep.role)

        if (updateAvailable) {
            this.clusters[creep.homeRoom].creepsAvailable[creep.role]++;
        }

        return;

    }

    deleteCreep(c: string) {
        // Reduce available count
        log.info(`Creep removed ${c} - ${this.creeps[c].role} - homeRoom: ${this.creeps[c].homeRoom} - workRoom: ${this.creeps[c].workRoom}`);

        this.clusters[this.creeps[c].homeRoom].creepsAvailable[this.creeps[c].role]--;

        // Remove from memory
        delete this.creeps[c];

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
                this.clusters[r.name] = new MyCluster(r);
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

        // Tidy up creeps
        for (let c in this.creeps) {
            if (!(c in Game.creeps)) {
                // Creep is dead - remove from collection
                this.deleteCreep(c);
            }
        }

        // Check cluster
        for (let c in this.clusters) {
            this.clusters[c].check();
        }

        // Check rooms
        for (let r in this.rooms) {
            this.rooms[r].check();
        }

        // Run cluster
        for (let c in this.clusters) {
            this.clusters[c].run();
        }

        // Run rooms
        for (let r in this.rooms) {
            this.rooms[r].run();
        }

        // Run creeps
        for (let c in this.creeps) {
            this.creeps[c].run();
        }

    }
}
