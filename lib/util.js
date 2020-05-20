"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.path_equal = exports.filterArgv = exports.git_fake_author = exports.qrcode_link = exports.freeGC = exports.showMemoryUsage = exports.memoryUsage = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7O0dBRUc7QUFDSCwrQkFBNEI7QUFDNUIsa0RBQW1EO0FBQ25ELG9DQUFxQztBQUNyQyxzQ0FBdUM7QUFDdkMsNkJBQThCO0FBRTlCLFNBQWdCLFdBQVc7SUFFMUIsT0FBTyxNQUFNLEVBQUUsQ0FBQztBQUNqQixDQUFDO0FBSEQsa0NBR0M7QUFFRCxTQUFnQixlQUFlLENBQUMsR0FBRyxHQUFHLGFBQU87SUFFNUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQ3hCLENBQUM7QUFIRCwwQ0FHQztBQUVELFNBQWdCLE1BQU0sQ0FBQyxPQUFpQjtJQUV2QyxJQUFJLE9BQU8sRUFDWDtRQUNDLGVBQWUsRUFBRSxDQUFDO0tBQ2xCO0lBRUQsSUFBSSxNQUFNLElBQUksT0FBTyxNQUFNLENBQUMsRUFBRSxLQUFLLFVBQVUsRUFDN0M7UUFDQyxJQUNBO1lBQ0MsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDO1NBQ1o7UUFDRCxPQUFPLENBQUMsRUFDUjtZQUNDLGFBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDakI7S0FDRDtBQUNGLENBQUM7QUFsQkQsd0JBa0JDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLEdBQVcsRUFBRSxJQUFhO0lBRXJELElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxDQUFDO0lBRW5CLE9BQU8sa0RBQWtELElBQUksSUFBSSxJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUE7QUFDbkYsQ0FBQztBQUxELGtDQUtDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLElBQWEsRUFBRSxLQUFjO0lBRTVELEtBQUssR0FBRyxjQUFjLENBQUMsS0FBSyxJQUFJLG1CQUFtQixDQUFDO1NBQ2xELE9BQU8sQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsQ0FDbEM7SUFFRCxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFDakM7UUFDQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0tBQ2I7SUFFRCxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1NBQ2pCLE9BQU8sQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLENBQUMsQ0FDakQ7SUFFRixJQUNBO1FBQ0MsSUFBSSxHQUFHLElBQUk7YUFDVCxPQUFPLENBQUMsc0JBQXNCLEVBQUUsVUFBVSxDQUFDO1lBRTNDLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFDcEI7Z0JBQ0MsT0FBTyxDQUFDLENBQUM7YUFDVDtZQUVELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQyxDQUFDO2FBQ0QsT0FBTyxDQUFDLGlEQUFpRCxFQUFFLEVBQUUsQ0FBQyxDQUMvRDtLQUNEO0lBQ0QsT0FBTyxDQUFDLEVBQ1I7S0FFQztJQUVELElBQUksR0FBRyxJQUFJO1NBQ1QsT0FBTyxDQUFDLG9CQUFvQixFQUFFLEVBQUUsQ0FBQztTQUNqQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUNyQjtJQUVELElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFDcEQ7UUFDQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQ2xDO0lBRUQsT0FBTyxHQUFHLElBQUksSUFBSSxTQUFTLEtBQUssS0FBSyxJQUFJLG1CQUFtQixHQUFHLENBQUM7QUFDakUsQ0FBQztBQTlDRCwwQ0E4Q0M7QUFFRCxTQUFnQixVQUFVLENBQUMsSUFBYztJQUV4QyxPQUFPLElBQUk7U0FDVCxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO1NBQ3RCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUNsQjtBQUNILENBQUM7QUFORCxnQ0FNQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxFQUFVLEVBQUUsRUFBVTtJQUVoRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUNqRCxDQUFDO0FBSEQsZ0NBR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzkvNS8wMDUuXG4gKi9cbmltcG9ydCBjb25zb2xlIGZyb20gJy4vbG9nJztcbmltcG9ydCBlbWFpbE5vcm1hbGl6ZSA9IHJlcXVpcmUoJ2VtYWlsLW5vcm1hbGl6ZScpO1xuaW1wb3J0IHByZXR0eSA9IHJlcXVpcmUoJ3ByZXR0eXVzZScpO1xuaW1wb3J0IFVTdHJpbmcgPSByZXF1aXJlKCd1bmktc3RyaW5nJyk7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG1lbW9yeVVzYWdlKCk6IHN0cmluZ1xue1xuXHRyZXR1cm4gcHJldHR5KCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93TWVtb3J5VXNhZ2UoY29uID0gY29uc29sZSlcbntcblx0Y29uLmxvZyhtZW1vcnlVc2FnZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyZWVHQyhzaG93bWVtPzogYm9vbGVhbilcbntcblx0aWYgKHNob3dtZW0pXG5cdHtcblx0XHRzaG93TWVtb3J5VXNhZ2UoKTtcblx0fVxuXG5cdGlmIChnbG9iYWwgJiYgdHlwZW9mIGdsb2JhbC5nYyA9PT0gJ2Z1bmN0aW9uJylcblx0e1xuXHRcdHRyeVxuXHRcdHtcblx0XHRcdGdsb2JhbC5nYygpO1xuXHRcdH1cblx0XHRjYXRjaCAoZSlcblx0XHR7XG5cdFx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcXJjb2RlX2xpbmsodXJsOiBzdHJpbmcsIHNpemU/OiBudW1iZXIpXG57XG5cdHNpemUgPSBzaXplIHx8IDE1MDtcblxuXHRyZXR1cm4gYGh0dHBzOi8vY2hhcnQuYXBpcy5nb29nbGUuY29tL2NoYXJ0P2NodD1xciZjaHM9JHtzaXplfXgke3NpemV9JmNobD0ke3VybH1gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnaXRfZmFrZV9hdXRob3IobmFtZT86IHN0cmluZywgZW1haWw/OiBzdHJpbmcpXG57XG5cdGVtYWlsID0gZW1haWxOb3JtYWxpemUoZW1haWwgfHwgJ3Rlc3Rib3RAdGVzdC50ZXN0Jylcblx0XHQucmVwbGFjZSgvXltcXHPjgIBAXSt8W1xcc+OAgEBdKyQvZywgJycpXG5cdDtcblxuXHRpZiAoZW1haWwuc3BsaXQoJ0AnKS5sZW5ndGggIT09IDIpXG5cdHtcblx0XHRlbWFpbCA9IG51bGw7XG5cdH1cblxuXHRuYW1lID0gKG5hbWUgfHwgJycpXG5cdFx0LnJlcGxhY2UoL1tcXC1cXCtcXDxcXD5cXFtcXF1cXD9cXCpAXFxzXCJcXCdgflxce1xcfV0rL2lnLCAnICcpXG5cdFx0O1xuXG5cdHRyeVxuXHR7XG5cdFx0bmFtZSA9IG5hbWVcblx0XHRcdC5yZXBsYWNlKC9bXFxwe1B1bmN0dWF0aW9ufV0vdWlnLCBmdW5jdGlvbiAocylcblx0XHRcdHtcblx0XHRcdFx0aWYgKC9eW1xcLl0kLy50ZXN0KHMpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIHM7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gJyAnO1xuXHRcdFx0fSlcblx0XHRcdC5yZXBsYWNlKC9eW1xcc+OAgFxccHtQdW5jdHVhdGlvbn1dK3xbXFxz44CAXFxwe1B1bmN0dWF0aW9ufV0rJC91ZywgJycpXG5cdFx0O1xuXHR9XG5cdGNhdGNoIChlKVxuXHR7XG5cblx0fVxuXG5cdG5hbWUgPSBuYW1lXG5cdFx0LnJlcGxhY2UoL15bXFxz44CAXSt8W1xcc+OAgFxcLl0rJC9nLCAnJylcblx0XHQucmVwbGFjZSgvXFxzKy9nLCAnICcpXG5cdDtcblxuXHRpZiAoL1teXFx3IFxcLl0vLnRlc3QobmFtZSkgJiYgVVN0cmluZy5zaXplKG5hbWUpID4gMTUpXG5cdHtcblx0XHRuYW1lID0gVVN0cmluZy5zbGljZShuYW1lLCAwLCAyMCk7XG5cdH1cblxuXHRyZXR1cm4gYCR7bmFtZSB8fCAndGVzdGJvdCd9IDwke2VtYWlsIHx8ICd0ZXN0Ym90QHRlc3QudGVzdCd9PmA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJBcmd2KGFyZ3Y6IHN0cmluZ1tdKVxue1xuXHRyZXR1cm4gYXJndlxuXHRcdC5maWx0ZXIodiA9PiB2ICE9IG51bGwpXG5cdFx0Lm1hcCh2ID0+IHYudHJpbSgpKVxuXHRcdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhdGhfZXF1YWwoczE6IHN0cmluZywgcDI6IHN0cmluZylcbntcblx0cmV0dXJuIHBhdGgubm9ybWFsaXplKHMxKSA9PT0gcGF0aC5ub3JtYWxpemUocDIpXG59XG4iXX0=