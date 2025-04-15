// 차트 초기화
const dailyChart = new Chart(
    document.getElementById('dailyChart'),
    {
        type: 'bar',
        data: {
            labels: ['월', '화', '수', '목', '금', '토', '일'],
            datasets: [{
                label: '일일 사용 시간 (분)',
                data: [120, 190, 150, 200, 180, 90, 60],
                backgroundColor: 'rgba(33, 150, 243, 0.5)',
                borderColor: 'rgb(33, 150, 243)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    }
);

const weeklyChart = new Chart(
    document.getElementById('weeklyChart'),
    {
        type: 'line',
        data: {
            labels: ['1주', '2주', '3주', '4주'],
            datasets: [{
                label: '주간 평균 사용 시간 (분)',
                data: [150, 140, 130, 120],
                fill: false,
                borderColor: 'rgb(33, 150, 243)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    }
);

// 목표 설정 폼 처리
document.getElementById('goalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const website = document.getElementById('website').value;
    const timeLimit = document.getElementById('timeLimit').value;
    
    try {
        // 목표 설정을 Chrome 확장 프로그램으로 전송
        chrome.runtime.sendMessage({
            action: 'setTimeLimit',
            website: website,
            minutes: parseInt(timeLimit)
        }, (response) => {
            if (response.success) {
                alert('목표가 성공적으로 설정되었습니다!');
                document.getElementById('goalForm').reset();
            } else {
                alert('목표 설정에 실패했습니다. 다시 시도해주세요.');
            }
        });
    } catch (error) {
        console.error('목표 설정 중 오류 발생:', error);
        alert('목표 설정 중 오류가 발생했습니다.');
    }
});

// 웰빙 메트릭 계산 함수
function calculateWellnessMetrics(stats) {
    // 디지털 디톡스 점수 계산 (0-100)
    const totalScreenTime = stats.dailyStats.reduce((a, b) => a + b, 0);
    const detoxScore = Math.max(0, 100 - (totalScreenTime / 60)); // 시간당 1점 감소

    // 생산성 지수 계산 (0-100)
    const productiveSites = ['github.com', 'stackoverflow.com', 'docs.google.com'];
    const productiveTime = stats.productiveTime || 0;
    const productivityScore = Math.min(100, (productiveTime / totalScreenTime) * 100);

    // 스트레스 레벨 계산 (0-100)
    const consecutiveHours = stats.consecutiveHours || 0;
    const stressLevel = Math.min(100, consecutiveHours * 20); // 연속 1시간당 20점 증가

    return {
        detoxScore: Math.round(detoxScore),
        productivityScore: Math.round(productivityScore),
        stressLevel: Math.round(stressLevel)
    };
}

// 웰빙 팁 생성 함수
function generateWellnessTips(metrics) {
    const tips = [];

    if (metrics.detoxScore < 50) {
        tips.push('디지털 디톡스가 필요합니다. 정기적인 휴식 시간을 가져보세요.');
    }
    if (metrics.productivityScore < 40) {
        tips.push('산만한 웹사이트 사용이 많습니다. 집중이 필요한 시간을 설정해보세요.');
    }
    if (metrics.stressLevel > 60) {
        tips.push('연속적인 디지털 사용이 많습니다. 20-20-20 규칙을 실천해보세요 (20분마다 20초 동안 20피트 멀리 있는 것을 바라보기).');
    }
    if (metrics.detoxScore > 70 && metrics.productivityScore > 70) {
        tips.push('훌륭한 디지털 웰빙 밸런스를 유지하고 있습니다!');
    }

    return tips;
}

// 웰빙 메트릭 업데이트 함수
function updateWellnessMetrics(metrics) {
    document.getElementById('detoxScore').textContent = metrics.detoxScore;
    document.getElementById('productivityScore').textContent = metrics.productivityScore;
    document.getElementById('stressLevel').textContent = metrics.stressLevel;

    const tipsList = document.getElementById('wellnessTips');
    tipsList.innerHTML = '';
    const tips = generateWellnessTips(metrics);
    tips.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        tipsList.appendChild(li);
    });
}

// 데이터 새로고침 함수
async function refreshData() {
    try {
        chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
            if (response) {
                // 일간 차트 업데이트
                dailyChart.data.datasets[0].data = response.dailyStats;
                dailyChart.update();
                
                // 주간 차트 업데이트
                weeklyChart.data.datasets[0].data = response.weeklyStats;
                weeklyChart.update();

                // 웰빙 메트릭 계산 및 업데이트
                const wellnessMetrics = calculateWellnessMetrics(response);
                updateWellnessMetrics(wellnessMetrics);
            }
        });
    } catch (error) {
        console.error('데이터 새로고침 중 오류 발생:', error);
    }
}

// 5분마다 데이터 새로고침
setInterval(refreshData, 5 * 60 * 1000);

// 초기 데이터 로드
refreshData(); 