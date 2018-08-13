"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const fs = require("fs-extra");
const __1 = require("..");
const project_config_1 = require("../project.config");
const gitlog2_1 = require("gitlog2");
const init_1 = require("../script/init");
const git_1 = require("../script/git");
exports.GIT_SETTING_DIST_NOVEL = {
    url: 'gitee.com/demogitee/novel.git',
    urlClone: 'https://gitee.com/bluelovers/novel.git',
    targetPath: init_1.DIST_NOVEL,
    NOT_DONE: init_1.NOT_DONE,
    newBranchName: init_1.BR_NAME,
    on: {
        create_before(data, temp) {
            /*
            crossSpawnSync('git', [
                'remote',
                'add',
                'origin',
                data.urlClone,
            ], {
                stdio: 'inherit',
                cwd: data.targetPath,
            });

            crossSpawnSync('git', [
                'remote',
                'add',
                'gitee',
                data.pushUrl,
            ], {
                stdio: 'inherit',
                cwd: data.targetPath,
            });
            */
            if (data.NOT_DONE && data.exists) {
                __1.crossSpawnSync('git', [
                    'commit',
                    '-a',
                    '-m',
                    `[Segment] NOT_DONE`,
                ], {
                    stdio: 'inherit',
                    cwd: data.targetPath,
                });
                git_1.pushGit(data.targetPath, data.pushUrl, true);
            }
            else if (data.exists) {
                let waitpush = path.join(project_config_1.default.cache_root, '.waitpush');
                if (fs.existsSync(waitpush) || 0 && git_1.getHashHEAD(data.targetPath) != git_1.getHashHEAD('origin/master')) {
                    git_1.pushGit(data.targetPath, data.pushUrl, true);
                    fs.removeSync(waitpush);
                }
            }
        },
        create(data, temp) {
        },
        create_after(data, temp) {
            console.log(`new branch: ${data.newBranchName}`);
            git_1.newBranch(data.targetPath, data.newBranchName);
            if (data.exists) {
                if (data.existsBranchName) {
                    git_1.deleteBranch(data.targetPath, data.existsBranchName, true);
                }
            }
            else {
                // do something
            }
            console.log(`[git:clean] Remove untracked files from the working tree`);
            __1.crossSpawnSync('git', [
                'clean',
                '-d',
                '-fx',
            ], {
                stdio: 'inherit',
                cwd: data.targetPath,
            });
            let log = gitlog2_1.default({
                repo: data.targetPath,
                number: 5,
                nameStatus: false,
            });
            console.log(log);
        },
    }
};
exports.GIT_SETTING_EPUB = {
    url: 'gitee.com/demogitee/epub-txt.git',
    urlClone: 'https://gitee.com/demogitee/epub-txt.git',
    targetPath: path.join(project_config_1.default.project_root, 'dist_epub'),
    NOT_DONE: init_1.NOT_DONE,
    newBranchName: init_1.BR_NAME,
    on: {
        create_before(data, temp) {
            if (data.exists) {
                __1.crossSpawnSync('git', [
                    'commit',
                    '-a',
                    '-m',
                    `[epub] NOT_DONE`,
                ], {
                    stdio: 'inherit',
                    cwd: data.targetPath,
                });
                git_1.pushGit(data.targetPath, data.pushUrl);
            }
        },
        create(data, temp) {
            __1.crossSpawnSync('git', [
                'checkout',
                '-f',
                '-B',
                `master`,
                `origin/master`,
            ], {
                stdio: 'inherit',
                cwd: data.targetPath,
            });
            console.log(`[git:clean] Remove untracked files from the working tree`);
            __1.crossSpawnSync('git', [
                'clean',
                '-d',
                '-fx',
            ], {
                stdio: 'inherit',
                cwd: data.targetPath,
            });
        },
        create_after(data, temp) {
        },
    }
};
