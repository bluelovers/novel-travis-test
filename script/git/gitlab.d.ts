/**
 * Created by user on 2019/1/26/026.
 */
import { ProjectId } from 'gitlab/types/types';
import Bluebird = require('bluebird');
import * as APIServices from 'gitlab/dist/services';
export declare function createPullRequestsGitlab(): Bluebird<IGitlabMergeRequestsCreateReturn>;
export default createPullRequestsGitlab;
declare type HTTPError = Error;
export declare type IGitlabMergeRequestsCreateError = HTTPError & {
    statusCode: number;
    statusMessage: number;
    body: {
        message: string[];
    };
};
export interface IGitlabMergeRequestsCreateReturn {
    id: number;
    iid: number;
    project_id: number;
    state: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
    target_branch: string;
    source_branch: string;
    source_project_id: number;
    target_project_id: number;
    labels: string[];
    work_in_progress: boolean;
    merge_status: string;
    merge_error: any;
    squash: boolean;
    changes_count: number;
    should_remove_source_branch: boolean;
    web_url: string;
    diff_refs: {
        base_sha: string;
        head_sha: string;
        start_sha: string;
    };
}
export declare function filterGitlabMergeRequestsCreateReturn(ret: IGitlabMergeRequestsCreateReturn): {
    id: number;
    iid: number;
    project_id: number;
    title: string;
    description: string;
    state: string;
    created_at: string;
    updated_at: string;
    target_branch: string;
    source_branch: string;
    target_project_id: number;
    source_project_id: number;
    labels: string[];
    work_in_progress: boolean;
    merge_status: string;
    merge_error: any;
    squash: boolean;
    changes_count: number;
    should_remove_source_branch: boolean;
    web_url: string;
    diff_refs: {
        base_sha: string;
        head_sha: string;
        start_sha: string;
    };
};
export declare function apiGitlab(): import("gitlab/types/types").Mapper<typeof APIServices, "Groups" | "GroupAccessRequests" | "GroupBadges" | "GroupCustomAttributes" | "GroupIssueBoards" | "GroupMembers" | "GroupMilestones" | "GroupProjects" | "GroupVariables" | "Epics" | "EpicIssues" | "EpicNotes" | "EpicDiscussions" | "Users" | "UserCustomAttributes" | "UserEmails" | "UserImpersonationTokens" | "UserKeys" | "UserGPGKeys" | "Branches" | "Commits" | "CommitDiscussions" | "DeployKeys" | "Deployments" | "Environments" | "Issues" | "IssueAwardEmojis" | "IssueNotes" | "IssueDiscussions" | "Jobs" | "Labels" | "MergeRequests" | "MergeRequestAwardEmojis" | "MergeRequestDiscussions" | "MergeRequestNotes" | "Pipelines" | "PipelineSchedules" | "PipelineScheduleVariables" | "Projects" | "ProjectAccessRequests" | "ProjectBadges" | "ProjectCustomAttributes" | "ProjectImportExport" | "ProjectIssueBoards" | "ProjectHooks" | "ProjectMembers" | "ProjectMilestones" | "ProjectSnippets" | "ProjectSnippetNotes" | "ProjectSnippetDiscussions" | "ProjectSnippetAwardEmojis" | "ProtectedBranches" | "ProtectedTags" | "ProjectVariables" | "Repositories" | "RepositoryFiles" | "Runners" | "Services" | "Tags" | "Triggers" | "Todos" | "PushRule" | "ApplicationSettings" | "BroadcastMessages" | "Events" | "FeatureFlags" | "GeoNodes" | "GitignoreTemplates" | "GitLabCIYMLTemplates" | "Keys" | "Licence" | "LicenceTemplates" | "Lint" | "Namespaces" | "NotificationSettings" | "Markdown" | "PagesDomains" | "Search" | "SidekiqMetrics" | "Snippets" | "SystemHooks" | "Version" | "Wikis">;
/**
 * because gitlab will auto do `const pId = encodeURIComponent(projectId);`
 */
export declare function decodeProjectId(projectId: ProjectId): ProjectId;
export declare function encodeProjectId(projectId: number): number;
export declare function encodeProjectId(projectId: string): string;
export declare function encodeProjectId(projectId: ProjectId): ProjectId;
export declare function _getEnvGitlab(): {
    /**
     * for api. Can be created in your profile.
     * https://gitlab.com/profile/personal_access_tokens
     */
    ACCESS_TOKEN: string;
    /**
     * username:password@
     */
    TOKEN: string;
};
