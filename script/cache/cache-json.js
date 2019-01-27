"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const log_1 = require("../../lib/log");
const git_1 = require("../git");
const init_1 = require("../init");
function updateCacheConfigHashHEAD() {
    if (init_1.CacheConfig) {
        let currentHEADNew = git_1.getHashHEAD(init_1.DIST_NOVEL);
        let config = fs.readJSONSync(init_1.CacheConfig.filepath);
        config.last = currentHEADNew;
        config.last_push_head = currentHEADNew;
        fs.writeJSONSync(init_1.CacheConfig.filepath, config, {
            spaces: 2,
        });
        log_1.default.dir(config);
    }
}
exports.updateCacheConfigHashHEAD = updateCacheConfigHashHEAD;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUtanNvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNhY2hlLWpzb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBK0I7QUFDL0IsdUNBQW9DO0FBQ3BDLGdDQUFxQztBQUNyQyxrQ0FBa0Q7QUFFbEQsU0FBZ0IseUJBQXlCO0lBRXhDLElBQUksa0JBQVcsRUFDZjtRQUNDLElBQUksY0FBYyxHQUFHLGlCQUFXLENBQUMsaUJBQVUsQ0FBQyxDQUFDO1FBRTdDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsa0JBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuRCxNQUFNLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQztRQUM3QixNQUFNLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztRQUV2QyxFQUFFLENBQUMsYUFBYSxDQUFDLGtCQUFXLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRTtZQUM5QyxNQUFNLEVBQUUsQ0FBQztTQUNULENBQUMsQ0FBQztRQUVILGFBQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDcEI7QUFDRixDQUFDO0FBakJELDhEQWlCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uLy4uL2xpYi9sb2cnO1xuaW1wb3J0IHsgZ2V0SGFzaEhFQUQgfSBmcm9tICcuLi9naXQnO1xuaW1wb3J0IHsgQ2FjaGVDb25maWcsIERJU1RfTk9WRUwgfSBmcm9tICcuLi9pbml0JztcblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNhY2hlQ29uZmlnSGFzaEhFQUQoKVxue1xuXHRpZiAoQ2FjaGVDb25maWcpXG5cdHtcblx0XHRsZXQgY3VycmVudEhFQUROZXcgPSBnZXRIYXNoSEVBRChESVNUX05PVkVMKTtcblxuXHRcdGxldCBjb25maWcgPSBmcy5yZWFkSlNPTlN5bmMoQ2FjaGVDb25maWcuZmlsZXBhdGgpO1xuXG5cdFx0Y29uZmlnLmxhc3QgPSBjdXJyZW50SEVBRE5ldztcblx0XHRjb25maWcubGFzdF9wdXNoX2hlYWQgPSBjdXJyZW50SEVBRE5ldztcblxuXHRcdGZzLndyaXRlSlNPTlN5bmMoQ2FjaGVDb25maWcuZmlsZXBhdGgsIGNvbmZpZywge1xuXHRcdFx0c3BhY2VzOiAyLFxuXHRcdH0pO1xuXG5cdFx0Y29uc29sZS5kaXIoY29uZmlnKTtcblx0fVxufVxuIl19