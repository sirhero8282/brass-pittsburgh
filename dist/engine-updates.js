/* Read-only release information. No save, migration or game-state writes. */
(() => {
  const release = Object.freeze({
    version: 'v214 · 개발 자원 분리 조달',
    date: '2026-10-19',
    timezone: 'Asia/Seoul',
    executor: 'plan-executor-v214-development-supply-v1'
  });
  const current = document.getElementById('engineReleaseCurrent');
  if (current) {
    const actual = typeof AUTOMA_EXECUTOR_VERSION === 'string' ? AUTOMA_EXECUTOR_VERSION : '확인 불가';
    current.textContent = actual === release.executor
      ? release.version + ' · ' + release.date + ' (한국 시간) · 현재 실행기 일치'
      : '실행기 확인 필요 · 이 페이지 실행기: ' + actual + ' / 배포 기준: ' + release.executor;
  }
})();
