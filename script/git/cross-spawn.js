"use strict";
/**
 * Created by user on 2019/1/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.crossSpawnSyncGit = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3Mtc3Bhd24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcm9zcy1zcGF3bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUVILDZCQUE2RjtBQUM3Rix1Q0FBb0M7QUFDcEMsNERBQXVEO0FBRXZEOztHQUVHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsR0FBVyxFQUFFLElBQWMsRUFBRSxPQUEwQjtJQUV4RixJQUFJLEtBQWMsQ0FBQztJQUVuQixJQUFJLE9BQU8sRUFDWDtRQUNDLElBQUksT0FBTyxDQUFDLEtBQUssSUFBSSxTQUFTLEVBQzlCO1lBQ0MsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNiLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQTtTQUNwQjtLQUNEO0lBRUQsSUFBSSxFQUFFLEdBQUcsa0JBQWMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRTVDLEtBQUssSUFBSSxhQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFnQixDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBRWxELElBQUksRUFBRSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFDakM7UUFDQyxJQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLElBQUksRUFBRSxHQUFHLHVCQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFdkIsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUN4QjtZQUNDLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXRCLEVBQUUsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7WUFDekIsYUFBYTtZQUNiLEVBQUUsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1lBRXZCLE1BQU0sQ0FBQyxDQUFBO1NBQ1A7UUFFRCxhQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTFCLGFBQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDakI7SUFFRCxPQUFPLEVBQUUsQ0FBQztBQUNYLENBQUM7QUF2Q0QsOENBdUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOS8xLzE2LzAxNi5cbiAqL1xuXG5pbXBvcnQgeyBjcm9zc1NwYXduU3luYywgU3Bhd25TeW5jUmV0dXJucywgU3Bhd25TeW5jT3B0aW9ucywgY3Jvc3NTcGF3bk91dHB1dCB9IGZyb20gJy4uLy4uJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uLy4uL2xpYi9sb2cnO1xuaW1wb3J0IHsgc3RyaXBBbnNpIH0gZnJvbSAnLi4vLi4vbGliL3V0aWwvY3Jvc3Mtc3Bhd24nO1xuXG4vKipcbiAqIHVzZSBmb3Igc29tZSBnaXQgY21kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcm9zc1NwYXduU3luY0dpdChiaW46IHN0cmluZywgYXJnczogc3RyaW5nW10sIG9wdGlvbnM/OiBTcGF3blN5bmNPcHRpb25zKVxue1xuXHRsZXQgcHJpbnQ6IGJvb2xlYW47XG5cblx0aWYgKG9wdGlvbnMpXG5cdHtcblx0XHRpZiAob3B0aW9ucy5zdGRpbyA9PSAnaW5oZXJpdCcpXG5cdFx0e1xuXHRcdFx0cHJpbnQgPSB0cnVlO1xuXHRcdFx0ZGVsZXRlIG9wdGlvbnMuc3RkaW9cblx0XHR9XG5cdH1cblxuXHRsZXQgY3AgPSBjcm9zc1NwYXduU3luYyhiaW4sIGFyZ3MsIG9wdGlvbnMpO1xuXG5cdHByaW50ICYmIGNvbnNvbGUubG9nKGNyb3NzU3Bhd25PdXRwdXQoY3Aub3V0cHV0KSk7XG5cblx0aWYgKGNwLnN0ZGVyciAmJiBjcC5zdGRlcnIubGVuZ3RoKVxuXHR7XG5cdFx0bGV0IHMxID0gU3RyaW5nKGNwLnN0ZGVycik7XG5cdFx0bGV0IHMyID0gc3RyaXBBbnNpKHMxKTtcblxuXHRcdGlmICgvXmZhdGFsXFw6L20udGVzdChzMikpXG5cdFx0e1xuXHRcdFx0bGV0IGUgPSBuZXcgRXJyb3IoczEpO1xuXG5cdFx0XHRjcC5lcnJvciA9IGNwLmVycm9yIHx8IGU7XG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRjcC5lcnJvckNyb3NzU3Bhd24gPSBlO1xuXG5cdFx0XHR0aHJvdyBlXG5cdFx0fVxuXG5cdFx0Y29uc29sZS5pbmZvKGBjcC5zdGRlcnJgKTtcblxuXHRcdGNvbnNvbGUud2FybihzMSk7XG5cdH1cblxuXHRyZXR1cm4gY3A7XG59XG4iXX0=