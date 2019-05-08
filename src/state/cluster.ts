import { Task } from "creep-tasks/Task";
import { CreepRequest, RequestPriority } from "creeps/creepRequest";
import { CreepHauler } from "creeps/hauler";
import { CreepMiner } from "creeps/miner";
import { Roles } from "creeps/setups";
import { CreepUpgrader } from "creeps/upgrader";
import { CreepWorker } from "creeps/worker";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { isUndefined } from "util";
import { _REFRESH, checkRefresh } from "utils/refresh";
import { RoomPlanner } from "utils/roomPlanner";
import { MyExtension } from "./extension";
import { MyLab } from "./lab";
import { MyLink } from "./link";
import { MyRampart } from "./ramparts";
import { MyRoom } from "./room";
import { MySpawn } from "./spawn";
import { MyTower } from "./tower";
import { MyWall } from "./wall";

const _DEBUG_CLUSTER: boolean = false;
const _DEBUG_REQUESTS: boolean = true;

@profile
export abstract class Clusters {

    public static check() {
        // Check cluster
        for (const c in gameState.clusters) {
            gameState.clusters[c].check();
        }
    }

    public static run() {
        // Run cluster
        for (const c in gameState.clusters) {
            gameState.clusters[c].run();
        }
    }
}

@profile
export class MyCluster {

    public clusterName: string;
    public origin?: RoomPosition;

    public spawns: { [spawnID: string]: MySpawn } = {};
    public extensions: { [extensionID: string]: MyExtension } = {};
    public towers: { [towerID: string]: MyTower } = {};
    public labs: { [labID: string]: MyLab } = {};
    public links: { [linkID: string]: MyLink } = {};
    public walls: { [sourceID: string]: MyWall } = {};
    public ramparts: { [sourceID: string]: MyRampart } = {};
    public creepRequests: CreepRequest[] = [];

    public hasSpawns: boolean = false;
    public canSpawn: boolean = false;
    public tasks: { [digest: string]: Task } = {};

    public initialised: boolean = false;

    constructor(room: Room) {
        // Init cluster state
        this.clusterName = room.name;

        // Add the cluster hub room
        gameState.rooms[room.name] = new MyRoom(room, this.clusterName, true);

    };

    //#region Public

    // Initialise cluster state
    public initCluster(): void {
        const cluster: MyCluster = this;

        // Init room objects
        this.updateSpawns();
        this.updateExtensions();
        this.updateTowers();
        this.updateLabs();
        this.updateLinks();
        this.updateRamparts();
        this.updateWalls();

        // Get a list of rooms for this cluster
        const roomList = _.filter(gameState.rooms, (room) => room.clusterName === this.clusterName);

        // Init rooms for the cluster
        for (const r of roomList) {
            gameState.rooms[r.roomName].initRoom()
        }

        this.initialised = true;

        return;

    };

