"use strict";
/**
 * Created by user on 2018/12/6/006.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const project_config_1 = require("../project.config");
const path = require("upath2");
const fs = require("fs-extra");
const log_1 = require("../lib/log");
var EnumShareStates;
(function (EnumShareStates) {
    EnumShareStates["WAIT_CREATE_GIT"] = ".wait_create_git";
})(EnumShareStates = exports.EnumShareStates || (exports.EnumShareStates = {}));
function shareStates(name) {
    const file = path.resolve(project_config_1.default.cache_root, name);
    const data = {
        name,
        file,
        exists() {
            return fs.pathExistsSync(file);
        },
        ensure() {
            return fs.ensureFileSync(file);
        },
        remove() {
            return fs.removeSync(file);
        },
    };
    return data;
}
exports.shareStates = shareStates;
function checkShareStatesNotExists(list) {
    let bool = list.some(name => {
        let bool = shareStates(name).exists();
        bool && log_1.default.error(name, `should not exists`);
        return bool;
    });
    if (bool) {
        log_1.default.error('[process.exit]', name, `should not exists`);
        process.exit();
    }
    return !bool;
}
exports.checkShareStatesNotExists = checkShareStatesNotExists;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzaGFyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsc0RBQThDO0FBQzlDLCtCQUFnQztBQUNoQywrQkFBK0I7QUFDL0Isb0NBQWlDO0FBRWpDLElBQVksZUFHWDtBQUhELFdBQVksZUFBZTtJQUUxQix1REFBb0MsQ0FBQTtBQUNyQyxDQUFDLEVBSFcsZUFBZSxHQUFmLHVCQUFlLEtBQWYsdUJBQWUsUUFHMUI7QUFFRCxTQUFnQixXQUFXLENBQUMsSUFBcUI7SUFFaEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUUxRCxNQUFNLElBQUksR0FBRztRQUNaLElBQUk7UUFDSixJQUFJO1FBRUosTUFBTTtZQUVMLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMvQixDQUFDO1FBQ0QsTUFBTTtZQUVMLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMvQixDQUFDO1FBQ0QsTUFBTTtZQUVMLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDO0tBQ0QsQ0FBQztJQUVGLE9BQU8sSUFBSSxDQUFDO0FBQ2IsQ0FBQztBQXZCRCxrQ0F1QkM7QUFFRCxTQUFnQix5QkFBeUIsQ0FBQyxJQUF1QjtJQUVoRSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzNCLElBQUksSUFBSSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUV0QyxJQUFJLElBQUksYUFBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUVqRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxJQUFJLEVBQ1I7UUFDQyxhQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBRTNELE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtLQUNkO0lBRUQsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNkLENBQUM7QUFsQkQsOERBa0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC8xMi82LzAwNi5cbiAqL1xuXG5pbXBvcnQgUHJvamVjdENvbmZpZyBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi4vbGliL2xvZyc7XG5cbmV4cG9ydCBlbnVtIEVudW1TaGFyZVN0YXRlc1xue1xuXHRXQUlUX0NSRUFURV9HSVQgPSAnLndhaXRfY3JlYXRlX2dpdCcsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaGFyZVN0YXRlcyhuYW1lOiBFbnVtU2hhcmVTdGF0ZXMpXG57XG5cdGNvbnN0IGZpbGUgPSBwYXRoLnJlc29sdmUoUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCBuYW1lKTtcblxuXHRjb25zdCBkYXRhID0ge1xuXHRcdG5hbWUsXG5cdFx0ZmlsZSxcblxuXHRcdGV4aXN0cygpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIGZzLnBhdGhFeGlzdHNTeW5jKGZpbGUpXG5cdFx0fSxcblx0XHRlbnN1cmUoKVxuXHRcdHtcblx0XHRcdHJldHVybiBmcy5lbnN1cmVGaWxlU3luYyhmaWxlKVxuXHRcdH0sXG5cdFx0cmVtb3ZlKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gZnMucmVtb3ZlU3luYyhmaWxlKTtcblx0XHR9LFxuXHR9O1xuXG5cdHJldHVybiBkYXRhO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tTaGFyZVN0YXRlc05vdEV4aXN0cyhsaXN0OiBFbnVtU2hhcmVTdGF0ZXNbXSlcbntcblx0bGV0IGJvb2wgPSBsaXN0LnNvbWUobmFtZSA9PiB7XG5cdFx0bGV0IGJvb2wgPSBzaGFyZVN0YXRlcyhuYW1lKS5leGlzdHMoKTtcblxuXHRcdGJvb2wgJiYgY29uc29sZS5lcnJvcihuYW1lLCBgc2hvdWxkIG5vdCBleGlzdHNgKTtcblxuXHRcdHJldHVybiBib29sO1xuXHR9KTtcblxuXHRpZiAoYm9vbClcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoJ1twcm9jZXNzLmV4aXRdJywgbmFtZSwgYHNob3VsZCBub3QgZXhpc3RzYCk7XG5cblx0XHRwcm9jZXNzLmV4aXQoKVxuXHR9XG5cblx0cmV0dXJuICFib29sO1xufVxuIl19