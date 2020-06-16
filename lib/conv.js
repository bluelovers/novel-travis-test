"use strict";
/**
 * Created by user on 2019/5/2.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.do_cn2tw_min = void 0;
const min_1 = require("cjk-conv/lib/zh/convert/min");
function do_cn2tw_min(...argv) {
    return min_1.cn2tw_min(...argv)
        .replace('麽', '麼');
}
exports.do_cn2tw_min = do_cn2tw_min;
//# sourceMappingURL=conv.js.map