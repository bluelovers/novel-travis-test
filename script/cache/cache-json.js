"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCacheConfigHashHEAD = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUtanNvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNhY2hlLWpzb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0JBQStCO0FBQy9CLHVDQUFvQztBQUNwQyxnQ0FBcUM7QUFDckMsa0NBQWtEO0FBRWxELFNBQWdCLHlCQUF5QjtJQUV4QyxJQUFJLGtCQUFXLEVBQ2Y7UUFDQyxJQUFJLGNBQWMsR0FBRyxpQkFBVyxDQUFDLGlCQUFVLENBQUMsQ0FBQztRQUU3QyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLGtCQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFbkQsTUFBTSxDQUFDLElBQUksR0FBRyxjQUFjLENBQUM7UUFDN0IsTUFBTSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFFdkMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxrQkFBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUU7WUFDOUMsTUFBTSxFQUFFLENBQUM7U0FDVCxDQUFDLENBQUM7UUFFSCxhQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3BCO0FBQ0YsQ0FBQztBQWpCRCw4REFpQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgY29uc29sZSBmcm9tICcuLi8uLi9saWIvbG9nJztcbmltcG9ydCB7IGdldEhhc2hIRUFEIH0gZnJvbSAnLi4vZ2l0JztcbmltcG9ydCB7IENhY2hlQ29uZmlnLCBESVNUX05PVkVMIH0gZnJvbSAnLi4vaW5pdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDYWNoZUNvbmZpZ0hhc2hIRUFEKClcbntcblx0aWYgKENhY2hlQ29uZmlnKVxuXHR7XG5cdFx0bGV0IGN1cnJlbnRIRUFETmV3ID0gZ2V0SGFzaEhFQUQoRElTVF9OT1ZFTCk7XG5cblx0XHRsZXQgY29uZmlnID0gZnMucmVhZEpTT05TeW5jKENhY2hlQ29uZmlnLmZpbGVwYXRoKTtcblxuXHRcdGNvbmZpZy5sYXN0ID0gY3VycmVudEhFQUROZXc7XG5cdFx0Y29uZmlnLmxhc3RfcHVzaF9oZWFkID0gY3VycmVudEhFQUROZXc7XG5cblx0XHRmcy53cml0ZUpTT05TeW5jKENhY2hlQ29uZmlnLmZpbGVwYXRoLCBjb25maWcsIHtcblx0XHRcdHNwYWNlczogMixcblx0XHR9KTtcblxuXHRcdGNvbnNvbGUuZGlyKGNvbmZpZyk7XG5cdH1cbn1cbiJdfQ==