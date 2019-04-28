import { MyRoom } from "./room";
import { MySpawn } from "./spawn";
import { MyExtension } from "./extension";
import { MyTower } from "./tower";
import { MyLab } from "./lab";
import { MyLink } from "./link";
import { profile } from "profiler/decorator";
import { CreepRequest, RequestPriority } from "creeps/creepRequest";
import { gameState } from "defs";
import { Task } from "creep-tasks/Task";
import { CreepMiner } from "creeps/miner";
import { CreepHauler } from "creeps/hauler";
import { CreepUpgrader } from "creeps/upgrader";
import { checkRefresh, _REFRESH } from "utils/refresh";
import { CreepWorker } from "creeps/worker";
import { RoomPlanner } from "utils/roomPlanner";
import { MyWall } from "./wall";
import { MyRampart } from "./ramparts";

const Roles = ['miner', 'hauler', 'worker', 'upgrader']

@profile
export class MyCluster {

    clusterName: string;
    origin?: RoomPosition;

    spawns: { [spawnID: string]: MySpawn } = {};
    extensions: { [extensionID: string]: MyExtension } = {};
    towers: { [towerID: string]: MyTower } = {};
    labs: { [labID: string]: MyLab } = {};
    links: { [linkID: string]: MyLink } = {};
    walls: { [sourceID: string]: MyWall } = {};
    ramparts: { [sourceID: string]: MyRampart } = {};
    creepRequests: CreepRequest[] = [];

    hasSpawns: boolean = false;
    canSpawn: boolean = false;
    _creepsRequired: { [role: string]: number } = {}
    creepsAvailable: { [role: string]: number } = {}
    creepsRequested: { [role: string]: number } = {}
    tasks: { [digest: string]: Task } = {};

    initialised: boolean = false;
    firstTick: boolean = true;

    constructor(room: Room) {
        // Init cluster state
        this.clusterName = room.name;

        this.initCounts();

        // Add the cluster hub room
        gameState.rooms[room.name] = new MyRoom(room, this.clusterName, true);

    };

    //#region Public

