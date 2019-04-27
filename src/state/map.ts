import { log } from "log/log";

export abstract class map {

    static lookAround(pos: RoomPosition): { [position: number]: locationDetails } {

        //let result: { [position: number]: LookAtResult<LookConstant>[] } = {};
        let result: { [position: number]: locationDetails } = {};

        // Inspect each spot in turn
        // 0 1 2
        // 3   4
        // 5 6 7
        let posAdj = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

        for (let i = 0; i < 8; i++) {
            // log.info(`Inspecting x:${pos.x + posAdj[i][0]}, y:${pos.y + posAdj[i][1]}, room:${pos.roomName}`);
            let lookPos: RoomPosition = new RoomPosition(pos.x + posAdj[i][0], pos.y + posAdj[i][1], pos.roomName);
            result[i] = new locationDetails(pos.x + posAdj[i][0], pos.y + posAdj[i][1], pos.roomName, lookPos.look());
        }

        return result;
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
