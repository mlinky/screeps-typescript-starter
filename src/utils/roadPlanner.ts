import { gameState } from "defs";
import { log } from "log/log";
import { Debug } from "settings";
import { MyRoom } from "state/room";
import { RoomPlanner } from "./roomPlanner";

export abstract class RoadPlanner {

    public static planRoads(room: MyRoom) {

        log.debug(`Planning roads for ${room.roomName}`, Debug.roadplanner);

        gameState.buildFlag = false;

        // Roads from spawn to sources
        if (gameState.clusters[room.clusterName] && gameState.clusters[room.clusterName].origin) {
            fromPosToSources(gameState.clusters[room.clusterName].origin!);
        }

        if (gameState.buildFlag) {
            // Something was built or in the process of being built - don't do the next section
            return;
        }

        if (room.clusterHub && gameState.clusters[room.roomName] && gameState.clusters[room.roomName].origin) {
            // This is a cluster hub room
            // Need to plan
            // spawn to sources
            // spawn to controller
            // Sources to controller

            if (room.controller) {

                // Roads from Controller to sources
                if (gameState.buildCount < 10) {
                    for (const s of Object.values(room.sources)) {

                        if (s.container) {
                            const path: PathFinderPath = PathFinder.search(room.controller.pos, s.container.pos)

                            for (const p of path.path) {

                                if (gameState.buildCount > 10) {
                                    break;
                                }

                                if ((0 < p.x) && (p.x < 49) && (0 < p.y) && (p.y < 49)) {
                                    RoomPlanner.checkAndBuild(Game.rooms[room.roomName], p.x, p.y, STRUCTURE_ROAD);
                                }
                            }
                        }
                    }
                }

                if (gameState.buildFlag) {
                    // Something was built or in the process of being built - don't do the next section
                    return;
                }

                // Roads from spawn to controller
                if (gameState.buildCount < 10 && room.controller.container) {
                    const path: PathFinderPath = PathFinder.search(gameState.clusters[room.roomName].origin!, room.controller.container.pos)

                    for (const p of path.path) {

                        if (gameState.buildCount > 10) {
                            break;
                        }

                        if ((0 < p.x) && (p.x < 49) && (0 < p.y) && (p.y < 49)) {
                            RoomPlanner.checkAndBuild(Game.rooms[room.roomName], p.x, p.y, STRUCTURE_ROAD);
                        }
                    }
                }

            }
        } else {
            if (gameState.clusters[room.clusterName]) {
                fromPosToSources(gameState.clusters[room.clusterName].origin!);
            }
        }

        return;

        function fromPosToSources(pos: RoomPosition) {
            for (const s of Object.values(room.sources)) {
                if (s.container) {
                    const path: PathFinderPath = PathFinder.search(pos, s.container.pos)

                    for (const p of path.path) {

                        if (gameState.buildCount > 10) {
                            break;
                        }

                        if ((0 < p.x) && (p.x < 49) && (0 < p.y) && (p.y < 49)) {
                            RoomPlanner.checkAndBuild(Game.rooms[p.roomName], p.x, p.y, STRUCTURE_ROAD);
                        }
                    }
                }
            }
        }

    }
}
