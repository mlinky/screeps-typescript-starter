import { MyCreep } from "creeps/creep";
import { FlagType, Roles } from "creeps/setups";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { Debug } from "settings";
import { SpawnPriority } from "utils/priorities";
import { _REFRESH, checkRefresh } from "utils/refresh";
import { MyCluster } from "../state/cluster";
import { MyDefault } from "../state/default";
import { Map } from "../state/map";
import { MyRoom } from "../state/room";

@profile
export abstract class Flags {

    public static check(forceRefresh: boolean = false) {

        if ((forceRefresh === false) && (checkRefresh(_REFRESH.flags) === false)) {
            return;
        }

        // Check for new flags
        for (const f of Object.values(Game.flags)) {

            if (gameState.flags[f.name]) {
                // Already know about this flag
                continue;
            }

            log.debug(`Found flag ${f.name}`, Debug.flags);

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

        for (const f of Object.values(gameState.flags)) {
            if (f.runFlag === false) {
                // Only run actionable flags
                continue;
            }

            const flag: Flag = Game.flags[f.name];
            const cluster: MyCluster = gameState.clusters[f.cluster];

            switch (flag.color) {
                case COLOR_YELLOW: {
                    this.runYellowFlag(f, cluster);
                }
            }
        }
    }

    private static runYellowFlag(f: MyFlag, cluster: MyCluster) {
        // Remote room
        log.debug(`Flag ${f.name} - running`, Debug.flags)

        if (!Game.rooms[f.room]) {
            // No visibility in the room - do we have a claimer?
            log.debug(`Flag ${f.name} - room not visible`, Debug.flags)

            const claimer: MyCreep[] = _.filter(gameState.creeps, (creep) => creep.role === Roles.claimer && creep.workRoom === f.room);

            if (claimer.length === 0) {
                // No claimer in creeps list
                if (cluster.requestExists(f.room, Roles.reserver, SpawnPriority.remote.reserve)) {
                    // Request already exists
                    log.debug(`Flag ${f.name} - claimer request already exists`, Debug.flags)
                    return;
                }

                // Create a new request for a claimer
                log.debug(`Flag ${f.name} - requesting claimer`, Debug.flags);
                this.checkAndRequest(Roles.reserver, f.room, cluster, 1, SpawnPriority.remote.reserve);
                return;

            }
        }

        if (Game.rooms[f.room]) {
            const room: Room = Game.rooms[f.room];
            // We have visibility into the room
            log.debug(`Flag ${f.name} - have visibility`, Debug.flags);
            if (!gameState.rooms[f.room]) {
                log.debug(`Flag ${f.name} - room ${f.room} not set up yet`, Debug.flags);
                // Room is not set up yet - create it and init the room state
                gameState.rooms[f.room] = new MyRoom(room, f.cluster, false);
                log.debug(`Flag ${f.name} - room ${f.room} added for cluster ${f.cluster}`, Debug.flags);
                gameState.rooms[f.room].initRoom();
                log.debug(`Flag ${f.name} - room ${f.room} initialised`, Debug.flags);
            }

            // Remotes require claimer, miners, haulers and sometimes workers
            // Order another claimer if the reservation is low
            if (room.controller && room.controller.reservation && room.controller.reservation.ticksToEnd < 1000) {
                this.checkAndRequest(Roles.reserver, f.room, cluster, (Game.rooms[cluster.clusterName].energyCapacityAvailable < 1300 ? 2 : 1), SpawnPriority.remote.reserve + (f.clusterIndex * SpawnPriority.remote.increment));
            }

            // Order a miner per source
            if (checkRefresh(_REFRESH.drone)) {
                this.checkAndRequest(Roles.drone, f.room, cluster, Object.keys(gameState.rooms[f.room].sources).length, SpawnPriority.remote.miner + (f.clusterIndex * SpawnPriority.remote.increment));
            }

            // Order a hauler per source
            if (checkRefresh(_REFRESH.transporter)) {
                this.checkAndRequest(Roles.transporter, f.room, cluster, gameState.rooms[f.room].haulersRequired, SpawnPriority.remote.transport + (f.clusterIndex * SpawnPriority.remote.increment));
            }

            // Order one worker, if there is work to do
            if (checkRefresh(_REFRESH.worker)) {
                this.checkAndRequest(Roles.worker, f.room, cluster, 1, SpawnPriority.remote.worker + (f.clusterIndex * SpawnPriority.remote.increment));
            }

        }

        return;

    }

    private static checkAndRequest(role: string, room: string, cluster: MyCluster, required: number, requestPriority: number) {

        log.debug(`Check and request role ${role} room ${room} cluster ${cluster} required ${required}`, Debug.flags);

        cluster.checkAndRequest(role, room, required, requestPriority);

    }
}

@profile
export class MyFlag extends MyDefault {
    public cluster: string = '';
    public room: string = '';
    public name: string = '';
    public flagType: string = FlagType.none;
    public runFlag: boolean = false;
    public clusterIndex: number = 0;

    constructor(flag: Flag) {
        super(flag.name);

        this.name = flag.name;
        this.room = flag.pos.roomName;
        this.setCluster(flag);

        this.initFlag(flag);

    }

    private setCluster(flag: Flag) {
        switch (flag.color) {
            case COLOR_YELLOW: {
                // Remote room
                this.cluster = Map.findClosestCluster(flag.pos);

                if (this.cluster === '') {
                    log.error(`Failed to select a cluster for flag ${flag.name}`);
                } else {
                    this.clusterIndex = ++gameState.clusters[this.cluster].remotes;
                }

                break;

            }
            default: {
                log.error(`Unhandled ${flag.color} flag ${flag.name} in ${flag.pos.roomName}`);
                break;
            }
        }
    }

    private initFlag(flag: Flag) {
        switch (flag.color) {
            case COLOR_YELLOW: {
                // Set the flag to run - this will request a reserver and get things rolling
                this.flagType = FlagType.remote;
                this.runFlag = true;
            }
        }

        log.debug(`Flag ${flag.name} - ${JSON.stringify(this)}`, Debug.flags);

    }

}
