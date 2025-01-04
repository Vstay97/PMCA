// 等待元素出现的辅助函数
const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const findElement = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Element ${selector} not found after ${timeout}ms`));
            } else {
                setTimeout(findElement, 100);
            }
        };
        
        findElement();
    });
};

// 检查是否在题目页面
const isProblemPage = () => {
    return window.location.pathname.includes('/problems/') && 
           !window.location.pathname.includes('/submissions') &&
           !window.location.pathname.includes('/solutions') &&
           !window.location.pathname.includes('/discussion');
};

// 主函数
const autoResetCode = async () => {
    // 只在题目页面执行
    if (!isProblemPage()) {
        return;
    }

    try {
        // 等待重置按钮出现
        const resetButton = await waitForElement('button[data-state="closed"] svg.fa-arrow-rotate-left');
        if (resetButton) {
            // 点击重置按钮（需要点击父元素button）
            resetButton.closest('button').click();
            
            // // 等待确认按钮出现并点击
            // const confirmButton = await waitForElement('button.bg-green-s');
            // if (confirmButton) {
            //     confirmButton.click();
            // }
        }
    } catch (error) {
        console.log('PMCA auto reset:', error);
    }
};

// 当页面加载完成后执行
if (document.readyState === 'complete') {
    autoResetCode();
} else {
    window.addEventListener('load', autoResetCode);
}
