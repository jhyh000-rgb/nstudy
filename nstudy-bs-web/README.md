# NStudy-BS 웹 애플리케이션

Firebase 프로젝트 **`nstudy-bs`**와 연동된 사용자 격리형 데이터 관리 웹 애플리케이션입니다.

---

## 🚀 구현된 주요 기능

1. **Google 계정 로그인 / 로그아웃**:
   * Firebase Authentication (`GoogleAuthProvider`) 기반의 원클릭 팝업 로그인/로그아웃 지원.
   * 사용자 프로필(프로필 사진, 닉네임, 이메일) 표시.

2. **사용자별 데이터 격리 (CRUD)**:
   * **추가 (Create)**: 카테고리, 제목, 내용을 입력하여 새 항목 추가.
   * **조회 (Read)**: Firestore `onSnapshot`을 통해 실시간 동기화 및 실시간 검색 필터링.
   * **수정 (Update)**: 기존 항목의 카테고리, 제목, 내용 수정.
   * **삭제 (Delete)**: 안전한 삭제 확인 모달을 통한 데이터 삭제.

3. **데이터 저장 경로**:
   * Firestore 경로: `user/{userId}/items/{itemId}`
   * 각 사용자의 UID별로 완벽히 분리되어 저장됩니다.

4. **보안 규칙 (`firestore.rules`)**:
   * `request.auth.uid == userId` 조건을 통해 오직 본인만 자신의 `user/{userId}` 하위 데이터를 읽고 쓸 수 있도록 강제합니다.

---

## 📁 프로젝트 파일 구성

* [index.html](file:///C:/Users/Good/.gemini/antigravity/scratch/nstudy-bs-web/index.html): 메인 프론트엔드 단일 페이지 웹앱 (Firebase SDK v10 Modular 탑재)
* [firestore.rules](file:///C:/Users/Good/.gemini/antigravity/scratch/nstudy-bs-web/firestore.rules): 사용자 데이터 격리를 위한 Firestore 보안 규칙
* [firebase.json](file:///C:/Users/Good/.gemini/antigravity/scratch/nstudy-bs-web/firebase.json): Firebase Hosting 및 Firestore 규칙 배포 설정 파일
* [.firebaserc](file:///C:/Users/Good/.gemini/antigravity/scratch/nstudy-bs-web/.firebaserc): 대상 프로젝트(`nstudy-bs`) 설정

---

## ⚙️ Firebase 콘솔 1회성 필수 설정 (체크리스트)

웹앱이 정상적으로 데이터베이스 및 구글 로그인과 통신하려면 콘솔에서 아래 2가지를 활성화해 주셔야 합니다:

1. **Authentication Google 제공업체 활성화**:
   * 👉 [Authentication Sign-in method 바로가기](https://console.firebase.google.com/project/nstudy-bs/authentication/providers)
   * **Google** 선택 ➔ **사용 설정(Enable)** 스위치 켜기 ➔ 지원 이메일 선택 후 **저장**.

2. **Cloud Firestore 데이터베이스 생성**:
   * 👉 [Firestore 콘솔 바로가기](https://console.firebase.google.com/project/nstudy-bs/firestore)
   * **데이터베이스 만들기 (Create database)** 클릭 ➔ 위치 선택 ➔ 완료.
   * [규칙(Rules) 탭](https://console.firebase.google.com/project/nstudy-bs/firestore/rules)에 `firestore.rules` 내용을 복사하여 붙여넣고 **게시(Publish)**를 누르시면 완벽한 보안이 적용됩니다.

---

## 💻 실행 및 호스팅 배포 방법

### 로컬에서 실행하기:
이 프로젝트 폴더는 `C:\Users\Good\.gemini\antigravity\scratch\nstudy-bs-web`에 생성되었습니다.
1. VS Code 등의 에디터에서 해당 폴더를 열고 **Live Server**로 `index.html`을 실행하거나,
2. 터미널에서 로컬 서버 실행:
   ```bash
   npx serve .
   ```
   또는 브라우저에서 `index.html` 파일을 직접 더블 클릭하여 여실 수 있습니다.

### Firebase Hosting에 배포하기:
터미널에서 해당 디렉터리로 이동 후 배포:
```bash
firebase deploy
```
배포가 완료되면 `https://nstudy-bs.web.app` 주소를 통해 전 세계 어디서나 접속할 수 있습니다.
