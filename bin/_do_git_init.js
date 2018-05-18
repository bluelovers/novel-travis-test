"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const fs = require("fs-extra");
const __1 = require("..");
const index_1 = require("../index");
const project_config_1 = require("../project.config");
const init_1 = require("../script/init");
const git_1 = require("../script/git");
let label;
if (init_1.NOT_DONE && fs.pathExistsSync(init_1.DIST_NOVEL) && index_1.isGitRoot(init_1.DIST_NOVEL)) {
    __1.crossSpawnSync('git', [
        'commit',
        '-a',
        '-m',
        `[Segment] NOT_DONE`,
    ], {
        stdio: 'inherit',
        cwd: init_1.DIST_NOVEL,
    });
    git_1.pushGit();
    let branch_name = git_1.oldBranch();
    git_1.fetchGit();
    git_1.newBranch(init_1.BR_NAME);
    if (branch_name) {
        git_1.deleteBranch(branch_name, true);
    }
}
else if (fs.pathExistsSync(init_1.DIST_NOVEL) && index_1.isGitRoot(init_1.DIST_NOVEL)) {
    console.warn(`dist_novel already exists`);
    let waitpush = path.join(project_config_1.default.cache_root, '.waitpush');
    if (fs.existsSync(waitpush) || 0 && git_1.getHashHEAD() != git_1.getHashHEAD('origin/master')) {
        git_1.pushGit();
        fs.removeSync(waitpush);
    }
    let branch_name = git_1.oldBranch();
    label = `--- FETCH ---`;
    console.log(label);
    console.time(label);
    git_1.fetchGit();
    /*
    crossSpawnSync('git', [
        'reset',
        '--hard',
        'FETCH_HEAD',
    ], {
        stdio: 'inherit',
        cwd: DIST_NOVEL,
    });

    pullGit();
    */
    git_1.newBranch(init_1.BR_NAME);
    if (branch_name) {
        git_1.deleteBranch(branch_name, true);
    }
    console.timeEnd(label);
}
else {
    label = `--- CLONE ---`;
    console.log(label);
    console.time(label);
    //fs.emptyDirSync(DIST_NOVEL);
    __1.crossSpawnSync('git', [
        'clone',
        //`--depth=${CLONE_DEPTH}`,
        //'--verbose',
        //'--progress ',
        'https://gitee.com/bluelovers/novel.git',
        'dist_novel',
    ], {
        stdio: 'inherit',
        cwd: init_1.PROJECT_ROOT,
    });
    git_1.newBranch(init_1.BR_NAME);
    console.timeEnd(label);
}
