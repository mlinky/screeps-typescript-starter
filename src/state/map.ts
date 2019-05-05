import { gameState } from "defs";
import { log } from "log/log";

export abstract class Map {

    public static lookAround(pos: RoomPosition, range: number = 1): LocationDetails[] {

        // let result: { [position: number]: LookAtResult<LookConstant>[] } = {};
        const result: LocationDetails[] = [];
        const resultCount: number = 0;

        for (let y = pos.y - range; y <= pos.y + range; y++) {
            for (let x = pos.x - range; x <= pos.x + range; x++) {
                const lookPos: RoomPosition = new RoomPosition(x, y, pos.roomName);
                result.push(new LocationDetails(x, y, pos.roomName, lookPos.look()));
            }
        }

        return result;
    }

    public static findClosestConstructionPos(origin: RoomPosition, locs: LocationDetails[], range: number = 1): RoomPosition | undefined {
        let best: PathFinderPath | null = null;
        let bestPos: RoomPosition;

        for (const s of locs) {
            let searchHere: boolean = true;

            for (const l of s.results) {
                switch (l.type) {
                    case LOOK_STRUCTURES: {
                        searchHere = false;
                        break;
                    }
                    case LOOK_TERRAIN: {
                        if (l.terrain === 'wall') {
                            searchHere = false;
                            break;
                        }
                    }
                }
                if (!searchHere) { break; };
            }

            if (!searchHere) { continue; };

            const lookPos: RoomPosition = new RoomPosition(s.x, s.y, s.room);

            const p: PathFinderPath = PathFinder.search(lookPos, { pos: origin, range });

            if (!best || best.cost > p.cost) {
                best = p;
                bestPos = lookPos;
            }
        }

        if (best) {
            return bestPos!;
        } else {
            return;
        }
    }

}

export class LocationDetails {
    public x: number = 0;
    public y: number = 0;
    public room: string = '';
    public results: Array<LookAtResult<LookConstant>> = [];

    constructor(x: number, y: number, room: string, results: Array<LookAtResult<LookConstant>>) {
        this.x = x;
        this.y = y;
        this.room = room;
        this.results = results;
    }
}
