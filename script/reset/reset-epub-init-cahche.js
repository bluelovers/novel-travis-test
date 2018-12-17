"use strict";
/**
 * Created by user on 2018/12/11/011.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const project_config_1 = require("../../project.config");
const path = require("upath2");
const log_1 = require("../../lib/log");
let epub_json = path.join(project_config_1.default.cache_root, 'epub.json');
fs.pathExists(epub_json)
    .then(async function (bool) {
    log_1.default.debug('[exists]', bool, epub_json);
    if (bool) {
        await fs.remove(epub_json);
        log_1.default.debug('[delete]', epub_json);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzZXQtZXB1Yi1pbml0LWNhaGNoZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlc2V0LWVwdWItaW5pdC1jYWhjaGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUdILCtCQUErQjtBQUMvQix5REFBaUQ7QUFDakQsK0JBQWdDO0FBQ2hDLHVDQUFvQztBQUNwQyxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBRWpFLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO0tBQ3ZCLElBQUksQ0FBQyxLQUFLLFdBQVcsSUFBSTtJQUV6QixhQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFFM0MsSUFBSSxJQUFJLEVBQ1I7UUFDQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFM0IsYUFBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDckM7QUFDRixDQUFDLENBQUMsQ0FDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvMTIvMTEvMDExLlxuICovXG5cblxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCBjb25zb2xlIGZyb20gJy4uLy4uL2xpYi9sb2cnO1xubGV0IGVwdWJfanNvbiA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICdlcHViLmpzb24nKTtcblxuZnMucGF0aEV4aXN0cyhlcHViX2pzb24pXG4udGhlbihhc3luYyBmdW5jdGlvbiAoYm9vbClcbntcblx0Y29uc29sZS5kZWJ1ZygnW2V4aXN0c10nLCBib29sLCBlcHViX2pzb24pO1xuXG5cdGlmIChib29sKVxuXHR7XG5cdFx0YXdhaXQgZnMucmVtb3ZlKGVwdWJfanNvbik7XG5cblx0XHRjb25zb2xlLmRlYnVnKCdbZGVsZXRlXScsIGVwdWJfanNvbik7XG5cdH1cbn0pXG47XG4iXX0=