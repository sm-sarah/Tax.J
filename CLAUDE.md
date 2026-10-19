# Tax.J 공개 저장소 (로더 전용)

이 저장소는 사이트 주소(https://sm-sarah.github.io/Tax.J/)를 위한 **로그인 화면(로더)만** 담고 있어요.
앱 원본과 작업 규칙은 비공개 저장소 `sm-sarah/Tax.J-src`에 있어요. 앱 작업은 그 저장소의 CLAUDE.md를 따를 것.

- 여기에는 앱 코드를 절대 올리지 않는다.
- 들어 있는 것: `index.html`(로더), `firebase-messaging-sw.js`(푸시 알림), `bichon-in.png`·`bichon-out.png`(알림 그림), `LICENSE`
- 로더 동작: 회사 계정(@ciacc.co.kr) 로그인 확인 → Firestore `taxj_code`에서 앱을 받아 같은 창에서 실행
