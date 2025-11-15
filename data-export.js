/**
 * Tab Timer Data Export/Import Module
 * 확장 프로그램과 웹 페이지 간 데이터 동기화를 위한 Export/Import 기능
 */

// 데이터 형식 버전
const DATA_FORMAT_VERSION = '1.0.0';

/**
 * 모든 데이터를 가져옵니다 (Chrome Storage 또는 localStorage)
 */
async function getAllData() {
    try {
        if (isChromeExtensionAvailable()) {
            try {
                const result = await chrome.storage.local.get([
                    'tabTimes',
                    'dailyStats',
                    'timeLimits',
                    'limitStartTimes'
                ]);
                return result;
            } catch (error) {
                console.warn('Chrome Storage 접근 실패, localStorage로 폴백:', error);
                return loadDataFromLocalStorage();
            }
        } else {
            return loadDataFromLocalStorage();
        }
    } catch (error) {
        console.error('데이터 가져오기 오류:', error);
        throw new Error('데이터를 가져올 수 없습니다.');
    }
}

/**
 * 데이터를 JSON 형식으로 내보냅니다
 */
async function exportToJSON() {
    try {
        const data = await getAllData();
        const exportData = {
            version: DATA_FORMAT_VERSION,
            exportDate: new Date().toISOString(),
            type: 'TAB_TIMER_EXPORT',
            data: {
                tabTimes: data.tabTimes || {},
                dailyStats: data.dailyStats || {},
                timeLimits: data.timeLimits || {},
                limitStartTimes: data.limitStartTimes || {}
            }
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tab-timer-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true, message: '데이터가 성공적으로 내보내졌습니다.' };
    } catch (error) {
        console.error('JSON 내보내기 오류:', error);
        return { success: false, message: `내보내기 실패: ${error.message}` };
    }
}

/**
 * 데이터를 CSV 형식으로 내보냅니다
 */
async function exportToCSV() {
    try {
        const data = await getAllData();
        const today = new Date().toISOString().split('T')[0];
        const dailyStats = data.dailyStats || {};
        const todayData = dailyStats[today] || { domains: {} };

        // CSV 헤더
        const headers = ['도메인', '사용 시간 (분)', '사용 시간 (시간)', '날짜'];
        const rows = [headers.join(',')];

        // 오늘의 데이터를 CSV 형식으로 변환
        Object.entries(todayData.domains || {})
            .sort(([, a], [, b]) => b - a)
            .forEach(([domain, timeMs]) => {
                const minutes = Math.floor(timeMs / 60000);
                const hours = (timeMs / 3600000).toFixed(2);
                rows.push([
                    `"${domain}"`,
                    minutes,
                    hours,
                    today
                ].join(','));
            });

        const csvString = rows.join('\n');
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' }); // BOM 추가 (Excel 호환)
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tab-timer-export-${today}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true, message: 'CSV 파일이 성공적으로 내보내졌습니다.' };
    } catch (error) {
        console.error('CSV 내보내기 오류:', error);
        return { success: false, message: `CSV 내보내기 실패: ${error.message}` };
    }
}

/**
 * JSON 데이터를 검증합니다
 */
function validateImportData(jsonData) {
    try {
        // 기본 구조 검증
        if (!jsonData || typeof jsonData !== 'object') {
            return { valid: false, error: '유효하지 않은 JSON 형식입니다.' };
        }

        // 버전 확인
        if (!jsonData.version) {
            return { valid: false, error: '데이터 버전 정보가 없습니다.' };
        }

        // 타입 확인
        if (jsonData.type !== 'TAB_TIMER_EXPORT') {
            return { valid: false, error: 'Tab Timer 데이터 형식이 아닙니다.' };
        }

        // 데이터 구조 검증
        if (!jsonData.data || typeof jsonData.data !== 'object') {
            return { valid: false, error: '데이터 구조가 올바르지 않습니다.' };
        }

        const { data } = jsonData;

        // 필수 필드 확인
        const requiredFields = ['tabTimes', 'dailyStats', 'timeLimits', 'limitStartTimes'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                return { valid: false, error: `필수 필드가 누락되었습니다: ${field}` };
            }
        }

        // 데이터 타입 검증
        if (typeof data.tabTimes !== 'object' || Array.isArray(data.tabTimes)) {
            return { valid: false, error: 'tabTimes는 객체여야 합니다.' };
        }

        if (typeof data.dailyStats !== 'object' || Array.isArray(data.dailyStats)) {
            return { valid: false, error: 'dailyStats는 객체여야 합니다.' };
        }

        if (typeof data.timeLimits !== 'object' || Array.isArray(data.timeLimits)) {
            return { valid: false, error: 'timeLimits는 객체여야 합니다.' };
        }

        if (typeof data.limitStartTimes !== 'object' || Array.isArray(data.limitStartTimes)) {
            return { valid: false, error: 'limitStartTimes는 객체여야 합니다.' };
        }

        return { valid: true, data: jsonData.data };
    } catch (error) {
        return { valid: false, error: `데이터 검증 오류: ${error.message}` };
    }
}

