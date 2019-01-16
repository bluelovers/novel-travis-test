"use strict";
/**
 * Created by user on 2019/1/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const crlf_normalize_1 = require("crlf-normalize");
const cross_spawn_extra_1 = require("cross-spawn-extra");
exports.crossSpawnAsync = cross_spawn_extra_1.async;
const core_1 = require("cross-spawn-extra/core");
exports.stripAnsi = core_1.CrossSpawnExtra.stripAnsi;
function crossSpawnSync(...argv) {
    let cp = cross_spawn_extra_1.sync(...argv);
    delete cp.then;
    // @ts-ignore
    delete cp.catch;
    return cp;
}
exports.crossSpawnSync = crossSpawnSync;
function getCrossSpawnError(cp) {
    return cp.error
        // @ts-ignore
        || cp.errorCrossSpawn;
}
exports.getCrossSpawnError = getCrossSpawnError;
function crossSpawnOutput(buf, options = {
    clearEol: true,
}) {
    let output = '';
    if (Array.isArray(buf)) {
        output = buf
            .filter(function (b) {
            return !(!b || !b.length);
        })
            .map(function (b) {
            return b.toString();
        })
            .join("\n");
    }
    else {
        output = (buf || '').toString();
    }
    output = crlf_normalize_1.crlf(output);
    if (options.clearEol) {
        output = output.replace(/\n+$/g, '');
    }
    return output;
}
exports.crossSpawnOutput = crossSpawnOutput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3Mtc3Bhd24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcm9zcy1zcGF3bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsbURBQXNDO0FBQ3RDLHlEQUFzRjtBQUs3RSwwQkFMUyx5QkFBZSxDQUtUO0FBSnhCLGlEQUEwSztBQUU3SixRQUFBLFNBQVMsR0FBRyxzQkFBZSxDQUFDLFNBQVMsQ0FBQztBQUluRCxTQUFnQixjQUFjLENBQUMsR0FBRyxJQUF3QztJQUV6RSxJQUFJLEVBQUUsR0FBRyx3QkFBZSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFFbEMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDO0lBQ2YsYUFBYTtJQUNiLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQztJQUVoQixPQUFPLEVBQUUsQ0FBQztBQUNYLENBQUM7QUFURCx3Q0FTQztBQUlELFNBQWdCLGtCQUFrQixDQUE4QixFQUFXO0lBRTFFLE9BQU8sRUFBRSxDQUFDLEtBQUs7UUFDZCxhQUFhO1dBQ1YsRUFBRSxDQUFDLGVBQWUsQ0FDckI7QUFDRixDQUFDO0FBTkQsZ0RBTUM7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxHQUF3QyxFQUFFLFVBRXZFO0lBQ0gsUUFBUSxFQUFFLElBQUk7Q0FDZDtJQUVBLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUVoQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQ3RCO1FBQ0MsTUFBTSxHQUFHLEdBQUc7YUFDVixNQUFNLENBQUMsVUFBVSxDQUFDO1lBRWxCLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQzFCLENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQyxVQUFVLENBQUM7WUFFZixPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUM7YUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDWjtTQUVEO1FBQ0MsTUFBTSxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQ2hDO0lBRUQsTUFBTSxHQUFHLHFCQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFdEIsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUNwQjtRQUNDLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztLQUNyQztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2YsQ0FBQztBQWxDRCw0Q0FrQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE5LzEvMTYvMDE2LlxuICovXG5cbmltcG9ydCB7IGNybGYgfSBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5pbXBvcnQgeyBhc3luYyBhcyBjcm9zc1NwYXduQXN5bmMsIHN5bmMgYXMgX2Nyb3NzU3Bhd25TeW5jIH0gZnJvbSAnY3Jvc3Mtc3Bhd24tZXh0cmEnO1xuaW1wb3J0IHsgU3Bhd25BU3luY1JldHVybnMsIFNwYXduQVN5bmNSZXR1cm5zUHJvbWlzZSwgSVNwYXduQVN5bmNFcnJvciwgU3Bhd25TeW5jUmV0dXJucywgU3Bhd25PcHRpb25zLCBTcGF3blN5bmNPcHRpb25zLCBDcm9zc1NwYXduRXh0cmEgfSBmcm9tICdjcm9zcy1zcGF3bi1leHRyYS9jb3JlJztcblxuZXhwb3J0IGNvbnN0IHN0cmlwQW5zaSA9IENyb3NzU3Bhd25FeHRyYS5zdHJpcEFuc2k7XG5cbmV4cG9ydCB7IGNyb3NzU3Bhd25Bc3luYyB9XG5cbmV4cG9ydCBmdW5jdGlvbiBjcm9zc1NwYXduU3luYyguLi5hcmd2OiBQYXJhbWV0ZXJzPHR5cGVvZiBfY3Jvc3NTcGF3blN5bmM+KVxue1xuXHRsZXQgY3AgPSBfY3Jvc3NTcGF3blN5bmMoLi4uYXJndik7XG5cblx0ZGVsZXRlIGNwLnRoZW47XG5cdC8vIEB0cy1pZ25vcmVcblx0ZGVsZXRlIGNwLmNhdGNoO1xuXG5cdHJldHVybiBjcDtcbn1cblxuZXhwb3J0IHsgU3Bhd25BU3luY1JldHVybnMsIFNwYXduQVN5bmNSZXR1cm5zUHJvbWlzZSwgU3Bhd25TeW5jUmV0dXJucywgU3Bhd25PcHRpb25zLCBTcGF3blN5bmNPcHRpb25zLCBJU3Bhd25BU3luY0Vycm9yIH1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENyb3NzU3Bhd25FcnJvcjxUIGV4dGVuZHMgU3Bhd25BU3luY1JldHVybnM+KGNwOiBUIHwgYW55KTogSVNwYXduQVN5bmNFcnJvcjxUPlxue1xuXHRyZXR1cm4gY3AuZXJyb3Jcblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0fHwgY3AuZXJyb3JDcm9zc1NwYXduXG5cdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyb3NzU3Bhd25PdXRwdXQoYnVmOiBTcGF3blN5bmNSZXR1cm5zW1wib3V0cHV0XCJdIHwgQnVmZmVyLCBvcHRpb25zOiB7XG5cdGNsZWFyRW9sPzogYm9vbGVhbixcbn0gPSB7XG5cdGNsZWFyRW9sOiB0cnVlLFxufSk6IHN0cmluZ1xue1xuXHRsZXQgb3V0cHV0ID0gJyc7XG5cblx0aWYgKEFycmF5LmlzQXJyYXkoYnVmKSlcblx0e1xuXHRcdG91dHB1dCA9IGJ1ZlxuXHRcdFx0LmZpbHRlcihmdW5jdGlvbiAoYilcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuICEoIWIgfHwgIWIubGVuZ3RoKVxuXHRcdFx0fSlcblx0XHRcdC5tYXAoZnVuY3Rpb24gKGIpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiBiLnRvU3RyaW5nKCk7XG5cdFx0XHR9KVxuXHRcdFx0LmpvaW4oXCJcXG5cIilcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRvdXRwdXQgPSAoYnVmIHx8ICcnKS50b1N0cmluZygpO1xuXHR9XG5cblx0b3V0cHV0ID0gY3JsZihvdXRwdXQpO1xuXG5cdGlmIChvcHRpb25zLmNsZWFyRW9sKVxuXHR7XG5cdFx0b3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL1xcbiskL2csICcnKTtcblx0fVxuXG5cdHJldHVybiBvdXRwdXQ7XG59XG4iXX0=