# Brass Pittsburgh

공개 웹앱: https://sirhero8282.github.io/brass-pittsburgh/

현재 공개 기능은 기존 2인/오토마 앱입니다. 4인 지도는 참고 화면이며 온라인 4인 플레이는 아직 제공하지 않습니다.

## 실행·배포

Node.js 22 이상에서 별도 의존성 설치 없이 실행합니다.

```sh
npm test
npm run build
npm start
```

로컬 주소: http://127.0.0.1:4194/brass-pittsburgh/

`main`에 push하면 GitHub Actions가 회귀 검사·정적 경로 검사 후 `dist/`만 Pages에 배포합니다. GitHub Pages 기본 주소를 사용하며 유료 서버나 유료 도메인이 필요하지 않습니다. 저장소 Settings → Pages → Source는 GitHub Actions입니다.

게임 저장은 현재 브라우저·사이트 주소별 localStorage에 있습니다. 기존 ChatGPT Site의 저장 내용은 GitHub Pages로 자동 이전되지 않습니다. 같은 github.io 출처의 앱 간 충돌을 피하려면 추후 저장 키를 버전별로 이관해야 합니다.

## 소스 기준

2026-10-17 현재 공개 Sites v83, commit `5269bd26d901016c9646ed5b88d2912632b60c97`에서 가져왔습니다. 기존 비공개 개발 저장소의 실험·학습 기록과 Git 이력은 포함하지 않습니다. `dist/`의 기존 상대 경로와 게임 규칙을 보존하고 Pages용 메타데이터 및 로컬 세션 경계만 적용했습니다. 저작물에 대한 별도 오픈소스 라이선스를 부여하지 않습니다.

최신 검증된 Site 소스를 가져올 때는 `dist/`, `engine-source.js`, 해당 회귀 검사와 규칙 생성기를 함께 갱신한 후 `npm run build`를 실행하세요. `scripts/prepare-pages.cjs`는 저장 접근과 메타데이터에 제한된 재실행 가능한 변환을 적용하고, 원본 구조가 바뀌면 실패합니다. 출처 메모도 갱신해야 합니다.

향후 온라인 확장 설계는 [docs/MULTIPLAYER.md](docs/MULTIPLAYER.md)를 참고하세요.
