"use strict";
/**
 * Created by user on 2019/5/2.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const min_1 = require("cjk-conv/lib/zh/convert/min");
function do_cn2tw_min(...argv) {
    return min_1.cn2tw_min(...argv)
        .replace('麽', '麼');
}
exports.do_cn2tw_min = do_cn2tw_min;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbnYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILHFEQUFxRztBQUVyRyxTQUFnQixZQUFZLENBQUMsR0FBRyxJQUFrQztJQUVqRSxPQUFPLGVBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUN2QixPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ3BCLENBQUM7QUFKRCxvQ0FJQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTkvNS8yLlxuICovXG5cbmltcG9ydCB7IHR3MmNuX21pbiwgY24ydHdfbWluLCB0YWJsZUNuMlR3RGVidWcsIHRhYmxlVHcyQ25EZWJ1ZyB9IGZyb20gJ2Nqay1jb252L2xpYi96aC9jb252ZXJ0L21pbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBkb19jbjJ0d19taW4oLi4uYXJndjogUGFyYW1ldGVyczx0eXBlb2YgY24ydHdfbWluPik6IHN0cmluZ1xue1xuXHRyZXR1cm4gY24ydHdfbWluKC4uLmFyZ3YpXG5cdFx0LnJlcGxhY2UoJ+m6vScsICfpurwnKVxufVxuIl19