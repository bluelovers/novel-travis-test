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
        let ls = await FastGlob.async([
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3Jlc2V0X2NhY2hlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3Jlc2V0X2NhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCxzQ0FBc0M7QUFDdEMsK0JBQStCO0FBQy9CLCtCQUErQjtBQUMvQiwrQkFBZ0M7QUFDaEMsb0NBQW9DO0FBRXBDLHNEQUE4QztBQUM5QyxvQ0FBaUM7QUFFakMsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztBQUV0QixJQUFLLElBR0o7QUFIRCxXQUFLLElBQUk7SUFFUix1Q0FBK0IsQ0FBQTtBQUNoQyxDQUFDLEVBSEksSUFBSSxLQUFKLElBQUksUUFHUjtBQUVELENBQUMsS0FBSyxJQUFJLEVBQUU7SUFFWCxhQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUU3QixJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLGFBQWEsRUFDbkM7UUFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFFaEQsSUFBSSxFQUFFLEdBQUcsTUFBTSxRQUFRLENBQUMsS0FBSyxDQUFTO1lBQ3JDLFVBQVU7U0FDVixFQUFFO1lBQ0YsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDO1lBQ2pELFFBQVEsRUFBRSxJQUFJO1NBQ2QsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxXQUFXLElBQUk7WUFFcEMsYUFBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFDLENBQUM7WUFFbEMsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO0tBQ0g7U0FFRDtRQUNDLGFBQU8sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtLQUMvQjtBQUVGLENBQUMsQ0FBQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzkvMy8wMDMuXG4gKi9cblxuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCAqIGFzIHlhcmdzIGZyb20gJ3lhcmdzJztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBlbnZCb29sLCB7IGVudlZhbCB9IGZyb20gJ2Vudi1ib29sJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuXG5sZXQgYXJndiA9IHlhcmdzLmFyZ3Y7XG5cbmVudW0gTU9ERVxue1xuXHRMQVNUX05PVF9ET05FID0gJ0xBU1RfTk9UX0RPTkUnLFxufVxuXG4oYXN5bmMgKCkgPT4ge1xuXG5cdGNvbnNvbGUuZGVidWcoJ2FyZ3Y9JywgYXJndik7XG5cblx0aWYgKGFyZ3YubW9kZSA9PSBNT0RFLkxBU1RfTk9UX0RPTkUpXG5cdHtcblx0XHRjb25zb2xlLmluZm8oYOaqouafpeS4puWIqumZpCAuY2FjaGUvZmlsZXMg5bqV5LiL55qEICovKi5qc29uYCk7XG5cblx0XHRsZXQgbHMgPSBhd2FpdCBGYXN0R2xvYi5hc3luYzxzdHJpbmc+KFtcblx0XHRcdCcqLyouanNvbicsXG5cdFx0XSwge1xuXHRcdFx0Y3dkOiBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnZmlsZXMnKSxcblx0XHRcdGFic29sdXRlOiB0cnVlLFxuXHRcdH0pO1xuXG5cdFx0UHJvbWlzZS5lYWNoKGxzLCBhc3luYyBmdW5jdGlvbiAoZmlsZSlcblx0XHR7XG5cdFx0XHRjb25zb2xlLmxvZyhgdHJ5IGRlbGV0ZSAke2ZpbGV9YCk7XG5cblx0XHRcdHJldHVybiBmcy5yZW1vdmUoZmlsZSlcblx0XHR9KTtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGDlj4PmlbjpjK/oqqQg5rKS5pyJ5Z+36KGM5Lu75L2VIOiFs+acrGApXG5cdH1cblxufSkoKTtcbiJdfQ==