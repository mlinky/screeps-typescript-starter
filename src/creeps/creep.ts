import { Tasks } from 'creep-tasks/Tasks';
import { gameState } from 'defs';
import { log } from 'log/log';
import { profile } from "profiler/decorator";
import { Debug } from 'settings';
import { MyCluster } from 'state/cluster';
import { MyContructionSite } from 'state/constructionSite';
import { MyRoom } from 'state/room';
import '../prototypes/creep.prototype';

@profile
export abstract class Creeps {

    public static check() {
        // Check room
        for (const c in gameState.creeps) {
            gameState.creeps[c].check();
        }
    }

    public static run() {
        // Run creep
        for (const c in gameState.creeps) {
            gameState.creeps[c].run();
        }
    }

    public static tidy() {
        for (const c in gameState.creeps) {
            if (!(c in Game.creeps)) {
                // Creep is dead - remove from collection
                gameState.deleteCreep(c);
            }
        }
    }
}

@profile
export class MyCreep {
    public name: string;
    public role: string;
    public homeRoom: string;
    public workRoom: string;

    constructor(creep: Creep) {
        this.name = creep.name;
        this.role = creep.role;
        this.homeRoom = creep.homeRoom;
        this.workRoom = creep.workRoom;
    }

    get creep() {
        return Game.creeps[this.name];
    }

    public check() {
        log.debug('creep.check not implemented');
    }

    public run() {

        log.info(`Base creep running for ${this.role} creep ${this.name}`);

    }

    public required(cluster: MyCluster) {
        log.debug('base creep required call not implemented');
    }

    private pickupDroppedEnergy(myRoom: MyRoom, anySize: boolean = false): boolean {
        const room: Room = Game.rooms[myRoom.roomName];
        let bestResource: Resource | undefined;
        let minCost: number = 999;
        let cost: number = 999;

        for (const r of room.droppedResource) {
            if (r.resourceType === RESOURCE_ENERGY) {
                if (!resourceAvailable(r, this)) { continue; }

                // Find cost of path
                cost = PathFinder.search(Game.creeps[this.name].pos, r.pos).cost;

                // Check to see if we have a closer option
                if (cost < minCost) {
                    bestResource = r;
                    minCost = cost;
                }
            }
        }

        if (bestResource) {
            log.debug(`Creep ${this.name} collecting from resource at pos ${bestResource.pos.roomName},${bestResource.pos.x},${bestResource.pos.y}`, Debug.energyPickup)
            this.creep.task = Tasks.pickup(bestResource);
            return true;
        }

        return false;

        function resourceAvailable(r: Resource, creep: MyCreep): boolean {
            let quantity: number = r.amount;

            for (const c of r.targetedBy) {
                quantity -= c.carryCapacity - _.sum(c.carry);
            }

            if (anySize) {
                return (quantity > 0);
            } else {
                return (quantity >= (Game.creeps[creep.name].carryCapacity - _.sum(Game.creeps[creep.name].carry)));
            }
        }
    }

    private pickupFromMiningContainer(myRoom: MyRoom, anySize: boolean = false): boolean {
        let bestContainer: StructureContainer | undefined;
        let minCost: number = 999;
        let cost: number = 999;

        for (const s of Object.values(myRoom.sources)) {

            if (s.container) {
                const c: StructureContainer = Game.getObjectById(s.container.id) as StructureContainer
                if (!c) {
                    // Container no longer valid - remove it
                    delete gameState.rooms[myRoom.roomName].sources[s.id];

                } else {
                    if (!resourceAvailable(c, this)) { continue; }

                    // Find cost of path
                    cost = PathFinder.search(Game.creeps[this.name].pos, c.pos).cost;

                    // Check to see if we have a closer option
                    if (cost < minCost) {
                        bestContainer = c;
                        minCost = cost;
                    }
                }
            }
        }

        if (bestContainer) {
            log.debug(`Creep ${this.name} collecting from container at pos ${bestContainer.pos.roomName},${bestContainer.pos.x},${bestContainer.pos.y}`, Debug.energyPickup)
            this.creep.task = Tasks.withdraw(bestContainer, RESOURCE_ENERGY);
            return true;
        }

        return false;

        function resourceAvailable(container: StructureContainer, creep: MyCreep): boolean {
            let quantity: number = container.store.energy;

            for (const c of container.targetedBy) {
                quantity -= (c.carryCapacity - _.sum(c.carry));
            }

            if (anySize) {
                return (quantity > 0);
            } else {
                return (quantity >= (Game.creeps[creep.name].carryCapacity - _.sum(Game.creeps[creep.name].carry)));
            }
        }
    }


