"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const log_1 = require("../../lib/log");
const cross_spawn_1 = require("./cross-spawn");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGliLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkJBQXVDO0FBQ3ZDLHVDQUFvQztBQUNwQywrQ0FBa0Q7QUFFbEQsU0FBZ0IsWUFBWSxDQUFDLFNBQWlCLEVBQUUsU0FBaUIsRUFBRSxVQUFrQjtJQUVwRixVQUFVLEdBQUcsVUFBVSxJQUFJLFFBQVEsQ0FBQztJQUVwQyxhQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUV4QyxhQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUV0QyxrQkFBYyxDQUFDLEtBQUssRUFBRTtRQUNyQixRQUFRO1FBQ1IsSUFBSTtRQUNKLFVBQVU7S0FDVixFQUFFO1FBQ0YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDLENBQUM7SUFFSCxhQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUVwQyxPQUFPLCtCQUFpQixDQUFDLEtBQUssRUFBRTtRQUMvQixRQUFRO1FBQ1IsS0FBSztRQUNMLFdBQVc7UUFDWCxVQUFVO1FBQ1YsU0FBUztLQUNULEVBQUU7UUFDRixLQUFLLEVBQUUsU0FBUztRQUNoQixHQUFHLEVBQUUsU0FBUztLQUNkLENBQUMsQ0FBQztBQUNKLENBQUM7QUE3QkQsb0NBNkJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLi8uLic7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi8uLi9saWIvbG9nJztcbmltcG9ydCB7IGNyb3NzU3Bhd25TeW5jR2l0IH0gZnJvbSAnLi9jcm9zcy1zcGF3bic7XG5cbmV4cG9ydCBmdW5jdGlvbiBnaXRTZXRSZW1vdGUoUkVQT19QQVRIOiBzdHJpbmcsIHJlbW90ZVVybDogc3RyaW5nLCByZW1vdGVOYW1lOiBzdHJpbmcpXG57XG5cdHJlbW90ZU5hbWUgPSByZW1vdGVOYW1lIHx8ICdvcmlnaW4nO1xuXG5cdGNvbnNvbGUuZGVidWcoYOWYl+ippuimhuWvq+mBoOerr+ioreWumuaWvCAke1JFUE9fUEFUSH1gKTtcblxuXHRjb25zb2xlLmRlYnVnKGDnp7vpmaToiIrnmoTpgaDnq68gJHtyZW1vdGVOYW1lfWApO1xuXG5cdGNyb3NzU3Bhd25TeW5jKCdnaXQnLCBbXG5cdFx0J3JlbW90ZScsXG5cdFx0J3JtJyxcblx0XHRyZW1vdGVOYW1lLFxuXHRdLCB7XG5cdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRjd2Q6IFJFUE9fUEFUSCxcblx0fSk7XG5cblx0Y29uc29sZS5kZWJ1Zyhg6Kit5a6a6YGg56uvICR7cmVtb3RlTmFtZX1gKTtcblxuXHRyZXR1cm4gY3Jvc3NTcGF3blN5bmNHaXQoJ2dpdCcsIFtcblx0XHQncmVtb3RlJyxcblx0XHQnYWRkJyxcblx0XHQnLS1uby10YWdzJyxcblx0XHRyZW1vdGVOYW1lLFxuXHRcdHJlbW90ZVVybCxcblx0XSwge1xuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0Y3dkOiBSRVBPX1BBVEgsXG5cdH0pO1xufVxuIl19