import { profile } from '../profiler/decorator';

export { }

declare global {
    interface Creep {
        role: string;
        homeRoom: string;
        workRoom: string;
        source: Source | undefined;
        container: StructureContainer | undefined;
        collecting: boolean;
        repairing: boolean;
        harvestSource: Source | undefined;
        pickupSource: Resource | undefined;
        energySource: StructureContainer | StructureStorage | Tombstone | undefined;
        energyDestination: StructureStorage | StructureExtension | StructureSpawn | StructureTower | undefined;

        runRole(): void;
        selectEnergySource(includeSource: boolean): boolean;
        selectEnergyDestination(): boolean;
        collectEnergy(): void;
        deliverEnergy(): void;
        doUpgradeController(): void;
        doBuild(): void;
        resetDestination(): void;

    }
}

Creep.prototype.runRole = function (): void {

    switch (this.role) {
        case 'miner':
            creepMiner.runRole(this);
            break;
        case 'upgrader':
            creepUpgrader.runRole(this);
            break;
        case 'hauler':
            creepHauler.runRole(this);
            break;
        case 'builder':
            creepBuilder.runRole(this);
            break;
        default:
            break;
    }

};

Creep.prototype.selectEnergySource = function (includeSource: boolean): boolean {
    var energySource;

    this.resetDestination();

    // Check for dropped energy
    energySource = this.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: r => (r.amount > this.carryCapacity)
    });

    if (energySource != undefined) {
        // TODO - claim portion of dropped resource
        this.pickupSource = energySource;
        return true;
    }

    // Select a container that is totally full first
    energySource = this.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => ((s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE)
            && s.store[RESOURCE_ENERGY] >= s.storeCapacity * 0.8)
    });

    if (energySource != undefined && energySource instanceof StructureContainer || energySource instanceof StructureStorage || energySource instanceof Tombstone) {
        this.energySource = energySource;
        return true;
    }

    // See if there is a container with enough energy
    energySource = this.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => ((s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE)
            && s.store[RESOURCE_ENERGY] >= this.carryCapacity)
    });

    if (energySource != undefined && energySource instanceof StructureContainer || energySource instanceof StructureStorage || energySource instanceof Tombstone) {
        this.energySource = energySource;
        return true;
    }

    if (includeSource) {
        energySource = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

        if (energySource != undefined && energySource instanceof Source) {
            this.harvestSource = energySource;
            return true;
        }
    }
    return false;

};

Creep.prototype.selectEnergyDestination = function (): boolean {
    var structure;

    this.resetDestination();

    structure = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: (s) => ((s.structureType == STRUCTURE_SPAWN
            || s.structureType == STRUCTURE_EXTENSION)
            && s.energy < s.energyCapacity)
    });

    if (structure != undefined && (structure instanceof StructureExtension || structure instanceof StructureSpawn || structure instanceof StructureStorage || structure instanceof StructureTower)) {
        this.energyDestination = structure;
        return true;
    }

    structure = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_TOWER && (s.energy < (s.energyCapacity * 0.8)))
    });

    if (structure != undefined && (structure instanceof StructureExtension || structure instanceof StructureSpawn || structure instanceof StructureStorage || structure instanceof StructureTower)) {
        this.energyDestination = structure;
        return true;
    }

    return false;

};

Creep.prototype.collectEnergy = function (): void {

    if (this.pickupSource != undefined) {
        switch (this.pickup(this.pickupSource)) {
            case ERR_BUSY:
                // Just wait
                break;

            case ERR_NOT_IN_RANGE:
                this.moveTo(this.pickupSource);
                break;

            case ERR_NO_BODYPART:
                // this.suicide();
                break;

            default:
                this.resetDestination();
                break;

        }

        return;

    }

    if (this.harvestSource != undefined) {
        switch (this.harvest(this.harvestSource)) {
            case OK:
                if (_.sum(this.carry) == this.carryCapacity) {
                    this.resetDestination();
                    this.collecting = false;
                }
                break;

            case ERR_BUSY:
                // Just wait
                break;

            case ERR_NOT_IN_RANGE:
                this.moveTo(this.harvestSource);
                break;

            case ERR_NO_BODYPART:
            case ERR_NOT_OWNER:
            case ERR_NOT_FOUND:
            case ERR_NOT_ENOUGH_RESOURCES:
            case ERR_INVALID_TARGET:
            default:
                this.resetDestination();
                break;
        }

        return;

    }

    if (this.energySource != undefined) {
        var eReturn = this.withdraw(this.energySource, RESOURCE_ENERGY);
        switch (eReturn) {
            case ERR_FULL:
            case OK:
                this.resetDestination();

                if (_.sum(this.carry) == this.carryCapacity) {
                    this.collecting = false;
                }
                return;

            case ERR_NOT_IN_RANGE:
                // move towards it
                this.moveTo(this.energySource);
                return;

            default:
                this.resetDestination();
                return;
        }
    }

    // If we get here, something is wrong
    this.resetDestination();

};

