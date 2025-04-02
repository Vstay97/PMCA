import { getProblemInfo } from "../delegate/leetCodeDelegate";
import { getLocalStorageData, setLocalStorageData } from "../delegate/localStorageDelegate";
import { addNewOperationHistory } from "./operationHistoryService";
import { OPS_TYPE } from "../entity/operationHistory";
import { forggettingCurve } from "../util/constants";
import { CN_PROBLEM_KEY, PROBLEM_KEY } from "../util/keys";
import { isInCnMode } from "./modeService";
import { store } from "../store";
import { mergeProblems, syncLocalAndCloudStorage } from "../util/utils";
import cloudStorageDelegate from "../delegate/cloudStorageDelegate";
import { copy, getDeletedProblem } from "../entity/problem";

export const getAllProblems = async () => {
    let cnMode = await isInCnMode();
    const queryKey = cnMode ? CN_PROBLEM_KEY : PROBLEM_KEY;
    let problems = await getLocalStorageData(queryKey);
    if (problems === undefined) problems = {};
    return problems;
}

export const getAllProblemsInCloud = async () => {
    let cnMode = await isInCnMode();
    const queryKey = cnMode ? CN_PROBLEM_KEY : PROBLEM_KEY;
    let problems = await cloudStorageDelegate.get(queryKey);
    if (problems === undefined) problems = {};
    return problems;
}

export const getProblemsByMode = async (useCnMode) => {
    const queryKey = useCnMode ? CN_PROBLEM_KEY : PROBLEM_KEY;
    let problems = await getLocalStorageData(queryKey);
    if (problems === undefined) problems = {};
    return problems;
}

export const getCurrentProblemInfoFromLeetCode = async () => {
    return await getProblemInfo();
}

export const setProblems = async (problems) => {
    let cnMode = await isInCnMode();
    const key = cnMode ? CN_PROBLEM_KEY : PROBLEM_KEY;
    await setLocalStorageData(key, problems);
}

export const setProblemsToCloud = async (problems) => {
    let cnMode = await isInCnMode();
    const key = cnMode ? CN_PROBLEM_KEY : PROBLEM_KEY;
    await cloudStorageDelegate.set(key, problems);
}

export const setProblemsByMode = async (problems, useCnMode) => {
    const key = useCnMode ? CN_PROBLEM_KEY : PROBLEM_KEY;
    await setLocalStorageData(key, problems);
}

export const createOrUpdateProblem = async (problem) => {
    problem.modificationTime = Date.now();
    const problems = await getAllProblems();
    problems[problem.index] = problem;
    await setProblems(problems);
}

export const markProblemAsMastered = async (problemId) => {
    let problems = await getAllProblems();
    let problem = problems[problemId];

    await addNewOperationHistory(problem, OPS_TYPE.MASTER, Date.now());

    problem.proficiency = forggettingCurve.length;
    problem.modificationTime = Date.now();

    problems[problemId] = problem;

    await setProblems(problems);
};

export const deleteProblem = async (problemId) => {

    let problems = await getAllProblems();
    const problem = problems[problemId];

    // soft delete
    if (problem) {
        problem.isDeleted = true;
        problem.modificationTime = Date.now();
        await addNewOperationHistory(problem, OPS_TYPE.DELETE, Date.now());
        problems[problemId] = problem;
        await setProblems(problems);
    }
};

export const resetProblem = async (problemId) => {
    let problems = await getAllProblems();
    let problem = problems[problemId];

    problem.proficiency = 0;
    problem.submissionTime = Date.now() - 24 * 60 * 60 * 1000;
    problem.modificationTime = Date.now();

    await addNewOperationHistory(problem, OPS_TYPE.RESET, Date.now());

    problems[problemId] = problem;

    await setProblems(problems);
};

export const downgradeProblem = async (problemId) => {
    let problems = await getAllProblems();
    let problem = problems[problemId];

    // 如果proficiency已经是0，则不做任何改变
    if (problem.proficiency > 0) {
        problem.proficiency = problem.proficiency - 1;
    }
    problem.submissionTime = Date.now();
    problem.modificationTime = Date.now();

    await addNewOperationHistory(problem, OPS_TYPE.DOWNGRADE, Date.now());

    problems[problemId] = problem;

    await setProblems(problems);
};

export const reviewNow = async (problemId) => {
    let problems = await getAllProblems();
    let problem = problems[problemId];

    // 根据当前的proficiency级别计算时间偏移量
    // 确保无论什么proficiency级别的问题，都能立即出现在需要复习的列表中
    const currentProficiency = problem.proficiency;
    let timeOffset = 0;
    
    // 处理forggettingCurve为空的边界情况
    if (forggettingCurve.length === 0) {
        // 如果没有定义遗忘曲线，设置一个默认值（例如1天）
        timeOffset = 24 * 60 * 60 * 1000; // 1天，转换为毫秒
    } else if (currentProficiency < forggettingCurve.length) {
        // 将时间设置为刚好超过当前级别的复习时间间隔
        timeOffset = forggettingCurve[currentProficiency] * 60 * 1000; // 转换为毫秒
    } else {
        // 如果已经达到最高级别（已掌握），使用最长的时间间隔
        timeOffset = forggettingCurve[forggettingCurve.length - 1] * 60 * 1000;
    }
    
    problem.submissionTime = Date.now() - timeOffset - 60 * 1000; // 额外减去1分钟，确保立即可以复习
    problem.modificationTime = Date.now();

    await addNewOperationHistory(problem, OPS_TYPE.REVIEW_NOW, Date.now());

    problems[problemId] = problem;

    await setProblems(problems);
};

export const syncProblems = async () => {
    if (!store.isCloudSyncEnabled) return;
    let cnMode = await isInCnMode();
    const key = cnMode ? CN_PROBLEM_KEY : PROBLEM_KEY;
    await syncLocalAndCloudStorage(key, mergeProblems);
}