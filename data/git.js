"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("upath2");
const fs = require("fs-extra");
const __1 = require("..");
const project_config_1 = require("../project.config");
const gitlog2_1 = require("gitlog2");
const init_1 = require("../script/init");
const token_1 = require("../script/git/token");
const git_1 = require("../script/git");
exports.GIT_SETTING_DIST_NOVEL = {
    //url: 'gitee.com/demogitee/novel.git',
    //urlClone: 'https://gitee.com/bluelovers/novel.git',
    url: 'gitlab.com/demonovel/txt-source.git',
    //urlClone: 'https://gitlab.com/novel-group/txt-source.git',
    urlClone: 'https://gitlab.com/novel-group-hidden/txt-source.git',
    targetPath: init_1.DIST_NOVEL,
    NOT_DONE: init_1.NOT_DONE,
    newBranchName: init_1.BR_NAME,
    //LOGIN_TOKEN: GITEE_TOKEN,
    //LOGIN_TOKEN: GITLAB_TOKEN,
    LOGIN_TOKEN: token_1.GIT_TOKEN,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQWdDO0FBR2hDLCtCQUErQjtBQUMvQiwwQkFBcUQ7QUFHckQsc0RBQThDO0FBRzlDLHFDQUE2QjtBQUU3Qix5Q0FBcUg7QUFFckgsK0NBQWdEO0FBRWhELHVDQVN1QjtBQUVWLFFBQUEsc0JBQXNCLEdBQXNCO0lBRXhELHVDQUF1QztJQUN2QyxxREFBcUQ7SUFFckQsR0FBRyxFQUFFLHFDQUFxQztJQUMxQyw0REFBNEQ7SUFDNUQsUUFBUSxFQUFFLHNEQUFzRDtJQUVoRSxVQUFVLEVBQUUsaUJBQVU7SUFDdEIsUUFBUSxFQUFSLGVBQVE7SUFFUixhQUFhLEVBQUUsY0FBTztJQUV0QiwyQkFBMkI7SUFDM0IsNEJBQTRCO0lBQzVCLFdBQVcsRUFBRSxpQkFBUztJQUV0QixFQUFFLEVBQUU7UUFDSCxhQUFhLENBQUMsSUFBSSxFQUFFLElBQUk7WUFFdkI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2NBb0JFO1lBRUYsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQ2hDO2dCQUNDLGtCQUFjLENBQUMsS0FBSyxFQUFFO29CQUNyQixRQUFRO29CQUNSLElBQUk7b0JBQ0osSUFBSTtvQkFDSixvQkFBb0I7aUJBQ3BCLEVBQUU7b0JBQ0YsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLEdBQUcsRUFBRSxJQUFJLENBQUMsVUFBVTtpQkFDcEIsQ0FBQyxDQUFDO2dCQUVILGFBQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDN0M7aUJBQ0ksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUNwQjtnQkFDQyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUVoRSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLGlCQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLGlCQUFXLENBQUMsZUFBZSxDQUFDLEVBQ2hHO29CQUNDLGFBQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQzdDLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQ3hCO2FBQ0Q7UUFDRixDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJO1FBR2pCLENBQUM7UUFFRCxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUk7WUFFdEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELGVBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUUvQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQ2Y7Z0JBQ0MsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQ3pCO29CQUNDLGtCQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQzNEO2FBQ0Q7aUJBRUQ7Z0JBQ0MsZUFBZTthQUNmO1lBRUQsaUJBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFN0IsSUFBSSxHQUFHLEdBQUcsaUJBQU0sQ0FBQztnQkFDaEIsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO2dCQUNyQixNQUFNLEVBQUUsQ0FBQztnQkFDVCxVQUFVLEVBQUUsS0FBSzthQUNqQixDQUFDLENBQUM7WUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7S0FDRDtDQUNELENBQUM7QUFFVyxRQUFBLGdCQUFnQixHQUFzQjtJQUVsRCwwQ0FBMEM7SUFDMUMsdURBQXVEO0lBRXZELEdBQUcsRUFBRSxtQ0FBbUM7SUFDekMseURBQXlEO0lBRXhELFVBQVUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFhLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQztJQUM5RCxRQUFRLEVBQVIsZUFBUTtJQUVSLGFBQWEsRUFBRSxjQUFPO0lBRXRCLFdBQVcsRUFBRSxFQUFFO0lBRWYsV0FBVyxFQUFFLG1CQUFZO0lBRXpCLEVBQUUsRUFBRTtRQUNILGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSTtZQUV2QixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQ2Y7Z0JBQ0Msa0JBQWMsQ0FBQyxLQUFLLEVBQUU7b0JBQ3JCLFFBQVE7b0JBQ1IsSUFBSTtvQkFDSixJQUFJO29CQUNKLGlCQUFpQjtpQkFDakIsRUFBRTtvQkFDRixLQUFLLEVBQUUsU0FBUztvQkFDaEIsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVO2lCQUNwQixDQUFDLENBQUM7Z0JBRUgsYUFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3ZDO1FBQ0YsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSTtZQUVoQixrQkFBYyxDQUFDLEtBQUssRUFBRTtnQkFDckIsVUFBVTtnQkFDVixJQUFJO2dCQUNKLElBQUk7Z0JBQ0osUUFBUTtnQkFDUixlQUFlO2FBQ2YsRUFBRTtnQkFDRixLQUFLLEVBQUUsU0FBUztnQkFDaEIsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVO2FBQ3BCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUk7WUFFdEIsaUJBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDOUIsQ0FBQztLQUNEO0NBQ0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoID0gcmVxdWlyZSgndXBhdGgyJyk7XG5pbXBvcnQgZ2l0Um9vdCBmcm9tICdnaXQtcm9vdDInO1xuaW1wb3J0IHsgY29uZmlnIGFzIGRvdGVudkNvbmZpZyB9IGZyb20gJ2RvdGVudic7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBjcm9zc1NwYXduQXN5bmMsIGNyb3NzU3Bhd25TeW5jIH0gZnJvbSAnLi4nO1xuaW1wb3J0IHsgY3Jvc3NTcGF3bk91dHB1dCwgaXNHaXRSb290IH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgbG9hZENhY2hlQ29uZmlnLCBsb2FkTWFpbkNvbmZpZyB9IGZyb20gJ0Bub2RlLW5vdmVsL3Rhc2svbGliL2NvbmZpZyc7XG5pbXBvcnQgUHJvamVjdENvbmZpZyBmcm9tICcuLi9wcm9qZWN0LmNvbmZpZyc7XG5pbXBvcnQgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5pbXBvcnQgKiBhcyBGYXN0R2xvYiBmcm9tICdmYXN0LWdsb2InO1xuaW1wb3J0IGdpdGxvZyBmcm9tICdnaXRsb2cyJztcblxuaW1wb3J0IHsgTk9UX0RPTkUsIERJU1RfTk9WRUwsIFBST0pFQ1RfUk9PVCwgQlJfTkFNRSwgQ0xPTkVfREVQVEgsIEdJVEVFX1RPS0VOLCBHSVRMQUJfVE9LRU4gfSBmcm9tICcuLi9zY3JpcHQvaW5pdCc7XG5cbmltcG9ydCB7IEdJVF9UT0tFTiB9IGZyb20gJy4uL3NjcmlwdC9naXQvdG9rZW4nO1xuXG5pbXBvcnQge1xuXHRwdXNoR2l0LFxuXHRwdWxsR2l0LFxuXHRmZXRjaEdpdCxcblx0bmV3QnJhbmNoLFxuXHRjdXJyZW50QnJhbmNoTmFtZSxcblx0b2xkQnJhbmNoLFxuXHRkZWxldGVCcmFuY2gsXG5cdGdldEhhc2hIRUFELCBjcmVhdGVHaXQsIElPcHRpb25zQ3JlYXRlR2l0LCBnZXRQdXNoVXJsLCBnaXRDbGVhbkFsbCxcbn0gZnJvbSAnLi4vc2NyaXB0L2dpdCc7XG5cbmV4cG9ydCBjb25zdCBHSVRfU0VUVElOR19ESVNUX05PVkVMOiBJT3B0aW9uc0NyZWF0ZUdpdCA9IHtcblxuXHQvL3VybDogJ2dpdGVlLmNvbS9kZW1vZ2l0ZWUvbm92ZWwuZ2l0Jyxcblx0Ly91cmxDbG9uZTogJ2h0dHBzOi8vZ2l0ZWUuY29tL2JsdWVsb3ZlcnMvbm92ZWwuZ2l0JyxcblxuXHR1cmw6ICdnaXRsYWIuY29tL2RlbW9ub3ZlbC90eHQtc291cmNlLmdpdCcsXG5cdC8vdXJsQ2xvbmU6ICdodHRwczovL2dpdGxhYi5jb20vbm92ZWwtZ3JvdXAvdHh0LXNvdXJjZS5naXQnLFxuXHR1cmxDbG9uZTogJ2h0dHBzOi8vZ2l0bGFiLmNvbS9ub3ZlbC1ncm91cC1oaWRkZW4vdHh0LXNvdXJjZS5naXQnLFxuXG5cdHRhcmdldFBhdGg6IERJU1RfTk9WRUwsXG5cdE5PVF9ET05FLFxuXG5cdG5ld0JyYW5jaE5hbWU6IEJSX05BTUUsXG5cblx0Ly9MT0dJTl9UT0tFTjogR0lURUVfVE9LRU4sXG5cdC8vTE9HSU5fVE9LRU46IEdJVExBQl9UT0tFTixcblx0TE9HSU5fVE9LRU46IEdJVF9UT0tFTixcblxuXHRvbjoge1xuXHRcdGNyZWF0ZV9iZWZvcmUoZGF0YSwgdGVtcClcblx0XHR7XG5cdFx0XHQvKlxuXHRcdFx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J3JlbW90ZScsXG5cdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHQnb3JpZ2luJyxcblx0XHRcdFx0ZGF0YS51cmxDbG9uZSxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHR9KTtcblxuXHRcdFx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J3JlbW90ZScsXG5cdFx0XHRcdCdhZGQnLFxuXHRcdFx0XHQnZ2l0ZWUnLFxuXHRcdFx0XHRkYXRhLnB1c2hVcmwsXG5cdFx0XHRdLCB7XG5cdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdGN3ZDogZGF0YS50YXJnZXRQYXRoLFxuXHRcdFx0fSk7XG5cdFx0XHQqL1xuXG5cdFx0XHRpZiAoZGF0YS5OT1RfRE9ORSAmJiBkYXRhLmV4aXN0cylcblx0XHRcdHtcblx0XHRcdFx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0YFtTZWdtZW50XSBOT1RfRE9ORWAsXG5cdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdGN3ZDogZGF0YS50YXJnZXRQYXRoLFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRwdXNoR2l0KGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5wdXNoVXJsLCB0cnVlKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGRhdGEuZXhpc3RzKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgd2FpdHB1c2ggPSBwYXRoLmpvaW4oUHJvamVjdENvbmZpZy5jYWNoZV9yb290LCAnLndhaXRwdXNoJyk7XG5cblx0XHRcdFx0aWYgKGZzLmV4aXN0c1N5bmMod2FpdHB1c2gpIHx8IDAgJiYgZ2V0SGFzaEhFQUQoZGF0YS50YXJnZXRQYXRoKSAhPSBnZXRIYXNoSEVBRCgnb3JpZ2luL21hc3RlcicpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cHVzaEdpdChkYXRhLnRhcmdldFBhdGgsIGRhdGEucHVzaFVybCwgdHJ1ZSk7XG5cdFx0XHRcdFx0ZnMucmVtb3ZlU3luYyh3YWl0cHVzaCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Y3JlYXRlKGRhdGEsIHRlbXApXG5cdFx0e1xuXG5cdFx0fSxcblxuXHRcdGNyZWF0ZV9hZnRlcihkYXRhLCB0ZW1wKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUubG9nKGBuZXcgYnJhbmNoOiAke2RhdGEubmV3QnJhbmNoTmFtZX1gKTtcblx0XHRcdG5ld0JyYW5jaChkYXRhLnRhcmdldFBhdGgsIGRhdGEubmV3QnJhbmNoTmFtZSk7XG5cblx0XHRcdGlmIChkYXRhLmV4aXN0cylcblx0XHRcdHtcblx0XHRcdFx0aWYgKGRhdGEuZXhpc3RzQnJhbmNoTmFtZSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGRlbGV0ZUJyYW5jaChkYXRhLnRhcmdldFBhdGgsIGRhdGEuZXhpc3RzQnJhbmNoTmFtZSwgdHJ1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdHtcblx0XHRcdFx0Ly8gZG8gc29tZXRoaW5nXG5cdFx0XHR9XG5cblx0XHRcdGdpdENsZWFuQWxsKGRhdGEudGFyZ2V0UGF0aCk7XG5cblx0XHRcdGxldCBsb2cgPSBnaXRsb2coe1xuXHRcdFx0XHRyZXBvOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHRcdG51bWJlcjogNSxcblx0XHRcdFx0bmFtZVN0YXR1czogZmFsc2UsXG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc29sZS5sb2cobG9nKTtcblx0XHR9LFxuXHR9XG59O1xuXG5leHBvcnQgY29uc3QgR0lUX1NFVFRJTkdfRVBVQjogSU9wdGlvbnNDcmVhdGVHaXQgPSB7XG5cblx0Ly91cmw6ICdnaXRlZS5jb20vZGVtb2dpdGVlL2VwdWItdHh0LmdpdCcsXG5cdC8vdXJsQ2xvbmU6ICdodHRwczovL2dpdGVlLmNvbS9kZW1vZ2l0ZWUvZXB1Yi10eHQuZ2l0JyxcblxuXHR1cmw6ICdnaXRsYWIuY29tL2RlbW9ub3ZlbC9lcHViLXR4dC5naXQnLFxuLy9cdHVybENsb25lOiAnaHR0cHM6Ly9naXRsYWIuY29tL2RlbW9ub3ZlbC9lcHViLXR4dC5naXQnLFxuXG5cdHRhcmdldFBhdGg6IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLnByb2plY3Rfcm9vdCwgJ2Rpc3RfZXB1YicpLFxuXHROT1RfRE9ORSxcblxuXHRuZXdCcmFuY2hOYW1lOiBCUl9OQU1FLFxuXG5cdENMT05FX0RFUFRIOiAxMCxcblxuXHRMT0dJTl9UT0tFTjogR0lUTEFCX1RPS0VOLFxuXG5cdG9uOiB7XG5cdFx0Y3JlYXRlX2JlZm9yZShkYXRhLCB0ZW1wKVxuXHRcdHtcblx0XHRcdGlmIChkYXRhLmV4aXN0cylcblx0XHRcdHtcblx0XHRcdFx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0XHQnY29tbWl0Jyxcblx0XHRcdFx0XHQnLWEnLFxuXHRcdFx0XHRcdCctbScsXG5cdFx0XHRcdFx0YFtlcHViXSBOT1RfRE9ORWAsXG5cdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRcdGN3ZDogZGF0YS50YXJnZXRQYXRoLFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRwdXNoR2l0KGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5wdXNoVXJsKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Y3JlYXRlKGRhdGEsIHRlbXApXG5cdFx0e1xuXHRcdFx0Y3Jvc3NTcGF3blN5bmMoJ2dpdCcsIFtcblx0XHRcdFx0J2NoZWNrb3V0Jyxcblx0XHRcdFx0Jy1mJyxcblx0XHRcdFx0Jy1CJyxcblx0XHRcdFx0YG1hc3RlcmAsXG5cdFx0XHRcdGBvcmlnaW4vbWFzdGVyYCxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Y3JlYXRlX2FmdGVyKGRhdGEsIHRlbXApXG5cdFx0e1xuXHRcdFx0Z2l0Q2xlYW5BbGwoZGF0YS50YXJnZXRQYXRoKTtcblx0XHR9LFxuXHR9XG59O1xuIl19