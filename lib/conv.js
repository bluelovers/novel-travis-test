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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbnYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFFSCxxREFBcUc7QUFFckcsU0FBZ0IsWUFBWSxDQUFDLEdBQUcsSUFBa0M7SUFFakUsT0FBTyxlQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDdkIsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNwQixDQUFDO0FBSkQsb0NBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE5LzUvMi5cbiAqL1xuXG5pbXBvcnQgeyB0dzJjbl9taW4sIGNuMnR3X21pbiwgdGFibGVDbjJUd0RlYnVnLCB0YWJsZVR3MkNuRGVidWcgfSBmcm9tICdjamstY29udi9saWIvemgvY29udmVydC9taW4nO1xuXG5leHBvcnQgZnVuY3Rpb24gZG9fY24ydHdfbWluKC4uLmFyZ3Y6IFBhcmFtZXRlcnM8dHlwZW9mIGNuMnR3X21pbj4pOiBzdHJpbmdcbntcblx0cmV0dXJuIGNuMnR3X21pbiguLi5hcmd2KVxuXHRcdC5yZXBsYWNlKCfpur0nLCAn6bq8Jylcbn1cbiJdfQ==