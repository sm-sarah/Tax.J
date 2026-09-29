// Tax.J - Firebase Cloud Messaging 백그라운드 알림용 Service Worker
// 이 파일은 index.html과 완전히 분리된 별도 파일로, 브라우저가 GitHub Pages 사이트 루트에서 직접
// 서빙해야만(같은 origin, 정확히 이 경로) 동작함 - index.html 안에 인라인으로 넣을 수 없음.
// index.html에서 navigator.serviceWorker.register('firebase-messaging-sw.js')로 상대경로 등록하므로,
// 이 파일도 반드시 index.html과 "같은 폴더(리포지토리 루트)"에 함께 올려둬야 함.
//
// Service Worker 안에서는 페이지 쪽 <script>에서 쓰는 firebase-app-compat.js/firebase-messaging-compat.js를
// 그대로 재사용할 수 없어서(별도의 실행 컨텍스트), importScripts로 다시 불러와야 함. index.html의
// FIREBASE_CONFIG와 반드시 같은 값을 유지해야 하며, 프로젝트 설정이 바뀌면 이 파일도 같이 수정해야 함.
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyArJvHCtIMwn0GHZXOXQSNIqZnvyN--tgw",
  authDomain: "taxj-a3e01.firebaseapp.com",
  projectId: "taxj-a3e01",
  storageBucket: "taxj-a3e01.firebasestorage.app",
  messagingSenderId: "669418345168",
  appId: "1:669418345168:web:5cce25e2573fa5e05cc4d5",
  measurementId: "G-MXEHN1QCJE"
});

const messaging = firebase.messaging();

// 새 버전 파일을 올리면, 예전 버전이 앱을 완전히 닫을 때까지 계속 일하는 걸 막고 바로 새 버전으로 교체함
// (예전 버전이 남아있으면 받는 기기에서 알림이 동시에 두 개씩 뜸)
// 설정 › 알림에서 "이 기기가 새 버전 알림 파일을 쓰고 있는지" 확인할 때 쓰는 버전 표시
const TAXJ_SW_VERSION = '2026.09.29-2';
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'taxj-sw-version' && event.ports && event.ports[0]) event.ports[0].postMessage({ version: TAXJ_SW_VERSION });
});
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// 앱/탭이 꺼져있거나 백그라운드일 때 FCM 메시지가 도착하면 여기서 받아서, OS 알림(배너)으로 띄움
// ⚠️ "모바일에서 같은 알림이 두 번씩 온다"의 원인 - 서버가 notification(제목·내용)을 담아 보내면 Firebase가
// 알아서 알림을 한 번 띄우는데, 예전엔 여기서 또 한 번 showNotification을 불러서 두 번 떴음.
// 이제 notification이 담겨 온 메시지는 Firebase가 띄우는 것 하나만 두고, data만 담겨 온 메시지일 때만 여기서 띄움
messaging.onBackgroundMessage((payload) => {
  if (payload && payload.notification) return; // Firebase가 이미 띄움(중복 방지)
  const d = (payload && payload.data) || {};
  const title = d.title || 'Tax.J';
  const body = d.body || '';
  return self.registration.showNotification(title, {
    body,
    icon: d.icon || 'icon-192.png',
    // 같은 사건이 혹시 두 번 도착해도 알림 하나로 합쳐지게(같은 tag면 덮어씀)
    tag: d.tag || ('taxj-' + title + '|' + body),
    requireInteraction: true, // 직접 닫기 전까지 유지(지원하는 기기에서)
    data: { link: d.link || '' }
  });
});

// 알림(배너)을 클릭하면 - 알림에 "열 주소"(link)가 있으면 그 화면(결재 문서·공지·팀캘린더)으로 바로 가고,
// 없으면 예전처럼 Tax.J를 앞으로 가져오거나 새로 엶
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const nd = event.notification.data || {};
  let link = nd.link || '';
  // Firebase가 자동으로 띄운 알림은 원본 메시지가 FCM_MSG 안에 들어있음
  try{
    const fcm = nd.FCM_MSG || {};
    link = link || (fcm.data && fcm.data.link) || (fcm.fcmOptions && fcm.fcmOptions.link) || (fcm.notification && fcm.notification.click_action) || '';
  }catch(e){}
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client){
          // 이미 열린 Tax.J가 있으면 새로 열지 않고, 그 화면에 "이 알림 열어줘"라고 전달함
          if (link) client.postMessage({ type: 'taxj-open-link', link });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link || './');
    })
  );
});
