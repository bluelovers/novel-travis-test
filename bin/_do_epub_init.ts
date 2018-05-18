import path = require('upath2');
import * as crossSpawn from 'cross-spawn';
import gitRoot from 'git-root2';
import { config as dotenvConfig } from 'dotenv';
import * as fs from 'fs-extra';
import { crossSpawnAsync, crossSpawnSync } from '..';
import { crossSpawnOutput, isGitRoot } from '../index';
import { loadCacheConfig, loadMainConfig } from '@node-novel/task/lib/config';
import ProjectConfig from '../project.config';
import moment = require('moment');
import * as FastGlob from 'fast-glob';

import { NOT_DONE, DIST_NOVEL, PROJECT_ROOT, BR_NAME, CLONE_DEPTH, GITEE_TOKEN } from '../script/init';
import {
	pushGit,
	pullGit,
	fetchGit,
	newBranch,
	currentBranchName,
	oldBranch,
	deleteBranch,
	getHashHEAD, createGit
} from '../script/git';

let label: string;

import {
	GIT_SETTING_DIST_NOVEL,
	GIT_SETTING_EPUB,
} from '../data/git';

createGit(GIT_SETTING_EPUB);
