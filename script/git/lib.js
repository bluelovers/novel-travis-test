"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitSetUpstream = exports.pushGit = exports.gitSetRemote = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGliLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUF1QztBQUN2Qyx1Q0FBb0M7QUFDcEMsZ0NBQTJDO0FBQzNDLCtDQUFrRDtBQUNsRCxrQ0FBMEQ7QUFDMUQseUNBQTRDO0FBRTVDLFNBQWdCLFlBQVksQ0FBQyxTQUFpQixFQUFFLFNBQWlCLEVBQUUsVUFBa0I7SUFFcEYsVUFBVSxHQUFHLFVBQVUsSUFBSSxRQUFRLENBQUM7SUFFcEMsYUFBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFFeEMsYUFBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFFdEMsa0JBQWMsQ0FBQyxLQUFLLEVBQUU7UUFDckIsUUFBUTtRQUNSLElBQUk7UUFDSixVQUFVO0tBQ1YsRUFBRTtRQUNGLEtBQUssRUFBRSxTQUFTO1FBQ2hCLEdBQUcsRUFBRSxTQUFTO0tBQ2QsQ0FBQyxDQUFDO0lBRUgsYUFBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFFcEMsT0FBTywrQkFBaUIsQ0FBQyxLQUFLLEVBQUU7UUFDL0IsUUFBUTtRQUNSLEtBQUs7UUFDTCxXQUFXO1FBQ1gsVUFBVTtRQUNWLFNBQVM7S0FDVCxFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBN0JELG9DQTZCQztBQUVELFNBQWdCLE9BQU8sQ0FBQyxTQUFpQixFQUFFLElBQVksRUFBRSxLQUFlO0lBRXZFLElBQUksSUFBSSxHQUFHO1FBQ1YsTUFBTTtRQUNOLFlBQVk7UUFDWixLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUztRQUM3QixJQUFJO0tBQ0osQ0FBQztJQUVGLElBQUksR0FBRyxpQkFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXhCLElBQUksY0FBTyxFQUNYO1FBQ0MsT0FBTyxJQUFJLENBQUM7S0FDWjtJQUVELGFBQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRTlCLElBQUksRUFBRSxHQUFHLGtCQUFjLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRTtRQUNwQyxLQUFLLEVBQUUsU0FBUztRQUNoQixHQUFHLEVBQUUsU0FBUztLQUNkLENBQUMsQ0FBQztJQUVILE9BQU8sRUFBRSxDQUFDO0FBQ1gsQ0FBQztBQXhCRCwwQkF3QkM7QUFFRCxTQUFnQixjQUFjLENBQUMsU0FBaUIsRUFBRSxlQUF1QixFQUFFLFdBQW1CO0lBRTdGLElBQUksUUFBUSxHQUFHLHVCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRTVDLGtCQUFjLENBQUMsS0FBSyxFQUFFO1FBQ3JCLFFBQVE7UUFDUixJQUFJO1FBQ0osZUFBZTtRQUNmLFdBQVc7S0FDWCxFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7SUFFSCxJQUFJLFFBQVEsR0FBRyx1QkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUU1QyxJQUFJLFFBQVEsSUFBSSxRQUFRLElBQUksUUFBUSxFQUNwQztRQUNDLGtCQUFjLENBQUMsS0FBSyxFQUFFO1lBQ3JCLFVBQVU7WUFDVixRQUFRO1NBQ1IsRUFBRTtZQUNGLEtBQUssRUFBRSxTQUFTO1lBQ2hCLEdBQUcsRUFBRSxTQUFTO1NBQ2QsQ0FBQyxDQUFDO0tBQ0g7QUFDRixDQUFDO0FBMUJELHdDQTBCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyb3NzU3Bhd25TeW5jIH0gZnJvbSAnLi4vLi4nO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vLi4vbGliL2xvZyc7XG5pbXBvcnQgeyBjdXJyZW50QnJhbmNoTmFtZSB9IGZyb20gJy4uL2dpdCc7XG5pbXBvcnQgeyBjcm9zc1NwYXduU3luY0dpdCB9IGZyb20gJy4vY3Jvc3Mtc3Bhd24nO1xuaW1wb3J0IHsgTk9fUFVTSCwgTk9UX0RPTkUsIFBST0pFQ1RfUk9PVCB9IGZyb20gJy4uL2luaXQnO1xuaW1wb3J0IHsgZmlsdGVyQXJndiB9IGZyb20gJy4uLy4uL2xpYi91dGlsJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdpdFNldFJlbW90ZShSRVBPX1BBVEg6IHN0cmluZywgcmVtb3RlVXJsOiBzdHJpbmcsIHJlbW90ZU5hbWU6IHN0cmluZylcbntcblx0cmVtb3RlTmFtZSA9IHJlbW90ZU5hbWUgfHwgJ29yaWdpbic7XG5cblx0Y29uc29sZS5kZWJ1Zyhg5ZiX6Kmm6KaG5a+r6YGg56uv6Kit5a6a5pa8ICR7UkVQT19QQVRIfWApO1xuXG5cdGNvbnNvbGUuZGVidWcoYOenu+mZpOiIiueahOmBoOerryAke3JlbW90ZU5hbWV9YCk7XG5cblx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHQncmVtb3RlJyxcblx0XHQncm0nLFxuXHRcdHJlbW90ZU5hbWUsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHRjb25zb2xlLmRlYnVnKGDoqK3lrprpgaDnq68gJHtyZW1vdGVOYW1lfWApO1xuXG5cdHJldHVybiBjcm9zc1NwYXduU3luY0dpdCgnZ2l0JywgW1xuXHRcdCdyZW1vdGUnLFxuXHRcdCdhZGQnLFxuXHRcdCctLW5vLXRhZ3MnLFxuXHRcdHJlbW90ZU5hbWUsXG5cdFx0cmVtb3RlVXJsLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwdXNoR2l0KFJFUE9fUEFUSDogc3RyaW5nLCByZXBvOiBzdHJpbmcsIGZvcmNlPzogYm9vbGVhbilcbntcblx0bGV0IGFyZ3YgPSBbXG5cdFx0J3B1c2gnLFxuXHRcdCctLXByb2dyZXNzJyxcblx0XHRmb3JjZSA/ICctLWZvcmNlJyA6IHVuZGVmaW5lZCxcblx0XHRyZXBvLFxuXHRdO1xuXG5cdGFyZ3YgPSBmaWx0ZXJBcmd2KGFyZ3YpO1xuXG5cdGlmIChOT19QVVNIKVxuXHR7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHRjb25zb2xlLmRlYnVnKGDlmJfoqabmjqjpgIEgJHtyZXBvfWApO1xuXG5cdGxldCBjcCA9IGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBhcmd2LCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG5cblx0cmV0dXJuIGNwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0U2V0VXBzdHJlYW0oUkVQT19QQVRIOiBzdHJpbmcsIHJlbW90ZUFuZEJyYW5jaDogc3RyaW5nLCBsb2NhbEJyYW5jaDogc3RyaW5nKVxue1xuXHRsZXQgb2xkX25hbWUgPSBjdXJyZW50QnJhbmNoTmFtZShSRVBPX1BBVEgpO1xuXG5cdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J2JyYW5jaCcsXG5cdFx0Jy11Jyxcblx0XHRyZW1vdGVBbmRCcmFuY2gsXG5cdFx0bG9jYWxCcmFuY2gsXG5cdF0sIHtcblx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdGN3ZDogUkVQT19QQVRILFxuXHR9KTtcblxuXHRsZXQgbmV3X25hbWUgPSBjdXJyZW50QnJhbmNoTmFtZShSRVBPX1BBVEgpO1xuXG5cdGlmIChvbGRfbmFtZSAmJiBvbGRfbmFtZSAhPSBuZXdfbmFtZSlcblx0e1xuXHRcdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0XHQnY2hlY2tvdXQnLFxuXHRcdFx0b2xkX25hbWUsXG5cdFx0XSwge1xuXHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdGN3ZDogUkVQT19QQVRILFxuXHRcdH0pO1xuXHR9XG59XG4iXX0=