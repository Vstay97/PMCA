import './popup.css';
import { loadConfigs, setProblemSorter, setCloudSyncEnabled } from "./service/configService";
import { store } from './store';
import { optionPageFeedbackMsgDOM } from './util/doms';
import { descriptionOf, idOf, problemSorterArr } from "./util/sort";

// 导出数据函数
const exportData = async () => {
    try {
        const data = await new Promise((resolve) => {
            chrome.storage.local.get(null, (result) => {
                resolve(result);
            });
        });
        
        // 创建下载
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pmca_data_backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 显示成功消息
        const msgDiv = document.getElementById('migrationMessage');
        msgDiv.className = 'alert alert-success mt-3';
        msgDiv.style.display = 'block';
        msgDiv.textContent = '数据导出成功！';
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 3000);
    } catch (error) {
        console.error('Export failed:', error);
        const msgDiv = document.getElementById('migrationMessage');
        msgDiv.className = 'alert alert-danger mt-3';
        msgDiv.style.display = 'block';
        msgDiv.textContent = '数据导出失败！';
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 3000);
    }
};

// 导入数据函数
const importData = async (file) => {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        await new Promise((resolve) => {
            chrome.storage.local.clear(() => {
                chrome.storage.local.set(data, () => {
                    resolve();
                });
            });
        });

        // 显示成功消息
        const msgDiv = document.getElementById('migrationMessage');
        msgDiv.className = 'alert alert-success mt-3';
        msgDiv.style.display = 'block';
        msgDiv.textContent = '数据导入成功！请刷新插件。';
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 3000);
    } catch (error) {
        console.error('Import failed:', error);
        const msgDiv = document.getElementById('migrationMessage');
        msgDiv.className = 'alert alert-danger mt-3';
        msgDiv.style.display = 'block';
        msgDiv.textContent = '数据导入失败！';
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadConfigs();

    const optionsForm = document.getElementById('optionsForm');
    
    // problem sorted setting
    const problemSorterSelect = document.getElementById('problemSorterSelect');
    const problemSorterMetaArr = problemSorterArr.map(sorter => {
        return {id: idOf(sorter), text: descriptionOf(sorter)};
    });

    problemSorterMetaArr.forEach(sorterMeta => {
        const optionElement = document.createElement('option');
        optionElement.value = sorterMeta.id;
        optionElement.textContent = sorterMeta.text;
        if (store.problemSorter === sorterMeta.id) {
            optionElement.selected = true;
        }
        problemSorterSelect.append(optionElement);
    });

    // cloud sync setting
    const syncToggle = document.getElementById('syncToggle');
    syncToggle.checked = store.isCloudSyncEnabled || false;

    optionsForm.addEventListener('submit', async e => {
        e.preventDefault();
        await setProblemSorter(Number(problemSorterSelect.value));
        await setCloudSyncEnabled(syncToggle.checked);
        const feedbackMessage = document.getElementById('feedbackMessage');
        feedbackMessage.style.display = 'block';
        setTimeout(() => {
            feedbackMessage.style.display = 'none';
        }, 3000);
    });

    // 添加导出/导入功能的事件监听
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importInput').click();
    });

    document.getElementById('importInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importData(e.target.files[0]);
        }
    });
});