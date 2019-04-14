import { MyRoom } from "./room";
import { MyController } from "./controller";
import { MySpawn } from "./spawn";
import { MyExtension } from "./extension";
import { MyTower } from "./tower";
import { MyLab } from "./lab";
import { MyLink } from "./link";
import { profile } from "profiler/decorator";

@profile
export class MyCluster {
    clusterName: string;
    rooms: { [roomName: string]: MyRoom };

    spawns: { [spawnID: string]: MySpawn };
    extensions: { [extensionID: string]: MyExtension };
    towers: { [towerID: string]: MyTower };
    labs: { [labID: string]: MyLab };
    links: { [linkID: string]: MyLink };

    initialised: boolean;

    constructor(roomName: string) {
        // Init cluster state
        this.clusterName = roomName;
        this.rooms = {};
        this.spawns = {};
        this.extensions = {};
        this.towers = {};
        this.labs = {};
        this.links = {};

        // Add the cluster hub
        this.rooms[roomName] = new MyRoom(roomName, true);

        this.initialised = false;

    };

    // Initialise cluster state
    public initCluster(): void {

        this.initSpawns();
        this.initExtensions();
        this.initTowers();
        this.initLabs();
        this.initLinks();

        for (let r in this.rooms) {
            this.rooms[r].initRoom()
        }

        this.initialised = true;

    };

    private initSpawns(): void {

        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_SPAWN }
        });

        if (structures && structures.length > 0) {
            for (let o of structures) {
                this.spawns[o.id] = new MySpawn(o.id);
            }

        }

    }

    private initExtensions(): void {

        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        });

        if (structures && structures.length > 0) {
            for (let o of structures) {
                this.spawns[o.id] = new MyExtension(o.id);
            }

        }

    }

    private initTowers(): void {

        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        });

        if (structures && structures.length > 0) {
            for (let o of structures) {
                this.spawns[o.id] = new MyTower(o.id);
            }

        }

    }

    private initLabs(): void {

        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_LAB }
        });

        if (structures && structures.length > 0) {
            for (let o of structures) {
                this.spawns[o.id] = new MyLab(o.id);
            }

        }

    }

    private initLinks(): void {

        const structures = Game.rooms[this.clusterName].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_LINK }
        });

        if (structures && structures.length > 0) {
            for (let o of structures) {
                this.spawns[o.id] = new MyLink(o.id);
            }

        }

    }

    // Structures to collect info for
    // STRUCTURE_SPAWN: "spawn",
    // STRUCTURE_EXTENSION: "extension",
    // STRUCTURE_ROAD: "road",
    // STRUCTURE_WALL: "constructedWall",
    // STRUCTURE_RAMPART: "rampart",
    // STRUCTURE_KEEPER_LAIR: "keeperLair",
    // STRUCTURE_PORTAL: "portal",
    // STRUCTURE_CONTROLLER: "controller",
    // STRUCTURE_LINK: "link",
    // STRUCTURE_STORAGE: "storage",
    // STRUCTURE_TOWER: "tower",
    // STRUCTURE_OBSERVER: "observer",
    // STRUCTURE_POWER_BANK: "powerBank",
    // STRUCTURE_POWER_SPAWN: "powerSpawn",
    // STRUCTURE_EXTRACTOR: "extractor",
    // STRUCTURE_LAB: "lab",
    // STRUCTURE_TERMINAL: "terminal",
    // STRUCTURE_CONTAINER: "container",
    // STRUCTURE_NUKER: "nuker",

    // Run actions for the cluster
    public run(): void {



    }

}
