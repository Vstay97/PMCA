import { getDifficultyBasedSteps, getSubmissionResult, isSubmissionSuccess, isSubmitButton, needReview, updateProblemUponSuccessSubmission } from "../util/utils";
import { getAllProblems, createOrUpdateProblem, getCurrentProblemInfoFromLeetCode, syncProblems } from "../service/problemService";
import { Problem } from "../entity/problem";

/* 
    monitorSubmissionResult will repeateadly check for the submission result.
*/
const monitorSubmissionResult = () => {

    let submissionResult;
    let maxRetry = 10;
    const retryInterval = 1000;

    const functionId = setInterval(async () => {

        if (maxRetry <= 0) {
            clearInterval(functionId);
            console.log('监控提交结果超时');
            return;
        }

        submissionResult = getSubmissionResult();
        console.log('获取到的提交结果:', submissionResult);

        // 修复：submissionResult 可能是 DOM 元素，不应该检查 length 属性
        if (submissionResult === undefined || submissionResult === null) {
            maxRetry--;
            console.log(`未找到提交结果，剩余重试次数: ${maxRetry}`);
            return;
        }

        clearInterval(functionId);
        let isSuccess = isSubmissionSuccess(submissionResult);
        console.log('提交是否成功:', isSuccess);

        if (!isSuccess) {
            console.log('提交未成功，不进行追踪');
            return;
        }

        try {
            const { problemIndex, problemName, problemLevel, problemUrl } = await getCurrentProblemInfoFromLeetCode();
            console.log('获取到的题目信息:', { problemIndex, problemName, problemLevel, problemUrl });

            await syncProblems();   // prior to fetch local problem data, sync local problem data with cloud
            const problems = await getAllProblems();
            let problem = problems[problemIndex];

            if (problem && problem.isDeleted !== true) {
                const reviewNeeded = needReview(problem);
                console.log('题目已存在，是否需要复习:', reviewNeeded);
                if (reviewNeeded) {
                    await createOrUpdateProblem(updateProblemUponSuccessSubmission(problem));
                    console.log('更新了现有题目的复习状态');
                }
            } else {
                const difficultySteps = getDifficultyBasedSteps(problemLevel);
                console.log('难度对应的步骤:', difficultySteps);
                problem = new Problem(problemIndex, problemName, problemLevel, problemUrl, Date.now(), difficultySteps[0], Date.now());
                await createOrUpdateProblem(problem);
                console.log('创建了新题目记录:', problem);
            }
            await syncProblems(); // after problem updated, sync to cloud

            console.log("Submission successfully tracked!");
        } catch (error) {
            console.error('处理提交结果时出错:', error);
        }

    }, retryInterval)
};

export const submissionListener = (event) => {

    const element = event.target;

    const filterConditions = [
        isSubmitButton(element),
        element.parentElement && isSubmitButton(element.parentElement),
        element.parentElement && element.parentElement.parentElement && isSubmitButton(element.parentElement.parentElement),
    ]

    const isSubmission = filterConditions.reduce((prev, curr) => prev || curr);

    if (isSubmission) {
        monitorSubmissionResult();
    }

};