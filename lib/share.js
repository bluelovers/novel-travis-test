"use strict";
/**
 * Created by user on 2018/12/6/006.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkShareStatesNotExists = exports.shareStates = exports.EnumShareStates = void 0;
const project_config_1 = require("../project.config");
const log_1 = require("../lib/log");
const fs_extra_1 = require("fs-extra");
const upath2_1 = require("upath2");
var EnumShareStates;
(function (EnumShareStates) {
    EnumShareStates["WAIT_CREATE_GIT"] = ".wait_create_git";
})(EnumShareStates = exports.EnumShareStates || (exports.EnumShareStates = {}));
function shareStates(name) {
    const file = upath2_1.resolve(project_config_1.default.cache_root, name);
    const data = {
        name,
        file,
        exists() {
            return fs_extra_1.pathExistsSync(file);
        },
        ensure() {
            return fs_extra_1.ensureFileSync(file);
        },
        remove() {
            return fs_extra_1.removeSync(file);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzaGFyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUVILHNEQUE4QztBQUc5QyxvQ0FBaUM7QUFDakMsdUNBQXNFO0FBQ3RFLG1DQUFpQztBQUVqQyxJQUFZLGVBR1g7QUFIRCxXQUFZLGVBQWU7SUFFMUIsdURBQW9DLENBQUE7QUFDckMsQ0FBQyxFQUhXLGVBQWUsR0FBZix1QkFBZSxLQUFmLHVCQUFlLFFBRzFCO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLElBQXFCO0lBRWhELE1BQU0sSUFBSSxHQUFHLGdCQUFPLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFckQsTUFBTSxJQUFJLEdBQUc7UUFDWixJQUFJO1FBQ0osSUFBSTtRQUVKLE1BQU07WUFFTCxPQUFPLHlCQUFjLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDNUIsQ0FBQztRQUNELE1BQU07WUFFTCxPQUFPLHlCQUFjLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDNUIsQ0FBQztRQUNELE1BQU07WUFFTCxPQUFPLHFCQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekIsQ0FBQztLQUNELENBQUM7SUFFRixPQUFPLElBQUksQ0FBQztBQUNiLENBQUM7QUF2QkQsa0NBdUJDO0FBRUQsU0FBZ0IseUJBQXlCLENBQUMsSUFBdUI7SUFFaEUsSUFBSSxJQUFZLENBQUM7SUFFakIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUM1QixJQUFJLElBQUksR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFdkMsSUFBSSxJQUFJLEVBQ1I7WUFDQyxhQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQzFDLElBQUksR0FBRyxLQUFLLENBQUM7U0FDYjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLElBQUksRUFDUjtRQUNDLGFBQU8sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFFM0QsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFBO0tBQ2Q7SUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQXhCRCw4REF3QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzEyLzYvMDA2LlxuICovXG5cbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi9saWIvbG9nJztcbmltcG9ydCB7IHBhdGhFeGlzdHNTeW5jLCBlbnN1cmVGaWxlU3luYywgcmVtb3ZlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICd1cGF0aDInO1xuXG5leHBvcnQgZW51bSBFbnVtU2hhcmVTdGF0ZXNcbntcblx0V0FJVF9DUkVBVEVfR0lUID0gJy53YWl0X2NyZWF0ZV9naXQnLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hhcmVTdGF0ZXMobmFtZTogRW51bVNoYXJlU3RhdGVzKVxue1xuXHRjb25zdCBmaWxlID0gcmVzb2x2ZShQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsIG5hbWUpO1xuXG5cdGNvbnN0IGRhdGEgPSB7XG5cdFx0bmFtZSxcblx0XHRmaWxlLFxuXG5cdFx0ZXhpc3RzKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gcGF0aEV4aXN0c1N5bmMoZmlsZSlcblx0XHR9LFxuXHRcdGVuc3VyZSgpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIGVuc3VyZUZpbGVTeW5jKGZpbGUpXG5cdFx0fSxcblx0XHRyZW1vdmUoKVxuXHRcdHtcblx0XHRcdHJldHVybiByZW1vdmVTeW5jKGZpbGUpO1xuXHRcdH0sXG5cdH07XG5cblx0cmV0dXJuIGRhdGE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1NoYXJlU3RhdGVzTm90RXhpc3RzKGxpc3Q6IEVudW1TaGFyZVN0YXRlc1tdKVxue1xuXHRsZXQgbmFtZTogc3RyaW5nO1xuXG5cdGxldCBib29sID0gbGlzdC5zb21lKF9uYW1lID0+IHtcblx0XHRsZXQgYm9vbCA9IHNoYXJlU3RhdGVzKF9uYW1lKS5leGlzdHMoKTtcblxuXHRcdGlmIChib29sKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoX25hbWUsIGBzaG91bGQgbm90IGV4aXN0c2ApO1xuXHRcdFx0bmFtZSA9IF9uYW1lO1xuXHRcdH1cblxuXHRcdHJldHVybiBib29sO1xuXHR9KTtcblxuXHRpZiAoYm9vbClcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoJ1twcm9jZXNzLmV4aXRdJywgbmFtZSwgYHNob3VsZCBub3QgZXhpc3RzYCk7XG5cblx0XHRwcm9jZXNzLmV4aXQoKVxuXHR9XG5cblx0cmV0dXJuICFib29sO1xufVxuIl19