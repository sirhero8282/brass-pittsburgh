(function(){
  'use strict';
  const $=id=>document.getElementById(id),endpoint=window.BRASS_METRICS?.endpoint;
  if(!endpoint){$('status').textContent='집계 준비 중 · 서버가 아직 연결되지 않았습니다. 현재 방문자 데이터는 수집하지 않습니다.';return;}
  $('login').hidden=false;$('status').textContent='관리자 조회 키를 입력하면 통계를 확인할 수 있습니다.';
  let key='',busy=false;
  async function refresh(){
    if(busy||!key)return;busy=true;$('refresh').disabled=true;
    try{
      const response=await fetch(new URL('/stats',endpoint).href,{headers:{Authorization:'Bearer '+key},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10_000)});
      if(!response.ok)throw Error(response.status===401?'조회 키를 확인해 주세요.':'통계 서버에 연결할 수 없습니다.');
      const data=await response.json();
      $('active').textContent=data.active+'명';$('today').textContent=data.today+'명';
      $('daily').replaceChildren(...data.daily.map(day=>{const row=document.createElement('tr');for(const value of [day.day,day.visitors+'명']){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}return row;}));
      $('updated').textContent='갱신: '+new Date(data.asOf).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})+' (한국 시간)';
      $('report').hidden=false;$('status').textContent='집계 중 · 현재 접속 수는 30초마다 갱신됩니다.';
    }catch(error){$('status').textContent=error.message==='조회 키를 확인해 주세요.'?error.message:'통계를 갱신하지 못했습니다. 표시된 값은 마지막 조회 결과입니다.';}
    finally{busy=false;$('refresh').disabled=false;}
  }
  $('login').addEventListener('submit',event=>{event.preventDefault();key=$('token').value.trim();$('token').value='';refresh();});
  $('refresh').addEventListener('click',refresh);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
  setInterval(()=>{if(document.visibilityState==='visible')refresh();},30_000);
})();
