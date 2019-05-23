
export class ManagerPos {
    public pos: RoomPosition;
    public towers: string[] = [];
    public spawns: string[] = [];
    public extensions: string[] = [];

    constructor(x: number, y: number, room: Room) {
        // Set position
        this.pos = new RoomPosition(x, y, room.name);

        const surroundings = room.lookForAtArea(LOOK_STRUCTURES, y - 1, x - 1, y + 1, x + 1, true);

        for (const s of surroundings) {
            switch (s.structure.structureType) {
                case STRUCTURE_SPAWN: {
                    this.spawns.push(s.structure.id);
                    continue;
                }
                case STRUCTURE_TOWER: {
                    this.towers.push(s.structure.id);
                    continue;
                }
                case STRUCTURE_EXTENSION: {
                    this.extensions.push(s.structure.id);
                    continue;
                }
            }
        }
    }
}
