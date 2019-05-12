import { Tasks } from "creep-tasks/Tasks";
import { gameState } from "defs";
import { log } from "log/log";
import { profile } from "profiler/decorator";
import { Debug } from "settings";
import { MyCluster } from "state/cluster";
import { MyCreep } from "./creep";
import { FlagType } from "./setups";

@profile
export class CreepClaimer extends MyCreep {
    public onController: boolean = false;
    public gotReserveTask: boolean = false;
    public flagName: string = '';

    constructor(creep: Creep) {
        super(creep);
    }

    public run() {
        let runTask: boolean = true;

        if (this.flagName === '') {
            log.debug(`Claimer ${this.name} trying to find flag`, Debug.claimer);
            const flag = _.find(gameState.flags, f => f.room === this.workRoom && f.cluster === this.homeRoom && f.flagType === FlagType.remote);

            if (flag) {
                log.debug(`Claimer ${this.name} new flag ${flag.name}`, Debug.claimer);
                this.flagName = flag.name;
            }
        }

        // log.info('Claimer running');
        log.debug(`Claimer running for creep ${this.name}`, Debug.claimer);

        if (!this.creep.task) {

            log.debug(`Claimer ${this.name} getting a task`, Debug.claimer);
            if (Game.rooms[this.workRoom] && Game.rooms[this.workRoom].controller) {
                log.debug(`Claimer ${this.name} getting a task - failed visibility`, Debug.claimer);
                this.creep.task = Tasks.reserve(Game.rooms[this.workRoom].controller!);
                this.gotReserveTask = true;
            } else {
                log.debug(`Claimer ${this.name} getting a task - succeeded visibility`, Debug.claimer);
                if (this.flagName !== '' && Game.flags[this.flagName]) {
                    this.creep.task = Tasks.goTo(Game.flags[this.flagName].pos);
                } else {
                    log.debug(`Claimer ${this.name} cannot run task, flag name ${this.flagName}`, Debug.claimer);
                    runTask = false;
                }
            }
        }

        // Update to target the controller?
        if (this.creep.task && !this.gotReserveTask) {
            // Still travelling towards the controller - let's see if we can see it yet
            if (Game.rooms[this.workRoom] && Game.rooms[this.workRoom].controller) {
                log.debug(`Claimer ${this.name} updating task - got visibility`, Debug.claimer);
                this.creep.task = Tasks.reserve(Game.rooms[this.workRoom].controller!);
                this.gotReserveTask = true;
            }
        }

        if (runTask) {
            this.creep.run();
        }

    }
}
