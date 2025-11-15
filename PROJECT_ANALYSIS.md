# Tab Timer Pages - 프로젝트 분석 및 개발 계획

## 📊 현재 프로젝트 상태 분석

### 프로젝트 개요
Tab Timer Chrome 확장 프로그램의 랜딩 페이지 및 디지털 웰빙 대시보드 웹사이트입니다.

### 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **차트 라이브러리**: Chart.js (CDN)
- **폰트**: Google Fonts (Noto Sans KR)
- **데이터 저장소**: 
  - `script.js`: localStorage 사용
  - `dashboard.js`: chrome.storage API 사용 (문제 있음)

---

## 🔴 발견된 주요 문제점

### 1. **아키텍처 문제**

#### 1.1 Chrome Extension API 접근 불가
```58:58:dashboard.js
const result = await chrome.storage.local.get(['tabTimes', 'dailyStats', 'timeLimits', 'limitStartTimes']);
```

**문제**: 
- `dashboard.js`가 일반 웹 페이지에서 `chrome.storage` API를 직접 호출하려고 시도
- 일반 웹 페이지는 Chrome Extension API에 접근할 수 없음
- 확장 프로그램과 웹 페이지 간 통신 메커니즘이 없음

**영향**: 대시보드가 실제 데이터를 표시하지 못함

#### 1.2 데이터 소스 불일치
- `script.js`: `localStorage` 사용
- `dashboard.js`: `chrome.storage` 사용
- 두 파일이 서로 다른 데이터 소스를 가정

### 2. **코드 품질 문제**

#### 2.1 중복 코드
```248:341:dashboard.js
document.addEventListener('DOMContentLoaded', initializeDashboard);

document.addEventListener('DOMContentLoaded', async () => {
  // ... 동일한 로직이 중복됨
});
```

**문제**: 
- `DOMContentLoaded` 이벤트 리스너가 두 번 등록됨
- `loadDashboardData()` 함수와 중복된 인라인 코드가 존재
- 코드 중복으로 인한 유지보수 어려움

#### 2.2 구문 오류
```102:106:dashboard.js
const limits = Object.entries(result.timeLimits || {}).map
  const startTime = result.limitStartTimes?.[domain];
  const remaining = startTime ? Math.max(0, limit - (Date.now() - startTime)) : limit;
  return { domain, limit, remaining };
;
```

**문제**: 
- `.map()` 메서드 호출이 불완전함
- 화살표 함수 구문이 잘못됨

#### 2.3 미사용/누락된 기능
- Chart.js가 로드되지만 실제 차트를 렌더링할 `<canvas>` 요소가 `dashboard.html`에 없음
- `updateWellbeingTips()`, `updateSiteLimits()` 함수가 호출되지만 데이터가 전달되지 않음

### 3. **UI/UX 문제**

#### 3.1 일관성 부족
- `privacy.html`은 영어로 작성되어 있으나 나머지는 한국어
- CSS 변수 정의가 여러 파일에 분산되어 있음 (`styles.css`, `dashboard.css`)

#### 3.2 반응형 디자인 미완성
- 모바일 최적화가 부분적으로만 구현됨
- 일부 컴포넌트가 작은 화면에서 제대로 표시되지 않을 수 있음

### 4. **테스트 및 품질 보증**

#### 4.1 테스트 부재
- 단위 테스트 없음
- 통합 테스트 없음
- E2E 테스트 없음

#### 4.2 에러 핸들링 부족
- 많은 함수에서 에러 처리가 미흡함
- 사용자에게 명확한 에러 메시지 제공 부족

---

## 🎯 개발 방향 및 우선순위

### Phase 1: 긴급 수정 (Critical Fixes) 🔴

#### 1.1 데이터 통신 아키텍처 재설계
**목표**: 확장 프로그램과 웹 페이지 간 안정적인 데이터 통신 구현

**방법**:
1. **옵션 A**: Message Passing API 사용
   - 확장 프로그램에서 `chrome.runtime.sendMessage()`로 데이터 전송
   - 웹 페이지에서 `window.postMessage()`로 수신
   
2. **옵션 B**: Shared Storage 사용
   - 확장 프로그램이 `chrome.storage.local`에 데이터 저장
   - 웹 페이지는 확장 프로그램의 Content Script를 통해 데이터 접근

3. **옵션 C**: Export/Import 기능
   - 확장 프로그램에서 데이터를 JSON으로 내보내기
   - 웹 페이지에서 파일 업로드로 데이터 가져오기

**권장**: 옵션 C (가장 간단하고 안정적)

#### 1.2 코드 중복 제거 및 리팩토링
- 중복된 `DOMContentLoaded` 리스너 통합
- 공통 함수 추출 및 모듈화
- 구문 오류 수정

#### 1.3 에러 핸들링 강화
- 모든 비동기 함수에 try-catch 추가
- 사용자 친화적인 에러 메시지 표시
- 폴백 UI 제공

### Phase 2: 기능 개선 (Feature Enhancement) 🟡

#### 2.1 대시보드 기능 완성
- [ ] Chart.js를 사용한 시간대별 사용 패턴 시각화
- [ ] 주간/월간 통계 차트 추가
- [ ] 사이트 카테고리별 그룹핑 (생산성, 엔터테인먼트 등)
- [ ] 목표 설정 및 달성률 표시

#### 2.2 데이터 내보내기/가져오기
- [ ] JSON 형식으로 데이터 내보내기
- [ ] CSV 형식으로 데이터 내보내기
- [ ] 데이터 가져오기 기능
- [ ] 데이터 백업/복원 기능

