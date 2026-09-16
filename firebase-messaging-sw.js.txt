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

// 앱/탭이 꺼져있거나 백그라운드일 때 FCM 메시지가 도착하면 여기서 받아서, OS 알림(배너)으로 띄움
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || 'Tax.J';
  const body = (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || '';
  self.registration.showNotification(title, {
    body,
    icon: undefined, // 별도 아이콘 파일을 리포지토리 루트에 추가하면 여기에 경로를 넣어줄 수 있음
    tag: 'taxj-push-' + Date.now()
  });
});

// 알림(배너)을 클릭하면 이미 열려있는 Tax.J 탭이 있으면 그 탭으로 포커스하고, 없으면 새로 열어줌
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
