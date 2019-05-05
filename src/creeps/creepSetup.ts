import { profile } from '../profiler/decorator';

export interface BodySetup {
    pattern: BodyPartConstant[];			// body pattern to be repeated
    sizeLimit: number;						// maximum number of unit repetitions to make body
    prefix: BodyPartConstant[];				// stuff at beginning of body
    suffix: BodyPartConstant[];				// stuff at end of body
    proportionalPrefixSuffix: boolean;		// (?) prefix/suffix scale with body size
    ordered: boolean;						// (?) assemble as WORK WORK MOVE MOVE instead of WORK MOVE WORK MOVE
}

/* Return the cost of an entire array of body parts */
export function bodyCost(bodyparts: BodyPartConstant[]): number {
    return _.sum(bodyparts, part => BODYPART_COST[part]);
}

export function patternCost(setup: CreepSetup): number {
    return bodyCost(setup.bodySetup.pattern);
}

/**
 * The CreepSetup class contains methods for flexibly generating creep body arrays when needed for spawning
 */
@profile
export class CreepSetup {

    public role: string;
    public bodySetup: BodySetup;

    constructor(roleName: string, setup = {}) {
        this.role = roleName;
        // Defaults for a creep setup
        _.defaults(setup, {
            pattern: [],
            sizeLimit: Infinity,
            // tslint:disable-next-line:object-literal-sort-keys
            prefix: [],
            suffix: [],
            proportionalPrefixSuffix: false,
            ordered: true,
        });
        this.bodySetup = setup as BodySetup;
    }

	/* Generate the largest body of a given pattern that is producable from a room,
	 * subject to limitations from maxRepeats */
    public generateBody(availableEnergy: number): BodyPartConstant[] {
        // tslint:disable-next-line:no-shadowed-variable
        let patternCost:number;
        let patternLength:number;
        let numRepeats: number;
        const prefix = this.bodySetup.prefix;
        const suffix = this.bodySetup.suffix;
        let body: BodyPartConstant[] = [];
        // calculate repetitions
        if (this.bodySetup.proportionalPrefixSuffix) { // if prefix and suffix are to be kept proportional to body size
            patternCost = bodyCost(prefix) + bodyCost(this.bodySetup.pattern) + bodyCost(suffix);
            patternLength = prefix.length + this.bodySetup.pattern.length + suffix.length;
            const energyLimit = Math.floor(availableEnergy / patternCost); // max number of repeats room can produce
            const maxPartLimit = Math.floor(MAX_CREEP_SIZE / patternLength); // max repetitions resulting in <50 parts
            numRepeats = Math.min(energyLimit, maxPartLimit, this.bodySetup.sizeLimit);
        } else { // if prefix and suffix don't scale
            const extraCost = bodyCost(prefix) + bodyCost(suffix);
            patternCost = bodyCost(this.bodySetup.pattern);
            patternLength = this.bodySetup.pattern.length;
            const energyLimit = Math.floor((availableEnergy - extraCost) / patternCost);
            const maxPartLimit = Math.floor((MAX_CREEP_SIZE - prefix.length - suffix.length) / patternLength);
            numRepeats = Math.min(energyLimit, maxPartLimit, this.bodySetup.sizeLimit);
        }
        // build the body
        if (this.bodySetup.proportionalPrefixSuffix) { // add the prefix
            for (let i = 0; i < numRepeats; i++) {
                body = body.concat(prefix);
            }
        } else {
            body = body.concat(prefix);
        }

        if (this.bodySetup.ordered) { // repeated body pattern
            for (const part of this.bodySetup.pattern) {
                for (let i = 0; i < numRepeats; i++) {
                    body.push(part);
                }
            }
        } else {
            for (let i = 0; i < numRepeats; i++) {
                body = body.concat(this.bodySetup.pattern);
            }
        }

        if (this.bodySetup.proportionalPrefixSuffix) { // add the suffix
            for (let i = 0; i < numRepeats; i++) {
                body = body.concat(suffix);
            }
        } else {
            body = body.concat(suffix);
        }
        // return it
        return body;
    }

    public getBodyPotential(partType: BodyPartConstant, room: Room): number {
        const energyCapacity = room.energyCapacityAvailable;
        const body = this.generateBody(energyCapacity);
        return _.filter(body, (part: BodyPartConstant) => part === partType).length;
    }

}
