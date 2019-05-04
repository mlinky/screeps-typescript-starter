import { Roles, Setups } from './setups';
import { profile } from '../profiler/decorator';
import { CreepSetup } from './creepSetup';
import { gameState } from 'defs';
import { log } from 'log/log';

const _DEBUG_SPAWN: boolean = false;

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

        let e: ScreepsReturnCode = s.spawnCreep(f, n, { memory: { role: this.creepRole, homeRoom: this.spawnRoom, workRoom: this.workRoom } });

        if (e == OK) {
            return true;
        } else {
            this.spawnError(e, f);
            return false;
        }
    }

    private spawnError(e: ScreepsReturnCode, f: BodyPartConstant[]) {

        switch (e) {
            case OK:
                return;
            case ERR_NOT_OWNER:
                log.debug(`Failed to spawn ${this.creepRole} - ERR_NOT_OWNER`)
                break;
            case ERR_NAME_EXISTS:
                log.debug(`Failed to spawn creep ${this.creepRole} - ERR_NAME_EXISTS`)
                break;
            case ERR_BUSY:
                log.debug(`Failed to spawn creep ${this.creepRole} - ERR_BUSY`)
                break;
            case ERR_NOT_ENOUGH_ENERGY:
                log.debug(`Failed to spawn creep ${this.creepRole} - ERR_NOT_ENOUGH_ENERGY`)
                break;
            case ERR_INVALID_ARGS:
                log.debug(`Failed to spawn creep ${this.creepRole} - ERR_INVALID_ARGS`)
                break;
            case ERR_RCL_NOT_ENOUGH:
                log.debug(`Failed to spawn creep ${this.creepRole} - ERR_RCL_NOT_ENOUGH`)
                break;
            default:
                break;
        }

        log.debug(`Body parts ${f}`, _DEBUG_SPAWN);

        return;

    }

    private creepFeatures(room: Room): BodyPartConstant[] {

        // WORK             100
        // MOVE             50
        // CARRY            50
        // ATTACK           80
        // RANGED_ATTACK    150
        // HEAL             200
        // TOUGH            10
        // CLAIM            600
        let s: CreepSetup;
        let e: number = room.energyCapacityAvailable;

        switch (this.creepRole) {
            case 'hauler':
                if (gameState.clusters[this.spawnRoom].creepsAvailable['hauler'] == 0) {
                    e = room.energyAvailable;
                }
                s = Setups.transporters.default;
                break;

            case 'miner':
                s = Setups.drones.miners.default;
                break;

            case 'worker':
                s = Setups.workers.default;
                break;

            case 'upgrader':
                s = Setups.upgraders.default;
                break;

            default:
                throw new Error("Method not implemented.");

        }

        return s.generateBody(e);

    }


}
