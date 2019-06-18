"use strict";
/**
 * Created by user on 2018/9/3/003.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const FastGlob = require("fast-glob");
const fs = require("fs-extra");
const yargs = require("yargs");
const path = require("upath2");
const Promise = require("bluebird");
const project_config_1 = require("../project.config");
const log_1 = require("../lib/log");
let argv = yargs.argv;
var MODE;
(function (MODE) {
    MODE["LAST_NOT_DONE"] = "LAST_NOT_DONE";
})(MODE || (MODE = {}));
(async () => {
    log_1.default.debug('argv=', argv);
    if (argv.mode == MODE.LAST_NOT_DONE) {
        log_1.default.info(`檢查並刪除 .cache/files 底下的 */*.json`);
        let ls = await FastGlob([
            '*/*.json',
        ], {
            cwd: path.join(project_config_1.default.cache_root, 'files'),
            absolute: true,
        });
        Promise.each(ls, async function (file) {
            log_1.default.log(`try delete ${file}`);
            return fs.remove(file);
        });
    }
    else {
        log_1.default.error(`參數錯誤 沒有執行任何 腳本`);
    }
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3Jlc2V0X2NhY2hlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3Jlc2V0X2NhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCxzQ0FBc0M7QUFDdEMsK0JBQStCO0FBQy9CLCtCQUErQjtBQUMvQiwrQkFBZ0M7QUFDaEMsb0NBQW9DO0FBRXBDLHNEQUE4QztBQUM5QyxvQ0FBaUM7QUFFakMsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztBQUV0QixJQUFLLElBR0o7QUFIRCxXQUFLLElBQUk7SUFFUix1Q0FBK0IsQ0FBQTtBQUNoQyxDQUFDLEVBSEksSUFBSSxLQUFKLElBQUksUUFHUjtBQUVELENBQUMsS0FBSyxJQUFJLEVBQUU7SUFFWCxhQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUU3QixJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLGFBQWEsRUFDbkM7UUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFFaEQsSUFBSSxFQUFFLEdBQUcsTUFBTSxRQUFRLENBQVM7WUFDL0IsVUFBVTtTQUNWLEVBQUU7WUFDRixHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUM7WUFDakQsUUFBUSxFQUFFLElBQUk7U0FDZCxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLFdBQVcsSUFBSTtZQUVwQyxhQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVsQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDdkIsQ0FBQyxDQUFDLENBQUM7S0FDSDtTQUVEO1FBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO0tBQy9CO0FBRUYsQ0FBQyxDQUFDLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvOS8zLzAwMy5cbiAqL1xuXG5pbXBvcnQgKiBhcyBGYXN0R2xvYiBmcm9tICdmYXN0LWdsb2InO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgeWFyZ3MgZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IGVudkJvb2wsIHsgZW52VmFsIH0gZnJvbSAnZW52LWJvb2wnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5cbmxldCBhcmd2ID0geWFyZ3MuYXJndjtcblxuZW51bSBNT0RFXG57XG5cdExBU1RfTk9UX0RPTkUgPSAnTEFTVF9OT1RfRE9ORScsXG59XG5cbihhc3luYyAoKSA9PiB7XG5cblx0Y29uc29sZS5kZWJ1ZygnYXJndj0nLCBhcmd2KTtcblxuXHRpZiAoYXJndi5tb2RlID09IE1PREUuTEFTVF9OT1RfRE9ORSlcblx0e1xuXHRcdGNvbnNvbGUuaW5mbyhg5qqi5p+l5Lim5Yiq6ZmkIC5jYWNoZS9maWxlcyDlupXkuIvnmoQgKi8qLmpzb25gKTtcblxuXHRcdGxldCBscyA9IGF3YWl0IEZhc3RHbG9iPHN0cmluZz4oW1xuXHRcdFx0JyovKi5qc29uJyxcblx0XHRdLCB7XG5cdFx0XHRjd2Q6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdmaWxlcycpLFxuXHRcdFx0YWJzb2x1dGU6IHRydWUsXG5cdFx0fSk7XG5cblx0XHRQcm9taXNlLmVhY2gobHMsIGFzeW5jIGZ1bmN0aW9uIChmaWxlKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUubG9nKGB0cnkgZGVsZXRlICR7ZmlsZX1gKTtcblxuXHRcdFx0cmV0dXJuIGZzLnJlbW92ZShmaWxlKVxuXHRcdH0pO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoYOWPg+aVuOmMr+iqpCDmspLmnInln7fooYzku7vkvZUg6IWz5pysYClcblx0fVxuXG59KSgpO1xuIl19