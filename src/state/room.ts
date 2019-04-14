import { MyController } from "./controller";
import { MySource } from "./source";
import { MyContainer } from "./container";
import { MyContructionSite } from "./constructionSite";
import { MyRoad } from "./road";
import { MyWall } from "./wall";
import { MyRampart } from "./ramparts";
import { profile } from "profiler/decorator";

@profile
export class MyRoom {
    roomName: string;
    clusterHub: boolean;
    controller?: MyController;
    sources: { [sourceID: string]: MySource };
    containers: { [sourceID: string]: MyContainer };
    constructionSites: { [sourceID: string]: MyContructionSite };
    roads: { [sourceID: string]: MyRoad };
    walls: { [sourceID: string]: MyWall };
    ramparts: { [sourceID: string]: MyRampart };

    initialised: boolean;

    constructor(roomName: string, clusterHub: boolean = false) {
        this.roomName = roomName;
        this.clusterHub = clusterHub;
        this.sources = {};
        this.containers = {};
        this.constructionSites = {};
        this.roads = {};
        this.walls = {};
        this.ramparts = {};

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

        this.initController();
        this.initSources();
        this.initContainers();
        this.initConstructionSites();
        this.initRoads();
        this.initWalls();
        this.initRamparts();

        this.initialised = true;
    }

    private initController(): void {
        // set controller ID
        let controller: StructureController | undefined = Game.rooms[this.roomName].controller;

        if (controller) {
            this.controller = new MyController(controller.id);
        }
    }

    private initSources(): void {

        const sources = Game.rooms[this.roomName].find(FIND_SOURCES);

        if (sources && sources.length > 0) {
            for (let o of sources) {
                this.sources[o.id] = new MySource(o.id);
            }
        }
    }

    private initContainers(): void {

        const structures = Game.rooms[this.roomName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_CONTAINER }
        });

        if (structures && structures.length > 0) {
            for (let o of structures) {
                this.containers[o.id] = new MyContainer(o.id);
            }
        }
    }

    private initConstructionSites(): void {

        const sites = Game.rooms[this.roomName].find(FIND_MY_CONSTRUCTION_SITES);

        if (sites && sites.length > 0) {
            for (let o of sites) {
                this.constructionSites[o.id] = new MyContructionSite(o.id);
            }
        }
    }

    private initRoads(): void {

        const structures = Game.rooms[this.roomName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_ROAD }
        });

        if (structures && structures.length > 0) {
            for (let o of structures) {
                this.roads[o.id] = new MyRoad(o.id);
            }
        }
    }

    private initWalls(): void {

        const structures = Game.rooms[this.roomName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_WALL }
        });

        if (structures && structures.length > 0) {
            for (let o of structures) {
                this.walls[o.id] = new MyWall(o.id);
            }
        }
    }

    private initRamparts(): void {

        const structures = Game.rooms[this.roomName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_RAMPART }
        });

        if (structures && structures.length > 0) {
            for (let o of structures) {
                this.ramparts[o.id] = new MyRampart(o.id);
            }
        }
    }

}
