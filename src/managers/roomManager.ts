// import '../prototypes/room.prototype';
// import '../prototypes/source.prototype';
// import { log } from '../log/log'
// import { profile } from '../profiler/decorator';

// const _DEBUG_ROOMS: boolean = false;

// @profile
// export abstract class roomManager {

//     public static run(): void {

//         for (const i in Game.rooms) {
//             const room: Room = Game.rooms[i];

//             // In case room is undefined
//             if (room == undefined) {
//                 continue;
//             }

//             // Debug rooms
//             log.debug(`Processing room ${room.name}`, _DEBUG_ROOMS);

//             this.checkUpgraders(room);
//             this.checkHaulers(room);
//             this.checkConstruction(room);
//             this.checkSources(room);
//             this.handleTowers(room);
//             this.handleVisuals(room);

//         }

//         for (const i in Game.rooms) {
//             const room: Room = Game.rooms[i];

//             room.spawnCreep();

//         }

//     }

//     private static checkSources(room: Room): void {

//         const sources: Source[] = room.sources;

//         for (const j in sources) {

//             const source: Source = sources[j];

//             // Is the source claimed
//             if (!source.isClaimed()) {
//                 // The source doesn't have an assigned miner
//                 room.requestCreep(room.name, 'miner');
//             }
//         }
//     }

//     private static checkUpgraders(room: Room): void {

//         if (room.hasSpawns) {
//             // Decide on number of upgraders
//             if (room.upgradersRequired > room.upgradersAvailable) {
//                 room.requestCreep(room.name, 'upgrader');
//             }
//         }
//     }

//     private static checkHaulers(room: Room): void {

//         // Decide on number of upgraders
//         if (room.haulersRequired > room.haulersAvailable) {
//             room.requestCreep(room.name, 'hauler');
//         }
//     }

//     private static checkConstruction(room: Room) {

//         // Are there construction sites in the room
//         if (room.constructionSites.length > 0) {
//             // There are construction sites in the room
//             if (room.buildersAvailable < 2) {
//                 room.requestCreep(room.name, 'builder');
//             }
//         }
//     }

//     private static handleTowers(room: Room) {

//         if (room.towers.length > 0) {
//             for (let tower of room.towers) {
//                 let closestHostile: Creep | null = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

//                 if (closestHostile != undefined) {
//                     tower.attack(closestHostile);

//                 } else {
//                     let closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
//                         filter: (structure) => structure.hits < structure.hitsMax * 0.8
//                     });

//                     if (closestDamagedStructure) {
//                         tower.repair(closestDamagedStructure);
//                     }

//                 }
//             }
//         }
//     }

//     private static handleVisuals(room: Room) {
//         let visRow: number = 0;
//         let visCol: number = 0;

//         placeText(`Sources:    ${room.sources.length}`);
//         placeText(`Miners:     ${room.minersAvailable}`);
//         placeText(`Upgraders:  ${room.upgradersAvailable}`);
//         placeText(`Haulers:    ${room.haulersAvailable}`);
//         placeText(`Builders:   ${room.buildersAvailable}`);

//         return;

//         function placeText(text: string) {
//             room.visual.text(text, visCol, ++visRow, { align: "left" });
//         };

//     }
// }

