"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const crossSpawn = require("cross-spawn");
// @ts-ignore
const git_root2_1 = require("git-root2");
exports.isGitRoot = git_root2_1.isGitRoot;
const crlf_normalize_1 = require("crlf-normalize");
const project_config_1 = require("./project.config");
exports.DIST_NOVEL = project_config_1.default.novel_root;
function crossSpawnAsync(bin, argv, optiobs) {
    return new Promise(function (resolve, reject) {
        try {
            let cp = crossSpawn.sync(bin, argv, optiobs);
            resolve(cp);
        }
        catch (e) {
            reject({
                errorCrossSpawn: e,
            });
        }
    })
        .catch(function (ret) {
        return ret;
    });
}
exports.crossSpawnAsync = crossSpawnAsync;
function crossSpawnSync(bin, argv, optiobs) {
    try {
        let cp = crossSpawn.sync(bin, argv, optiobs);
        return cp;
    }
    catch (e) {
        // @ts-ignore
        return {
            errorCrossSpawn: e
        };
    }
}
exports.crossSpawnSync = crossSpawnSync;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBS0gsMENBQTBDO0FBSTFDLGFBQWE7QUFDYix5Q0FBK0M7QUFJdEMsb0JBSlMscUJBQVMsQ0FJVDtBQUhsQixtREFBMEM7QUFDMUMscURBQTZDO0FBTWxDLFFBQUEsVUFBVSxHQUFHLHdCQUFhLENBQUMsVUFBVSxDQUFDO0FBRWpELFNBQWdCLGVBQWUsQ0FBQyxHQUFXLEVBQUUsSUFBZSxFQUFFLE9BQXNCO0lBSW5GLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxPQUFPLEVBQUUsTUFBTTtRQUUzQyxJQUNBO1lBQ0MsSUFBSSxFQUFFLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRTdDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNaO1FBQ0QsT0FBTyxDQUFDLEVBQ1I7WUFDQyxNQUFNLENBQUM7Z0JBQ04sZUFBZSxFQUFFLENBQUM7YUFDbEIsQ0FBQyxDQUFDO1NBQ0g7SUFDRixDQUFDLENBQUM7U0FDQSxLQUFLLENBQUMsVUFBVSxHQUFHO1FBRW5CLE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQyxDQUFDLENBQ0Y7QUFDRixDQUFDO0FBeEJELDBDQXdCQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxHQUFXLEVBQUUsSUFBZSxFQUFFLE9BQXNCO0lBSWxGLElBQ0E7UUFDQyxJQUFJLEVBQUUsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFN0MsT0FBTyxFQUFFLENBQUM7S0FDVjtJQUNELE9BQU8sQ0FBQyxFQUNSO1FBQ0MsYUFBYTtRQUNiLE9BQU87WUFDTixlQUFlLEVBQUUsQ0FBVTtTQUMzQixDQUFBO0tBQ0Q7QUFDRixDQUFDO0FBakJELHdDQWlCQztBQUVELFNBQWdCLGdCQUFnQixDQUFDLEdBQTBELEVBQUUsVUFFekY7SUFDSCxRQUFRLEVBQUUsSUFBSTtDQUNkO0lBRUEsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBRWhCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFDdEI7UUFDQyxNQUFNLEdBQUcsR0FBRzthQUNWLE1BQU0sQ0FBQyxVQUFVLENBQUM7WUFFbkIsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDMUIsQ0FBQyxDQUFDO2FBQ0EsR0FBRyxDQUFDLFVBQVUsQ0FBQztZQUVmLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQzthQUNELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUNaO1NBRUQ7UUFDQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7S0FDaEM7SUFFRCxNQUFNLEdBQUcscUJBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV0QixJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQ3BCO1FBQ0MsTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDZixDQUFDO0FBbENELDRDQWtDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvNS8xNi8wMTYuXG4gKi9cblxuaW1wb3J0IE5vZGVOb3ZlbFRhc2sgZnJvbSAnQG5vZGUtbm92ZWwvdGFzayc7XG4vL2ltcG9ydCAqIGFzIGNoaWxkX3Byb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBTcGF3bk9wdGlvbnMsIFNwYXduU3luY1JldHVybnMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIGNyb3NzU3Bhd24gZnJvbSAnY3Jvc3Mtc3Bhd24nO1xuXG5pbXBvcnQgeyBjb25maWcgYXMgZG90ZW52Q29uZmlnIH0gZnJvbSAnZG90ZW52JztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgZ2l0Um9vdCwgeyBpc0dpdFJvb3QgfSBmcm9tICdnaXQtcm9vdDInO1xuaW1wb3J0IHsgY3JsZiwgTEYgfSBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5pbXBvcnQgUHJvamVjdENvbmZpZyBmcm9tICcuL3Byb2plY3QuY29uZmlnJztcblxuZXhwb3J0IHsgaXNHaXRSb290IH1cblxuZXhwb3J0IHsgU3Bhd25PcHRpb25zLCBTcGF3blN5bmNSZXR1cm5zIH1cblxuZXhwb3J0IGxldCBESVNUX05PVkVMID0gUHJvamVjdENvbmZpZy5ub3ZlbF9yb290O1xuXG5leHBvcnQgZnVuY3Rpb24gY3Jvc3NTcGF3bkFzeW5jKGJpbjogc3RyaW5nLCBhcmd2Pzogc3RyaW5nW10sIG9wdGlvYnM/OiBTcGF3bk9wdGlvbnMpOiBQcm9taXNlPFJldHVyblR5cGU8dHlwZW9mIGNyb3NzU3Bhd24uc3luYz4gJiB7XG5cdGVycm9yQ3Jvc3NTcGF3bj86IEVycm9yLFxufT5cbntcblx0cmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpXG5cdHtcblx0XHR0cnlcblx0XHR7XG5cdFx0XHRsZXQgY3AgPSBjcm9zc1NwYXduLnN5bmMoYmluLCBhcmd2LCBvcHRpb2JzKTtcblxuXHRcdFx0cmVzb2x2ZShjcCk7XG5cdFx0fVxuXHRcdGNhdGNoIChlKVxuXHRcdHtcblx0XHRcdHJlamVjdCh7XG5cdFx0XHRcdGVycm9yQ3Jvc3NTcGF3bjogZSxcblx0XHRcdH0pO1xuXHRcdH1cblx0fSlcblx0XHQuY2F0Y2goZnVuY3Rpb24gKHJldClcblx0XHR7XG5cdFx0XHRyZXR1cm4gcmV0O1xuXHRcdH0pXG5cdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyb3NzU3Bhd25TeW5jKGJpbjogc3RyaW5nLCBhcmd2Pzogc3RyaW5nW10sIG9wdGlvYnM/OiBTcGF3bk9wdGlvbnMpOiBSZXR1cm5UeXBlPHR5cGVvZiBjcm9zc1NwYXduLnN5bmM+ICYge1xuXHRlcnJvckNyb3NzU3Bhd24/OiBFcnJvcixcbn1cbntcblx0dHJ5XG5cdHtcblx0XHRsZXQgY3AgPSBjcm9zc1NwYXduLnN5bmMoYmluLCBhcmd2LCBvcHRpb2JzKTtcblxuXHRcdHJldHVybiBjcDtcblx0fVxuXHRjYXRjaCAoZSlcblx0e1xuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZXJyb3JDcm9zc1NwYXduOiBlIGFzIEVycm9yXG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcm9zc1NwYXduT3V0cHV0KGJ1ZjogUmV0dXJuVHlwZTx0eXBlb2YgY3Jvc3NTcGF3bi5zeW5jPltcIm91dHB1dFwiXSB8IEJ1ZmZlciwgb3B0aW9uczoge1xuXHRjbGVhckVvbD86IGJvb2xlYW4sXG59ID0ge1xuXHRjbGVhckVvbDogdHJ1ZSxcbn0pOiBzdHJpbmdcbntcblx0bGV0IG91dHB1dCA9ICcnO1xuXG5cdGlmIChBcnJheS5pc0FycmF5KGJ1ZikpXG5cdHtcblx0XHRvdXRwdXQgPSBidWZcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24gKGIpXG5cdFx0e1xuXHRcdFx0cmV0dXJuICEoIWIgfHwgIWIubGVuZ3RoKVxuXHRcdH0pXG5cdFx0XHQubWFwKGZ1bmN0aW9uIChiKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gYi50b1N0cmluZygpO1xuXHRcdFx0fSlcblx0XHRcdC5qb2luKFwiXFxuXCIpXG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0b3V0cHV0ID0gKGJ1ZiB8fCAnJykudG9TdHJpbmcoKTtcblx0fVxuXG5cdG91dHB1dCA9IGNybGYob3V0cHV0KTtcblxuXHRpZiAob3B0aW9ucy5jbGVhckVvbClcblx0e1xuXHRcdG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9cXG4rJC9nLCAnJyk7XG5cdH1cblxuXHRyZXR1cm4gb3V0cHV0O1xufVxuIl19