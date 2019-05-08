import { USE_PROFILER } from '../settings';
import profiler from './screeps-profiler';

// export {profile} from './profiler';

// tslint:disable-next-line:ban-types
export function profile(target: Function): void;
// tslint:disable-next-line:ban-types
export function profile(target: object, key: string | symbol, _descriptor: TypedPropertyDescriptor<Function>): void;
// tslint:disable-next-line:ban-types
export function profile(target: object | Function, key?: string | symbol,
	// tslint:disable-next-line:ban-types
	_descriptor?: TypedPropertyDescriptor<Function>, ): void {
	if (!USE_PROFILER) {
		return;
	}

	if (key) {
		// case of method decorator
		// tslint:disable-next-line:ban-types
		profiler.registerFN(target as Function, key as string);
		return;
	}

	// case of class decorator
	const ctor = target as any;
	if (!ctor.prototype) {
		return;
	}

	const className = ctor.name;
	// tslint:disable-next-line:ban-types
	profiler.registerClass(target as Function, className);

}
