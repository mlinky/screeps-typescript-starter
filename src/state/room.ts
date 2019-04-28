import { MyController } from "./controller";
import { MySource } from "./source";
import { MyContainer } from "./container";
import { MyContructionSite } from "./constructionSite";
import { MyRoad } from "./road";
import { profile } from "profiler/decorator";
import { MyHostileCreep } from "./hostilerCreep";
import { gameState } from "defs";

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
        this.updateContainers();
        initConstructionSites();
        this.updateRoads();

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

        function initConstructionSites(): void {

            const sites = Game.rooms[room.roomName].find(FIND_MY_CONSTRUCTION_SITES);

            if (sites && sites.length > 0) {
                for (let o of sites) {
                    room.constructionSites[o.id] = new MyContructionSite(o);
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

    public constructionComplete(id: string) {

        //gameState.clusters[this.homeRoom].newStructure(gameState.rooms[this.workRoom].constructionSites[i].type);
        switch (this.constructionSites[id].type) {
            case "extension": {
                gameState.clusters[this.clusterName].updateExtensions();
                break;
            }
            case "rampart": {
                gameState.clusters[this.clusterName].updateRamparts();
                break;
            }
            case "road": {
                this.updateRoads();
                break;
            }
            case "spawn": {
                gameState.clusters[this.clusterName].updateSpawns();
                break;
            }
            case "link": {
                gameState.clusters[this.clusterName].updateLinks();
                break;
            }
            case "constructedWall": {
                gameState.clusters[this.clusterName].updateWalls();
                break;
            }
            case "storage": {
                gameState.clusters[this.clusterName].updateStorage();
                break;
            }
            case "tower": {
                gameState.clusters[this.clusterName].updateTowers();
                break;
            }
            case "observer": {
                gameState.clusters[this.clusterName].updateObserver();
                break;
            }
            case "powerSpawn": {
                gameState.clusters[this.clusterName].updatePowerSpawn();
                break;
            }
            case "extractor": {
                this.updateExtractor();
                break;
            }
            case "lab": {
                gameState.clusters[this.clusterName].updateLabs();
                break;
            }
            case "terminal": {
                gameState.clusters[this.clusterName].updateTerminal();
                break;
            }
            case "container": {
                this.updateContainers()
                break;
            }
            case "nuker": {
                gameState.clusters[this.clusterName].updateNuker();
                break;
            }
        }
    }

    public updateRoads() {
        const structures = Game.rooms[this.roomName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_ROAD }
        });

        if (structures && structures.length > 0) {
            for (let o of structures) {
                if (!this.roads[o.id]) {
                    this.roads[o.id] = new MyRoad(o.id);
                }
            }
        }
    }

    public updateExtractor() {
        // throw new Error("Method not implemented.");
    }

    public updateContainers() {

        const structures = Game.rooms[this.roomName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_CONTAINER }
        });

        if (structures && structures.length > 0) {
            for (let o of structures) {
                if (!this.containers[o.id]) {
                    this.containers[o.id] = new MyContainer(o.id);
                }
            }
        }
    }
}
