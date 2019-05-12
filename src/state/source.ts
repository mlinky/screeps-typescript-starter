import { TaskHarvest } from "creep-tasks/TaskInstances/task_harvest";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { Debug } from "settings";
import { MyCluster } from "./cluster";
import { MyDefault } from "./default";
import { LocationDetails, Map } from "./map";

@profile
export class MySource extends MyDefault {
    public pos: RoomPosition;
    public roomName: string;
    public clusterName: string = '';
    public container?: StructureContainer;
    public miningSpots: MiningSpot[] = [];
    public workParts: number = 0;

    constructor(source: Source) {
        // Call the base class
        super(source.id);

        this.roomName = source.room.name;
        this.pos = source.pos;

        this.clusterName = Map.findClosestCluster(source.pos);

        if (this.clusterName === '') {
            log.error(`Failed to select a cluster for source ${source.id}`);
        }

        // Update the info for the source surroundings
        this.updateSurroundings();

        return;

    }

    private updateSurroundings(): void {
        // Grab surroundings
        const surroundings: LocationDetails[] = Map.lookAround(this.pos);
        let containerPending: boolean = false;

        // Inspect surroundings
        for (const s of surroundings) {
            for (const l of s.results) {
                switch (l.type) {
                    case LOOK_TERRAIN: {
                        if (l.terrain !== 'wall') {
                            // terrain is not wall, potential mining spot
                            this.miningSpots.push(new MiningSpot(s.x, s.y, s.room));
                        }

                        break;
                    }

                    case LOOK_STRUCTURES: {
                        // Have we found the container?
                        if (l.structure && l.structure.structureType === STRUCTURE_CONTAINER) {
                            this.container = Game.getObjectById(l.structure.id) as StructureContainer;
                        }

                        break;
                    }

                    case LOOK_CONSTRUCTION_SITES: {
                        // Is this the container construction site
                        if (l.constructionSite && l.constructionSite.structureType === STRUCTURE_CONTAINER) {
                            containerPending = true;
                        }
                    }
                }
            }
        }

        if (!this.container && !containerPending) {
            // Need to place a container
            const bestPos: RoomPosition | undefined = Map.findClosestConstructionPos(gameState.clusters[this.clusterName].origin!, surroundings)

            if (bestPos) {
                // We found a 'best' location
                Game.rooms[this.roomName].createConstructionSite(bestPos.x, bestPos.y, STRUCTURE_CONTAINER)
            }
        }
    }

    public updateContainers(): boolean {
        // Grab surroundings

        if (this.container) {
            // Already got a container!!
            return false;
        }

        const surroundings: LocationDetails[] = Map.lookAround(this.pos);

        for (const s of surroundings) {
            for (const l of s.results) {
                if (l.type === LOOK_CONSTRUCTION_SITES) {
                    if (l.structure && l.structure.structureType === STRUCTURE_CONTAINER) {
                        this.container = Game.getObjectById(l.structure.id) as StructureContainer;
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public check(): void {
        // Check the source
        if (Debug.sources) {
            log.debug(`Room: ${this.roomName}, Source: ${this.id}, Container: ${(this.container ? this.container.id : 'undefined')}, Mining spots: ${this.miningSpots.length}, Workparts: ${this.workParts}`);
        }
    }
}

export class MiningSpot {
    public pos: RoomPosition;
    public miners: string[] = [];
    public workParts: number = 0;

    constructor(x: number, y: number, room: string) {
        this.pos = new RoomPosition(x, y, room);
    }
}