#### 2.3 개인화 기능
- [ ] 다크 모드 지원
- [ ] 테마 커스터마이징
- [ ] 언어 설정 (한국어/영어)

### Phase 3: 코드 품질 향상 (Code Quality) 🟢

#### 3.1 모듈화 및 구조 개선
- [ ] ES6 모듈 시스템 도입
- [ ] 컴포넌트 기반 아키텍처
- [ ] 공통 유틸리티 함수 분리

#### 3.2 빌드 시스템 도입
- [ ] Webpack 또는 Vite 설정
- [ ] CSS 전처리기 (Sass/PostCSS) 도입
- [ ] 코드 번들링 및 최적화

#### 3.3 테스트 도입
- [ ] Jest 설정
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] E2E 테스트 (Playwright/Cypress)

### Phase 4: 성능 및 접근성 (Performance & Accessibility) 🔵

#### 4.1 성능 최적화
- [ ] 이미지 최적화 및 lazy loading
- [ ] 코드 스플리팅
- [ ] 캐싱 전략 구현
- [ ] Lighthouse 점수 90+ 달성

#### 4.2 접근성 개선
- [ ] ARIA 레이블 추가
- [ ] 키보드 네비게이션 지원
- [ ] 스크린 리더 호환성
- [ ] WCAG 2.1 AA 준수

---

## 📋 상세 작업 계획

### 즉시 실행 가능한 작업 (Quick Wins)

1. **구문 오류 수정** (30분)
   - `dashboard.js`의 `.map()` 구문 수정
   - 중복 코드 제거

2. **에러 핸들링 추가** (1시간)
   - 모든 비동기 함수에 try-catch 추가
   - 사용자 피드백 개선

3. **Privacy 페이지 한국어 번역** (30분)
   - `privacy.html` 한국어 번역

4. **CSS 변수 통합** (1시간)
   - 모든 CSS 파일의 변수를 `:root`에 통합
   - 일관된 디자인 시스템 구축

### 단기 작업 (1-2주)

1. **데이터 통신 아키텍처 구현**
   - Export/Import 기능 구현
   - 데이터 검증 로직 추가

2. **대시보드 차트 구현**
   - Chart.js 통합 완료
   - 시간대별, 주간 통계 차트 추가

3. **반응형 디자인 완성**
   - 모바일 최적화
   - 태블릿 레이아웃 개선

### 중기 작업 (1-2개월)

1. **테스트 인프라 구축**
   - Jest 설정
   - 핵심 기능 테스트 작성

2. **빌드 시스템 도입**
   - Webpack/Vite 설정
   - 개발/프로덕션 빌드 분리

3. **문서화**
   - API 문서 작성
   - 개발자 가이드 작성

---

## 🏗️ 권장 아키텍처

### 현재 구조
```
Tab-Timer-Pages/
├── index.html
├── dashboard.html
├── privacy.html
├── script.js
├── dashboard.js
├── styles.css
├── dashboard.css
└── images/
```

### 개선된 구조 (제안)
```
Tab-Timer-Pages/
├── src/
│   ├── index.html
│   ├── dashboard.html
│   ├── privacy.html
│   ├── js/
│   │   ├── main.js
│   │   ├── dashboard/
│   │   │   ├── dashboard.js
│   │   │   ├── charts.js
│   │   │   └── data-handler.js
│   │   ├── utils/
│   │   │   ├── format.js
│   │   │   ├── storage.js
│   │   │   └── validation.js
│   │   └── components/
│   │       ├── stat-card.js
│   │       └── site-list.js
│   ├── css/
│   │   ├── variables.css
│   │   ├── base.css
│   │   ├── components.css
│   │   └── pages/
│   │       ├── index.css
│   │       └── dashboard.css
│   └── assets/
│       └── images/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── package.json
├── webpack.config.js (또는 vite.config.js)
└── README.md
```

---

## 📊 성공 지표 (KPIs)

### 기술적 지표
- [ ] 코드 커버리지 80% 이상
- [ ] Lighthouse 성능 점수 90+
- [ ] Lighthouse 접근성 점수 90+
- [ ] 빌드 시간 < 30초
- [ ] 번들 크기 < 200KB (gzipped)

### 기능적 지표
- [ ] 모든 주요 기능이 정상 작동
- [ ] 데이터 내보내기/가져오기 성공률 100%
- [ ] 대시보드 로딩 시간 < 2초
- [ ] 모바일 호환성 100%

---

## 🔄 개발 워크플로우 제안

### 1. Git 브랜치 전략
- `main`: 프로덕션 배포용
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발 브랜치
- `fix/*`: 버그 수정 브랜치

### 2. 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 설정 등
```

### 3. 코드 리뷰 프로세스
- 모든 PR은 최소 1명의 리뷰어 승인 필요
- 자동화된 테스트 통과 필수
- Lighthouse 점수 유지 필수

---

## 🚀 다음 단계

### 즉시 시작할 작업
1. ✅ 구문 오류 수정
2. ✅ 중복 코드 제거
3. ✅ 에러 핸들링 강화
4. ✅ Privacy 페이지 번역

### 이번 주 내 완료 목표
1. 데이터 통신 아키텍처 설계 및 구현
2. 대시보드 차트 기능 완성
3. 기본적인 테스트 작성

---

## 📝 참고사항

- 확장 프로그램 소스 코드는 별도 저장소에 있음
- 이 프로젝트는 랜딩 페이지 및 대시보드 웹사이트만 관리
- 모든 데이터는 로컬에만 저장 (프라이버시 우선)

---

**작성일**: 2025-01-27
**작성자**: AI Development Assistant
**버전**: 1.0

