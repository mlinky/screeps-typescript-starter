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
            result[i].x = pos.x + posAdj[i][1];
            result[i].y = pos.y + posAdj[i][2];
            result[i].room = pos.roomName;
            result[i].results = RoomPosition(pos.x + posAdj[i][1], pos.y + posAdj[i][2], pos.roomName).look();
        }

        return result;
    }

}

export class locationDetails {
    x: number = 0;
    y: number = 0;
    room: string = '';
    results: LookAtResult<LookConstant>[] = [];
}
