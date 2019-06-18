"use strict";
/**
 * Created by user on 2018/12/11/011.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const project_config_1 = require("../../project.config");
const path = require("upath2");
const log_1 = require("../../lib/log");
const yargs = require("yargs");
var EnumCacheName;
(function (EnumCacheName) {
    EnumCacheName["toc_contents"] = ".toc_contents.cache";
    EnumCacheName["cache_json"] = ".cache.json";
    EnumCacheName["epub_json"] = "epub.json";
})(EnumCacheName || (EnumCacheName = {}));
let { target } = yargs
    .option('target', {
    alias: ['t'],
    type: 'string',
    demandOption: true,
})
    .usage('npm run reset-init-cahche -- -t toc_contents')
    .showHelpOnFail(true)
    .strict()
    .argv;
let file_name = EnumCacheName[target];
if (!target || !file_name) {
    yargs.showHelp();
    throw new TypeError(`target (${target}) not exists`);
}
let cache_file = path.join(project_config_1.default.cache_root, file_name);
fs.pathExists(cache_file)
    .then(async function (bool) {
    log_1.default.debug('[exists]', bool, cache_file);
    if (bool) {
        await fs.remove(cache_file);
        log_1.default.debug('[delete]', cache_file);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzZXQtaW5pdC1jYWhjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXNldC1pbml0LWNhaGNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsK0JBQStCO0FBQy9CLHlEQUFpRDtBQUNqRCwrQkFBZ0M7QUFDaEMsdUNBQW9DO0FBQ3BDLCtCQUErQjtBQUUvQixJQUFLLGFBS0o7QUFMRCxXQUFLLGFBQWE7SUFFakIscURBQXNDLENBQUE7SUFDdEMsMkNBQTRCLENBQUE7SUFDNUIsd0NBQXlCLENBQUE7QUFDMUIsQ0FBQyxFQUxJLGFBQWEsS0FBYixhQUFhLFFBS2pCO0FBRUQsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLEtBQUs7S0FDcEIsTUFBTSxDQUFDLFFBQVEsRUFBRTtJQUNqQixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixJQUFJLEVBQUUsUUFBUTtJQUNkLFlBQVksRUFBRSxJQUFJO0NBQ2xCLENBQUM7S0FDRCxLQUFLLENBQUMsOENBQThDLENBQUM7S0FDckQsY0FBYyxDQUFDLElBQUksQ0FBQztLQUNwQixNQUFNLEVBQUU7S0FDUixJQUFJLENBQ0w7QUFFRCxJQUFJLFNBQVMsR0FBRyxhQUFhLENBQUMsTUFBYSxDQUFDLENBQUM7QUFFN0MsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFDekI7SUFDQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7SUFFakIsTUFBTSxJQUFJLFNBQVMsQ0FBQyxXQUFXLE1BQU0sY0FBYyxDQUFDLENBQUE7Q0FDcEQ7QUFFRCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBRWhFLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDO0tBQ3ZCLElBQUksQ0FBQyxLQUFLLFdBQVcsSUFBSTtJQUV6QixhQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFNUMsSUFBSSxJQUFJLEVBQ1I7UUFDQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFNUIsYUFBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDdEM7QUFDRixDQUFDLENBQUMsQ0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvMTIvMTEvMDExLlxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uLy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi8uLi9saWIvbG9nJztcbmltcG9ydCAqIGFzIHlhcmdzIGZyb20gJ3lhcmdzJztcblxuZW51bSBFbnVtQ2FjaGVOYW1lXG57XG5cdCd0b2NfY29udGVudHMnID0gJy50b2NfY29udGVudHMuY2FjaGUnLFxuXHQnY2FjaGVfanNvbicgPSAnLmNhY2hlLmpzb24nLFxuXHQnZXB1Yl9qc29uJyA9ICdlcHViLmpzb24nLFxufVxuXG5sZXQgeyB0YXJnZXQgfSA9IHlhcmdzXG5cdC5vcHRpb24oJ3RhcmdldCcsIHtcblx0XHRhbGlhczogWyd0J10sXG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0ZGVtYW5kT3B0aW9uOiB0cnVlLFxuXHR9KVxuXHQudXNhZ2UoJ25wbSBydW4gcmVzZXQtaW5pdC1jYWhjaGUgLS0gLXQgdG9jX2NvbnRlbnRzJylcblx0LnNob3dIZWxwT25GYWlsKHRydWUpXG5cdC5zdHJpY3QoKVxuXHQuYXJndlxuO1xuXG5sZXQgZmlsZV9uYW1lID0gRW51bUNhY2hlTmFtZVt0YXJnZXQgYXMgYW55XTtcblxuaWYgKCF0YXJnZXQgfHwgIWZpbGVfbmFtZSlcbntcblx0eWFyZ3Muc2hvd0hlbHAoKTtcblxuXHR0aHJvdyBuZXcgVHlwZUVycm9yKGB0YXJnZXQgKCR7dGFyZ2V0fSkgbm90IGV4aXN0c2ApXG59XG5cbmxldCBjYWNoZV9maWxlID0gcGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgZmlsZV9uYW1lKTtcblxuZnMucGF0aEV4aXN0cyhjYWNoZV9maWxlKVxuXHQudGhlbihhc3luYyBmdW5jdGlvbiAoYm9vbClcblx0e1xuXHRcdGNvbnNvbGUuZGVidWcoJ1tleGlzdHNdJywgYm9vbCwgY2FjaGVfZmlsZSk7XG5cblx0XHRpZiAoYm9vbClcblx0XHR7XG5cdFx0XHRhd2FpdCBmcy5yZW1vdmUoY2FjaGVfZmlsZSk7XG5cblx0XHRcdGNvbnNvbGUuZGVidWcoJ1tkZWxldGVdJywgY2FjaGVfZmlsZSk7XG5cdFx0fVxuXHR9KVxuO1xuIl19