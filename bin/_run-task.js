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
const git_api_pr_1 = require("../script/git-api-pr");
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
                git_api_pr_1.createPullRequests();
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
    return __1.crossSpawnSync('node', [
        bin,
    ], {
        stdio: 'inherit',
        cwd: init_1.PROJECT_ROOT,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3J1bi10YXNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3J1bi10YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwrQkFBZ0M7QUFJaEMsK0JBQStCO0FBQy9CLDBCQUFxRDtBQUNyRCxvQ0FBdUQ7QUFFdkQsd0NBQTBFO0FBQzFFLHNEQUE4RDtBQUk5RCxvQ0FBaUM7QUFDakMsb0NBQXFDO0FBRXJDLHFDQUVxQjtBQUNyQixxREFBMEQ7QUFFMUQseUNBQW9HO0FBQ3BHLHVDQUE4RjtBQUU5RixJQUFJLEtBQWEsQ0FBQztBQUVsQixJQUFJLENBQUMsaUJBQVMsQ0FBQyxpQkFBVSxDQUFDLEVBQzFCO0lBQ0MsYUFBTyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsaUJBQVUsRUFBRSxDQUFDLENBQUM7SUFFcEQsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0NBQ25EO0FBRUQsSUFBSSxpQ0FBeUIsQ0FBQztJQUM3Qix1QkFBZSxDQUFDLGVBQWU7Q0FDL0IsQ0FBQyxFQUNGO0lBQ0MsYUFBTyxDQUFDLElBQUksQ0FBQyxlQUFlLGlCQUFVLEVBQUUsQ0FBQyxDQUFDO0lBRTFDLElBQUksV0FBVyxHQUFHLGlCQUFXLENBQUMsaUJBQVUsQ0FBQyxDQUFDO0lBRTFDLElBQUksZUFBUSxFQUNaO1FBQ0MsS0FBSyxHQUFHLGtCQUFrQixDQUFDO1FBRTNCLGFBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEIsYUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVwQixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFZLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUU1RCxrQkFBYyxDQUFDLE1BQU0sRUFBRTtZQUN0QixHQUFHO1NBQ0gsRUFBRTtZQUNGLEtBQUssRUFBRSxTQUFTO1lBQ2hCLEdBQUcsRUFBRSxtQkFBWTtTQUNqQixDQUFDLENBQUM7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QUFDO0lBRTlGLG9CQUFvQjtJQUVuQixPQUFPLGtCQUFjLENBQUMsTUFBTSxFQUFFO1FBQzdCLEdBQUc7S0FDSCxFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLG1CQUFZO0tBQ2pCLENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzUvMTYvMDE2LlxuICovXG5cbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgeyBwcm9jZXNzVG9jIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCBnaXRSb290IGZyb20gJ2dpdC1yb290Mic7XG5pbXBvcnQgeyBjb25maWcgYXMgZG90ZW52Q29uZmlnIH0gZnJvbSAnZG90ZW52JztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLic7XG5pbXBvcnQgeyBjcm9zc1NwYXduT3V0cHV0LCBpc0dpdFJvb3QgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBsb2FkQ2FjaGVDb25maWcsIGxvYWRNYWluQ29uZmlnIH0gZnJvbSAnQG5vZGUtbm92ZWwvdGFzay9saWIvY29uZmlnJztcbmltcG9ydCB7IGNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMsIEVudW1TaGFyZVN0YXRlcyB9IGZyb20gJy4uL2xpYi9zaGFyZSc7XG5pbXBvcnQgUHJvamVjdENvbmZpZywgeyBub3ZlbF9yb290IH0gZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCBnaXRsb2cgZnJvbSAnZ2l0bG9nMic7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcblxuaW1wb3J0IHtcblx0R0lUX1NFVFRJTkdfRElTVF9OT1ZFTCxcbn0gZnJvbSAnLi4vZGF0YS9naXQnO1xuaW1wb3J0IHsgY3JlYXRlUHVsbFJlcXVlc3RzIH0gZnJvbSAnLi4vc2NyaXB0L2dpdC1hcGktcHInO1xuXG5pbXBvcnQgeyBOT1RfRE9ORSwgRElTVF9OT1ZFTCwgUFJPSkVDVF9ST09ULCBCUl9OQU1FLCBNeUNvbmZpZywgQ2FjaGVDb25maWcgfSBmcm9tICcuLi9zY3JpcHQvaW5pdCc7XG5pbXBvcnQgeyBkaWZmT3JpZ2luLCBnZXRIYXNoSEVBRCwgZ2V0UHVzaFVybCwgZ2V0UHVzaFVybEdpdGVlLCBwdXNoR2l0IH0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5cbmxldCBsYWJlbDogc3RyaW5nO1xuXG5pZiAoIWlzR2l0Um9vdChESVNUX05PVkVMKSlcbntcblx0Y29uc29sZS53YXJuKGBkaXN0X25vdmVsIG5vdCBhIGdpdDogJHtESVNUX05PVkVMfWApO1xuXG5cdHRocm93IG5ldyBFcnJvcihgc29tZXRoaW5nIHdyb25nIHdoZW4gY3JlYXRlIGdpdGApO1xufVxuXG5pZiAoY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhbXG5cdEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVQsXG5dKSlcbntcblx0Y29uc29sZS5pbmZvKGBkaXN0X25vdmVsOiAke0RJU1RfTk9WRUx9YCk7XG5cblx0bGV0IGN1cnJlbnRIRUFEID0gZ2V0SGFzaEhFQUQoRElTVF9OT1ZFTCk7XG5cblx0aWYgKE5PVF9ET05FKVxuXHR7XG5cdFx0bGFiZWwgPSBgLS0tIE5PVF9ET05FIC0tLWA7XG5cblx0XHRjb25zb2xlLndhcm4obGFiZWwpO1xuXHRcdGNvbnNvbGUudGltZShsYWJlbCk7XG5cblx0XHRsZXQgYmluID0gcGF0aC5qb2luKFBST0pFQ1RfUk9PVCwgJ2Jpbi9fZG9fc2VnbWVudF9hbGwuanMnKTtcblxuXHRcdGNyb3NzU3Bhd25TeW5jKCdub2RlJywgW1xuXHRcdFx0YmluLFxuXHRcdF0sIHtcblx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRjd2Q6IFBST0pFQ1RfUk9PVCxcblx0XHR9KTtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRsYWJlbCA9IGAtLS0gVEFTSyAtLS1gO1xuXG5cdFx0Y29uc29sZS5pbmZvKGxhYmVsKTtcblx0XHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdFx0cnVuVGFzaygpO1xuXHR9XG5cblx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblxuXHQoYXN5bmMgKCkgPT5cblx0e1xuXHRcdGxhYmVsID0gYC0tLSBQVVNIIC0tLWA7XG5cblx0XHRjb25zb2xlLmRlYnVnKGxhYmVsKTtcblx0XHRjb25zb2xlLnRpbWUobGFiZWwpO1xuXG5cdFx0aWYgKE15Q29uZmlnLmNvbmZpZy5kZWJ1ZyAmJiBNeUNvbmZpZy5jb25maWcuZGVidWcubm9fcHVzaClcblx0XHR7XG5cdFx0XHRjb25zb2xlLndhcm4oYFtERUJVR10gc2tpcCBwdXNoYCk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRsZXQgb2sgPSB0cnVlO1xuXG5cdFx0XHRsZXQgY3VycmVudEhFQUROZXcgPSBnZXRIYXNoSEVBRChESVNUX05PVkVMKTtcblxuXHRcdFx0aWYgKGN1cnJlbnRIRUFEICE9IGN1cnJlbnRIRUFETmV3IHx8IGRpZmZPcmlnaW4oRElTVF9OT1ZFTCkpXG5cdFx0XHR7XG5cdFx0XHRcdGZzLmVuc3VyZUZpbGVTeW5jKHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICcud2FpdHB1c2gnKSk7XG5cblx0XHRcdFx0bGV0IGNwID0gcHVzaEdpdChESVNUX05PVkVMLCBnZXRQdXNoVXJsR2l0ZWUoR0lUX1NFVFRJTkdfRElTVF9OT1ZFTC51cmwpLCB0cnVlKTtcblxuXHRcdFx0XHRpZiAoY3AuZXJyb3IgfHwgY3Auc3RkZXJyICYmIGNwLnN0ZGVyci50b1N0cmluZygpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0b2sgPSBmYWxzZTtcblxuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYOeZvOeUn+mMr+iqpGApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXdhaXQgUHJvbWlzZS5kZWxheSgxMDAwKTtcblxuXHRcdFx0XHRjcmVhdGVQdWxsUmVxdWVzdHMoKTtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihg5rKS5pyJ5Lu75L2V6K6K5pu0IOW/veeVpSBQVVNIYCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChvaylcblx0XHRcdHtcblx0XHRcdFx0ZnMucmVtb3ZlU3luYyhwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnLndhaXRwdXNoJykpO1xuXG5cdFx0XHRcdGlmIChDYWNoZUNvbmZpZylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBjb25maWcgPSBmcy5yZWFkSlNPTlN5bmMoQ2FjaGVDb25maWcuZmlsZXBhdGgpO1xuXG5cdFx0XHRcdFx0Y29uZmlnLmRvbmUgPSAxO1xuXG5cdFx0XHRcdFx0Y29uZmlnLmxhc3RfcHVzaF9oZWFkID0gY3VycmVudEhFQUROZXc7XG5cblx0XHRcdFx0XHRjb25maWcubGFzdF90YXNrX2RhdGF0aW1lID0gRGF0ZS5ub3coKTtcblxuXHRcdFx0XHRcdGNvbnNvbGUub2soYOWwhyBjYWNoZSDmqpTmoYjlhafnmoQg5Z+36KGM54uA5oWLIOaUueeCuuW3suWujOaIkGApO1xuXG5cdFx0XHRcdFx0ZnMud3JpdGVKU09OU3luYyhDYWNoZUNvbmZpZy5maWxlcGF0aCwgY29uZmlnLCB7XG5cdFx0XHRcdFx0XHRzcGFjZXM6IDIsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRjb25zb2xlLmRpcihjb25maWcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc29sZS50aW1lRW5kKGxhYmVsKTtcblx0fSkoKTtcblxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIHJ1blRhc2soKVxue1xuXHRsZXQgYmluID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShyZXF1aXJlLnJlc29sdmUoJ0Bub2RlLW5vdmVsL3Rhc2snKSksICdiaW4vX25vdmVsLXRhc2suanMnKTtcblxuLy9cdGNvbnNvbGUubG9nKGJpbik7XG5cblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jKCdub2RlJywgW1xuXHRcdGJpbixcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBQUk9KRUNUX1JPT1QsXG5cdH0pO1xufVxuXG5cbiJdfQ==