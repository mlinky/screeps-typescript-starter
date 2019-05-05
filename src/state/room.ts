import { gameState } from "defs";
import { profile } from "profiler/decorator";
import { MyContructionSite } from "./constructionSite";
import { MyContainer } from "./container";
import { MyController } from "./controller";
import { MyHostileCreep } from "./hostilerCreep";
import { MyRoad } from "./road";
import { MySource } from "./source";

@profile
export class MyRoom {
    public room: Room;
    public roomName: string;
    public clusterName: string;
    public clusterHub: boolean;
    public controller?: MyController;
    public sources: { [sourceID: string]: MySource } = {};
    public containers: { [sourceID: string]: MyContainer } = {};
    public constructionSites: { [sourceID: string]: MyContructionSite } = {};
    public roads: { [sourceID: string]: MyRoad } = {};

    public hostiles: { [creepID: string]: MyHostileCreep } = {};

    public terrain: RoomTerrain;

    public initialised: boolean;

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
        const room: MyRoom = this;

        initController();
        initSources();
        this.updateContainers();
        initConstructionSites();
        this.updateRoads();

        this.initialised = true;

        return;

        function initController(): void {
            // set controller ID
            const controller: StructureController | undefined = Game.rooms[room.roomName].controller;

            if (controller) {
                room.controller = new MyController(controller);
            }
        }

        function initSources(): void {

            const sources = Game.rooms[room.roomName].find(FIND_SOURCES);

            if (sources && sources.length > 0) {
                for (const o of sources) {
                    room.sources[o.id] = new MySource(o);
                }
            }
        }

        function initConstructionSites(): void {

            const sites = Game.rooms[room.roomName].find(FIND_MY_CONSTRUCTION_SITES);

            if (sites && sites.length > 0) {
                for (const o of sites) {
                    room.constructionSites[o.id] = new MyContructionSite(o);
                }
            }
        }

    }

    public check(): void {
        checkSources(this);

        return;

        function checkSources(room: MyRoom): void {
            for (const s in room.sources) {
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
        for (const t of targets) {
            this.hostiles[t.id] = new MyHostileCreep(t);
        }
    }

    public constructionComplete(id: string) {

        // gameState.clusters[this.homeRoom].newStructure(gameState.rooms[this.workRoom].constructionSites[i].type);
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
            for (const o of structures) {
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
            for (const o of structures) {
                if (!this.containers[o.id]) {
                    this.containers[o.id] = new MyContainer(o.id);
                }
            }
        }

        // Update containers now
        for (const s of Object.values(this.sources)) {
            if (s.updateContainers()) {
                break;
            }
        }
    }
}
