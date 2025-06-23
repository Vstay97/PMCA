import localStorageDelegate from "../delegate/localStorageDelegate";
import cloudStorageDelegate from "../delegate/cloudStorageDelegate";
import { store } from "../store";
import { COMPILE_ERROR_AND_TLE_CLASSNAME, COMPILE_ERROR_AND_TLE_CLASSNAME_CN, COMPILE_ERROR_AND_TLE_CLASSNAME_NEW, NOWCODER_SUCCESS_INDICATOR, PAGE_SIZE, SUBMIT_BUTTON_ATTRIBUTE_NAME, SUBMIT_BUTTON_ATTRIBUTE_VALUE, SUCCESS_CLASSNAME, SUCCESS_CLASSNAME_CN, SUCCESS_CLASSNAME_NEW, WRONG_ANSWER_CLASSNAME, WRONG_ANSWER_CLASSNAME_CN, WRONG_ANSWER_CLASSNAME_NEW, forggettingCurve } from "./constants";

export const needReview = (problem) => {
    if (problem.proficiency >= forggettingCurve.length) {
        return false;
    }

    const currentTime = Date.now();
    const timeDiffInMinute = (currentTime - problem.submissionTime) / (1000 * 60);
    return timeDiffInMinute >= forggettingCurve[problem.proficiency];
};

export const scheduledReview = (problem) => {
    return !needReview(problem) && problem.proficiency < 5;
};

export const isCompleted = (problem) => {
    return problem.proficiency === 5;
};

export const calculatePageNum = (problems) => {
    if (!problems || !Array.isArray(problems)) {
        return 1;
    }
    return Math.max(Math.ceil(problems.length / PAGE_SIZE), 1);
}

export const decorateProblemLevel = (level) => {
    let color;
    let displayLevel = level;

    // 如果是牛客的原始难度，需要映射显示
    const nowcoderLevelMap = {
        'Easy': '简单',
        'Medium': '中等',
        'Hard': '困难'
    };

    // 检查是否需要显示牛客原始难度
    if (level === "Easy") {
        color = "rgb(67, 160, 71)";
        // 这里可以根据需要显示原始的牛客难度，但目前保持 LeetCode 风格
    } else if (level === "Medium") {
        color = "rgb(239, 108, 0)";
    } else {
        color = "rgb(233, 30, 99)";
    }
    return `<small style="color: ${color}; vertical-align: middle">${level}</small>`
}

export const getNextReviewTime = (problem) => {
    return new Date(problem.submissionTime + forggettingCurve[problem.proficiency] * 60 * 1000);
}

export const getDelayedHours = (problem) => {
    const nextReviewDate = getNextReviewTime(problem);
    return Math.round((Date.now() - nextReviewDate) / (60 * 60 * 1000));
}

export const getDifficultyBasedSteps = (diffculty) => {
    if (diffculty === "Easy") {
        return store.easyIntv;
    } else if (diffculty === "Medium") {
        return store.mediumIntv;
    } else {
        return store.hardIntv;
    }
}

export const isSubmitButton = (element) => {
    // LeetCode 提交按钮检测
    if (element.getAttribute(SUBMIT_BUTTON_ATTRIBUTE_NAME) === SUBMIT_BUTTON_ATTRIBUTE_VALUE) {
        return true;
    }

    // 牛客提交按钮检测 - 检查是否包含提交相关的类名或文本
    if (window.location.href.includes('nowcoder.com')) {
        // 牛客的提交按钮通常包含 "提交" 文本或特定的类名
        const buttonText = element.textContent?.trim();
        if (buttonText && (buttonText.includes('提交') || buttonText.includes('Submit'))) {
            return true;
        }

        // 检查按钮的类名
        const className = element.className;
        if (className && (className.includes('btn-primary') || className.includes('submit'))) {
            return true;
        }
    }

    return false;
}

