"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by user on 2018/9/5/005.
 */
const log_1 = require("./log");
const emailNormalize = require("email-normalize");
const pretty = require("prettyuse");
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
function filterArgv(argv) {
    return argv
        .filter(v => v != null)
        .map(v => v.trim());
}
exports.filterArgv = filterArgv;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7R0FFRztBQUNILCtCQUE0QjtBQUM1QixrREFBbUQ7QUFDbkQsb0NBQXFDO0FBQ3JDLHNDQUF1QztBQUV2QyxTQUFnQixXQUFXO0lBRTFCLE9BQU8sTUFBTSxFQUFFLENBQUM7QUFDakIsQ0FBQztBQUhELGtDQUdDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLEdBQUcsR0FBRyxhQUFPO0lBRTVDLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUN4QixDQUFDO0FBSEQsMENBR0M7QUFFRCxTQUFnQixNQUFNLENBQUMsT0FBaUI7SUFFdkMsSUFBSSxPQUFPLEVBQ1g7UUFDQyxlQUFlLEVBQUUsQ0FBQztLQUNsQjtJQUVELElBQUksTUFBTSxJQUFJLE9BQU8sTUFBTSxDQUFDLEVBQUUsS0FBSyxVQUFVLEVBQzdDO1FBQ0MsSUFDQTtZQUNDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztTQUNaO1FBQ0QsT0FBTyxDQUFDLEVBQ1I7WUFDQyxhQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pCO0tBQ0Q7QUFDRixDQUFDO0FBbEJELHdCQWtCQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxHQUFXLEVBQUUsSUFBYTtJQUVyRCxJQUFJLEdBQUcsSUFBSSxJQUFJLEdBQUcsQ0FBQztJQUVuQixPQUFPLGtEQUFrRCxJQUFJLElBQUksSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFBO0FBQ25GLENBQUM7QUFMRCxrQ0FLQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxJQUFhLEVBQUUsS0FBYztJQUU1RCxLQUFLLEdBQUcsY0FBYyxDQUFDLEtBQUssSUFBSSxtQkFBbUIsQ0FBQztTQUNsRCxPQUFPLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLENBQ2xDO0lBRUQsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQ2pDO1FBQ0MsS0FBSyxHQUFHLElBQUksQ0FBQztLQUNiO0lBRUQsSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztTQUNqQixPQUFPLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxDQUFDLENBQ2pEO0lBRUYsSUFDQTtRQUNDLElBQUksR0FBRyxJQUFJO2FBQ1QsT0FBTyxDQUFDLHNCQUFzQixFQUFFLFVBQVUsQ0FBQztZQUUzQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQ3BCO2dCQUNDLE9BQU8sQ0FBQyxDQUFDO2FBQ1Q7WUFFRCxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUMsQ0FBQzthQUNELE9BQU8sQ0FBQyxpREFBaUQsRUFBRSxFQUFFLENBQUMsQ0FDL0Q7S0FDRDtJQUNELE9BQU8sQ0FBQyxFQUNSO0tBRUM7SUFFRCxJQUFJLEdBQUcsSUFBSTtTQUNULE9BQU8sQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUM7U0FDakMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FDckI7SUFFRCxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQ3BEO1FBQ0MsSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUNsQztJQUVELE9BQU8sR0FBRyxJQUFJLElBQUksU0FBUyxLQUFLLEtBQUssSUFBSSxtQkFBbUIsR0FBRyxDQUFDO0FBQ2pFLENBQUM7QUE5Q0QsMENBOENDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLElBQWM7SUFFeEMsT0FBTyxJQUFJO1NBQ1QsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztTQUN0QixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FDbEI7QUFDSCxDQUFDO0FBTkQsZ0NBTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzkvNS8wMDUuXG4gKi9cbmltcG9ydCBjb25zb2xlIGZyb20gJy4vbG9nJztcbmltcG9ydCBlbWFpbE5vcm1hbGl6ZSA9IHJlcXVpcmUoJ2VtYWlsLW5vcm1hbGl6ZScpO1xuaW1wb3J0IHByZXR0eSA9IHJlcXVpcmUoJ3ByZXR0eXVzZScpO1xuaW1wb3J0IFVTdHJpbmcgPSByZXF1aXJlKCd1bmktc3RyaW5nJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBtZW1vcnlVc2FnZSgpOiBzdHJpbmdcbntcblx0cmV0dXJuIHByZXR0eSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd01lbW9yeVVzYWdlKGNvbiA9IGNvbnNvbGUpXG57XG5cdGNvbi5sb2cobWVtb3J5VXNhZ2UoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcmVlR0Moc2hvd21lbT86IGJvb2xlYW4pXG57XG5cdGlmIChzaG93bWVtKVxuXHR7XG5cdFx0c2hvd01lbW9yeVVzYWdlKCk7XG5cdH1cblxuXHRpZiAoZ2xvYmFsICYmIHR5cGVvZiBnbG9iYWwuZ2MgPT09ICdmdW5jdGlvbicpXG5cdHtcblx0XHR0cnlcblx0XHR7XG5cdFx0XHRnbG9iYWwuZ2MoKTtcblx0XHR9XG5cdFx0Y2F0Y2ggKGUpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHFyY29kZV9saW5rKHVybDogc3RyaW5nLCBzaXplPzogbnVtYmVyKVxue1xuXHRzaXplID0gc2l6ZSB8fCAxNTA7XG5cblx0cmV0dXJuIGBodHRwczovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHQ9cXImY2hzPSR7c2l6ZX14JHtzaXplfSZjaGw9JHt1cmx9YFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2l0X2Zha2VfYXV0aG9yKG5hbWU/OiBzdHJpbmcsIGVtYWlsPzogc3RyaW5nKVxue1xuXHRlbWFpbCA9IGVtYWlsTm9ybWFsaXplKGVtYWlsIHx8ICd0ZXN0Ym90QHRlc3QudGVzdCcpXG5cdFx0LnJlcGxhY2UoL15bXFxz44CAQF0rfFtcXHPjgIBAXSskL2csICcnKVxuXHQ7XG5cblx0aWYgKGVtYWlsLnNwbGl0KCdAJykubGVuZ3RoICE9PSAyKVxuXHR7XG5cdFx0ZW1haWwgPSBudWxsO1xuXHR9XG5cblx0bmFtZSA9IChuYW1lIHx8ICcnKVxuXHRcdC5yZXBsYWNlKC9bXFwtXFwrXFw8XFw+XFxbXFxdXFw/XFwqQFxcc1wiXFwnYH5cXHtcXH1dKy9pZywgJyAnKVxuXHRcdDtcblxuXHR0cnlcblx0e1xuXHRcdG5hbWUgPSBuYW1lXG5cdFx0XHQucmVwbGFjZSgvW1xccHtQdW5jdHVhdGlvbn1dL3VpZywgZnVuY3Rpb24gKHMpXG5cdFx0XHR7XG5cdFx0XHRcdGlmICgvXltcXC5dJC8udGVzdChzKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiBzO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuICcgJztcblx0XHRcdH0pXG5cdFx0XHQucmVwbGFjZSgvXltcXHPjgIBcXHB7UHVuY3R1YXRpb259XSt8W1xcc+OAgFxccHtQdW5jdHVhdGlvbn1dKyQvdWcsICcnKVxuXHRcdDtcblx0fVxuXHRjYXRjaCAoZSlcblx0e1xuXG5cdH1cblxuXHRuYW1lID0gbmFtZVxuXHRcdC5yZXBsYWNlKC9eW1xcc+OAgF0rfFtcXHPjgIBcXC5dKyQvZywgJycpXG5cdFx0LnJlcGxhY2UoL1xccysvZywgJyAnKVxuXHQ7XG5cblx0aWYgKC9bXlxcdyBcXC5dLy50ZXN0KG5hbWUpICYmIFVTdHJpbmcuc2l6ZShuYW1lKSA+IDE1KVxuXHR7XG5cdFx0bmFtZSA9IFVTdHJpbmcuc2xpY2UobmFtZSwgMCwgMjApO1xuXHR9XG5cblx0cmV0dXJuIGAke25hbWUgfHwgJ3Rlc3Rib3QnfSA8JHtlbWFpbCB8fCAndGVzdGJvdEB0ZXN0LnRlc3QnfT5gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyQXJndihhcmd2OiBzdHJpbmdbXSlcbntcblx0cmV0dXJuIGFyZ3Zcblx0XHQuZmlsdGVyKHYgPT4gdiAhPSBudWxsKVxuXHRcdC5tYXAodiA9PiB2LnRyaW0oKSlcblx0XHQ7XG59XG4iXX0=