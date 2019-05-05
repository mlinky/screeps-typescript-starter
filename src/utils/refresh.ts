export const _REFRESH = {
    // Creeps
    drone: 100,
    transporter: 100,
    upgrader: 100,
    worker: 100,

    // Room objects
    droppedResource: 25,

    // Room planner
    flags: 100,
    roomPlanner: 100
};

export function checkRefresh(refreshInterval: number): boolean {
    return (Game.time % refreshInterval === 0)
}
