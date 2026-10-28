import {buildPushPayload} from '@block65/webcrypto-web-push';
export function validateSubscription(input,allowedOrigins){
 const s=input.subscription,url=new URL(s?.endpoint||'https://invalid.example');
 const allowed=url.hostname==='fcm.googleapis.com'||url.hostname==='web.push.apple.com'||url.hostname==='updates.push.services.mozilla.com'||url.hostname.endsWith('.push.services.mozilla.com')||url.hostname.endsWith('.notify.windows.com');
 if(!allowed||url.protocol!=='https:'||url.port||url.username||url.password||url.href.length>2048||!s?.keys||!/^[A-Za-z0-9_-]{80,100}$/.test(s.keys.p256dh)||!/^[A-Za-z0-9_-]{20,30}$/.test(s.keys.auth))throw Error('브라우저 알림 등록 정보를 확인하세요.');
 const page=new URL(input.pageUrl);if(!allowedOrigins.includes(page.origin)||!page.pathname.endsWith('/online.html'))throw Error('알림을 열 페이지가 올바르지 않습니다.');page.hash='';page.search='';
 return {endpoint:url.href,expirationTime:s.expirationTime??null,keys:{p256dh:s.keys.p256dh,auth:s.keys.auth},pageUrl:page.href};
}
export async function sendPush(subscription,env,message,fetcher=fetch){
 const vapid={subject:env.VAPID_SUBJECT,publicKey:env.VAPID_PUBLIC_KEY,privateKey:env.VAPID_PRIVATE_KEY};
 const payload=await buildPushPayload({data:JSON.stringify(message),options:{ttl:3600}},subscription,vapid);
 const response=await fetcher(subscription.endpoint,{...payload,redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!response.ok&&response.status!==404&&response.status!==410)throw Error('Push delivery '+response.status);return response.status;
}
