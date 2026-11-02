/* Original printed nameplates, clipped from the same art; no new artwork or game state. */
(() => {
 'use strict';
 // Normalized center/size on the reviewed 2P v27 and 4P r399-v4 images.
 const two=[["서부",0.096125,0.5515,0.06875,0.013],["털리도",0.154375,0.363875,0.06375,0.01725],["디트로이트",0.2395,0.26525,0.0675,0.0135],["캐나다",0.383,0.160875,0.0695,0.01325],["클리브랜드",0.31575,0.452375,0.066,0.01525],["피츠버그",0.402,0.599375,0.0685,0.01525],["클락스버그",0.36975,0.777375,0.066,0.01425],["볼티모어",0.534,0.741625,0.0685,0.01525],["필라델피아",0.6715,0.6635,0.0685,0.0165],["뉴욕",0.8155,0.54675,0.0665,0.0145],["해리스버그",0.54375,0.55875,0.069,0.015],["베들레헴",0.6555,0.519,0.0605,0.0135],["윌크스-배리",0.66975,0.388,0.066,0.0155],["이리",0.44625,0.324375,0.065,0.01525],["버팔로",0.53225,0.21375,0.066,0.014],["로체스터",0.6865,0.1555,0.0685,0.0165],["올버니",0.808125,0.19275,0.07025,0.018],["보스턴",0.8985,0.35225,0.0615,0.0145]];
 const four=[["이즈브리지",0.094583,0.59,0.058333,0.015833],["시카고",0.142917,0.422708,0.098333,0.015417],["새기노",0.238958,0.196875,0.097083,0.015417],["디트로이트",0.362083,0.256042,0.096667,0.015417],["캐나다",0.46,0.161042,0.058333,0.015417],["털리도",0.291875,0.429375,0.097083,0.015417],["인디애나폴리스",0.197708,0.653125,0.057917,0.015417],["신시내티",0.266458,0.72,0.05875,0.015833],["남부",0.50625,0.816875,0.058333,0.015417],["클락스버그",0.474583,0.749375,0.096667,0.015417],["피츠버그",0.495833,0.585625,0.108333,0.015417],["콜럼버스",0.33125,0.595208,0.095833,0.015417],["클리브랜드",0.437708,0.435625,0.09625,0.015417],["이리",0.542917,0.33875,0.096667,0.015],["버팔로",0.607708,0.236458,0.097083,0.015417],["로체스터",0.752083,0.225625,0.058333,0.015417],["윌크스-배리",0.728958,0.397292,0.097083,0.015417],["베들레헴",0.715208,0.548958,0.05875,0.015417],["해리스버그",0.617083,0.560625,0.058333,0.015417],["볼티모어",0.606458,0.751875,0.095417,0.015417],["필라델피아",0.728125,0.683125,0.09625,0.015417],["뉴욕",0.843542,0.565625,0.097917,0.015417],["올버니",0.83875,0.223958,0.058333,0.015417],["보스턴",0.911042,0.374792,0.05875,0.015417]];
 const groups=[two,four].map(rows=>Object.freeze(rows.map(([name,x,y,w,h])=>Object.freeze({name,x:x-w/2,y:y-h/2,w,h}))));
 function regionsFor(href){const file=String(href||'').split(/[?#]/)[0].split('/').pop();return file==='pittsburgh-2p-web-v27.webp'?groups[0]:file==='board-r399-v4.webp'?groups[1]:[];}
 // Centers measured on each printed board in a 1000 × 1000 coordinate space.
 // Each window exposes just the printed bonus or oil drums below the piece layers.
 const printed = {
  'pittsburgh-2p-web-v27.webp': [
   [322,214],[390,347],[445,700],[867,215],[629,179],[725,496],[165,289],[743,136],[599,500],
   [303,625],[300,704],[155,414],[423,464],[461,362,23],[599,330],[552,265]
  ],
  'pittsburgh-2p-reference.webp': [
   [324,210],[389,343],[443,700],[867,208],[624,179],[726,494],[168,290],[754,137],[598,500],
   [304,625],[296,701],[157,426],[426,455],[471,365,23],[601,320],[541,281]
  ],
  'board-r399-v4.webp': [
   [148,600],[220,280],[425,225],[213,681],[403,558],[687,185],[804,181],[667,503],[668,599],[884,254],
   [309,455],[233,528,24],[399,671],[400,617],[540,467],[551,376,24],[365,455],[615,296],[662,362]
  ]
 };
 function bonusRegions(href){
  const file=String(href||'').split(/[?#]/)[0].split('/').pop();
  return (printed[file]||[]).map(([cx,cy,width=16])=>({x:(cx-width/2)/1000,y:(cy-12)/1000,w:width/1000,h:.024}));
 }
 function markup(regions,id){return '<defs><clipPath id="'+id+'" clipPathUnits="objectBoundingBox">'+regions.map(r=>'<rect x="'+r.x+'" y="'+r.y+'" width="'+r.w+'" height="'+r.h+'"/>').join('')+'</clipPath></defs>';}
 globalThis.PittsburghScreenLabels=Object.freeze({regionsFor,markup});
 if(typeof document==='undefined'||typeof MutationObserver==='undefined')return;
 const NS='http://www.w3.org/2000/svg';let next=0,queued=false;
 function update(){queued=false;for(const art of document.querySelectorAll('image.physical-board-art')){
  const href=art.getAttribute('href'),previous=art.parentElement.querySelector(':scope > .screen-board-labels');
  if(previous?.classList.contains('screen-board-labels')&&previous.getAttribute('data-art')===href)continue;
  if(previous?.classList.contains('screen-board-labels'))previous.remove();
  const regions=[...regionsFor(href),...bonusRegions(href)];
  if(!regions.length)continue;
  const layer=document.createElementNS(NS,'g'),image=document.createElementNS(NS,'image'),id='screen-nameplates-'+(++next);
  layer.setAttribute('class','screen-board-labels');layer.setAttribute('data-art',href);layer.setAttribute('aria-hidden','true');layer.setAttribute('pointer-events','none');layer.innerHTML=markup(regions,id);
  for(const key of ['href','x','y','width','height','preserveAspectRatio','transform'])if(art.hasAttribute(key))image.setAttribute(key,art.getAttribute(key));
  image.setAttribute('class','screen-board-label-art');image.setAttribute('clip-path','url(#'+id+')');image.setAttribute('pointer-events','none');layer.append(image);art.after(layer);
 }}
 function schedule(){if(!queued){queued=true;queueMicrotask(update)}}
 function mount(){new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});update()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
