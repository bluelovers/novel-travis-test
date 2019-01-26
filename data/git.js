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
    urlClone: 'https://gitee.com/novel-group/txt-source.git',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQWdDO0FBR2hDLCtCQUErQjtBQUMvQiwwQkFBcUQ7QUFHckQsc0RBQThDO0FBRzlDLHFDQUE2QjtBQUU3Qix5Q0FBcUg7QUFFckgsK0NBQWdEO0FBRWhELHVDQVN1QjtBQUVWLFFBQUEsc0JBQXNCLEdBQXNCO0lBRXhELHVDQUF1QztJQUN2QyxxREFBcUQ7SUFFckQsR0FBRyxFQUFFLHFDQUFxQztJQUMxQyxRQUFRLEVBQUUsOENBQThDO0lBRXhELFVBQVUsRUFBRSxpQkFBVTtJQUN0QixRQUFRLEVBQVIsZUFBUTtJQUVSLGFBQWEsRUFBRSxjQUFPO0lBRXRCLDJCQUEyQjtJQUMzQiw0QkFBNEI7SUFDNUIsV0FBVyxFQUFFLGlCQUFTO0lBRXRCLEVBQUUsRUFBRTtRQUNILGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSTtZQUV2Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Y0FvQkU7WUFFRixJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sRUFDaEM7Z0JBQ0Msa0JBQWMsQ0FBQyxLQUFLLEVBQUU7b0JBQ3JCLFFBQVE7b0JBQ1IsSUFBSTtvQkFDSixJQUFJO29CQUNKLG9CQUFvQjtpQkFDcEIsRUFBRTtvQkFDRixLQUFLLEVBQUUsU0FBUztvQkFDaEIsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVO2lCQUNwQixDQUFDLENBQUM7Z0JBRUgsYUFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQzthQUM3QztpQkFDSSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQ3BCO2dCQUNDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBRWhFLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksaUJBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksaUJBQVcsQ0FBQyxlQUFlLENBQUMsRUFDaEc7b0JBQ0MsYUFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDN0MsRUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDeEI7YUFDRDtRQUNGLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUk7UUFHakIsQ0FBQztRQUVELFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSTtZQUV0QixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFDakQsZUFBUyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRS9DLElBQUksSUFBSSxDQUFDLE1BQU0sRUFDZjtnQkFDQyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFDekI7b0JBQ0Msa0JBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDM0Q7YUFDRDtpQkFFRDtnQkFDQyxlQUFlO2FBQ2Y7WUFFRCxpQkFBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU3QixJQUFJLEdBQUcsR0FBRyxpQkFBTSxDQUFDO2dCQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVU7Z0JBQ3JCLE1BQU0sRUFBRSxDQUFDO2dCQUNULFVBQVUsRUFBRSxLQUFLO2FBQ2pCLENBQUMsQ0FBQztZQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEIsQ0FBQztLQUNEO0NBQ0QsQ0FBQztBQUVXLFFBQUEsZ0JBQWdCLEdBQXNCO0lBRWxELDBDQUEwQztJQUMxQyx1REFBdUQ7SUFFdkQsR0FBRyxFQUFFLG1DQUFtQztJQUN6Qyx5REFBeUQ7SUFFeEQsVUFBVSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWEsQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDO0lBQzlELFFBQVEsRUFBUixlQUFRO0lBRVIsYUFBYSxFQUFFLGNBQU87SUFFdEIsV0FBVyxFQUFFLEVBQUU7SUFFZixXQUFXLEVBQUUsbUJBQVk7SUFFekIsRUFBRSxFQUFFO1FBQ0gsYUFBYSxDQUFDLElBQUksRUFBRSxJQUFJO1lBRXZCLElBQUksSUFBSSxDQUFDLE1BQU0sRUFDZjtnQkFDQyxrQkFBYyxDQUFDLEtBQUssRUFBRTtvQkFDckIsUUFBUTtvQkFDUixJQUFJO29CQUNKLElBQUk7b0JBQ0osaUJBQWlCO2lCQUNqQixFQUFFO29CQUNGLEtBQUssRUFBRSxTQUFTO29CQUNoQixHQUFHLEVBQUUsSUFBSSxDQUFDLFVBQVU7aUJBQ3BCLENBQUMsQ0FBQztnQkFFSCxhQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDdkM7UUFDRixDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJO1lBRWhCLGtCQUFjLENBQUMsS0FBSyxFQUFFO2dCQUNyQixVQUFVO2dCQUNWLElBQUk7Z0JBQ0osSUFBSTtnQkFDSixRQUFRO2dCQUNSLGVBQWU7YUFDZixFQUFFO2dCQUNGLEtBQUssRUFBRSxTQUFTO2dCQUNoQixHQUFHLEVBQUUsSUFBSSxDQUFDLFVBQVU7YUFDcEIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSTtZQUV0QixpQkFBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM5QixDQUFDO0tBQ0Q7Q0FDRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggPSByZXF1aXJlKCd1cGF0aDInKTtcbmltcG9ydCBnaXRSb290IGZyb20gJ2dpdC1yb290Mic7XG5pbXBvcnQgeyBjb25maWcgYXMgZG90ZW52Q29uZmlnIH0gZnJvbSAnZG90ZW52JztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGNyb3NzU3Bhd25Bc3luYywgY3Jvc3NTcGF3blN5bmMgfSBmcm9tICcuLic7XG5pbXBvcnQgeyBjcm9zc1NwYXduT3V0cHV0LCBpc0dpdFJvb3QgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBsb2FkQ2FjaGVDb25maWcsIGxvYWRNYWluQ29uZmlnIH0gZnJvbSAnQG5vZGUtbm92ZWwvdGFzay9saWIvY29uZmlnJztcbmltcG9ydCBQcm9qZWN0Q29uZmlnIGZyb20gJy4uL3Byb2plY3QuY29uZmlnJztcbmltcG9ydCBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcbmltcG9ydCAqIGFzIEZhc3RHbG9iIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgZ2l0bG9nIGZyb20gJ2dpdGxvZzInO1xuXG5pbXBvcnQgeyBOT1RfRE9ORSwgRElTVF9OT1ZFTCwgUFJPSkVDVF9ST09ULCBCUl9OQU1FLCBDTE9ORV9ERVBUSCwgR0lURUVfVE9LRU4sIEdJVExBQl9UT0tFTiB9IGZyb20gJy4uL3NjcmlwdC9pbml0JztcblxuaW1wb3J0IHsgR0lUX1RPS0VOIH0gZnJvbSAnLi4vc2NyaXB0L2dpdC90b2tlbic7XG5cbmltcG9ydCB7XG5cdHB1c2hHaXQsXG5cdHB1bGxHaXQsXG5cdGZldGNoR2l0LFxuXHRuZXdCcmFuY2gsXG5cdGN1cnJlbnRCcmFuY2hOYW1lLFxuXHRvbGRCcmFuY2gsXG5cdGRlbGV0ZUJyYW5jaCxcblx0Z2V0SGFzaEhFQUQsIGNyZWF0ZUdpdCwgSU9wdGlvbnNDcmVhdGVHaXQsIGdldFB1c2hVcmwsIGdpdENsZWFuQWxsLFxufSBmcm9tICcuLi9zY3JpcHQvZ2l0JztcblxuZXhwb3J0IGNvbnN0IEdJVF9TRVRUSU5HX0RJU1RfTk9WRUw6IElPcHRpb25zQ3JlYXRlR2l0ID0ge1xuXG5cdC8vdXJsOiAnZ2l0ZWUuY29tL2RlbW9naXRlZS9ub3ZlbC5naXQnLFxuXHQvL3VybENsb25lOiAnaHR0cHM6Ly9naXRlZS5jb20vYmx1ZWxvdmVycy9ub3ZlbC5naXQnLFxuXG5cdHVybDogJ2dpdGxhYi5jb20vZGVtb25vdmVsL3R4dC1zb3VyY2UuZ2l0Jyxcblx0dXJsQ2xvbmU6ICdodHRwczovL2dpdGVlLmNvbS9ub3ZlbC1ncm91cC90eHQtc291cmNlLmdpdCcsXG5cblx0dGFyZ2V0UGF0aDogRElTVF9OT1ZFTCxcblx0Tk9UX0RPTkUsXG5cblx0bmV3QnJhbmNoTmFtZTogQlJfTkFNRSxcblxuXHQvL0xPR0lOX1RPS0VOOiBHSVRFRV9UT0tFTixcblx0Ly9MT0dJTl9UT0tFTjogR0lUTEFCX1RPS0VOLFxuXHRMT0dJTl9UT0tFTjogR0lUX1RPS0VOLFxuXG5cdG9uOiB7XG5cdFx0Y3JlYXRlX2JlZm9yZShkYXRhLCB0ZW1wKVxuXHRcdHtcblx0XHRcdC8qXG5cdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQncmVtb3RlJyxcblx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdCdvcmlnaW4nLFxuXHRcdFx0XHRkYXRhLnVybENsb25lLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IGRhdGEudGFyZ2V0UGF0aCxcblx0XHRcdH0pO1xuXG5cdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQncmVtb3RlJyxcblx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdCdnaXRlZScsXG5cdFx0XHRcdGRhdGEucHVzaFVybCxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHR9KTtcblx0XHRcdCovXG5cblx0XHRcdGlmIChkYXRhLk5PVF9ET05FICYmIGRhdGEuZXhpc3RzKVxuXHRcdFx0e1xuXHRcdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRgW1NlZ21lbnRdIE5PVF9ET05FYCxcblx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0Y3dkOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHB1c2hHaXQoZGF0YS50YXJnZXRQYXRoLCBkYXRhLnB1c2hVcmwsIHRydWUpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoZGF0YS5leGlzdHMpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB3YWl0cHVzaCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICcud2FpdHB1c2gnKTtcblxuXHRcdFx0XHRpZiAoZnMuZXhpc3RzU3luYyh3YWl0cHVzaCkgfHwgMCAmJiBnZXRIYXNoSEVBRChkYXRhLnRhcmdldFBhdGgpICE9IGdldEhhc2hIRUFEKCdvcmlnaW4vbWFzdGVyJykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwdXNoR2l0KGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5wdXNoVXJsLCB0cnVlKTtcblx0XHRcdFx0XHRmcy5yZW1vdmVTeW5jKHdhaXRwdXNoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRjcmVhdGUoZGF0YSwgdGVtcClcblx0XHR7XG5cblx0XHR9LFxuXG5cdFx0Y3JlYXRlX2FmdGVyKGRhdGEsIHRlbXApXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5sb2coYG5ldyBicmFuY2g6ICR7ZGF0YS5uZXdCcmFuY2hOYW1lfWApO1xuXHRcdFx0bmV3QnJhbmNoKGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5uZXdCcmFuY2hOYW1lKTtcblxuXHRcdFx0aWYgKGRhdGEuZXhpc3RzKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoZGF0YS5leGlzdHNCcmFuY2hOYW1lKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZGVsZXRlQnJhbmNoKGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5leGlzdHNCcmFuY2hOYW1lLCB0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0e1xuXHRcdFx0XHQvLyBkbyBzb21ldGhpbmdcblx0XHRcdH1cblxuXHRcdFx0Z2l0Q2xlYW5BbGwoZGF0YS50YXJnZXRQYXRoKTtcblxuXHRcdFx0bGV0IGxvZyA9IGdpdGxvZyh7XG5cdFx0XHRcdHJlcG86IGRhdGEudGFyZ2V0UGF0aCxcblx0XHRcdFx0bnVtYmVyOiA1LFxuXHRcdFx0XHRuYW1lU3RhdHVzOiBmYWxzZSxcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zb2xlLmxvZyhsb2cpO1xuXHRcdH0sXG5cdH1cbn07XG5cbmV4cG9ydCBjb25zdCBHSVRfU0VUVElOR19FUFVCOiBJT3B0aW9uc0NyZWF0ZUdpdCA9IHtcblxuXHQvL3VybDogJ2dpdGVlLmNvbS9kZW1vZ2l0ZWUvZXB1Yi10eHQuZ2l0Jyxcblx0Ly91cmxDbG9uZTogJ2h0dHBzOi8vZ2l0ZWUuY29tL2RlbW9naXRlZS9lcHViLXR4dC5naXQnLFxuXG5cdHVybDogJ2dpdGxhYi5jb20vZGVtb25vdmVsL2VwdWItdHh0LmdpdCcsXG4vL1x0dXJsQ2xvbmU6ICdodHRwczovL2dpdGxhYi5jb20vZGVtb25vdmVsL2VwdWItdHh0LmdpdCcsXG5cblx0dGFyZ2V0UGF0aDogcGF0aC5qb2luKFByb2plY3RDb25maWcucHJvamVjdF9yb290LCAnZGlzdF9lcHViJyksXG5cdE5PVF9ET05FLFxuXG5cdG5ld0JyYW5jaE5hbWU6IEJSX05BTUUsXG5cblx0Q0xPTkVfREVQVEg6IDEwLFxuXG5cdExPR0lOX1RPS0VOOiBHSVRMQUJfVE9LRU4sXG5cblx0b246IHtcblx0XHRjcmVhdGVfYmVmb3JlKGRhdGEsIHRlbXApXG5cdFx0e1xuXHRcdFx0aWYgKGRhdGEuZXhpc3RzKVxuXHRcdFx0e1xuXHRcdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRgW2VwdWJdIE5PVF9ET05FYCxcblx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0Y3dkOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHB1c2hHaXQoZGF0YS50YXJnZXRQYXRoLCBkYXRhLnB1c2hVcmwpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRjcmVhdGUoZGF0YSwgdGVtcClcblx0XHR7XG5cdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQnY2hlY2tvdXQnLFxuXHRcdFx0XHQnLWYnLFxuXHRcdFx0XHQnLUInLFxuXHRcdFx0XHRgbWFzdGVyYCxcblx0XHRcdFx0YG9yaWdpbi9tYXN0ZXJgLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IGRhdGEudGFyZ2V0UGF0aCxcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRjcmVhdGVfYWZ0ZXIoZGF0YSwgdGVtcClcblx0XHR7XG5cdFx0XHRnaXRDbGVhbkFsbChkYXRhLnRhcmdldFBhdGgpO1xuXHRcdH0sXG5cdH1cbn07XG4iXX0=