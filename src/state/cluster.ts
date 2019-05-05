import { Task } from "creep-tasks/Task";
import { CreepRequest, RequestPriority } from "creeps/creepRequest";
import { CreepHauler } from "creeps/hauler";
import { CreepMiner } from "creeps/miner";
import { Roles } from "creeps/setups";
import { CreepUpgrader } from "creeps/upgrader";
import { CreepWorker } from "creeps/worker";
import { gameState } from "defs";
import { profile } from "profiler/decorator";
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
    public _creepsRequired: { [role: string]: number } = {}
    public creepsAvailable: { [role: string]: number } = {}
    public creepsRequested: { [role: string]: number } = {}
    public tasks: { [digest: string]: Task } = {};

    public initialised: boolean = false;
    public firstTick: boolean = true;

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
        const cluster: MyCluster = this;

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
        const roomList = _.filter(gameState.rooms, (room) => room.clusterName = this.clusterName);

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
        // Handle the first tick
        if (this.firstTick) {
            for (const r in Roles) {
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
            for (const r in Roles) {
                checkRole(this, r);
            }
        }

        return;

        // Check upgrader numbers
        function checkRole(cluster: MyCluster, role: string): void {
            if (cluster.hasSpawns) {
                if (cluster.creepsRequired(role) > (cluster.creepsAvailable[role] + cluster.creepsRequested[role])) {
                    let priority: RequestPriority;

                    if (cluster.creepsAvailable[role] + cluster.creepsRequested[role] === 0) {
                        // No creeps of this type found or requested
                        if (role === 'drone') {
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

        for (const s in this.spawns) {
            const spawn: StructureSpawn | null = Game.getObjectById(s);

            if (spawn && spawn.spawning && spawn.spawning.remainingTime === 1) {
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
        if (this._creepsRequired[role] === 0) {
            let updateRequired: boolean = false;

            switch (role) {
                case 'drone': {
                    if (checkRefresh(_REFRESH.drone)) {
                        updateRequired = true;
                    }
                }
                case 'upgrader': {
                    if (checkRefresh(_REFRESH.upgrader)) {
                        updateRequired = true;
                    }
                }
                case 'transporter': {
                    if (checkRefresh(_REFRESH.transporter)) {
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
            case 'drone': {
                this._creepsRequired[role] = CreepMiner.required(this);
                break;
            }
            case 'transporter': {
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
                this._creepsRequired[role] = 0;
                break;
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

    private runVisuals() {
        const room: Room = Game.rooms[this.clusterName];
        let visRow: number = 0;
        const visCol: number = 0;

        placeText(`Sources:    ${Object.keys(gameState.rooms[this.clusterName].sources).length}`);
        for (const r in this._creepsRequired) {
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
            for (const id in this.spawns) {
                // Get the spawn
                const s: StructureSpawn | null = Game.getObjectById(id);

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
            const index: number = cluster.creepRequests.findIndex((request: CreepRequest) => request.priority === priority)

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
