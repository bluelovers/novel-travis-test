"use strict";
/**
 * Created by user on 2018/5/19/019.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const yargs = require("yargs");
const project_config_1 = require("../project.config");
const path = require("upath2");
const log_1 = require("../lib/log");
if (yargs.argv.last) {
    let cache_json = path.join(project_config_1.default.cache_root, '.cache.json');
    if (fs.existsSync(cache_json)) {
        let data = fs.readJSONSync(cache_json);
        data.last = yargs.argv.last;
        fs.outputJSONSync(cache_json, data, {
            spaces: '\t',
        });
        log_1.default.debug(`update .cache.json { last: ${yargs.argv.last} }`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3NldF9jYWNoZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIl9zZXRfY2FjaGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILCtCQUErQjtBQUMvQiwrQkFBK0I7QUFFL0Isc0RBQThDO0FBQzlDLCtCQUFnQztBQUNoQyxvQ0FBaUM7QUFFakMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFDbkI7SUFDQyxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRXBFLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFDN0I7UUFDQyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXZDLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFFNUIsRUFBRSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFO1lBQ25DLE1BQU0sRUFBRSxJQUFJO1NBQ1osQ0FBQyxDQUFDO1FBRUgsYUFBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO0tBQ2pFO0NBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzUvMTkvMDE5LlxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCAqIGFzIHlhcmdzIGZyb20gJ3lhcmdzJztcblxuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uL2xpYi9sb2cnO1xuXG5pZiAoeWFyZ3MuYXJndi5sYXN0KVxue1xuXHRsZXQgY2FjaGVfanNvbiA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICcuY2FjaGUuanNvbicpO1xuXG5cdGlmIChmcy5leGlzdHNTeW5jKGNhY2hlX2pzb24pKVxuXHR7XG5cdFx0bGV0IGRhdGEgPSBmcy5yZWFkSlNPTlN5bmMoY2FjaGVfanNvbik7XG5cblx0XHRkYXRhLmxhc3QgPSB5YXJncy5hcmd2Lmxhc3Q7XG5cblx0XHRmcy5vdXRwdXRKU09OU3luYyhjYWNoZV9qc29uLCBkYXRhLCB7XG5cdFx0XHRzcGFjZXM6ICdcXHQnLFxuXHRcdH0pO1xuXG5cdFx0Y29uc29sZS5kZWJ1ZyhgdXBkYXRlIC5jYWNoZS5qc29uIHsgbGFzdDogJHt5YXJncy5hcmd2Lmxhc3R9IH1gKTtcblx0fVxufVxuIl19