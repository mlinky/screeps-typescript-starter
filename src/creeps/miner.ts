import { gameState } from "defs";
import { MyCreep } from "creeps/creep";
import { MySource } from "state/source";
import { profile } from "profiler/decorator";
import { log } from "log/log";

@profile
export class CreepMiner extends MyCreep {

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {

        //log.info('Miner running');
        // Including tasks?


        // // Check the miner has a source defined
        // if (!this.source) {
        //     // Loop sources looking for an unclaimed source
        //     for (let s in gameState.clusters[this.homeRoom].rooms[this.homeRoom].sources) {
        //         let source: MySource = gameState.clusters[this.homeRoom].rooms[this.homeRoom].sources[s]

        //         if (source) {

        //         }

        //         // if (!source.isClaimed()) {
        //         //     // Source is not yet claimed
        //         //     source.claim(creep);
        //         //     creep.collecting = true;
        //         //     creep.source = source;
        //         //     break;
        //         // }
    }
}
