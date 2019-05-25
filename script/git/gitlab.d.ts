/**
 * Created by user on 2019/1/26/026.
 */
import Bluebird = require('bluebird');
declare type ProjectId = string | number;
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
export declare function apiGitlab(): {
    Groups: import("gitlab/dist/latest/services/Groups").default;
    GroupAccessRequests: import("gitlab/dist/latest/services/GroupAccessRequests").default;
    GroupBadges: import("gitlab/dist/latest/services/GroupBadges").default;
    GroupCustomAttributes: import("gitlab/dist/latest/services/GroupCustomAttributes").default;
    GroupIssueBoards: import("gitlab/dist/latest/services/GroupIssueBoards").default;
    GroupMembers: import("gitlab/dist/latest/services/GroupMembers").default;
    GroupMilestones: import("gitlab/dist/latest/services/GroupMilestones").default;
    GroupProjects: import("gitlab/dist/latest/services/GroupProjects").default;
    GroupVariables: import("gitlab/dist/latest/services/GroupVariables").default;
    Epics: import("gitlab/dist/latest/services/Epics").default;
    EpicIssues: import("gitlab/dist/latest/services/EpicIssues").default;
    EpicNotes: import("gitlab/dist/latest/services/EpicNotes").default;
    EpicDiscussions: import("gitlab/dist/latest/services/EpicDiscussions").default;
    Users: import("gitlab/dist/latest/services/Users").default;
    UserCustomAttributes: import("gitlab/dist/latest/services/UserCustomAttributes").default;
    UserEmails: import("gitlab/dist/latest/services/UserEmails").default;
    UserImpersonationTokens: import("gitlab/dist/latest/services/UserImpersonationTokens").default;
    UserKeys: import("gitlab/dist/latest/services/UserKeys").default;
    UserGPGKeys: import("gitlab/dist/latest/services/UserGPGKeys").default;
    Branches: import("gitlab/dist/latest/services/Branches").default;
    Commits: import("gitlab/dist/latest/services/Commits").default;
    CommitDiscussions: import("gitlab/dist/latest/services/CommitDiscussions").default;
    Deployments: import("gitlab/dist/latest/services/Deployments").default;
    DeployKeys: import("gitlab/dist/latest/services/DeployKeys").default;
    Environments: import("gitlab/dist/latest/services/Environments").default;
    Issues: import("gitlab/dist/latest/services/Issues").default;
    IssueNotes: import("gitlab/dist/latest/services/IssueNotes").default;
    IssueDiscussions: import("gitlab/dist/latest/services/IssueDiscussions").default;
    IssueAwardEmojis: import("gitlab/dist/latest/services/IssueAwardEmojis").default;
    Jobs: import("gitlab/dist/latest/services/Jobs").default;
    Labels: import("gitlab/dist/latest/services/Labels").default;
    MergeRequests: import("gitlab/dist/latest/services/MergeRequests").default;
    MergeRequestAwardEmojis: import("gitlab/dist/latest/services/MergeRequestAwardEmojis").default;
    MergeRequestDiscussions: import("gitlab/dist/latest/services/MergeRequestDiscussions").default;
    MergeRequestNotes: import("gitlab/dist/latest/services/MergeRequestNotes").default;
    Pipelines: import("gitlab/dist/latest/services/Pipelines").default;
    PipelineSchedules: import("gitlab/dist/latest/services/PipelineSchedules").default;
    PipelineScheduleVariables: import("gitlab/dist/latest/services/PipelineScheduleVariables").default;
    Projects: import("gitlab/dist/latest/services/Projects").default;
    ProjectAccessRequests: import("gitlab/dist/latest/services/ProjectAccessRequests").default;
    ProjectBadges: import("gitlab/dist/latest/services/ProjectBadges").default;
    ProjectCustomAttributes: import("gitlab/dist/latest/services/ProjectCustomAttributes").default;
    ProjectImportExport: import("gitlab/dist/latest/services/ProjectImportExport").default;
    ProjectIssueBoards: import("gitlab/dist/latest/services/ProjectIssueBoards").default;
    ProjectHooks: import("gitlab/dist/latest/services/ProjectHooks").default;
    ProjectMembers: import("gitlab/dist/latest/services/ProjectMembers").default;
    ProjectMilestones: import("gitlab/dist/latest/services/ProjectMilestones").default;
    ProjectSnippets: import("gitlab/dist/latest/services/ProjectSnippets").default;
    ProjectSnippetNotes: import("gitlab/dist/latest/services/ProjectSnippetNotes").default;
    ProjectSnippetDiscussions: import("gitlab/dist/latest/services/ProjectSnippetDiscussions").default;
    ProjectSnippetAwardEmojis: import("gitlab/dist/latest/services/ProjectSnippetAwardEmojis").default;
    ProtectedBranches: import("gitlab/dist/latest/services/ProtectedBranches").default;
    ProtectedTags: import("gitlab/dist/latest/services/ProtectedTags").default;
    ProjectVariables: import("gitlab/dist/latest/services/ProjectVariables").default;
    Repositories: import("gitlab/dist/latest/services/Repositories").default;
    RepositoryFiles: import("gitlab/dist/latest/services/RepositoryFiles").default;
    Runners: import("gitlab/dist/latest/services/Runners").default;
    Services: import("gitlab/dist/latest/services/Services").default;
    Tags: import("gitlab/dist/latest/services/Tags").default;
    Todos: import("gitlab/dist/latest/services/Todos").default;
    Triggers: import("gitlab/dist/latest/services/Triggers").default;
    PushRule: import("gitlab/dist/latest/services/PushRule").default;
    ApplicationSettings: import("gitlab/dist/latest/services/ApplicationSettings").default;
    BroadcastMessages: import("gitlab/dist/latest/services/BroadcastMessages").default;
    Events: import("gitlab/dist/latest/services/Events").default;
    FeatureFlags: import("gitlab/dist/latest/services/FeatureFlags").default;
    GeoNodes: import("gitlab/dist/latest/services/GeoNodes").default;
    GitignoreTemplates: import("gitlab/dist/latest/services/GitignoreTemplates").default;
    GitLabCIYMLTemplates: import("gitlab/dist/latest/services/GitLabCIYMLTemplates").default;
    Keys: import("gitlab/dist/latest/services/Keys").default;
    Licence: import("gitlab/dist/latest/services/Licence").default;
    LicenceTemplates: import("gitlab/dist/latest/services/LicenceTemplates").default;
    Lint: import("gitlab/dist/latest/services/Lint").default;
    Namespaces: import("gitlab/dist/latest/services/Namespaces").default;
    NotificationSettings: import("gitlab/dist/latest/services/NotificationSettings").default;
    Markdown: import("gitlab/dist/latest/services/Markdown").default;
    PagesDomains: import("gitlab/dist/latest/services/PagesDomains").default;
    Search: import("gitlab/dist/latest/services/Search").default;
    SidekiqMetrics: import("gitlab/dist/latest/services/SidekiqMetrics").default;
    Snippets: import("gitlab/dist/latest/services/Snippets").default;
    SystemHooks: import("gitlab/dist/latest/services/SystemHooks").default;
    Version: import("gitlab/dist/latest/services/Version").default;
    Wikis: import("gitlab/dist/latest/services/Wikis").default;
};
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
