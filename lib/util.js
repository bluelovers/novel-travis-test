"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by user on 2018/9/5/005.
 */
const log_1 = require("./log");
const emailNormalize = require("email-normalize");
const pretty = require("prettyuse");
const UString = require("uni-string");
const path = require("path");
function memoryUsage() {
    return pretty();
}
exports.memoryUsage = memoryUsage;
function showMemoryUsage(con = log_1.default) {
    con.log(memoryUsage());
}
exports.showMemoryUsage = showMemoryUsage;
function freeGC(showmem) {
    if (showmem) {
        showMemoryUsage();
    }
    if (global && typeof global.gc === 'function') {
        try {
            global.gc();
        }
        catch (e) {
            log_1.default.error(e);
        }
    }
}
exports.freeGC = freeGC;
function qrcode_link(url, size) {
    size = size || 150;
    return `https://chart.apis.google.com/chart?cht=qr&chs=${size}x${size}&chl=${url}`;
}
exports.qrcode_link = qrcode_link;
function git_fake_author(name, email) {
    email = emailNormalize(email || 'testbot@test.test')
        .replace(/^[\s　@]+|[\s　@]+$/g, '');
    if (email.split('@').length !== 2) {
        email = null;
    }
    name = (name || '')
        .replace(/[\-\+\<\>\[\]\?\*@\s"\'`~\{\}]+/ig, ' ');
    try {
        name = name
            .replace(/[\p{Punctuation}]/uig, function (s) {
            if (/^[\.]$/.test(s)) {
                return s;
            }
            return ' ';
        })
            .replace(/^[\s　\p{Punctuation}]+|[\s　\p{Punctuation}]+$/ug, '');
    }
    catch (e) {
    }
    name = name
        .replace(/^[\s　]+|[\s　\.]+$/g, '')
        .replace(/\s+/g, ' ');
    if (/[^\w \.]/.test(name) && UString.size(name) > 15) {
        name = UString.slice(name, 0, 20);
    }
    return `${name || 'testbot'} <${email || 'testbot@test.test'}>`;
}
exports.git_fake_author = git_fake_author;
function filterArgv(argv) {
    return argv
        .filter(v => v != null)
        .map(v => v.trim());
}
exports.filterArgv = filterArgv;
function path_equal(s1, p2) {
    return path.normalize(s1) === path.normalize(p2);
}
exports.path_equal = path_equal;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7R0FFRztBQUNILCtCQUE0QjtBQUM1QixrREFBbUQ7QUFDbkQsb0NBQXFDO0FBQ3JDLHNDQUF1QztBQUN2Qyw2QkFBOEI7QUFFOUIsU0FBZ0IsV0FBVztJQUUxQixPQUFPLE1BQU0sRUFBRSxDQUFDO0FBQ2pCLENBQUM7QUFIRCxrQ0FHQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxHQUFHLEdBQUcsYUFBTztJQUU1QyxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDeEIsQ0FBQztBQUhELDBDQUdDO0FBRUQsU0FBZ0IsTUFBTSxDQUFDLE9BQWlCO0lBRXZDLElBQUksT0FBTyxFQUNYO1FBQ0MsZUFBZSxFQUFFLENBQUM7S0FDbEI7SUFFRCxJQUFJLE1BQU0sSUFBSSxPQUFPLE1BQU0sQ0FBQyxFQUFFLEtBQUssVUFBVSxFQUM3QztRQUNDLElBQ0E7WUFDQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUM7U0FDWjtRQUNELE9BQU8sQ0FBQyxFQUNSO1lBQ0MsYUFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNqQjtLQUNEO0FBQ0YsQ0FBQztBQWxCRCx3QkFrQkM7QUFFRCxTQUFnQixXQUFXLENBQUMsR0FBVyxFQUFFLElBQWE7SUFFckQsSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLENBQUM7SUFFbkIsT0FBTyxrREFBa0QsSUFBSSxJQUFJLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNuRixDQUFDO0FBTEQsa0NBS0M7QUFFRCxTQUFnQixlQUFlLENBQUMsSUFBYSxFQUFFLEtBQWM7SUFFNUQsS0FBSyxHQUFHLGNBQWMsQ0FBQyxLQUFLLElBQUksbUJBQW1CLENBQUM7U0FDbEQsT0FBTyxDQUFDLG9CQUFvQixFQUFFLEVBQUUsQ0FBQyxDQUNsQztJQUVELElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUNqQztRQUNDLEtBQUssR0FBRyxJQUFJLENBQUM7S0FDYjtJQUVELElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7U0FDakIsT0FBTyxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsQ0FBQyxDQUNqRDtJQUVGLElBQ0E7UUFDQyxJQUFJLEdBQUcsSUFBSTthQUNULE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxVQUFVLENBQUM7WUFFM0MsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNwQjtnQkFDQyxPQUFPLENBQUMsQ0FBQzthQUNUO1lBRUQsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDLENBQUM7YUFDRCxPQUFPLENBQUMsaURBQWlELEVBQUUsRUFBRSxDQUFDLENBQy9EO0tBQ0Q7SUFDRCxPQUFPLENBQUMsRUFDUjtLQUVDO0lBRUQsSUFBSSxHQUFHLElBQUk7U0FDVCxPQUFPLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDO1NBQ2pDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQ3JCO0lBRUQsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUNwRDtRQUNDLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDbEM7SUFFRCxPQUFPLEdBQUcsSUFBSSxJQUFJLFNBQVMsS0FBSyxLQUFLLElBQUksbUJBQW1CLEdBQUcsQ0FBQztBQUNqRSxDQUFDO0FBOUNELDBDQThDQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxJQUFjO0lBRXhDLE9BQU8sSUFBSTtTQUNULE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7U0FDdEIsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQ2xCO0FBQ0gsQ0FBQztBQU5ELGdDQU1DO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLEVBQVUsRUFBRSxFQUFVO0lBRWhELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0FBQ2pELENBQUM7QUFIRCxnQ0FHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvOS81LzAwNS5cbiAqL1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnLi9sb2cnO1xuaW1wb3J0IGVtYWlsTm9ybWFsaXplID0gcmVxdWlyZSgnZW1haWwtbm9ybWFsaXplJyk7XG5pbXBvcnQgcHJldHR5ID0gcmVxdWlyZSgncHJldHR5dXNlJyk7XG5pbXBvcnQgVVN0cmluZyA9IHJlcXVpcmUoJ3VuaS1zdHJpbmcnKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gbWVtb3J5VXNhZ2UoKTogc3RyaW5nXG57XG5cdHJldHVybiBwcmV0dHkoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dNZW1vcnlVc2FnZShjb24gPSBjb25zb2xlKVxue1xuXHRjb24ubG9nKG1lbW9yeVVzYWdlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZnJlZUdDKHNob3dtZW0/OiBib29sZWFuKVxue1xuXHRpZiAoc2hvd21lbSlcblx0e1xuXHRcdHNob3dNZW1vcnlVc2FnZSgpO1xuXHR9XG5cblx0aWYgKGdsb2JhbCAmJiB0eXBlb2YgZ2xvYmFsLmdjID09PSAnZnVuY3Rpb24nKVxuXHR7XG5cdFx0dHJ5XG5cdFx0e1xuXHRcdFx0Z2xvYmFsLmdjKCk7XG5cdFx0fVxuXHRcdGNhdGNoIChlKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBxcmNvZGVfbGluayh1cmw6IHN0cmluZywgc2l6ZT86IG51bWJlcilcbntcblx0c2l6ZSA9IHNpemUgfHwgMTUwO1xuXG5cdHJldHVybiBgaHR0cHM6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2h0PXFyJmNocz0ke3NpemV9eCR7c2l6ZX0mY2hsPSR7dXJsfWBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdF9mYWtlX2F1dGhvcihuYW1lPzogc3RyaW5nLCBlbWFpbD86IHN0cmluZylcbntcblx0ZW1haWwgPSBlbWFpbE5vcm1hbGl6ZShlbWFpbCB8fCAndGVzdGJvdEB0ZXN0LnRlc3QnKVxuXHRcdC5yZXBsYWNlKC9eW1xcc+OAgEBdK3xbXFxz44CAQF0rJC9nLCAnJylcblx0O1xuXG5cdGlmIChlbWFpbC5zcGxpdCgnQCcpLmxlbmd0aCAhPT0gMilcblx0e1xuXHRcdGVtYWlsID0gbnVsbDtcblx0fVxuXG5cdG5hbWUgPSAobmFtZSB8fCAnJylcblx0XHQucmVwbGFjZSgvW1xcLVxcK1xcPFxcPlxcW1xcXVxcP1xcKkBcXHNcIlxcJ2B+XFx7XFx9XSsvaWcsICcgJylcblx0XHQ7XG5cblx0dHJ5XG5cdHtcblx0XHRuYW1lID0gbmFtZVxuXHRcdFx0LnJlcGxhY2UoL1tcXHB7UHVuY3R1YXRpb259XS91aWcsIGZ1bmN0aW9uIChzKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoL15bXFwuXSQvLnRlc3QocykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gcztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiAnICc7XG5cdFx0XHR9KVxuXHRcdFx0LnJlcGxhY2UoL15bXFxz44CAXFxwe1B1bmN0dWF0aW9ufV0rfFtcXHPjgIBcXHB7UHVuY3R1YXRpb259XSskL3VnLCAnJylcblx0XHQ7XG5cdH1cblx0Y2F0Y2ggKGUpXG5cdHtcblxuXHR9XG5cblx0bmFtZSA9IG5hbWVcblx0XHQucmVwbGFjZSgvXltcXHPjgIBdK3xbXFxz44CAXFwuXSskL2csICcnKVxuXHRcdC5yZXBsYWNlKC9cXHMrL2csICcgJylcblx0O1xuXG5cdGlmICgvW15cXHcgXFwuXS8udGVzdChuYW1lKSAmJiBVU3RyaW5nLnNpemUobmFtZSkgPiAxNSlcblx0e1xuXHRcdG5hbWUgPSBVU3RyaW5nLnNsaWNlKG5hbWUsIDAsIDIwKTtcblx0fVxuXG5cdHJldHVybiBgJHtuYW1lIHx8ICd0ZXN0Ym90J30gPCR7ZW1haWwgfHwgJ3Rlc3Rib3RAdGVzdC50ZXN0J30+YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlckFyZ3YoYXJndjogc3RyaW5nW10pXG57XG5cdHJldHVybiBhcmd2XG5cdFx0LmZpbHRlcih2ID0+IHYgIT0gbnVsbClcblx0XHQubWFwKHYgPT4gdi50cmltKCkpXG5cdFx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGF0aF9lcXVhbChzMTogc3RyaW5nLCBwMjogc3RyaW5nKVxue1xuXHRyZXR1cm4gcGF0aC5ub3JtYWxpemUoczEpID09PSBwYXRoLm5vcm1hbGl6ZShwMilcbn1cbiJdfQ==