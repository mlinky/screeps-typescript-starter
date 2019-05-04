import '../prototypes/creep.prototype';
import { profile } from "profiler/decorator";
import { log } from 'log/log';
import { MyCluster } from 'state/cluster';
import { MyRoom } from 'state/room';
import { gameState } from 'defs';
import { Tasks } from 'creep-tasks/Tasks';
import { roomManager } from 'managers/roomManager';

@profile
export class MyCreep {
    name: string;
    role: string;
    homeRoom: string;
    workRoom: string;

    constructor(creep: Creep) {
        this.name = creep.name;
        this.role = creep.role;
        this.homeRoom = creep.homeRoom;
        this.workRoom = creep.workRoom;
    }

    get creep() {
        return Game.creeps[this.name];
    }

    check() {


    }

    run() {

        //log.info('Base creep running');

    }

    required(cluster: MyCluster) {

    }

    private findDroppedEnergy(room: MyRoom): Resource | undefined {

        for (let r of room.room.droppedResource) {
            if (r.resourceType == RESOURCE_ENERGY && r.amount >= this.creep.carryCapacity) {
                return r;
            }
        }

        return;

    }

    energyPickup() {

        let r: Resource | undefined = this.findDroppedEnergy(gameState.rooms[this.workRoom])

        if (r && r.amount > 0) {
            this.creep.task = Tasks.pickup(r);
            return;
        }

        let c: StructureContainer;

        for (let s of Object.values(gameState.rooms[this.workRoom].sources)) {

            if (s.container) {
                let c: StructureContainer = <StructureContainer>Game.getObjectById(s.container.id)
                if (c.store[RESOURCE_ENERGY] > 0) {
                    // Try and target a container that has content available
                    //log.info(`Container targetted by ${c.targetedBy.length} creeps`);
                    if (c.store[RESOURCE_ENERGY] - (c.targetedBy.length * 500) > 0) {
                        this.creep.task = Tasks.withdraw(s.container, RESOURCE_ENERGY);
                    }
                }
            }
        }
    }

    findConstructionSite(room: MyRoom): ConstructionSite | undefined {

        for (let i in gameState.rooms[this.workRoom].constructionSites) {
            let o = <ConstructionSite>Game.getObjectById(i);

            if (o) {
                // Object is valid
                return o;
            } else {
                // Construction complete
                gameState.rooms[this.workRoom].constructionComplete(i);
            }
        }
        return;
    }

    findEnergyDestination(room: MyRoom): StructureExtension | StructureSpawn | StructureStorage | StructureTower | StructureContainer | undefined {

        let c: MyCluster = gameState.clusters[room.roomName];

        if (c) {
            // Spawns first
            for (let s of Object.values(c.spawns)) {
                // Check energy content
                if (Game.spawns[s.name] && (Game.spawns[s.name].energy < Game.spawns[s.name].energyCapacity)) {
                    return Game.spawns[s.name];
                }
            }

            // Extensions next
            for (let e of Object.values(c.extensions)) {
                let ex: StructureExtension | null = Game.getObjectById(e.id);

                if (ex && (ex.energy < ex.energyCapacity)) {
                    return ex;
                }
            }

            // Towers if RCL > 3
            if (room.controller && room.controller.controller.level >= 3) {
                for (let t of Object.values(c.towers)) {
                    let tower: StructureTower | null = Game.getObjectById(t.id);

                    if (tower && (tower.energy < tower.energyCapacity)) {
                        return tower;
                    }
                }
            }

            // Controller container?
            // Top it up if there's under 500
            if (room.controller && room.controller.container) {
                let c: StructureContainer | null = Game.getObjectById(room.controller.container.id);

                if (c && _.sum(c.store) < (c.storeCapacity - 500)) {
                    return c;
                }
            }

            // Storage?
            let s: StructureStorage | undefined = Game.rooms[room.roomName].storage;

            if (s) {
                if (_.sum(s.store) < s.storeCapacity) {
                    return s;
                }
            }
        }
        return;
    }
}
