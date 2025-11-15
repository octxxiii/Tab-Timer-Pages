# Tab Timer Landing Page

이 레포지토리는 Tab Timer Chrome 확장 프로그램의 랜딩 페이지 및 디지털 웰빙 대시보드를 관리하기 위한 저장소입니다.

> **참고**: 실제 Tab Timer 확장 프로그램의 소스 코드는 별도의 비공개 [Tab Timer 저장소](https://github.com/octxxiii/tab-timer)에서 관리됩니다.

## 프로젝트 설명

이 웹사이트는 Tab Timer Chrome 확장 프로그램의 공식 랜딩 페이지로, 다음과 같은 정보와 기능을 제공합니다:

- 확장 프로그램 소개 및 기능 설명
- 설치 방법 안내
- 사용 방법 가이드
- 개인정보 보호 정책
- **디지털 웰빙 대시보드** (사용 시간 통계 및 분석)
- **데이터 Export/Import 기능** (백업 및 복원)

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **차트 라이브러리**: Chart.js (데이터 시각화)
- **폰트**: Google Fonts (Noto Sans KR)
- **디자인 시스템**: CSS Custom Properties (Variables)
- **데이터 저장소**: Chrome Storage API / localStorage (폴백)

## 프로젝트 구조

```
.
├── index.html              # 메인 랜딩 페이지
├── styles.css              # 메인 스타일시트
├── variables.css           # 디자인 시스템 변수
├── script.js               # 메인 JavaScript
├── dashboard.html          # 대시보드 페이지
├── dashboard.js            # 대시보드 로직
├── dashboard.css           # 대시보드 스타일
├── data-export.js          # 데이터 Export/Import 모듈
├── privacy.html            # 개인정보 처리방침
├── images/                 # 이미지 리소스
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── icon.svg
│   └── store/
├── PROJECT_ANALYSIS.md     # 프로젝트 분석 및 개발 계획
└── CHANGELOG.md            # 변경 이력
```

## 주요 기능 설명

### 랜딩 페이지 (`index.html`)
- 확장 프로그램 소개 및 기능 설명
- 설치 방법 안내
- 사용 방법 가이드
- 개인정보 보호 정책 링크

### 디지털 웰빙 대시보드 (`dashboard.html`)
- **일일 통계**
  - 총 사용 시간
  - 자주 방문한 사이트 Top 5
- **주간 통계**
  - 이번 주 요약
  - 주간 사용 시간 추이 차트 (Chart.js)
  - 일 평균 사용 시간
- **시간 제한 현황**
  - 설정된 사이트별 시간 제한
  - 남은 시간 표시
- **데이터 관리** ⭐ 새로 추가!
  - JSON 형식으로 데이터 내보내기
  - CSV 형식으로 데이터 내보내기 (Excel 호환)
  - JSON 파일로 데이터 가져오기
  - 모든 데이터 초기화

## 개인정보 보호

- ✅ 모든 데이터는 사용자의 로컬 기기에만 저장
- ✅ 외부 서버로의 데이터 전송 없음
- ✅ 오프라인 작동 지원
- ✅ Chrome Extension API와 localStorage 폴백 지원

## 최근 업데이트 (2025-01-27)

### ✨ 새로운 기능
- **데이터 Export/Import 시스템**: JSON 및 CSV 형식으로 데이터 백업 및 복원
- **통합 디자인 시스템**: CSS 변수를 통한 일관된 디자인
- **향상된 에러 핸들링**: 모든 비동기 함수에 에러 처리 추가
- **개선된 사용자 경험**: 성공/에러 메시지 표시 시스템

### 🔧 개선 사항
- 코드 중복 제거 및 리팩토링
- Chrome Extension API 폴백 메커니즘 구현
- Privacy 페이지 한국어 번역
- Chart.js 통합 준비

자세한 변경 사항은 [CHANGELOG.md](./CHANGELOG.md)를 참조하세요.

## 설치 방법

### 확장 프로그램 설치
1. Chrome 웹 스토어에서 "Tab Timer" 검색
2. "Chrome에 추가" 버튼 클릭
3. 설치 완료 후 Chrome 툴바에서 Tab Timer 아이콘 확인

### 로컬 개발 환경 설정
1. 저장소 클론:
   ```bash
   git clone https://github.com/octxxiii/tab-timer-pages.git
   cd tab-timer-pages
   ```

2. 로컬 서버 실행 (Python 예시):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # 또는 Node.js (http-server)
   npx http-server -p 8000
   ```

3. 브라우저에서 접속:
   ```
   http://localhost:8000
   ```

## 사용 방법

### 대시보드 사용
1. 랜딩 페이지에서 "대시보드 바로가기" 클릭
2. 또는 직접 `dashboard.html` 접속
3. 확장 프로그램이 설치된 경우 자동으로 데이터 동기화
4. 확장 프로그램이 없는 경우 localStorage에서 데이터 로드

### 데이터 백업 및 복원
1. **데이터 내보내기**:
   - 대시보드의 "데이터 관리" 섹션에서 "JSON으로 내보내기" 또는 "CSV로 내보내기" 클릭
   - 파일이 자동으로 다운로드됩니다

2. **데이터 가져오기**:
   - "JSON 파일 가져오기" 버튼 클릭
   - 이전에 내보낸 JSON 파일 선택
   - 확인 후 데이터가 복원됩니다

## 브라우저 호환성

- ✅ Chrome/Edge (권장)
- ✅ Firefox
- ✅ Safari
- ✅ 기타 Chromium 기반 브라우저

## 개발 계획

자세한 개발 계획 및 로드맵은 [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md)를 참조하세요.

## 기여하기

이슈 리포트 및 Pull Request를 환영합니다!

## 관련 프로젝트

- [Tab Timer 확장 프로그램](https://github.com/octxxiii/tab-timer) - 실제 Chrome 확장 프로그램 소스 코드

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 
