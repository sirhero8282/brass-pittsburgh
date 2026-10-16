# 방문 통계 설치

현재 상태: 프런트엔드와 서버 코드만 준비됨. Cloudflare 계정/서버가 연결되기 전에는 metrics-config.js의 endpoint가 비어 있어 집계가 꺼져 있다. 준비 상태의 통계 화면은 /stats.html에서 볼 수 있다.

## 집계 기준

- 한국 시간(Asia/Seoul) 기준 브라우저당 하루 한 번. 같은 브라우저의 여러 탭은 동일 ID를 공유한다.
- 화면에 보이는 게임 탭만 60초마다 신호를 보내며 최근 150초 내 신호를 보낸 브라우저를 현재 접속으로 센다. 탭 종료 후 최대 150초 지연이 있을 수 있다. 플레이 여부나 온라인 방 인원수가 아니다.
- 방문 통계는 무작위 브라우저 ID를 localStorage에 보관하고 서버로 전송한다. 서버에는 해시된 ID와 시간/날짜만 저장한다. IP, 사용자 에이전트, 경기 상태, 손패, URL 쿼리, 리퍼러는 앱에서 저장하지 않는다. 운영 플랫폼 자체의 요청 처리는 별도다.
- 일별 중복 방지 기록은 오늘/어제만, 일별 합계는 최근 1년까지만 유지한다. 화면은 최근 30일을 보여준다. 오래된 기록은 다음 집계 요청 때 정리한다. 활성 수 계산은 만료 시각으로 필터하므로 정리 요청이 없어도 숫자가 자동으로 오래 남지 않는다.
- 사람의 정확한 수를 보장하지 않는다. 시크릿 창/기기/저장소 삭제는 중복 집계, 차단 도구/네트워크 오류는 누락을 만들 수 있다. 공개 이벤트 API는 인증된 인원수나 부정 접속 방지 수단이 아니다.

## 1. Cloudflare 무료 계정 연결

https://dash.cloudflare.com/sign-up 에서 직접 계정을 생성하고 로그인한다. Workers Free 플랜을 사용하며 유료 플랜으로 전환하지 않는다. GitHub Pages 호스팅과 URL은 유지한다.

## 2. 서버 배포

Node.js 22 이상과 npm이 있는 환경에서, 이 저장소의 analytics 디렉터리에서 공식 Wrangler를 사용한다.

```sh
npx wrangler@4 login
npx wrangler@4 deploy
npx wrangler@4 secret put ADMIN_TOKEN
```

ADMIN_TOKEN은 암호 관리자로 생성한 최소 32바이트 무작위 비밀값을 사용하고 안전한 곳에 보관한다. 저장소·브라우저 설정 파일·대화에는 올리지 않는다. secret put 프롬프트에 직접 입력한다. 배포된 Worker URL은 공개해도 되는 endpoint이고 관리자 조회 키와 다르다.

analytics/wrangler.jsonc는 SQLite Durable Object를 생성한다. ALLOWED_ORIGIN은 GitHub Pages 출처다. 외부 POST는 이 출처만 허용하지만 Origin은 인증이 아니므로 공격자가 위조할 수 있다. 관리자 /stats는 별도 ADMIN_TOKEN 없이는 거부한다.

## 3. 프런트엔드 연결

dist/metrics-config.js의 endpoint에 위에서 발급된 https://brass-pittsburgh-metrics.<계정>.workers.dev 주소를 입력하고 GitHub에 push한다. ADMIN_TOKEN은 여기에 넣지 않는다. 게임 탭에서 신호를 보낸 뒤 /stats.html에 관리자 조회 키를 입력해 실제 수치를 확인한다. 조회 키는 탭 메모리에서만 사용하며 저장소/URL에 남기지 않는다. 관리자 통계 페이지 자체는 방문으로 세지 않는다.

## 비용과 한도

Workers Free + SQLite Durable Objects 무료 한도 내에서 사용할 수 있다. 유료 전환 없이 무료 한도에 도달하면 집계 요청이 실패할 수 있다. 60초 HTTP heartbeat는 상시 접속자 1명당 하루 약 1,440요청이므로 많은 상시 접속자가 생기면 WebSocket hibernation 방식이나 별도 분석 서비스로 전환을 검토한다. 무료 사용을 무제한으로 보장하지 않는다.

공식 요금: https://developers.cloudflare.com/durable-objects/platform/pricing/
