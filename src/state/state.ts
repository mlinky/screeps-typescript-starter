import { CreepClaimer } from 'creeps/claimer';
import { CreepHauler } from 'creeps/hauler';
import { CreepMiner } from 'creeps/miner';
import { CreepReserver } from 'creeps/reserver';
import { Roles } from 'creeps/setups';
import { CreepUpgrader } from 'creeps/upgrader';
import { CreepWorker } from 'creeps/worker';
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { Debug } from 'settings';
import { Perfmon } from "utils/perfmon";
import { _REFRESH, checkRefresh } from 'utils/refresh';
import { Creeps, MyCreep } from "../creeps/creep";
import { Flags, MyFlag } from '../flags/flag';
import '../prototypes/creep.prototype';
import { Clusters, MyCluster } from "./cluster";
import { MyRoom, Rooms } from './room';

// State.ts - core gamestate to store on the heap

@profile
export class GameState {
    public creeps: { [creepName: string]: MyCreep } = {};
    public clusters: { [clusterHub: string]: MyCluster } = {};
    public rooms: { [roomName: string]: MyRoom } = {};
    public flags: { [flagName: string]: MyFlag } = {};
    public perfmon: Perfmon;

    public buildCount: number = 0;
    public buildFlag: boolean = false;

    public initialised: boolean;

    constructor() {
        this.initialised = false;
        this.perfmon = new Perfmon();
    }

    public initState(): void {

        if (Debug.gamestate) {
            // Start a performance timer
            this.perfmon.start();
        }

        this.initClusters();

        this.initCreeps();

        Flags.check(true);

        if (Debug.gamestate) {
            // Stop the timer
            this.perfmon.stop();

            // Log that a refresh has happened
            log.debug(`Gamestate refresh completed using ${this.perfmon.getUsed()} CPU.`, Debug.gamestate);
        }

        this.initialised = true;

    }

    public initCreeps() {

        if (Debug.gamestate) {
            // Start a performance timer
            this.perfmon.start();
        }

        this.creeps = {};

        for (const c of Object.values(Game.creeps)) {
            this.addCreep(c);
        }

        if (Debug.gamestate) {
            // Stop the timer
            this.perfmon.stop();

            // Log that a refresh has happened
            log.debug(`Creep initialise completed using ${this.perfmon.getUsed()} CPU.`, Debug.gamestate);
        }
    }

    public addCreep(creep: Creep) {

        switch (creep.role) {
            case Roles.drone: {
                this.creeps[creep.name] = new CreepMiner(creep);
                break;
            }
            case Roles.transporter: {
                this.creeps[creep.name] = new CreepHauler(creep);
                break;
            }
            case Roles.worker: {
                this.creeps[creep.name] = new CreepWorker(creep);
                break;
            }
            case Roles.upgrader: {
                this.creeps[creep.name] = new CreepUpgrader(creep);
                break;
            }
            case Roles.claimer: {
                this.creeps[creep.name] = new CreepClaimer(creep);
                break;
            }
            case Roles.reserver: {
                this.creeps[creep.name] = new CreepReserver(creep);
                break;
            }
            default: {
                log.error(`Error in addCreep for ${creep.name} role ${creep.role} not found`);
            }
        }

        return;

    }

    public deleteCreep(c: string) {
        // Reduce available count
        log.info(`Creep removed ${c} - ${this.creeps[c].role} - homeRoom: ${this.creeps[c].homeRoom} - workRoom: ${this.creeps[c].workRoom}`);

        // Remove from memory
        delete this.creeps[c];

    }

    public initClusters() {

        if (Debug.gamestate) {
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

        if (Debug.gamestate) {
            // Stop the timer
            this.perfmon.stop();

            // Log that a refresh has happened
            log.debug(`Cluster initialise completed using ${this.perfmon.getUsed()} CPU.`, Debug.gamestate);
        }
    }

    public run() {

        // Capture buildCount
        this.buildCount = Object.keys(Game.constructionSites).length;

        // Tidy up creeps
        Creeps.tidy();

        // Check flags
        Flags.check();

        // Check clusters
        Clusters.check();

        // Check rooms
        Rooms.check();

        // Run flags
        Flags.run();

        // Run cluster
        Clusters.run();

        // Run rooms
        Rooms.run();

        // Run creeps
        Creeps.run();

    }
}
