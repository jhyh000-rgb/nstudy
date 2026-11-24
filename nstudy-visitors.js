import {db} from './nstudy-app.js?v=20261124-visitors';

const panel=document.getElementById('visitorStats');
let sequence=0;
function sessionToken(){
 try{
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date());
  const key='nstudy-visit-session-v1';
  let saved;
  try{saved=JSON.parse(sessionStorage.getItem(key)||'null');}catch{saved=null;}
  if(!saved||saved.day!==day||!saved.token){saved={day,token:crypto.randomUUID()};sessionStorage.setItem(key,JSON.stringify(saved));}
  return saved.token;
 }catch{return null;} // 저장소가 차단되면 집계를 늘리지 않습니다.
}
async function refreshStats(){
 const request=++sequence;
 panel.hidden=true;
 document.getElementById('visitorToday').textContent='—';
 document.getElementById('visitorTotal').textContent='—';
 const {data:{user},error}=await db.auth.getUser();
 if(request!==sequence||error||!user)return;
 const {data:profile,error:profileError}=await db.from('nstudy_profiles').select('role,blocked').eq('id',user.id).maybeSingle();
 if(request!==sequence||profileError||profile?.role!=='admin'||profile.blocked)return;
 panel.hidden=false;
 const {data,error:statsError}=await db.rpc('nstudy_admin_visit_stats');
 if(request!==sequence)return;
 const message=document.getElementById('visitorMessage');
 if(statsError||!data){message.textContent='방문 현황을 불러오지 못했습니다. 방문 집계 SQL 적용 여부를 확인해 주세요.';return;}
 const format=n=>new Intl.NumberFormat('ko-KR').format(n);
 document.getElementById('visitorToday').textContent=format(data.today);
 document.getElementById('visitorTotal').textContent=format(data.total);
 message.textContent='설치 이후 집계 · 같은 브라우저 탭의 하루 방문은 1회로 집계합니다.';
}
if(panel){
 const token=sessionToken();
 const record=token?db.rpc('nstudy_record_visit',{p_token:token}):Promise.resolve({});
 Promise.resolve(record).catch(()=>{}).finally(refreshStats);
 db.auth.onAuthStateChange(()=>{setTimeout(refreshStats,0);});
}
