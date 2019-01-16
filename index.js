"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const cross_spawn_1 = require("./lib/util/cross-spawn");
exports.crossSpawnAsync = cross_spawn_1.crossSpawnAsync;
exports.crossSpawnSync = cross_spawn_1.crossSpawnSync;
exports.getCrossSpawnError = cross_spawn_1.getCrossSpawnError;
exports.crossSpawnOutput = cross_spawn_1.crossSpawnOutput;
// @ts-ignore
const git_root2_1 = require("git-root2");
exports.isGitRoot = git_root2_1.isGitRoot;
const project_config_1 = require("./project.config");
exports.DIST_NOVEL = project_config_1.default.novel_root;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBSUgsd0RBQThNO0FBRXJNLDBCQUZBLDZCQUFlLENBRUE7QUFBRSx5QkFGQSw0QkFBYyxDQUVBO0FBQUUsNkJBRkEsZ0NBQWtCLENBRUE7QUFBaUcsMkJBRkEsOEJBQWdCLENBRUE7QUFJN0ssYUFBYTtBQUNiLHlDQUErQztBQUl0QyxvQkFKUyxxQkFBUyxDQUlUO0FBRmxCLHFEQUE2QztBQUlsQyxRQUFBLFVBQVUsR0FBRyx3QkFBYSxDQUFDLFVBQVUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvNS8xNi8wMTYuXG4gKi9cblxuaW1wb3J0IE5vZGVOb3ZlbFRhc2sgZnJvbSAnQG5vZGUtbm92ZWwvdGFzayc7XG5cbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMsIGdldENyb3NzU3Bhd25FcnJvciwgU3Bhd25BU3luY1JldHVybnNQcm9taXNlLCBTcGF3bkFTeW5jUmV0dXJucywgU3Bhd25TeW5jUmV0dXJucywgU3Bhd25PcHRpb25zLCBTcGF3blN5bmNPcHRpb25zLCBjcm9zc1NwYXduT3V0cHV0IH0gZnJvbSAnLi9saWIvdXRpbC9jcm9zcy1zcGF3bic7XG5cbmV4cG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMsIGdldENyb3NzU3Bhd25FcnJvciwgU3Bhd25BU3luY1JldHVybnNQcm9taXNlLCBTcGF3bkFTeW5jUmV0dXJucywgU3Bhd25TeW5jUmV0dXJucywgU3Bhd25PcHRpb25zLCBTcGF3blN5bmNPcHRpb25zLCBjcm9zc1NwYXduT3V0cHV0IH1cblxuaW1wb3J0IHsgY29uZmlnIGFzIGRvdGVudkNvbmZpZyB9IGZyb20gJ2RvdGVudic7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IGdpdFJvb3QsIHsgaXNHaXRSb290IH0gZnJvbSAnZ2l0LXJvb3QyJztcbmltcG9ydCB7IGNybGYsIExGIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi9wcm9qZWN0LmNvbmZpZyc7XG5cbmV4cG9ydCB7IGlzR2l0Um9vdCB9XG5cbmV4cG9ydCBsZXQgRElTVF9OT1ZFTCA9IFByb2plY3RDb25maWcubm92ZWxfcm9vdDtcbiJdfQ==