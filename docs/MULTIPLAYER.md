# 온라인 4인 확장을 위한 경계 (이전 설계 기록)

2026-10-28에 초대방 실시간/턴제 서버와 화면을 구현했다. 현재 사용법과 실제 구현 범위는 [ONLINE.md](ONLINE.md)를 참고한다. 아래는 온라인 연결 전의 경계 추출 계획이며 현재 기능 설명이 아니다.

## 이번에 실제 적용한 것

- `dist/runtime/local-session.js`: DOM이나 게임 규칙을 모르는 저장·변경 구독 인터페이스. 앱 `load()`/`save()`가 이 경계를 사용한다. 기존 저장 포맷과 키를 유지한다.
- `shared/room-protocol.mjs`: DOM/Cloudflare/GitHub와 독립된 2~4인 명령 및 플레이어별 스냅샷 규격. 방·플레이어·명령 ID, 예상 revision을 요구한다. 현재 로컬 앱은 이 온라인 명령을 보내지 않는다.
- Pages에는 `dist/`만 게시한다. 향후 서버는 별도 배포하고 브라우저 화면은 이 URL을 계속 사용할 수 있다.

현재 앱의 규칙과 렌더러는 여전히 `dist/app.js`의 기존 함수·전역 상태를 공유한다. `engine-source.js`도 기존 VM 회귀 검사 대상이며 완전히 분리된 서버 엔진이 아니다. `player`/`automa` 2역할을 단순히 4인 배열로 바꾸는 것만으로 4인 규칙이 완성되지 않는다. 이번 변경은 안전한 저장 경계와 통신 계약을 먼저 만드는 단계다.

## 다음 구현 순서

1. 현행 회귀 검사로 규칙을 고정한 뒤 `createGame(config, seed)`, `legalActions(state, playerId)`, `applyCommand(state, command)`, `projectForPlayer(state, playerId)`를 DOM·localStorage·Date/Math.random 없이 실행되는 공유 엔진으로 추출한다. seed와 시간은 생성 입력으로 전달하고 순수한 상태 변환을 목표로 한다. 기존 UI의 대화상자/선택은 명령 payload를 만드는 역할로 남긴다.
2. 돈·수입·손패·개인판·공급·라운드 지출을 `playersById`로 바꾸고 명시적인 선턴/턴 순서를 둔다. 기존 두 역할의 승인된 규칙을 유지하면서 별도로 확인된 4인 지도·덱·공급·턴 규칙을 추가한다. 4인 지도 화면이 있다는 이유로 엔진이 지원한다고 간주하지 않는다.
3. 초대 코드 방 생성/입장과 서버 권한 검증을 붙인다. 서버가 연결 세션에서 playerId를 결정한다. 클라이언트 입력의 playerId는 신뢰하지 않는다. 서버가 손패·덱·셔플 결과와 게임 상태의 원본을 소유한다.
4. 방별 명령 큐에서 expectedRevision 불일치를 거부하고 commandId로 재전송을 중복 제거한다. 합법성 검증→상태/행동 기록의 원자적 저장→revision 증가→각 플레이어에게 맞는 view 전송 순서로 처리한다. 재접속 시 최신 view와 마지막 처리 commandId를 복구한다.
5. 초대방 4브라우저 시험 후 공개 매칭을 추가한다. 잘못된 턴·중복 요청·동시 건설·연결 끊김·서버 재시작·개인정보 노출을 시험한다.

`createPlayerSnapshot()`은 명시적으로 분리된 publicState/privateByPlayer만 받는다. 현재 legacy state에는 상대 패/덱/AI 내부 정보가 있어 publicState로 통째로 전달하면 안 된다. 스냅샷 helper는 임의 publicState의 안전성을 판별하지 않으므로 미래 엔진의 allowlist 투영 및 테스트가 필수다. `validateCommand()`는 형태 검사이며 행동 합법성이나 인증을 대체하지 않는다.

서버 구현은 아직 선택하지 않았다. Cloudflare Workers/Durable Objects나 Node 기반 서버 등에서 같은 계약을 쓸 수 있다. 이번 공개 배포에는 서버 계정·서버 비용·온라인 연결이 없다.
