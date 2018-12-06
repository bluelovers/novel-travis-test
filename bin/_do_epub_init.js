"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const share_1 = require("../lib/share");
const git_1 = require("../script/git");
let label;
const git_2 = require("../data/git");
share_1.checkShareStatesNotExists([
    share_1.EnumShareStates.WAIT_CREATE_GIT
]) && git_1.createGit(git_2.GIT_SETTING_EPUB);
