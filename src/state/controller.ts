import { gameState } from "defs";
import { profile } from "profiler/decorator";
import { MyDefault } from "./default";
import { LocationDetails, Map } from "./map";

@profile
export class MyController extends MyDefault {
    public controller: StructureController;
    public container?: StructureContainer;
    public room: string;

    constructor(controller: StructureController) {

        super(controller.id);

        this.controller = controller;
        this.room = controller.room.name;

        // Only do a container for cluster hub rooms
        if (gameState.rooms[this.room].clusterHub) {
            this.checkContainer();
        }

    }

    public checkContainer() {

        let containerPending: boolean = false;

        if (this.container) {
            return;
        }

        const surroundings: LocationDetails[] = Map.lookAround(this.controller.pos, 3);

        for (const s of surroundings) {
            for (const l of s.results) {
                switch (l.type) {
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
            const bestPos: RoomPosition | undefined = Map.findClosestConstructionPos(gameState.clusters[this.room].origin!, surroundings)

            if (bestPos) {
                // We found a 'best' location
                Game.rooms[this.room].createConstructionSite(bestPos.x, bestPos.y, STRUCTURE_CONTAINER)
            }

        }
    }

}
