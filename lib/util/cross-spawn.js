"use strict";
/**
 * Created by user on 2019/1/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const crlf_normalize_1 = require("crlf-normalize");
const cross_spawn_extra_1 = require("cross-spawn-extra");
exports.crossSpawnAsync = cross_spawn_extra_1.async;
exports.crossSpawnSync = cross_spawn_extra_1.sync;
const core_1 = require("cross-spawn-extra/core");
exports.stripAnsi = core_1.CrossSpawnExtra.stripAnsi;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3Mtc3Bhd24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcm9zcy1zcGF3bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsbURBQXNDO0FBQ3RDLHlEQUFxRjtBQUs1RSwwQkFMUyx5QkFBZSxDQUtUO0FBQUUseUJBTGlCLHdCQUFjLENBS2pCO0FBSnhDLGlEQUEwSztBQUU3SixRQUFBLFNBQVMsR0FBRyxzQkFBZSxDQUFDLFNBQVMsQ0FBQztBQU1uRCxTQUFnQixrQkFBa0IsQ0FBOEIsRUFBVztJQUUxRSxPQUFPLEVBQUUsQ0FBQyxLQUFLO1FBQ2QsYUFBYTtXQUNWLEVBQUUsQ0FBQyxlQUFlLENBQ3JCO0FBQ0YsQ0FBQztBQU5ELGdEQU1DO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsR0FBd0MsRUFBRSxVQUV2RTtJQUNILFFBQVEsRUFBRSxJQUFJO0NBQ2Q7SUFFQSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFFaEIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUN0QjtRQUNDLE1BQU0sR0FBRyxHQUFHO2FBQ1YsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUVsQixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMxQixDQUFDLENBQUM7YUFDRCxHQUFHLENBQUMsVUFBVSxDQUFDO1lBRWYsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDO2FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ1o7U0FFRDtRQUNDLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUNoQztJQUVELE1BQU0sR0FBRyxxQkFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXRCLElBQUksT0FBTyxDQUFDLFFBQVEsRUFDcEI7UUFDQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDckM7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNmLENBQUM7QUFsQ0QsNENBa0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOS8xLzE2LzAxNi5cbiAqL1xuXG5pbXBvcnQgeyBjcmxmIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IHsgYXN5bmMgYXMgY3Jvc3NTcGF3bkFzeW5jLCBzeW5jIGFzIGNyb3NzU3Bhd25TeW5jIH0gZnJvbSAnY3Jvc3Mtc3Bhd24tZXh0cmEnO1xuaW1wb3J0IHsgU3Bhd25BU3luY1JldHVybnMsIFNwYXduQVN5bmNSZXR1cm5zUHJvbWlzZSwgSVNwYXduQVN5bmNFcnJvciwgU3Bhd25TeW5jUmV0dXJucywgU3Bhd25PcHRpb25zLCBTcGF3blN5bmNPcHRpb25zLCBDcm9zc1NwYXduRXh0cmEgfSBmcm9tICdjcm9zcy1zcGF3bi1leHRyYS9jb3JlJztcblxuZXhwb3J0IGNvbnN0IHN0cmlwQW5zaSA9IENyb3NzU3Bhd25FeHRyYS5zdHJpcEFuc2k7XG5cbmV4cG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMgfVxuXG5leHBvcnQgeyBTcGF3bkFTeW5jUmV0dXJucywgU3Bhd25BU3luY1JldHVybnNQcm9taXNlLCBTcGF3blN5bmNSZXR1cm5zLCBTcGF3bk9wdGlvbnMsIFNwYXduU3luY09wdGlvbnMsIElTcGF3bkFTeW5jRXJyb3IgfVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3Jvc3NTcGF3bkVycm9yPFQgZXh0ZW5kcyBTcGF3bkFTeW5jUmV0dXJucz4oY3A6IFQgfCBhbnkpOiBJU3Bhd25BU3luY0Vycm9yPFQ+XG57XG5cdHJldHVybiBjcC5lcnJvclxuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHR8fCBjcC5lcnJvckNyb3NzU3Bhd25cblx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3Jvc3NTcGF3bk91dHB1dChidWY6IFNwYXduU3luY1JldHVybnNbXCJvdXRwdXRcIl0gfCBCdWZmZXIsIG9wdGlvbnM6IHtcblx0Y2xlYXJFb2w/OiBib29sZWFuLFxufSA9IHtcblx0Y2xlYXJFb2w6IHRydWUsXG59KTogc3RyaW5nXG57XG5cdGxldCBvdXRwdXQgPSAnJztcblxuXHRpZiAoQXJyYXkuaXNBcnJheShidWYpKVxuXHR7XG5cdFx0b3V0cHV0ID0gYnVmXG5cdFx0XHQuZmlsdGVyKGZ1bmN0aW9uIChiKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gISghYiB8fCAhYi5sZW5ndGgpXG5cdFx0XHR9KVxuXHRcdFx0Lm1hcChmdW5jdGlvbiAoYilcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGIudG9TdHJpbmcoKTtcblx0XHRcdH0pXG5cdFx0XHQuam9pbihcIlxcblwiKVxuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdG91dHB1dCA9IChidWYgfHwgJycpLnRvU3RyaW5nKCk7XG5cdH1cblxuXHRvdXRwdXQgPSBjcmxmKG91dHB1dCk7XG5cblx0aWYgKG9wdGlvbnMuY2xlYXJFb2wpXG5cdHtcblx0XHRvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXFxuKyQvZywgJycpO1xuXHR9XG5cblx0cmV0dXJuIG91dHB1dDtcbn1cbiJdfQ==