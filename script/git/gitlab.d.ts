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
    body: {
        message: string;
    };
};
export interface IGitlabMergeRequestsCreateReturn {
    id: number;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
    target_branch: string;
    source_branch: string;
    labels: string[];
    work_in_progress: boolean;
    merge_status: string;
    merge_error: any;
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
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
    target_branch: string;
    source_branch: string;
    labels: string[];
    work_in_progress: boolean;
    merge_status: string;
    merge_error: any;
    should_remove_source_branch: boolean;
    web_url: string;
    diff_refs: {
        base_sha: string;
        head_sha: string;
        start_sha: string;
    };
};
export declare function apiGitlab(): import("gitlab/types/types").Mapper<{
    Branches: typeof APIServices.Branches;
    Commits: typeof APIServices.Commits;
    CommitDiscussions: typeof APIServices.CommitDiscussions;
    DeployKeys: typeof APIServices.DeployKeys;
    Deployments: typeof APIServices.Deployments;
    Environments: typeof APIServices.Environments;
    Issues: typeof APIServices.Issues;
    IssueAwardEmojis: typeof APIServices.IssueAwardEmojis;
    IssueNotes: typeof APIServices.IssueNotes;
    IssueDiscussions: typeof APIServices.IssueDiscussions;
    Jobs: typeof APIServices.Jobs;
    Labels: typeof APIServices.Labels;
    MergeRequests: typeof APIServices.MergeRequests;
    MergeRequestAwardEmojis: typeof APIServices.MergeRequestAwardEmojis;
    MergeRequestDiscussions: typeof APIServices.MergeRequestDiscussions;
    MergeRequestNotes: typeof APIServices.MergeRequestNotes;
    Pipelines: typeof APIServices.Pipelines;
    PipelineSchedules: typeof APIServices.PipelineSchedules;
    PipelineScheduleVariables: typeof APIServices.PipelineScheduleVariables;
    Projects: typeof APIServices.Projects;
    ProjectAccessRequests: typeof APIServices.ProjectAccessRequests;
    ProjectBadges: typeof APIServices.ProjectBadges;
    ProjectCustomAttributes: typeof APIServices.ProjectCustomAttributes;
    ProjectImportExport: typeof APIServices.ProjectImportExport;
    ProjectIssueBoards: typeof APIServices.ProjectIssueBoards;
    ProjectHooks: typeof APIServices.ProjectHooks;
    ProjectMembers: typeof APIServices.ProjectMembers;
    ProjectMilestones: typeof APIServices.ProjectMilestones;
    ProjectSnippets: typeof APIServices.ProjectSnippets;
    ProjectSnippetNotes: typeof APIServices.ProjectSnippetNotes;
    ProjectSnippetDiscussions: typeof APIServices.ProjectSnippetDiscussions;
    ProjectSnippetAwardEmojis: typeof APIServices.ProjectSnippetAwardEmojis;
    ProtectedBranches: typeof APIServices.ProtectedBranches;
    ProtectedTags: typeof APIServices.ProtectedTags;
    ProjectVariables: typeof APIServices.ProjectVariables;
    Repositories: typeof APIServices.Repositories;
    RepositoryFiles: typeof APIServices.RepositoryFiles;
    Runners: typeof APIServices.Runners;
    Services: typeof APIServices.Services;
    Tags: typeof APIServices.Tags;
    Triggers: typeof APIServices.Triggers;
}, "Branches" | "Commits" | "CommitDiscussions" | "DeployKeys" | "Deployments" | "Environments" | "Issues" | "IssueAwardEmojis" | "IssueNotes" | "IssueDiscussions" | "Jobs" | "Labels" | "MergeRequests" | "MergeRequestAwardEmojis" | "MergeRequestDiscussions" | "MergeRequestNotes" | "Pipelines" | "PipelineSchedules" | "PipelineScheduleVariables" | "Projects" | "ProjectAccessRequests" | "ProjectBadges" | "ProjectCustomAttributes" | "ProjectImportExport" | "ProjectIssueBoards" | "ProjectHooks" | "ProjectMembers" | "ProjectMilestones" | "ProjectSnippets" | "ProjectSnippetNotes" | "ProjectSnippetDiscussions" | "ProjectSnippetAwardEmojis" | "ProtectedBranches" | "ProtectedTags" | "ProjectVariables" | "Repositories" | "RepositoryFiles" | "Runners" | "Services" | "Tags" | "Triggers">;
/**
 * because gitlab will auto do `const pId = encodeURIComponent(projectId);`
 */
export declare function decodeProjectId(projectId: ProjectId): ProjectId;
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