export const getSubmissionResult = () => {
    // 牛客网站的提交结果检测
    if (window.location.href.includes('nowcoder.com')) {
        console.log('检测牛客提交结果...');

        // 检查是否有成功提交的标识
        const successElement = document.getElementsByClassName(NOWCODER_SUCCESS_INDICATOR)[0];
        console.log('牛客成功元素:', successElement);

        if (successElement) {
            console.log('找到牛客成功提交标识');
            return successElement;
        }

        // 如果没有找到成功标识，返回一个表示失败的元素（如果存在的话）
        const failElement = document.querySelector('.error, .wrong, .fail');
        console.log('牛客失败元素:', failElement);
        return failElement;
    }

    // LeetCode 的提交结果检测（保持原有逻辑）
    return document.getElementsByClassName(SUCCESS_CLASSNAME_CN)[0] ||
        document.getElementsByClassName(WRONG_ANSWER_CLASSNAME_CN)[0] ||
        document.getElementsByClassName(COMPILE_ERROR_AND_TLE_CLASSNAME_CN)[0] ||
        document.getElementsByClassName(SUCCESS_CLASSNAME)[0] ||
        document.getElementsByClassName(WRONG_ANSWER_CLASSNAME)[0] ||
        document.getElementsByClassName(COMPILE_ERROR_AND_TLE_CLASSNAME)[0] ||
        document.getElementsByClassName(SUCCESS_CLASSNAME_NEW)[0] ||
        document.getElementsByClassName(WRONG_ANSWER_CLASSNAME_NEW)[0] ||
        document.getElementsByClassName(COMPILE_ERROR_AND_TLE_CLASSNAME_NEW)[0];
}

export const isSubmissionSuccess = (submissionResult) => {
    // 牛客网站的成功判断
    if (window.location.href.includes('nowcoder.com')) {
        console.log('判断牛客提交是否成功:', submissionResult);
        const isSuccess = submissionResult && submissionResult.className.includes(NOWCODER_SUCCESS_INDICATOR);
        console.log('牛客提交成功判断结果:', isSuccess);
        return isSuccess;
    }

    // LeetCode 的成功判断（保持原有逻辑）
    return submissionResult.className.includes(SUCCESS_CLASSNAME_CN) ||
        submissionResult.className.includes(SUCCESS_CLASSNAME_NEW) ||
        submissionResult.className.includes(SUCCESS_CLASSNAME);
}

export const updateProblemUponSuccessSubmission = (problem) => {
    console.log('更新题目提交状态:', problem);
    const steps = getDifficultyBasedSteps(problem.level || problem.problemLevel);
    console.log('难度对应的步骤:', steps);

    let nextProficiencyIndex;
    for (const i of steps) {
        if (i > problem.proficiency) {
            nextProficiencyIndex = i;
            break;
        }
    }

    console.log('下一个熟练度级别:', nextProficiencyIndex);

    // further review needed
    if (nextProficiencyIndex !== undefined) {
        problem.proficiency = nextProficiencyIndex;
        // already completed all review
    } else {
        problem.proficiency = forggettingCurve.length;
    }
    problem.submissionTime = Date.now();
    problem.modificationTime = Date.now();

    console.log('更新后的题目状态:', problem);
    return problem;
}

// for sync data over cloud & local
export const mergeProblem = (p1, p2) => {
    if (p2 === undefined || p2 === null) return p1;
    if (p1 === undefined || p1 === null) return p2;
    if (p2.modificationTime === undefined || p2.modificationTime === null) return p1;
    if (p1.modificationTime === undefined || p1.modificationTime === null) return p2;

    return p1.modificationTime > p2.modificationTime ? p1 : p2;
}

export const mergeProblems = (ps1, ps2) => {
    const problemIdSet = new Set([...Object.keys(ps1), ...Object.keys(ps2)]);
    const ps = {}
    problemIdSet.forEach(id => {
        const p1 = ps1[id], p2 = ps2[id];
        const p = mergeProblem(p1, p2);
        ps[id] = p;
    })

    return ps;
}

export const syncStorage = async (sd1, sd2, key, merger) => {
    if (!store.isCloudSyncEnabled) return;
    const data1 = await sd1.get(key) || {};
    const data2 = await sd2.get(key) || {};
    const merged = merger(data1, data2);

    console.log("merging data from local and from cloud. local:")
    console.log(data1);
    console.log("merging data from local and from cloud. cloud:")
    console.log(data2);
    await sd1.set(key, merged);
    await sd2.set(key, merged);
}

export const syncLocalAndCloudStorage = async (key, merger) => {
    await syncStorage(localStorageDelegate, cloudStorageDelegate, key, merger);
}

export const simpleStringHash = (key) => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash;
}