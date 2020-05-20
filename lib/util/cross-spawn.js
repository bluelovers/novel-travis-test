"use strict";
/**
 * Created by user on 2019/1/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.crossSpawnOutput = exports.getCrossSpawnError = exports.crossSpawnSync = exports.crossSpawnAsync = exports.stripAnsi = void 0;
const crlf_normalize_1 = require("crlf-normalize");
const cross_spawn_extra_1 = require("cross-spawn-extra");
Object.defineProperty(exports, "crossSpawnAsync", { enumerable: true, get: function () { return cross_spawn_extra_1.async; } });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3Mtc3Bhd24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcm9zcy1zcGF3bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUVILG1EQUFzQztBQUN0Qyx5REFBc0Y7QUFLN0UsZ0dBTFMseUJBQWUsT0FLVDtBQUp4QixpREFBMEs7QUFFN0osUUFBQSxTQUFTLEdBQUcsc0JBQWUsQ0FBQyxTQUFTLENBQUM7QUFJbkQsU0FBZ0IsY0FBYyxDQUFDLEdBQUcsSUFBd0M7SUFFekUsSUFBSSxFQUFFLEdBQUcsd0JBQWUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBRWxDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQztJQUNmLGFBQWE7SUFDYixPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUM7SUFFaEIsT0FBTyxFQUFFLENBQUM7QUFDWCxDQUFDO0FBVEQsd0NBU0M7QUFJRCxTQUFnQixrQkFBa0IsQ0FBOEIsRUFBVztJQUUxRSxPQUFPLEVBQUUsQ0FBQyxLQUFLO1FBQ2QsYUFBYTtXQUNWLEVBQUUsQ0FBQyxlQUFlLENBQ3JCO0FBQ0YsQ0FBQztBQU5ELGdEQU1DO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsR0FBd0MsRUFBRSxVQUV2RTtJQUNILFFBQVEsRUFBRSxJQUFJO0NBQ2Q7SUFFQSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFFaEIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUN0QjtRQUNDLE1BQU0sR0FBRyxHQUFHO2FBQ1YsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUVsQixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMxQixDQUFDLENBQUM7YUFDRCxHQUFHLENBQUMsVUFBVSxDQUFDO1lBRWYsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDO2FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ1o7U0FFRDtRQUNDLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUNoQztJQUVELE1BQU0sR0FBRyxxQkFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXRCLElBQUksT0FBTyxDQUFDLFFBQVEsRUFDcEI7UUFDQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDckM7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNmLENBQUM7QUFsQ0QsNENBa0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOS8xLzE2LzAxNi5cbiAqL1xuXG5pbXBvcnQgeyBjcmxmIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IHsgYXN5bmMgYXMgY3Jvc3NTcGF3bkFzeW5jLCBzeW5jIGFzIF9jcm9zc1NwYXduU3luYyB9IGZyb20gJ2Nyb3NzLXNwYXduLWV4dHJhJztcbmltcG9ydCB7IFNwYXduQVN5bmNSZXR1cm5zLCBTcGF3bkFTeW5jUmV0dXJuc1Byb21pc2UsIElTcGF3bkFTeW5jRXJyb3IsIFNwYXduU3luY1JldHVybnMsIFNwYXduT3B0aW9ucywgU3Bhd25TeW5jT3B0aW9ucywgQ3Jvc3NTcGF3bkV4dHJhIH0gZnJvbSAnY3Jvc3Mtc3Bhd24tZXh0cmEvY29yZSc7XG5cbmV4cG9ydCBjb25zdCBzdHJpcEFuc2kgPSBDcm9zc1NwYXduRXh0cmEuc3RyaXBBbnNpO1xuXG5leHBvcnQgeyBjcm9zc1NwYXduQXN5bmMgfVxuXG5leHBvcnQgZnVuY3Rpb24gY3Jvc3NTcGF3blN5bmMoLi4uYXJndjogUGFyYW1ldGVyczx0eXBlb2YgX2Nyb3NzU3Bhd25TeW5jPilcbntcblx0bGV0IGNwID0gX2Nyb3NzU3Bhd25TeW5jKC4uLmFyZ3YpO1xuXG5cdGRlbGV0ZSBjcC50aGVuO1xuXHQvLyBAdHMtaWdub3JlXG5cdGRlbGV0ZSBjcC5jYXRjaDtcblxuXHRyZXR1cm4gY3A7XG59XG5cbmV4cG9ydCB7IFNwYXduQVN5bmNSZXR1cm5zLCBTcGF3bkFTeW5jUmV0dXJuc1Byb21pc2UsIFNwYXduU3luY1JldHVybnMsIFNwYXduT3B0aW9ucywgU3Bhd25TeW5jT3B0aW9ucywgSVNwYXduQVN5bmNFcnJvciB9XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDcm9zc1NwYXduRXJyb3I8VCBleHRlbmRzIFNwYXduQVN5bmNSZXR1cm5zPihjcDogVCB8IGFueSk6IElTcGF3bkFTeW5jRXJyb3I8VD5cbntcblx0cmV0dXJuIGNwLmVycm9yXG5cdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdHx8IGNwLmVycm9yQ3Jvc3NTcGF3blxuXHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcm9zc1NwYXduT3V0cHV0KGJ1ZjogU3Bhd25TeW5jUmV0dXJuc1tcIm91dHB1dFwiXSB8IEJ1ZmZlciwgb3B0aW9uczoge1xuXHRjbGVhckVvbD86IGJvb2xlYW4sXG59ID0ge1xuXHRjbGVhckVvbDogdHJ1ZSxcbn0pOiBzdHJpbmdcbntcblx0bGV0IG91dHB1dCA9ICcnO1xuXG5cdGlmIChBcnJheS5pc0FycmF5KGJ1ZikpXG5cdHtcblx0XHRvdXRwdXQgPSBidWZcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24gKGIpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiAhKCFiIHx8ICFiLmxlbmd0aClcblx0XHRcdH0pXG5cdFx0XHQubWFwKGZ1bmN0aW9uIChiKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gYi50b1N0cmluZygpO1xuXHRcdFx0fSlcblx0XHRcdC5qb2luKFwiXFxuXCIpXG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0b3V0cHV0ID0gKGJ1ZiB8fCAnJykudG9TdHJpbmcoKTtcblx0fVxuXG5cdG91dHB1dCA9IGNybGYob3V0cHV0KTtcblxuXHRpZiAob3B0aW9ucy5jbGVhckVvbClcblx0e1xuXHRcdG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9cXG4rJC9nLCAnJyk7XG5cdH1cblxuXHRyZXR1cm4gb3V0cHV0O1xufVxuIl19