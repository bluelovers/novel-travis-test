/**
 * Created by user on 2018/5/16/016.
 */

import NodeNovelTask from '@node-novel/task';

import { crossSpawnAsync, crossSpawnSync, getCrossSpawnError, SpawnASyncReturnsPromise, SpawnASyncReturns, SpawnSyncReturns, SpawnOptions, SpawnSyncOptions, crossSpawnOutput } from './lib/util/cross-spawn';

export { crossSpawnAsync, crossSpawnSync, getCrossSpawnError, SpawnASyncReturnsPromise, SpawnASyncReturns, SpawnSyncReturns, SpawnOptions, SpawnSyncOptions, crossSpawnOutput }

import { config as dotenvConfig } from 'dotenv';
import path = require('upath2');
// @ts-ignore
import gitRoot, { isGitRoot } from 'git-root2';
import { crlf, LF } from 'crlf-normalize';
import ProjectConfig from './project.config';

export { isGitRoot }

export let DIST_NOVEL = ProjectConfig.novel_root;
