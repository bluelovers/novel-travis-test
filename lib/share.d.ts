/**
 * Created by user on 2018/12/6/006.
 */
export declare enum EnumShareStates {
    WAIT_CREATE_GIT = ".wait_create_git"
}
export declare function shareStates(name: EnumShareStates): {
    name: EnumShareStates;
    file: string;
    exists(): boolean;
    ensure(): void;
    remove(): void;
};
export declare function checkShareStatesNotExists(list: EnumShareStates[]): boolean;
