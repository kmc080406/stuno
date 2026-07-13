# STUNO 1

Study Note를 줄인 이름의 시험 공부 계획 웹앱입니다.

## 배포 파일

GitHub Pages 저장소 최상단에 아래 5개 파일을 올리세요.

- `index.html`
- `styles.css`
- `app.bundle.js`
- `sw.js`
- `README.md`

저장소 구조는 다음과 같아야 합니다.

```text
stuno/
├─ index.html
├─ styles.css
├─ app.bundle.js
├─ sw.js
└─ README.md
```

## GitHub Pages 배포

1. GitHub의 `stuno` 저장소를 엽니다.
2. 위 5개 파일을 저장소 최상단에 업로드합니다.
3. 기존 같은 이름의 파일이 있으면 덮어씁니다.
4. `Settings → Pages`로 이동합니다.
5. `Deploy from a branch`를 선택합니다.
6. 브랜치는 `main`, 폴더는 `/root`로 설정합니다.
7. 배포 후 아래 주소로 접속합니다.

```text
https://kmc080406.github.io/stuno/
```

## 업데이트 후 이전 화면이 보일 때

STUNO는 오프라인 실행을 위해 서비스 워커 캐시를 사용합니다. 업데이트 후 이전 버전이 보이면 다음 중 하나를 실행하세요.

- 강력 새로고침
- 브라우저의 STUNO 사이트 데이터 삭제 후 재접속
- Chrome 개발자 도구의 `Application → Service Workers → Unregister`

## 저장 방식

학습 계획과 설정은 현재 브라우저의 `localStorage`에 자동 저장됩니다.

- 같은 기기와 같은 브라우저에서는 유지됩니다.
- 브라우저 데이터를 삭제하면 함께 삭제됩니다.
- 다른 기기와 자동 동기화되지는 않습니다.

## Google Calendar

Google OAuth 웹 클라이언트 ID가 `index.html`에 적용되어 있습니다.

Google Cloud의 승인된 JavaScript 원본에는 다음 주소가 등록되어 있어야 합니다.

```text
https://kmc080406.github.io
```

테스트 모드라면 실제 사용할 Google 계정을 OAuth 테스트 사용자에 추가해야 합니다.

## 주의

- `index.html`을 하위 폴더에 넣지 마세요.
- `stuno/stuno-1/index.html` 형태가 아니라 `stuno/index.html`이어야 합니다.
- `app.bundle.js`와 `sw.js`를 빠뜨리면 앱이 정상 작동하지 않습니다.
