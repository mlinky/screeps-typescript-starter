import { MyDefault } from "./default";
import { profile } from "profiler/decorator";
import { locationDetails, map } from "./map";
import { gameState } from "defs";

@profile
export class MyController extends MyDefault {
    controller: StructureController;
    container?: StructureContainer;
    room: string;

    constructor(controller: StructureController) {

        super(controller.id);

        this.controller = controller;
        this.room = controller.room.name;

        this.checkContainer();

    }

    checkContainer() {

        let containerPending: boolean = false;

        if (this.container) {
            return;
        }

        let surroundings: locationDetails[] = map.lookAround(this.controller.pos, 3);

        for (let s of surroundings) {
            for (let l of s.results) {
                switch (l.type) {
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
            let bestPos: RoomPosition | undefined = map.findClosestConstructionPos(gameState.clusters[this.room].origin!, surroundings)

            if (bestPos) {
                // We found a 'best' location
                Game.rooms[this.room].createConstructionSite(bestPos.x, bestPos.y, STRUCTURE_CONTAINER)
            }

        }
    }

}
