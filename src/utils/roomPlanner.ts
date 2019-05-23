import { gameState } from "defs";
import { log } from "log/log";
import { MyCluster } from "state/cluster";

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
            // tslint:disable-next-line:object-literal-sort-keys
            'extension': { 'pos': [{ x: -1, y: -1 }, { x: -1, y: -2 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -3, y: -1 }] },
            'container': { 'pos': [{ x: 0, y: -1 }] }
        }

    },
    3: {
        'rcl': '3',
        'structs': {
            'spawn': { 'pos': [{ x: 0, y: 0 }] },
            // tslint:disable-next-line:object-literal-sort-keys
            'extension': {
                'pos': [{ x: -1, y: -1 }, { x: -1, y: -2 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -3, y: -1 }, { x: -2, y: -2 }, { x: -2, y: -3 }, { x: -4, y: -2 }, { x: -4, y: -3 }, { x: -3, y: -4 }]
            },
            'container': { 'pos': [{ x: 0, y: -1 }] },
            'tower': { 'pos': [{ x: 1, y: 0 }] }
        }
    },
    4: {
        'rcl': '4',
        'structs': {
            'spawn': { 'pos': [{ x: 0, y: 0 }] },
            'storage': { 'pos': [{ x: 2, y: 0 }] },
            // tslint:disable-next-line:object-literal-sort-keys
            'extension': {
                'pos': [{ x: -1, y: -1 }, { x: -1, y: -2 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -3, y: -1 }, { x: -2, y: -2 }, { x: -2, y: -3 }, { x: -4, y: -2 }, { x: -4, y: -3 }, { x: -3, y: -4 },
                { x: -3, y: -5 }, { x: -2, y: -5 }, { x: -1, y: -3 }, { x: -1, y: -4 }, { x: -1, y: -6 }, { x: 0, y: -6 }, { x: 0, y: -4 }, { x: 0, y: -3 }, { x: 1, y: -3 }, { x: 1, y: -5 }]
            },
            'container': { 'pos': [{ x: 0, y: -1 }] },
            'tower': { 'pos': [{ x: 1, y: 0 }] },
            'road': { 'pos': [{ x: -1, y: 0 }, { x: -2, y: -1 }, { x: -3, y: -2 }, { x: -2, y: 1 }, { x: -3, y: 2 }, { x: -4, y: -1 }, { x: -4, y: 0 }, { x: -4, y: 1 }, { x: -3, y: -3 }, { x: -2, y: -4 }, { x: -1, y: -5 }, { x: 0, y: -5 }, { x: 1, y: -4 }, { x: 2, y: -3 }, { x: 1, y: -2 }, { x: 0, y: -1 }, { x: 0, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 4 }, { x: 0, y: 5 }, { x: -1, y: 5 }, { x: -2, y: 4 }, { x: -3, y: 3 }, { x: 1, y: 1 }, { x: 1, y: -1 }, { x: 3, y: -1 }, { x: 4, y: -1 }, { x: 3, y: -2 }, { x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 4, y: 1 }, { x: 5, y: 0 }, { x: 3, y: -4 }, { x: 4, y: -5 }, { x: 5, y: -5 }, { x: 7, y: -3 }, { x: 6, y: -4 }, { x: 7, y: -2 }, { x: 6, y: -1 }, { x: 6, y: 1 }, { x: 7, y: 1 }] }
        }
    }
}


export abstract class RoomPlanner {

    public static planRoom(cluster: MyCluster) {

        let rcl: number;
        const room: Room = Game.rooms[cluster.clusterName];

        if (!cluster.origin) {
            log.error('RoomPlanner called without cluster origin set up');
            return;
        }

        // Check for a controller
        if (room && room.controller) {
            rcl = room.controller.level;
        } else {
            return;
        }

        for (const s in layout[rcl].structs) {
            for (const p of layout[rcl].structs[s].pos) {

                // Exit if we already have 80 construction sites
                if (gameState.buildCount > 10) {
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
                    case 'road': {
                        RoomPlanner.checkPos(room, cluster, p, STRUCTURE_ROAD);
                        break;
                    }
                    case 'storage': {
                        RoomPlanner.checkPos(room, cluster, p, STRUCTURE_STORAGE);
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
        const checkX: number = cluster.origin!.x + coord.x;
        const checkY: number = cluster.origin!.y + coord.y;
        this.checkAndBuild(room, cluster.origin!.x + coord.x, cluster.origin!.y + coord.y, sType)
        return;
    }

    public static checkAndBuild(room: Room, x: number, y: number, sType: BuildableStructureConstant): void {
        // Look for structures at the location
        const r = room.lookForAt(LOOK_STRUCTURES, x, y);

        // Check the results
        for (const e of r) {
            if (e.structureType === sType) {
                // The correct structure is already there
                return;
            }
        }

        const c = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);

        for (const e of c) {
            if (e.structureType === sType) {
                // The correct structure is being built - set the build flag
                gameState.buildFlag = true;
                return;
            }
        }

        const pos: RoomPosition = new RoomPosition(x, y, room.name);

        const result = pos.createConstructionSite(sType);

        if (result !== OK) {
            log.error(`Failed to build ${sType} ${pos.roomName} ${pos.x} ${pos.y}: ${result}`);
            return;
        }

        // Increment the build count and set the build flag
        gameState.buildFlag = true;
        gameState.buildCount++
        return;
    }
}
