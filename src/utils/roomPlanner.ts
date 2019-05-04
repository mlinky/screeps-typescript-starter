import { MyCluster } from "state/cluster";
import { log } from "log/log";
import { gameState } from "defs";

// Copy of o4kapuk layout
interface Layout {
    rcl: string;
    structs: { [structureType: string]: { pos: Coord[] } };
}

const layout: { [rcl: number]: Layout } = {
    1: {
        'rcl': '1',
        'structs': {
            'spawn': { 'pos': [{ x: 0, y: 0 }] }
        }
    },
    2: {
        'rcl': '2',
        'structs': {
            'spawn': { 'pos': [{ x: 0, y: 0 }] },
            'extension': { 'pos': [{ x: -1, y: -1 }, { x: -1, y: -2 }, { x: -2, y: 0 }, { x: -1, y: 1 }, { x: -1, y: 2 }] },
            'container': { 'pos': [{ x: 0, y: -1 }] }
        }

    },
    3: {
        'rcl': '3',
        'structs': {
            'spawn': { 'pos': [{ x: 0, y: 0 }] },
            'extension': {
                'pos': [{ x: -1, y: -1 }, { x: -1, y: -2 }, { x: -2, y: 0 }, { x: -1, y: 1 }, { x: -1, y: 2 }, { x: -2, y: -2 }, { x: -3, y: -1 }, { x: -3, y: 0 }, { x: -3, y: 1 }, { x: -2, y: 2 }]
            },
            'container': { 'pos': [{ x: 0, y: -1 }] },
            'tower': { 'pos': [{ x: 1, y: 0 }] }
        }
    }
}

export abstract class RoomPlanner {

    public static planRoom(cluster: MyCluster) {

        let rcl: number;
        let room: Room = Game.rooms[cluster.clusterName];

        if (!cluster.origin) {
            log.error('RoomPlanner called without cluster origin set up');
            return;
        }

        if (room && room.controller) {
            rcl = room.controller.level;
        } else {
            return;
        }

        for (let s in layout[rcl].structs) {
            for (let p of layout[rcl].structs[s].pos) {

                // Exit if we already have 50 construction sites
                if (gameState.constructionSites > 50) {
                    return;
                }

                switch (s) {
                    case 'spawn': {
                        RoomPlanner.checkPos(room, cluster, p, STRUCTURE_SPAWN);
                        break;
                    }
                    case 'extension': {
                        RoomPlanner.checkPos(room, cluster, p, STRUCTURE_EXTENSION);
                        break;
                    }
                    case 'container': {
                        RoomPlanner.checkPos(room, cluster, p, STRUCTURE_CONTAINER);
                        break;
                    }
                    case 'tower': {
                        RoomPlanner.checkPos(room, cluster, p, STRUCTURE_TOWER);
                        break;
                    }
                    default: {
                        log.error(`${s} not handled in RoomPlanner`);
                        break;
                    }
                }


            }
        }
    }

    private static checkPos(room: Room, cluster: MyCluster, coord: Coord, sType: BuildableStructureConstant): void {
        // Look for structures at the location
        let checkX: number = cluster.origin!.x + coord.x;
        let checkY: number = cluster.origin!.y + coord.y;
        let r = room.lookForAt(LOOK_STRUCTURES, checkX, checkY);

        // Check the results
        for (let e of r) {
            if (e.structureType == sType) {
                // The correct structure is already there
                return;
            }
        }

        let c = room.lookForAt(LOOK_CONSTRUCTION_SITES, checkX, checkY);

        for (let e of c) {
            if (e.structureType == sType) {
                // The correct structure is being built
                return;
            }
        }

        let pos: RoomPosition = new RoomPosition(checkX, checkY, room.name);

        let result = pos.createConstructionSite(sType);

        if (result != OK) {
            log.error(`Failed to build${sType}: ${result}`);
            return;
        }

        gameState.constructionSites++

    }
}
