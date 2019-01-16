"use strict";
/**
 * Created by user on 2019/1/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const log_1 = require("../../lib/log");
const cross_spawn_1 = require("../../lib/util/cross-spawn");
/**
 * use for some git cmd
 */
function crossSpawnSyncGit(bin, args, options) {
    let print;
    if (options) {
        if (options.stdio == 'inherit') {
            print = true;
            delete options.stdio;
        }
    }
    let cp = __1.crossSpawnSync(bin, args, options);
    print && log_1.default.log(__1.crossSpawnOutput(cp.output));
    if (cp.stderr && cp.stderr.length) {
        let s1 = String(cp.stderr);
        let s2 = cross_spawn_1.stripAnsi(s1);
        if (/^fatal\:/m.test(s2)) {
            let e = new Error(s1);
            cp.error = cp.error || e;
            // @ts-ignore
            cp.errorCrossSpawn = e;
            throw e;
        }
        log_1.default.info(`cp.stderr`);
        log_1.default.warn(s1);
    }
    return cp;
}
exports.crossSpawnSyncGit = crossSpawnSyncGit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3Mtc3Bhd24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcm9zcy1zcGF3bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsNkJBQTZGO0FBQzdGLHVDQUFvQztBQUNwQyw0REFBdUQ7QUFFdkQ7O0dBRUc7QUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxHQUFXLEVBQUUsSUFBYyxFQUFFLE9BQTBCO0lBRXhGLElBQUksS0FBYyxDQUFDO0lBRW5CLElBQUksT0FBTyxFQUNYO1FBQ0MsSUFBSSxPQUFPLENBQUMsS0FBSyxJQUFJLFNBQVMsRUFDOUI7WUFDQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2IsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFBO1NBQ3BCO0tBQ0Q7SUFFRCxJQUFJLEVBQUUsR0FBRyxrQkFBYyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFNUMsS0FBSyxJQUFJLGFBQU8sQ0FBQyxHQUFHLENBQUMsb0JBQWdCLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFbEQsSUFBSSxFQUFFLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUNqQztRQUNDLElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsSUFBSSxFQUFFLEdBQUcsdUJBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUV2QixJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQ3hCO1lBQ0MsSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFdEIsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztZQUN6QixhQUFhO1lBQ2IsRUFBRSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7WUFFdkIsTUFBTSxDQUFDLENBQUE7U0FDUDtRQUVELGFBQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFMUIsYUFBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNqQjtJQUVELE9BQU8sRUFBRSxDQUFDO0FBQ1gsQ0FBQztBQXZDRCw4Q0F1Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE5LzEvMTYvMDE2LlxuICovXG5cbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jLCBTcGF3blN5bmNSZXR1cm5zLCBTcGF3blN5bmNPcHRpb25zLCBjcm9zc1NwYXduT3V0cHV0IH0gZnJvbSAnLi4vLi4nO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vLi4vbGliL2xvZyc7XG5pbXBvcnQgeyBzdHJpcEFuc2kgfSBmcm9tICcuLi8uLi9saWIvdXRpbC9jcm9zcy1zcGF3bic7XG5cbi8qKlxuICogdXNlIGZvciBzb21lIGdpdCBjbWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyb3NzU3Bhd25TeW5jR2l0KGJpbjogc3RyaW5nLCBhcmdzOiBzdHJpbmdbXSwgb3B0aW9ucz86IFNwYXduU3luY09wdGlvbnMpXG57XG5cdGxldCBwcmludDogYm9vbGVhbjtcblxuXHRpZiAob3B0aW9ucylcblx0e1xuXHRcdGlmIChvcHRpb25zLnN0ZGlvID09ICdpbmhlcml0Jylcblx0XHR7XG5cdFx0XHRwcmludCA9IHRydWU7XG5cdFx0XHRkZWxldGUgb3B0aW9ucy5zdGRpb1xuXHRcdH1cblx0fVxuXG5cdGxldCBjcCA9IGNyb3NzU3Bhd25TeW5jKGJpbiwgYXJncywgb3B0aW9ucyk7XG5cblx0cHJpbnQgJiYgY29uc29sZS5sb2coY3Jvc3NTcGF3bk91dHB1dChjcC5vdXRwdXQpKTtcblxuXHRpZiAoY3Auc3RkZXJyICYmIGNwLnN0ZGVyci5sZW5ndGgpXG5cdHtcblx0XHRsZXQgczEgPSBTdHJpbmcoY3Auc3RkZXJyKTtcblx0XHRsZXQgczIgPSBzdHJpcEFuc2koczEpO1xuXG5cdFx0aWYgKC9eZmF0YWxcXDovbS50ZXN0KHMyKSlcblx0XHR7XG5cdFx0XHRsZXQgZSA9IG5ldyBFcnJvcihzMSk7XG5cblx0XHRcdGNwLmVycm9yID0gY3AuZXJyb3IgfHwgZTtcblx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdGNwLmVycm9yQ3Jvc3NTcGF3biA9IGU7XG5cblx0XHRcdHRocm93IGVcblx0XHR9XG5cblx0XHRjb25zb2xlLmluZm8oYGNwLnN0ZGVycmApO1xuXG5cdFx0Y29uc29sZS53YXJuKHMxKTtcblx0fVxuXG5cdHJldHVybiBjcDtcbn1cbiJdfQ==