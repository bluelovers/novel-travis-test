"use strict";
/**
 * Created by user on 2017/8/13/013.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
exports.project_root = path.join(__dirname);
exports.cache_root = path.join(exports.project_root, '.cache');
exports.novel_root = path.join(exports.project_root, 'dist_novel');
exports.epub_root = path.join(exports.project_root, 'dist_epub');
const ProjectConfig = require("./project.config");
exports.ProjectConfig = ProjectConfig;
exports.default = ProjectConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC5jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm9qZWN0LmNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsNkJBQTZCO0FBRWhCLFFBQUEsWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFFcEMsUUFBQSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQy9DLFFBQUEsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztBQUNuRCxRQUFBLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFZLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFFOUQsa0RBQWtEO0FBQ3pDLHNDQUFhO0FBQ3RCLGtCQUFlLGFBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTcvOC8xMy8wMTMuXG4gKi9cblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNvbnN0IHByb2plY3Rfcm9vdCA9IHBhdGguam9pbihfX2Rpcm5hbWUpO1xuXG5leHBvcnQgY29uc3QgY2FjaGVfcm9vdCA9IHBhdGguam9pbihwcm9qZWN0X3Jvb3QsICcuY2FjaGUnKTtcbmV4cG9ydCBjb25zdCBub3ZlbF9yb290ID0gcGF0aC5qb2luKHByb2plY3Rfcm9vdCwgJ2Rpc3Rfbm92ZWwnKTtcbmV4cG9ydCBjb25zdCBlcHViX3Jvb3QgPSBwYXRoLmpvaW4ocHJvamVjdF9yb290LCAnZGlzdF9lcHViJyk7XG5cbmltcG9ydCAqIGFzIFByb2plY3RDb25maWcgZnJvbSAnLi9wcm9qZWN0LmNvbmZpZyc7XG5leHBvcnQgeyBQcm9qZWN0Q29uZmlnIH1cbmV4cG9ydCBkZWZhdWx0IFByb2plY3RDb25maWc7XG4iXX0=