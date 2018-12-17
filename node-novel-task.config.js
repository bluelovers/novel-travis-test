"use strict";
/**
 * Created by user on 2018/5/15/015.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("./lib/cache");
const segment_1 = require("./script/segment");
const project_config_1 = require("./project.config");
let DIST_NOVEL = project_config_1.default.novel_root;
//console.log(`目前設定為 預設值 ${__filename}`);
exports.default = {
    cwd: DIST_NOVEL,
    dist_novel: DIST_NOVEL,
    //	disableInit: true,
    //	nocache: true,
    //	debug: {
    //		no_push: true,
    //	},
    task: {
        main(data, name) {
            //			console.log('MAIN', name);
            //console.log(data);
        },
        async novel(data, name) {
            //			console.log('NOVEL', data.pathMain, data.novelID, data.length);
            //			console.log(data);
            if (data.pathMain.indexOf('"') !== -1 || data.novelID.match(/^\d+$/)) {
                console.error('[ERROR]', data);
            }
            else {
                await cache_1.cacheFileList(data);
            }
            //			await runSegment(data);
            /*
            if (1 || 1 && data.pathMain == 'cm')
            {
                await doSegmentGlob({
                    pathMain: data.pathMain,
                    novelID: data.novelID,
                    novel_root: DIST_NOVEL,
                })
                    .catch(function (err)
                    {
                        console.error(err.toString());
                    })
                    .then(async function (ret)
                    {
                        if (ret && ret.count && ret.count.changed)
                        {
                            await crossSpawnAsync('git', [
                                'commit',
                                '-a',
                                '-m',
                                `[Segment] ${data.pathMain} ${data.novelID}`,
                            ], {
                                stdio: 'inherit',
                                cwd: DIST_NOVEL,
                            })
                                .then(function (r)
                                {
                                    return r;
                                })
                            ;
                        }

                        return ret;
                    })
                ;
            }
            */
        },
        async file(data, file) {
            //console.log('FILE', data.subpath);
            //console.log(data);
            //			console.log(data.subpath, data.status);
            //console.log(data, file);
            //			if (data.basename.match(/\.txt$/))
            //			{
            //				await runSegment(data, data.subpath);
            //			}
        },
        async before_end(data, ls_map, temp) {
            await cache_1.cacheDiffNovelList(data);
            await segment_1.runSegment();
        }
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS1ub3ZlbC10YXNrLmNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5vZGUtbm92ZWwtdGFzay5jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUtILHVDQUFnRTtBQUNoRSw4Q0FBb0U7QUFFcEUscURBQTZDO0FBTTdDLElBQUksVUFBVSxHQUFHLHdCQUFhLENBQUMsVUFBVSxDQUFDO0FBRTFDLHlDQUF5QztBQUV6QyxrQkFBZTtJQUNkLEdBQUcsRUFBRSxVQUFVO0lBQ2YsVUFBVSxFQUFFLFVBQVU7SUFFdkIscUJBQXFCO0lBRXJCLGlCQUFpQjtJQUVqQixXQUFXO0lBQ1gsa0JBQWtCO0lBQ2xCLEtBQUs7SUFFSixJQUFJLEVBQUU7UUFDTCxJQUFJLENBQUMsSUFBa0IsRUFBRSxJQUFZO1lBRXZDLCtCQUErQjtZQUM1QixvQkFBb0I7UUFDckIsQ0FBQztRQUNELEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBbUIsRUFBRSxJQUFZO1lBRS9DLG9FQUFvRTtZQUVwRSx1QkFBdUI7WUFFcEIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFDcEU7Z0JBQ0MsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDL0I7aUJBRUQ7Z0JBQ0MsTUFBTSxxQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzFCO1lBRUosNEJBQTRCO1lBRXpCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Y0FvQ0U7UUFDSCxDQUFDO1FBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFrQixFQUFFLElBQVk7WUFFMUMsb0NBQW9DO1lBQ3BDLG9CQUFvQjtZQUV2Qiw0Q0FBNEM7WUFFekMsMEJBQTBCO1lBRTdCLHVDQUF1QztZQUN2QyxNQUFNO1lBQ04sMkNBQTJDO1lBQzNDLE1BQU07UUFFSixDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUF5QyxFQUFFLE1BQWEsRUFBRSxJQUFZO1lBRXRGLE1BQU0sMEJBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFL0IsTUFBTSxvQkFBVSxFQUFFLENBQUM7UUFDcEIsQ0FBQztLQUNEO0NBQ1UsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvNS8xNS8wMTUuXG4gKi9cblxuaW1wb3J0IHsgSUNvbmZpZywgSUxpc3RGaWxlUm93LCBJTGlzdE1haW5Sb3csIElMaXN0Tm92ZWxSb3cgfSBmcm9tICdAbm9kZS1ub3ZlbC90YXNrJztcbmltcG9ydCBub3ZlbERpZmZGcm9tTG9nLCB7IElUZW1wIH0gZnJvbSAnQG5vZGUtbm92ZWwvdGFzayc7XG5pbXBvcnQgeyBjcm9zc1NwYXduQXN5bmMsIGNyb3NzU3Bhd25PdXRwdXQsIGNyb3NzU3Bhd25TeW5jIH0gZnJvbSAnLi9pbmRleCc7XG5pbXBvcnQgeyBjYWNoZURpZmZOb3ZlbExpc3QsIGNhY2hlRmlsZUxpc3QgfSBmcm9tICcuL2xpYi9jYWNoZSc7XG5pbXBvcnQgeyBfcGF0aCwgZG9TZWdtZW50R2xvYiwgcnVuU2VnbWVudCB9IGZyb20gJy4vc2NyaXB0L3NlZ21lbnQnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHsgZmlsdGVyTm90RGVsZXRlIH0gZnJvbSAnQG5vZGUtbm92ZWwvdGFzay9saWIvaW5kZXgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuXG5sZXQgRElTVF9OT1ZFTCA9IFByb2plY3RDb25maWcubm92ZWxfcm9vdDtcblxuLy9jb25zb2xlLmxvZyhg55uu5YmN6Kit5a6a54K6IOmgkOioreWAvCAke19fZmlsZW5hbWV9YCk7XG5cbmV4cG9ydCBkZWZhdWx0IHtcblx0Y3dkOiBESVNUX05PVkVMLFxuXHRkaXN0X25vdmVsOiBESVNUX05PVkVMLFxuXG4vL1x0ZGlzYWJsZUluaXQ6IHRydWUsXG5cbi8vXHRub2NhY2hlOiB0cnVlLFxuXG4vL1x0ZGVidWc6IHtcbi8vXHRcdG5vX3B1c2g6IHRydWUsXG4vL1x0fSxcblxuXHR0YXNrOiB7XG5cdFx0bWFpbihkYXRhOiBJTGlzdE1haW5Sb3csIG5hbWU6IHN0cmluZylcblx0XHR7XG4vL1x0XHRcdGNvbnNvbGUubG9nKCdNQUlOJywgbmFtZSk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGRhdGEpO1xuXHRcdH0sXG5cdFx0YXN5bmMgbm92ZWwoZGF0YTogSUxpc3ROb3ZlbFJvdywgbmFtZTogc3RyaW5nKVxuXHRcdHtcbi8vXHRcdFx0Y29uc29sZS5sb2coJ05PVkVMJywgZGF0YS5wYXRoTWFpbiwgZGF0YS5ub3ZlbElELCBkYXRhLmxlbmd0aCk7XG5cbi8vXHRcdFx0Y29uc29sZS5sb2coZGF0YSk7XG5cblx0XHRcdGlmIChkYXRhLnBhdGhNYWluLmluZGV4T2YoJ1wiJykgIT09IC0xIHx8IGRhdGEubm92ZWxJRC5tYXRjaCgvXlxcZCskLykpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tFUlJPUl0nLCBkYXRhKTtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdHtcblx0XHRcdFx0YXdhaXQgY2FjaGVGaWxlTGlzdChkYXRhKTtcblx0XHRcdH1cblxuLy9cdFx0XHRhd2FpdCBydW5TZWdtZW50KGRhdGEpO1xuXG5cdFx0XHQvKlxuXHRcdFx0aWYgKDEgfHwgMSAmJiBkYXRhLnBhdGhNYWluID09ICdjbScpXG5cdFx0XHR7XG5cdFx0XHRcdGF3YWl0IGRvU2VnbWVudEdsb2Ioe1xuXHRcdFx0XHRcdHBhdGhNYWluOiBkYXRhLnBhdGhNYWluLFxuXHRcdFx0XHRcdG5vdmVsSUQ6IGRhdGEubm92ZWxJRCxcblx0XHRcdFx0XHRub3ZlbF9yb290OiBESVNUX05PVkVMLFxuXHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoZXJyKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyLnRvU3RyaW5nKCkpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHJldClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpZiAocmV0ICYmIHJldC5jb3VudCAmJiByZXQuY291bnQuY2hhbmdlZClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0YXdhaXQgY3Jvc3NTcGF3bkFzeW5jKCdnaXQnLCBbXG5cdFx0XHRcdFx0XHRcdFx0J2NvbW1pdCcsXG5cdFx0XHRcdFx0XHRcdFx0Jy1hJyxcblx0XHRcdFx0XHRcdFx0XHQnLW0nLFxuXHRcdFx0XHRcdFx0XHRcdGBbU2VnbWVudF0gJHtkYXRhLnBhdGhNYWlufSAke2RhdGEubm92ZWxJRH1gLFxuXHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0XHRcdFx0XHRjd2Q6IERJU1RfTk9WRUwsXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKHIpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHI7XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdDtcblx0XHRcdH1cblx0XHRcdCovXG5cdFx0fSxcblx0XHRhc3luYyBmaWxlKGRhdGE6IElMaXN0RmlsZVJvdywgZmlsZTogc3RyaW5nKVxuXHRcdHtcblx0XHRcdC8vY29uc29sZS5sb2coJ0ZJTEUnLCBkYXRhLnN1YnBhdGgpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhkYXRhKTtcblxuLy9cdFx0XHRjb25zb2xlLmxvZyhkYXRhLnN1YnBhdGgsIGRhdGEuc3RhdHVzKTtcblxuXHRcdFx0Ly9jb25zb2xlLmxvZyhkYXRhLCBmaWxlKTtcblxuLy9cdFx0XHRpZiAoZGF0YS5iYXNlbmFtZS5tYXRjaCgvXFwudHh0JC8pKVxuLy9cdFx0XHR7XG4vL1x0XHRcdFx0YXdhaXQgcnVuU2VnbWVudChkYXRhLCBkYXRhLnN1YnBhdGgpO1xuLy9cdFx0XHR9XG5cblx0XHR9LFxuXG5cdFx0YXN5bmMgYmVmb3JlX2VuZChkYXRhOiBSZXR1cm5UeXBlPHR5cGVvZiBub3ZlbERpZmZGcm9tTG9nPiwgbHNfbWFwOiBhbnlbXSwgdGVtcD86IElUZW1wKVxuXHRcdHtcblx0XHRcdGF3YWl0IGNhY2hlRGlmZk5vdmVsTGlzdChkYXRhKTtcblxuXHRcdFx0YXdhaXQgcnVuU2VnbWVudCgpO1xuXHRcdH1cblx0fSxcbn0gYXMgSUNvbmZpZ1xuIl19