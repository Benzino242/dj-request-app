"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const languageOptions = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "tl", label: "Tagalog", flag: "🇵🇭" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
] as const;

type LanguageCode = (typeof languageOptions)[number]["code"];

const footerLinkLabels: Record<
  LanguageCode,
  { support: string; terms: string; privacy: string }
> = {
  en: { support: "Support", terms: "Terms", privacy: "Privacy" },
  zh: { support: "支持", terms: "条款", privacy: "隐私" },
  ja: { support: "サポート", terms: "利用規約", privacy: "プライバシー" },
  ko: { support: "지원", terms: "약관", privacy: "개인정보" },
  id: { support: "Dukungan", terms: "Ketentuan", privacy: "Privasi" },
  ms: { support: "Sokongan", terms: "Terma", privacy: "Privasi" },
  th: { support: "ซัพพอร์ต", terms: "เงื่อนไข", privacy: "ความเป็นส่วนตัว" },
  hi: { support: "सहायता", terms: "शर्तें", privacy: "गोपनीयता" },
  ar: { support: "الدعم", terms: "الشروط", privacy: "الخصوصية" },
  vi: { support: "Hỗ trợ", terms: "Điều khoản", privacy: "Quyền riêng tư" },
  tl: { support: "Support", terms: "Terms", privacy: "Privacy" },
  pt: { support: "Suporte", terms: "Termos", privacy: "Privacidade" },
  es: { support: "Soporte", terms: "Términos", privacy: "Privacidad" },
  fr: { support: "Support", terms: "Conditions", privacy: "Confidentialité" },
  de: { support: "Support", terms: "Bedingungen", privacy: "Datenschutz" },
  ru: { support: "Поддержка", terms: "Условия", privacy: "Конфиденциальность" },
  tr: { support: "Destek", terms: "Şartlar", privacy: "Gizlilik" },
  it: { support: "Supporto", terms: "Termini", privacy: "Privacy" },
  nl: { support: "Support", terms: "Voorwaarden", privacy: "Privacy" },
  pl: { support: "Wsparcie", terms: "Warunki", privacy: "Prywatność" },
  el: { support: "Υποστήριξη", terms: "Όροι", privacy: "Απόρρητο" },
  uk: { support: "Підтримка", terms: "Умови", privacy: "Приватність" },
};

