export const _REFRESH = {
    // Creeps
    drone: 100,
    upgrader: 100,
    worker: 100,
    transporter: 100,

    // Room objects
    droppedResource: 25,

    // Room planner
    roomPlanner: 100
};

export function checkRefresh(refreshInterval: number): boolean {
    return (Game.time % refreshInterval == 0)
}
