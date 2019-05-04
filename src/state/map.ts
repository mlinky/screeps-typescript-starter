import { log } from "log/log";
import { gameState } from "defs";

export abstract class map {

    static lookAround(pos: RoomPosition, range: number = 1): locationDetails[] {

        //let result: { [position: number]: LookAtResult<LookConstant>[] } = {};
        let result: locationDetails[] = [];
        let resultCount: number = 0;

        for (let y = pos.y - range; y <= pos.y + range; y++) {
            for (let x = pos.x - range; x <= pos.x + range; x++) {
                let lookPos: RoomPosition = new RoomPosition(x, y, pos.roomName);
                result.push(new locationDetails(x, y, pos.roomName, lookPos.look()));
            }
        }

        return result;
    }

    static findClosestConstructionPos(origin: RoomPosition, locs: locationDetails[], range: number = 1): RoomPosition | undefined {
        let best: PathFinderPath | null = null;
        let bestPos: RoomPosition;

        for (let s of locs) {
            let searchHere: boolean = true;

            for (let l of s.results) {
                switch (l.type) {
                    case LOOK_STRUCTURES: {
                        searchHere = false;
                        break;
                    }
                    case LOOK_TERRAIN: {
                        if (l.terrain == 'wall') {
                            searchHere = false;
                            break;
                        }
                    }
                }
                if (!searchHere) { break; };
            }

            if (!searchHere) { continue; };

            let lookPos: RoomPosition = new RoomPosition(s.x, s.y, s.room);

            let p: PathFinderPath = PathFinder.search(lookPos, { pos: origin, range: range });

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

export class locationDetails {
    x: number = 0;
    y: number = 0;
    room: string = '';
    results: LookAtResult<LookConstant>[] = [];

    constructor(x: number, y: number, room: string, results: LookAtResult<LookConstant>[]) {
        this.x = x;
        this.y = y;
        this.room = room;
        this.results = results;
    }
}
