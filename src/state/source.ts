import { TaskHarvest } from "creep-tasks/TaskInstances/task_harvest";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { MyDefault } from "./default";
import { LocationDetails, Map } from "./map";

const _DEBUG_SOURCES = false;

@profile
export class MySource extends MyDefault {
    public source: Source;
    public roomName: string;
    public container?: StructureContainer;
    public miningSpots: MiningSpot[] = [];
    public workParts: number = 0;

    constructor(source: Source) {
        // Call the base class
        super(source.id);

        // Store the game object
        this.source = source;

        this.roomName = source.room.name;

        // Update the info for the source surroundings
        this.updateSurroundings();

        return;

    }

    private updateSurroundings(): void {
        // Grab surroundings
        const surroundings: LocationDetails[] = Map.lookAround(this.source.pos);
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
            const bestPos: RoomPosition | undefined = Map.findClosestConstructionPos(gameState.clusters[this.roomName].origin!, surroundings)

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

        const surroundings: LocationDetails[] = Map.lookAround(this.source.pos);

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
        if (_DEBUG_SOURCES) {
            log.debug(`Room: ${this.roomName}, Source: ${this.source.id}, Container: ${(this.container ? this.container.id : 'undefined')}, Mining spots: ${this.miningSpots.length}, Workparts: ${this.workParts}`);
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
