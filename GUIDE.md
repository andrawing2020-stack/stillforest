# 🌲 Still Forest 배포 가이드 (간단 버전)

2단계만 따라하면 끝! 약 15~20분이면 돼요.

---

## 준비물
- GitHub 계정 (없으면 아래에서 만들어요)
- 그게 끝이에요!

---

## STEP 1. GitHub에 코드 올리기 (10분)

### 1-1. GitHub 가입
1. https://github.com 접속
2. [Sign up] → 이메일, 비밀번호 입력 → 가입

### 1-2. 새 저장소 만들기
1. 로그인 → 우측 상단 [+] → [New repository]
2. 이름: `still-forest`
3. Public 선택
4. [Create repository] 클릭

### 1-3. 파일 올리기
방법 A (쉬운 방법): 드래그 앤 드롭
1. 저장소 페이지에서 "uploading an existing file" 클릭
2. 다운받은 still-forest 폴더 안의 파일들을 드래그
3. [Commit changes] 클릭

방법 B (파일이 안 올라갈 때): 하나씩 만들기
1. 저장소에서 [Add file] → [Create new file]
2. 파일 이름에 `src/main.jsx` 처럼 경로 포함해서 입력
3. 내용 붙여넣기 → [Commit new file]
4. 나머지 파일도 같은 방법으로

올려야 할 파일 목록:
```
package.json
vite.config.js
index.html
.gitignore
src/main.jsx
src/MoodForest.jsx
```

---

## STEP 2. Vercel로 배포하기 (5분)

### 2-1. Vercel 가입
1. https://vercel.com 접속
2. [Sign Up] → [Continue with GitHub] → GitHub 연결

### 2-2. 배포
1. [Add New...] → [Project]
2. 목록에서 `still-forest` 찾아서 [Import]
3. Framework Preset이 `Vite` 인지 확인
4. [Deploy] 클릭
5. 1~2분 기다리면 끝!

### 2-3. 내 주소 확인
배포 완료되면 `still-forest-xxxxx.vercel.app` 같은 주소가 생겨요.
이게 내 앱 주소예요!

---

## STEP 3. 폰 홈 화면에 추가하기 (1분)

### 아이폰
1. Safari로 내 주소 접속
2. 하단 공유 버튼 (□↑) 탭
3. "홈 화면에 추가" 선택
4. "추가" 탭

### 안드로이드
1. Chrome으로 내 주소 접속
2. 우측 상단 ⋮ 메뉴
3. "홈 화면에 추가" 선택
4. "추가" 확인

끝! 이제 홈 화면에서 앱처럼 실행할 수 있어요 🎉

---

## 알아두면 좋은 것

**데이터는 어디에 저장돼요?**
→ 폰 브라우저 안에 저장돼요. 앱을 삭제하지 않는 한 유지돼요.

**브라우저 데이터를 지우면?**
→ 기록도 같이 사라져요. Safari/Chrome의 "방문 기록 삭제"를 할 때 주의!

**코드를 수정하고 싶으면?**
→ GitHub에서 파일 수정 → Vercel이 자동으로 다시 배포해요.

**나중에 PC에서도 쓰고 싶으면?**
→ Claude에게 "Firebase 연결해서 동기화 추가해줘"라고 하면 돼요!

---

막히는 부분 있으면 Claude에게 스크린샷 보여주세요 📎
