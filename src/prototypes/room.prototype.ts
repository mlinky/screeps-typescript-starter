import { profile } from '../profiler/decorator';

export { }

declare global {
    interface Room {
        sources: Source[];
        constructionSites: ConstructionSite[];
        spawns: StructureSpawn[];
        towers: StructureTower[];
        availableSpawn: StructureSpawn;
        creepsNeeded: CreepRequest[];
        minersAvailable: number;
        upgradersAvailable: number;
        upgradersRequired: number;
        haulersAvailable: number;
        haulersRequired: number;
        buildersAvailable: number;
        hasSpawns(): boolean;
        canSpawn(): boolean;
        trySpawn(creepRole: string): boolean;
        requestCreep(requestRoom: string, requestRole: string): void;
        spawnCreep(): void;
    }

}

Object.defineProperty(Room.prototype, 'constructionSites', {
    get: function () {
        // If we dont have the value stored locally
        // TODO - cache construction sites
        if (!this._constructionSites) {
            // Get the construction sites and store them locally
            this._constructionSites = this.find(FIND_CONSTRUCTION_SITES);
        }
        return this._constructionSites;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Room.prototype, 'sources', {
    get: function () {
        // If we dont have the value stored locally
        // TODO - cache sources
        if (!this._sources) {
            // Get the sources objects from the id's in memory and store them locally
            this._sources = this.find(FIND_SOURCES);
        }
        return this._sources;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Room.prototype, 'spawns', {
    get: function (): StructureSpawn[] | null {
        // If we dont have the value stored locally
        // TODO - cache spawns
        if (!this._spawns) {
            // Get the spawns objects from the id's in memory and store them locally
            this._spawns = this.find(FIND_MY_SPAWNS);
        }
        return this._spawns;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Room.prototype, 'towers', {
    get: function (): StructureSpawn[] | null {
        // If we dont have the value stored locally
        // TODO - cache towers
        if (!this._towers) {
            // Get the towers and store them locally
            this._towers = this.find(FIND_STRUCTURES, { filter: (s: Structure) => s.structureType == STRUCTURE_TOWER });
        }
        return this._towers;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Room.prototype, 'availableSpawn', {
    get: function (): StructureSpawn | undefined {
        for (let spawn of this.spawns) {
            if (!spawn.spawning) {
                return spawn;
            }
        }
        return;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Room.prototype, 'minersAvailable', {
    get: function (): number {
        // If we dont have the value stored locally
        if (!this._minersAvailable) {
            // Loop through creeps finding miners for this room
            // TODO - cache this value
            let creepList = _.filter(Game.creeps, (creep) => creep.role == 'miner' && creep.workRoom == this.name);

            this._minersAvailable = creepList.length;
        }
        return this._minersAvailable;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Room.prototype, 'upgradersAvailable', {
    get: function (): number {
        // If we dont have the value stored locally
        if (!this._upgradersAvailable) {
            // Loop through creeps finding upgraders for this room
            // TODO - cache this value
            let creepList = _.filter(Game.creeps, (creep) => creep.role == 'upgrader' && creep.workRoom == this.name);

            this._upgradersAvailable = creepList.length;
        }
        return this._upgradersAvailable;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Room.prototype, 'upgradersRequired', {
    get: function (): number {
        // If we dont have the value stored locally
        if (!this._upgradersRequired) {
            // Check resources and scale upgraders according to what's available
            // TODO - only update this value once per so many ticks?
            this._upgradersRequired = 4;
        }
        return this._upgradersRequired;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Room.prototype, 'haulersAvailable', {
    get: function (): number {
        // If we dont have the value stored locally
        if (!this._haulersAvailable) {
            // Loop through creeps finding upgraders for this room
            // TODO - cache this value
            let creepList = _.filter(Game.creeps, (creep) => creep.role == 'hauler' && creep.workRoom == this.name);

            this._haulersAvailable = creepList.length;
        }
        return this._haulersAvailable;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Room.prototype, 'haulersRequired', {
    get: function (): number {
        // If we dont have the value stored locally
        if (!this._haulersRequired) {
            // Check resources and scale haulers according to what's required
            // TODO - only update this value once per so many ticks?
            this._haulersRequired = 1;
        }
        return this._haulersRequired;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Room.prototype, 'buildersAvailable', {
    get: function (): number {
        // If we dont have the value stored locally
        if (!this._buildersAvailable) {
            // Loop through creeps finding builders for this room
            // TODO - cache this value
            let creepList = _.filter(Game.creeps, (creep) => creep.role == 'builder' && creep.workRoom == this.name);

            this._buildersAvailable = creepList.length;
        }
        return this._buildersAvailable;
    },

    enumerable: false,
    configurable: true

});

Room.prototype.requestCreep = function (requestRoom: string, requestRole: string): void {

    if (_.isUndefined(this.creepsNeeded)) {
        this.creepsNeeded = [];
    }

    this.creepsNeeded.push(new CreepRequest(requestRoom, requestRole));

};

Room.prototype.hasSpawns = function (): boolean {

    return this.spawns == null ? false : true;

};

Room.prototype.canSpawn = function (): boolean {

    if (this.energyAvailable < 300) {
        return false;
    }

    for (let spawn of this.spawns) {
        if (!spawn.spawning) {
            return true;
        }
    }

    return false;

};

Room.prototype.spawnCreep = function (): void {

    if (!this.canSpawn()) {
        return;
    }

    if (this.trySpawn('miner')) { return; }
    if (this.trySpawn('hauler')) { return; }
    if (this.trySpawn('builder')) { return; }
    if (this.trySpawn('upgrader')) { return; }

};

Room.prototype.trySpawn = function (role: string): boolean {

    let r: CreepRequest | undefined = _.find(this.creepsNeeded, function (o: CreepRequest) { return o.creepRole === role; });
    if (r != null) {
        return r.actionRequest(this);
    }

    return false;

};

/////
@profile
class CreepRequest {

    roomName: string;
    creepRole: string;

    constructor(roomName: string, creepRole: string) {

        this.roomName = roomName;
        this.creepRole = creepRole;
    }

    actionRequest(room: Room): boolean {
        // Get the spawn object
        let s: StructureSpawn = room.availableSpawn;

        // Check spawn is valid
        if (_.isUndefined(s)) {
            return false;
        }

        let f = this.creepFeatures(room);

        let n = this.creepRole + Game.time;

        switch (s.spawnCreep(f, n, { memory: { role: this.creepRole, homeRoom: room.name, workRoom: this.roomName } })) {
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

    creepFeatures(room: Room) {

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
