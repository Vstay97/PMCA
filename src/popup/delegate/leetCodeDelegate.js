const user_agent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36";
const params = {
    operationName: "questionTitle",
    variables: { titleSlug: "" }
};
const headers = {
    'User-Agent': user_agent,
    'Connection': 'keep-alive',
    'Content-Type': 'application/json',
    'Referer': "",
};

export const queryProblemInfo = async (slug, site) => {
    const baseUrl = `https://leetcode.${site}`;
    params.variables.titleSlug = slug;
    params.query = `query questionTitle($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionFrontendId
          ${site === "cn" ? "translatedTitle" : "title"}
          difficulty
        }
      }`
    headers.Referer = `${baseUrl}/problems/${slug}`

    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(params),
        timeout: 10000
    };

    const response = await fetch(`${baseUrl}/graphql`, requestOptions);
    const content = await response.json();

    return content.data.question;
}

/*
    Extract nowcoder problem information from DOM
*/
const getNowcoderProblemInfo = () => {
    console.log('开始提取牛客题目信息...');

    // 获取题目编号和名称
    const titleElement = document.querySelector('[data-v-0c67aeba].hide-txt');
    if (!titleElement) {
        console.error('无法找到牛客题目标题元素');
        throw new Error('无法找到牛客题目标题');
    }

    console.log('找到题目标题元素:', titleElement);

    const titleSpan = titleElement.querySelector('span[data-v-0c67aeba].mr-1');
    const problemIndex = titleSpan ? titleSpan.textContent.trim() : '';
    const problemName = titleElement.textContent.replace(problemIndex, '').trim();

    console.log('题目编号:', problemIndex);
    console.log('题目名称:', problemName);

    // 获取题目难度
    const difficultyElement = document.querySelector('.difficulty-level');
    if (!difficultyElement) {
        console.error('无法找到牛客题目难度元素');
        throw new Error('无法找到牛客题目难度');
    }

    const nowcoderDifficulty = difficultyElement.textContent.trim();
    console.log('牛客原始难度:', nowcoderDifficulty);

    // 映射牛客难度到 LeetCode 难度
    const difficultyMap = {
        '入门': 'Easy',
        '简单': 'Easy',
        '中等': 'Medium',
        '困难': 'Hard'
    };

    const problemLevel = difficultyMap[nowcoderDifficulty] || 'Easy';
    console.log('映射后的难度:', problemLevel);

    const result = {
        problemIndex,
        problemName: `${problemIndex}. ${problemName}`,
        problemLevel,
        problemUrl: window.location.href,
        originalDifficulty: nowcoderDifficulty // 保存原始难度用于显示
    };

    console.log('牛客题目信息提取结果:', result);
    return result;
};

/*
    Extract basic problem information
*/
export const getProblemInfo = async () => {
    let problemUrl = window.location.href;

    // 检查是否是牛客网站
    if (problemUrl.includes('nowcoder.com')) {
        return getNowcoderProblemInfo();
    }

    const match = problemUrl.match(/(com|cn)(\/|$)/);
    console.log(`current site is ${match[1]}`);
    const site = match ? match[1] : "com";

    const possible_suffix = ["/submissions/", "/description/", "/discussion/", "/solutions/"];
    for (const suffix of possible_suffix) {
        if (problemUrl.includes(suffix)) {
            problemUrl = problemUrl.substring(0, problemUrl.lastIndexOf(suffix) + 1);
            break;
        }
    }

    const problemSlug = problemUrl.split("/").splice(-2)[0];

    const question = await queryProblemInfo(problemSlug, site);

    return {
        problemIndex: question.questionFrontendId,
        problemName: `${question.questionFrontendId}. ${site === "cn" ? question.translatedTitle : question.title}`,
        problemLevel: question.difficulty,
        problemUrl
    };
}
