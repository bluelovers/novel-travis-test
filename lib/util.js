"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by user on 2018/9/5/005.
 */
const log_1 = require("./log");
const pretty = require("prettyuse");
const emailNormalize = require("email-normalize");
const UString = require("uni-string");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7R0FFRztBQUNILCtCQUE0QjtBQUM1QixvQ0FBcUM7QUFDckMsa0RBQW1EO0FBQ25ELHNDQUF1QztBQUV2QyxTQUFnQixXQUFXO0lBRTFCLE9BQU8sTUFBTSxFQUFFLENBQUM7QUFDakIsQ0FBQztBQUhELGtDQUdDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLEdBQUcsR0FBRyxhQUFPO0lBRTVDLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUN4QixDQUFDO0FBSEQsMENBR0M7QUFFRCxTQUFnQixNQUFNLENBQUMsT0FBaUI7SUFFdkMsSUFBSSxPQUFPLEVBQ1g7UUFDQyxlQUFlLEVBQUUsQ0FBQztLQUNsQjtJQUVELElBQUksTUFBTSxJQUFJLE9BQU8sTUFBTSxDQUFDLEVBQUUsS0FBSyxVQUFVLEVBQzdDO1FBQ0MsSUFDQTtZQUNDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztTQUNaO1FBQ0QsT0FBTyxDQUFDLEVBQ1I7WUFDQyxhQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pCO0tBQ0Q7QUFDRixDQUFDO0FBbEJELHdCQWtCQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxHQUFXLEVBQUUsSUFBYTtJQUVyRCxJQUFJLEdBQUcsSUFBSSxJQUFJLEdBQUcsQ0FBQztJQUVuQixPQUFPLGtEQUFrRCxJQUFJLElBQUksSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFBO0FBQ25GLENBQUM7QUFMRCxrQ0FLQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxJQUFhLEVBQUUsS0FBYztJQUU1RCxLQUFLLEdBQUcsY0FBYyxDQUFDLEtBQUssSUFBSSxtQkFBbUIsQ0FBQztTQUNsRCxPQUFPLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLENBQ2xDO0lBRUQsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQ2pDO1FBQ0MsS0FBSyxHQUFHLElBQUksQ0FBQztLQUNiO0lBRUQsSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztTQUNqQixPQUFPLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxDQUFDLENBQ2pEO0lBRUYsSUFDQTtRQUNDLElBQUksR0FBRyxJQUFJO2FBQ1QsT0FBTyxDQUFDLHNCQUFzQixFQUFFLFVBQVUsQ0FBQztZQUUzQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQ3BCO2dCQUNDLE9BQU8sQ0FBQyxDQUFDO2FBQ1Q7WUFFRCxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUMsQ0FBQzthQUNELE9BQU8sQ0FBQyxpREFBaUQsRUFBRSxFQUFFLENBQUMsQ0FDL0Q7S0FDRDtJQUNELE9BQU8sQ0FBQyxFQUNSO0tBRUM7SUFFRCxJQUFJLEdBQUcsSUFBSTtTQUNULE9BQU8sQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUM7U0FDakMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FDckI7SUFFRCxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQ3BEO1FBQ0MsSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUNsQztJQUVELE9BQU8sR0FBRyxJQUFJLElBQUksU0FBUyxLQUFLLEtBQUssSUFBSSxtQkFBbUIsR0FBRyxDQUFDO0FBQ2pFLENBQUM7QUE5Q0QsMENBOENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC85LzUvMDA1LlxuICovXG5pbXBvcnQgY29uc29sZSBmcm9tICcuL2xvZyc7XG5pbXBvcnQgcHJldHR5ID0gcmVxdWlyZSgncHJldHR5dXNlJyk7XG5pbXBvcnQgZW1haWxOb3JtYWxpemUgPSByZXF1aXJlKCdlbWFpbC1ub3JtYWxpemUnKTtcbmltcG9ydCBVU3RyaW5nID0gcmVxdWlyZSgndW5pLXN0cmluZycpO1xuXG5leHBvcnQgZnVuY3Rpb24gbWVtb3J5VXNhZ2UoKTogc3RyaW5nXG57XG5cdHJldHVybiBwcmV0dHkoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dNZW1vcnlVc2FnZShjb24gPSBjb25zb2xlKVxue1xuXHRjb24ubG9nKG1lbW9yeVVzYWdlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZnJlZUdDKHNob3dtZW0/OiBib29sZWFuKVxue1xuXHRpZiAoc2hvd21lbSlcblx0e1xuXHRcdHNob3dNZW1vcnlVc2FnZSgpO1xuXHR9XG5cblx0aWYgKGdsb2JhbCAmJiB0eXBlb2YgZ2xvYmFsLmdjID09PSAnZnVuY3Rpb24nKVxuXHR7XG5cdFx0dHJ5XG5cdFx0e1xuXHRcdFx0Z2xvYmFsLmdjKCk7XG5cdFx0fVxuXHRcdGNhdGNoIChlKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBxcmNvZGVfbGluayh1cmw6IHN0cmluZywgc2l6ZT86IG51bWJlcilcbntcblx0c2l6ZSA9IHNpemUgfHwgMTUwO1xuXG5cdHJldHVybiBgaHR0cHM6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2h0PXFyJmNocz0ke3NpemV9eCR7c2l6ZX0mY2hsPSR7dXJsfWBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdpdF9mYWtlX2F1dGhvcihuYW1lPzogc3RyaW5nLCBlbWFpbD86IHN0cmluZylcbntcblx0ZW1haWwgPSBlbWFpbE5vcm1hbGl6ZShlbWFpbCB8fCAndGVzdGJvdEB0ZXN0LnRlc3QnKVxuXHRcdC5yZXBsYWNlKC9eW1xcc+OAgEBdK3xbXFxz44CAQF0rJC9nLCAnJylcblx0O1xuXG5cdGlmIChlbWFpbC5zcGxpdCgnQCcpLmxlbmd0aCAhPT0gMilcblx0e1xuXHRcdGVtYWlsID0gbnVsbDtcblx0fVxuXG5cdG5hbWUgPSAobmFtZSB8fCAnJylcblx0XHQucmVwbGFjZSgvW1xcLVxcK1xcPFxcPlxcW1xcXVxcP1xcKkBcXHNcIlxcJ2B+XFx7XFx9XSsvaWcsICcgJylcblx0XHQ7XG5cblx0dHJ5XG5cdHtcblx0XHRuYW1lID0gbmFtZVxuXHRcdFx0LnJlcGxhY2UoL1tcXHB7UHVuY3R1YXRpb259XS91aWcsIGZ1bmN0aW9uIChzKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoL15bXFwuXSQvLnRlc3QocykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gcztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiAnICc7XG5cdFx0XHR9KVxuXHRcdFx0LnJlcGxhY2UoL15bXFxz44CAXFxwe1B1bmN0dWF0aW9ufV0rfFtcXHPjgIBcXHB7UHVuY3R1YXRpb259XSskL3VnLCAnJylcblx0XHQ7XG5cdH1cblx0Y2F0Y2ggKGUpXG5cdHtcblxuXHR9XG5cblx0bmFtZSA9IG5hbWVcblx0XHQucmVwbGFjZSgvXltcXHPjgIBdK3xbXFxz44CAXFwuXSskL2csICcnKVxuXHRcdC5yZXBsYWNlKC9cXHMrL2csICcgJylcblx0O1xuXG5cdGlmICgvW15cXHcgXFwuXS8udGVzdChuYW1lKSAmJiBVU3RyaW5nLnNpemUobmFtZSkgPiAxNSlcblx0e1xuXHRcdG5hbWUgPSBVU3RyaW5nLnNsaWNlKG5hbWUsIDAsIDIwKTtcblx0fVxuXG5cdHJldHVybiBgJHtuYW1lIHx8ICd0ZXN0Ym90J30gPCR7ZW1haWwgfHwgJ3Rlc3Rib3RAdGVzdC50ZXN0J30+YDtcbn1cbiJdfQ==