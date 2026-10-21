import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const db=createClient('https://ljjurwyhhbokrkcbfqwh.supabase.co','sb_publishable_wG_7bLxeoVA1DY35GPK0yA_GsXYGODM');
const $=id=>document.getElementById(id);let user=null,profile=null,posts=[],category='TOEIC',subcategory='',page=1;
const admin=()=>profile?.role==='admin'&&!profile.blocked;
const access=()=>admin()||!!profile?.admin_access&&!profile?.blocked;
const say=s=>{let t=$('toast');if(!t){alert(s);return}t.textContent=s;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),4000)};
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
 if(panel&&grid){grid.innerHTML='';const skills=[...new Set(posts.filter(p=>p.category===category).map(p=>p.subcategory).filter(Boolean))];panel.classList.toggle('hidden',!skills.length);skills.forEach(skill=>{const b=document.createElement('button');b.className='subcategory-btn'+(skill===subcategory?' active':'');b.textContent=skill+' · '+String(posts.filter(p=>p.category===category&&p.subcategory===skill).length).padStart(2,'0')+'개';b.onclick=()=>{subcategory=subcategory===skill?'':skill;page=1;renderPosts()};grid.appendChild(b)})}
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
  const {data,error}=await db.storage.from('nstudy-attachments').createSignedUrl(path,3600);
  if(error||!data?.signedUrl){
   const warning=document.createElement('p');warning.className='small-note';warning.textContent='첨부파일을 열 수 없습니다. Supabase Storage의 열람 권한을 확인해 주세요.';media.appendChild(warning);
   console.error('첨부파일 주소 생성 실패',kind,error);continue;
  }
  const url=data.signedUrl;
  if(kind==='image'){
   const img=document.createElement('img');img.src=url;img.alt=name;img.loading='lazy';img.style.cssText='max-width:100%;height:auto;object-fit:contain';
   img.onerror=()=>{const warning=document.createElement('p');warning.textContent='이미지를 표시할 수 없습니다. 아래 원본 보기 버튼을 이용해 주세요.';img.replaceWith(warning)};
   media.appendChild(img);
  }else{
   const frame=document.createElement('iframe');frame.src=url+'#toolbar=1&view=FitH';frame.title='PDF 미리보기: '+name;frame.loading='lazy';frame.style.cssText='display:block;width:100%;height:70vh;min-height:380px;border:1px solid #dce4ef;border-radius:8px;background:#f8fafc';media.appendChild(frame);
   const tip=document.createElement('p');tip.className='small-note';tip.textContent='스마트폰에서 미리보기가 표시되지 않으면 아래 PDF 전체 화면 보기 버튼을 누르세요.';media.appendChild(tip);
  }
  const actions=document.createElement('div');actions.className='form-actions';actions.style.margin='8px 0 16px';
  const open=document.createElement('a');open.className='btn btn-secondary';open.href=url;open.target='_blank';open.rel='noopener noreferrer';open.textContent=kind==='pdf'?'PDF 전체 화면 보기':'이미지 원본 보기';actions.appendChild(open);
  const dl=document.createElement('button');dl.type='button';dl.className='btn btn-secondary';dl.textContent='다운로드';dl.onclick=async()=>{
   const {data:downloadData,error:downloadError}=await db.storage.from('nstudy-attachments').createSignedUrl(path,3600,{download:name});
   if(downloadError||!downloadData?.signedUrl){say('다운로드 주소 생성에 실패했습니다.');return}
   const link=document.createElement('a');link.href=downloadData.signedUrl;link.download=name;document.body.appendChild(link);link.click();link.remove();
  };actions.appendChild(dl);media.appendChild(actions);
 }
 const div=document.createElement('div');div.className='post-actions';
 const pr=document.createElement('button');pr.className='btn btn-primary';pr.textContent='인쇄';pr.onclick=async()=>{
  if(!p.pdf_path){
    alert('첨부된 PDF 문서가 없습니다.');
    return;
  }

  const pdfWindow=window.open('','_blank');

  if(!pdfWindow){
    alert('팝업 차단을 해제해 주세요.');
    return;
  }

  const {data,error}=await db.storage
    .from('nstudy-attachments')
    .createSignedUrl(p.pdf_path,3600);

  if(error||!data?.signedUrl){
    pdfWindow.close();
    alert('PDF 문서를 열 수 없습니다.');
    return;
  }

  const pdfUrl = data.signedUrl;

pdfWindow.document.open();
pdfWindow.document.write(`
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PDF 문서 보기</title>
  <style>
    body { margin: 0; background: #525659; }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: #142b4d;
      color: white;
      font-family: sans-serif;
    }
    #pdfViewer { width: 100%; height: calc(100dvh - 55px); border: 0; }
    button { padding: 8px 14px; cursor: pointer; }
  </style>
</head>
<body>
  <header>
    <strong>NSTUDY PDF 보기</strong>
    <button onclick="document.getElementById('pdfViewer').contentWindow.print()">인쇄</button>
  </header>
  <iframe id="pdfViewer" src="${pdfUrl}"></iframe>
</body>
</html>
`);
pdfWindow.document.close();
};
 const back=document.createElement('button');back.className='btn btn-secondary';back.textContent='목록으로';back.onclick=()=>v.classList.add('hidden');div.append(pr,back);
 if(admin()){
  const edit=document.createElement('button');edit.className='btn btn-secondary';edit.textContent='수정';edit.onclick=async()=>{const title=prompt('수정할 제목',p.title);if(title===null)return;const body=prompt('수정할 본문',p.body);if(body===null)return;const{error}=await db.from('nstudy_posts').update({title:title.trim(),body:body.trim()}).eq('id',p.id);if(error)return say('수정 실패: '+error.message);await refreshPosts();say('게시글이 수정되었습니다.')};
  const del=document.createElement('button');del.className='btn btn-secondary';del.textContent='삭제';del.onclick=async()=>{if(!confirm('이 게시글을 삭제하시겠습니까? 첨부파일은 별도로 남을 수 있습니다.'))return;const{error}=await db.from('nstudy_posts').delete().eq('id',p.id);if(error)return say('삭제 실패: '+error.message);await refreshPosts();say('게시글이 삭제되었습니다.')};div.append(edit,del);
 }
 v.appendChild(div);v.classList.remove('hidden');v.scrollIntoView({block:'start',behavior:'smooth'});
}
async function upload(file){if(!file)return {path:'',name:''};if(!['application/pdf','image/png','image/jpeg','image/webp'].includes(file.type))throw Error('PDF, JPG, PNG, WEBP 파일만 가능합니다.');if(file.size>10*1024*1024)throw Error('첨부파일은 10MB 이하만 가능합니다.');const path=user.id+'/'+crypto.randomUUID()+'/'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const {error}=await db.storage.from('nstudy-attachments').upload(path,file,{upsert:false});if(error)throw error;return {path,name:file.name}}
function initBank(){document.querySelectorAll('.category-card').forEach(c=>c.addEventListener('click',()=>{category=c.dataset.category;subcategory='';page=1;renderPosts()}));$('showEditor')?.addEventListener('click',()=>{if(!admin())return say('관리자만 작성할 수 있습니다.');$('editor').classList.remove('hidden');$('postCategory').value=category;updateSkills()});$('cancelPost')?.addEventListener('click',()=>$('editor').classList.add('hidden'));$('postCategory')?.addEventListener('change',updateSkills);$('postForm')?.addEventListener('submit',async e=>{e.preventDefault();if(!admin())return say('관리자만 작성할 수 있습니다.');try{const pdf=await upload($('postPdf').files[0]);const image=await upload($('postImage').files[0]);const row={category:$('postCategory').value,subcategory:$('postSubcategory').value,title:$('postTitle').value.trim(),body:$('postBody').value.trim(),author_id:user.id,author_username:profile.username,image_path:image.path,image_name:image.name,pdf_path:pdf.path,pdf_name:pdf.name};const {error}=await db.from('nstudy_posts').insert(row);if(error)throw error;category=row.category;subcategory=row.subcategory;page=1;e.target.reset();$('editor').classList.add('hidden');await refreshPosts();say('게시글이 서버에 저장되었습니다.')}catch(err){say('저장 실패: '+err.message)}});updateSkills()}
function updateSkills(){const c=$('postCategory')?.value,sel=$('postSubcategory');if(!sel)return;const skills=[...new Set(posts.filter(p=>p.category===c).map(p=>p.subcategory).filter(Boolean))];sel.innerHTML='<option value="">세부 능력 선택</option>'+skills.map(x=>'<option>'+esc(x)+'</option>').join('')}
async function renderMembers(){const root=$('adminMembers');if(!root)return;if(!access()){root.textContent='관리 권한이 없습니다.';return}const {data,error}=await db.from('nstudy_profiles').select('id,username,member_type,full_name,school,grade,phone,contact_email,role,admin_access,blocked').order('username');if(error){root.textContent=error.message;return}root.innerHTML='';const wrap=document.createElement('div');wrap.className='admin-table-wrap';const table=document.createElement('table');table.className='admin-table';table.innerHTML='<thead><tr><th>아이디</th><th>성명</th><th>회원 유형</th><th>학교</th><th>이메일</th><th>관리 접근</th><th>차단</th></tr></thead>';const body=document.createElement('tbody');for(const p of data||[]){const tr=document.createElement('tr');for(const k of ['username','full_name','member_type','school','contact_email']){const td=document.createElement('td');td.textContent=p[k]||'';tr.appendChild(td)}for(const k of ['admin_access','blocked']){const td=document.createElement('td'),cb=document.createElement('input');cb.type='checkbox';cb.checked=!!p[k];cb.disabled=!admin()||p.id===user.id;cb.onchange=async()=>{const {error}=await db.from('nstudy_profiles').update({[k]:cb.checked}).eq('id',p.id);if(error){cb.checked=!cb.checked;say(error.message)}else say('권한 정보가 저장되었습니다.')};td.appendChild(cb);tr.appendChild(td)}body.appendChild(tr)}table.appendChild(body);wrap.appendChild(table);root.appendChild(wrap);if($('adminIntro'))$('adminIntro').textContent='보안상 회원 비밀번호는 표시하지 않습니다. 계정 삭제는 별도 관리자 서버 기능이 필요합니다.'}
function initAdmin(){const a=$('adminPageLink');if(a)a.onclick=async e=>{e.preventDefault();if(!access())return say('관리 페이지 접근 권한이 없습니다.');$('admin-page').classList.remove('hidden');await renderMembers();$('admin-page').scrollIntoView({behavior:'smooth'})}}
async function init(){initAdmin();if($('postList'))initBank();await refreshAuth();db.auth.onAuthStateChange(()=>{setTimeout(refreshAuth,0)})}init();
