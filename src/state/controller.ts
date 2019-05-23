import { gameState } from "defs";
import { profile } from "profiler/decorator";
import { MyDefault } from "./default";
import { LocationDetails, Map } from "./map";

@profile
export class MyController extends MyDefault {
    public controller: StructureController;
    public container?: StructureContainer;
    public room: string;
    public pos: RoomPosition;
    private updateTick: number;

    constructor(controller: StructureController) {

        super(controller.id);

        this.controller = controller;
        this.room = controller.room.name;
        this.pos = controller.pos;
        this.updateTick = Game.time;

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

        const surroundings: LocationDetails[] = Map.lookAround(this.controller.pos, 2);

        for (const s of surroundings) {
            for (const l of s.results) {
                switch (l.type) {
                    case LOOK_STRUCTURES: {
                        // Have we found the container?
                        if (l.structure && l.structure.structureType === STRUCTURE_CONTAINER) {
                            this.container = l.structure as StructureContainer;
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

    public update() {
        if (this.updateTick < Game.time) {
            this.controller = Game.getObjectById(this.id) as StructureController;
        }
    }

    public level(): number {

        this.update();

        return this.controller.level;

    }

}
