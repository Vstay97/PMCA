import { setConfigJumpHandlers } from "./configJumpHandler";
import { setModeSwitchHandlers } from "./modeSwitchHandler";
import { setPageJumpHandlers } from "./pageJumpHandler"
import { setPopupUnloadHandler } from "./popupUnloadHandler";
import { setRecordOperationHandlers } from "./recordOperationHandler";
import { searchInputDOM } from "../util/doms";
import { renderAll } from "../view/view";

const setSearchHandler = () => {
    if (searchInputDOM) {
        searchInputDOM.addEventListener('input', (event) => {
            const searchQuery = event.target.value;
            renderAll(searchQuery);
        });
    }
}

export const registerAllHandlers = () => {
    setPageJumpHandlers();
    setModeSwitchHandlers();
    setRecordOperationHandlers();
    setConfigJumpHandlers();
    setPopupUnloadHandler();
    setSearchHandler();
}
