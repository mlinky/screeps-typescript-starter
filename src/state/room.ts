import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { Debug } from "settings";
import { _REFRESH, checkRefresh } from "utils/refresh";
import { RoadPlanner } from "utils/roadPlanner";
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

        this.updateController();
        initSources();
        this.updateContainers();
        this.updateConstructionSites();
        this.updateRoads();

        this.initialised = true;

        return;

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

        this.planRoads()
        this.updateHostiles();
        this.runVisuals();

    }

    private planRoads(): void {
        if (checkRefresh(_REFRESH.roadPlanner)) {
            if (gameState.buildCount < 80) {
                // RoadPlanner.planRoads(this)
            }
        }
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

        placeText(' ');
        placeText(`Capacity   ${room.energyCapacityAvailable}`);
        placeText(`Available  ${room.energyAvailable}`);
        placeText(' ');
        placeText(`Dropped     ${this.totalDroppedEnergy()}`);
        placeText(`Containers  ${this.totalContainerEnergy()}`);


        return;

        function placeText(text: string) {
            room.visual.text(text, visCol, ++visRow, { align: "left" });
        };

    }

    public constructionComplete(site: MyContructionSite) {

        log.debug(`Construction complete for ${site.type}`, Debug.construction);

        switch (site.type) {
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

    public updateController() {
        // set controller ID
        if (this.controller) {
            // Already have a controller stored - update that
            this.controller.update()

        } else {
            //
            const controller: StructureController | undefined = Game.rooms[this.roomName].controller;

            if (controller) {
                this.controller = new MyController(controller);
            }
        }

    }

    public updateContainers() {

        log.debug(`Updating containers for room ${this.roomName}`, Debug.containers);
        const structures = Game.rooms[this.roomName].find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_CONTAINER }
        });

        log.debug(`Found ${structures.length} containers`, Debug.containers);
        if (structures && structures.length > 0) {
            for (const o of structures) {
                if (!this.containers[o.id]) {
                    log.debug(`Found new container ${o.id}`, Debug.containers);
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

        if (Game.rooms[this.roomName]) {
            const sites = Game.rooms[this.roomName].find(FIND_MY_CONSTRUCTION_SITES);

            if (sites && sites.length > 0) {
                for (const o of sites) {
                    this.constructionSites[o.id] = new MyContructionSite(o);
                }
            }
        }
    }

    private totalDroppedEnergy(): number {
        let totalResource: number = 0;

        for (const r of Game.rooms[this.roomName].droppedResource) {
            if (r.resourceType === RESOURCE_ENERGY) {
                totalResource += r.amount
            }
        }

        return totalResource;

    }

    private totalContainerEnergy(): number {
        let totalResource: number = 0;

        log.debug(`Container count - ${Object.values(this.containers).length}`, Debug.containers)

        for (const c of Object.values(this.containers)) {
            const container = Game.getObjectById(c.id) as StructureContainer;
            totalResource += container.store.energy;
        }

        return totalResource;

    }
}
