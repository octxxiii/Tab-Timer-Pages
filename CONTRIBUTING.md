# 기여 가이드라인 (Contributing Guidelines)

Tab Timer Pages 프로젝트에 기여해 주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 개발 환경 설정

1. 저장소 포크 및 클론
   ```bash
   git clone https://github.com/your-username/tab-timer-pages.git
   cd tab-timer-pages
   ```

2. 로컬 서버 실행
   ```bash
   python -m http.server 8000
   # 또는
   npx http-server -p 8000
   ```

3. 브라우저에서 `http://localhost:8000` 접속

## 코딩 스타일

### HTML
- 시맨틱 HTML5 태그 사용
- 접근성을 고려한 마크업
- 한국어 콘텐츠는 `lang="ko"` 속성 사용

### CSS
- CSS Custom Properties (변수) 사용 (`variables.css` 참조)
- BEM 네이밍 컨벤션 권장
- 반응형 디자인 고려 (모바일 우선)

### JavaScript
- ES6+ 문법 사용
- `const` / `let` 사용 (`var` 금지)
- 함수형 프로그래밍 스타일 권장
- 에러 핸들링 필수 (try-catch)
- 주석은 한국어 또는 영어

## 커밋 컨벤션

커밋 메시지는 다음 형식을 따릅니다:

```
<type>: <subject>

<body>

<footer>
```

### Type
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가
- `chore`: 빌드 설정, 패키지 관리 등

### 예시
```
feat: Add dark mode support

- Add CSS variables for dark theme
- Implement theme toggle button
- Update dashboard styles

Closes #123
```

## Pull Request 프로세스

1. **이슈 생성**: 먼저 관련 이슈를 생성하거나 확인하세요
2. **브랜치 생성**: `feature/your-feature-name` 형식으로 브랜치 생성
3. **개발**: 변경사항 구현
4. **테스트**: 로컬에서 테스트 확인
5. **PR 생성**: 상세한 설명과 함께 Pull Request 생성

### PR 체크리스트
- [ ] 코드가 프로젝트 스타일 가이드를 따름
- [ ] 변경사항이 문서화됨
- [ ] 브라우저 호환성 확인
- [ ] 에러 핸들링이 적절함
- [ ] 불필요한 콘솔 로그 제거

## 프로젝트 구조 이해

### 핵심 파일
- `variables.css`: 디자인 시스템 변수 (색상, 간격, 타이포그래피 등)
- `dashboard.js`: 대시보드 메인 로직
- `data-export.js`: 데이터 Export/Import 기능
- `PROJECT_ANALYSIS.md`: 프로젝트 분석 및 개발 계획

### 데이터 구조
```javascript
{
  tabTimes: { [domain]: time (ms) },
  dailyStats: { [date]: { domains: {}, hourly: [], visits: {} } },
  timeLimits: { [domain]: limit (ms) },
  limitStartTimes: { [domain]: timestamp }
}
```

## 질문 및 지원

- 이슈 생성: [GitHub Issues](https://github.com/octxxiii/tab-timer-pages/issues)
- 질문: 이슈에 `question` 라벨 추가

## 행동 강령

모든 기여자는 프로젝트의 행동 강령을 준수해야 합니다. 존중과 포용적인 환경을 유지하기 위해 노력합니다.

---

감사합니다! 🎉

