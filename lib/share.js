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
    let name;
    let bool = list.some(_name => {
        let bool = shareStates(_name).exists();
        if (bool) {
            log_1.default.error(_name, `should not exists`);
            name = _name;
        }
        return bool;
    });
    if (bool) {
        log_1.default.error('[process.exit]', name, `should not exists`);
        process.exit();
    }
    return !bool;
}
exports.checkShareStatesNotExists = checkShareStatesNotExists;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzaGFyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsc0RBQThDO0FBQzlDLCtCQUFnQztBQUNoQywrQkFBK0I7QUFDL0Isb0NBQWlDO0FBRWpDLElBQVksZUFHWDtBQUhELFdBQVksZUFBZTtJQUUxQix1REFBb0MsQ0FBQTtBQUNyQyxDQUFDLEVBSFcsZUFBZSxHQUFmLHVCQUFlLEtBQWYsdUJBQWUsUUFHMUI7QUFFRCxTQUFnQixXQUFXLENBQUMsSUFBcUI7SUFFaEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUUxRCxNQUFNLElBQUksR0FBRztRQUNaLElBQUk7UUFDSixJQUFJO1FBRUosTUFBTTtZQUVMLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMvQixDQUFDO1FBQ0QsTUFBTTtZQUVMLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMvQixDQUFDO1FBQ0QsTUFBTTtZQUVMLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDO0tBQ0QsQ0FBQztJQUVGLE9BQU8sSUFBSSxDQUFDO0FBQ2IsQ0FBQztBQXZCRCxrQ0F1QkM7QUFFRCxTQUFnQix5QkFBeUIsQ0FBQyxJQUF1QjtJQUVoRSxJQUFJLElBQVksQ0FBQztJQUVqQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQzVCLElBQUksSUFBSSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUV2QyxJQUFJLElBQUksRUFDUjtZQUNDLGFBQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDMUMsSUFBSSxHQUFHLEtBQUssQ0FBQztTQUNiO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDLENBQUMsQ0FBQztJQUVILElBQUksSUFBSSxFQUNSO1FBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUUzRCxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUE7S0FDZDtJQUVELE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBeEJELDhEQXdCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvMTIvNi8wMDYuXG4gKi9cblxuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuXG5leHBvcnQgZW51bSBFbnVtU2hhcmVTdGF0ZXNcbntcblx0V0FJVF9DUkVBVEVfR0lUID0gJy53YWl0X2NyZWF0ZV9naXQnLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hhcmVTdGF0ZXMobmFtZTogRW51bVNoYXJlU3RhdGVzKVxue1xuXHRjb25zdCBmaWxlID0gcGF0aC5yZXNvbHZlKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgbmFtZSk7XG5cblx0Y29uc3QgZGF0YSA9IHtcblx0XHRuYW1lLFxuXHRcdGZpbGUsXG5cblx0XHRleGlzdHMoKVxuXHRcdHtcblx0XHRcdHJldHVybiBmcy5wYXRoRXhpc3RzU3luYyhmaWxlKVxuXHRcdH0sXG5cdFx0ZW5zdXJlKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gZnMuZW5zdXJlRmlsZVN5bmMoZmlsZSlcblx0XHR9LFxuXHRcdHJlbW92ZSgpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIGZzLnJlbW92ZVN5bmMoZmlsZSk7XG5cdFx0fSxcblx0fTtcblxuXHRyZXR1cm4gZGF0YTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrU2hhcmVTdGF0ZXNOb3RFeGlzdHMobGlzdDogRW51bVNoYXJlU3RhdGVzW10pXG57XG5cdGxldCBuYW1lOiBzdHJpbmc7XG5cblx0bGV0IGJvb2wgPSBsaXN0LnNvbWUoX25hbWUgPT4ge1xuXHRcdGxldCBib29sID0gc2hhcmVTdGF0ZXMoX25hbWUpLmV4aXN0cygpO1xuXG5cdFx0aWYgKGJvb2wpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5lcnJvcihfbmFtZSwgYHNob3VsZCBub3QgZXhpc3RzYCk7XG5cdFx0XHRuYW1lID0gX25hbWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGJvb2w7XG5cdH0pO1xuXG5cdGlmIChib29sKVxuXHR7XG5cdFx0Y29uc29sZS5lcnJvcignW3Byb2Nlc3MuZXhpdF0nLCBuYW1lLCBgc2hvdWxkIG5vdCBleGlzdHNgKTtcblxuXHRcdHByb2Nlc3MuZXhpdCgpXG5cdH1cblxuXHRyZXR1cm4gIWJvb2w7XG59XG4iXX0=