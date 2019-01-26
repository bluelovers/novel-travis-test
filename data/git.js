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
    //urlClone: 'https://gitlab.com/novel-group-hidden/txt-source.git',
    urlClone: git_1.getPushUrl('gitlab.com/novel-group-hidden/txt-source.git', token_1.GIT_TOKEN),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2l0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQWdDO0FBR2hDLCtCQUErQjtBQUMvQiwwQkFBcUQ7QUFHckQsc0RBQThDO0FBRzlDLHFDQUE2QjtBQUU3Qix5Q0FBcUg7QUFFckgsK0NBQWdEO0FBRWhELHVDQVN1QjtBQUVWLFFBQUEsc0JBQXNCLEdBQXNCO0lBRXhELHVDQUF1QztJQUN2QyxxREFBcUQ7SUFFckQsR0FBRyxFQUFFLHFDQUFxQztJQUMxQyw0REFBNEQ7SUFDNUQsbUVBQW1FO0lBRW5FLFFBQVEsRUFBRSxnQkFBVSxDQUFDLDhDQUE4QyxFQUFFLGlCQUFTLENBQUM7SUFFL0UsVUFBVSxFQUFFLGlCQUFVO0lBQ3RCLFFBQVEsRUFBUixlQUFRO0lBRVIsYUFBYSxFQUFFLGNBQU87SUFFdEIsMkJBQTJCO0lBQzNCLDRCQUE0QjtJQUM1QixXQUFXLEVBQUUsaUJBQVM7SUFFdEIsRUFBRSxFQUFFO1FBQ0gsYUFBYSxDQUFDLElBQUksRUFBRSxJQUFJO1lBRXZCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztjQW9CRTtZQUVGLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUNoQztnQkFDQyxrQkFBYyxDQUFDLEtBQUssRUFBRTtvQkFDckIsUUFBUTtvQkFDUixJQUFJO29CQUNKLElBQUk7b0JBQ0osb0JBQW9CO2lCQUNwQixFQUFFO29CQUNGLEtBQUssRUFBRSxTQUFTO29CQUNoQixHQUFHLEVBQUUsSUFBSSxDQUFDLFVBQVU7aUJBQ3BCLENBQUMsQ0FBQztnQkFFSCxhQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQzdDO2lCQUNJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFDcEI7Z0JBQ0MsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFFaEUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxpQkFBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxpQkFBVyxDQUFDLGVBQWUsQ0FBQyxFQUNoRztvQkFDQyxhQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUM3QyxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUN4QjthQUNEO1FBQ0YsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSTtRQUdqQixDQUFDO1FBRUQsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJO1lBRXRCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUNqRCxlQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFL0MsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUNmO2dCQUNDLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUN6QjtvQkFDQyxrQkFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUMzRDthQUNEO2lCQUVEO2dCQUNDLGVBQWU7YUFDZjtZQUVELGlCQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTdCLElBQUksR0FBRyxHQUFHLGlCQUFNLENBQUM7Z0JBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVTtnQkFDckIsTUFBTSxFQUFFLENBQUM7Z0JBQ1QsVUFBVSxFQUFFLEtBQUs7YUFDakIsQ0FBQyxDQUFDO1lBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQixDQUFDO0tBQ0Q7Q0FDRCxDQUFDO0FBRVcsUUFBQSxnQkFBZ0IsR0FBc0I7SUFFbEQsMENBQTBDO0lBQzFDLHVEQUF1RDtJQUV2RCxHQUFHLEVBQUUsbUNBQW1DO0lBQ3pDLHlEQUF5RDtJQUV4RCxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBYSxDQUFDLFlBQVksRUFBRSxXQUFXLENBQUM7SUFDOUQsUUFBUSxFQUFSLGVBQVE7SUFFUixhQUFhLEVBQUUsY0FBTztJQUV0QixXQUFXLEVBQUUsRUFBRTtJQUVmLFdBQVcsRUFBRSxtQkFBWTtJQUV6QixFQUFFLEVBQUU7UUFDSCxhQUFhLENBQUMsSUFBSSxFQUFFLElBQUk7WUFFdkIsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUNmO2dCQUNDLGtCQUFjLENBQUMsS0FBSyxFQUFFO29CQUNyQixRQUFRO29CQUNSLElBQUk7b0JBQ0osSUFBSTtvQkFDSixpQkFBaUI7aUJBQ2pCLEVBQUU7b0JBQ0YsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLEdBQUcsRUFBRSxJQUFJLENBQUMsVUFBVTtpQkFDcEIsQ0FBQyxDQUFDO2dCQUVILGFBQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUN2QztRQUNGLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUk7WUFFaEIsa0JBQWMsQ0FBQyxLQUFLLEVBQUU7Z0JBQ3JCLFVBQVU7Z0JBQ1YsSUFBSTtnQkFDSixJQUFJO2dCQUNKLFFBQVE7Z0JBQ1IsZUFBZTthQUNmLEVBQUU7Z0JBQ0YsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLEdBQUcsRUFBRSxJQUFJLENBQUMsVUFBVTthQUNwQixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJO1lBRXRCLGlCQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FDRDtDQUNELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3VwYXRoMicpO1xuaW1wb3J0IGdpdFJvb3QgZnJvbSAnZ2l0LXJvb3QyJztcbmltcG9ydCB7IGNvbmZpZyBhcyBkb3RlbnZDb25maWcgfSBmcm9tICdkb3RlbnYnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgY3Jvc3NTcGF3bkFzeW5jLCBjcm9zc1NwYXduU3luYyB9IGZyb20gJy4uJztcbmltcG9ydCB7IGNyb3NzU3Bhd25PdXRwdXQsIGlzR2l0Um9vdCB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IGxvYWRDYWNoZUNvbmZpZywgbG9hZE1haW5Db25maWcgfSBmcm9tICdAbm9kZS1ub3ZlbC90YXNrL2xpYi9jb25maWcnO1xuaW1wb3J0IFByb2plY3RDb25maWcgZnJvbSAnLi4vcHJvamVjdC5jb25maWcnO1xuaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuaW1wb3J0ICogYXMgRmFzdEdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCBnaXRsb2cgZnJvbSAnZ2l0bG9nMic7XG5cbmltcG9ydCB7IE5PVF9ET05FLCBESVNUX05PVkVMLCBQUk9KRUNUX1JPT1QsIEJSX05BTUUsIENMT05FX0RFUFRILCBHSVRFRV9UT0tFTiwgR0lUTEFCX1RPS0VOIH0gZnJvbSAnLi4vc2NyaXB0L2luaXQnO1xuXG5pbXBvcnQgeyBHSVRfVE9LRU4gfSBmcm9tICcuLi9zY3JpcHQvZ2l0L3Rva2VuJztcblxuaW1wb3J0IHtcblx0cHVzaEdpdCxcblx0cHVsbEdpdCxcblx0ZmV0Y2hHaXQsXG5cdG5ld0JyYW5jaCxcblx0Y3VycmVudEJyYW5jaE5hbWUsXG5cdG9sZEJyYW5jaCxcblx0ZGVsZXRlQnJhbmNoLFxuXHRnZXRIYXNoSEVBRCwgY3JlYXRlR2l0LCBJT3B0aW9uc0NyZWF0ZUdpdCwgZ2V0UHVzaFVybCwgZ2l0Q2xlYW5BbGwsXG59IGZyb20gJy4uL3NjcmlwdC9naXQnO1xuXG5leHBvcnQgY29uc3QgR0lUX1NFVFRJTkdfRElTVF9OT1ZFTDogSU9wdGlvbnNDcmVhdGVHaXQgPSB7XG5cblx0Ly91cmw6ICdnaXRlZS5jb20vZGVtb2dpdGVlL25vdmVsLmdpdCcsXG5cdC8vdXJsQ2xvbmU6ICdodHRwczovL2dpdGVlLmNvbS9ibHVlbG92ZXJzL25vdmVsLmdpdCcsXG5cblx0dXJsOiAnZ2l0bGFiLmNvbS9kZW1vbm92ZWwvdHh0LXNvdXJjZS5naXQnLFxuXHQvL3VybENsb25lOiAnaHR0cHM6Ly9naXRsYWIuY29tL25vdmVsLWdyb3VwL3R4dC1zb3VyY2UuZ2l0Jyxcblx0Ly91cmxDbG9uZTogJ2h0dHBzOi8vZ2l0bGFiLmNvbS9ub3ZlbC1ncm91cC1oaWRkZW4vdHh0LXNvdXJjZS5naXQnLFxuXG5cdHVybENsb25lOiBnZXRQdXNoVXJsKCdnaXRsYWIuY29tL25vdmVsLWdyb3VwLWhpZGRlbi90eHQtc291cmNlLmdpdCcsIEdJVF9UT0tFTiksXG5cblx0dGFyZ2V0UGF0aDogRElTVF9OT1ZFTCxcblx0Tk9UX0RPTkUsXG5cblx0bmV3QnJhbmNoTmFtZTogQlJfTkFNRSxcblxuXHQvL0xPR0lOX1RPS0VOOiBHSVRFRV9UT0tFTixcblx0Ly9MT0dJTl9UT0tFTjogR0lUTEFCX1RPS0VOLFxuXHRMT0dJTl9UT0tFTjogR0lUX1RPS0VOLFxuXG5cdG9uOiB7XG5cdFx0Y3JlYXRlX2JlZm9yZShkYXRhLCB0ZW1wKVxuXHRcdHtcblx0XHRcdC8qXG5cdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQncmVtb3RlJyxcblx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdCdvcmlnaW4nLFxuXHRcdFx0XHRkYXRhLnVybENsb25lLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IGRhdGEudGFyZ2V0UGF0aCxcblx0XHRcdH0pO1xuXG5cdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQncmVtb3RlJyxcblx0XHRcdFx0J2FkZCcsXG5cdFx0XHRcdCdnaXRlZScsXG5cdFx0XHRcdGRhdGEucHVzaFVybCxcblx0XHRcdF0sIHtcblx0XHRcdFx0c3RkaW86ICdpbmhlcml0Jyxcblx0XHRcdFx0Y3dkOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHR9KTtcblx0XHRcdCovXG5cblx0XHRcdGlmIChkYXRhLk5PVF9ET05FICYmIGRhdGEuZXhpc3RzKVxuXHRcdFx0e1xuXHRcdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRgW1NlZ21lbnRdIE5PVF9ET05FYCxcblx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0Y3dkOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHB1c2hHaXQoZGF0YS50YXJnZXRQYXRoLCBkYXRhLnB1c2hVcmwsIHRydWUpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoZGF0YS5leGlzdHMpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB3YWl0cHVzaCA9IHBhdGguam9pbihQcm9qZWN0Q29uZmlnLmNhY2hlX3Jvb3QsICcud2FpdHB1c2gnKTtcblxuXHRcdFx0XHRpZiAoZnMuZXhpc3RzU3luYyh3YWl0cHVzaCkgfHwgMCAmJiBnZXRIYXNoSEVBRChkYXRhLnRhcmdldFBhdGgpICE9IGdldEhhc2hIRUFEKCdvcmlnaW4vbWFzdGVyJykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwdXNoR2l0KGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5wdXNoVXJsLCB0cnVlKTtcblx0XHRcdFx0XHRmcy5yZW1vdmVTeW5jKHdhaXRwdXNoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRjcmVhdGUoZGF0YSwgdGVtcClcblx0XHR7XG5cblx0XHR9LFxuXG5cdFx0Y3JlYXRlX2FmdGVyKGRhdGEsIHRlbXApXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5sb2coYG5ldyBicmFuY2g6ICR7ZGF0YS5uZXdCcmFuY2hOYW1lfWApO1xuXHRcdFx0bmV3QnJhbmNoKGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5uZXdCcmFuY2hOYW1lKTtcblxuXHRcdFx0aWYgKGRhdGEuZXhpc3RzKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoZGF0YS5leGlzdHNCcmFuY2hOYW1lKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZGVsZXRlQnJhbmNoKGRhdGEudGFyZ2V0UGF0aCwgZGF0YS5leGlzdHNCcmFuY2hOYW1lLCB0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0e1xuXHRcdFx0XHQvLyBkbyBzb21ldGhpbmdcblx0XHRcdH1cblxuXHRcdFx0Z2l0Q2xlYW5BbGwoZGF0YS50YXJnZXRQYXRoKTtcblxuXHRcdFx0bGV0IGxvZyA9IGdpdGxvZyh7XG5cdFx0XHRcdHJlcG86IGRhdGEudGFyZ2V0UGF0aCxcblx0XHRcdFx0bnVtYmVyOiA1LFxuXHRcdFx0XHRuYW1lU3RhdHVzOiBmYWxzZSxcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zb2xlLmxvZyhsb2cpO1xuXHRcdH0sXG5cdH1cbn07XG5cbmV4cG9ydCBjb25zdCBHSVRfU0VUVElOR19FUFVCOiBJT3B0aW9uc0NyZWF0ZUdpdCA9IHtcblxuXHQvL3VybDogJ2dpdGVlLmNvbS9kZW1vZ2l0ZWUvZXB1Yi10eHQuZ2l0Jyxcblx0Ly91cmxDbG9uZTogJ2h0dHBzOi8vZ2l0ZWUuY29tL2RlbW9naXRlZS9lcHViLXR4dC5naXQnLFxuXG5cdHVybDogJ2dpdGxhYi5jb20vZGVtb25vdmVsL2VwdWItdHh0LmdpdCcsXG4vL1x0dXJsQ2xvbmU6ICdodHRwczovL2dpdGxhYi5jb20vZGVtb25vdmVsL2VwdWItdHh0LmdpdCcsXG5cblx0dGFyZ2V0UGF0aDogcGF0aC5qb2luKFByb2plY3RDb25maWcucHJvamVjdF9yb290LCAnZGlzdF9lcHViJyksXG5cdE5PVF9ET05FLFxuXG5cdG5ld0JyYW5jaE5hbWU6IEJSX05BTUUsXG5cblx0Q0xPTkVfREVQVEg6IDEwLFxuXG5cdExPR0lOX1RPS0VOOiBHSVRMQUJfVE9LRU4sXG5cblx0b246IHtcblx0XHRjcmVhdGVfYmVmb3JlKGRhdGEsIHRlbXApXG5cdFx0e1xuXHRcdFx0aWYgKGRhdGEuZXhpc3RzKVxuXHRcdFx0e1xuXHRcdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHRcdCdjb21taXQnLFxuXHRcdFx0XHRcdCctYScsXG5cdFx0XHRcdFx0Jy1tJyxcblx0XHRcdFx0XHRgW2VwdWJdIE5PVF9ET05FYCxcblx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdFx0XHRcdFx0Y3dkOiBkYXRhLnRhcmdldFBhdGgsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHB1c2hHaXQoZGF0YS50YXJnZXRQYXRoLCBkYXRhLnB1c2hVcmwpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRjcmVhdGUoZGF0YSwgdGVtcClcblx0XHR7XG5cdFx0XHRjcm9zc1NwYXduU3luYygnZ2l0JywgW1xuXHRcdFx0XHQnY2hlY2tvdXQnLFxuXHRcdFx0XHQnLWYnLFxuXHRcdFx0XHQnLUInLFxuXHRcdFx0XHRgbWFzdGVyYCxcblx0XHRcdFx0YG9yaWdpbi9tYXN0ZXJgLFxuXHRcdFx0XSwge1xuXHRcdFx0XHRzdGRpbzogJ2luaGVyaXQnLFxuXHRcdFx0XHRjd2Q6IGRhdGEudGFyZ2V0UGF0aCxcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRjcmVhdGVfYWZ0ZXIoZGF0YSwgdGVtcClcblx0XHR7XG5cdFx0XHRnaXRDbGVhbkFsbChkYXRhLnRhcmdldFBhdGgpO1xuXHRcdH0sXG5cdH1cbn07XG4iXX0=