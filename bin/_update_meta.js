"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const novel_stat_1 = require("../lib/cache/novel-stat");
const share_1 = require("../lib/share");
const project_config_1 = require("../project.config");
const meta_1 = require("../lib/util/meta");
const Promise = require("bluebird");
const log_1 = require("../lib/log");
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT,
]) && (async () => {
    const novelStatCache = novel_stat_1.getNovelStatCache();
    let ls;
    ls = meta_1.filterIDs(project_config_1.default.novel_root);
    if (ls && ls.length) {
        log_1.default.info(`更新 meta`);
        // 精簡 mdconf
        novelStatCache.data.mdconf = {};
        await Promise
            .mapSeries(ls, async function (data) {
            const { pathMain, novelID } = data;
            let meta = meta_1.getMdconfMeta(pathMain, novelID);
            if (meta) {
                novelStatCache.mdconf_set(pathMain, novelID, meta);
                log_1.default.success(pathMain, novelID);
            }
        });
        log_1.default.info(`done`);
        novelStatCache.save();
    }
})();
//# sourceMappingURL=_update_meta.js.map