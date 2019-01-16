"use strict";
/**
 * Created by user on 2019/1/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const crlf_normalize_1 = require("crlf-normalize");
const cross_spawn_extra_1 = require("cross-spawn-extra");
exports.crossSpawnAsync = cross_spawn_extra_1.async;
exports.crossSpawnSync = cross_spawn_extra_1.sync;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3Mtc3Bhd24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcm9zcy1zcGF3bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsbURBQXNDO0FBQ3RDLHlEQUFxRjtBQUc1RSwwQkFIUyx5QkFBZSxDQUdUO0FBQUUseUJBSGlCLHdCQUFjLENBR2pCO0FBSXhDLFNBQWdCLGtCQUFrQixDQUE4QixFQUFXO0lBRTFFLE9BQU8sRUFBRSxDQUFDLEtBQUs7UUFDZCxhQUFhO1dBQ1YsRUFBRSxDQUFDLGVBQWUsQ0FDckI7QUFDRixDQUFDO0FBTkQsZ0RBTUM7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxHQUF3QyxFQUFFLFVBRXZFO0lBQ0gsUUFBUSxFQUFFLElBQUk7Q0FDZDtJQUVBLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUVoQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQ3RCO1FBQ0MsTUFBTSxHQUFHLEdBQUc7YUFDVixNQUFNLENBQUMsVUFBVSxDQUFDO1lBRWxCLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQzFCLENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQyxVQUFVLENBQUM7WUFFZixPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUM7YUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDWjtTQUVEO1FBQ0MsTUFBTSxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQ2hDO0lBRUQsTUFBTSxHQUFHLHFCQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFdEIsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUNwQjtRQUNDLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztLQUNyQztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2YsQ0FBQztBQWxDRCw0Q0FrQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE5LzEvMTYvMDE2LlxuICovXG5cbmltcG9ydCB7IGNybGYgfSBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5pbXBvcnQgeyBhc3luYyBhcyBjcm9zc1NwYXduQXN5bmMsIHN5bmMgYXMgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICdjcm9zcy1zcGF3bi1leHRyYSc7XG5pbXBvcnQgeyBTcGF3bkFTeW5jUmV0dXJucywgU3Bhd25BU3luY1JldHVybnNQcm9taXNlLCBJU3Bhd25BU3luY0Vycm9yLCBTcGF3blN5bmNSZXR1cm5zLCBTcGF3bk9wdGlvbnMsIFNwYXduU3luY09wdGlvbnMgfSBmcm9tICdjcm9zcy1zcGF3bi1leHRyYS9jb3JlJztcblxuZXhwb3J0IHsgY3Jvc3NTcGF3bkFzeW5jLCBjcm9zc1NwYXduU3luYyB9XG5cbmV4cG9ydCB7IFNwYXduQVN5bmNSZXR1cm5zLCBTcGF3bkFTeW5jUmV0dXJuc1Byb21pc2UsIFNwYXduU3luY1JldHVybnMsIFNwYXduT3B0aW9ucywgU3Bhd25TeW5jT3B0aW9ucyB9XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDcm9zc1NwYXduRXJyb3I8VCBleHRlbmRzIFNwYXduQVN5bmNSZXR1cm5zPihjcDogVCB8IGFueSk6IElTcGF3bkFTeW5jRXJyb3I8VD5cbntcblx0cmV0dXJuIGNwLmVycm9yXG5cdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdHx8IGNwLmVycm9yQ3Jvc3NTcGF3blxuXHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcm9zc1NwYXduT3V0cHV0KGJ1ZjogU3Bhd25TeW5jUmV0dXJuc1tcIm91dHB1dFwiXSB8IEJ1ZmZlciwgb3B0aW9uczoge1xuXHRjbGVhckVvbD86IGJvb2xlYW4sXG59ID0ge1xuXHRjbGVhckVvbDogdHJ1ZSxcbn0pOiBzdHJpbmdcbntcblx0bGV0IG91dHB1dCA9ICcnO1xuXG5cdGlmIChBcnJheS5pc0FycmF5KGJ1ZikpXG5cdHtcblx0XHRvdXRwdXQgPSBidWZcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24gKGIpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiAhKCFiIHx8ICFiLmxlbmd0aClcblx0XHRcdH0pXG5cdFx0XHQubWFwKGZ1bmN0aW9uIChiKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gYi50b1N0cmluZygpO1xuXHRcdFx0fSlcblx0XHRcdC5qb2luKFwiXFxuXCIpXG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0b3V0cHV0ID0gKGJ1ZiB8fCAnJykudG9TdHJpbmcoKTtcblx0fVxuXG5cdG91dHB1dCA9IGNybGYob3V0cHV0KTtcblxuXHRpZiAob3B0aW9ucy5jbGVhckVvbClcblx0e1xuXHRcdG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9cXG4rJC9nLCAnJyk7XG5cdH1cblxuXHRyZXR1cm4gb3V0cHV0O1xufVxuIl19