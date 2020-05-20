"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIST_NOVEL = exports.isGitRoot = exports.stripAnsi = exports.crossSpawnOutput = exports.getCrossSpawnError = exports.crossSpawnSync = exports.crossSpawnAsync = void 0;
const cross_spawn_1 = require("./lib/util/cross-spawn");
Object.defineProperty(exports, "crossSpawnAsync", { enumerable: true, get: function () { return cross_spawn_1.crossSpawnAsync; } });
Object.defineProperty(exports, "crossSpawnSync", { enumerable: true, get: function () { return cross_spawn_1.crossSpawnSync; } });
Object.defineProperty(exports, "getCrossSpawnError", { enumerable: true, get: function () { return cross_spawn_1.getCrossSpawnError; } });
Object.defineProperty(exports, "crossSpawnOutput", { enumerable: true, get: function () { return cross_spawn_1.crossSpawnOutput; } });
Object.defineProperty(exports, "stripAnsi", { enumerable: true, get: function () { return cross_spawn_1.stripAnsi; } });
// @ts-ignore
const git_root2_1 = require("git-root2");
Object.defineProperty(exports, "isGitRoot", { enumerable: true, get: function () { return git_root2_1.isGitRoot; } });
const project_config_1 = require("./project.config");
exports.DIST_NOVEL = project_config_1.default.novel_root;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUlILHdEQUEyTztBQUVsTyxnR0FGQSw2QkFBZSxPQUVBO0FBQUUsK0ZBRkEsNEJBQWMsT0FFQTtBQUFFLG1HQUZBLGdDQUFrQixPQUVBO0FBQWlHLGlHQUZBLDhCQUFnQixPQUVBO0FBQW9CLDBGQUZBLHVCQUFTLE9BRUE7QUFJMU0sYUFBYTtBQUNiLHlDQUErQztBQUl0QywwRkFKUyxxQkFBUyxPQUlUO0FBRmxCLHFEQUE2QztBQUlsQyxRQUFBLFVBQVUsR0FBRyx3QkFBYSxDQUFDLFVBQVUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvNS8xNi8wMTYuXG4gKi9cblxuaW1wb3J0IE5vZGVOb3ZlbFRhc2sgZnJvbSAnQG5vZGUtbm92ZWwvdGFzayc7XG5cbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMsIGdldENyb3NzU3Bhd25FcnJvciwgU3Bhd25BU3luY1JldHVybnNQcm9taXNlLCBTcGF3bkFTeW5jUmV0dXJucywgU3Bhd25TeW5jUmV0dXJucywgU3Bhd25PcHRpb25zLCBTcGF3blN5bmNPcHRpb25zLCBjcm9zc1NwYXduT3V0cHV0LCBJU3Bhd25BU3luY0Vycm9yLCBzdHJpcEFuc2kgfSBmcm9tICcuL2xpYi91dGlsL2Nyb3NzLXNwYXduJztcblxuZXhwb3J0IHsgY3Jvc3NTcGF3bkFzeW5jLCBjcm9zc1NwYXduU3luYywgZ2V0Q3Jvc3NTcGF3bkVycm9yLCBTcGF3bkFTeW5jUmV0dXJuc1Byb21pc2UsIFNwYXduQVN5bmNSZXR1cm5zLCBTcGF3blN5bmNSZXR1cm5zLCBTcGF3bk9wdGlvbnMsIFNwYXduU3luY09wdGlvbnMsIGNyb3NzU3Bhd25PdXRwdXQsIElTcGF3bkFTeW5jRXJyb3IsIHN0cmlwQW5zaSB9XG5cbmltcG9ydCB7IGNvbmZpZyBhcyBkb3RlbnZDb25maWcgfSBmcm9tICdkb3RlbnYnO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCBnaXRSb290LCB7IGlzR2l0Um9vdCB9IGZyb20gJ2dpdC1yb290Mic7XG5pbXBvcnQgeyBjcmxmLCBMRiB9IGZyb20gJ2NybGYtbm9ybWFsaXplJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4vcHJvamVjdC5jb25maWcnO1xuXG5leHBvcnQgeyBpc0dpdFJvb3QgfVxuXG5leHBvcnQgbGV0IERJU1RfTk9WRUwgPSBQcm9qZWN0Q29uZmlnLm5vdmVsX3Jvb3Q7XG4iXX0=