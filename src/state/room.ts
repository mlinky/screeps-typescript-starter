import { MyController } from "./controller";
import { MySource } from "./source";
import { MyContainer } from "./container";
import { MyContructionSite } from "./constructionSite";
import { MyRoad } from "./road";
import { MyWall } from "./wall";
import { MyRampart } from "./ramparts";
import { profile } from "profiler/decorator";
import { MyHostileCreep } from "./hostilerCreep";

@profile
export class MyRoom {
    room: Room;
    roomName: string;
    clusterName: string;
    clusterHub: boolean;
    controller?: MyController;
    sources: { [sourceID: string]: MySource } = {};
    containers: { [sourceID: string]: MyContainer } = {};
    constructionSites: { [sourceID: string]: MyContructionSite } = {};
    roads: { [sourceID: string]: MyRoad } = {};
    walls: { [sourceID: string]: MyWall } = {};
    ramparts: { [sourceID: string]: MyRampart } = {};

    hostiles: { [creepID: string]: MyHostileCreep } = {};

    terrain: RoomTerrain;

    initialised: boolean;

    constructor(room: Room, clusterName: string, clusterHub: boolean = false) {
        this.room = room;
        this.clusterName = clusterName;
        this.roomName = room.name;
        this.clusterHub = clusterHub;
        this.terrain = Game.map.getRoomTerrain(room.name);

        this.initialised = false;
    }

    public initRoom(): void {
        // For each room
        //   gather controller information
        //   gather source information
        //   gather containers
        //   gather contruction sites
        //   gather road information
        //   gather wall information
        //   gather ramparts information
        let room: MyRoom = this;

        initController();
        initSources();
        initContainers();
        initConstructionSites();
        initRoads();
        initWalls();
        initRamparts();

        this.initialised = true;

        return;

        function initController(): void {
            // set controller ID
            let controller: StructureController | undefined = Game.rooms[room.roomName].controller;

            if (controller) {
                room.controller = new MyController(controller);
            }
        }

        function initSources(): void {

            const sources = Game.rooms[room.roomName].find(FIND_SOURCES);

            if (sources && sources.length > 0) {
                for (let o of sources) {
                    room.sources[o.id] = new MySource(o);
                }
            }
        }

        function initContainers(): void {

            const structures = Game.rooms[room.roomName].find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_CONTAINER }
            });

            if (structures && structures.length > 0) {
                for (let o of structures) {
                    room.containers[o.id] = new MyContainer(o.id);
                }
            }
        }

        function initConstructionSites(): void {

            const sites = Game.rooms[room.roomName].find(FIND_MY_CONSTRUCTION_SITES);

            if (sites && sites.length > 0) {
                for (let o of sites) {
                    room.constructionSites[o.id] = new MyContructionSite(o.id);
                }
            }
        }

        function initRoads(): void {

            const structures = Game.rooms[room.roomName].find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_ROAD }
            });

            if (structures && structures.length > 0) {
                for (let o of structures) {
                    room.roads[o.id] = new MyRoad(o.id);
                }
            }
        }

        function initWalls(): void {

            const structures = Game.rooms[room.roomName].find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_WALL }
            });

            if (structures && structures.length > 0) {
                for (let o of structures) {
                    room.walls[o.id] = new MyWall(o.id);
                }
            }
        }

        function initRamparts(): void {

            const structures = Game.rooms[room.roomName].find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_RAMPART }
            });

            if (structures && structures.length > 0) {
                for (let o of structures) {
                    room.ramparts[o.id] = new MyRampart(o.id);
                }
            }
        }

    }

    public check(): void {
        checkSources(this);

        return;

        function checkSources(room: MyRoom): void {
            for (let s in room.sources) {
                room.sources[s].check();
            }
        }
    }

    public run(): void {
        this.updateHostiles();

    }

    private updateHostiles(): void {
        const targets = Game.rooms[this.roomName].find(FIND_HOSTILE_CREEPS);

        // Store current hostile creeps
        for (let t of targets) {
            this.hostiles[t.id] = new MyHostileCreep(t);
        }
    }
}
