import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const db=createClient('https://ljjurwyhhbokrkcbfqwh.supabase.co','sb_publishable_wG_7bLxeoVA1DY35GPK0yA_GsXYGODM');
const CERTIFICATE_SUBJECTS={"기능사 · 전기·전자": ["전기기능사", "전자기기기능사", "승강기기능사", "공조냉동기계기능사", "전자캐드기능사", "전자계산기기능사", "전자부품장착기능사", "전기철도기능사"], "기능사 · 기계·자동차": ["컴퓨터응용선반기능사", "컴퓨터응용밀링기능사", "설비보전기능사", "자동차정비기능사", "전산응용기계제도기능사", "기계가공조립기능사", "자동차차체수리기능사", "자동차보수도장기능사"], "기능사 · IT·정보통신": ["정보처리기능사", "정보기기운용기능사", "통신선로기능사", "컴퓨터그래픽스운용기능사", "전자출판기능사", "웹디자인개발기능사", "통신기기기능사", "무선설비기능사"], "기능사 · 화학·환경": ["위험물기능사", "가스기능사", "환경기능사", "화학분석기능사", "에너지관리기능사", "신재생에너지발전설비기능사(태양광)", "종자기능사", "유기농업기능사"], "기능사 · 조리·제과": ["한식조리기능사", "양식조리기능사", "제빵기능사", "제과기능사", "중식조리기능사", "일식조리기능사", "복어조리기능사", "떡제조기능사"]};
const certificateCategory=c=>Object.prototype.hasOwnProperty.call(CERTIFICATE_SUBJECTS,c);
const $=id=>document.getElementById(id);let user=null,profile=null,posts=[],category='TOEIC',subcategory='',page=1;
const admin=()=>profile?.role==='admin'&&!profile.blocked;
const access=()=>admin()||!!profile?.admin_access&&!profile?.blocked;
const say=s=>{let t=$('toast');if(!t){alert(s);return}t.textContent=s;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),4000)};
// 스마트폰·태블릿은 PDF.js 화면을 사용하고 PC는 기존 PDF 방식 유지
const isMobilePdfDevice=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
const pdfViewerUrl=signedUrl=>{
 const viewer=new URL('./pdf-viewer.html',location.href);
 viewer.hash=encodeURIComponent(signedUrl);
 return viewer.href;
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function refreshAuth(){const {data:{user:u}}=await db.auth.getUser();user=u;profile=null;if(user){const {data,error}=await db.from('nstudy_profiles').select('*').eq('id',user.id).maybeSingle();if(error)console.error(error);profile=data;if(profile?.blocked){await db.auth.signOut();user=null;profile=null;say('로그인이 제한된 계정입니다.')}}renderHeader();if($('postList'))await refreshPosts();if($('admin-page')&&!$('admin-page').classList.contains('hidden'))await renderMembers()}
function renderHeader(){if($('userStatus'))$('userStatus').textContent=profile?.username||'';const a=$('openAccount');if(a){a.textContent=user?'로그아웃':'로그인';a.href=user?'#logout':'./001-login.html?return='+encodeURIComponent(location.pathname.split('/').pop()||'index.html');a.onclick=user?async e=>{e.preventDefault();await db.auth.signOut();await refreshAuth()}:null}if($('editorActions'))$('editorActions').classList.toggle('hidden',!admin())}
const noticeFirst=(a,b)=>Number(!!b.is_notice)-Number(!!a.is_notice)||new Date(b.created_at)-new Date(a.created_at)||String(a.id).localeCompare(String(b.id));
async function refreshPosts(){let query=user?db.from('nstudy_posts').select('*'):db.from('nstudy_public_post_previews').select('*');let {data,error}=await query.order('created_at',{ascending:false});if(error){say('게시글 조회 실패: '+error.message);return}posts=(data||[]).sort(noticeFirst);renderPosts()}
async function toggleNotice(p,checked,cb){
 if(!admin())return;
 const count=posts.filter(x=>x.category===p.category&&x.is_notice&&x.id!==p.id).length;
 if(checked&&count>=2){cb.checked=false;return say('이 과목에는 공지글을 최대 2개까지 설정할 수 있습니다.')}
 cb.disabled=true;
 const {error}=await db.from('nstudy_posts').update({is_notice:checked}).eq('id',p.id);
 if(error){cb.checked=!checked;say('공지 설정 실패: '+error.message)}else{await refreshPosts();say(checked?'공지로 설정되었습니다.':'공지 설정이 해제되었습니다.')}
 cb.disabled=false;
}
function renderPosts(){
 const cards=document.querySelectorAll('.category-card');
 cards.forEach(c=>{c.classList.toggle('active',c.dataset.category===category);const n=posts.filter(p=>p.category===c.dataset.category).length;let badge=c.querySelector('.category-count');if(!badge){badge=document.createElement('span');badge.className='category-count';c.appendChild(badge)}badge.textContent=String(n).padStart(2,'0')+'개'});
 if($('categoryTitle'))$('categoryTitle').textContent=category+' 학습 자료';
 const panel=$('subcategoryPanel'),grid=$('subcategoryGrid');
 if(panel&&grid){
   grid.replaceChildren();
   const storedSkills=posts.filter(p=>p.category===category).map(p=>p.subcategory).filter(Boolean);
   const skills=certificateCategory(category)?[...new Set([...CERTIFICATE_SUBJECTS[category],...storedSkills])]:[...new Set(storedSkills)];
   panel.classList.toggle('hidden',!skills.length);
   if($('subcategoryHeading'))$('subcategoryHeading').textContent=certificateCategory(category)?'기능사 자격증별 게시글':'세부 능력별 게시글';
   skills.forEach(skill=>{
     const b=document.createElement('button');b.type='button';b.className='subcategory-btn'+(skill===subcategory?' active':'');
     const label=document.createElement('span');label.textContent=skill;
     const badge=document.createElement('span');badge.className='subcategory-count';badge.textContent=String(posts.filter(p=>p.category===category&&p.subcategory===skill).length).padStart(2,'0')+'개';
     b.append(label,badge);b.onclick=()=>{subcategory=subcategory===skill?'':skill;page=1;renderPosts()};grid.appendChild(b);
   });
 }
 const list=$('postList');if(!list)return;list.innerHTML='';
 const items=posts.filter(p=>p.category===category&&(!subcategory||p.subcategory===subcategory)).sort(noticeFirst);
 items.slice((page-1)*10,page*10).forEach((p,i)=>{
  const row=document.createElement('div');row.className='post-row';row.style.cssText='display:flex;align-items:center;gap:10px';
  const view=document.createElement('button');view.type='button';view.style.cssText='flex:1;min-width:0;text-align:left;background:transparent;border:0;color:inherit;cursor:pointer';
  const title=document.createElement('span');title.style.cssText='display:block;font-weight:700';
  if(p.is_notice){const tag=document.createElement('span');tag.textContent='[공지] ';tag.style.cssText='color:#b45309;font-weight:800';title.appendChild(tag)}
  title.appendChild(document.createTextNode(p.title||''));
  const desc=document.createElement('small');desc.style.cssText='display:block;color:#687487';desc.textContent=(p.post_date||'')+' · '+(p.body||'').slice(0,55);
  view.append(title,desc);view.onclick=()=>openPost(p);row.appendChild(view);
  if(admin()){
   const label=document.createElement('label');label.style.cssText='display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-size:13px;cursor:pointer';
   const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!p.is_notice;cb.setAttribute('aria-label',p.title+' 공지 설정');cb.onchange=()=>toggleNotice(p,cb.checked,cb);
   label.append(cb,document.createTextNode('공지'));row.appendChild(label);
  }
  list.appendChild(row);
 });
 if(!items.length)list.innerHTML='<p class="small-note">등록된 게시글이 없습니다.</p>';
 if(items.length>10){const nav=document.createElement('div');nav.className='form-actions';nav.style.marginTop='16px';for(let n=1;n<=Math.ceil(items.length/10);n++){const b=document.createElement('button');b.className='btn '+(n===page?'btn-primary':'btn-secondary');b.textContent=n;b.onclick=()=>{page=n;renderPosts()};nav.appendChild(b)}list.appendChild(nav)}
 if($('postView'))$('postView').classList.add('hidden');
}
// YouTube 주소는 영상 ID만 추출하여 안전한 embed 주소로 변환합니다.
function youtubeVideoId(value){
 if(!value)return '';
 try{
  const u=new URL(value.trim());
  if(u.protocol!=='https:'&&u.protocol!=='http:')return '';
  const host=u.hostname.toLowerCase().replace(/^(www\.|m\.)/,'');
  const parts=u.pathname.split('/').filter(Boolean);
  let id='';
  if(host==='youtu.be')id=parts[0]||'';
  else if(host==='youtube.com'||host==='youtube-nocookie.com'){
   if(parts[0]==='watch')id=u.searchParams.get('v')||'';
   else if(['shorts','embed','live'].includes(parts[0]))id=parts[1]||'';
  }
  return /^[A-Za-z0-9_-]{11}$/.test(id)?id:'';
 }catch{return ''}
}
async function openPost(p){
 const v=$('postView');if(!v)return;
 v.replaceChildren();
 const heading=document.createElement('h3');heading.textContent=p.title||'';v.appendChild(heading);
 const info=document.createElement('p');info.className='small-note';info.textContent=[p.category,p.post_date].filter(Boolean).join(' · ');v.appendChild(info);
 const body=document.createElement('div');body.className='post-body';body.textContent=p.body||'';v.appendChild(body);
 const media=document.createElement('div');media.className='post-media';v.appendChild(media);
 for(const kind of ['image','pdf']){
  const path=p[kind+'_path'];if(!path)continue;
  const name=p[kind+'_name']||(kind==='pdf'?'학습자료.pdf':'첨부 이미지');
  const label=document.createElement('strong');label.textContent=(kind==='pdf'?'PDF: ':'이미지: ')+name;media.appendChild(label);
  let url;try{url=await attachmentUrl(path)}catch(error){
   const warning=document.createElement('p');warning.className='small-note';warning.textContent='첨부파일을 열 수 없습니다: '+error.message;media.appendChild(warning);console.error(error);continue;
  }
  if(kind==='image'){
   const img=document.createElement('img');img.src=url;img.alt=name;img.loading='lazy';img.style.cssText='max-width:100%;height:auto;object-fit:contain';
   img.onerror=()=>{const warning=document.createElement('p');warning.textContent='이미지를 표시할 수 없습니다. 아래 원본 보기 버튼을 이용해 주세요.';img.replaceWith(warning)};
   media.appendChild(img);
  }else{
   const frame=document.createElement('iframe');
   frame.src=isMobilePdfDevice()?pdfViewerUrl(url):url+'#toolbar=1&view=FitH';
   frame.title='PDF 미리보기: '+name;frame.loading='lazy';
   frame.style.cssText='display:block;width:100%;height:70vh;min-height:380px;border:1px solid #dce4ef;border-radius:8px;background:#f8fafc';
   media.appendChild(frame);
   if(isMobilePdfDevice()){
    const tip=document.createElement('p');tip.className='small-note';tip.textContent='화면이 작으면 아래 PDF 전체 화면 보기 버튼으로 크게 볼 수 있습니다.';media.appendChild(tip);
   }
  }
  const actions=document.createElement('div');actions.className='form-actions';actions.style.margin='8px 0 16px';
  const open=document.createElement('a');open.className='btn btn-secondary';open.href=(kind==='pdf'&&isMobilePdfDevice())?pdfViewerUrl(url):url;open.target='_blank';open.rel='noopener noreferrer';open.textContent=kind==='pdf'?'PDF 전체 화면 보기':'이미지 원본 보기';actions.appendChild(open);
  const dl=document.createElement('button');dl.type='button';dl.className='btn btn-secondary';dl.textContent='다운로드';dl.onclick=async()=>{
   let downloadUrl;try{downloadUrl=await attachmentUrl(path,name)}catch(error){say('다운로드 실패: '+error.message);return}
   const link=document.createElement('a');link.href=downloadUrl;link.download=name;document.body.appendChild(link);link.click();link.remove();
  };actions.appendChild(dl);media.appendChild(actions);
 }
 // PDF·이미지와 함께 YouTube 영상을 게시글 안에 표시합니다.
 if(p.youtube_url){
  const id=youtubeVideoId(p.youtube_url);
  if(id){
   const label=document.createElement('strong');label.textContent='유튜브 동영상';media.appendChild(label);
   const wrap=document.createElement('div');wrap.className='youtube-embed';
   const iframe=document.createElement('iframe');iframe.src='https://www.youtube-nocookie.com/embed/'+id;
   iframe.title='유튜브 동영상';iframe.loading='lazy';iframe.referrerPolicy='strict-origin-when-cross-origin';
   iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
   iframe.allowFullscreen=true;wrap.appendChild(iframe);media.appendChild(wrap);
   const link=document.createElement('a');link.href='https://www.youtube.com/watch?v='+id;
   link.target='_blank';link.rel='noopener noreferrer';link.textContent='유튜브에서 직접 보기';media.appendChild(link);
  }
 }
 const div=document.createElement('div');div.className='post-actions';
 const pr=document.createElement('button');pr.className='btn btn-primary';pr.textContent='인쇄';pr.onclick=async()=>{
  if(!p.pdf_path){alert('첨부된 PDF 문서가 없습니다.');return;}
  const pdfWindow=window.open('','_blank');
  if(!pdfWindow){alert('팝업 차단을 해제해 주세요.');return;}
  let pdfUrl;try{pdfUrl=await attachmentUrl(p.pdf_path)}catch(error){pdfWindow.close();alert('PDF 문서를 열 수 없습니다: '+error.message);return;}
  if(isMobilePdfDevice()){
    pdfWindow.location.replace(pdfViewerUrl(pdfUrl));
  }else{
    pdfWindow.location.replace(pdfUrl);
  }
};
 const back=document.createElement('button');back.className='btn btn-secondary';back.textContent='목록으로';back.onclick=()=>v.classList.add('hidden');div.append(pr,back);
 if(admin()){
  const edit=document.createElement('button');edit.className='btn btn-secondary';edit.textContent='수정';edit.onclick=async()=>{const title=prompt('수정할 제목',p.title);if(title===null)return;const body=prompt('수정할 본문',p.body);if(body===null)return;const yt=prompt('유튜브 주소 (없으면 빈칸)',p.youtube_url||'');if(yt===null)return;if(yt.trim()&&!youtubeVideoId(yt))return say('올바른 유튜브 주소를 입력해 주세요.');const{error}=await db.from('nstudy_posts').update({title:title.trim(),body:body.trim(),youtube_url:yt.trim()||null}).eq('id',p.id);if(error)return say('수정 실패: '+error.message);await refreshPosts();say('게시글이 수정되었습니다.')};
  const del=document.createElement('button');del.className='btn btn-secondary';del.textContent='삭제';del.onclick=async()=>{if(!confirm('이 게시글을 삭제하시겠습니까? 첨부파일은 별도로 남을 수 있습니다.'))return;const{error}=await db.from('nstudy_posts').delete().eq('id',p.id);if(error)return say('삭제 실패: '+error.message);await refreshPosts();say('게시글이 삭제되었습니다.')};div.append(edit,del);
 }
 v.appendChild(div);v.classList.remove('hidden');v.scrollIntoView({block:'start',behavior:'smooth'});
}
const R2_WORKER='https://nstudy-r2.jhyh000.workers.dev';
async function attachmentUrl(path,downloadName=''){
 if(!path)return '';
 if(!path.startsWith('r2:')){
  const {data,error}=await db.storage.from('nstudy-attachments').createSignedUrl(path,3600,downloadName?{download:downloadName}:undefined);
  if(error||!data?.signedUrl)throw Error(error?.message||'Supabase 첨부파일 주소 생성 실패');
  return data.signedUrl;
 }
 const {data:{session}}=await db.auth.getSession();
 if(!session?.access_token)throw Error('R2 첨부파일을 열려면 로그인이 필요합니다.');
 const response=await fetch(R2_WORKER+'/sign',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({path:path.slice(3),download:!!downloadName})});
 const result=await response.json();
 if(!response.ok||!result.url)throw Error(result.error||'R2 첨부파일 주소 생성 실패');
 return result.url;
}
async function upload(file){
 if(!file)return {path:'',name:''};
 if(!['application/pdf','image/png','image/jpeg','image/webp'].includes(file.type))throw Error('PDF, JPG, PNG, WEBP 파일만 가능합니다.');
 if(file.size>10*1024*1024)throw Error('첨부파일은 10MB 이하만 가능합니다.');
 const {data:{session}}=await db.auth.getSession();
 if(!session?.access_token)throw Error('로그인이 필요합니다.');
 const response=await fetch(R2_WORKER+'/upload',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name)},body:file});
 let result;try{result=await response.json()}catch{throw Error('R2 서버 응답을 확인할 수 없습니다.');}
 if(!response.ok||!result.path)throw Error(result.error||'R2 업로드 실패');
 return {path:'r2:'+result.path,name:file.name};
}
function initBank(){if(location.hash==='#certificate-bank'){category='기능사 · 전기·전자';subcategory='';}document.querySelectorAll('.category-card').forEach(c=>{
  c.setAttribute('aria-expanded','false');
  c.setAttribute('aria-controls','bankResults');
  c.addEventListener('click',()=>{
    const results=$('bankResults');
    const same=category===c.dataset.category && results && !results.classList.contains('hidden');
    if(same){
      results.classList.add('hidden');
      c.setAttribute('aria-expanded','false');
      $('editor')?.classList.add('hidden');
      return;
    }
    category=c.dataset.category;
    const section=c.closest('[data-bank-section]')?.dataset.bankSection || 'career';
    const resultsTitle={
      ncs:'NCS 직업기초능력 문제은행',
      career:'취업 실전 준비 문제은행',
      certificate:'기능사 자격시험 문제은행'
    };
    if(results){
      results.classList.remove('bank-results-ncs','bank-results-career','bank-results-certificate');
      results.classList.add('bank-results-'+section);
      const heading=$('bankResultsHeading');
      if(heading)heading.textContent=resultsTitle[section]||'문제은행';
    }
    subcategory='';
    page=1;
    document.querySelectorAll('.category-card').forEach(card=>card.setAttribute('aria-expanded','false'));
    const group=c.closest('.category-group');
    if(results&&group){
      group.appendChild(results);
      results.classList.remove('hidden');
      c.setAttribute('aria-expanded','true');
    }
    $('editor')?.classList.add('hidden');
    renderPosts();
  });
});$('showEditor')?.addEventListener('click',()=>{if(!admin())return say('관리자만 작성할 수 있습니다.');$('editor').classList.remove('hidden');$('postCategory').value=category;updateSkills()});$('cancelPost')?.addEventListener('click',()=>$('editor').classList.add('hidden'));$('postCategory')?.addEventListener('change',updateSkills);$('postForm')?.addEventListener('submit',async e=>{e.preventDefault();if(!admin())return say('관리자만 작성할 수 있습니다.');try{const youtubeUrl=$('postYoutube')?.value.trim()||'';if(youtubeUrl&&!youtubeVideoId(youtubeUrl))throw Error('올바른 유튜브 주소를 입력해 주세요.');const pdf=await upload($('postPdf').files[0]);const image=await upload($('postImage').files[0]);const row={category:$('postCategory').value,subcategory:$('postSubcategory').value,title:$('postTitle').value.trim(),body:$('postBody').value.trim(),author_id:user.id,author_username:profile.username,image_path:image.path,image_name:image.name,pdf_path:pdf.path,pdf_name:pdf.name,youtube_url:youtubeUrl||null};const {error}=await db.from('nstudy_posts').insert(row);if(error)throw error;category=row.category;subcategory=row.subcategory;page=1;e.target.reset();$('editor').classList.add('hidden');await refreshPosts();say('게시글이 서버에 저장되었습니다.')}catch(err){say('저장 실패: '+err.message)}});updateSkills();
 if(location.hash==='#certificate-bank'){
   document.querySelector('.certificate-category')?.click();
 }
}
function updateSkills(){
 const c=$('postCategory')?.value,sel=$('postSubcategory');if(!sel)return;
 const previous=sel.value;
 const stored=posts.filter(p=>p.category===c).map(p=>p.subcategory).filter(Boolean);
 const skills=certificateCategory(c)?[...new Set([...CERTIFICATE_SUBJECTS[c],...stored])]:[...new Set(stored)];
 sel.replaceChildren(new Option(certificateCategory(c)?'기능사 자격증 선택':'세부 능력 선택',''));
 skills.forEach(name=>sel.add(new Option(name,name)));
 if(skills.includes(previous))sel.value=previous;
 sel.required=certificateCategory(c);
}
async function renderMembers(){
  const root=$('adminMembers');
  if(!root)return;
  if(!access()){root.textContent='관리 권한이 없습니다.';return;}
  const {data,error}=await db.from('nstudy_profiles').select('id,username,member_type,full_name,school,grade,phone,contact_email,role,admin_access,blocked').order('username');
  if(error){root.textContent=error.message;return;}
  root.innerHTML='';
  const wrap=document.createElement('div');wrap.className='admin-table-wrap';
  const table=document.createElement('table');table.className='admin-table';
  table.innerHTML='<thead><tr><th>아이디</th><th>성명</th><th>회원 유형</th><th>학교</th><th>이메일</th><th>관리 접근</th><th>차단</th><th>비밀번호 관리</th><th>회원 삭제</th></tr></thead>';
  const body=document.createElement('tbody');
  for(const p of data||[]){
    const tr=document.createElement('tr');
    for(const k of ['username','full_name','member_type','school','contact_email']){
      const td=document.createElement('td');td.textContent=p[k]||'';tr.appendChild(td);
    }
    for(const k of ['admin_access','blocked']){
      const td=document.createElement('td'),cb=document.createElement('input');
      cb.type='checkbox';cb.checked=!!p[k];cb.disabled=!admin()||p.id===user.id;
      cb.onchange=async()=>{
        const {error}=await db.from('nstudy_profiles').update({[k]:cb.checked}).eq('id',p.id);
        if(error){cb.checked=!cb.checked;say(error.message);}
        else say('권한 정보가 저장되었습니다.');
      };
      td.appendChild(cb);tr.appendChild(td);
    }
    const protectedAccount=p.id===user.id||p.role==='admin';
    const pwdTd=document.createElement('td'),pwd=document.createElement('button');
    pwd.type='button';pwd.textContent='새 비밀번호 설정';pwd.disabled=!admin()||protectedAccount;
    pwd.onclick=async()=>{
      const newPassword=prompt(`${p.username} 회원의 새 비밀번호를 입력하세요. (8~72자)\n기존 비밀번호는 조회할 수 없습니다.`);
      if(newPassword===null)return;
      if(newPassword.length<8||newPassword.length>72){alert('비밀번호는 8~72자로 입력해 주세요.');return;}
      if(!confirm(`${p.username} 회원의 비밀번호를 변경하시겠습니까?`))return;
      pwd.disabled=true;
      try{
        const {data,error}=await db.functions.invoke('nstudy-admin-members',{body:{action:'set_password',userId:p.id,newPassword}});
        if(error)throw error;
        if(data?.error)throw new Error(data.error);
        alert('새 비밀번호가 설정되었습니다.');
      }catch(e){alert('비밀번호 변경 실패: '+(e.message||String(e)));}
      finally{pwd.disabled=false;}
    };
    pwdTd.appendChild(pwd);tr.appendChild(pwdTd);
    const deleteTd=document.createElement('td'),del=document.createElement('button');
    del.type='button';del.textContent='삭제';del.disabled=!admin()||protectedAccount;
    del.style.background='#b42318';del.style.color='#fff';
    del.onclick=async()=>{
      if(!confirm(`${p.username} 회원을 삭제하시겠습니까?\n삭제된 회원은 다시 로그인할 수 없습니다.\n기존 게시글은 유지됩니다.`))return;
      const check=prompt(`삭제를 확정하려면 회원 아이디 "${p.username}"를 정확히 입력하세요.`);
      if(check!==p.username){if(check!==null)alert('아이디가 일치하지 않아 삭제하지 않았습니다.');return;}
      del.disabled=true;
      try{
        const {data,error}=await db.functions.invoke('nstudy-admin-members',{body:{action:'delete',userId:p.id}});
        if(error)throw error;
        if(data?.error)throw new Error(data.error);
        alert('회원 계정이 삭제되었습니다.');
        await renderMembers();
      }catch(e){alert('회원 삭제 실패: '+(e.message||String(e)));del.disabled=false;}
    };
    deleteTd.appendChild(del);tr.appendChild(deleteTd);body.appendChild(tr);
  }
  table.appendChild(body);wrap.appendChild(table);root.appendChild(wrap);
  if($('adminIntro'))$('adminIntro').textContent='기존 비밀번호는 확인할 수 없습니다. 일반 회원의 새 비밀번호 설정 및 삭제는 관리자만 사용할 수 있습니다. 관리자 계정은 보호됩니다.';
}
function initAdmin(){const a=$('adminPageLink');if(a)a.onclick=async e=>{e.preventDefault();if(!access())return say('관리 페이지 접근 권한이 없습니다.');$('admin-page').classList.remove('hidden');await renderMembers();$('admin-page').scrollIntoView({behavior:'smooth'})}}
async function init(){initAdmin();if($('postList'))initBank();await refreshAuth();if(location.hash==='#certificate-bank')setTimeout(()=>document.getElementById('certificate-bank')?.scrollIntoView({block:'start'}),120);db.auth.onAuthStateChange(()=>{setTimeout(refreshAuth,0)})}init();
