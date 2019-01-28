"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const log_1 = require("../../lib/log");
const git_1 = require("../git");
const cross_spawn_1 = require("./cross-spawn");
const init_1 = require("../init");
const util_1 = require("../../lib/util");
function gitSetRemote(REPO_PATH, remoteUrl, remoteName) {
    remoteName = remoteName || 'origin';
    log_1.default.debug(`嘗試覆寫遠端設定於 ${REPO_PATH}`);
    log_1.default.debug(`移除舊的遠端 ${remoteName}`);
    __1.crossSpawnSync('git', [
        'remote',
        'rm',
        remoteName,
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
    log_1.default.debug(`設定遠端 ${remoteName}`);
    return cross_spawn_1.crossSpawnSyncGit('git', [
        'remote',
        'add',
        '--no-tags',
        remoteName,
        remoteUrl,
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
}
exports.gitSetRemote = gitSetRemote;
function pushGit(REPO_PATH, repo, force) {
    let argv = [
        'push',
        '--progress',
        force ? '--force' : undefined,
        repo,
    ];
    argv = util_1.filterArgv(argv);
    if (init_1.NO_PUSH) {
        return null;
    }
    log_1.default.debug(`嘗試推送 ${repo}`);
    let cp = __1.crossSpawnSync('git', argv, {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
    return cp;
}
exports.pushGit = pushGit;
function gitSetUpstream(REPO_PATH, remoteAndBranch, localBranch) {
    let old_name = git_1.currentBranchName(REPO_PATH);
    __1.crossSpawnSync('git', [
        'branch',
        '-u',
        remoteAndBranch,
        localBranch,
    ], {
        stdio: 'inherit',
        cwd: REPO_PATH,
    });
    let new_name = git_1.currentBranchName(REPO_PATH);
    if (old_name && old_name != new_name) {
        __1.crossSpawnSync('git', [
            'checkout',
            old_name,
        ], {
            stdio: 'inherit',
            cwd: REPO_PATH,
        });
    }
}
exports.gitSetUpstream = gitSetUpstream;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGliLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkJBQXVDO0FBQ3ZDLHVDQUFvQztBQUNwQyxnQ0FBMkM7QUFDM0MsK0NBQWtEO0FBQ2xELGtDQUEwRDtBQUMxRCx5Q0FBNEM7QUFFNUMsU0FBZ0IsWUFBWSxDQUFDLFNBQWlCLEVBQUUsU0FBaUIsRUFBRSxVQUFrQjtJQUVwRixVQUFVLEdBQUcsVUFBVSxJQUFJLFFBQVEsQ0FBQztJQUVwQyxhQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUV4QyxhQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUV0QyxrQkFBYyxDQUFDLEtBQUssRUFBRTtRQUNyQixRQUFRO1FBQ1IsSUFBSTtRQUNKLFVBQVU7S0FDVixFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7SUFFSCxhQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUVwQyxPQUFPLCtCQUFpQixDQUFDLEtBQUssRUFBRTtRQUMvQixRQUFRO1FBQ1IsS0FBSztRQUNMLFdBQVc7UUFDWCxVQUFVO1FBQ1YsU0FBUztLQUNULEVBQUU7UUFDRixLQUFLLEVBQUUsU0FBUztRQUNoQixHQUFHLEVBQUUsU0FBUztLQUNkLENBQUMsQ0FBQztBQUNKLENBQUM7QUE3QkQsb0NBNkJDO0FBRUQsU0FBZ0IsT0FBTyxDQUFDLFNBQWlCLEVBQUUsSUFBWSxFQUFFLEtBQWU7SUFFdkUsSUFBSSxJQUFJLEdBQUc7UUFDVixNQUFNO1FBQ04sWUFBWTtRQUNaLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTO1FBQzdCLElBQUk7S0FDSixDQUFDO0lBRUYsSUFBSSxHQUFHLGlCQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFeEIsSUFBSSxjQUFPLEVBQ1g7UUFDQyxPQUFPLElBQUksQ0FBQztLQUNaO0lBRUQsYUFBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLENBQUM7SUFFOUIsSUFBSSxFQUFFLEdBQUcsa0JBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ3BDLEtBQUssRUFBRSxTQUFTO1FBQ2hCLEdBQUcsRUFBRSxTQUFTO0tBQ2QsQ0FBQyxDQUFDO0lBRUgsT0FBTyxFQUFFLENBQUM7QUFDWCxDQUFDO0FBeEJELDBCQXdCQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxTQUFpQixFQUFFLGVBQXVCLEVBQUUsV0FBbUI7SUFFN0YsSUFBSSxRQUFRLEdBQUcsdUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFNUMsa0JBQWMsQ0FBQyxLQUFLLEVBQUU7UUFDckIsUUFBUTtRQUNSLElBQUk7UUFDSixlQUFlO1FBQ2YsV0FBVztLQUNYLEVBQUU7UUFDRixLQUFLLEVBQUUsU0FBUztRQUNoQixHQUFHLEVBQUUsU0FBUztLQUNkLENBQUMsQ0FBQztJQUVILElBQUksUUFBUSxHQUFHLHVCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRTVDLElBQUksUUFBUSxJQUFJLFFBQVEsSUFBSSxRQUFRLEVBQ3BDO1FBQ0Msa0JBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDckIsVUFBVTtZQUNWLFFBQVE7U0FDUixFQUFFO1lBQ0YsS0FBSyxFQUFFLFNBQVM7WUFDaEIsR0FBRyxFQUFFLFNBQVM7U0FDZCxDQUFDLENBQUM7S0FDSDtBQUNGLENBQUM7QUExQkQsd0NBMEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLi8uLic7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi8uLi9saWIvbG9nJztcbmltcG9ydCB7IGN1cnJlbnRCcmFuY2hOYW1lIH0gZnJvbSAnLi4vZ2l0JztcbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jR2l0IH0gZnJvbSAnLi9jcm9zcy1zcGF3bic7XG5pbXBvcnQgeyBOT19QVVNILCBOT1RfRE9ORSwgUFJPSkVDVF9ST09UIH0gZnJvbSAnLi4vaW5pdCc7XG5pbXBvcnQgeyBmaWx0ZXJBcmd2IH0gZnJvbSAnLi4vLi4vbGliL3V0aWwnO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2l0U2V0UmVtb3RlKFJFUE9fUEFUSDogc3RyaW5nLCByZW1vdGVVcmw6IHN0cmluZywgcmVtb3RlTmFtZTogc3RyaW5nKVxue1xuXHRyZW1vdGVOYW1lID0gcmVtb3RlTmFtZSB8fCAnb3JpZ2luJztcblxuXHRjb25zb2xlLmRlYnVnKGDlmJfoqabopoblr6vpgaDnq6/oqK3lrprmlrwgJHtSRVBPX1BBVEh9YCk7XG5cblx0Y29uc29sZS5kZWJ1Zyhg56e76Zmk6IiK55qE6YGg56uvICR7cmVtb3RlTmFtZX1gKTtcblxuXHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdCdyZW1vdGUnLFxuXHRcdCdybScsXG5cdFx0cmVtb3RlTmFtZSxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xuXG5cdGNvbnNvbGUuZGVidWcoYOioreWumumBoOerryAke3JlbW90ZU5hbWV9YCk7XG5cblx0cmV0dXJuIGNyb3NzU3Bhd25TeW5jR2l0KCdnaXQnLCBbXG5cdFx0J3JlbW90ZScsXG5cdFx0J2FkZCcsXG5cdFx0Jy0tbm8tdGFncycsXG5cdFx0cmVtb3RlTmFtZSxcblx0XHRyZW1vdGVVcmwsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHB1c2hHaXQoUkVQT19QQVRIOiBzdHJpbmcsIHJlcG86IHN0cmluZywgZm9yY2U/OiBib29sZWFuKVxue1xuXHRsZXQgYXJndiA9IFtcblx0XHQncHVzaCcsXG5cdFx0Jy0tcHJvZ3Jlc3MnLFxuXHRcdGZvcmNlID8gJy0tZm9yY2UnIDogdW5kZWZpbmVkLFxuXHRcdHJlcG8sXG5cdF07XG5cblx0YXJndiA9IGZpbHRlckFyZ3YoYXJndik7XG5cblx0aWYgKE5PX1BVU0gpXG5cdHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdGNvbnNvbGUuZGVidWcoYOWYl+ippuaOqOmAgSAke3JlcG99YCk7XG5cblx0bGV0IGNwID0gY3Jvc3NTcGF3blN5bmMoJ2dpdCcsIGFyZ3YsIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHRyZXR1cm4gY3A7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnaXRTZXRVcHN0cmVhbShSRVBPX1BBVEg6IHN0cmluZywgcmVtb3RlQW5kQnJhbmNoOiBzdHJpbmcsIGxvY2FsQnJhbmNoOiBzdHJpbmcpXG57XG5cdGxldCBvbGRfbmFtZSA9IGN1cnJlbnRCcmFuY2hOYW1lKFJFUE9fUEFUSCk7XG5cblx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHQnYnJhbmNoJyxcblx0XHQnLXUnLFxuXHRcdHJlbW90ZUFuZEJyYW5jaCxcblx0XHRsb2NhbEJyYW5jaCxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xuXG5cdGxldCBuZXdfbmFtZSA9IGN1cnJlbnRCcmFuY2hOYW1lKFJFUE9fUEFUSCk7XG5cblx0aWYgKG9sZF9uYW1lICYmIG9sZF9uYW1lICE9IG5ld19uYW1lKVxuXHR7XG5cdFx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdCdjaGVja291dCcsXG5cdFx0XHRvbGRfbmFtZSxcblx0XHRdLCB7XG5cdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdFx0fSk7XG5cdH1cbn1cbiJdfQ==