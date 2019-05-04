import { MyDefault } from "./default";
import { profile } from "profiler/decorator";
import { map, locationDetails } from "./map";
import { log } from "log/log";
import { gameState } from "defs";
import { TaskHarvest } from "creep-tasks/TaskInstances/task_harvest";

const _DEBUG_SOURCES = false;

@profile
export class MySource extends MyDefault {
    source: Source;
    roomName: string;
    container?: StructureContainer;
    miningSpots: MiningSpot[] = [];
    workParts: number = 0;

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
        let surroundings: locationDetails[] = map.lookAround(this.source.pos);
        let containerPending: boolean = false;

        // Inspect surroundings
        for (let s of surroundings) {
            for (let l of s.results) {
                switch (l.type) {
                    case LOOK_TERRAIN: {
                        if (l.terrain != 'wall') {
                            // terrain is not wall, potential mining spot
                            this.miningSpots.push(new MiningSpot(s.x, s.y, s.room));
                        }

                        break;
                    }

                    case LOOK_STRUCTURES: {
                        // Have we found the container?
                        if (l.structure && l.structure.structureType == STRUCTURE_CONTAINER) {
                            this.container = <StructureContainer>Game.getObjectById(l.structure.id);
                        }

                        break;
                    }

                    case LOOK_CONSTRUCTION_SITES: {
                        // Is this the container construction site
                        if (l.constructionSite && l.constructionSite.structureType == STRUCTURE_CONTAINER) {
                            containerPending = true;
                        }
                    }
                }
            }
        }

        if (!this.container && !containerPending) {
            // Need to place a container
            let bestPos: RoomPosition | undefined = map.findClosestConstructionPos(gameState.clusters[this.roomName].origin!, surroundings)

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

        let surroundings: locationDetails[] = map.lookAround(this.source.pos);

        for (let s of surroundings) {
            for (let l of s.results) {
                if (l.type == LOOK_CONSTRUCTION_SITES) {
                    if (l.structure && l.structure.structureType == STRUCTURE_CONTAINER) {
                        this.container = <StructureContainer>Game.getObjectById(l.structure.id);
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
    pos: RoomPosition;
    miners: string[] = [];
    workParts: number = 0;

    constructor(x: number, y: number, room: string) {
        this.pos = new RoomPosition(x, y, room);
    }
}
