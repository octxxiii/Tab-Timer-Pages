// 차트 라이브러리 로드
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
script.onload = initializeDashboard;
document.head.appendChild(script);

// 대시보드 초기화
function initializeDashboard() {
    // 차트 초기화
    initializeCharts();
    
    // 데이터 로드
    loadDashboardData();
    
    // 이벤트 리스너 설정
    setupEventListeners();
}

// 차트 초기화
function initializeCharts() {
    const chartElement = document.getElementById('weekly-chart');
    if (!chartElement) {
        console.warn('차트 요소를 찾을 수 없습니다. dashboard.html에 <canvas id="weekly-chart"></canvas>를 추가하세요.');
        return;
    }
    
    const ctx = chartElement.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['월', '화', '수', '목', '금', '토', '일'],
            datasets: [{
                label: '일일 사용 시간',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#4a90e2',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '시간 (분)'
                    }
                }
            }
        }
    });
}

// Chrome Extension API 사용 가능 여부 확인
function isChromeExtensionAvailable() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

// 대시보드 데이터 로드
async function loadDashboardData() {
    try {
        // Chrome Extension API가 없으면 localStorage에서 데이터 가져오기
        let result = {};
        
        if (isChromeExtensionAvailable()) {
            try {
                result = await chrome.storage.local.get(['tabTimes', 'dailyStats', 'timeLimits', 'limitStartTimes']);
            } catch (chromeError) {
                console.warn('Chrome Storage API 접근 실패, localStorage로 폴백:', chromeError);
                result = loadDataFromLocalStorage();
            }
        } else {
            result = loadDataFromLocalStorage();
        }
        
        // 오늘 날짜의 데이터 준비
        const today = new Date().toISOString().split('T')[0];
        const dailyStats = result.dailyStats || {};
        const todayData = dailyStats[today] || { domains: {}, hourly: Array(24).fill(0), visits: {} };
        
        // 총 사용 시간 계산
        const totalTime = Object.values(result.tabTimes || {}).reduce((sum, time) => sum + time, 0);
        
        // 상위 5개 사이트 계산
        const topSites = Object.entries(todayData.domains)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([domain, time]) => ({ domain, time }));
        
        // 이번 주 데이터 계산
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        const weeklyData = {
          totalTime: 0,
          dailyTotals: Array(7).fill(0),
          topSites: {}
        };
        
        // 최근 7일간의 데이터 집계
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          if (dailyStats[dateStr] && dailyStats[dateStr].domains) {
            const dailyTotal = Object.values(dailyStats[dateStr].domains).reduce((sum, time) => sum + time, 0);
            weeklyData.dailyTotals[i] = dailyTotal;
            weeklyData.totalTime += dailyTotal;
            
            Object.entries(dailyStats[dateStr].domains).forEach(([domain, time]) => {
              weeklyData.topSites[domain] = (weeklyData.topSites[domain] || 0) + time;
            });
          }
        }
        
        // 시간 제한 데이터 준비
        const limits = Object.entries(result.timeLimits || {}).map(([domain, limit]) => {
          const startTime = result.limitStartTimes?.[domain];
          const remaining = startTime ? Math.max(0, limit - (Date.now() - startTime)) : limit;
          return { domain, limit, remaining };
        });
        
        const data = {
          dailyStats: {
            totalTime,
            topSites,
            hourlyUsage: todayData.hourly
          },
          weeklyStats: {
            totalTime: weeklyData.totalTime,
            avgDailyTime: weeklyData.totalTime / 7,
            dailyTotals: weeklyData.dailyTotals,
            topSites: Object.entries(weeklyData.topSites)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([domain, time]) => ({ domain, time }))
          },
          limits
        };

        updateDashboard(data);

        // 1초마다 데이터 업데이트 (시간 제한만 실시간 업데이트)
        setInterval(async () => {
          try {
            let newResult = {};
            if (isChromeExtensionAvailable()) {
              try {
                newResult = await chrome.storage.local.get(['timeLimits', 'limitStartTimes']);
              } catch (chromeError) {
                newResult = loadDataFromLocalStorage();
              }
            } else {
              newResult = loadDataFromLocalStorage();
            }
            
            const newData = {
              ...data,
              limits: Object.entries(newResult.timeLimits || {}).map(([domain, limit]) => {
                const startTime = newResult.limitStartTimes?.[domain];
                const remaining = startTime ? Math.max(0, limit - (Date.now() - startTime)) : limit;
                return { domain, limit, remaining };
              })
            };
            updateDashboard(newData);
          } catch (error) {
            console.error('데이터 업데이트 오류:', error);
          }
        }, 1000);

    } catch (error) {
        console.error('데이터 로드 오류:', error);
        showError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// 대시보드 업데이트
function updateDashboard(data) {
    if (!data) {
        console.warn('대시보드 데이터가 없습니다.');
        showError('데이터를 불러올 수 없습니다.');
        return;
    }

    try {
        // 일일 통계 업데이트
        if (data.dailyStats) {
            updateDailyStats(data.dailyStats);
        }
        
        // 주간 통계 업데이트
        if (data.weeklyStats) {
            updateWeeklyStats(data.weeklyStats);
        }
        
        // 웰빙 팁 업데이트 (선택적)
        if (data.wellbeingTips) {
            updateWellbeingTips(data.wellbeingTips);
        }
        
        // 사이트 제한 업데이트
        if (data.limits) {
            updateLimits(data.limits);
        }

        // 웰빙 섹션 숨기기 (존재하는 경우)
        const insightsSection = document.getElementById('insights');
        if (insightsSection) {
            insightsSection.style.display = 'none';
        }
    } catch (error) {
        console.error('대시보드 업데이트 오류:', error);
        showError('대시보드를 업데이트하는 중 오류가 발생했습니다.');
    }
}

// 시간 제한 업데이트
function updateLimits(limits) {
    if (!limits || !Array.isArray(limits)) {
        return;
    }

    const limitsElement = document.querySelector('.limits-list') || 
                         document.querySelector('.current-limits ul') ||
                         document.getElementById('limits-list');
    
    if (!limitsElement) return;
    
    if (limits.length === 0) {
        limitsElement.innerHTML = '<li>설정된 시간 제한이 없습니다.</li>';
        return;
    }

    limitsElement.innerHTML = limits
        .map(limit => `<li class="limit-item">
            <span class="site-name">${limit.domain || '알 수 없음'}</span>
            <span class="limit-info">
                제한: ${formatTime(limit.limit || 0)} / 
                남은 시간: ${formatTime(limit.remaining || 0)}
            </span>
        </li>`)
        .join('');
}

// 일일 통계 업데이트
function updateDailyStats(stats) {
    if (!stats) {
        console.warn('일일 통계 데이터가 없습니다.');
        return;
    }

    // 총 사용 시간 업데이트
    const totalTimeElement = document.querySelector('.total-time p') || document.querySelector('.total-time');
    if (totalTimeElement) {
        totalTimeElement.textContent = formatTime(stats.totalTime || 0);
    }

    // 자주 방문한 사이트 업데이트
    const topSitesList = document.querySelector('.top-sites-list') || document.querySelector('.top-sites ul');
    if (!topSitesList) return;

    if (stats.topSites && stats.topSites.length > 0) {
        topSitesList.innerHTML = stats.topSites
            .map(site => `
                <li class="site-item">
                    <span class="site-name">${site.domain || site.name || '알 수 없음'}</span>
                    <span class="site-time">${formatTime(site.time || 0)}</span>
                </li>
            `)
            .join('');
    } else {
        topSitesList.innerHTML = '<li>방문 기록이 없습니다.</li>';
    }
}

// 주간 통계 업데이트
function updateWeeklyStats(stats) {
    if (!stats) {
        console.warn('주간 통계 데이터가 없습니다.');
        return;
    }

    const weeklyStatsElement = document.getElementById('weekly-stats');
    if (!weeklyStatsElement) return;

    const summary = `
        <div class="weekly-metric">
            <h4>총 사용 시간</h4>
            <p>${formatTime(stats.totalTime || 0)}</p>
        </div>
        <div class="weekly-metric">
            <h4>일 평균 사용 시간</h4>
            <p>${formatTime(stats.avgDailyTime || 0)}</p>
        </div>
        <div class="weekly-metric">
            <h4>가장 많이 방문한 사이트</h4>
            <ul class="top-sites-list">
                ${(stats.topSites || []).map(site => `
                    <li class="site-item">
                        <span class="site-name">${site.domain || '알 수 없음'}</span>
                        <span class="site-time">${formatTime(site.time || 0)}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    weeklyStatsElement.innerHTML = summary;
    
    // 주간 차트 업데이트 (Chart.js가 로드된 경우)
    if (typeof Chart !== 'undefined') {
        const chartElement = document.getElementById('weekly-chart');
        if (chartElement) {
            const chart = Chart.getChart(chartElement);
            if (chart && stats.dailyTotals) {
                chart.data.datasets[0].data = stats.dailyTotals.map(ms => Math.floor(ms / 60000)); // 밀리초를 분으로 변환
                chart.update();
            }
        }
    }
}

// 웰빙 팁 업데이트
function updateWellbeingTips(tips) {
    if (!tips || !Array.isArray(tips) || tips.length === 0) {
        return; // 팁이 없으면 업데이트하지 않음
    }
    
    const tipsList = document.getElementById('tips-list');
    if (tipsList) {
        tipsList.innerHTML = tips
            .map(tip => `<li>${tip}</li>`)
            .join('');
    }
}

// 사이트 제한 업데이트
function updateSiteLimits(limits) {
    updateLimits(limits);
}

// 시간 포맷팅 (밀리초 단위로 통일)
function formatTime(ms) {
    if (typeof ms !== 'number' || isNaN(ms) || ms < 0) {
        return '0시간 0분';
    }
    
    // 이미 분 단위인 경우를 감지 (60000보다 작은 값은 분으로 간주)
    // 하지만 일반적으로 밀리초로 처리
    const totalMs = ms;
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    
    if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
    } else if (minutes > 0) {
        return `${minutes}분`;
    } else {
        return '0분';
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 새로고침 버튼 이벤트
    document.querySelector('.refresh-button')?.addEventListener('click', loadDashboardData);
    
    // 설정 링크 이벤트
    document.querySelector('footer a[href="#"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (isChromeExtensionAvailable() && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                chrome.runtime.sendMessage({ action: 'openSettings' });
            } catch (error) {
                console.warn('설정 열기 실패:', error);
            }
        }
    });
}

// 에러 표시
function showError(message) {
    console.error('대시보드 오류:', message);
    
    // 에러 메시지를 표시할 요소들 찾기
    const elements = [
        '.total-time p',
        '.total-time',
        '.top-sites ul',
        '.top-sites-list',
        '#weekly-stats',
        '.current-limits ul',
        '.limits-list'
    ];

    let found = false;
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = message;
            element.style.color = '#ff4444';
            found = true;
        }
    });

    // 요소를 찾지 못한 경우 상단에 에러 메시지 표시
    if (!found) {
        const container = document.querySelector('.container') || document.querySelector('main');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            errorDiv.style.cssText = 'color: #ff4444; text-align: center; padding: 10px; margin-bottom: 20px; background: #ffe0e0; border-radius: 5px;';
            container.prepend(errorDiv);
            
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }
}

// localStorage에서 데이터 로드 (Chrome Extension API 폴백)
function loadDataFromLocalStorage() {
    try {
        const storedData = localStorage.getItem('tabTimerData');
        if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed.type === 'TAB_TIMER_DATA') {
                return parsed.data;
            }
        }
        
        // 직접 저장된 데이터 형식도 지원
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

// 초기화
document.addEventListener('DOMContentLoaded', initializeDashboard); 