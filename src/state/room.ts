import { gameState } from "defs";
import { profile } from "profiler/decorator";
import { _REFRESH, checkRefresh } from "utils/refresh";
import { MyContructionSite } from "./constructionSite";
import { MyContainer } from "./container";
import { MyController } from "./controller";
import { MyHostileCreep } from "./hostilerCreep";
import { MyRoad } from "./road";
import { MySource } from "./source";

@profile
export abstract class Rooms {

    public static check() {
        // Check room
        for (const r in gameState.rooms) {
            gameState.rooms[r].check();
        }
    }

    public static run() {
        // Run room
        for (const r in gameState.rooms) {
            gameState.rooms[r].run();
        }
    }
}

@profile
export class MyRoom {
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
        this.updateConstructionSites();
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
    }

    public check(): void {

        if (checkRefresh(_REFRESH.roomPlanner)) {
            this.updateConstructionSites();
        }

        checkSources(this);

        return;

        function checkSources(room: MyRoom): void {
            for (const s in room.sources) {
                room.sources[s].check();
            }
        }
    }

    public run(): void {

        if (!Game.rooms[this.roomName]) {
            return;
        }

        this.updateHostiles();
        this.runVisuals();

    }

    private updateHostiles(): void {
        const targets = Game.rooms[this.roomName].find(FIND_HOSTILE_CREEPS);

        // Store current hostile creeps
        for (const t of targets) {
            this.hostiles[t.id] = new MyHostileCreep(t);
        }
    }

    private runVisuals() {
        const room: Room = Game.rooms[this.roomName];
        let visRow: number = 0;
        const visCol: number = 0;
        const census: { [role: string]: number } = {};
        let count: number = 0;
        const creeps = _.filter(gameState.creeps, c => c.workRoom === this.roomName);

        for (const c of creeps) {
            if (census[c.role]) {
                census[c.role]++;
            } else {
                census[c.role] = 1;
            }
            count++;
        }

        placeText(`Sources:    ${Object.keys(gameState.rooms[this.roomName].sources).length}`);
        placeText(`Creeps:    ${count}`);
        placeText(' ');

        for (const r in census) {
            placeText(`${r} - ${census[r]}`);
        }

        return;

        function placeText(text: string) {
            room.visual.text(text, visCol, ++visRow, { align: "left" });
        };

    }

    public constructionComplete(id: string) {

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

    public updateConstructionSites(): void {

        const sites = Game.rooms[this.roomName].find(FIND_MY_CONSTRUCTION_SITES);

        if (sites && sites.length > 0) {
            for (const o of sites) {
                this.constructionSites[o.id] = new MyContructionSite(o);
            }
        }
    }
}