Creep.prototype.deliverEnergy = function (): void {

    if (this.energyDestination != undefined) {
        var eReturn = this.transfer(this.energyDestination, RESOURCE_ENERGY);
        switch (eReturn) {
            case ERR_FULL:
                // Destination was full - try another destination on the next tick
                this.resetDestination();
                return;

            case OK:
                // Transfer success - reset destination
                this.resetDestination();

                // Start collecting if we have no energy left
                if (this.carry.energy == 0) {
                    this.collecting = true;
                }
                return;

            case ERR_NOT_IN_RANGE:
                // move towards it
                this.moveTo(this.energyDestination);
                return;

            case ERR_INVALID_TARGET:
                // Try a new target
                this.resetDestination();
                return;

            case ERR_BUSY:
                // Ignore
                this.resetDestination();
                return;

            default:
                // Do nothing
                console.log('Unhandled return from transfer function ' + eReturn);
                return;
        }
    }

    // If we get here, something is wrong
    this.resetDestination();

};

Creep.prototype.doUpgradeController = function (): void {

    if (this.room.controller != undefined) {
        switch (this.upgradeController(this.room.controller)) {
            case ERR_NOT_ENOUGH_RESOURCES:
                this.resetDestination();
                break;
            case ERR_NOT_OWNER:
            case ERR_BUSY:
            case ERR_RCL_NOT_ENOUGH:
            case OK:
                break;

            case ERR_INVALID_TARGET:
                this.resetDestination();
                break;

            case ERR_NOT_IN_RANGE:
                this.moveTo(this.room.controller);
                break;

            case ERR_NO_BODYPART:
                console.log('Creep suicide due to no work parts left');
                // this.suicide();
                break
        }
    }

};

Creep.prototype.doBuild = function (): void {

    if (this.room.constructionSites != undefined && this.room.constructionSites.length > 0) {
        switch (this.build(this.room.constructionSites[0])) {
            case OK:
                break;
            case ERR_NOT_OWNER:
            case ERR_BUSY:
            case ERR_NOT_ENOUGH_RESOURCES:
            case ERR_RCL_NOT_ENOUGH:
            case ERR_INVALID_TARGET:
                this.resetDestination();
                break;

            case ERR_NOT_IN_RANGE:
                this.moveTo(this.room.constructionSites[0]);
                break;

            case ERR_NO_BODYPART:
                console.log('Creep suicide due to no work parts left');
                // this.suicide();
                break
        }
    }

};

Creep.prototype.resetDestination = function (): void {

    this.energySource = undefined;
    this.energyDestination = undefined;
    this.pickupSource = undefined;
    this.harvestSource = undefined;
    this.collecting = false;

};

