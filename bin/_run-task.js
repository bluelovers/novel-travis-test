"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const fs = require("fs-extra");
const __1 = require("..");
const index_1 = require("../index");
const share_1 = require("../lib/share");
const project_config_1 = require("../project.config");
const log_1 = require("../lib/log");
const Promise = require("bluebird");
const git_1 = require("../data/git");
const gitee_pr_1 = require("../script/gitee-pr");
const init_1 = require("../script/init");
const git_2 = require("../script/git");
let label;
if (!index_1.isGitRoot(init_1.DIST_NOVEL)) {
    log_1.default.warn(`dist_novel not a git: ${init_1.DIST_NOVEL}`);
    throw new Error(`something wrong when create git`);
}
if (share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT,
])) {
    log_1.default.info(`dist_novel: ${init_1.DIST_NOVEL}`);
    let currentHEAD = git_2.getHashHEAD(init_1.DIST_NOVEL);
    if (init_1.NOT_DONE) {
        label = `--- NOT_DONE ---`;
        log_1.default.warn(label);
        log_1.default.time(label);
        let bin = path.join(init_1.PROJECT_ROOT, 'bin/_do_segment_all.js');
        __1.crossSpawnSync('node', [
            bin,
        ], {
            stdio: 'inherit',
            cwd: init_1.PROJECT_ROOT,
        });
    }
    else {
        label = `--- TASK ---`;
        log_1.default.info(label);
        log_1.default.time(label);
        runTask();
    }
    log_1.default.timeEnd(label);
    (async () => {
        label = `--- PUSH ---`;
        log_1.default.debug(label);
        log_1.default.time(label);
        if (init_1.MyConfig.config.debug && init_1.MyConfig.config.debug.no_push) {
            log_1.default.warn(`[DEBUG] skip push`);
        }
        else {
            let ok = true;
            let currentHEADNew = git_2.getHashHEAD(init_1.DIST_NOVEL);
            if (currentHEAD != currentHEADNew || git_2.diffOrigin(init_1.DIST_NOVEL)) {
                fs.ensureFileSync(path.join(project_config_1.default.cache_root, '.waitpush'));
                let cp = git_2.pushGit(init_1.DIST_NOVEL, git_2.getPushUrlGitee(git_1.GIT_SETTING_DIST_NOVEL.url), true);
                if (cp.error || cp.stderr && cp.stderr.toString()) {
                    ok = false;
                    log_1.default.error(`發生錯誤`);
                }
                await Promise.delay(1000);
                gitee_pr_1.createPullRequests();
            }
            else {
                log_1.default.error(`沒有任何變更 忽略 PUSH`);
            }
            if (ok) {
                fs.removeSync(path.join(project_config_1.default.cache_root, '.waitpush'));
                if (init_1.CacheConfig) {
                    let config = fs.readJSONSync(init_1.CacheConfig.filepath);
                    config.done = 1;
                    config.last_push_head = currentHEADNew;
                    config.last_task_datatime = Date.now();
                    log_1.default.ok(`將 cache 檔案內的 執行狀態 改為已完成`);
                    fs.writeJSONSync(init_1.CacheConfig.filepath, config, {
                        spaces: 2,
                    });
                    log_1.default.dir(config);
                }
            }
        }
        log_1.default.timeEnd(label);
    })();
}
// ----------------
function runTask() {
    let bin = path.join(path.dirname(require.resolve('@node-novel/task')), 'bin/_novel-task.js');
    //	console.log(bin);
    __1.crossSpawnSync('node', [
        bin,
    ], {
        stdio: 'inherit',
        cwd: init_1.PROJECT_ROOT,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3J1bi10YXNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3J1bi10YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwrQkFBZ0M7QUFLaEMsK0JBQStCO0FBQy9CLDBCQUFxRDtBQUNyRCxvQ0FBdUQ7QUFFdkQsd0NBQTBFO0FBQzFFLHNEQUE4RDtBQUk5RCxvQ0FBaUM7QUFDakMsb0NBQXFDO0FBRXJDLHFDQUVxQjtBQUNyQixpREFBd0Q7QUFFeEQseUNBQW9HO0FBQ3BHLHVDQUE4RjtBQUU5RixJQUFJLEtBQWEsQ0FBQztBQUVsQixJQUFJLENBQUMsaUJBQVMsQ0FBQyxpQkFBVSxDQUFDLEVBQzFCO0lBQ0MsYUFBTyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsaUJBQVUsRUFBRSxDQUFDLENBQUM7SUFFcEQsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0NBQ25EO0FBRUQsSUFBSSxpQ0FBeUIsQ0FBQztJQUM3Qix1QkFBZSxDQUFDLGVBQWU7Q0FDL0IsQ0FBQyxFQUNGO0lBQ0MsYUFBTyxDQUFDLElBQUksQ0FBQyxlQUFlLGlCQUFVLEVBQUUsQ0FBQyxDQUFDO0lBRTFDLElBQUksV0FBVyxHQUFHLGlCQUFXLENBQUMsaUJBQVUsQ0FBQyxDQUFDO0lBRTFDLElBQUksZUFBUSxFQUNaO1FBQ0MsS0FBSyxHQUFHLGtCQUFrQixDQUFDO1FBRTNCLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEIsYUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVwQixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFZLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUU1RCxrQkFBYyxDQUFDLE1BQU0sRUFBRTtZQUN0QixHQUFHO1NBQ0gsRUFBRTtZQUNGLEtBQUssRUFBRSxTQUFTO1lBQ2hCLEdBQUcsRUFBRSxtQkFBWTtTQUNqQixDQUFDLENBQUM7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QUFDO0lBRTlGLG9CQUFvQjtJQUVuQixrQkFBYyxDQUFDLE1BQU0sRUFBRTtRQUN0QixHQUFHO0tBQ0gsRUFBRTtRQUNGLEtBQUssRUFBRSxTQUFTO1FBQ2hCLEdBQUcsRUFBRSxtQkFBWTtLQUNqQixDQUFDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC81LzE2LzAxNi5cbiAqL1xuXG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0IHsgcHJvY2Vzc1RvYyB9IGZyb20gJ0Bub2RlLW5vdmVsL3RvYyc7XG5pbXBvcnQgKiBhcyBjcm9zc1NwYXduIGZyb20gJ2Nyb3NzLXNwYXduJztcbmltcG9ydCBnaXRSb290IGZyb20gJ2dpdC1yb290Mic7XG5pbXBvcnQgeyBjb25maWcgYXMgZG90ZW52Q29uZmlnIH0gZnJvbSAnZG90ZW52JztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLic7XG5pbXBvcnQgeyBjcm9zc1NwYXduT3V0cHV0LCBpc0dpdFJvb3QgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBsb2FkQ2FjaGVDb25maWcsIGxvYWRNYWluQ29uZmlnIH0gZnJvbSAnQG5vZGUtbm92ZWwvdGFzay9saWIvY29uZmlnJztcbmltcG9ydCB7IGNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMsIEVudW1TaGFyZVN0YXRlcyB9IGZyb20gJy4uL2xpYi9zaGFyZSc7XG5pbXBvcnQgUHJvamVjdENvbmZpZywgeyBub3ZlbF9yb290IH0gZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCBnaXRsb2cgZnJvbSAnZ2l0bG9nMic7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcblxuaW1wb3J0IHtcblx0R0lUX1NFVFRJTkdfRElTVF9OT1ZFTCxcbn0gZnJvbSAnLi4vZGF0YS9naXQnO1xuaW1wb3J0IHsgY3JlYXRlUHVsbFJlcXVlc3RzIH0gZnJvbSAnLi4vc2NyaXB0L2dpdGVlLXByJztcblxuaW1wb3J0IHsgTk9UX0RPTkUsIERJU1RfTk9WRUwsIFBST0pFQ1RfUk9PVCwgQlJfTkFNRSwgTXlDb25maWcsIENhY2hlQ29uZmlnIH0gZnJvbSAnLi4vc2NyaXB0L2luaXQnO1xuaW1wb3J0IHsgZGlmZk9yaWdpbiwgZ2V0SGFzaEhFQUQsIGdldFB1c2hVcmwsIGdldFB1c2hVcmxHaXRlZSwgcHVzaEdpdCB9IGZyb20gJy4uL3NjcmlwdC9naXQnO1xuXG5sZXQgbGFiZWw6IHN0cmluZztcblxuaWYgKCFpc0dpdFJvb3QoRElTVF9OT1ZFTCkpXG57XG5cdGNvbnNvbGUud2FybihgZGlzdF9ub3ZlbCBub3QgYSBnaXQ6ICR7RElTVF9OT1ZFTH1gKTtcblxuXHR0aHJvdyBuZXcgRXJyb3IoYHNvbWV0aGluZyB3cm9uZyB3aGVuIGNyZWF0ZSBnaXRgKTtcbn1cblxuaWYgKGNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMoW1xuXHRFbnVtU2hhcmVTdGF0ZXMuV0FJVF9DUkVBVEVfR0lULFxuXSkpXG57XG5cdGNvbnNvbGUuaW5mbyhgZGlzdF9ub3ZlbDogJHtESVNUX05PVkVMfWApO1xuXG5cdGxldCBjdXJyZW50SEVBRCA9IGdldEhhc2hIRUFEKERJU1RfTk9WRUwpO1xuXG5cdGlmIChOT1RfRE9ORSlcblx0e1xuXHRcdGxhYmVsID0gYC0tLSBOT1RfRE9ORSAtLS1gO1xuXG5cdFx0Y29uc29sZS53YXJuKGxhYmVsKTtcblx0XHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdFx0bGV0IGJpbiA9IHBhdGguam9pbihQUk9KRUNUX1JPT1QsICdiaW4vX2RvX3NlZ21lbnRfYWxsLmpzJyk7XG5cblx0XHRjcm9zc1NwYXduU3luYygnbm9kZScsIFtcblx0XHRcdGJpbixcblx0XHRdLCB7XG5cdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0Y3dkOiBQUk9KRUNUX1JPT1QsXG5cdFx0fSk7XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0bGFiZWwgPSBgLS0tIFRBU0sgLS0tYDtcblxuXHRcdGNvbnNvbGUuaW5mbyhsYWJlbCk7XG5cdFx0Y29uc29sZS50aW1lKGxhYmVsKTtcblxuXHRcdHJ1blRhc2soKTtcblx0fVxuXG5cdGNvbnNvbGUudGltZUVuZChsYWJlbCk7XG5cblx0KGFzeW5jICgpID0+XG5cdHtcblx0XHRsYWJlbCA9IGAtLS0gUFVTSCAtLS1gO1xuXG5cdFx0Y29uc29sZS5kZWJ1ZyhsYWJlbCk7XG5cdFx0Y29uc29sZS50aW1lKGxhYmVsKTtcblxuXHRcdGlmIChNeUNvbmZpZy5jb25maWcuZGVidWcgJiYgTXlDb25maWcuY29uZmlnLmRlYnVnLm5vX3B1c2gpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS53YXJuKGBbREVCVUddIHNraXAgcHVzaGApO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0bGV0IG9rID0gdHJ1ZTtcblxuXHRcdFx0bGV0IGN1cnJlbnRIRUFETmV3ID0gZ2V0SGFzaEhFQUQoRElTVF9OT1ZFTCk7XG5cblx0XHRcdGlmIChjdXJyZW50SEVBRCAhPSBjdXJyZW50SEVBRE5ldyB8fCBkaWZmT3JpZ2luKERJU1RfTk9WRUwpKVxuXHRcdFx0e1xuXHRcdFx0XHRmcy5lbnN1cmVGaWxlU3luYyhwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnLndhaXRwdXNoJykpO1xuXG5cdFx0XHRcdGxldCBjcCA9IHB1c2hHaXQoRElTVF9OT1ZFTCwgZ2V0UHVzaFVybEdpdGVlKEdJVF9TRVRUSU5HX0RJU1RfTk9WRUwudXJsKSwgdHJ1ZSk7XG5cblx0XHRcdFx0aWYgKGNwLmVycm9yIHx8IGNwLnN0ZGVyciAmJiBjcC5zdGRlcnIudG9TdHJpbmcoKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG9rID0gZmFsc2U7XG5cblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGDnmbznlJ/pjK/oqqRgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGF3YWl0IFByb21pc2UuZGVsYXkoMTAwMCk7XG5cblx0XHRcdFx0Y3JlYXRlUHVsbFJlcXVlc3RzKCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYOaykuacieS7u+S9leiuiuabtCDlv73nlaUgUFVTSGApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAob2spXG5cdFx0XHR7XG5cdFx0XHRcdGZzLnJlbW92ZVN5bmMocGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJy53YWl0cHVzaCcpKTtcblxuXHRcdFx0XHRpZiAoQ2FjaGVDb25maWcpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgY29uZmlnID0gZnMucmVhZEpTT05TeW5jKENhY2hlQ29uZmlnLmZpbGVwYXRoKTtcblxuXHRcdFx0XHRcdGNvbmZpZy5kb25lID0gMTtcblxuXHRcdFx0XHRcdGNvbmZpZy5sYXN0X3B1c2hfaGVhZCA9IGN1cnJlbnRIRUFETmV3O1xuXG5cdFx0XHRcdFx0Y29uZmlnLmxhc3RfdGFza19kYXRhdGltZSA9IERhdGUubm93KCk7XG5cblx0XHRcdFx0XHRjb25zb2xlLm9rKGDlsIcgY2FjaGUg5qqU5qGI5YWn55qEIOWft+ihjOeLgOaFiyDmlLnngrrlt7LlrozmiJBgKTtcblxuXHRcdFx0XHRcdGZzLndyaXRlSlNPTlN5bmMoQ2FjaGVDb25maWcuZmlsZXBhdGgsIGNvbmZpZywge1xuXHRcdFx0XHRcdFx0c3BhY2VzOiAyLFxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0Y29uc29sZS5kaXIoY29uZmlnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnNvbGUudGltZUVuZChsYWJlbCk7XG5cdH0pKCk7XG5cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBydW5UYXNrKClcbntcblx0bGV0IGJpbiA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUocmVxdWlyZS5yZXNvbHZlKCdAbm9kZS1ub3ZlbC90YXNrJykpLCAnYmluL19ub3ZlbC10YXNrLmpzJyk7XG5cbi8vXHRjb25zb2xlLmxvZyhiaW4pO1xuXG5cdGNyb3NzU3Bhd25TeW5jKCdub2RlJywgW1xuXHRcdGJpbixcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBQUk9KRUNUX1JPT1QsXG5cdH0pO1xufVxuXG5cbiJdfQ==