    //#region update_code
    // Update object details
    public updateExtensions() {
        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        });

        if (structures && structures.length > 0) {
            for (const o of structures) {
                if (!this.extensions[o.id]) {
                    this.extensions[o.id] = new MyExtension(o.id);
                }
            }
        }
    }

    public updateSpawns() {

        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_SPAWN }
        });

        if (structures && structures.length > 0) {
            this.hasSpawns = true;
            for (const o of structures) {
                if (!this.spawns[o.id]) {
                    this.spawns[o.id] = new MySpawn(o as StructureSpawn);
                }

                // Record the left-most spawn as the origin
                if (!this.origin) {
                    this.origin = o.pos;
                } else if (o.pos.x < this.origin.x) {
                    this.origin = o.pos;
                }
            }
        }
    }

    public updateLinks() {
        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_LINK }
        });

        if (structures && structures.length > 0) {
            for (const o of structures) {
                if (!this.links[o.id]) {
                    this.links[o.id] = new MyLink(o.id);
                }
            }
        }
    }

    public updateWalls() {
        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_WALL }
        });

        if (structures && structures.length > 0) {
            for (const o of structures) {
                if (!this.walls[o.id]) {
                    this.walls[o.id] = new MyWall(o.id);
                }
            }
        }
    }

    public updateRamparts() {
        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_RAMPART }
        });

        if (structures && structures.length > 0) {
            for (const o of structures) {
                this.ramparts[o.id] = new MyRampart(o.id);
            }
        }
    }

    public updateStorage() {
        throw new Error("Method not implemented.");
    }

    public updateTowers() {

        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        });

        if (structures && structures.length > 0) {
            for (const o of structures) {
                if (!this.towers[o.id]) {
                    this.towers[o.id] = new MyTower(o.id);
                }
            }
        }
    }

    public updateObserver() {
        throw new Error("Method not implemented.");
    }

    public updatePowerSpawn() {
        throw new Error("Method not implemented.");
    }

    public updateLabs() {
        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_LAB }
        });

        if (structures && structures.length > 0) {
            for (const o of structures) {
                if (!this.labs[o.id]) {
                    this.labs[o.id] = new MyLab(o.id);
                }
            }
        }
    }

    public updateTerminal() {
        throw new Error("Method not implemented.");
    }

    public updateNuker() {
        throw new Error("Method not implemented.");
    }
    //#endregion update_code

    // Check the cluster at the start of the run loop
    public check(): void {
        this.checkSpawns();
        this.checkCreeps();

        if (checkRefresh(_REFRESH.roomPlanner)) {
            RoomPlanner.planRoom(this)
        }
    }

    public checkAndRequest(role: string, room: string, required: number, requestPriority: string, firstRequestPriority: string = requestPriority): void {

        const creeps = _.filter(gameState.creeps, c => c.role === role && c.workRoom === room && c.homeRoom === this.clusterName);

        // Only have one outstanding request per remote
        if (creeps.length < required && !this.requestExists(room, role, requestPriority)) {
            log.debug(`Creep ${role} requested for room ${room} in cluster ${this.clusterName} creep count ${creeps.length} required ${required} request exists? ${this.requestExists(room, role, requestPriority)}`, _DEBUG_REQUESTS);
            this.requestCreep(room, role, (creeps.length === 0 ? firstRequestPriority : requestPriority));
        }
    }

    // Run cluster acions at the end of a run loop
    public run(): void {
        this.runSpawns();
        this.runTowers();
    }

    //#endregion Public

    //#region Private

    // Check creep counts
    private checkCreeps() {

        log.debug(`Check creeps - cluster ${this.clusterName}, canSpawn ${this.canSpawn}, hasSpawns ${this.hasSpawns}`, _DEBUG_CLUSTER)

        // Miners
        if (checkRefresh(_REFRESH.drone)) {
            this.checkAndRequest(Roles.drone, this.clusterName, CreepMiner.required(this), RequestPriority[6], RequestPriority[9]);
        }

        // Haulers
        if (checkRefresh(_REFRESH.transporter)) {
            this.checkAndRequest(Roles.transporter, this.clusterName, CreepHauler.required(this), RequestPriority[6], RequestPriority[7]);
        }

        // Workers
        if (checkRefresh(_REFRESH.worker)) {
            this.checkAndRequest(Roles.worker, this.clusterName, CreepWorker.required(this), RequestPriority[5], RequestPriority[7]);
        }

        // Upgraders
        if (checkRefresh(_REFRESH.upgrader)) {
            this.checkAndRequest(Roles.upgrader, this.clusterName, CreepUpgrader.required(this), RequestPriority[5], RequestPriority[7]);
        }

        return;

    }

    // Check spawns
    private checkSpawns() {

        // Set the flag to false
        this.canSpawn = false;

        for (const s in this.spawns) {
            const spawn: StructureSpawn | null = Game.getObjectById(s);

            if (spawn && spawn.spawning && !Game.creeps[spawn.spawning.name].added) {
                gameState.addCreep(Game.creeps[spawn.spawning.name]);
                Game.creeps[spawn.spawning.name].added = true;
            }

            if (spawn && !spawn.spawning) {
                // Spawn is valid and not active
                this.canSpawn = true;
            }
        }
    }

    // Run the towers
    private runTowers() {
        const room: Room = Game.rooms[this.clusterName];

        // Only run if hostiles in room and tower count>0
        if (Object.keys(gameState.rooms[this.clusterName].hostiles).length > 0 && Object.keys(this.towers).length > 0) {
            for (const t in this.towers) {
                const tower: StructureTower | null = Game.getObjectById(t);

                if (tower) {
                    const closestHostile: Creep | null = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

                    // Attack closest hostile
                    if (closestHostile !== null) {
                        tower.attack(closestHostile);
                    }
                }
            }
        }
    }

    private runSpawns() {
        // Check the room can spawn
        if (this.canSpawn) {
            for (const id in this.spawns) {
                // Get the spawn
                const s: StructureSpawn | null = Game.getObjectById(id);

                // Spawn is valid and not spawning
                if (s && !s.spawning) {
                    // Spawn based on priority
                    switch (true) {
                        case spawnByPriority(this, RequestPriority[9], s): {
                            break;
                        }
                        case spawnByPriority(this, RequestPriority[8], s): {
                            break;
                        }
                        case spawnByPriority(this, RequestPriority[7], s): {
                            break;
                        }
                        case spawnByPriority(this, RequestPriority[6], s): {
                            break;
                        }
                        case spawnByPriority(this, RequestPriority[5], s): {
                            break;
                        }
                        case spawnByPriority(this, RequestPriority[4], s): {
                            break;
                        }
                        case spawnByPriority(this, RequestPriority[3], s): {
                            break;
                        }
                        case spawnByPriority(this, RequestPriority[2], s): {
                            break;
                        }
                        case spawnByPriority(this, RequestPriority[1], s): {
                            break;
                        }
                    }
                }
            }
        }

        return;

        function spawnByPriority(cluster: MyCluster, priority: string, spawn: StructureSpawn): boolean {
            let spawnReturn: { result: boolean, creepName: string } = { result: false, creepName: '' };
            const index: number = cluster.creepRequests.findIndex((request: CreepRequest) => request.priority === priority);

            if (index >= 0) {

                log.debug(`Item ${index} selected for spawning`, _DEBUG_REQUESTS);

                // Action the request
                if (!cluster.creepRequests[index].testRequest(spawn)) {
                    // Can't spawn it yet - return true and wait for next tick
                    return true;
                }

                spawnReturn = cluster.creepRequests[index].actionRequest(spawn);

                if (spawnReturn.result && spawnReturn.creepName !== '') {

                    log.debug(`Spawn returned true`, _DEBUG_REQUESTS);

                    // Add the creep to gamestate
                    gameState.addCreep(Game.creeps[spawnReturn.creepName]);

                    // Remove request array element
                    cluster.creepRequests.splice(index, 1);

                }

            }

            return spawnReturn.result;

        }
    }

    // Make a creep request
    public requestExists(requestRoom: string, requestRole: string, priority: string): boolean {

        const requests = this.creepRequests.find(r => r.spawnRoom === this.clusterName && r.workRoom === requestRoom && r.creepRole === requestRole && r.priority === priority);

        if (requests) {
            // Request exists
            return true;
        }

        return false;
    }

    public requestCreep(requestRoom: string, requestRole: string, priority: string): void {

        // Add request
        this.creepRequests.push(new CreepRequest(this.clusterName, requestRoom, requestRole, priority));

    };

    //#endregion Private
}