    public energyPickup(room: string) {

        if (!gameState.rooms[room] || !Game.rooms[room]) {
            // Got no visibility to the room in this tick - just head there
            this.creep.task = Tasks.goToRoom(room);
            return;
        }

        // Grab any large patches of dropped resource
        if (!this.creep.task) {

            if (this.pickupDroppedEnergy(gameState.rooms[room])) {
                return;
            }

            if (this.pickupFromMiningContainer(gameState.rooms[room])) {
                return;
            }

            if (this.pickupDroppedEnergy(gameState.rooms[room], true)) {
                return;
            }

            if (this.pickupFromMiningContainer(gameState.rooms[room], true)) {
                return;
            }
        }

        log.debug(`Creep ${this.name} failed to find energy to collect in room ${room}`, Debug.energyPickup)

        return;
    }

    public findConstructionSite(room: MyRoom): ConstructionSite | undefined {

        // Prioritise construction sites first
        const extensionSites = _.filter(gameState.rooms[this.workRoom].constructionSites, (c) => c.type === STRUCTURE_EXTENSION);
        for (const i of extensionSites) {
            const site = actionSite(this, i);

            if (site) {
                return site;
            }
        }

        const otherSites = _.filter(gameState.rooms[this.workRoom].constructionSites, (c) => c.type !== STRUCTURE_EXTENSION);
        for (const i of otherSites) {
            const site = actionSite(this, i);

            if (site) {
                return site;
            }
        }
        return;

        function actionSite(creep: MyCreep, site: MyContructionSite): ConstructionSite | undefined {
            const o = Game.getObjectById(site.id) as ConstructionSite;

            if (o) {
                // Object is valid
                return o;
            } else {
                // Construction complete
                gameState.rooms[creep.workRoom].constructionComplete(site);
            }

            // Delete the construction site object and decrement the count
            delete gameState.rooms[creep.workRoom].constructionSites[site.id];

            return;

        }
    }

    public findEnergyDestination(room: MyRoom): StructureExtension | StructureSpawn | StructureStorage | StructureTower | StructureContainer | undefined {

        const c: MyCluster = gameState.clusters[room.roomName];

        if (c) {
            // Spawns first
            for (const spawn of Object.values(c.spawns)) {
                // Check energy content
                if (Game.spawns[spawn.name] && (Game.spawns[spawn.name].energy < Game.spawns[spawn.name].energyCapacity)) {
                    return Game.spawns[spawn.name];
                }
            }

            // Extensions next
            for (const e of Object.values(c.extensions)) {
                const ex: StructureExtension | null = Game.getObjectById(e.id);

                if (ex && (ex.energy < ex.energyCapacity)) {
                    return ex;
                }
            }

            // Towers if RCL > 3
            if (room.controller && room.controller.level() >= 3) {
                for (const t of Object.values(c.towers)) {
                    const tower: StructureTower | null = Game.getObjectById(t.id);

                    if (tower && (tower.energy < tower.energyCapacity)) {
                        return tower;
                    }
                }
            }

            // Storage?
            const s: StructureStorage | undefined = Game.rooms[room.roomName].storage;

            if (s) {
                log.debug(`Creep ${this.name} filling storage`, Debug.creep);
                if (_.sum(s.store) < s.storeCapacity) {
                    return s;
                }
            }

            // Controller container?
            // Top it up if there's under 500
            if (room.controller && room.controller.container) {
                const container: StructureContainer | null = Game.getObjectById(room.controller.container.id);

                if (container && _.sum(container.store) < (container.storeCapacity - 500)) {
                    return container;
                }
            }
        }
        return;
    }

    public findManagerDestination(room: MyRoom): StructureExtension | StructureSpawn | StructureTower | undefined {

        const c: MyCluster = gameState.clusters[room.roomName];

        // Spawns first
        for (const spawn of Object.values(c.spawns)) {
            // Check energy content
            if (Game.spawns[spawn.name] && (Game.spawns[spawn.name].energy < Game.spawns[spawn.name].energyCapacity)) {
                return Game.spawns[spawn.name];
            }
        }

        // Extensions next
        for (const e of Object.values(c.extensions)) {
            const ex: StructureExtension | null = Game.getObjectById(e.id);

            if (ex && (ex.energy < ex.energyCapacity)) {
                return ex;
            }
        }

        // Towers if RCL > 3
        if (room.controller && room.controller.level() >= 3) {
            for (const t of Object.values(c.towers)) {
                const tower: StructureTower | null = Game.getObjectById(t.id);

                if (tower && (tower.energy < tower.energyCapacity)) {
                    return tower;
                }
            }
        }

        return;
    }

}