/**
 * JSON 파일에서 데이터를 가져옵니다
 */
async function importFromJSON(file) {
    try {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    const validation = validateImportData(jsonData);

                    if (!validation.valid) {
                        resolve({ success: false, message: validation.error });
                        return;
                    }

                    // 데이터 가져오기 옵션 확인
                    const importMode = confirm(
                        '데이터를 가져오면 기존 데이터가 덮어씌워질 수 있습니다.\n\n' +
                        '계속하시겠습니까?'
                    );

                    if (!importMode) {
                        resolve({ success: false, message: '사용자가 취소했습니다.' });
                        return;
                    }

                    // 데이터 저장
                    if (isChromeExtensionAvailable()) {
                        try {
                            await chrome.storage.local.set({
                                tabTimes: validation.data.tabTimes,
                                dailyStats: validation.data.dailyStats,
                                timeLimits: validation.data.timeLimits,
                                limitStartTimes: validation.data.limitStartTimes
                            });
                        } catch (chromeError) {
                            // localStorage로 폴백
                            saveDataToLocalStorage(validation.data);
                        }
                    } else {
                        saveDataToLocalStorage(validation.data);
                    }

                    resolve({
                        success: true,
                        message: '데이터가 성공적으로 가져와졌습니다. 페이지를 새로고침하세요.'
                    });
                } catch (parseError) {
                    resolve({ success: false, message: `JSON 파싱 오류: ${parseError.message}` });
                }
            };

            reader.onerror = () => {
                resolve({ success: false, message: '파일 읽기 오류가 발생했습니다.' });
            };

            reader.readAsText(file);
        });
    } catch (error) {
        console.error('JSON 가져오기 오류:', error);
        return { success: false, message: `가져오기 실패: ${error.message}` };
    }
}

/**
 * localStorage에 데이터를 저장합니다
 */
function saveDataToLocalStorage(data) {
    try {
        localStorage.setItem('tabTimes', JSON.stringify(data.tabTimes || {}));
        localStorage.setItem('dailyStats', JSON.stringify(data.dailyStats || {}));
        localStorage.setItem('timeLimits', JSON.stringify(data.timeLimits || {}));
        localStorage.setItem('limitStartTimes', JSON.stringify(data.limitStartTimes || {}));
        
        // 통합 형식으로도 저장
        localStorage.setItem('tabTimerData', JSON.stringify({
            type: 'TAB_TIMER_DATA',
            version: DATA_FORMAT_VERSION,
            exportDate: new Date().toISOString(),
            data: data
        }));
    } catch (error) {
        console.error('localStorage 저장 오류:', error);
        throw new Error('데이터 저장에 실패했습니다.');
    }
}

/**
 * 데이터를 초기화합니다 (모든 데이터 삭제)
 */
async function clearAllData() {
    const confirmed = confirm(
        '모든 데이터를 삭제하시겠습니까?\n\n' +
        '이 작업은 되돌릴 수 없습니다.'
    );

    if (!confirmed) {
        return { success: false, message: '사용자가 취소했습니다.' };
    }

    try {
        if (isChromeExtensionAvailable()) {
            try {
                await chrome.storage.local.remove([
                    'tabTimes',
                    'dailyStats',
                    'timeLimits',
                    'limitStartTimes'
                ]);
            } catch (chromeError) {
                console.warn('Chrome Storage 삭제 실패, localStorage로 폴백:', chromeError);
                clearLocalStorage();
            }
        } else {
            clearLocalStorage();
        }

        return { success: true, message: '모든 데이터가 삭제되었습니다.' };
    } catch (error) {
        console.error('데이터 삭제 오류:', error);
        return { success: false, message: `삭제 실패: ${error.message}` };
    }
}

/**
 * localStorage를 초기화합니다
 */
function clearLocalStorage() {
    localStorage.removeItem('tabTimes');
    localStorage.removeItem('dailyStats');
    localStorage.removeItem('timeLimits');
    localStorage.removeItem('limitStartTimes');
    localStorage.removeItem('tabTimerData');
}

// Chrome Extension API 사용 가능 여부 확인 (dashboard.js에서 정의된 함수 재사용)
function isChromeExtensionAvailable() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

// localStorage에서 데이터 로드 (dashboard.js에서 정의된 함수 재사용)
function loadDataFromLocalStorage() {
    try {
        const storedData = localStorage.getItem('tabTimerData');
        if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed.type === 'TAB_TIMER_DATA') {
                return parsed.data;
            }
        }
        
        return {
            tabTimes: JSON.parse(localStorage.getItem('tabTimes') || '{}'),
            dailyStats: JSON.parse(localStorage.getItem('dailyStats') || '{}'),
            timeLimits: JSON.parse(localStorage.getItem('timeLimits') || '{}'),
            limitStartTimes: JSON.parse(localStorage.getItem('limitStartTimes') || '{}')
        };
    } catch (error) {
        console.error('localStorage 데이터 로드 오류:', error);
        return {
            tabTimes: {},
            dailyStats: {},
            timeLimits: {},
            limitStartTimes: {}
        };
    }
}

