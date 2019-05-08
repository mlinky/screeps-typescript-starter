import { Tasks } from 'creep-tasks/Tasks';
import { gameState } from 'defs';
import { log } from 'log/log';
import { profile } from "profiler/decorator";
import { MyCluster } from 'state/cluster';
import { MyRoom } from 'state/room';
import '../prototypes/creep.prototype';

const _DEBUG_CREEP: boolean = false;

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

    private findDroppedEnergy(myRoom: MyRoom): Resource | undefined {
        const room: Room = Game.rooms[myRoom.roomName];

        for (const r of room.droppedResource) {
            if (r.resourceType === RESOURCE_ENERGY && r.amount >= this.creep.carryCapacity) {
                return r;
            }
        }

        return;

    }

    public energyPickup(room: string) {

        if (!gameState.rooms[room] || !Game.rooms[room]) {
            // Got no visibility to the room in this tick - just head there
            this.creep.task = Tasks.goToRoom(room);
            return;
        }

        const r: Resource | undefined = this.findDroppedEnergy(gameState.rooms[room]);

        if (r && r.amount > 0) {
            this.creep.task = Tasks.pickup(r);
            return;
        }

        let fullestContainer: StructureContainer | undefined;
        for (const s of Object.values(gameState.rooms[room].sources)) {

            if (s.container) {
                const c: StructureContainer = Game.getObjectById(s.container.id) as StructureContainer
                if (c.store.energy > 0) {
                    // Try and target a container that has content available
                    // log.info(`Container targetted by ${c.targetedBy.length} creeps`);
                    if (!fullestContainer || fullestContainer.store.energy - (fullestContainer.targetedBy.length * 500) < c.store.energy - (c.targetedBy.length * 500)) {
                        fullestContainer = c;
                    }
                }
            }
        }

        if (fullestContainer) {
            this.creep.task = Tasks.withdraw(fullestContainer, RESOURCE_ENERGY);
        }

        return;

    }

    public findConstructionSite(room: MyRoom): ConstructionSite | undefined {

        for (const i in gameState.rooms[this.workRoom].constructionSites) {
            const o = Game.getObjectById(i) as ConstructionSite;

            if (o) {
                // Object is valid
                return o;
            } else {
                // Construction complete
                gameState.rooms[this.workRoom].constructionComplete(i);
            }

            // Delete the construction site object and decrement the count
            delete gameState.rooms[this.workRoom].constructionSites[i];

        }
        return;
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
            if (room.controller && room.controller.controller.level >= 3) {
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
                log.debug(`Creep ${this.name} filling storage`, _DEBUG_CREEP);
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
}
