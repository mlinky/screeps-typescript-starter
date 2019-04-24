import { MyDefault } from "./default";
import { profile } from "profiler/decorator";
import { gameState } from "defs";
import { map, locationDetails } from "./map";

@profile
export class MySource extends MyDefault {
    source: Source;
    roomName: string;
    container?: StructureContainer;
    miningSpots: RoomPosition[] = [];

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
        let surroundings: { [position: number]: locationDetails } = map.lookAround(this.source.pos);

        // Inspect surroundings
        for (let i = 0; i <= 8; i++) {
            for (let l of surroundings[i].results) {
                switch (l.type) {
                    case LOOK_TERRAIN: {
                        if (l.terrain != 'wall') {
                            // terrain is not wall, potential mining spot
                            this.miningSpots.push(new RoomPosition(surroundings[i].x, surroundings[i].y, surroundings[i].room));
                        }

                        break;
                    }

                    case LOOK_STRUCTURES: {
                        if (l.structure && l.structure.structureType == STRUCTURE_CONTAINER) {
                            this.container = <StructureContainer>Game.getObjectById(l.structure.id);
                        }

                        break;
                    }
                }
            }
        }
    }
}