const landingTranslations = {
  en: {
    languageLabel: "Language",
    heroBadge: "Live DJ Request Platform",
    heroHeadline: "Turn song requests into paid crowd engagement.",
    heroBody:
      "Blackline gives DJs a premium request page, QR code, and live dashboard. Guests request songs from their phone, boost the queue, and keep the party connected without crowding the booth.",
    becomeDj: "Become a Blackline DJ",
    watchDemo: "Watch Demo",
    djLogin: "DJ Login",
    trustBadges: ["Secure guest payments", "Real-time requests", "QR-ready for live events"],
    floatingLiveQueue: "Live queue",
    floatingRequests: "+3 requests",
    floatingPaidBoost: "Paid boost",
    floatingQueueMoved: "Queue moved 🔥",
    productGuestLive: "Live now",
    productGuestName: "Request from your phone",
    productYourName: "Your name",
    productSelectedSong: "Selected song",
    productPayRequest: "Pay & request",
    productDashboardPreview: "DJ dashboard preview",
    productRequestsArrive: "Requests arrive live.",
    productNowPlaying: "Now playing",
    productRequestedBy: "Requested by Jay",
    productScanToRequest: "Scan to request",
    productEarningsTracked: "Earnings tracked",
    productDjShare: "DJ share after platform fee",
    previewQueue: [
      { name: "Maya", song: "Afrobeats anthem", artist: "Guest request", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Club classic", artist: "Guest request", amount: "+20 boost", badge: "Next" },
      { name: "Ari", song: "Late-night hit", artist: "Guest request", amount: "+10 boost", badge: "Queue" },
    ],
    howEyebrow: "How it works",
    howTitle: "Built for the room, not the booth line.",
    platformHighlights: [
      { icon: "📲", title: "Scan the QR code", body: "Guests open the DJ’s Blackline page instantly from a table tent, sticker, flyer, or phone screen." },
      { icon: "🎵", title: "Request a song", body: "They search for a song, add their name, and send the request without crowding the DJ booth." },
      { icon: "🔥", title: "Boost the queue", body: "Paid requests and boosts help DJs prioritize the crowd while keeping the queue organized live." },
    ],
    forDjs: "For DJs",
    forDjsTitle: "Run the request queue from one live dashboard.",
    djFeatures: ["Real-time song request queue", "Apple Music search with artwork", "VIP boost priority system", "QR code and promo kit tools", "Live, offline, and request-lock controls", "Earnings and withdrawal tracking"],
    monetization: "Monetization",
    monetizationTitle: "Simple platform fee. Clear DJ earnings.",
    platformFee: "Platform fee",
    platformFeeBody: "Blackline keeps 10% of paid song requests. DJ earnings are tracked in the dashboard after the Blackline platform fee.",
    trustPoints: ["Secure guest payment flow", "10% Blackline platform fee", "DJs can receive paid requests before verification", "Withdrawals unlock after Blackline approval"],
    forGuests: "For guests",
    forGuestsTitle: "Requests feel fast, simple, and premium.",
    forGuestsBody: "Guests can search songs, see queue energy, boost existing requests, and keep their payment reference for support. The experience is designed for mobile phones inside busy nightlife spaces.",
    important: "Important",
    disclaimer: "Song requests and boosts support the DJ and improve queue priority, but they do not guarantee that a song will be played.",
    launchEyebrow: "Launch your Blackline page",
    launchTitle: "Ready to upgrade your DJ experience?",
    launchBody: "Create your DJ account, set your public link, share your QR code, and start accepting premium live song requests.",
    createAccount: "Create DJ Account",
    demoEyebrow: "44-second demo",
    demoTitle: "Watch the full guest-to-DJ request flow.",
    demoBody: "A quick preview of QR scanning, song requests, paid boosts, live DJ queue updates, and tracked earnings.",
    watchDemoVideo: "▶ Watch Demo Video",
    modalTitle: "See how Blackline works",
    close: "✕ Close",
    modalCaption: "Guests scan the DJ QR code, request a song, boost the queue, and the DJ sees it live in the dashboard.",
    footerText: "Live DJ request platform.",
    support: "Support",
    djSignup: "DJ Signup",
  },
  zh: {
    languageLabel: "语言",
    heroBadge: "现场 DJ 点歌平台",
    heroHeadline: "把点歌变成付费的现场互动。",
    heroBody: "Blackline 为 DJ 提供高级点歌页面、二维码和实时后台。客人用手机点歌、加价提升队列优先级，让派对保持互动，同时不用挤到 DJ 台前。",
    becomeDj: "成为 Blackline DJ",
    watchDemo: "观看演示",
    djLogin: "DJ 登录",
    trustBadges: ["安全的客人支付", "实时点歌", "适合现场活动的二维码"],
    floatingLiveQueue: "实时队列",
    floatingRequests: "+3 个请求",
    floatingPaidBoost: "付费提升",
    floatingQueueMoved: "队列已提升 🔥",
    productGuestLive: "正在直播",
    productGuestName: "用手机点歌",
    productYourName: "你的名字",
    productSelectedSong: "已选歌曲",
    productPayRequest: "支付并点歌",
    productDashboardPreview: "DJ 后台预览",
    productRequestsArrive: "请求实时到达。",
    productNowPlaying: "正在播放",
    productRequestedBy: "Jay 点播",
    productScanToRequest: "扫码点歌",
    productEarningsTracked: "收益已追踪",
    productDjShare: "扣除平台费后的 DJ 份额",
    previewQueue: [
      { name: "Maya", song: "Afrobeats 热门歌", artist: "客人点歌", amount: "+50 提升", badge: "VIP" },
      { name: "Chris", song: "夜店经典", artist: "客人点歌", amount: "+20 提升", badge: "下一首" },
      { name: "Ari", song: "深夜热曲", artist: "客人点歌", amount: "+10 提升", badge: "队列" },
    ],
    howEyebrow: "工作方式",
    howTitle: "为整个现场设计，而不是为 DJ 台前排队设计。",
    platformHighlights: [
      { icon: "📲", title: "扫描二维码", body: "客人可从桌牌、贴纸、传单或手机屏幕立即打开 DJ 的 Blackline 页面。" },
      { icon: "🎵", title: "点一首歌", body: "他们搜索歌曲、填写名字并发送请求，不用挤到 DJ 台前。" },
      { icon: "🔥", title: "提升队列", body: "付费点歌和提升帮助 DJ 实时整理和优先处理现场请求。" },
    ],
    forDjs: "给 DJ",
    forDjsTitle: "用一个实时后台管理点歌队列。",
    djFeatures: ["实时点歌队列", "带封面的 Apple Music 搜索", "VIP 提升优先系统", "二维码和宣传工具", "直播、离线和点歌锁定控制", "收益和提现追踪"],
    monetization: "变现",
    monetizationTitle: "简单平台费，清晰 DJ 收益。",
    platformFee: "平台费",
    platformFeeBody: "Blackline 从付费点歌中收取 10%。扣除 Blackline 平台费后，DJ 收益会在后台追踪。",
    trustPoints: ["安全的客人支付流程", "10% Blackline 平台费", "DJ 验证前也可接收付费点歌", "提现需通过 Blackline 审核后解锁"],
    forGuests: "给客人",
    forGuestsTitle: "点歌体验快速、简单、有质感。",
    forGuestsBody: "客人可以搜索歌曲、感受队列动态、提升已有请求，并保存付款参考以便支持查询。体验专为繁忙夜生活场景中的手机使用而设计。",
    important: "重要说明",
    disclaimer: "点歌和提升会支持 DJ 并提高队列优先级，但不保证歌曲一定会播放。",
    launchEyebrow: "启动你的 Blackline 页面",
    launchTitle: "准备升级你的 DJ 体验了吗？",
    launchBody: "创建 DJ 账号，设置公开链接，分享二维码，开始接收高级现场点歌。",
    createAccount: "创建 DJ 账号",
    demoEyebrow: "44 秒演示",
    demoTitle: "观看从客人到 DJ 的完整点歌流程。",
    demoBody: "快速预览扫码、点歌、付费提升、实时 DJ 队列更新和收益追踪。",
    watchDemoVideo: "▶ 观看演示视频",
    modalTitle: "看看 Blackline 如何工作",
    close: "✕ 关闭",
    modalCaption: "客人扫描 DJ 二维码、点歌、提升队列，DJ 会在后台实时看到请求。",
    footerText: "现场 DJ 点歌平台。",
    support: "支持",
    djSignup: "DJ 注册",
  },
  ja: {
    languageLabel: "言語",
    heroBadge: "ライブDJリクエストプラットフォーム",
    heroHeadline: "曲のリクエストを、有料のフロア参加体験に。",
    heroBody: "Blackline は、DJ にプレミアムなリクエストページ、QRコード、ライブダッシュボードを提供します。ゲストはスマホで曲をリクエストし、キューをブーストし、DJブースに集まらずにパーティーとつながれます。",
    becomeDj: "Blackline DJ になる",
    watchDemo: "デモを見る",
    djLogin: "DJ ログイン",
    trustBadges: ["安全なゲスト決済", "リアルタイムリクエスト", "ライブイベント向けQR"],
    floatingLiveQueue: "ライブキュー",
    floatingRequests: "+3 件のリクエスト",
    floatingPaidBoost: "有料ブースト",
    floatingQueueMoved: "キューが上がりました 🔥",
    productGuestLive: "ライブ中",
    productGuestName: "スマホからリクエスト",
    productYourName: "名前",
    productSelectedSong: "選択した曲",
    productPayRequest: "支払ってリクエスト",
    productDashboardPreview: "DJダッシュボードプレビュー",
    productRequestsArrive: "リクエストがリアルタイムで届きます。",
    productNowPlaying: "再生中",
    productRequestedBy: "Jay からのリクエスト",
    productScanToRequest: "スキャンしてリクエスト",
    productEarningsTracked: "収益を追跡",
    productDjShare: "プラットフォーム手数料後のDJ取り分",
    previewQueue: [
      { name: "Maya", song: "Afrobeats アンセム", artist: "ゲストリクエスト", amount: "+50 ブースト", badge: "VIP" },
      { name: "Chris", song: "クラブ定番曲", artist: "ゲストリクエスト", amount: "+20 ブースト", badge: "次" },
      { name: "Ari", song: "深夜のヒット", artist: "ゲストリクエスト", amount: "+10 ブースト", badge: "キュー" },
    ],
    howEyebrow: "使い方",
    howTitle: "DJブース前の列ではなく、フロア全体のために。",
    platformHighlights: [
      { icon: "📲", title: "QRコードをスキャン", body: "ゲストはテーブルテント、ステッカー、フライヤー、スマホ画面からDJのBlacklineページをすぐに開けます。" },
      { icon: "🎵", title: "曲をリクエスト", body: "曲を検索し、名前を入力して、DJブースに集まらずにリクエストを送信できます。" },
      { icon: "🔥", title: "キューをブースト", body: "有料リクエストとブーストで、DJはフロアの要望をライブで整理しやすくなります。" },
    ],
    forDjs: "DJ向け",
    forDjsTitle: "1つのライブダッシュボードでリクエストキューを管理。",
    djFeatures: ["リアルタイム曲リクエストキュー", "アートワーク付きApple Music検索", "VIPブースト優先システム", "QRコードとプロモキットツール", "ライブ・オフライン・リクエストロック制御", "収益と出金の追跡"],
    monetization: "収益化",
    monetizationTitle: "シンプルな手数料。明確なDJ収益。",
    platformFee: "プラットフォーム手数料",
    platformFeeBody: "Blackline は有料曲リクエストの10%を受け取ります。DJ収益はBlackline手数料後にダッシュボードで追跡されます。",
    trustPoints: ["安全なゲスト決済フロー", "10% Blacklineプラットフォーム手数料", "DJは認証前でも有料リクエストを受け取れます", "出金はBlackline承認後に利用可能"],
    forGuests: "ゲスト向け",
    forGuestsTitle: "速く、簡単で、プレミアムなリクエスト体験。",
    forGuestsBody: "ゲストは曲を検索し、キューの動きを見て、既存リクエストをブーストし、サポート用に支払い参照を保管できます。忙しいナイトライフ空間でのスマホ利用に最適化されています。",
    important: "重要",
    disclaimer: "曲のリクエストとブーストはDJをサポートしキュー優先度を高めますが、曲の再生を保証するものではありません。",
    launchEyebrow: "Blacklineページを公開",
    launchTitle: "DJ体験をアップグレードしませんか？",
    launchBody: "DJアカウントを作成し、公開リンクを設定し、QRコードを共有して、プレミアムなライブ曲リクエストを受け付けましょう。",
    createAccount: "DJアカウントを作成",
    demoEyebrow: "44秒デモ",
    demoTitle: "ゲストからDJまでのリクエスト流れを見る。",
    demoBody: "QRスキャン、曲リクエスト、有料ブースト、ライブDJキュー更新、収益追跡を素早く確認できます。",
    watchDemoVideo: "▶ デモ動画を見る",
    modalTitle: "Blackline の仕組みを見る",
    close: "✕ 閉じる",
    modalCaption: "ゲストがDJ QRコードをスキャンし、曲をリクエストし、キューをブーストすると、DJはダッシュボードでライブに確認できます。",
    footerText: "ライブDJリクエストプラットフォーム。",
    support: "サポート",
    djSignup: "DJ登録",
  },
  ko: {
    languageLabel: "언어",
    heroBadge: "라이브 DJ 신청 플랫폼",
    heroHeadline: "곡 신청을 유료 관객 참여로 바꾸세요.",
    heroBody: "Blackline은 DJ에게 프리미엄 신청 페이지, QR 코드, 실시간 대시보드를 제공합니다. 게스트는 휴대폰으로 곡을 신청하고, 대기열을 부스트하며, DJ 부스에 몰리지 않고 파티와 연결됩니다.",
    becomeDj: "Blackline DJ 되기",
    watchDemo: "데모 보기",
    djLogin: "DJ 로그인",
    trustBadges: ["안전한 게스트 결제", "실시간 신청", "라이브 이벤트용 QR"],
    floatingLiveQueue: "라이브 대기열",
    floatingRequests: "+3 신청",
    floatingPaidBoost: "유료 부스트",
    floatingQueueMoved: "대기열 상승 🔥",
    productGuestLive: "라이브 중",
    productGuestName: "휴대폰에서 신청",
    productYourName: "이름",
    productSelectedSong: "선택한 곡",
    productPayRequest: "결제하고 신청",
    productDashboardPreview: "DJ 대시보드 미리보기",
    productRequestsArrive: "신청이 실시간으로 도착합니다.",
    productNowPlaying: "재생 중",
    productRequestedBy: "Jay 신청",
    productScanToRequest: "스캔하여 신청",
    productEarningsTracked: "수익 추적",
    productDjShare: "플랫폼 수수료 후 DJ 몫",
    previewQueue: [
      { name: "Maya", song: "Afrobeats 앤섬", artist: "게스트 신청", amount: "+50 부스트", badge: "VIP" },
      { name: "Chris", song: "클럽 클래식", artist: "게스트 신청", amount: "+20 부스트", badge: "다음" },
      { name: "Ari", song: "늦은 밤 히트", artist: "게스트 신청", amount: "+10 부스트", badge: "대기열" },
    ],
    howEyebrow: "작동 방식",
    howTitle: "DJ 부스 줄이 아니라, 현장 전체를 위해 만들었습니다.",
    platformHighlights: [
      { icon: "📲", title: "QR 코드 스캔", body: "게스트는 테이블 텐트, 스티커, 전단지 또는 휴대폰 화면에서 DJ의 Blackline 페이지를 즉시 열 수 있습니다." },
      { icon: "🎵", title: "곡 신청", body: "곡을 검색하고 이름을 추가한 뒤 DJ 부스에 몰리지 않고 신청을 보냅니다." },
      { icon: "🔥", title: "대기열 부스트", body: "유료 신청과 부스트는 DJ가 현장의 요청을 실시간으로 정리하고 우선순위를 정하는 데 도움을 줍니다." },
    ],
    forDjs: "DJ용",
    forDjsTitle: "하나의 라이브 대시보드에서 신청 대기열을 운영하세요.",
    djFeatures: ["실시간 곡 신청 대기열", "아트워크가 포함된 Apple Music 검색", "VIP 부스트 우선 시스템", "QR 코드 및 프로모션 키트 도구", "라이브, 오프라인, 신청 잠금 제어", "수익 및 출금 추적"],
    monetization: "수익화",
    monetizationTitle: "간단한 플랫폼 수수료. 명확한 DJ 수익.",
    platformFee: "플랫폼 수수료",
    platformFeeBody: "Blackline은 유료 곡 신청의 10%를 받습니다. DJ 수익은 Blackline 플랫폼 수수료 후 대시보드에서 추적됩니다.",
    trustPoints: ["안전한 게스트 결제 흐름", "10% Blackline 플랫폼 수수료", "DJ는 인증 전에도 유료 신청을 받을 수 있습니다", "출금은 Blackline 승인 후 열립니다"],
    forGuests: "게스트용",
    forGuestsTitle: "빠르고 간단하며 프리미엄한 신청 경험.",
    forGuestsBody: "게스트는 곡을 검색하고, 대기열 분위기를 확인하고, 기존 신청을 부스트하며, 지원을 위해 결제 참조를 보관할 수 있습니다. 바쁜 나이트라이프 공간의 휴대폰 사용에 맞게 설계되었습니다.",
    important: "중요",
    disclaimer: "곡 신청과 부스트는 DJ를 지원하고 대기열 우선순위를 높이지만, 곡 재생을 보장하지는 않습니다.",
    launchEyebrow: "Blackline 페이지 시작",
    launchTitle: "DJ 경험을 업그레이드할 준비가 되셨나요?",
    launchBody: "DJ 계정을 만들고, 공개 링크를 설정하고, QR 코드를 공유하여 프리미엄 라이브 곡 신청을 받기 시작하세요.",
    createAccount: "DJ 계정 만들기",
    demoEyebrow: "44초 데모",
    demoTitle: "게스트에서 DJ까지의 전체 신청 흐름을 보세요.",
    demoBody: "QR 스캔, 곡 신청, 유료 부스트, 라이브 DJ 대기열 업데이트, 수익 추적을 빠르게 미리 봅니다.",
    watchDemoVideo: "▶ 데모 영상 보기",
    modalTitle: "Blackline 작동 방식 보기",
    close: "✕ 닫기",
    modalCaption: "게스트가 DJ QR 코드를 스캔하고 곡을 신청하고 대기열을 부스트하면, DJ는 대시보드에서 실시간으로 확인합니다.",
    footerText: "라이브 DJ 신청 플랫폼.",
    support: "지원",
    djSignup: "DJ 가입",
  },
  id: {
    languageLabel: "Bahasa",
    heroBadge: "Platform Request DJ Live",
    heroHeadline: "Ubah request lagu menjadi interaksi penonton berbayar.",
    heroBody: "Blackline memberi DJ halaman request premium, kode QR, dan dashboard live. Tamu meminta lagu dari ponsel, boost antrean, dan tetap terhubung dengan pesta tanpa berdesakan di booth DJ.",
    becomeDj: "Jadi DJ Blackline",
    watchDemo: "Tonton Demo",
    djLogin: "Login DJ",
    trustBadges: ["Pembayaran tamu aman", "Request real-time", "QR siap untuk event live"],
    floatingLiveQueue: "Antrean live",
    floatingRequests: "+3 request",
    floatingPaidBoost: "Boost berbayar",
    floatingQueueMoved: "Antrean naik 🔥",
    productGuestLive: "Live sekarang",
    productGuestName: "Request dari ponselmu",
    productYourName: "Namamu",
    productSelectedSong: "Lagu pilihan",
    productPayRequest: "Bayar & request",
    productDashboardPreview: "Preview dashboard DJ",
    productRequestsArrive: "Request masuk live.",
    productNowPlaying: "Sedang diputar",
    productRequestedBy: "Diminta oleh Jay",
    productScanToRequest: "Scan untuk request",
    productEarningsTracked: "Pendapatan tercatat",
    productDjShare: "Bagian DJ setelah biaya platform",
    previewQueue: [
      { name: "Maya", song: "Anthem Afrobeats", artist: "Request tamu", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Club classic", artist: "Request tamu", amount: "+20 boost", badge: "Berikutnya" },
      { name: "Ari", song: "Hit malam", artist: "Request tamu", amount: "+10 boost", badge: "Antrean" },
    ],
    howEyebrow: "Cara kerjanya",
    howTitle: "Dibuat untuk ruangan, bukan antrean di booth.",
    platformHighlights: [
      { icon: "📲", title: "Scan kode QR", body: "Tamu langsung membuka halaman Blackline DJ dari table tent, stiker, flyer, atau layar ponsel." },
      { icon: "🎵", title: "Request lagu", body: "Mereka mencari lagu, menambahkan nama, dan mengirim request tanpa memadati booth DJ." },
      { icon: "🔥", title: "Boost antrean", body: "Request dan boost berbayar membantu DJ memprioritaskan penonton sambil menjaga antrean tetap rapi secara live." },
    ],
    forDjs: "Untuk DJ",
    forDjsTitle: "Kelola antrean request dari satu dashboard live.",
    djFeatures: ["Antrean request lagu real-time", "Pencarian Apple Music dengan artwork", "Sistem prioritas boost VIP", "Alat kode QR dan promo kit", "Kontrol live, offline, dan kunci request", "Pelacakan pendapatan dan penarikan"],
    monetization: "Monetisasi",
    monetizationTitle: "Biaya platform sederhana. Pendapatan DJ jelas.",
    platformFee: "Biaya platform",
    platformFeeBody: "Blackline mengambil 10% dari request lagu berbayar. Pendapatan DJ tercatat di dashboard setelah biaya platform Blackline.",
    trustPoints: ["Alur pembayaran tamu aman", "Biaya platform Blackline 10%", "DJ dapat menerima request berbayar sebelum verifikasi", "Penarikan terbuka setelah persetujuan Blackline"],
    forGuests: "Untuk tamu",
    forGuestsTitle: "Request terasa cepat, mudah, dan premium.",
    forGuestsBody: "Tamu dapat mencari lagu, melihat energi antrean, boost request yang sudah ada, dan menyimpan referensi pembayaran untuk support. Pengalaman ini dirancang untuk ponsel di ruang nightlife yang ramai.",
    important: "Penting",
    disclaimer: "Request dan boost mendukung DJ dan meningkatkan prioritas antrean, tetapi tidak menjamin lagu akan diputar.",
    launchEyebrow: "Luncurkan halaman Blackline-mu",
    launchTitle: "Siap upgrade pengalaman DJ-mu?",
    launchBody: "Buat akun DJ, atur link publik, bagikan kode QR, dan mulai menerima request lagu live premium.",
    createAccount: "Buat Akun DJ",
    demoEyebrow: "Demo 44 detik",
    demoTitle: "Tonton alur lengkap dari tamu ke DJ.",
    demoBody: "Preview singkat scan QR, request lagu, boost berbayar, update antrean DJ live, dan pelacakan pendapatan.",
    watchDemoVideo: "▶ Tonton Video Demo",
    modalTitle: "Lihat cara kerja Blackline",
    close: "✕ Tutup",
    modalCaption: "Tamu scan QR DJ, request lagu, boost antrean, dan DJ melihatnya live di dashboard.",
    footerText: "Platform request DJ live.",
    support: "Support",
    djSignup: "Daftar DJ",
  },
  ms: {
    languageLabel: "Bahasa",
    heroBadge: "Platform Permintaan DJ Langsung",
    heroHeadline: "Jadikan permintaan lagu sebagai penglibatan penonton berbayar.",
    heroBody: "Blackline memberi DJ halaman permintaan premium, kod QR, dan papan pemuka langsung. Tetamu meminta lagu dari telefon, boost giliran, dan kekal terhubung dengan parti tanpa memenuhi booth DJ.",
    becomeDj: "Jadi DJ Blackline",
    watchDemo: "Tonton Demo",
    djLogin: "Log Masuk DJ",
    trustBadges: ["Pembayaran tetamu selamat", "Permintaan masa nyata", "QR sedia untuk acara langsung"],
    floatingLiveQueue: "Giliran langsung",
    floatingRequests: "+3 permintaan",
    floatingPaidBoost: "Boost berbayar",
    floatingQueueMoved: "Giliran naik 🔥",
    productGuestLive: "Sedang live",
    productGuestName: "Minta dari telefon anda",
    productYourName: "Nama anda",
    productSelectedSong: "Lagu dipilih",
    productPayRequest: "Bayar & minta",
    productDashboardPreview: "Pratonton papan pemuka DJ",
    productRequestsArrive: "Permintaan tiba secara langsung.",
    productNowPlaying: "Sedang dimainkan",
    productRequestedBy: "Diminta oleh Jay",
    productScanToRequest: "Imbas untuk meminta",
    productEarningsTracked: "Pendapatan dijejaki",
    productDjShare: "Bahagian DJ selepas yuran platform",
    previewQueue: [
      { name: "Maya", song: "Anthem Afrobeats", artist: "Permintaan tetamu", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Klasik kelab", artist: "Permintaan tetamu", amount: "+20 boost", badge: "Seterusnya" },
      { name: "Ari", song: "Hit lewat malam", artist: "Permintaan tetamu", amount: "+10 boost", badge: "Giliran" },
    ],
    howEyebrow: "Cara ia berfungsi",
    howTitle: "Dibina untuk seluruh ruang, bukan barisan di booth.",
    platformHighlights: [
      { icon: "📲", title: "Imbas kod QR", body: "Tetamu membuka halaman Blackline DJ terus dari table tent, pelekat, flyer, atau skrin telefon." },
      { icon: "🎵", title: "Minta lagu", body: "Mereka mencari lagu, menambah nama, dan menghantar permintaan tanpa memenuhi booth DJ." },
      { icon: "🔥", title: "Boost giliran", body: "Permintaan dan boost berbayar membantu DJ mengutamakan penonton sambil memastikan giliran teratur secara langsung." },
    ],
    forDjs: "Untuk DJ",
    forDjsTitle: "Urus giliran permintaan dari satu papan pemuka langsung.",
    djFeatures: ["Giliran permintaan lagu masa nyata", "Carian Apple Music dengan artwork", "Sistem keutamaan boost VIP", "Alat kod QR dan promo kit", "Kawalan live, offline, dan kunci permintaan", "Penjejakan pendapatan dan pengeluaran"],
    monetization: "Monetisasi",
    monetizationTitle: "Yuran platform mudah. Pendapatan DJ jelas.",
    platformFee: "Yuran platform",
    platformFeeBody: "Blackline mengambil 10% daripada permintaan lagu berbayar. Pendapatan DJ dijejaki dalam papan pemuka selepas yuran platform Blackline.",
    trustPoints: ["Aliran pembayaran tetamu selamat", "Yuran platform Blackline 10%", "DJ boleh menerima permintaan berbayar sebelum pengesahan", "Pengeluaran dibuka selepas kelulusan Blackline"],
    forGuests: "Untuk tetamu",
    forGuestsTitle: "Permintaan terasa pantas, mudah, dan premium.",
    forGuestsBody: "Tetamu boleh mencari lagu, melihat tenaga giliran, boost permintaan sedia ada, dan menyimpan rujukan pembayaran untuk sokongan. Pengalaman ini direka untuk telefon dalam ruang hiburan malam yang sibuk.",
    important: "Penting",
    disclaimer: "Permintaan lagu dan boost menyokong DJ serta meningkatkan keutamaan giliran, tetapi tidak menjamin lagu akan dimainkan.",
    launchEyebrow: "Lancarkan halaman Blackline anda",
    launchTitle: "Bersedia menaik taraf pengalaman DJ anda?",
    launchBody: "Cipta akaun DJ, tetapkan pautan awam, kongsi kod QR, dan mula menerima permintaan lagu live premium.",
    createAccount: "Cipta Akaun DJ",
    demoEyebrow: "Demo 44 saat",
    demoTitle: "Tonton aliran penuh daripada tetamu ke DJ.",
    demoBody: "Pratonton ringkas imbas QR, permintaan lagu, boost berbayar, kemas kini giliran DJ live, dan penjejakan pendapatan.",
    watchDemoVideo: "▶ Tonton Video Demo",
    modalTitle: "Lihat cara Blackline berfungsi",
    close: "✕ Tutup",
    modalCaption: "Tetamu imbas QR DJ, minta lagu, boost giliran, dan DJ melihatnya secara langsung di papan pemuka.",
    footerText: "Platform permintaan DJ langsung.",
    support: "Sokongan",
    djSignup: "Daftar DJ",
  },
  th: {
    languageLabel: "ภาษา",
    heroBadge: "แพลตฟอร์มขอเพลง DJ แบบสด",
    heroHeadline: "เปลี่ยนการขอเพลงให้เป็นการมีส่วนร่วมแบบชำระเงินของผู้ชม",
    heroBody: "Blackline ให้ DJ มีหน้าขอเพลงระดับพรีเมียม คิวอาร์โค้ด และแดชบอร์ดสด แขกสามารถขอเพลงจากมือถือ บูสต์คิว และเชื่อมต่อกับปาร์ตี้ได้โดยไม่ต้องเบียดหน้า DJ booth",
    becomeDj: "เป็น Blackline DJ",
    watchDemo: "ดูเดโม",
    djLogin: "เข้าสู่ระบบ DJ",
    trustBadges: ["การชำระเงินของแขกปลอดภัย", "คำขอแบบเรียลไทม์", "QR พร้อมสำหรับงานสด"],
    floatingLiveQueue: "คิวสด",
    floatingRequests: "+3 คำขอ",
    floatingPaidBoost: "บูสต์แบบชำระเงิน",
    floatingQueueMoved: "คิวขยับขึ้น 🔥",
    productGuestLive: "กำลังไลฟ์",
    productGuestName: "ขอเพลงจากมือถือ",
    productYourName: "ชื่อของคุณ",
    productSelectedSong: "เพลงที่เลือก",
    productPayRequest: "จ่ายและขอเพลง",
    productDashboardPreview: "ตัวอย่างแดชบอร์ด DJ",
    productRequestsArrive: "คำขอมาถึงแบบสด",
    productNowPlaying: "กำลังเล่น",
    productRequestedBy: "ขอโดย Jay",
    productScanToRequest: "สแกนเพื่อขอเพลง",
    productEarningsTracked: "ติดตามรายได้",
    productDjShare: "ส่วนแบ่ง DJ หลังหักค่าธรรมเนียมแพลตฟอร์ม",
    previewQueue: [
      { name: "Maya", song: "เพลงฮิต Afrobeats", artist: "คำขอจากแขก", amount: "+50 บูสต์", badge: "VIP" },
      { name: "Chris", song: "เพลงคลับคลาสสิก", artist: "คำขอจากแขก", amount: "+20 บูสต์", badge: "ถัดไป" },
      { name: "Ari", song: "เพลงฮิตดึก ๆ", artist: "คำขอจากแขก", amount: "+10 บูสต์", badge: "คิว" },
    ],
    howEyebrow: "วิธีทำงาน",
    howTitle: "สร้างมาเพื่อทั้งห้อง ไม่ใช่แถวหน้า DJ booth",
    platformHighlights: [
      { icon: "📲", title: "สแกน QR", body: "แขกเปิดหน้า Blackline ของ DJ ได้ทันทีจากป้ายโต๊ะ สติกเกอร์ ใบปลิว หรือหน้าจอมือถือ" },
      { icon: "🎵", title: "ขอเพลง", body: "ค้นหาเพลง ใส่ชื่อ และส่งคำขอได้โดยไม่ต้องไปเบียดหน้า DJ booth" },
      { icon: "🔥", title: "บูสต์คิว", body: "คำขอและบูสต์แบบชำระเงินช่วยให้ DJ จัดลำดับผู้ชมและคุมคิวสดได้ง่ายขึ้น" },
    ],
    forDjs: "สำหรับ DJ",
    forDjsTitle: "จัดการคิวขอเพลงจากแดชบอร์ดสดเดียว",
    djFeatures: ["คิวขอเพลงเรียลไทม์", "ค้นหา Apple Music พร้อมภาพปก", "ระบบ VIP boost priority", "เครื่องมือ QR และ promo kit", "ควบคุม live, offline และล็อกคำขอ", "ติดตามรายได้และการถอนเงิน"],
    monetization: "การสร้างรายได้",
    monetizationTitle: "ค่าธรรมเนียมแพลตฟอร์มง่าย รายได้ DJ ชัดเจน",
    platformFee: "ค่าธรรมเนียมแพลตฟอร์ม",
    platformFeeBody: "Blackline เก็บ 10% จากคำขอเพลงแบบชำระเงิน รายได้ DJ ถูกติดตามในแดชบอร์ดหลังหักค่าธรรมเนียมแพลตฟอร์ม Blackline",
    trustPoints: ["ขั้นตอนชำระเงินของแขกปลอดภัย", "ค่าธรรมเนียม Blackline 10%", "DJ รับคำขอแบบชำระเงินได้ก่อนยืนยันตัวตน", "ถอนเงินได้หลัง Blackline อนุมัติ"],
    forGuests: "สำหรับแขก",
    forGuestsTitle: "ขอเพลงได้รวดเร็ว ง่าย และพรีเมียม",
    forGuestsBody: "แขกค้นหาเพลง ดูพลังของคิว บูสต์คำขอเดิม และเก็บเลขอ้างอิงการชำระเงินสำหรับ support ได้ ประสบการณ์นี้ออกแบบมาสำหรับมือถือในสถานบันเทิงที่คนเยอะ",
    important: "สำคัญ",
    disclaimer: "การขอเพลงและบูสต์ช่วยสนับสนุน DJ และเพิ่มลำดับความสำคัญในคิว แต่ไม่รับประกันว่าเพลงจะถูกเล่น",
    launchEyebrow: "เปิดหน้า Blackline ของคุณ",
    launchTitle: "พร้อมอัปเกรดประสบการณ์ DJ ของคุณหรือยัง?",
    launchBody: "สร้างบัญชี DJ ตั้งค่าลิงก์สาธารณะ แชร์ QR และเริ่มรับคำขอเพลงสดระดับพรีเมียม",
    createAccount: "สร้างบัญชี DJ",
    demoEyebrow: "เดโม 44 วินาที",
    demoTitle: "ดูขั้นตอนเต็มจากแขกถึง DJ",
    demoBody: "พรีวิวสั้น ๆ ของการสแกน QR การขอเพลง บูสต์แบบชำระเงิน อัปเดตคิว DJ สด และติดตามรายได้",
    watchDemoVideo: "▶ ดูวิดีโอเดโม",
    modalTitle: "ดูว่า Blackline ทำงานอย่างไร",
    close: "✕ ปิด",
    modalCaption: "แขกสแกน QR ของ DJ ขอเพลง บูสต์คิว และ DJ เห็นทุกอย่างแบบสดในแดชบอร์ด",
    footerText: "แพลตฟอร์มขอเพลง DJ แบบสด",
    support: "ช่วยเหลือ",
    djSignup: "สมัคร DJ",
  },
  hi: {
    languageLabel: "भाषा",
    heroBadge: "लाइव DJ रिक्वेस्ट प्लेटफॉर्म",
    heroHeadline: "गानों की रिक्वेस्ट को पेड क्राउड एंगेजमेंट में बदलें।",
    heroBody: "Blackline DJs को प्रीमियम रिक्वेस्ट पेज, QR कोड और लाइव डैशबोर्ड देता है। मेहमान अपने फोन से गाने मांगते हैं, queue boost करते हैं, और DJ booth पर भीड़ लगाए बिना पार्टी से जुड़े रहते हैं।",
    becomeDj: "Blackline DJ बनें",
    watchDemo: "डेमो देखें",
    djLogin: "DJ लॉगिन",
    trustBadges: ["सुरक्षित guest payments", "Real-time requests", "Live events के लिए QR-ready"],
    floatingLiveQueue: "Live queue",
    floatingRequests: "+3 requests",
    floatingPaidBoost: "Paid boost",
    floatingQueueMoved: "Queue ऊपर गई 🔥",
    productGuestLive: "Live now",
    productGuestName: "फोन से request करें",
    productYourName: "आपका नाम",
    productSelectedSong: "चुना हुआ गाना",
    productPayRequest: "Pay & request",
    productDashboardPreview: "DJ dashboard preview",
    productRequestsArrive: "Requests live आती हैं।",
    productNowPlaying: "Now playing",
    productRequestedBy: "Jay ने request किया",
    productScanToRequest: "Request के लिए scan करें",
    productEarningsTracked: "Earnings tracked",
    productDjShare: "Platform fee के बाद DJ share",
    previewQueue: [
      { name: "Maya", song: "Afrobeats anthem", artist: "Guest request", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Club classic", artist: "Guest request", amount: "+20 boost", badge: "Next" },
      { name: "Ari", song: "Late-night hit", artist: "Guest request", amount: "+10 boost", badge: "Queue" },
    ],
    howEyebrow: "कैसे काम करता है",
    howTitle: "यह पूरे room के लिए बना है, DJ booth की line के लिए नहीं।",
    platformHighlights: [
      { icon: "📲", title: "QR code scan करें", body: "Guests table tent, sticker, flyer या phone screen से DJ का Blackline page तुरंत खोलते हैं।" },
      { icon: "🎵", title: "गाना request करें", body: "वे गाना search करते हैं, नाम जोड़ते हैं और DJ booth पर भीड़ किए बिना request भेजते हैं।" },
      { icon: "🔥", title: "Queue boost करें", body: "Paid requests और boosts DJs को crowd priority देने और queue को live organized रखने में मदद करते हैं।" },
    ],
    forDjs: "DJs के लिए",
    forDjsTitle: "एक live dashboard से request queue चलाएँ।",
    djFeatures: ["Real-time song request queue", "Artwork के साथ Apple Music search", "VIP boost priority system", "QR code और promo kit tools", "Live, offline और request-lock controls", "Earnings और withdrawal tracking"],
    monetization: "Monetization",
    monetizationTitle: "Simple platform fee. Clear DJ earnings.",
    platformFee: "Platform fee",
    platformFeeBody: "Blackline paid song requests का 10% रखता है। Blackline platform fee के बाद DJ earnings dashboard में track होती हैं।",
    trustPoints: ["Secure guest payment flow", "10% Blackline platform fee", "DJs verification से पहले paid requests receive कर सकते हैं", "Withdrawals Blackline approval के बाद unlock होते हैं"],
    forGuests: "Guests के लिए",
    forGuestsTitle: "Requests fast, simple और premium लगती हैं।",
    forGuestsBody: "Guests songs search कर सकते हैं, queue energy देख सकते हैं, existing requests boost कर सकते हैं और support के लिए payment reference रख सकते हैं। Experience busy nightlife spaces में mobile phones के लिए बनाया गया है।",
    important: "महत्वपूर्ण",
    disclaimer: "Song requests और boosts DJ को support करते हैं और queue priority बढ़ाते हैं, लेकिन यह guarantee नहीं करते कि song play होगा।",
    launchEyebrow: "अपना Blackline page launch करें",
    launchTitle: "क्या आप अपना DJ experience upgrade करने के लिए ready हैं?",
    launchBody: "DJ account बनाएँ, public link set करें, QR code share करें और premium live song requests लेना शुरू करें।",
    createAccount: "DJ Account बनाएँ",
    demoEyebrow: "44-second demo",
    demoTitle: "Guest-to-DJ request flow देखें।",
    demoBody: "QR scan, song requests, paid boosts, live DJ queue updates और tracked earnings का quick preview।",
    watchDemoVideo: "▶ Demo Video देखें",
    modalTitle: "देखें Blackline कैसे काम करता है",
    close: "✕ बंद करें",
    modalCaption: "Guests DJ QR code scan करते हैं, song request करते हैं, queue boost करते हैं, और DJ dashboard में live देखता है।",
    footerText: "Live DJ request platform.",
    support: "Support",
    djSignup: "DJ Signup",
  },
  ar: {
    languageLabel: "اللغة",
    heroBadge: "منصة طلبات DJ مباشرة",
    heroHeadline: "حوّل طلبات الأغاني إلى تفاعل مدفوع مع الجمهور.",
    heroBody: "يمنح Blackline منسقي الأغاني صفحة طلبات احترافية ورمز QR ولوحة تحكم مباشرة. يطلب الضيوف الأغاني من هواتفهم، ويرفعون أولوية الطابور، ويبقون متصلين بالحفل دون الازدحام حول كشك الـ DJ.",
    becomeDj: "كن DJ على Blackline",
    watchDemo: "شاهد العرض",
    djLogin: "دخول DJ",
    trustBadges: ["مدفوعات ضيوف آمنة", "طلبات فورية", "QR جاهز للفعاليات المباشرة"],
    floatingLiveQueue: "طابور مباشر",
    floatingRequests: "+3 طلبات",
    floatingPaidBoost: "تعزيز مدفوع",
    floatingQueueMoved: "تم رفع الطابور 🔥",
    productGuestLive: "مباشر الآن",
    productGuestName: "اطلب من هاتفك",
    productYourName: "اسمك",
    productSelectedSong: "الأغنية المختارة",
    productPayRequest: "ادفع واطلب",
    productDashboardPreview: "معاينة لوحة DJ",
    productRequestsArrive: "تصل الطلبات مباشرة.",
    productNowPlaying: "قيد التشغيل",
    productRequestedBy: "طلبه Jay",
    productScanToRequest: "امسح للطلب",
    productEarningsTracked: "الأرباح متتبعة",
    productDjShare: "حصة DJ بعد رسوم المنصة",
    previewQueue: [
      { name: "Maya", song: "أغنية Afrobeats", artist: "طلب ضيف", amount: "+50 تعزيز", badge: "VIP" },
      { name: "Chris", song: "كلاسيك النادي", artist: "طلب ضيف", amount: "+20 تعزيز", badge: "التالي" },
      { name: "Ari", song: "أغنية ليلية", artist: "طلب ضيف", amount: "+10 تعزيز", badge: "الطابور" },
    ],
    howEyebrow: "كيف يعمل",
    howTitle: "مصمم للقاعة، لا لطابور أمام كشك الـ DJ.",
    platformHighlights: [
      { icon: "📲", title: "امسح رمز QR", body: "يفتح الضيوف صفحة Blackline الخاصة بالـ DJ فوراً من بطاقة الطاولة أو الملصق أو المنشور أو شاشة الهاتف." },
      { icon: "🎵", title: "اطلب أغنية", body: "يبحثون عن أغنية، يضيفون الاسم، ويرسلون الطلب دون الازدحام حول كشك الـ DJ." },
      { icon: "🔥", title: "عزّز الطابور", body: "تساعد الطلبات والتعزيزات المدفوعة الـ DJ على ترتيب أولويات الجمهور مع إبقاء الطابور منظماً مباشرة." },
    ],
    forDjs: "لـ DJs",
    forDjsTitle: "أدر طابور الطلبات من لوحة تحكم مباشرة واحدة.",
    djFeatures: ["طابور طلبات أغاني فوري", "بحث Apple Music مع صور الغلاف", "نظام أولوية VIP boost", "أدوات QR وpromo kit", "تحكم مباشر/غير مباشر وقفل الطلبات", "تتبع الأرباح والسحوبات"],
    monetization: "تحقيق الدخل",
    monetizationTitle: "رسوم منصة بسيطة. أرباح DJ واضحة.",
    platformFee: "رسوم المنصة",
    platformFeeBody: "يحتفظ Blackline بنسبة 10% من طلبات الأغاني المدفوعة. يتم تتبع أرباح DJ في لوحة التحكم بعد رسوم منصة Blackline.",
    trustPoints: ["مسار دفع آمن للضيوف", "رسوم منصة Blackline بنسبة 10%", "يمكن للـ DJ استقبال طلبات مدفوعة قبل التحقق", "السحوبات تُفتح بعد موافقة Blackline"],
    forGuests: "للضيوف",
    forGuestsTitle: "طلبات سريعة وبسيطة واحترافية.",
    forGuestsBody: "يمكن للضيوف البحث عن الأغاني، رؤية حركة الطابور، تعزيز الطلبات الحالية، والاحتفاظ بمرجع الدفع للدعم. التجربة مصممة للهواتف داخل أماكن السهر المزدحمة.",
    important: "مهم",
    disclaimer: "طلبات الأغاني والتعزيزات تدعم الـ DJ وتحسن أولوية الطابور، لكنها لا تضمن تشغيل الأغنية.",
    launchEyebrow: "أطلق صفحة Blackline الخاصة بك",
    launchTitle: "هل أنت جاهز لترقية تجربة الـ DJ؟",
    launchBody: "أنشئ حساب DJ، اضبط رابطك العام، شارك رمز QR، وابدأ في استقبال طلبات أغاني مباشرة مميزة.",
    createAccount: "أنشئ حساب DJ",
    demoEyebrow: "عرض 44 ثانية",
    demoTitle: "شاهد تدفق الطلب الكامل من الضيف إلى الـ DJ.",
    demoBody: "معاينة سريعة لمسح QR وطلبات الأغاني والتعزيزات المدفوعة وتحديثات طابور DJ المباشر وتتبع الأرباح.",
    watchDemoVideo: "▶ شاهد فيديو العرض",
    modalTitle: "شاهد كيف يعمل Blackline",
    close: "✕ إغلاق",
    modalCaption: "يمسح الضيوف رمز QR الخاص بالـ DJ، يطلبون أغنية، يعززون الطابور، ويرى الـ DJ ذلك مباشرة في لوحة التحكم.",
    footerText: "منصة طلبات DJ مباشرة.",
    support: "الدعم",
    djSignup: "تسجيل DJ",
  },
  vi: {
    languageLabel: "Ngôn ngữ",
    heroBadge: "Nền tảng yêu cầu nhạc DJ trực tiếp",
    heroHeadline: "Biến yêu cầu bài hát thành tương tác khán giả có trả phí.",
    heroBody: "Blackline cung cấp cho DJ trang yêu cầu cao cấp, mã QR và bảng điều khiển trực tiếp. Khách yêu cầu bài hát bằng điện thoại, boost hàng đợi và giữ bữa tiệc kết nối mà không chen vào booth DJ.",
    becomeDj: "Trở thành DJ Blackline",
    watchDemo: "Xem demo",
    djLogin: "Đăng nhập DJ",
    trustBadges: ["Thanh toán khách an toàn", "Yêu cầu thời gian thực", "QR sẵn sàng cho sự kiện live"],
    floatingLiveQueue: "Hàng đợi live",
    floatingRequests: "+3 yêu cầu",
    floatingPaidBoost: "Boost trả phí",
    floatingQueueMoved: "Hàng đợi đã tăng 🔥",
    productGuestLive: "Đang live",
    productGuestName: "Yêu cầu từ điện thoại",
    productYourName: "Tên của bạn",
    productSelectedSong: "Bài hát đã chọn",
    productPayRequest: "Thanh toán & yêu cầu",
    productDashboardPreview: "Xem trước dashboard DJ",
    productRequestsArrive: "Yêu cầu đến trực tiếp.",
    productNowPlaying: "Đang phát",
    productRequestedBy: "Yêu cầu bởi Jay",
    productScanToRequest: "Quét để yêu cầu",
    productEarningsTracked: "Doanh thu được theo dõi",
    productDjShare: "Phần DJ sau phí nền tảng",
    previewQueue: [
      { name: "Maya", song: "Afrobeats anthem", artist: "Yêu cầu khách", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Club classic", artist: "Yêu cầu khách", amount: "+20 boost", badge: "Tiếp" },
      { name: "Ari", song: "Hit đêm khuya", artist: "Yêu cầu khách", amount: "+10 boost", badge: "Hàng đợi" },
    ],
    howEyebrow: "Cách hoạt động",
    howTitle: "Dành cho cả không gian, không phải hàng người trước booth.",
    platformHighlights: [
      { icon: "📲", title: "Quét mã QR", body: "Khách mở ngay trang Blackline của DJ từ bảng bàn, sticker, flyer hoặc màn hình điện thoại." },
      { icon: "🎵", title: "Yêu cầu bài hát", body: "Họ tìm bài hát, thêm tên và gửi yêu cầu mà không chen vào booth DJ." },
      { icon: "🔥", title: "Boost hàng đợi", body: "Yêu cầu và boost trả phí giúp DJ ưu tiên khán giả trong khi giữ hàng đợi live gọn gàng." },
    ],
    forDjs: "Cho DJ",
    forDjsTitle: "Quản lý hàng đợi yêu cầu từ một dashboard live.",
    djFeatures: ["Hàng đợi yêu cầu bài hát thời gian thực", "Tìm kiếm Apple Music có artwork", "Hệ thống ưu tiên VIP boost", "Công cụ mã QR và promo kit", "Điều khiển live, offline và khóa yêu cầu", "Theo dõi doanh thu và rút tiền"],
    monetization: "Kiếm tiền",
    monetizationTitle: "Phí nền tảng đơn giản. Doanh thu DJ rõ ràng.",
    platformFee: "Phí nền tảng",
    platformFeeBody: "Blackline giữ 10% từ các yêu cầu bài hát trả phí. Doanh thu DJ được theo dõi trong dashboard sau phí nền tảng Blackline.",
    trustPoints: ["Luồng thanh toán khách an toàn", "Phí nền tảng Blackline 10%", "DJ có thể nhận yêu cầu trả phí trước khi xác minh", "Rút tiền mở sau khi Blackline phê duyệt"],
    forGuests: "Cho khách",
    forGuestsTitle: "Yêu cầu nhanh, đơn giản và cao cấp.",
    forGuestsBody: "Khách có thể tìm bài hát, xem năng lượng hàng đợi, boost yêu cầu hiện có và giữ mã tham chiếu thanh toán để hỗ trợ. Trải nghiệm được thiết kế cho điện thoại trong không gian nightlife đông người.",
    important: "Quan trọng",
    disclaimer: "Yêu cầu bài hát và boost hỗ trợ DJ và tăng ưu tiên hàng đợi, nhưng không đảm bảo bài hát sẽ được phát.",
    launchEyebrow: "Ra mắt trang Blackline của bạn",
    launchTitle: "Sẵn sàng nâng cấp trải nghiệm DJ?",
    launchBody: "Tạo tài khoản DJ, đặt link công khai, chia sẻ mã QR và bắt đầu nhận yêu cầu bài hát live cao cấp.",
    createAccount: "Tạo tài khoản DJ",
    demoEyebrow: "Demo 44 giây",
    demoTitle: "Xem toàn bộ luồng từ khách đến DJ.",
    demoBody: "Xem nhanh quét QR, yêu cầu bài hát, boost trả phí, cập nhật hàng đợi DJ live và theo dõi doanh thu.",
    watchDemoVideo: "▶ Xem video demo",
    modalTitle: "Xem Blackline hoạt động",
    close: "✕ Đóng",
    modalCaption: "Khách quét QR DJ, yêu cầu bài hát, boost hàng đợi và DJ thấy trực tiếp trong dashboard.",
    footerText: "Nền tảng yêu cầu nhạc DJ trực tiếp.",
    support: "Hỗ trợ",
    djSignup: "Đăng ký DJ",
  },
  tl: {
    languageLabel: "Wika",
    heroBadge: "Live DJ Request Platform",
    heroHeadline: "Gawing paid crowd engagement ang song requests.",
    heroBody: "Binibigyan ng Blackline ang DJs ng premium request page, QR code, at live dashboard. Guests request songs gamit ang phone, nagbo-boost ng queue, at nananatiling connected sa party nang hindi nagsisiksikan sa DJ booth.",
    becomeDj: "Maging Blackline DJ",
    watchDemo: "Panoorin ang Demo",
    djLogin: "DJ Login",
    trustBadges: ["Secure guest payments", "Real-time requests", "QR-ready para sa live events"],
    floatingLiveQueue: "Live queue",
    floatingRequests: "+3 requests",
    floatingPaidBoost: "Paid boost",
    floatingQueueMoved: "Umangat ang queue 🔥",
    productGuestLive: "Live ngayon",
    productGuestName: "Request mula sa phone mo",
    productYourName: "Pangalan mo",
    productSelectedSong: "Napiling kanta",
    productPayRequest: "Pay & request",
    productDashboardPreview: "DJ dashboard preview",
    productRequestsArrive: "Dumarating live ang requests.",
    productNowPlaying: "Now playing",
    productRequestedBy: "Requested by Jay",
    productScanToRequest: "Scan to request",
    productEarningsTracked: "Tracked ang earnings",
    productDjShare: "DJ share pagkatapos ng platform fee",
    previewQueue: [
      { name: "Maya", song: "Afrobeats anthem", artist: "Guest request", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Club classic", artist: "Guest request", amount: "+20 boost", badge: "Next" },
      { name: "Ari", song: "Late-night hit", artist: "Guest request", amount: "+10 boost", badge: "Queue" },
    ],
    howEyebrow: "Paano gumagana",
    howTitle: "Ginawa para sa buong room, hindi para sa pila sa booth.",
    platformHighlights: [
      { icon: "📲", title: "I-scan ang QR code", body: "Bubuksan agad ng guests ang Blackline page ng DJ mula sa table tent, sticker, flyer, o phone screen." },
      { icon: "🎵", title: "Mag-request ng kanta", body: "Mag-search sila ng song, ilagay ang pangalan, at ipadala ang request nang hindi nagsisiksikan sa DJ booth." },
      { icon: "🔥", title: "I-boost ang queue", body: "Paid requests at boosts tumutulong sa DJs na i-prioritize ang crowd habang organized ang live queue." },
    ],
    forDjs: "Para sa DJs",
    forDjsTitle: "Patakbuhin ang request queue mula sa isang live dashboard.",
    djFeatures: ["Real-time song request queue", "Apple Music search na may artwork", "VIP boost priority system", "QR code at promo kit tools", "Live, offline, at request-lock controls", "Earnings at withdrawal tracking"],
    monetization: "Monetization",
    monetizationTitle: "Simple platform fee. Malinaw na DJ earnings.",
    platformFee: "Platform fee",
    platformFeeBody: "Kumukuha ang Blackline ng 10% mula sa paid song requests. Na-track ang DJ earnings sa dashboard pagkatapos ng Blackline platform fee.",
    trustPoints: ["Secure guest payment flow", "10% Blackline platform fee", "DJs can receive paid requests before verification", "Withdrawals unlock after Blackline approval"],
    forGuests: "Para sa guests",
    forGuestsTitle: "Mabilis, simple, at premium ang request experience.",
    forGuestsBody: "Puwedeng mag-search ng songs ang guests, makita ang queue energy, i-boost ang existing requests, at itago ang payment reference para sa support. Ginawa ito para sa mobile phones sa busy nightlife spaces.",
    important: "Mahalaga",
    disclaimer: "Song requests at boosts support the DJ and improve queue priority, pero hindi nito ginagarantiya na patutugtugin ang kanta.",
    launchEyebrow: "I-launch ang Blackline page mo",
    launchTitle: "Ready ka na bang i-upgrade ang DJ experience mo?",
    launchBody: "Gumawa ng DJ account, i-set ang public link, i-share ang QR code, at magsimulang tumanggap ng premium live song requests.",
    createAccount: "Gumawa ng DJ Account",
    demoEyebrow: "44-second demo",
    demoTitle: "Panoorin ang buong guest-to-DJ request flow.",
    demoBody: "Quick preview ng QR scanning, song requests, paid boosts, live DJ queue updates, at tracked earnings.",
    watchDemoVideo: "▶ Panoorin ang Demo Video",
    modalTitle: "Tingnan kung paano gumagana ang Blackline",
    close: "✕ Isara",
    modalCaption: "Ini-scan ng guests ang DJ QR code, nagre-request ng kanta, nagbo-boost ng queue, at nakikita ito ng DJ live sa dashboard.",
    footerText: "Live DJ request platform.",
    support: "Support",
    djSignup: "DJ Signup",
  },
  pt: {
    languageLabel: "Idioma",
    heroBadge: "Plataforma de pedidos para DJ ao vivo",
    heroHeadline: "Transforme pedidos de músicas em engajamento pago do público.",
    heroBody: "Blackline oferece aos DJs uma página premium de pedidos, QR code e painel ao vivo. Os convidados pedem músicas pelo celular, impulsionam a fila e mantêm a festa conectada sem lotar a cabine do DJ.",
    becomeDj: "Torne-se um DJ Blackline",
    watchDemo: "Ver demo",
    djLogin: "Login DJ",
    trustBadges: ["Pagamentos seguros dos convidados", "Pedidos em tempo real", "QR pronto para eventos ao vivo"],
    floatingLiveQueue: "Fila ao vivo",
    floatingRequests: "+3 pedidos",
    floatingPaidBoost: "Impulso pago",
    floatingQueueMoved: "Fila subiu 🔥",
    productGuestLive: "Ao vivo agora",
    productGuestName: "Peça pelo celular",
    productYourName: "Seu nome",
    productSelectedSong: "Música selecionada",
    productPayRequest: "Pagar e pedir",
    productDashboardPreview: "Prévia do painel do DJ",
    productRequestsArrive: "Os pedidos chegam ao vivo.",
    productNowPlaying: "Tocando agora",
    productRequestedBy: "Pedido por Jay",
    productScanToRequest: "Escaneie para pedir",
    productEarningsTracked: "Ganhos acompanhados",
    productDjShare: "Parte do DJ após a taxa da plataforma",
    previewQueue: [
      { name: "Maya", song: "Hino Afrobeats", artist: "Pedido de convidado", amount: "+50 impulso", badge: "VIP" },
      { name: "Chris", song: "Clássico da pista", artist: "Pedido de convidado", amount: "+20 impulso", badge: "Próxima" },
      { name: "Ari", song: "Hit da madrugada", artist: "Pedido de convidado", amount: "+10 impulso", badge: "Fila" },
    ],
    howEyebrow: "Como funciona",
    howTitle: "Feito para a pista, não para a fila na cabine.",
    platformHighlights: [
      { icon: "📲", title: "Escaneie o QR code", body: "Os convidados abrem a página Blackline do DJ instantaneamente a partir de um display de mesa, adesivo, flyer ou tela do celular." },
      { icon: "🎵", title: "Peça uma música", body: "Eles buscam uma música, colocam o nome e enviam o pedido sem lotar a cabine do DJ." },
      { icon: "🔥", title: "Impulsione a fila", body: "Pedidos pagos e impulsos ajudam DJs a priorizar o público mantendo a fila organizada ao vivo." },
    ],
    forDjs: "Para DJs",
    forDjsTitle: "Controle a fila de pedidos em um único painel ao vivo.",
    djFeatures: ["Fila de pedidos em tempo real", "Busca Apple Music com capa", "Sistema de prioridade VIP boost", "Ferramentas de QR code e kit promocional", "Controles ao vivo, offline e bloqueio de pedidos", "Acompanhamento de ganhos e saques"],
    monetization: "Monetização",
    monetizationTitle: "Taxa simples. Ganhos claros para o DJ.",
    platformFee: "Taxa da plataforma",
    platformFeeBody: "A Blackline fica com 10% dos pedidos pagos de músicas. Os ganhos do DJ são acompanhados no painel após a taxa da plataforma Blackline.",
    trustPoints: ["Fluxo de pagamento seguro para convidados", "Taxa Blackline de 10%", "DJs podem receber pedidos pagos antes da verificação", "Saques liberados após aprovação da Blackline"],
    forGuests: "Para convidados",
    forGuestsTitle: "Pedidos rápidos, simples e premium.",
    forGuestsBody: "Convidados podem buscar músicas, ver a energia da fila, impulsionar pedidos existentes e guardar a referência de pagamento para suporte. A experiência é feita para celulares em ambientes de nightlife movimentados.",
    important: "Importante",
    disclaimer: "Pedidos de músicas e impulsos apoiam o DJ e melhoram a prioridade na fila, mas não garantem que a música será tocada.",
    launchEyebrow: "Lance sua página Blackline",
    launchTitle: "Pronto para melhorar sua experiência como DJ?",
    launchBody: "Crie sua conta de DJ, defina seu link público, compartilhe seu QR code e comece a aceitar pedidos premium ao vivo.",
    createAccount: "Criar conta de DJ",
    demoEyebrow: "Demo de 44 segundos",
    demoTitle: "Veja o fluxo completo do convidado ao DJ.",
    demoBody: "Uma prévia rápida de QR, pedidos de música, impulsos pagos, atualizações da fila ao vivo e ganhos acompanhados.",
    watchDemoVideo: "▶ Ver vídeo demo",
    modalTitle: "Veja como a Blackline funciona",
    close: "✕ Fechar",
    modalCaption: "Convidados escaneiam o QR do DJ, pedem uma música, impulsionam a fila e o DJ vê tudo ao vivo no painel.",
    footerText: "Plataforma de pedidos para DJ ao vivo.",
    support: "Suporte",
    djSignup: "Cadastro DJ",
  },
  es: {
    languageLabel: "Idioma",
    heroBadge: "Plataforma de solicitudes DJ en vivo",
    heroHeadline: "Convierte las solicitudes de canciones en interacción pagada del público.",
    heroBody: "Blackline da a los DJs una página premium de solicitudes, código QR y panel en vivo. Los invitados piden canciones desde el teléfono, impulsan la fila y mantienen la fiesta conectada sin amontonarse en la cabina del DJ.",
    becomeDj: "Ser DJ de Blackline",
    watchDemo: "Ver demo",
    djLogin: "Login DJ",
    trustBadges: ["Pagos seguros de invitados", "Solicitudes en tiempo real", "QR listo para eventos en vivo"],
    floatingLiveQueue: "Fila en vivo",
    floatingRequests: "+3 solicitudes",
    floatingPaidBoost: "Impulso pagado",
    floatingQueueMoved: "Fila movida 🔥",
    productGuestLive: "En vivo ahora",
    productGuestName: "Solicita desde tu teléfono",
    productYourName: "Tu nombre",
    productSelectedSong: "Canción seleccionada",
    productPayRequest: "Pagar y solicitar",
    productDashboardPreview: "Vista del panel DJ",
    productRequestsArrive: "Las solicitudes llegan en vivo.",
    productNowPlaying: "Sonando ahora",
    productRequestedBy: "Solicitada por Jay",
    productScanToRequest: "Escanea para solicitar",
    productEarningsTracked: "Ganancias registradas",
    productDjShare: "Parte del DJ tras la comisión",
    previewQueue: [
      { name: "Maya", song: "Himno Afrobeats", artist: "Solicitud de invitado", amount: "+50 impulso", badge: "VIP" },
      { name: "Chris", song: "Clásico de club", artist: "Solicitud de invitado", amount: "+20 impulso", badge: "Siguiente" },
      { name: "Ari", song: "Hit nocturno", artist: "Solicitud de invitado", amount: "+10 impulso", badge: "Fila" },
    ],
    howEyebrow: "Cómo funciona",
    howTitle: "Hecho para la sala, no para la fila de la cabina.",
    platformHighlights: [
      { icon: "📲", title: "Escanea el QR", body: "Los invitados abren la página Blackline del DJ al instante desde un tent card, sticker, flyer o pantalla del teléfono." },
      { icon: "🎵", title: "Solicita una canción", body: "Buscan una canción, agregan su nombre y envían la solicitud sin llenar la cabina del DJ." },
      { icon: "🔥", title: "Impulsa la fila", body: "Las solicitudes pagadas e impulsos ayudan al DJ a priorizar al público manteniendo la fila organizada en vivo." },
    ],
    forDjs: "Para DJs",
    forDjsTitle: "Administra la fila de solicitudes desde un panel en vivo.",
    djFeatures: ["Fila de solicitudes en tiempo real", "Búsqueda de Apple Music con portada", "Sistema de prioridad VIP boost", "Herramientas QR y promo kit", "Controles en vivo, offline y bloqueo de solicitudes", "Seguimiento de ganancias y retiros"],
    monetization: "Monetización",
    monetizationTitle: "Comisión simple. Ganancias claras para el DJ.",
    platformFee: "Comisión de plataforma",
    platformFeeBody: "Blackline conserva el 10% de las solicitudes pagadas. Las ganancias del DJ se registran en el panel después de la comisión de Blackline.",
    trustPoints: ["Flujo de pago seguro para invitados", "10% de comisión Blackline", "Los DJs pueden recibir solicitudes pagadas antes de la verificación", "Los retiros se desbloquean tras aprobación de Blackline"],
    forGuests: "Para invitados",
    forGuestsTitle: "Solicitudes rápidas, simples y premium.",
    forGuestsBody: "Los invitados pueden buscar canciones, ver la energía de la fila, impulsar solicitudes existentes y guardar su referencia de pago para soporte. La experiencia está diseñada para teléfonos en espacios nocturnos concurridos.",
    important: "Importante",
    disclaimer: "Las solicitudes e impulsos apoyan al DJ y mejoran la prioridad en la fila, pero no garantizan que una canción sea reproducida.",
    launchEyebrow: "Lanza tu página Blackline",
    launchTitle: "¿Listo para mejorar tu experiencia DJ?",
    launchBody: "Crea tu cuenta DJ, configura tu enlace público, comparte tu QR y empieza a aceptar solicitudes premium en vivo.",
    createAccount: "Crear cuenta DJ",
    demoEyebrow: "Demo de 44 segundos",
    demoTitle: "Mira el flujo completo de invitado a DJ.",
    demoBody: "Una vista rápida de escaneo QR, solicitudes, impulsos pagados, actualizaciones de fila en vivo y ganancias registradas.",
    watchDemoVideo: "▶ Ver video demo",
    modalTitle: "Mira cómo funciona Blackline",
    close: "✕ Cerrar",
    modalCaption: "Los invitados escanean el QR del DJ, solicitan una canción, impulsan la fila y el DJ lo ve en vivo en el panel.",
    footerText: "Plataforma de solicitudes DJ en vivo.",
    support: "Soporte",
    djSignup: "Registro DJ",
  },
  fr: {
    languageLabel: "Langue",
    heroBadge: "Plateforme de demandes DJ en direct",
    heroHeadline: "Transformez les demandes de morceaux en engagement payant du public.",
    heroBody: "Blackline offre aux DJs une page de demandes premium, un QR code et un tableau de bord live. Les invités demandent des morceaux depuis leur téléphone, boostent la file et restent connectés à la soirée sans encombrer la cabine DJ.",
    becomeDj: "Devenir DJ Blackline",
    watchDemo: "Voir la démo",
    djLogin: "Connexion DJ",
    trustBadges: ["Paiements invités sécurisés", "Demandes en temps réel", "QR prêt pour événements live"],
    floatingLiveQueue: "File live",
    floatingRequests: "+3 demandes",
    floatingPaidBoost: "Boost payé",
    floatingQueueMoved: "File déplacée 🔥",
    productGuestLive: "En direct",
    productGuestName: "Demandez depuis votre téléphone",
    productYourName: "Votre nom",
    productSelectedSong: "Morceau sélectionné",
    productPayRequest: "Payer et demander",
    productDashboardPreview: "Aperçu tableau DJ",
    productRequestsArrive: "Les demandes arrivent en direct.",
    productNowPlaying: "En lecture",
    productRequestedBy: "Demandé par Jay",
    productScanToRequest: "Scanner pour demander",
    productEarningsTracked: "Revenus suivis",
    productDjShare: "Part DJ après frais de plateforme",
    previewQueue: [
      { name: "Maya", song: "Hymne Afrobeats", artist: "Demande invité", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Classique club", artist: "Demande invité", amount: "+20 boost", badge: "Suivant" },
      { name: "Ari", song: "Hit de nuit", artist: "Demande invité", amount: "+10 boost", badge: "File" },
    ],
    howEyebrow: "Comment ça marche",
    howTitle: "Conçu pour la salle, pas pour la file devant la cabine.",
    platformHighlights: [
      { icon: "📲", title: "Scannez le QR code", body: "Les invités ouvrent instantanément la page Blackline du DJ depuis un support de table, un sticker, un flyer ou un écran de téléphone." },
      { icon: "🎵", title: "Demandez un morceau", body: "Ils recherchent un titre, ajoutent leur nom et envoient la demande sans encombrer la cabine DJ." },
      { icon: "🔥", title: "Boostez la file", body: "Les demandes payées et boosts aident les DJs à prioriser le public tout en gardant la file organisée en direct." },
    ],
    forDjs: "Pour DJs",
    forDjsTitle: "Gérez la file de demandes depuis un tableau de bord live.",
    djFeatures: ["File de demandes en temps réel", "Recherche Apple Music avec artwork", "Système de priorité VIP boost", "Outils QR code et kit promo", "Contrôles live, offline et verrouillage des demandes", "Suivi des revenus et retraits"],
    monetization: "Monétisation",
    monetizationTitle: "Frais simples. Revenus DJ clairs.",
    platformFee: "Frais de plateforme",
    platformFeeBody: "Blackline conserve 10% des demandes payées. Les revenus DJ sont suivis dans le tableau de bord après les frais de plateforme Blackline.",
    trustPoints: ["Parcours de paiement invité sécurisé", "10% de frais Blackline", "Les DJs peuvent recevoir des demandes payées avant vérification", "Les retraits sont débloqués après approbation Blackline"],
    forGuests: "Pour les invités",
    forGuestsTitle: "Une expérience rapide, simple et premium.",
    forGuestsBody: "Les invités peuvent rechercher des morceaux, voir l’énergie de la file, booster des demandes existantes et conserver leur référence de paiement pour le support. L’expérience est pensée pour les téléphones dans les lieux nocturnes très fréquentés.",
    important: "Important",
    disclaimer: "Les demandes et boosts soutiennent le DJ et améliorent la priorité dans la file, mais ne garantissent pas qu’un morceau sera joué.",
    launchEyebrow: "Lancez votre page Blackline",
    launchTitle: "Prêt à améliorer votre expérience DJ ?",
    launchBody: "Créez votre compte DJ, définissez votre lien public, partagez votre QR code et commencez à accepter des demandes live premium.",
    createAccount: "Créer un compte DJ",
    demoEyebrow: "Démo de 44 secondes",
    demoTitle: "Regardez le parcours complet invité-DJ.",
    demoBody: "Aperçu rapide du scan QR, demandes de morceaux, boosts payés, mises à jour de file live et revenus suivis.",
    watchDemoVideo: "▶ Voir la vidéo démo",
    modalTitle: "Voyez comment Blackline fonctionne",
    close: "✕ Fermer",
    modalCaption: "Les invités scannent le QR du DJ, demandent un morceau, boostent la file et le DJ le voit en direct dans le tableau de bord.",
    footerText: "Plateforme de demandes DJ en direct.",
    support: "Support",
    djSignup: "Inscription DJ",
  },
  de: {
    languageLabel: "Sprache",
    heroBadge: "Live-DJ-Wunschplattform",
    heroHeadline: "Verwandle Musikwünsche in bezahlte Crowd-Interaktion.",
    heroBody: "Blackline gibt DJs eine Premium-Wunschseite, QR-Code und Live-Dashboard. Gäste wünschen Songs per Handy, boosten die Warteschlange und bleiben mit der Party verbunden, ohne den DJ-Booth zu überfüllen.",
    becomeDj: "Blackline DJ werden",
    watchDemo: "Demo ansehen",
    djLogin: "DJ Login",
    trustBadges: ["Sichere Gastzahlungen", "Echtzeit-Wünsche", "QR-ready für Live-Events"],
    floatingLiveQueue: "Live-Warteschlange",
    floatingRequests: "+3 Wünsche",
    floatingPaidBoost: "Bezahlter Boost",
    floatingQueueMoved: "Queue verschoben 🔥",
    productGuestLive: "Jetzt live",
    productGuestName: "Per Handy wünschen",
    productYourName: "Dein Name",
    productSelectedSong: "Ausgewählter Song",
    productPayRequest: "Bezahlen & wünschen",
    productDashboardPreview: "DJ-Dashboard Vorschau",
    productRequestsArrive: "Wünsche kommen live an.",
    productNowPlaying: "Läuft gerade",
    productRequestedBy: "Gewünscht von Jay",
    productScanToRequest: "Scannen zum Wünschen",
    productEarningsTracked: "Einnahmen verfolgt",
    productDjShare: "DJ-Anteil nach Plattformgebühr",
    previewQueue: [
      { name: "Maya", song: "Afrobeats Hymne", artist: "Gastwunsch", amount: "+50 Boost", badge: "VIP" },
      { name: "Chris", song: "Club-Klassiker", artist: "Gastwunsch", amount: "+20 Boost", badge: "Nächster" },
      { name: "Ari", song: "Late-night Hit", artist: "Gastwunsch", amount: "+10 Boost", badge: "Queue" },
    ],
    howEyebrow: "So funktioniert es",
    howTitle: "Für den Raum gebaut, nicht für die Schlange am Booth.",
    platformHighlights: [
      { icon: "📲", title: "QR-Code scannen", body: "Gäste öffnen die Blackline-Seite des DJs sofort über Tischaufsteller, Sticker, Flyer oder Handybildschirm." },
      { icon: "🎵", title: "Song wünschen", body: "Sie suchen einen Song, fügen ihren Namen hinzu und senden den Wunsch, ohne den DJ-Booth zu überfüllen." },
      { icon: "🔥", title: "Queue boosten", body: "Bezahlte Wünsche und Boosts helfen DJs, die Crowd zu priorisieren und die Queue live organisiert zu halten." },
    ],
    forDjs: "Für DJs",
    forDjsTitle: "Steuere die Wunsch-Queue über ein Live-Dashboard.",
    djFeatures: ["Echtzeit-Songwunsch-Queue", "Apple Music Suche mit Artwork", "VIP-Boost-Prioritätssystem", "QR-Code- und Promo-Kit-Tools", "Live-, Offline- und Request-Lock-Steuerung", "Einnahmen- und Auszahlungsverfolgung"],
    monetization: "Monetarisierung",
    monetizationTitle: "Einfache Plattformgebühr. Klare DJ-Einnahmen.",
    platformFee: "Plattformgebühr",
    platformFeeBody: "Blackline behält 10% der bezahlten Songwünsche. DJ-Einnahmen werden nach der Blackline-Plattformgebühr im Dashboard verfolgt.",
    trustPoints: ["Sicherer Zahlungsablauf für Gäste", "10% Blackline-Plattformgebühr", "DJs können vor der Verifizierung bezahlte Wünsche erhalten", "Auszahlungen werden nach Blackline-Genehmigung freigeschaltet"],
    forGuests: "Für Gäste",
    forGuestsTitle: "Wünsche fühlen sich schnell, einfach und premium an.",
    forGuestsBody: "Gäste können Songs suchen, Queue-Energie sehen, vorhandene Wünsche boosten und ihre Zahlungsreferenz für Support behalten. Die Erfahrung ist für Handys in vollen Nightlife-Räumen gestaltet.",
    important: "Wichtig",
    disclaimer: "Songwünsche und Boosts unterstützen den DJ und verbessern die Queue-Priorität, garantieren aber nicht, dass ein Song gespielt wird.",
    launchEyebrow: "Starte deine Blackline-Seite",
    launchTitle: "Bereit, dein DJ-Erlebnis zu verbessern?",
    launchBody: "Erstelle dein DJ-Konto, setze deinen öffentlichen Link, teile deinen QR-Code und akzeptiere Premium-Live-Songwünsche.",
    createAccount: "DJ-Konto erstellen",
    demoEyebrow: "44-Sekunden-Demo",
    demoTitle: "Sieh den kompletten Gast-zu-DJ-Flow.",
    demoBody: "Schnelle Vorschau auf QR-Scan, Songwünsche, bezahlte Boosts, Live-Queue-Updates und verfolgte Einnahmen.",
    watchDemoVideo: "▶ Demo-Video ansehen",
    modalTitle: "So funktioniert Blackline",
    close: "✕ Schließen",
    modalCaption: "Gäste scannen den DJ-QR-Code, wünschen einen Song, boosten die Queue und der DJ sieht es live im Dashboard.",
    footerText: "Live-DJ-Wunschplattform.",
    support: "Support",
    djSignup: "DJ Anmeldung",
  },
  ru: {
    languageLabel: "Язык",
    heroBadge: "Платформа живых DJ-заявок",
    heroHeadline: "Превратите заявки на треки в платное вовлечение публики.",
    heroBody: "Blackline дает DJ премиальную страницу заявок, QR-код и живую панель. Гости заказывают треки с телефона, поднимают очередь бустами и остаются вовлеченными, не толпясь у DJ-кабины.",
    becomeDj: "Стать Blackline DJ",
    watchDemo: "Смотреть демо",
    djLogin: "Вход DJ",
    trustBadges: ["Безопасные платежи гостей", "Заявки в реальном времени", "QR для live-ивентов"],
    floatingLiveQueue: "Живая очередь",
    floatingRequests: "+3 заявки",
    floatingPaidBoost: "Платный буст",
    floatingQueueMoved: "Очередь поднята 🔥",
    productGuestLive: "Сейчас live",
    productGuestName: "Заказывайте с телефона",
    productYourName: "Ваше имя",
    productSelectedSong: "Выбранный трек",
    productPayRequest: "Оплатить и заказать",
    productDashboardPreview: "Превью панели DJ",
    productRequestsArrive: "Заявки приходят live.",
    productNowPlaying: "Сейчас играет",
    productRequestedBy: "Заказал Jay",
    productScanToRequest: "Сканируйте для заявки",
    productEarningsTracked: "Доходы отслеживаются",
    productDjShare: "Доля DJ после комиссии платформы",
    previewQueue: [
      { name: "Maya", song: "Afrobeats anthem", artist: "Заявка гостя", amount: "+50 буст", badge: "VIP" },
      { name: "Chris", song: "Клубная классика", artist: "Заявка гостя", amount: "+20 буст", badge: "Далее" },
      { name: "Ari", song: "Ночной хит", artist: "Заявка гостя", amount: "+10 буст", badge: "Очередь" },
    ],
    howEyebrow: "Как это работает",
    howTitle: "Создано для всего зала, а не для очереди у DJ-кабины.",
    platformHighlights: [
      { icon: "📲", title: "Сканируйте QR", body: "Гости мгновенно открывают страницу DJ в Blackline с тейбл-тента, стикера, флаера или экрана телефона." },
      { icon: "🎵", title: "Закажите трек", body: "Они ищут трек, добавляют имя и отправляют заявку, не толпясь у DJ-кабины." },
      { icon: "🔥", title: "Буст очереди", body: "Платные заявки и бусты помогают DJ расставлять приоритеты и держать очередь организованной live." },
    ],
    forDjs: "Для DJs",
    forDjsTitle: "Управляйте очередью заявок из одной live-панели.",
    djFeatures: ["Очередь заявок в реальном времени", "Поиск Apple Music с обложками", "VIP boost priority system", "Инструменты QR и promo kit", "Live/offline/request-lock контроль", "Отслеживание доходов и выводов"],
    monetization: "Монетизация",
    monetizationTitle: "Простая комиссия. Прозрачные доходы DJ.",
    platformFee: "Комиссия платформы",
    platformFeeBody: "Blackline удерживает 10% с платных заявок. Доходы DJ отслеживаются в панели после комиссии Blackline.",
    trustPoints: ["Безопасный платежный поток для гостей", "10% комиссия Blackline", "DJs могут получать платные заявки до верификации", "Выводы открываются после одобрения Blackline"],
    forGuests: "Для гостей",
    forGuestsTitle: "Заявки быстрые, простые и премиальные.",
    forGuestsBody: "Гости могут искать треки, видеть энергию очереди, бустить существующие заявки и сохранять платежную ссылку для поддержки. Опыт создан для телефонов в оживленных nightlife-пространствах.",
    important: "Важно",
    disclaimer: "Заявки и бусты поддерживают DJ и повышают приоритет в очереди, но не гарантируют, что трек будет сыгран.",
    launchEyebrow: "Запустите страницу Blackline",
    launchTitle: "Готовы улучшить DJ-опыт?",
    launchBody: "Создайте DJ-аккаунт, настройте публичную ссылку, поделитесь QR-кодом и начните принимать премиальные live-заявки.",
    createAccount: "Создать DJ-аккаунт",
    demoEyebrow: "44-секундное демо",
    demoTitle: "Посмотрите полный путь от гостя до DJ.",
    demoBody: "Краткий обзор QR-скана, заявок, платных бустов, live-очереди DJ и отслеживания доходов.",
    watchDemoVideo: "▶ Смотреть демо-видео",
    modalTitle: "Как работает Blackline",
    close: "✕ Закрыть",
    modalCaption: "Гости сканируют QR DJ, заказывают трек, бустят очередь, а DJ видит это live в панели.",
    footerText: "Платформа живых DJ-заявок.",
    support: "Поддержка",
    djSignup: "Регистрация DJ",
  },
  tr: {
    languageLabel: "Dil",
    heroBadge: "Canlı DJ İstek Platformu",
    heroHeadline: "Şarkı isteklerini ücretli kitle etkileşimine dönüştürün.",
    heroBody: "Blackline DJ’lere premium istek sayfası, QR kodu ve canlı panel verir. Misafirler telefondan şarkı ister, sırayı boost eder ve DJ kabinine yığılmadan partiyle bağlı kalır.",
    becomeDj: "Blackline DJ Ol",
    watchDemo: "Demoyu İzle",
    djLogin: "DJ Girişi",
    trustBadges: ["Güvenli misafir ödemeleri", "Gerçek zamanlı istekler", "Canlı etkinlikler için QR hazır"],
    floatingLiveQueue: "Canlı sıra",
    floatingRequests: "+3 istek",
    floatingPaidBoost: "Ücretli boost",
    floatingQueueMoved: "Sıra yükseldi 🔥",
    productGuestLive: "Şu an live",
    productGuestName: "Telefondan istek gönder",
    productYourName: "Adınız",
    productSelectedSong: "Seçilen şarkı",
    productPayRequest: "Öde ve iste",
    productDashboardPreview: "DJ panel önizleme",
    productRequestsArrive: "İstekler canlı gelir.",
    productNowPlaying: "Şimdi çalıyor",
    productRequestedBy: "Jay istedi",
    productScanToRequest: "İstek için tara",
    productEarningsTracked: "Kazançlar takip edilir",
    productDjShare: "Platform ücreti sonrası DJ payı",
    previewQueue: [
      { name: "Maya", song: "Afrobeats marşı", artist: "Misafir isteği", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Kulüp klasiği", artist: "Misafir isteği", amount: "+20 boost", badge: "Sıradaki" },
      { name: "Ari", song: "Gece hiti", artist: "Misafir isteği", amount: "+10 boost", badge: "Sıra" },
    ],
    howEyebrow: "Nasıl çalışır",
    howTitle: "DJ kabini kuyruğu için değil, tüm mekan için tasarlandı.",
    platformHighlights: [
      { icon: "📲", title: "QR kodu tara", body: "Misafirler DJ’in Blackline sayfasını masa kartı, sticker, flyer veya telefon ekranından anında açar." },
      { icon: "🎵", title: "Şarkı iste", body: "Şarkı arar, adını ekler ve DJ kabinine yığılmadan isteği gönderir." },
      { icon: "🔥", title: "Sırayı boost et", body: "Ücretli istekler ve boostlar DJ’in kalabalığı önceliklendirmesine ve sırayı canlı düzenli tutmasına yardımcı olur." },
    ],
    forDjs: "DJ’ler için",
    forDjsTitle: "İstek sırasını tek bir canlı panelden yönetin.",
    djFeatures: ["Gerçek zamanlı şarkı istek sırası", "Artwork ile Apple Music araması", "VIP boost öncelik sistemi", "QR kodu ve promo kit araçları", "Live, offline ve istek kilidi kontrolleri", "Kazanç ve çekim takibi"],
    monetization: "Gelir modeli",
    monetizationTitle: "Basit platform ücreti. Net DJ kazançları.",
    platformFee: "Platform ücreti",
    platformFeeBody: "Blackline ücretli şarkı isteklerinden %10 alır. DJ kazançları Blackline platform ücreti sonrası panelde takip edilir.",
    trustPoints: ["Güvenli misafir ödeme akışı", "%10 Blackline platform ücreti", "DJ’ler doğrulamadan önce ücretli istek alabilir", "Para çekme Blackline onayından sonra açılır"],
    forGuests: "Misafirler için",
    forGuestsTitle: "İstekler hızlı, basit ve premium hissettirir.",
    forGuestsBody: "Misafirler şarkı arayabilir, sıra enerjisini görebilir, mevcut istekleri boost edebilir ve destek için ödeme referansını saklayabilir. Deneyim yoğun nightlife alanlarında telefon kullanımı için tasarlandı.",
    important: "Önemli",
    disclaimer: "Şarkı istekleri ve boostlar DJ’i destekler ve sıra önceliğini artırır, ancak şarkının çalınacağını garanti etmez.",
    launchEyebrow: "Blackline sayfanı başlat",
    launchTitle: "DJ deneyimini yükseltmeye hazır mısın?",
    launchBody: "DJ hesabını oluştur, public linkini ayarla, QR kodunu paylaş ve premium canlı şarkı istekleri almaya başla.",
    createAccount: "DJ Hesabı Oluştur",
    demoEyebrow: "44 saniyelik demo",
    demoTitle: "Misafirden DJ’e tüm istek akışını izle.",
    demoBody: "QR tarama, şarkı istekleri, ücretli boostlar, canlı DJ sıra güncellemeleri ve kazanç takibinin hızlı önizlemesi.",
    watchDemoVideo: "▶ Demo Videosunu İzle",
    modalTitle: "Blackline nasıl çalışır",
    close: "✕ Kapat",
    modalCaption: "Misafirler DJ QR kodunu tarar, şarkı ister, sırayı boost eder ve DJ bunu panelde canlı görür.",
    footerText: "Canlı DJ istek platformu.",
    support: "Destek",
    djSignup: "DJ Kayıt",
  },
  it: {
    languageLabel: "Lingua",
    heroBadge: "Piattaforma richieste DJ live",
    heroHeadline: "Trasforma le richieste di brani in coinvolgimento pagato del pubblico.",
    heroBody: "Blackline offre ai DJ una pagina richieste premium, QR code e dashboard live. Gli ospiti richiedono brani dal telefono, boostano la coda e restano connessi alla festa senza affollare la consolle.",
    becomeDj: "Diventa un DJ Blackline",
    watchDemo: "Guarda demo",
    djLogin: "Login DJ",
    trustBadges: ["Pagamenti ospiti sicuri", "Richieste in tempo reale", "QR pronto per eventi live"],
    floatingLiveQueue: "Coda live",
    floatingRequests: "+3 richieste",
    floatingPaidBoost: "Boost pagato",
    floatingQueueMoved: "Coda salita 🔥",
    productGuestLive: "Live ora",
    productGuestName: "Richiedi dal telefono",
    productYourName: "Il tuo nome",
    productSelectedSong: "Brano selezionato",
    productPayRequest: "Paga e richiedi",
    productDashboardPreview: "Anteprima dashboard DJ",
    productRequestsArrive: "Le richieste arrivano live.",
    productNowPlaying: "In riproduzione",
    productRequestedBy: "Richiesto da Jay",
    productScanToRequest: "Scansiona per richiedere",
    productEarningsTracked: "Guadagni tracciati",
    productDjShare: "Quota DJ dopo fee piattaforma",
    previewQueue: [
      { name: "Maya", song: "Inno Afrobeats", artist: "Richiesta ospite", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Classico club", artist: "Richiesta ospite", amount: "+20 boost", badge: "Prossimo" },
      { name: "Ari", song: "Hit notturna", artist: "Richiesta ospite", amount: "+10 boost", badge: "Coda" },
    ],
    howEyebrow: "Come funziona",
    howTitle: "Creato per la sala, non per la fila alla consolle.",
    platformHighlights: [
      { icon: "📲", title: "Scansiona il QR", body: "Gli ospiti aprono subito la pagina Blackline del DJ da table tent, sticker, flyer o schermo del telefono." },
      { icon: "🎵", title: "Richiedi un brano", body: "Cercano un brano, aggiungono il nome e inviano la richiesta senza affollare la consolle." },
      { icon: "🔥", title: "Boosta la coda", body: "Richieste pagate e boost aiutano i DJ a dare priorità al pubblico mantenendo ordinata la coda live." },
    ],
    forDjs: "Per DJ",
    forDjsTitle: "Gestisci la coda richieste da una dashboard live.",
    djFeatures: ["Coda richieste in tempo reale", "Ricerca Apple Music con artwork", "Sistema priorità VIP boost", "Strumenti QR code e promo kit", "Controlli live, offline e blocco richieste", "Tracking guadagni e prelievi"],
    monetization: "Monetizzazione",
    monetizationTitle: "Fee semplice. Guadagni DJ chiari.",
    platformFee: "Fee piattaforma",
    platformFeeBody: "Blackline trattiene il 10% delle richieste pagate. I guadagni DJ sono tracciati in dashboard dopo la fee Blackline.",
    trustPoints: ["Flusso pagamento ospiti sicuro", "10% fee Blackline", "I DJ possono ricevere richieste pagate prima della verifica", "Prelievi sbloccati dopo approvazione Blackline"],
    forGuests: "Per ospiti",
    forGuestsTitle: "Richieste rapide, semplici e premium.",
    forGuestsBody: "Gli ospiti possono cercare brani, vedere l’energia della coda, boostare richieste esistenti e conservare il riferimento di pagamento per il supporto. L’esperienza è pensata per telefoni in locali affollati.",
    important: "Importante",
    disclaimer: "Richieste e boost supportano il DJ e migliorano la priorità in coda, ma non garantiscono che un brano venga suonato.",
    launchEyebrow: "Lancia la tua pagina Blackline",
    launchTitle: "Pronto a migliorare la tua esperienza DJ?",
    launchBody: "Crea il tuo account DJ, imposta il link pubblico, condividi il QR code e inizia ad accettare richieste live premium.",
    createAccount: "Crea account DJ",
    demoEyebrow: "Demo di 44 secondi",
    demoTitle: "Guarda il flusso completo ospite-DJ.",
    demoBody: "Anteprima rapida di QR scan, richieste brani, boost pagati, aggiornamenti coda DJ live e guadagni tracciati.",
    watchDemoVideo: "▶ Guarda video demo",
    modalTitle: "Guarda come funziona Blackline",
    close: "✕ Chiudi",
    modalCaption: "Gli ospiti scansionano il QR del DJ, richiedono un brano, boostano la coda e il DJ lo vede live nella dashboard.",
    footerText: "Piattaforma richieste DJ live.",
    support: "Supporto",
    djSignup: "Registrazione DJ",
  },
  nl: {
    languageLabel: "Taal",
    heroBadge: "Live DJ-verzoekplatform",
    heroHeadline: "Maak van song requests betaalde crowd engagement.",
    heroBody: "Blackline geeft DJs een premium verzoekpagina, QR-code en live dashboard. Gasten vragen nummers aan via hun telefoon, boosten de wachtrij en blijven verbonden met het feest zonder de DJ booth te blokkeren.",
    becomeDj: "Word Blackline DJ",
    watchDemo: "Demo bekijken",
    djLogin: "DJ Login",
    trustBadges: ["Veilige gastbetalingen", "Realtime verzoeken", "QR-ready voor live events"],
    floatingLiveQueue: "Live wachtrij",
    floatingRequests: "+3 verzoeken",
    floatingPaidBoost: "Betaalde boost",
    floatingQueueMoved: "Wachtrij omhoog 🔥",
    productGuestLive: "Nu live",
    productGuestName: "Vraag aan vanaf je telefoon",
    productYourName: "Je naam",
    productSelectedSong: "Gekozen nummer",
    productPayRequest: "Betaal & request",
    productDashboardPreview: "DJ dashboard preview",
    productRequestsArrive: "Verzoeken komen live binnen.",
    productNowPlaying: "Nu speelt",
    productRequestedBy: "Aangevraagd door Jay",
    productScanToRequest: "Scan om aan te vragen",
    productEarningsTracked: "Inkomsten bijgehouden",
    productDjShare: "DJ-aandeel na platformfee",
    previewQueue: [
      { name: "Maya", song: "Afrobeats anthem", artist: "Gastverzoek", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Club classic", artist: "Gastverzoek", amount: "+20 boost", badge: "Volgende" },
      { name: "Ari", song: "Late-night hit", artist: "Gastverzoek", amount: "+10 boost", badge: "Wachtrij" },
    ],
    howEyebrow: "Hoe het werkt",
    howTitle: "Gebouwd voor de zaal, niet voor de rij bij de booth.",
    platformHighlights: [
      { icon: "📲", title: "Scan de QR-code", body: "Gasten openen direct de Blackline-pagina van de DJ via tafelbordje, sticker, flyer of telefoonscherm." },
      { icon: "🎵", title: "Vraag een nummer aan", body: "Ze zoeken een nummer, voegen hun naam toe en sturen de request zonder de DJ booth te blokkeren." },
      { icon: "🔥", title: "Boost de wachtrij", body: "Betaalde verzoeken en boosts helpen DJs de crowd te prioriteren terwijl de live wachtrij georganiseerd blijft." },
    ],
    forDjs: "Voor DJs",
    forDjsTitle: "Beheer de request queue vanuit één live dashboard.",
    djFeatures: ["Realtime song request queue", "Apple Music zoeken met artwork", "VIP boost priority system", "QR-code en promo kit tools", "Live, offline en request-lock controls", "Inkomsten en uitbetalingen volgen"],
    monetization: "Monetisatie",
    monetizationTitle: "Simpele platformfee. Duidelijke DJ-inkomsten.",
    platformFee: "Platformfee",
    platformFeeBody: "Blackline houdt 10% van betaalde song requests. DJ-inkomsten worden in het dashboard gevolgd na de Blackline platformfee.",
    trustPoints: ["Veilige betaalflow voor gasten", "10% Blackline platformfee", "DJs kunnen betaalde requests ontvangen vóór verificatie", "Uitbetalingen openen na Blackline-goedkeuring"],
    forGuests: "Voor gasten",
    forGuestsTitle: "Requests voelen snel, simpel en premium.",
    forGuestsBody: "Gasten kunnen nummers zoeken, de energie van de wachtrij zien, bestaande requests boosten en hun betalingsreferentie bewaren voor support. De ervaring is ontworpen voor telefoons in drukke nightlife ruimtes.",
    important: "Belangrijk",
    disclaimer: "Song requests en boosts ondersteunen de DJ en verbeteren de prioriteit in de wachtrij, maar garanderen niet dat een nummer wordt gespeeld.",
    launchEyebrow: "Start je Blackline-pagina",
    launchTitle: "Klaar om je DJ-ervaring te upgraden?",
    launchBody: "Maak je DJ-account, stel je publieke link in, deel je QR-code en accepteer premium live song requests.",
    createAccount: "DJ-account maken",
    demoEyebrow: "Demo van 44 seconden",
    demoTitle: "Bekijk de volledige flow van gast naar DJ.",
    demoBody: "Een snelle preview van QR-scannen, song requests, betaalde boosts, live DJ queue updates en bijgehouden inkomsten.",
    watchDemoVideo: "▶ Demo video bekijken",
    modalTitle: "Zie hoe Blackline werkt",
    close: "✕ Sluiten",
    modalCaption: "Gasten scannen de DJ QR-code, vragen een nummer aan, boosten de wachtrij en de DJ ziet het live in het dashboard.",
    footerText: "Live DJ-verzoekplatform.",
    support: "Support",
    djSignup: "DJ aanmelden",
  },
  pl: {
    languageLabel: "Język",
    heroBadge: "Platforma live requestów DJ",
    heroHeadline: "Zamień prośby o utwory w płatne zaangażowanie publiczności.",
    heroBody: "Blackline daje DJ-om premium stronę requestów, kod QR i panel live. Goście proszą o utwory z telefonu, boostują kolejkę i pozostają połączeni z imprezą bez tłoczenia się przy DJ booth.",
    becomeDj: "Zostań Blackline DJ",
    watchDemo: "Zobacz demo",
    djLogin: "Logowanie DJ",
    trustBadges: ["Bezpieczne płatności gości", "Requesty w czasie rzeczywistym", "QR gotowy na live eventy"],
    floatingLiveQueue: "Kolejka live",
    floatingRequests: "+3 requesty",
    floatingPaidBoost: "Płatny boost",
    floatingQueueMoved: "Kolejka podniesiona 🔥",
    productGuestLive: "Teraz live",
    productGuestName: "Request z telefonu",
    productYourName: "Twoje imię",
    productSelectedSong: "Wybrany utwór",
    productPayRequest: "Zapłać i poproś",
    productDashboardPreview: "Podgląd panelu DJ",
    productRequestsArrive: "Requesty przychodzą live.",
    productNowPlaying: "Teraz gra",
    productRequestedBy: "Request od Jay",
    productScanToRequest: "Zeskanuj, aby poprosić",
    productEarningsTracked: "Zarobki śledzone",
    productDjShare: "Udział DJ po opłacie platformy",
    previewQueue: [
      { name: "Maya", song: "Afrobeats anthem", artist: "Request gościa", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Klubowy klasyk", artist: "Request gościa", amount: "+20 boost", badge: "Następny" },
      { name: "Ari", song: "Nocny hit", artist: "Request gościa", amount: "+10 boost", badge: "Kolejka" },
    ],
    howEyebrow: "Jak to działa",
    howTitle: "Stworzone dla całej sali, nie dla kolejki przy DJ booth.",
    platformHighlights: [
      { icon: "📲", title: "Zeskanuj QR", body: "Goście natychmiast otwierają stronę Blackline DJ-a z table tent, naklejki, flyera albo ekranu telefonu." },
      { icon: "🎵", title: "Poproś o utwór", body: "Szukają utworu, dodają imię i wysyłają request bez tłoczenia się przy DJ booth." },
      { icon: "🔥", title: "Boostuj kolejkę", body: "Płatne requesty i boosty pomagają DJ-om priorytetyzować publiczność i utrzymać kolejkę live w porządku." },
    ],
    forDjs: "Dla DJ-ów",
    forDjsTitle: "Prowadź kolejkę requestów z jednego panelu live.",
    djFeatures: ["Kolejka requestów w czasie rzeczywistym", "Wyszukiwanie Apple Music z okładką", "System priorytetu VIP boost", "Narzędzia QR i promo kit", "Kontrola live, offline i blokady requestów", "Śledzenie zarobków i wypłat"],
    monetization: "Monetyzacja",
    monetizationTitle: "Prosta opłata platformy. Jasne zarobki DJ.",
    platformFee: "Opłata platformy",
    platformFeeBody: "Blackline zatrzymuje 10% płatnych requestów. Zarobki DJ są śledzone w panelu po opłacie platformy Blackline.",
    trustPoints: ["Bezpieczny przepływ płatności gościa", "10% opłaty Blackline", "DJs mogą otrzymywać płatne requesty przed weryfikacją", "Wypłaty odblokowane po akceptacji Blackline"],
    forGuests: "Dla gości",
    forGuestsTitle: "Requesty są szybkie, proste i premium.",
    forGuestsBody: "Goście mogą szukać utworów, widzieć energię kolejki, boostować istniejące requesty i zachować referencję płatności do supportu. Doświadczenie zaprojektowano dla telefonów w zatłoczonych przestrzeniach nightlife.",
    important: "Ważne",
    disclaimer: "Requesty i boosty wspierają DJ-a i poprawiają priorytet w kolejce, ale nie gwarantują odtworzenia utworu.",
    launchEyebrow: "Uruchom swoją stronę Blackline",
    launchTitle: "Gotowy ulepszyć doświadczenie DJ?",
    launchBody: "Utwórz konto DJ, ustaw publiczny link, udostępnij QR i zacznij przyjmować premium live requesty.",
    createAccount: "Utwórz konto DJ",
    demoEyebrow: "Demo 44 sekundy",
    demoTitle: "Zobacz pełny przepływ od gościa do DJ.",
    demoBody: "Szybki podgląd skanowania QR, requestów, płatnych boostów, aktualizacji kolejki live i śledzenia zarobków.",
    watchDemoVideo: "▶ Zobacz demo video",
    modalTitle: "Zobacz, jak działa Blackline",
    close: "✕ Zamknij",
    modalCaption: "Goście skanują QR DJ-a, proszą o utwór, boostują kolejkę, a DJ widzi to live w panelu.",
    footerText: "Platforma live requestów DJ.",
    support: "Support",
    djSignup: "Rejestracja DJ",
  },
  el: {
    languageLabel: "Γλώσσα",
    heroBadge: "Πλατφόρμα live αιτημάτων DJ",
    heroHeadline: "Μετατρέψτε τα song requests σε πληρωμένη συμμετοχή του κοινού.",
    heroBody: "Το Blackline δίνει στους DJs premium σελίδα αιτημάτων, QR code και live dashboard. Οι καλεσμένοι ζητούν τραγούδια από το κινητό, κάνουν boost την ουρά και μένουν συνδεδεμένοι με το party χωρίς να συνωστίζονται στο DJ booth.",
    becomeDj: "Γίνε Blackline DJ",
    watchDemo: "Δες demo",
    djLogin: "Σύνδεση DJ",
    trustBadges: ["Ασφαλείς πληρωμές καλεσμένων", "Αιτήματα σε πραγματικό χρόνο", "QR έτοιμο για live events"],
    floatingLiveQueue: "Live ουρά",
    floatingRequests: "+3 αιτήματα",
    floatingPaidBoost: "Πληρωμένο boost",
    floatingQueueMoved: "Η ουρά ανέβηκε 🔥",
    productGuestLive: "Live τώρα",
    productGuestName: "Ζήτα από το κινητό σου",
    productYourName: "Το όνομά σου",
    productSelectedSong: "Επιλεγμένο τραγούδι",
    productPayRequest: "Πλήρωσε & ζήτησε",
    productDashboardPreview: "Προεπισκόπηση DJ dashboard",
    productRequestsArrive: "Τα αιτήματα φτάνουν live.",
    productNowPlaying: "Παίζει τώρα",
    productRequestedBy: "Ζητήθηκε από Jay",
    productScanToRequest: "Σκάναρε για αίτημα",
    productEarningsTracked: "Τα έσοδα παρακολουθούνται",
    productDjShare: "Μερίδιο DJ μετά το platform fee",
    previewQueue: [
      { name: "Maya", song: "Afrobeats anthem", artist: "Αίτημα καλεσμένου", amount: "+50 boost", badge: "VIP" },
      { name: "Chris", song: "Club classic", artist: "Αίτημα καλεσμένου", amount: "+20 boost", badge: "Επόμενο" },
      { name: "Ari", song: "Late-night hit", artist: "Αίτημα καλεσμένου", amount: "+10 boost", badge: "Ουρά" },
    ],
    howEyebrow: "Πώς λειτουργεί",
    howTitle: "Φτιαγμένο για τον χώρο, όχι για ουρά μπροστά στο booth.",
    platformHighlights: [
      { icon: "📲", title: "Σκάναρε το QR", body: "Οι καλεσμένοι ανοίγουν αμέσως τη σελίδα Blackline του DJ από table tent, sticker, flyer ή οθόνη κινητού." },
      { icon: "🎵", title: "Ζήτα τραγούδι", body: "Αναζητούν τραγούδι, προσθέτουν όνομα και στέλνουν το αίτημα χωρίς να συνωστίζονται στο DJ booth." },
      { icon: "🔥", title: "Boost την ουρά", body: "Τα πληρωμένα αιτήματα και boosts βοηθούν τους DJs να δίνουν προτεραιότητα στο κοινό και να κρατούν την live ουρά οργανωμένη." },
    ],
    forDjs: "Για DJs",
    forDjsTitle: "Διαχειρίσου την ουρά αιτημάτων από ένα live dashboard.",
    djFeatures: ["Live ουρά song requests", "Apple Music αναζήτηση με artwork", "VIP boost priority system", "Εργαλεία QR code και promo kit", "Έλεγχοι live, offline και request-lock", "Παρακολούθηση εσόδων και αναλήψεων"],
    monetization: "Monetization",
    monetizationTitle: "Απλό platform fee. Καθαρά έσοδα DJ.",
    platformFee: "Platform fee",
    platformFeeBody: "Το Blackline κρατά 10% από τα πληρωμένα song requests. Τα έσοδα DJ παρακολουθούνται στο dashboard μετά το Blackline platform fee.",
    trustPoints: ["Ασφαλής ροή πληρωμής καλεσμένου", "10% Blackline platform fee", "Οι DJs μπορούν να λαμβάνουν πληρωμένα requests πριν την επαλήθευση", "Οι αναλήψεις ανοίγουν μετά την έγκριση Blackline"],
    forGuests: "Για καλεσμένους",
    forGuestsTitle: "Γρήγορα, απλά και premium requests.",
    forGuestsBody: "Οι καλεσμένοι μπορούν να αναζητήσουν τραγούδια, να δουν την ενέργεια της ουράς, να boostάρουν υπάρχοντα αιτήματα και να κρατήσουν την αναφορά πληρωμής για υποστήριξη. Η εμπειρία είναι σχεδιασμένη για κινητά σε busy nightlife χώρους.",
    important: "Σημαντικό",
    disclaimer: "Τα song requests και boosts υποστηρίζουν τον DJ και βελτιώνουν την προτεραιότητα στην ουρά, αλλά δεν εγγυώνται ότι ένα τραγούδι θα παιχτεί.",
    launchEyebrow: "Λάνσαρε τη Blackline σελίδα σου",
    launchTitle: "Έτοιμος να αναβαθμίσεις την DJ εμπειρία σου;",
    launchBody: "Δημιούργησε DJ account, όρισε public link, μοιράσου το QR code και ξεκίνα να δέχεσαι premium live song requests.",
    createAccount: "Δημιουργία DJ account",
    demoEyebrow: "Demo 44 δευτερολέπτων",
    demoTitle: "Δες όλη τη ροή από καλεσμένο σε DJ.",
    demoBody: "Γρήγορη προεπισκόπηση QR scanning, song requests, paid boosts, live DJ queue updates και tracked earnings.",
    watchDemoVideo: "▶ Δες το demo video",
    modalTitle: "Δες πώς λειτουργεί το Blackline",
    close: "✕ Κλείσιμο",
    modalCaption: "Οι καλεσμένοι σκανάρουν το DJ QR code, ζητούν τραγούδι, boostάρουν την ουρά και ο DJ το βλέπει live στο dashboard.",
    footerText: "Πλατφόρμα live αιτημάτων DJ.",
    support: "Υποστήριξη",
    djSignup: "Εγγραφή DJ",
  },
  uk: {
    languageLabel: "Мова",
    heroBadge: "Платформа live-заявок для DJ",
    heroHeadline: "Перетворіть запити пісень на платну взаємодію з публікою.",
    heroBody: "Blackline дає DJ преміальну сторінку заявок, QR-код і live-панель. Гості замовляють пісні з телефону, бустять чергу й залишаються залученими без натовпу біля DJ booth.",
    becomeDj: "Стати Blackline DJ",
    watchDemo: "Дивитися демо",
    djLogin: "Вхід DJ",
    trustBadges: ["Безпечні платежі гостей", "Заявки в реальному часі", "QR готовий для live-подій"],
    floatingLiveQueue: "Live-черга",
    floatingRequests: "+3 заявки",
    floatingPaidBoost: "Платний буст",
    floatingQueueMoved: "Чергу піднято 🔥",
    productGuestLive: "Зараз live",
    productGuestName: "Замовляйте з телефону",
    productYourName: "Ваше ім’я",
    productSelectedSong: "Обрана пісня",
    productPayRequest: "Оплатити й замовити",
    productDashboardPreview: "Прев’ю панелі DJ",
    productRequestsArrive: "Заявки приходять live.",
    productNowPlaying: "Зараз грає",
    productRequestedBy: "Замовив Jay",
    productScanToRequest: "Скануйте для заявки",
    productEarningsTracked: "Доходи відстежуються",
    productDjShare: "Частка DJ після комісії платформи",
    previewQueue: [
      { name: "Maya", song: "Afrobeats anthem", artist: "Заявка гостя", amount: "+50 буст", badge: "VIP" },
      { name: "Chris", song: "Клубна класика", artist: "Заявка гостя", amount: "+20 буст", badge: "Далі" },
      { name: "Ari", song: "Нічний хіт", artist: "Заявка гостя", amount: "+10 буст", badge: "Черга" },
    ],
    howEyebrow: "Як це працює",
    howTitle: "Створено для всієї зали, а не для черги біля DJ booth.",
    platformHighlights: [
      { icon: "📲", title: "Скануйте QR", body: "Гості миттєво відкривають Blackline-сторінку DJ з тейбл-тента, стікера, флаєра або екрана телефону." },
      { icon: "🎵", title: "Замовте пісню", body: "Вони шукають пісню, додають ім’я та надсилають заявку без натовпу біля DJ booth." },
      { icon: "🔥", title: "Бустіть чергу", body: "Платні заявки й бусти допомагають DJ пріоритезувати публіку та тримати live-чергу організованою." },
    ],
    forDjs: "Для DJs",
    forDjsTitle: "Керуйте чергою заявок з однієї live-панелі.",
    djFeatures: ["Черга заявок у реальному часі", "Пошук Apple Music з обкладинками", "VIP boost priority system", "Інструменти QR та promo kit", "Контроль live/offline/request-lock", "Відстеження доходів і виведень"],
    monetization: "Монетизація",
    monetizationTitle: "Проста комісія платформи. Прозорі доходи DJ.",
    platformFee: "Комісія платформи",
    platformFeeBody: "Blackline утримує 10% з платних заявок. Доходи DJ відстежуються в панелі після комісії платформи Blackline.",
    trustPoints: ["Безпечний платіжний потік для гостей", "10% комісія Blackline", "DJs можуть отримувати платні заявки до верифікації", "Виведення відкриваються після схвалення Blackline"],
    forGuests: "Для гостей",
    forGuestsTitle: "Заявки швидкі, прості й преміальні.",
    forGuestsBody: "Гості можуть шукати пісні, бачити енергію черги, бустити наявні заявки та зберігати платіжну референцію для підтримки. Досвід створено для телефонів у жвавих nightlife-просторах.",
    important: "Важливо",
    disclaimer: "Заявки й бусти підтримують DJ і підвищують пріоритет у черзі, але не гарантують, що пісню буде зіграно.",
    launchEyebrow: "Запустіть свою Blackline-сторінку",
    launchTitle: "Готові покращити DJ-досвід?",
    launchBody: "Створіть DJ-акаунт, налаштуйте публічне посилання, поділіться QR-кодом і почніть приймати premium live-заявки.",
    createAccount: "Створити DJ-акаунт",
    demoEyebrow: "44-секундне демо",
    demoTitle: "Перегляньте повний шлях від гостя до DJ.",
    demoBody: "Швидкий перегляд QR-сканування, заявок, платних бустів, live-оновлень черги DJ та відстеження доходів.",
    watchDemoVideo: "▶ Дивитися демо-відео",
    modalTitle: "Подивіться, як працює Blackline",
    close: "✕ Закрити",
    modalCaption: "Гості сканують QR DJ, замовляють пісню, бустять чергу, а DJ бачить це live у панелі.",
    footerText: "Платформа live-заявок для DJ.",
    support: "Підтримка",
    djSignup: "Реєстрація DJ",
  },
};

function isLanguageCode(value: string | null): value is LanguageCode {
  return languageOptions.some((option) => option.code === value);
}

function LanguageSelector({
  language,
  onChange,
  label,
}: {
  language: LanguageCode;
  onChange: (language: LanguageCode) => void;
  label: string;
}) {
  const selectedLanguage = languageOptions.find((option) => option.code === language);

  return (
    <label className="inline-flex w-full max-w-[330px] items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-3 text-left text-sm font-bold text-zinc-300 shadow-2xl backdrop-blur sm:w-auto sm:max-w-none">
      <span className="shrink-0 text-purple-300">🌐 {label}</span>
      <span className="text-xl" aria-hidden="true">
        {selectedLanguage?.flag}
      </span>
      <select
        value={language}
        onChange={(event) => onChange(event.target.value as LanguageCode)}
        className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black px-3 py-2 font-black text-white outline-none transition focus:border-purple-500 sm:max-w-[220px]"
        aria-label={label}
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.flag} {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProductPreview({ t }: { t: (typeof landingTranslations)[LanguageCode] }) {
  return (
    <div id="demo" className="relative mx-auto mt-16 max-w-6xl scroll-mt-8">
      <div className="absolute -left-10 top-20 hidden rounded-3xl border border-purple-500/30 bg-purple-500/10 px-5 py-4 text-left shadow-[0_0_35px_rgba(168,85,247,0.22)] backdrop-blur md:block">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-300">{t.floatingLiveQueue}</p>
        <p className="mt-1 text-2xl font-black text-white">{t.floatingRequests}</p>
      </div>

      <div className="absolute -right-8 top-8 hidden rotate-3 rounded-3xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-left shadow-[0_0_35px_rgba(34,197,94,0.18)] backdrop-blur md:block">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-green-300">{t.floatingPaidBoost}</p>
        <p className="mt-1 text-2xl font-black text-white">{t.floatingQueueMoved}</p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-purple-500/30 bg-zinc-950/90 p-4 shadow-[0_0_70px_rgba(168,85,247,0.18)] md:p-6">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[1.75rem] border border-zinc-800 bg-black p-4 md:p-5">
            <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] border border-zinc-700 bg-zinc-950 shadow-2xl">
              <div className="border-b border-zinc-800 bg-gradient-to-br from-purple-950 via-black to-black p-5 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full border-4 border-purple-500 bg-zinc-800 shadow-[0_0_35px_rgba(168,85,247,0.55)]" />
                <p className="text-xs font-black uppercase tracking-[0.28em] text-green-400">{t.productGuestLive}</p>
                <h3 className="mt-2 text-3xl font-black text-white">DJ Nova</h3>
                <p className="mt-2 text-sm text-zinc-400">{t.productGuestName}</p>
              </div>

              <div className="space-y-3 p-5">
                <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-left">
                  <p className="text-xs text-zinc-500">{t.productYourName}</p>
                  <p className="mt-1 font-bold text-white">Maya</p>
                </div>

                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-left">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-300">{t.productSelectedSong}</p>
                  <p className="mt-2 text-xl font-black text-white">{t.previewQueue[0].song}</p>
                  <p className="text-sm text-zinc-400">{t.previewQueue[0].artist}</p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 50, 100].map((amount) => (
                    <div key={amount} className="rounded-xl bg-purple-600 px-2 py-3 text-center text-sm font-black text-white">
                      +{amount}
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-green-500 px-4 py-3 text-center font-black text-black">{t.productPayRequest}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-400">{t.productDashboardPreview}</p>
                <h3 className="mt-2 text-3xl font-black text-white md:text-4xl">{t.productRequestsArrive}</h3>
              </div>

              <div className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-black text-green-400">LIVE 🟢</div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
              <div className="space-y-3">
                <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-950 to-black p-5">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-200">{t.productNowPlaying}</p>
                  <p className="mt-3 text-2xl font-black text-white">Dancefloor opener</p>
                  <p className="mt-1 text-sm text-zinc-400">{t.productRequestedBy}</p>
                </div>

                {t.previewQueue.map((request, index) => (
                  <div key={`${request.name}-${index}`} className="rounded-3xl border border-zinc-800 bg-black/55 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 font-black text-purple-300">#{index + 1}</div>
                        <div>
                          <p className="font-black text-white">{request.song}</p>
                          <p className="text-sm text-zinc-500">{request.artist} · {request.name}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">{request.badge}</p>
                        <p className="mt-2 text-sm font-bold text-green-400">{request.amount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-zinc-800 bg-black/55 p-5 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500">{t.productScanToRequest}</p>
                  <div className="mx-auto mt-4 grid h-32 w-32 grid-cols-5 gap-1 rounded-2xl bg-white p-3">
                    {Array.from({ length: 25 }).map((_, index) => (
                      <div key={index} className={`rounded-sm ${[0, 1, 2, 5, 10, 12, 14, 16, 18, 20, 22, 23, 24].includes(index) ? "bg-black" : "bg-zinc-300"}`} />
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-zinc-400">blacklinedj.com/djnova</p>
                </div>

                <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-green-300">{t.productEarningsTracked}</p>
                  <p className="mt-2 text-3xl font-black text-green-400">90%</p>
                  <p className="mt-1 text-sm text-zinc-400">{t.productDjShare}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoDemoModal({
  isOpen,
  onClose,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  t: (typeof landingTranslations)[LanguageCode];
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 px-3 py-4 backdrop-blur sm:px-4 sm:py-6" role="dialog" aria-modal="true" aria-label="Blackline demo video">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[520px] items-start justify-center sm:items-center">
        <div className="my-auto w-full overflow-hidden rounded-[1.75rem] border border-purple-500/40 bg-zinc-950 shadow-[0_0_80px_rgba(168,85,247,0.3)]">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-800 bg-gradient-to-br from-purple-950/50 via-black to-black px-5 py-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-purple-300">{t.watchDemo}</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-white">{t.modalTitle}</h2>
            </div>

            <button type="button" onClick={onClose} className="shrink-0 rounded-full border border-zinc-700 bg-black/80 px-4 py-2 text-sm font-black text-zinc-200 backdrop-blur transition hover:bg-zinc-900" aria-label="Close demo video">
              {t.close}
            </button>
          </div>

          <div className="bg-black px-4 py-4">
            <div className="mx-auto w-fit rounded-[1.75rem] border border-purple-500/20 bg-zinc-950 p-2 shadow-[0_0_45px_rgba(168,85,247,0.2)]">
              <video
                className="mx-auto h-auto w-auto max-w-full rounded-[1.35rem] bg-black shadow-2xl"
                style={{ maxHeight: "min(600px, calc(100svh - 215px))" }}
                controls
                autoPlay
                playsInline
                preload="metadata"
                poster="/images/blackline-demo-thumbnail.png"
              >
                <source src="/videos/blackline-demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <p className="mx-auto mt-3 max-w-md text-center text-xs leading-relaxed text-zinc-500 sm:text-sm">{t.modalCaption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("en");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("blacklineLandingLanguage");

    if (isLanguageCode(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  function updateLanguage(nextLanguage: LanguageCode) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("blacklineLandingLanguage", nextLanguage);
  }

  const t = landingTranslations[language];
  const footerLinks = footerLinkLabels[language];
  const isRtl = language === "ar";

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden px-6 py-10 md:py-16">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-700/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-fuchsia-700/10 blur-3xl" />
        <div className="absolute bottom-10 left-0 h-72 w-72 rounded-full bg-green-500/5 blur-3xl" />

        <div className="relative z-20 mx-auto mb-12 flex max-w-6xl justify-center md:justify-end">
          <LanguageSelector language={language} onChange={updateLanguage} label={t.languageLabel} />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-600/60 bg-purple-900/30 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-purple-200">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            {t.heroBadge}
          </div>

          <h1 className="mb-6 text-6xl font-black leading-none tracking-tight md:text-8xl lg:text-9xl">BLACKLINE</h1>

          <p className="mx-auto mb-5 max-w-4xl text-3xl font-black leading-tight text-purple-400 md:text-5xl">{t.heroHeadline}</p>

          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-zinc-400 md:text-xl">{t.heroBody}</p>

          <div className="flex flex-col justify-center gap-4 md:flex-row">
            <Link href="/signup" className="rounded-2xl bg-purple-600 px-8 py-5 text-xl font-black transition hover:bg-purple-700">{t.becomeDj}</Link>
            <button type="button" onClick={() => setIsDemoOpen(true)} className="rounded-2xl border border-purple-500/50 bg-purple-500/10 px-8 py-5 text-xl font-black text-purple-100 transition hover:bg-purple-500/20">{t.watchDemo}</button>
            <Link href="/admin" className="rounded-2xl border border-zinc-700 bg-zinc-900 px-8 py-5 text-xl font-black transition hover:bg-zinc-800">{t.djLogin}</Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-zinc-500">
            {t.trustBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">{badge}</span>
            ))}
          </div>

          <ProductPreview t={t} />
        </div>
      </section>

      <section id="how-it-works" className="border-t border-zinc-900 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-purple-400">{t.howEyebrow}</p>
            <h2 className="text-5xl font-black md:text-6xl">{t.howTitle}</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {t.platformHighlights.map((item) => (
              <div key={item.title} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
                <div className="mb-6 text-5xl">{item.icon}</div>
                <h3 className="mb-4 text-3xl font-black">{item.title}</h3>
                <p className="text-lg leading-relaxed text-zinc-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-900 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-purple-700/70 bg-gradient-to-br from-purple-950 via-purple-900/70 to-black p-8 md:p-10">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-purple-200">{t.forDjs}</p>
            <h2 className="mb-6 text-4xl font-black md:text-5xl">{t.forDjsTitle}</h2>
            <div className="grid gap-3">
              {t.djFeatures.map((feature) => (
                <div key={feature} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-zinc-100">✅ {feature}</div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 md:p-10">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-green-400">{t.monetization}</p>
            <h2 className="mb-6 text-4xl font-black md:text-5xl">{t.monetizationTitle}</h2>

            <div className="mb-6 rounded-3xl border border-green-500/30 bg-green-500/10 p-6">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-green-300">{t.platformFee}</p>
              <p className="mt-3 text-5xl font-black text-green-400">10%</p>
              <p className="mt-3 text-zinc-300">{t.platformFeeBody}</p>
            </div>

            <div className="grid gap-3">
              {t.trustPoints.map((point) => (
                <div key={point} className="rounded-2xl border border-zinc-800 bg-black/35 px-4 py-3 text-zinc-300">{point}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-900 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 md:col-span-2">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-purple-400">{t.forGuests}</p>
            <h2 className="mb-4 text-4xl font-black">{t.forGuestsTitle}</h2>
            <p className="text-lg leading-relaxed text-zinc-400">{t.forGuestsBody}</p>
          </div>

          <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-8">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-yellow-300">{t.important}</p>
            <p className="text-lg font-semibold leading-relaxed text-yellow-100">{t.disclaimer}</p>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-900 px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-purple-400">{t.launchEyebrow}</p>
          <h2 className="mb-6 text-5xl font-black md:text-6xl">{t.launchTitle}</h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-zinc-400">{t.launchBody}</p>

          <div className="flex flex-col justify-center gap-4 md:flex-row">
            <Link href="/signup" className="rounded-2xl bg-purple-600 px-10 py-5 text-2xl font-black transition hover:bg-purple-700">{t.createAccount}</Link>
            <Link href="/admin" className="rounded-2xl border border-zinc-700 bg-zinc-900 px-10 py-5 text-2xl font-black transition hover:bg-zinc-800">{t.djLogin}</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-900 px-6 py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-purple-500/30 bg-gradient-to-br from-zinc-950 via-black to-purple-950/40 p-6 text-center shadow-[0_0_60px_rgba(168,85,247,0.16)] md:p-10">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-purple-300">{t.demoEyebrow}</p>
          <h2 className="mx-auto mb-4 max-w-3xl text-4xl font-black md:text-5xl">{t.demoTitle}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-zinc-400">{t.demoBody}</p>
          <button type="button" onClick={() => setIsDemoOpen(true)} className="rounded-2xl bg-purple-600 px-10 py-5 text-2xl font-black transition hover:bg-purple-700">{t.watchDemoVideo}</button>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Blackline DJ. {t.footerText}</p>

          <div className="flex flex-wrap gap-4">
            <Link href="/support" className="hover:text-purple-300">{footerLinks.support}</Link>
            <Link href="/terms" className="hover:text-purple-300">{footerLinks.terms}</Link>
            <Link href="/privacy" className="hover:text-purple-300">{footerLinks.privacy}</Link>
          </div>
        </div>
      </footer>

      <VideoDemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} t={t} />
    </main>
  );
}
