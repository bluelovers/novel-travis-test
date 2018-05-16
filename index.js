"use strict";
/**
 * Created by user on 2018/5/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const crossSpawn = require("cross-spawn");
// @ts-ignore
const git_root2_1 = require("git-root2");
exports.isGitRoot = git_root2_1.isGitRoot;
const crlf_normalize_1 = require("crlf-normalize");
function crossSpawnAsync(bin, argv, optiobs) {
    return new Promise(function (resolve, reject) {
        try {
            let cp = crossSpawn.sync(bin, argv, optiobs);
            resolve(cp);
        }
        catch (e) {
            reject({
                errorCrossSpawn: e,
            });
        }
    })
        .catch(function (ret) {
        return ret;
    });
}
exports.crossSpawnAsync = crossSpawnAsync;
function crossSpawnSync(bin, argv, optiobs) {
    try {
        let cp = crossSpawn.sync(bin, argv, optiobs);
        return cp;
    }
    catch (e) {
        // @ts-ignore
        return {
            errorCrossSpawn: e
        };
    }
}
exports.crossSpawnSync = crossSpawnSync;
function crossSpawnOutput(buf, options = {
    clearEol: true,
}) {
    let output = '';
    if (Array.isArray(buf)) {
        output = buf
            .filter(function (b) {
            return !(!b || !b.length);
        })
            .map(function (b) {
            return b.toString();
        })
            .join("\n");
    }
    else {
        output = (buf || '').toString();
    }
    output = crlf_normalize_1.crlf(output);
    if (options.clearEol) {
        output = output.replace(/\n+$/g, '');
    }
    return output;
}
exports.crossSpawnOutput = crossSpawnOutput;
