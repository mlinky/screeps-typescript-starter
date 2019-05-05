import { CreepHauler } from 'creeps/hauler';
import { CreepMiner } from 'creeps/miner';
import { CreepUpgrader } from 'creeps/upgrader';
import { CreepWorker } from 'creeps/worker';
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { Perfmon } from "utils/perfmon";
import { _REFRESH, checkRefresh } from 'utils/refresh';
import { MyCreep } from "../creeps/creep";
import '../prototypes/creep.prototype';
import { MyCluster } from "./cluster";
import { Flags, MyFlag } from './flag';
import { MyRoom } from './room';

// State.ts - core gamestate to store on the heap
const _DEBUG_GAMESTATE: boolean = false;

@profile
export class GameState {
    public creeps: { [creepName: string]: MyCreep } = {};
    public clusters: { [clusterHub: string]: MyCluster } = {};
    public rooms: { [roomName: string]: MyRoom } = {};
    public flags: { [flagName: string]: MyFlag } = {};
    public perfmon: Perfmon;

    public constructionSites: number = 0;

    public initialised: boolean;

    constructor() {
        this.initialised = false;
        this.perfmon = new Perfmon();
    }

    public initState(): void {

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

    public initCreeps() {

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

    public addCreep(creep: Creep, updateAvailable?: boolean) {

        switch (creep.role) {
            case 'drone': {
                this.creeps[creep.name] = new CreepMiner(creep);
                break;
            }
            case 'transporter': {
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

    public deleteCreep(c: string) {
        // Reduce available count
        log.info(`Creep removed ${c} - ${this.creeps[c].role} - homeRoom: ${this.creeps[c].homeRoom} - workRoom: ${this.creeps[c].workRoom}`);

        this.clusters[this.creeps[c].homeRoom].creepsAvailable[this.creeps[c].role]--;

        // Remove from memory
        delete this.creeps[c];

    }

    public initClusters() {

        if (_DEBUG_GAMESTATE) {
            // Start a performance timer
            this.perfmon.start();
        }

        const pass2Rooms: Room[] = [];
        this.clusters = {};

        for (const r of Object.values(Game.rooms)) {

            // In case room is undefined
            if (r === undefined) {
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

    public run() {

        // Tidy up creeps
        for (const c in this.creeps) {
            if (!(c in Game.creeps)) {
                // Creep is dead - remove from collection
                this.deleteCreep(c);
            }
        }

        // Check flags
        Flags.check();

        // Check cluster
        for (const c in this.clusters) {
            this.clusters[c].check();
        }

        // Check rooms
        for (const r in this.rooms) {
            this.rooms[r].check();
        }

        // Run cluster
        for (const c in this.clusters) {
            this.clusters[c].run();
        }

        // Run rooms
        for (const r in this.rooms) {
            this.rooms[r].run();
        }

        // Run creeps
        for (const c in this.creeps) {
            this.creeps[c].run();
        }

    }
}
