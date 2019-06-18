"use strict";
/**
 * Created by user on 2019/6/18.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fg = require("fast-glob");
const project_config_1 = require("../../project.config");
const fs = require("fs-extra");
const path = require("path");
const log_1 = require("../../lib/log");
fg.async([
    '**/*',
], {
    cwd: project_config_1.default.cache_root,
})
    .then(async (ls) => {
    log_1.console.dir(ls);
    log_1.console.info(`.cache.json`);
    await fs.readJSON(path.join(project_config_1.default.cache_root, '.cache.json')).then(data => log_1.console.dir(data)).catch(e => null);
    log_1.console.info(`epub.json`);
    await fs.readJSON(path.join(project_config_1.default.cache_root, 'epub.json')).then(data => log_1.console.dir(data)).catch(e => null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcmludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsZ0NBQWdDO0FBQ2hDLHlEQUFpRDtBQUNqRCwrQkFBK0I7QUFDL0IsNkJBQTZCO0FBQzdCLHVDQUF3QztBQUV4QyxFQUFFLENBQUMsS0FBSyxDQUFTO0lBQ2hCLE1BQU07Q0FDTixFQUFFO0lBQ0QsR0FBRyxFQUFFLHdCQUFhLENBQUMsVUFBVTtDQUM3QixDQUFDO0tBQ0QsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRTtJQUVsQixhQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRWhCLGFBQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDNUIsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFdkgsYUFBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMxQixNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0SCxDQUFDLENBQUMsQ0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTkvNi8xOC5cbiAqL1xuXG5pbXBvcnQgKiBhcyBmZyBmcm9tICdmYXN0LWdsb2InO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNvbnNvbGUgfSBmcm9tICcuLi8uLi9saWIvbG9nJztcblxuZmcuYXN5bmM8c3RyaW5nPihbXG5cdCcqKi8qJyxcbl0sIHtcblx0XHRjd2Q6IFByb2plY3RDb25maWcuY2FjaGVfcm9vdCxcblx0fSlcblx0LnRoZW4oYXN5bmMgKGxzKSA9PiB7XG5cblx0XHRjb25zb2xlLmRpcihscyk7XG5cblx0XHRjb25zb2xlLmluZm8oYC5jYWNoZS5qc29uYCk7XG5cdFx0YXdhaXQgZnMucmVhZEpTT04ocGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJy5jYWNoZS5qc29uJykpLnRoZW4oZGF0YSA9PiBjb25zb2xlLmRpcihkYXRhKSkuY2F0Y2goZSA9PiBudWxsKTtcblxuXHRcdGNvbnNvbGUuaW5mbyhgZXB1Yi5qc29uYCk7XG5cdFx0YXdhaXQgZnMucmVhZEpTT04ocGF0aC5qb2luKFByb2plY3RDb25maWcuY2FjaGVfcm9vdCwgJ2VwdWIuanNvbicpKS50aGVuKGRhdGEgPT4gY29uc29sZS5kaXIoZGF0YSkpLmNhdGNoKGUgPT4gbnVsbCk7XG5cdH0pXG47XG4iXX0=