"use strict";
/**
 * Created by user on 2018/7/28/028.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const toc_1 = require("@node-novel/toc");
const index_1 = require("../index");
const share_1 = require("../lib/share");
const project_config_1 = require("../project.config");
const path = require("path");
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT
]) && toc_1.processToc(project_config_1.default.novel_root)
    .then(async function (ls) {
    await toc_1.Promise.each(Object.keys(ls), function (pathMain) {
        let file = path.join(project_config_1.default.novel_root, pathMain, 'README.md');
        return index_1.crossSpawnAsync('git', [
            'add',
            '--verbose',
            file,
        ], {
            stdio: 'inherit',
            cwd: project_config_1.default.novel_root,
        });
    });
    return index_1.crossSpawnAsync('git', [
        'commit',
        '-a',
        '-m',
        `[TOC] auto update toc`,
    ], {
        stdio: 'inherit',
        cwd: project_config_1.default.novel_root,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NyZWF0ZV90b2MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfY3JlYXRlX3RvYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsYUFBYTtBQUNiLHlDQUFzRDtBQUN0RCxvQ0FBMkM7QUFDM0Msd0NBQTBFO0FBQzFFLHNEQUE4QztBQUM5Qyw2QkFBOEI7QUFFOUIsaUNBQXlCLENBQUM7SUFDekIsdUJBQWUsQ0FBQyxlQUFlO0NBQy9CLENBQUMsSUFBSSxnQkFBVSxDQUFDLHdCQUFhLENBQUMsVUFBVSxDQUFDO0tBQ3hDLElBQUksQ0FBQyxLQUFLLFdBQVcsRUFBRTtJQUV2QixNQUFNLGFBQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxVQUFVLFFBQVE7UUFFckQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFdEUsT0FBTyx1QkFBZSxDQUFDLEtBQUssRUFBRTtZQUM3QixLQUFLO1lBQ0wsV0FBVztZQUNYLElBQUk7U0FDSixFQUFFO1lBQ0YsS0FBSyxFQUFFLFNBQVM7WUFDaEIsR0FBRyxFQUFFLHdCQUFhLENBQUMsVUFBVTtTQUM3QixDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sdUJBQWUsQ0FBQyxLQUFLLEVBQUU7UUFDN0IsUUFBUTtRQUNSLElBQUk7UUFDSixJQUFJO1FBQ0osdUJBQXVCO0tBQ3ZCLEVBQUU7UUFDRixLQUFLLEVBQUUsU0FBUztRQUNoQixHQUFHLEVBQUUsd0JBQWEsQ0FBQyxVQUFVO0tBQzdCLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC83LzI4LzAyOC5cbiAqL1xuXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgeyBwcm9jZXNzVG9jLCBQcm9taXNlIH0gZnJvbSAnQG5vZGUtbm92ZWwvdG9jJztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYyB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IGNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMsIEVudW1TaGFyZVN0YXRlcyB9IGZyb20gJy4uL2xpYi9zaGFyZSc7XG5pbXBvcnQgUHJvamVjdENvbmZpZyBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhbXG5cdEVudW1TaGFyZVN0YXRlcy5XQUlUX0NSRUFURV9HSVRcbl0pICYmIHByb2Nlc3NUb2MoUHJvamVjdENvbmZpZy5ub3ZlbF9yb290KVxuXHQudGhlbihhc3luYyBmdW5jdGlvbiAobHMpXG5cdHtcblx0XHRhd2FpdCBQcm9taXNlLmVhY2goT2JqZWN0LmtleXMobHMpLCBmdW5jdGlvbiAocGF0aE1haW4pXG5cdFx0e1xuXHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5ub3ZlbF9yb290LCBwYXRoTWFpbiwgJ1JFQURNRS5tZCcpO1xuXG5cdFx0XHRyZXR1cm4gY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHQnLS12ZXJib3NlJyxcblx0XHRcdFx0ZmlsZSxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBjcm9zc1NwYXduQXN5bmMoJ2dpdCcsIFtcblx0XHRcdCdjb21taXQnLFxuXHRcdFx0Jy1hJyxcblx0XHRcdCctbScsXG5cdFx0XHRgW1RPQ10gYXV0byB1cGRhdGUgdG9jYCxcblx0XHRdLCB7XG5cdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0Y3dkOiBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3QsXG5cdFx0fSk7XG5cdH0pXG47XG4iXX0=