    // Initialise cluster state
    public initCluster(): void {
        let cluster: MyCluster = this;

        // Init room objects
        this.initCounts();
        this.updateSpawns();
        this.updateExtensions();
        this.updateTowers();
        this.updateLabs();
        this.updateLinks();
        this.updateRamparts();
        this.updateWalls();

        // Get a list of rooms for this cluster
        let roomList = _.filter(gameState.rooms, (room) => room.clusterName = this.clusterName);

        // Init rooms for the cluster
        for (let r of roomList) {
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
            for (let o of structures) {
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
            for (let o of structures) {
                if (!this.spawns[o.id]) {
                    this.spawns[o.id] = new MySpawn(o.id);
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
            for (let o of structures) {
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
            for (let o of structures) {
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
            for (let o of structures) {
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
            for (let o of structures) {
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
            for (let o of structures) {
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
        // Handle the first tick
        if (this.firstTick) {
            for (let r of Roles) {
                this.updateRequired(r);
            }
            this.firstTick = false;
        }

        this.checkSpawns();
        this.checkCreeps();

        if (checkRefresh(_REFRESH.roomPlanner)) {
            RoomPlanner.planRoom(this)
        }
    }

    // Run cluster acions at the end of a run loop
    public run(): void {
        this.runSpawns();
        this.runTowers();
        this.runVisuals();
    }

    public checkDefined(role: string): void {
        if (!this.creepsAvailable[role]) {
            this.creepsAvailable[role] = 0;
        }

        if (!this._creepsRequired[role]) {
            this._creepsRequired[role] = 0;
        }

        if (!this.creepsRequested[role]) {
            this.creepsRequested[role] = 0;
        }
    }


    //#endregion Public

    //#region Private

    // Initialise creep counts for the cluster
    private initCounts() {
        this._creepsRequired = {}
        this.creepsAvailable = {}
        this.creepsRequested = {}
    }

    // Check creep counts
    private checkCreeps() {

        // Only check for creep requirements if the room can spawn
        if (this.canSpawn) {
            // Check what we have vs what we need
            for (let r of Roles) {
                checkRole(this, r);
            }
        }

        return;

        // Check upgrader numbers
        function checkRole(cluster: MyCluster, role: string): void {
            if (cluster.hasSpawns) {
                if (cluster.creepsRequired(role) > (cluster.creepsAvailable[role] + cluster.creepsRequested[role])) {
                    let priority: RequestPriority;

                    if (cluster.creepsAvailable[role] + cluster.creepsRequested[role] == 0) {
                        // No creeps of this type found or requested
                        if (role == 'miner') {
                            priority = RequestPriority.urgent;
                        } else {
                            priority = RequestPriority.high;
                        }
                    } else {
                        priority = RequestPriority.low;
                    }

                    cluster.requestCreep(cluster.clusterName, role, priority);

                }
            }
        }
    }

    // Check spawns
    private checkSpawns() {

        // Set the flag to false
        this.canSpawn = false;

        for (let s in this.spawns) {
            let spawn: StructureSpawn | null = Game.getObjectById(s);

            if (spawn && spawn.spawning && spawn.spawning.remainingTime == 1) {
                // Spawn is nearly complete - add the creep ready for action
                if (!Game.creeps[spawn.spawning.name].added) {
                    gameState.addCreep(Game.creeps[spawn.spawning.name]);
                    Game.creeps[spawn.spawning.name].added = true;
                }
            } else if (spawn && spawn.room.energyAvailable >= 300) {
                // Spawn is valid and not active
                this.canSpawn = true;
            }
        }
    }

    // Creeps required
    private creepsRequired(role: string): number {
        if (this._creepsRequired[role] == 0) {
            let updateRequired: boolean = false;

            switch (role) {
                case 'miner': {
                    if (checkRefresh(_REFRESH.miner)) {
                        updateRequired = true;
                    }
                }
                case 'upgrader': {
                    if (checkRefresh(_REFRESH.upgrader)) {
                        updateRequired = true;
                    }
                }
                case 'hauler': {
                    if (checkRefresh(_REFRESH.hauler)) {
                        updateRequired = true;
                    }
                }
                case 'worker': {
                    if (checkRefresh(_REFRESH.worker)) {
                        updateRequired = true;
                    }
                }

            }

            if (updateRequired) {
                this.updateRequired(role);
            }
        }

        return this._creepsRequired[role]
    }

    private updateRequired(role: string): void {

        // Make sure the role variables are defined
        this.checkDefined(role);

        switch (role) {
            case 'miner': {
                this._creepsRequired[role] = CreepMiner.required(this);
                break;
            }
            case 'hauler': {
                this._creepsRequired[role] = CreepHauler.required(this);
                break;
            }
            case 'worker': {
                this._creepsRequired[role] = CreepWorker.required(this);
                break;
            }
            case 'upgrader': {
                this._creepsRequired[role] = CreepUpgrader.required(this);
                break;
            }
            default: {
                this._creepsRequired[role] = 1;
                break;
            }
        }
    }

    // Run the towers
    private runTowers() {
        let room: Room = Game.rooms[this.clusterName];

        // Only run if hostiles in room and tower count>0
        if (Object.keys(gameState.rooms[this.clusterName].hostiles).length > 0 && Object.keys(this.towers).length > 0) {
            for (let t in this.towers) {
                let tower: StructureTower | null = Game.getObjectById(t);

                if (tower) {
                    let closestHostile: Creep | null = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

                    // Attack closest hostile
                    if (closestHostile != undefined) {
                        tower.attack(closestHostile);
                    }
                }
            }
        }
    }

    private runVisuals() {
        let room: Room = Game.rooms[this.clusterName];
        let visRow: number = 0;
        let visCol: number = 0;

        placeText(`Sources:    ${Object.keys(gameState.rooms[this.clusterName].sources).length}`);
        for (let r in this._creepsRequired) {
            placeText(`${r}: ${this.creepsAvailable[r]}/${this.creepsRequired(r)}/${this.creepsRequested[r]}`);
        }

        return;

        function placeText(text: string) {
            room.visual.text(text, visCol, ++visRow, { align: "left" });
        };

    }

    private runSpawns() {
        // Check the room can spawn
        if (this.canSpawn) {
            for (let id in this.spawns) {
                // Get the spawn
                let s: StructureSpawn | null = Game.getObjectById(id);

                // Spawn is valid and not spawning
                if (s && !s.spawning) {
                    // Spawn based on priority
                    switch (true) {
                        case spawnByPriority(this, RequestPriority.urgent, s): {
                            break;
                        }
                        case spawnByPriority(this, RequestPriority.high, s): {
                            break;
                        }
                        case spawnByPriority(this, RequestPriority.medium, s): {
                            break;
                        }
                        case spawnByPriority(this, RequestPriority.low, s): {
                            break;
                        }
                    }
                }
            }
        }

        return;

        function spawnByPriority(cluster: MyCluster, priority: RequestPriority, spawn: StructureSpawn): boolean {
            let spawnReturn: boolean = false;
            const index: number = cluster.creepRequests.findIndex((request: CreepRequest) => { return request.priority == priority })

            if (index >= 0) {
                spawnReturn = cluster.creepRequests[index].actionRequest(spawn);

                if (spawnReturn) {
                    // Decrement requested creep number
                    cluster.creepsRequested[cluster.creepRequests[index].creepRole]--;

                    // Increment available creeps
                    cluster.creepsAvailable[cluster.creepRequests[index].creepRole]++

                    // Remove request array element
                    cluster.creepRequests.splice(index, 1);
                }

            }

            return spawnReturn;

        }
    }

    // Make a creep request
    private requestCreep(requestRoom: string, requestRole: string, priority: RequestPriority): void {

        // Make request
        this.creepRequests.push(new CreepRequest(this.clusterName, requestRoom, requestRole, priority));

        // Track requested creeps
        this.creepsRequested[requestRole]++;

    };

    //#endregion Private
}
