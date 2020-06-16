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
//# sourceMappingURL=util.js.map