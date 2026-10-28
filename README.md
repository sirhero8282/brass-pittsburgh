# Brass Pittsburgh

공개 웹앱: https://sirhero8282.github.io/brass-pittsburgh/

2인/4인 오토마 대국과 사람 네 명의 온라인 초대방을 제공합니다. [온라인 대국](https://sirhero8282.github.io/brass-pittsburgh/online.html)에서 실시간 또는 턴제를 선택할 수 있습니다. 사용법·시간 정책·서버 배포는 [온라인 안내](docs/ONLINE.md)를 참고하세요.

## 실행·배포

기존 정적 게임은 Node.js 22 이상에서 별도 의존성 설치 없이 실행합니다. 온라인 서버는 `multiplayer/`의 별도 의존성과 Cloudflare 배포가 필요합니다.

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

## 방문 통계

관리자 통계 화면: https://sirhero8282.github.io/brass-pittsburgh/stats.html

일별 방문자와 현재 접속 브라우저를 Cloudflare Worker + SQLite Durable Object에서 집계합니다. 한국 시간 기준이며 현재 접속은 최근 150초 내 신호를 보낸 브라우저 수입니다. [설치 및 집계 기준](docs/ANALYTICS.md)을 참고하세요. 관리자 조회 키는 서버 secret으로 설정하고 이 PC에는 Windows 사용자 기준으로 암호화 보관하며, 공개 설정 파일에는 넣지 않습니다.
