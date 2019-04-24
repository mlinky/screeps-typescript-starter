import { profile } from '../profiler/decorator';

export enum RequestPriority {
    low,
    medium,
    high,
    urgent
}

@profile
export class CreepRequest {

    spawnRoom: string;
    workRoom: string;
    creepRole: string;
    priority: RequestPriority;

    constructor(spawnRoom: string, workRoom: string, creepRole: string, priority: RequestPriority) {
        this.spawnRoom = spawnRoom;
        this.workRoom = workRoom;
        this.creepRole = creepRole;
        this.priority = priority;
    }

    public actionRequest(s: StructureSpawn): boolean {

        // Check spawn is valid
        if (_.isUndefined(s)) {
            return false;
        }

        let f = this.creepFeatures(s.room);

        let n = this.creepRole + Game.time;

        switch (s.spawnCreep(f, n, { memory: { role: this.creepRole, homeRoom: this.spawnRoom, workRoom: this.workRoom } })) {
            case OK:
                return true;
            case ERR_NOT_OWNER:
                console.log('Failed to spawn ' + this.creepRole + ' - ERR_NOT_OWNER')
                return false;
            case ERR_NAME_EXISTS:
                console.log('Failed to spawn creep ' + this.creepRole + ' - ERR_NAME_EXISTS')
                return false;
            case ERR_BUSY:
                console.log('Failed to spawn creep ' + this.creepRole + ' - ERR_BUSY')
                return false;
            case ERR_NOT_ENOUGH_ENERGY:
                console.log('Failed to spawn creep ' + this.creepRole + ' - ERR_NOT_ENOUGH_ENERGY')
                return false;
            case ERR_INVALID_ARGS:
                console.log('Failed to spawn creep ' + this.creepRole + ' - ERR_INVALID_ARGS')
                return false;
            case ERR_RCL_NOT_ENOUGH:
                console.log('Failed to spawn creep ' + this.creepRole + ' - ERR_RCL_NOT_ENOUGH')
                return false;
            default:
                return false;
        }

    }

    private creepFeatures(room: Room) {

        // WORK             100
        // MOVE             50
        // CARRY            50
        // ATTACK           80
        // RANGED_ATTACK    150
        // HEAL             200
        // TOUGH            10
        // CLAIM            600

        switch (this.creepRole) {
            case 'hauler':
                if (room.energyAvailable <= 400) {
                    return [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE]
                } else if (room.energyAvailable <= 450) {
                    return [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]
                } else if (room.energyAvailable <= 500) {
                    return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]
                } else if (room.energyAvailable <= 600) {
                    return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]
                } else {
                    return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]
                }
            case 'miner':
                if (room.energyAvailable <= 450) {
                    return [WORK, WORK, CARRY, MOVE];
                } else if (room.energyAvailable <= 550) {
                    return [WORK, WORK, WORK, CARRY, CARRY, MOVE];
                } else if (room.energyAvailable <= 650) {
                    return [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
                } else {
                    return [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
                }
            case 'worker':
            case 'upgrader':
            default:
                return [WORK, WORK, CARRY, MOVE];

        }

    }

}
