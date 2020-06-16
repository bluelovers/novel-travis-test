"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by user on 2018/12/24/024.
 */
const novel_stat_1 = require("../../lib/cache/novel-stat");
const novelStatCache = novel_stat_1.getNovelStatCache();
Object.entries(novelStatCache.data.novels)
    .forEach(function ([pathMain, ls]) {
    Object.entries(ls)
        .forEach(function ([novelID, novel]) {
        console.log(pathMain, novelID);
        delete novel.update_count;
        delete novel.update_date;
    });
});
novelStatCache.save();
//# sourceMappingURL=reset-update-count.js.map