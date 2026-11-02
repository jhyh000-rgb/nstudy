import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const db=createClient('https://ljjurwyhhbokrkcbfqwh.supabase.co','sb_publishable_wG_7bLxeoVA1DY35GPK0yA_GsXYGODM');
const $=id=>document.getElementById(id);
const KEY='nstudy_popup_hidden_date';
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});
function videoId(url){
  if(!url)return '';
  try{const u=new URL(url.trim());if(!['https:','http:'].includes(u.protocol))return '';
    const h=u.hostname.toLowerCase().replace(/^(www\.|m\.)/,'');const a=u.pathname.split('/').filter(Boolean);
    let id='';if(h==='youtu.be')id=a[0]||'';
    else if(['youtube.com','youtube-nocookie.com'].includes(h))id=a[0]==='watch'?(u.searchParams.get('v')||''):(['shorts','embed','live'].includes(a[0])?a[1]||'':'');
    return /^[A-Za-z0-9_-]{11}$/.test(id)?id:'';
  }catch{return ''}
}
function iframeFor(id,autoplay){
 const iframe=document.createElement('iframe');
 iframe.title='NSTUDY 추천 학습 영상';iframe.referrerPolicy='strict-origin-when-cross-origin';
 iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;
 iframe.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?autoplay='+(autoplay?'1':'0')+'&mute=1&playsinline=1&rel=0';
 return iframe;
}
function closePopup(){const popup=$('nstudyVideoPopup');popup.hidden=true;$('nstudyPopupPlayer').replaceChildren();if($('nstudyPopupToday').checked){try{localStorage.setItem(KEY,today())}catch{}}}
$('nstudyPopupClose')?.addEventListener('click',closePopup);
async function showPopup(){
 const {data,error}=await db.from('nstudy_popup_settings').select('enabled,youtube_id,title').eq('id',1).maybeSingle();
 if(error){console.warn('NSTUDY 팝업 설정 조회 실패:',error.message);return}
 if(!data?.enabled||!/^[A-Za-z0-9_-]{11}$/.test(data.youtube_id||''))return;
 try{if(localStorage.getItem(KEY)===today())return}catch{}
 $('nstudyPopupTitle').textContent=data.title||'추천 학습 동영상';
 $('nstudyPopupPlayer').replaceChildren(iframeFor(data.youtube_id,true));
 $('nstudyVideoPopup').hidden=false;
}
function message(s){$('nstudyPopupMessage').textContent=s}
async function loadAdmin(){
 const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)return;
 const {data:profile,error:profileError}=await db.from('nstudy_profiles').select('role,blocked').eq('id',user.id).maybeSingle();
 if(profileError||profile?.role!=='admin'||profile?.blocked)return;
 const box=$('nstudyPopupAdmin');if(!box)return;box.hidden=false;
 const {data:settings,error:settingsError}=await db.from('nstudy_popup_settings').select('enabled,post_id,youtube_id,title').eq('id',1).maybeSingle();
 if(settingsError){message('설정을 읽을 수 없습니다: '+settingsError.message);return}
 $('nstudyPopupEnabled').checked=!!settings?.enabled;
 const {data:posts,error:postsError}=await db.from('nstudy_posts').select('id,title,category,youtube_url').not('youtube_url','is',null).order('created_at',{ascending:false});
 if(postsError){message('영상 목록 조회 실패: '+postsError.message);return}
 const select=$('nstudyPopupSelect');select.replaceChildren(new Option('영상을 선택하세요',''));
 const valid=(posts||[]).filter(p=>videoId(p.youtube_url));
 valid.forEach(p=>select.add(new Option('['+(p.category||'기타')+'] '+(p.title||'제목 없음'),String(p.id))));
 if(settings?.post_id&&valid.some(p=>String(p.id)===String(settings.post_id)))select.value=String(settings.post_id);
 const preview=()=>{const p=valid.find(x=>String(x.id)===select.value);$('nstudyPopupPreview').replaceChildren();if(p)$('nstudyPopupPreview').appendChild(iframeFor(videoId(p.youtube_url),false))};
 select.addEventListener('change',preview);preview();
 $('nstudyPopupSave').onclick=async()=>{
  const p=valid.find(x=>String(x.id)===select.value);
  if($('nstudyPopupEnabled').checked&&!p){message('팝업을 켜려면 영상을 먼저 선택하세요.');return}
  const button=$('nstudyPopupSave');button.disabled=true;
  const payload={id:1,enabled:$('nstudyPopupEnabled').checked,post_id:p?.id||null,youtube_id:p?videoId(p.youtube_url):null,title:p?.title||'추천 학습 동영상',updated_at:new Date().toISOString()};
  const {error}=await db.from('nstudy_popup_settings').upsert(payload,{onConflict:'id'});
  button.disabled=false;
  if(error){message('저장 실패: '+error.message);return}
  message('팝업 설정을 저장했습니다. 홈페이지를 새로 열면 반영됩니다.');
 };
}
showPopup().catch(e=>console.warn('팝업 초기화 오류',e));
loadAdmin().catch(e=>console.warn('팝업 관리자 초기화 오류',e));