Object.defineProperty(Creep.prototype, 'role', {
    get: function () {
        // If we dont have the value stored locally
        if (!this._role) {
            // Get the role from memory and store locally
            this._role = this.memory.role;
        }
        return this._role;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Creep.prototype, 'homeRoom', {
    get: function () {
        // If we dont have the value stored locally
        if (!this._homeRoom) {
            // Get the room from memory and store locally
            this._homeRoom = this.memory.homeRoom;
        }
        return this._homeRoom;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Creep.prototype, 'workRoom', {
    get: function () {
        // If we dont have the value stored locally
        if (!this._workRoom) {
            // Get the room from memory and store locally
            this._workRoom = this.memory.workRoom;
        }
        return this._workRoom;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Creep.prototype, 'source', {
    get: function (): Source | undefined {
        // If we dont have the value stored locally
        if (!this._source) {
            // Get the source from memory and store locally
            this._source = Game.getObjectById(this.memory.source);
        }

        return this._source;
    },

    set: function (source: Source | undefined) {
        // Set the memory pointer
        if (source == undefined) {
            this.memory.source = 0;
        } else {
            this.memory.source = source.id;
        }

        // Set the object in memory
        this._source = source;

    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Creep.prototype, 'container', {
    get: function (): StructureContainer | undefined {
        // If we dont have the value stored locally
        if (!this._container) {
            // Get the container from memory and store locally
            this._container = Game.getObjectById(this.memory.container);
        }

        return this._container;

    },

    set: function (container: StructureContainer | undefined) {
        // Set the memory pointer
        if (container == undefined) {
            this.memory.container = 0;
        } else {
            this.memory.container = container.id;
        }

        // Set the object in memory
        this._source = container;

    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Creep.prototype, 'collecting', {
    get: function (): boolean {
        // If we dont have the value stored locally
        if (!this._collecting) {
            // Get the value from memory and store locally
            this._collecting = this.memory.collecting;
        }
        return this._collecting;
    },

    set: function (collecting: boolean): void {
        this._collecting = collecting;
        this.memory.collecting = collecting;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Creep.prototype, 'repairing', {
    get: function (): boolean {
        // If we dont have the value stored locally
        if (!this._repairing) {
            // Get the value from memory and store locally
            this._repairing = this.memory.repairing;
        }
        return this._repairing;
    },

    set: function (repairing: boolean): void {
        this._repairing = repairing;
        this.memory.repairing = repairing;
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Creep.prototype, 'pickupSource', {
    get: function (): Resource | undefined {
        // If we dont have the value stored locally
        if (!this._pickupSource) {
            // Get the value from memory and store locally
            this._pickupSource = Game.getObjectById(this.memory.pickupSource);
        }
        return this._pickupSource;
    },

    set: function (pickupSource: Resource | undefined): void {
        this._pickupSource = pickupSource;
        if (pickupSource == undefined) {
            this.memory.pickupSource = 0;
        } else {
            this.memory.pickupSource = pickupSource.id;
        }
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Creep.prototype, 'harvestSource', {
    get: function (): Source | undefined {
        // If we dont have the value stored locally
        if (!this._harvestSource) {
            // Get the value from memory and store locally
            this._harvestSource = Game.getObjectById(this.memory.harvestSource);
        }
        return this._harvestSource;
    },

    set: function (harvestSource: Source | undefined): void {
        this._harvestSource = harvestSource;
        if (harvestSource == undefined) {
            this.memory.harvestSource = 0;
        } else {
            this.memory.harvestSource = harvestSource.id;
        }
    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Creep.prototype, 'energySource', {
    get: function (): StructureContainer | StructureStorage | Tombstone | undefined {
        // If we dont have the value stored locally
        if (!this._energySource) {
            // Get the source from memory and store locally
            this._energySource = Game.getObjectById(this.memory.energySource);
        }

        return this._energySource;
    },

    set: function (source: StructureContainer | StructureStorage | Tombstone | undefined) {
        // Set the memory pointer
        if (source == undefined) {
            this.memory.energySource = 0;
        } else {
            this.memory.energySource = source.id;
        }

        this._energySource = source;

    },

    enumerable: false,
    configurable: true

});

Object.defineProperty(Creep.prototype, 'energyDestination', {
    get: function (): StructureExtension | StructureSpawn | StructureTower | undefined {
        // If we dont have the value stored locally
        if (!this._energyDestination) {
            // Get the source from memory and store locally
            this._energyDestination = Game.getObjectById(this.memory.energyDestination);
        }

        return this._energyDestination;
    },

    set: function (destination: StructureExtension | StructureSpawn | StructureTower | undefined) {
        // Set the memory pointer
        if (destination == undefined) {
            this.memory.energyDestination = 0;
        } else {
            this.memory.energyDestination = destination.id;
        }

        this._eenergyDestination = destination;

    },

    enumerable: false,
    configurable: true

});


@profile
abstract class creepMiner {

    public static runRole(creep: Creep) {

        // Check the miner has a source defined
        if (creep.source == undefined) {
            // Loop sources looking for an unclaimed source
            for (let source of creep.room.sources) {
                if (!source.isClaimed()) {
                    // Source is not yet claimed
                    source.claim(creep);
                    creep.collecting = true;
                    creep.source = source;
                    break;
                }
            }
        }

        // Check we now have a source
        if (creep.source == undefined) {
            // Still no source - wait until next loop
            console.log('Idle miner ' + creep.name + ' in room ' + creep.room.name);
            return;
        }

        if (creep.collecting) {
            // Try and collect more energy
            switch (creep.harvest(creep.source)) {
                case OK:
                    break;
                case ERR_NOT_OWNER:
                    creep.source = undefined;
                    break;
                case ERR_BUSY:
                    break;
                case ERR_NOT_FOUND:
                    console.log('Extractor not found');
                    break;
                case ERR_NOT_ENOUGH_RESOURCES:
                    break;
                case ERR_INVALID_TARGET:
                    creep.source = undefined;
                    break;
                case ERR_NOT_IN_RANGE:
                    creep.moveTo(creep.source);
                    break;
                case ERR_NO_BODYPART:
                    // creep.suicide();
                    break;

                default:
                    console.log('Unhandled harvest return');
                    break;

            }

            if (creep.carry.energy == creep.carryCapacity) {
                creep.collecting = false;
                creep.repairing = false;
            }



        }

        if (!creep.collecting) {
            // Check we have a container
            if (creep.container == undefined) {
                if (this.setContainer(creep) == false) {
                    return;
                }
            }

            if (creep.container == undefined) {
                return;
            }

            // Repair container, if required
            if (creep.container.hits < (creep.container.hitsMax * 0.8)) {
                creep.repairing = true;
            }

            if (creep.repairing) {
                switch (creep.repair(creep.container)) {
                    case OK:
                    case ERR_BUSY:
                        break;
                    case ERR_INVALID_TARGET:
                    case ERR_NOT_OWNER:
                    case ERR_NOT_ENOUGH_RESOURCES:
                        creep.repairing = false;
                        break;
                    case ERR_NOT_IN_RANGE:
                        // shouldn't happen as the container should already be in range
                        creep.container = undefined;
                        creep.repairing = false;
                        break;
                    case ERR_NO_BODYPART:
                        // creep.suicide;
                        break;

                    default:
                        console.log('Unhandled repair return');
                        break;

                }

            } else {
                if (creep.container != undefined) {
                    // fill container
                    creep.transfer(creep.container, RESOURCE_ENERGY);
                }
            }

            if (creep.carry.energy == 0) {
                creep.collecting = true;
                creep.repairing = false;
            }

        }

    }

    private static setContainer(creep: Creep): boolean {

        // Find a nearby container
        let container: any = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_CONTAINER
        });

        // Set the container
        if (container instanceof StructureContainer && this.isNearby(creep, container.pos)) {
            creep.container = container;
            return true;
        }

        // Try to find a container under construction
        let constructionSite: any = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
            filter: (s) => s.structureType == STRUCTURE_CONTAINER
        });

        // Check that the construction site is close enough
        if (constructionSite != null && this.isNearby(creep, constructionSite.pos)) {
            creep.build(constructionSite);
            return false;
        }

        // We need to place a new construction site
        creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);

        return false;

    }

    private static isNearby(creep: Creep, pos: RoomPosition): boolean {

        var result = PathFinder.search(creep.pos, pos);

        if (result == undefined) {
            // No results
            return false;
        } else if (result.path.length <= 1) {
            // Only one step
            return true;
        } else {
            // More than one step
            return false;
        }
    }
}

@profile
abstract class creepUpgrader {

    public static runRole(creep: Creep) {

        if (creep.carry.energy == 0 && creep.collecting == false) {
            // Not carrying energy, change to collecting
            if (creep.selectEnergySource(true)) {
                // Go ahead and collect
                creep.collecting = true;
            } else {
                // Skip for this tick
                return;
            }
        }

        if (creep.collecting) {

            creep.collectEnergy();

        } else {

            creep.doUpgradeController();

            creep.collecting = false;
        }
    }
}

@profile
abstract class creepHauler {

    public static runRole(creep: Creep) {

        if (creep.carry.energy == 0 && creep.collecting == false) {
            // Not carrying energy, change to collecting
            if (creep.selectEnergySource(false)) {
                // Go ahead and collect
                creep.collecting = true;
            } else {
                // Skip for this tick
                return;
            }
        }

        if (creep.collecting) {

            creep.collectEnergy();

        } else {

            if (creep.energyDestination == undefined) {
                creep.selectEnergyDestination();
            }

            creep.deliverEnergy();

        }
    }
}

@profile
abstract class creepBuilder {

    public static runRole(creep: Creep) {

        if (creep.carry.energy == 0 && creep.collecting == false) {
            // Not carrying energy, change to collecting
            if (creep.selectEnergySource(true)) {
                // Go ahead and collect
                creep.collecting = true;
            } else {
                // Skip for this tick
                return;
            }
        }

        if (creep.collecting) {

            creep.collectEnergy();

        } else {

            creep.doBuild();

            creep.collecting = false;
        }

    }
}
