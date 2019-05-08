import { gameState } from 'defs';
import { log } from 'log/log';
import { profile } from '../profiler/decorator';
import { CreepSetup } from './creepSetup';
import { Roles, Setups } from './setups';

const _DEBUG_SPAWN: boolean = false;

export const RequestPriority = {
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9'
}

@profile
export class CreepRequest {

    public spawnRoom: string;
    public workRoom: string;
    public creepRole: string;
    public priority: string;

    constructor(spawnRoom: string, workRoom: string, creepRole: string, priority: string) {
        this.spawnRoom = spawnRoom;
        this.workRoom = workRoom;
        this.creepRole = creepRole;
        this.priority = priority;
    }

    public actionRequest(s: StructureSpawn): { result: boolean, creepName: string } {

        return this.spawnRequest(s);

    }

    public testRequest(s: StructureSpawn): boolean {

        const testReturn: { result: boolean, creepName: string } = this.spawnRequest(s, true)

        return testReturn.result;

    }

    private spawnRequest(s: StructureSpawn, dryRun: boolean = false): { result: boolean, creepName: string } {

        // Check spawn is valid
        if (_.isUndefined(s)) {
            return { result: false, creepName: '' };
        }

        const f = this.creepFeatures(s.room);

        const n = this.creepRole + Game.time;

        const e: ScreepsReturnCode = s.spawnCreep(f, n, { memory: { role: this.creepRole, homeRoom: this.spawnRoom, workRoom: this.workRoom }, dryRun });

        if (e === OK) {
            return { result: true, creepName: n };
        } else {
            this.spawnError(e, f);
            return { result: false, creepName: '' };
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
            case Roles.transporter:
                // Don't wait for spawn to get filled if we have no transporters in a cluster room
                if (this.spawnRoom === this.workRoom) {
                    const creeps = _.filter(gameState.creeps, c => c.role === this.creepRole && c.workRoom === this.workRoom && c.homeRoom === this.workRoom);
                    if (creeps.length === 0) {
                        e = room.energyAvailable;
                    }
                }

                s = Setups.transporters.default;
                break;

            case Roles.drone:
                s = Setups.drones.miners.default;
                break;

            case Roles.worker:
                s = Setups.workers.default;
                break;

            case Roles.upgrader:
                s = Setups.upgraders.default;
                break;

            case Roles.claim:
                s = Setups.infestors.reserve;
                break;

            default:
                throw new Error(`Method not implemented ${this.creepRole}`);

        }

        return s.generateBody(e);

    }

}
