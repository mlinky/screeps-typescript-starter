import { profile } from '../profiler/decorator';

export enum LogLevels {
    ERROR,		// log.level = 0
    WARNING,	// log.level = 1
    ALERT,		// log.level = 2
    INFO,		// log.level = 3
    DEBUG		// log.level = 4
}

/**
 * Default debug level for log output
 */
export const LOG_LEVEL: number = LogLevels.INFO;

@profile
export class Log {

    public get level(): number {
        return Memory.settings.log.level;
    }

    public setLogLevel(value: number) {
        let changeValue = true;
        switch (value) {
            case LogLevels.ERROR:
                console.log(`Logging level set to ${value}. Displaying: ERROR.`);
                break;
            case LogLevels.WARNING:
                console.log(`Logging level set to ${value}. Displaying: ERROR, WARNING.`);
                break;
            case LogLevels.ALERT:
                console.log(`Logging level set to ${value}. Displaying: ERROR, WARNING, ALERT.`);
                break;
            case LogLevels.INFO:
                console.log(`Logging level set to ${value}. Displaying: ERROR, WARNING, ALERT, INFO.`);
                break;
            case LogLevels.DEBUG:
                console.log(`Logging level set to ${value}. Displaying: ERROR, WARNING, ALERT, INFO, DEBUG.`);
                break;
            default:
                console.log(`Invalid input: ${value}. Loging level can be set to integers between `
                    + LogLevels.ERROR + ' and ' + LogLevels.DEBUG + ', inclusive.');
                changeValue = false;
                break;
        }
        if (changeValue) {
            Memory.settings.log.level = value;
        }
    }

    constructor() {
        _.defaultsDeep(Memory, {
            settings: {
                log: {
                    level: LOG_LEVEL
                }
            }
        });
    }

    public error(message: string): undefined {
        if (this.level >= LogLevels.ERROR) {
            console.log(message);
        }
        return undefined;
    }

    public warning(message: string): undefined {
        if (this.level >= LogLevels.WARNING) {
            console.log(message);
        }
        return undefined;
    }

    public alert(message: string): undefined {
        if (this.level >= LogLevels.ALERT) {
            console.log(message);
        }
        return undefined;
    }

    public notify(message: string): undefined {
        this.alert(message);
        Game.notify(message);
        return undefined;
    }

    public info(message: string): undefined {
        if (this.level >= LogLevels.INFO) {
            console.log(message);
        }
        return undefined;
    }

    public debug(message: string, overrideDebug: boolean = false): undefined {
        if (overrideDebug || this.level >= LogLevels.DEBUG) {
            console.log(message);
        }
        return undefined;
    }
};

export const log = new Log();
