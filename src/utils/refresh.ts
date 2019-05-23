export const _REFRESH = {
    // Creeps
    drone: 1,
    manager: 1,
    transporter: 1,
    upgrader: 1,
    worker: 1,

    // Room objects
    droppedResource: 1,

    // Room planner
    flags: 1,
    roadPlanner: 100,
    roomAverages: 500,
    roomPlanner: 100,
};

export function checkRefresh(refreshInterval: number): boolean {
    return (Game.time % refreshInterval === 0)
}
