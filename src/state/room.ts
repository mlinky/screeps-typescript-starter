export class MyRoom {
    roomName: string;
    clusterHub: boolean;

    constructor(roomName: string, clusterHub: boolean = false) {
        this.roomName = roomName;
        this.clusterHub = clusterHub;
    }

}
