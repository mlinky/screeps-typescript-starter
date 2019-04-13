import { MyRoom } from "./room";

export class MyCluster {
    clusterName: string;
    rooms: { [roomName: string]: MyRoom };

    constructor(roomName: string) {
        // Init cluster state
        this.clusterName = roomName;
        this.rooms = {};

        // Add the cluster hub
        this.rooms[roomName] = new MyRoom(roomName, true);

    };

    // Initialise cluster state
    public initState(): void {
        // For each cluster
        //   gather spawns
        //   gather links
        //   gather towers
        //   gather extensions
        //   gather labs
        //   gather
        //   gather
        //   gather

        // For each room
        //   gather source information
        //   gather containers
        //   gather assigned miners
        //   gather contruction sites

    };

}
