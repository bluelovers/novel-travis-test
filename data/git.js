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
    LOGIN_TOKEN: init_1.GITEE_TOKEN,
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
            git_1.gitCleanAll(data.targetPath);
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
    //url: 'gitee.com/demogitee/epub-txt.git',
    //urlClone: 'https://gitee.com/demogitee/epub-txt.git',
    url: 'gitlab.com/demonovel/epub-txt.git',
    //	urlClone: 'https://gitlab.com/demonovel/epub-txt.git',
    targetPath: path.join(project_config_1.default.project_root, 'dist_epub'),
    NOT_DONE: init_1.NOT_DONE,
    newBranchName: init_1.BR_NAME,
    CLONE_DEPTH: 10,
    LOGIN_TOKEN: init_1.GITLAB_TOKEN,
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
        },
        create_after(data, temp) {
            git_1.gitCleanAll(data.targetPath);
        },
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQWdDO0FBSWhDLCtCQUErQjtBQUMvQiwwQkFBcUQ7QUFHckQsc0RBQThDO0FBRzlDLHFDQUE2QjtBQUU3Qix5Q0FBcUg7QUFFckgsdUNBU3VCO0FBRVYsUUFBQSxzQkFBc0IsR0FBc0I7SUFDeEQsR0FBRyxFQUFFLCtCQUErQjtJQUNwQyxRQUFRLEVBQUUsd0NBQXdDO0lBQ2xELFVBQVUsRUFBRSxpQkFBVTtJQUN0QixRQUFRLEVBQVIsZUFBUTtJQUVSLGFBQWEsRUFBRSxjQUFPO0lBRXRCLFdBQVcsRUFBRSxrQkFBVztJQUV4QixFQUFFLEVBQUU7UUFDSCxhQUFhLENBQUMsSUFBSSxFQUFFLElBQUk7WUFFdkI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2NBb0JFO1lBRUYsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQ2hDO2dCQUNDLGtCQUFjLENBQUMsS0FBSyxFQUFFO29CQUNyQixRQUFRO29CQUNSLElBQUk7b0JBQ0osSUFBSTtvQkFDSixvQkFBb0I7aUJBQ3BCLEVBQUU7b0JBQ0YsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLEdBQUcsRUFBRSxJQUFJLENBQUMsVUFBVTtpQkFDcEIsQ0FBQyxDQUFDO2dCQUVILGFBQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDN0M7aUJBQ0ksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUNwQjtnQkFDQyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUVoRSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLGlCQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLGlCQUFXLENBQUMsZUFBZSxDQUFDLEVBQ2hHO29CQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQzdDLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQ3hCO2FBQ0Q7UUFDRixDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJO1FBR2pCLENBQUM7UUFFRCxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUk7WUFFdEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELGVBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUUvQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQ2Y7Z0JBQ0MsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQ3pCO29CQUNDLGtCQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQzNEO2FBQ0Q7aUJBRUQ7Z0JBQ0MsZUFBZTthQUNmO1lBRUQsaUJBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFN0IsSUFBSSxHQUFHLEdBQUcsaUJBQU0sQ0FBQztnQkFDaEIsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO2dCQUNyQixNQUFNLEVBQUUsQ0FBQztnQkFDVCxVQUFVLEVBQUUsS0FBSzthQUNqQixDQUFDLENBQUM7WUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7S0FDRDtDQUNELENBQUM7QUFFVyxRQUFBLGdCQUFnQixHQUFzQjtJQUVsRCwwQ0FBMEM7SUFDMUMsdURBQXVEO0lBRXZELEdBQUcsRUFBRSxtQ0FBbUM7SUFDekMseURBQXlEO0lBRXhELFVBQVUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQztJQUM5RCxRQUFRLEVBQVIsZUFBUTtJQUVSLGFBQWEsRUFBRSxjQUFPO0lBRXRCLFdBQVcsRUFBRSxFQUFFO0lBRWYsV0FBVyxFQUFFLG1CQUFZO0lBRXpCLEVBQUUsRUFBRTtRQUNILGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSTtZQUV2QixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQ2Y7Z0JBQ0Msa0JBQWMsQ0FBQyxLQUFLLEVBQUU7b0JBQ3JCLFFBQVE7b0JBQ1IsSUFBSTtvQkFDSixJQUFJO29CQUNKLGlCQUFpQjtpQkFDakIsRUFBRTtvQkFDRixLQUFLLEVBQUUsU0FBUztvQkFDaEIsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVO2lCQUNwQixDQUFDLENBQUM7Z0JBRUgsYUFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3ZDO1FBQ0YsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSTtZQUVoQixrQkFBYyxDQUFDLEtBQUssRUFBRTtnQkFDckIsVUFBVTtnQkFDVixJQUFJO2dCQUNKLElBQUk7Z0JBQ0osUUFBUTtnQkFDUixlQUFlO2FBQ2YsRUFBRTtnQkFDRixLQUFLLEVBQUUsU0FBUztnQkFDaEIsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVO2FBQ3BCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUk7WUFFdEIsaUJBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDOUIsQ0FBQztLQUNEO0NBQ0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgKiBhcyBjcm9zc1NwYXduIGZyb20gJ2Nyb3NzLXNwYXduJztcbmltcG9ydCBnaXRSb290IGZyb20gJ2dpdC1yb290Mic7XG5pbXBvcnQgeyBjb25maWcgYXMgZG90ZW52Q29uZmlnIH0gZnJvbSAnZG90ZW52JztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLic7XG5pbXBvcnQgeyBjcm9zc1NwYXduT3V0cHV0LCBpc0dpdFJvb3QgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBsb2FkQ2FjaGVDb25maWcsIGxvYWRNYWluQ29uZmlnIH0gZnJvbSAnQG5vZGUtbm92ZWwvdGFzay9saWIvY29uZmlnJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcbmltcG9ydCAqIGFzIEZhc3RHbG9iIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgZ2l0bG9nIGZyb20gJ2dpdGxvZzInO1xuXG5pbXBvcnQgeyBOT1RfRE9ORSwgRElTVF9OT1ZFTCwgUFJPSkVDVF9ST09ULCBCUl9OQU1FLCBDTE9ORV9ERVBUSCwgR0lURUVfVE9LRU4sIEdJVExBQl9UT0tFTiB9IGZyb20gJy4uL3NjcmlwdC9pbml0JztcblxuaW1wb3J0IHtcblx0cHVzaEdpdCxcblx0cHVsbEdpdCxcblx0ZmV0Y2hHaXQsXG5cdG5ld0JyYW5jaCxcblx0Y3VycmVudEJyYW5jaE5hbWUsXG5cdG9sZEJyYW5jaCxcblx0ZGVsZXRlQnJhbmNoLFxuXHRnZXRIYXNoSEVBRCwgY3JlYXRlR2l0LCBJT3B0aW9uc0NyZWF0ZUdpdCwgZ2V0UHVzaFVybCwgZ2l0Q2xlYW5BbGwsXG59IGZyb20gJy4uL3NjcmlwdC9naXQnO1xuXG5leHBvcnQgY29uc3QgR0lUX1NFVFRJTkdfRElTVF9OT1ZFTDogSU9wdGlvbnNDcmVhdGVHaXQgPSB7XG5cdHVybDogJ2dpdGVlLmNvbS9kZW1vZ2l0ZWUvbm92ZWwuZ2l0Jyxcblx0dXJsQ2xvbmU6ICdodHRwczovL2dpdGVlLmNvbS9ibHVlbG92ZXJzL25vdmVsLmdpdCcsXG5cdHRhcmdldFBhdGg6IERJU1RfTk9WRUwsXG5cdE5PVF9ET05FLFxuXG5cdG5ld0JyYW5jaE5hbWU6IEJSX05BTUUsXG5cblx0TE9HSU5fVE9LRU46IEdJVEVFX1RPS0VOLFxuXG5cdG9uOiB7XG5cdFx0Y3JlYXRlX2JlZm9yZShkYXRhLCB0ZW1wKVxuXHRcdHtcblx0XHRcdC8qXG5cdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQncmVtb3RlJyxcblx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdCdvcmlnaW4nLFxuXHRcdFx0XHRkYXRhLnVybENsb25lLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IGRhdGEudGFyZ2V0UGF0aCxcblx0XHRcdH0pO1xuXG5cdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQncmVtb3RlJyxcblx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdCdnaXRlZScsXG5cdFx0XHRcdGRhdGEucHVzaFVybCxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHR9KTtcblx0XHRcdCovXG5cblx0XHRcdGlmIChkYXRhLk5PVF9ET05FICYmIGRhdGEuZXhpc3RzKVxuXHRcdFx0e1xuXHRcdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRgW1NlZ21lbnRdIE5PVF9ET05FYCxcblx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0Y3dkOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHB1c2hHaXQoZGF0YS50YXJnZXRQYXRoLCBkYXRhLnB1c2hVcmwsIHRydWUpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoZGF0YS5leGlzdHMpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB3YWl0cHVzaCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICcud2FpdHB1c2gnKTtcblxuXHRcdFx0XHRpZiAoZnMuZXhpc3RzU3luYyh3YWl0cHVzaCkgfHwgMCAmJiBnZXRIYXNoSEVBRChkYXRhLnRhcmdldFBhdGgpICE9IGdldEhhc2hIRUFEKCdvcmlnaW4vbWFzdGVyJykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwdXNoR2l0KGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5wdXNoVXJsLCB0cnVlKTtcblx0XHRcdFx0XHRmcy5yZW1vdmVTeW5jKHdhaXRwdXNoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRjcmVhdGUoZGF0YSwgdGVtcClcblx0XHR7XG5cblx0XHR9LFxuXG5cdFx0Y3JlYXRlX2FmdGVyKGRhdGEsIHRlbXApXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5sb2coYG5ldyBicmFuY2g6ICR7ZGF0YS5uZXdCcmFuY2hOYW1lfWApO1xuXHRcdFx0bmV3QnJhbmNoKGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5uZXdCcmFuY2hOYW1lKTtcblxuXHRcdFx0aWYgKGRhdGEuZXhpc3RzKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoZGF0YS5leGlzdHNCcmFuY2hOYW1lKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZGVsZXRlQnJhbmNoKGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5leGlzdHNCcmFuY2hOYW1lLCB0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0e1xuXHRcdFx0XHQvLyBkbyBzb21ldGhpbmdcblx0XHRcdH1cblxuXHRcdFx0Z2l0Q2xlYW5BbGwoZGF0YS50YXJnZXRQYXRoKTtcblxuXHRcdFx0bGV0IGxvZyA9IGdpdGxvZyh7XG5cdFx0XHRcdHJlcG86IGRhdGEudGFyZ2V0UGF0aCxcblx0XHRcdFx0bnVtYmVyOiA1LFxuXHRcdFx0XHRuYW1lU3RhdHVzOiBmYWxzZSxcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zb2xlLmxvZyhsb2cpO1xuXHRcdH0sXG5cdH1cbn07XG5cbmV4cG9ydCBjb25zdCBHSVRfU0VUVElOR19FUFVCOiBJT3B0aW9uc0NyZWF0ZUdpdCA9IHtcblxuXHQvL3VybDogJ2dpdGVlLmNvbS9kZW1vZ2l0ZWUvZXB1Yi10eHQuZ2l0Jyxcblx0Ly91cmxDbG9uZTogJ2h0dHBzOi8vZ2l0ZWUuY29tL2RlbW9naXRlZS9lcHViLXR4dC5naXQnLFxuXG5cdHVybDogJ2dpdGxhYi5jb20vZGVtb25vdmVsL2VwdWItdHh0LmdpdCcsXG4vL1x0dXJsQ2xvbmU6ICdodHRwczovL2dpdGxhYi5jb20vZGVtb25vdmVsL2VwdWItdHh0LmdpdCcsXG5cblx0dGFyZ2V0UGF0aDogcGF0aC5qb2luKFByb2plY3RDb25maWcucHJvamVjdF9yb290LCAnZGlzdF9lcHViJyksXG5cdE5PVF9ET05FLFxuXG5cdG5ld0JyYW5jaE5hbWU6IEJSX05BTUUsXG5cblx0Q0xPTkVfREVQVEg6IDEwLFxuXG5cdExPR0lOX1RPS0VOOiBHSVRMQUJfVE9LRU4sXG5cblx0b246IHtcblx0XHRjcmVhdGVfYmVmb3JlKGRhdGEsIHRlbXApXG5cdFx0e1xuXHRcdFx0aWYgKGRhdGEuZXhpc3RzKVxuXHRcdFx0e1xuXHRcdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRgW2VwdWJdIE5PVF9ET05FYCxcblx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0Y3dkOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHB1c2hHaXQoZGF0YS50YXJnZXRQYXRoLCBkYXRhLnB1c2hVcmwpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRjcmVhdGUoZGF0YSwgdGVtcClcblx0XHR7XG5cdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQnY2hlY2tvdXQnLFxuXHRcdFx0XHQnLWYnLFxuXHRcdFx0XHQnLUInLFxuXHRcdFx0XHRgbWFzdGVyYCxcblx0XHRcdFx0YG9yaWdpbi9tYXN0ZXJgLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IGRhdGEudGFyZ2V0UGF0aCxcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRjcmVhdGVfYWZ0ZXIoZGF0YSwgdGVtcClcblx0XHR7XG5cdFx0XHRnaXRDbGVhbkFsbChkYXRhLnRhcmdldFBhdGgpO1xuXHRcdH0sXG5cdH1cbn07XG4iXX0=