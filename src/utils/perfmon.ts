import { profile } from "profiler/decorator";

@profile
export class Perfmon {
    private startCPU: number;
    private endCPU: number;

    constructor() {
        this.startCPU = 0;
        this.endCPU = 0;
    }

    public start(): void {
        this.startCPU = Game.cpu.getUsed();
        this.endCPU = 0;
    }

    public stop(): void {
        this.endCPU = Game.cpu.getUsed();
    }

    public getUsed(): number {

        if (this.startCPU < this.endCPU) {
            return this.endCPU - this.startCPU;
        } else {
            return 0;
        }
    }
}
