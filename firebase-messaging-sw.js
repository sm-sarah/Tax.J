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
const TAXJ_SW_VERSION = '2026.09.30-2';
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'taxj-sw-version' && event.ports && event.ports[0]) event.ports[0].postMessage({ version: TAXJ_SW_VERSION });
});
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// 앱/탭이 꺼져있거나 백그라운드일 때 FCM 메시지가 도착하면 여기서 받아서, OS 알림(배너)으로 띄움
// [2026.09.30] 서버가 이제 제목·내용을 data에만 담아 보내서(notification 없음) Firebase가 자동으로 띄우지 않고,
// 여기서 한 번만 띄움(중복 없음). "PC는 새 알림이 와도 먼저 온 알림만 떠 있다" - 윈도우는 끄기 전까지 유지되는
// 알림을 한 번에 하나만 보여줘서, PC에서는 같은 tag로 이전 알림을 최신 알림으로 교체하고 다시 울림(renotify).
// 휴대폰은 알림창에 차곡차곡 쌓이는 게 편하니 알림마다 다른 tag로 둠
// [2026.09.30-2] 공지·결재 알림 그림 - 서버는 사이트 주소 그림만 통과시켜서 그동안 그림 없이 떴음. 알림에 같이 오는
// "열 주소"(?nt=종류)로 종류를 알아내서 앱 알림함과 같은 색 동그라미 아이콘을 여기서 붙임(index.html notificationIconDataUri와 같은 그림)
function taxjTypeIcon(link, title){
  try{
    const nt = new URL(link || '').searchParams.get('nt') || '';
    let key = { 'notice':'notice', 'approval-new':'approval-request', 'approval-withdraw':'approval-withdraw', 'team-schedule':'team-schedule', 'leave-direct':'team-schedule' }[nt] || '';
    if(nt === 'approval-decision') key = /^반려/.test(title || '') ? 'approval-rejected' : 'approval-approved';
    if(!key) return '';
    const color = { 'approval-request':'#5B5FEF', 'approval-approved':'#0FB88A', 'approval-rejected':'#F0506E', 'notice':'#1E2A5E', 'team-schedule':'#3D5A80', 'approval-withdraw':'#64748B' }[key];
    const paths = {
      'approval-request': '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
      'approval-approved': '<circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>',
      'approval-rejected': '<circle cx="12" cy="12" r="9"/><path d="m9.5 9.5 5 5"/><path d="m14.5 9.5-5 5"/>',
      'notice': '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
      'team-schedule': '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>',
      'approval-withdraw': '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>'
    };
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="' + color + '"/><g transform="translate(16,16)"><g fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + paths[key] + '</g></g></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }catch(e){ return ''; }
}
// 예전 앱이 보낸 공지 내용에 <b>, <div>, &nbsp; 같은 서식 글자가 섞여 와도 글자만 보이게 걸러냄
function taxjPlain(t){
  return String(t || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}
const IS_MOBILE = /Android|iPhone|iPad|Mobile/i.test((self.navigator && self.navigator.userAgent) || '');
messaging.onBackgroundMessage((payload) => {
  if (payload && payload.notification) return; // 예전 방식(서버가 notification을 담아 보낸 경우)은 Firebase가 이미 띄움(중복 방지)
  const d = (payload && payload.data) || {};
  const title = d.title || 'Tax.J';
  const body = taxjPlain(d.body || '');
  return self.registration.showNotification(title, {
    body,
    icon: d.icon || taxjTypeIcon(d.link, title) || 'icon-192.png',
    tag: IS_MOBILE ? ('taxj-' + title + '|' + body) : 'taxj-latest',
    renotify: !IS_MOBILE,
    requireInteraction: d.requireInteraction !== '0', // 직접 닫기 전까지 유지(지원하는 기기에서)
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
