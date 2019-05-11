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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzZXQtaW5pdC1jYWhjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXNldC1pbml0LWNhaGNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsK0JBQStCO0FBQy9CLHlEQUFpRDtBQUNqRCwrQkFBZ0M7QUFDaEMsdUNBQW9DO0FBQ3BDLCtCQUErQjtBQUUvQixJQUFLLGFBR0o7QUFIRCxXQUFLLGFBQWE7SUFFakIscURBQXNDLENBQUE7QUFDdkMsQ0FBQyxFQUhJLGFBQWEsS0FBYixhQUFhLFFBR2pCO0FBRUQsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLEtBQUs7S0FDcEIsTUFBTSxDQUFDLFFBQVEsRUFBRTtJQUNqQixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixJQUFJLEVBQUUsUUFBUTtJQUNkLFlBQVksRUFBRSxJQUFJO0NBQ2xCLENBQUM7S0FDRCxLQUFLLENBQUMsOENBQThDLENBQUM7S0FDckQsY0FBYyxDQUFDLElBQUksQ0FBQztLQUNwQixNQUFNLEVBQUU7S0FDUixJQUFJLENBQ0w7QUFFRCxJQUFJLFNBQVMsR0FBRyxhQUFhLENBQUMsTUFBYSxDQUFDLENBQUM7QUFFN0MsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFDekI7SUFDQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7SUFFakIsTUFBTSxJQUFJLFNBQVMsQ0FBQyxXQUFXLE1BQU0sY0FBYyxDQUFDLENBQUE7Q0FDcEQ7QUFFRCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBRWhFLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDO0tBQ3ZCLElBQUksQ0FBQyxLQUFLLFdBQVcsSUFBSTtJQUV6QixhQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFNUMsSUFBSSxJQUFJLEVBQ1I7UUFDQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFNUIsYUFBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDdEM7QUFDRixDQUFDLENBQUMsQ0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvMTIvMTEvMDExLlxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uLy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi8uLi9saWIvbG9nJztcbmltcG9ydCAqIGFzIHlhcmdzIGZyb20gJ3lhcmdzJztcblxuZW51bSBFbnVtQ2FjaGVOYW1lXG57XG5cdCd0b2NfY29udGVudHMnID0gJy50b2NfY29udGVudHMuY2FjaGUnXG59XG5cbmxldCB7IHRhcmdldCB9ID0geWFyZ3Ncblx0Lm9wdGlvbigndGFyZ2V0Jywge1xuXHRcdGFsaWFzOiBbJ3QnXSxcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRkZW1hbmRPcHRpb246IHRydWUsXG5cdH0pXG5cdC51c2FnZSgnbnBtIHJ1biByZXNldC1pbml0LWNhaGNoZSAtLSAtdCB0b2NfY29udGVudHMnKVxuXHQuc2hvd0hlbHBPbkZhaWwodHJ1ZSlcblx0LnN0cmljdCgpXG5cdC5hcmd2XG47XG5cbmxldCBmaWxlX25hbWUgPSBFbnVtQ2FjaGVOYW1lW3RhcmdldCBhcyBhbnldO1xuXG5pZiAoIXRhcmdldCB8fCAhZmlsZV9uYW1lKVxue1xuXHR5YXJncy5zaG93SGVscCgpO1xuXG5cdHRocm93IG5ldyBUeXBlRXJyb3IoYHRhcmdldCAoJHt0YXJnZXR9KSBub3QgZXhpc3RzYClcbn1cblxubGV0IGNhY2hlX2ZpbGUgPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCBmaWxlX25hbWUpO1xuXG5mcy5wYXRoRXhpc3RzKGNhY2hlX2ZpbGUpXG5cdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChib29sKVxuXHR7XG5cdFx0Y29uc29sZS5kZWJ1ZygnW2V4aXN0c10nLCBib29sLCBjYWNoZV9maWxlKTtcblxuXHRcdGlmIChib29sKVxuXHRcdHtcblx0XHRcdGF3YWl0IGZzLnJlbW92ZShjYWNoZV9maWxlKTtcblxuXHRcdFx0Y29uc29sZS5kZWJ1ZygnW2RlbGV0ZV0nLCBjYWNoZV9maWxlKTtcblx0XHR9XG5cdH0pXG47XG4iXX0=