import { profile } from '../profiler/decorator';
import { GameState } from 'state/state';

@profile
export abstract class clusterManager {

    public static run(gameState: GameState): void {

        for (const c of Object.values(gameState.clusters)) {




        }

    }

}
