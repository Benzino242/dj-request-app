"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import QRCodeBox from "../components/QRCodeBox";
import { translations, Language } from "../lib/translations";

type RequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "played"
  | "finished";

type SongRequest = {
  id: number;
  dj_id: number;
  name: string;
  song: string;
  artist: string;
  artwork?: string | null;
  album?: string | null;
  status: RequestStatus;
  tip_amount: number;
  tip_currency: string;
  queue_position?: number | null;
  created_at?: string;
};

type Payment = {
  id: number;
  dj_id: number;
  amount: number;
  dj_amount: number;
  platform_fee: number;
  currency: string;
  payout_status?: string;
  created_at?: string;
};

type Withdrawal = {
  id: number;
  dj_name: string;
  amount: number;
  currency: string;
  status: string;
  payout_method?: string;
  account_name?: string;
  account_number?: string;
  provider?: string;
  created_at?: string;
};

type AuditLog = {
  id: number;
  action_type: string;
  entity_type: string;
  entity_id: number | string;
  description: string;
  metadata?: {
    dj_id?: number;
    dj_name?: string;
    amount?: number;
    currency?: string;
    status?: string;
    previous_status?: string;
    new_status?: string;
  } | null;
  created_at?: string;
};

type DJ = {
  id: number;
  stage_name: string;
  email: string | null;
  user_id: string;
  bio?: string | null;
  city?: string | null;
  instagram?: string | null;
  profile_image?: string | null;
  is_live?: boolean | null;
  event_name?: string | null;
  venue?: string | null;
  country?: string | null;
  preferred_currency?: string | null;
  payout_email?: string | null;
  payout_method?: string | null;
  payout_status?: string | null;
  payout_provider?: string | null;
  payout_account_name?: string | null;
  payout_account_number?: string | null;
  payout_bank_code?: string | null;
  paystack_recipient_code?: string | null;
  verification_status?: string | null;
};

type PaystackBank = {
  name: string;
  code: string;
  slug?: string;
  type?: string;
};

type QuickSetupTranslation = {
  eyebrow: string; heading: string; subtitle: string;
  profileTodoTitle: string; profileReadyTitle: string; profileTodoMessage: string; profileReadyMessage: string;
  payoutTodoTitle: string; payoutReadyTitle: string; payoutTodoMessage: string; payoutReadyMessage: string;
  openRequestsTitle: string; liveTitle: string; openRequestsMessage: string; liveMessage: string;
  shareQrTitle: string; shareQrMessage: string; watchQueueTitle: string; acceptRequestsTitle: string;
  watchQueueMessage: string; acceptRequestsMessage: string; verificationTitle: string; withdrawalsUnlockedTitle: string;
  verificationNotStartedMessage: string; verificationPendingMessage: string; connectPayoutMessage: string; withdrawalsReadyMessage: string;
  verificationNote: string; startHere: string; ready: string; needed: string; connected: string;
  share: string; actionNeeded: string; queue: string; goLive: string; liveNow: string; requestsAllowed: string; unlocked: string;
};

const quickSetupTranslations: Record<Language, QuickSetupTranslation> = {
  "en": {
    "eyebrow": "Quick Setup",
    "heading": "What to do now",
    "subtitle": "Complete these steps to start taking requests and unlock withdrawals.",
    "profileTodoTitle": "Set up your profile",
    "profileReadyTitle": "Profile is set",
    "payoutTodoTitle": "Add payout method",
    "payoutReadyTitle": "Payout method added",
    "openRequestsTitle": "Open requests",
    "liveTitle": "Requests are open",
    "shareQrTitle": "Share your QR code",
    "watchQueueTitle": "Watch your request queue",
    "acceptRequestsTitle": "Accept pending requests",
    "verificationTitle": "Verification unlocks withdrawals",
    "withdrawalsUnlockedTitle": "Withdrawals are unlocked",
    "verificationNote": "Verification does not stop requests. DJs can go live and collect paid requests while approval is pending. Withdrawals unlock after Blackline approves the account.",
    "startHere": "Start here",
    "ready": "Ready",
    "needed": "Needed",
    "connected": "Connected",
    "share": "Share",
    "actionNeeded": "Action needed",
    "queue": "Queue",
    "goLive": "Go live",
    "liveNow": "Live now",
    "requestsAllowed": "Requests allowed",
    "unlocked": "Unlocked",
    "profileTodoMessage": "Set up your profile",
    "profileReadyMessage": "Profile is set",
    "payoutTodoMessage": "Add payout method",
    "payoutReadyMessage": "Payout method added",
    "openRequestsMessage": "Open requests",
    "liveMessage": "Requests are open",
    "shareQrMessage": "Share your QR code",
    "watchQueueMessage": "Watch your request queue",
    "acceptRequestsMessage": "Accept pending requests",
    "verificationNotStartedMessage": "Verification unlocks withdrawals",
    "verificationPendingMessage": "Verification unlocks withdrawals",
    "connectPayoutMessage": "Add payout method",
    "withdrawalsReadyMessage": "Withdrawals are unlocked"
  },
  "zh": {
    "eyebrow": "快速设置",
    "heading": "现在要做什么",
    "subtitle": "完成这些步骤，开始接受点歌并解锁提现。",
    "profileTodoTitle": "设置DJ资料",
    "profileReadyTitle": "资料已设置",
    "payoutTodoTitle": "添加收款方式",
    "payoutReadyTitle": "收款方式已添加",
    "openRequestsTitle": "开启点歌",
    "liveTitle": "点歌已开启",
    "shareQrTitle": "分享二维码",
    "watchQueueTitle": "查看点歌队列",
    "acceptRequestsTitle": "接受待处理点歌",
    "verificationTitle": "验证解锁提现",
    "withdrawalsUnlockedTitle": "提现已解锁",
    "verificationNote": "验证不会阻止点歌。DJ 在等待批准期间仍可上线并收取付费点歌。Blackline 批准后即可提现。",
    "startHere": "从这里开始",
    "ready": "已就绪",
    "needed": "需要",
    "connected": "已连接",
    "share": "分享",
    "actionNeeded": "需要操作",
    "queue": "队列",
    "goLive": "开启",
    "liveNow": "直播中",
    "requestsAllowed": "可接单",
    "unlocked": "已解锁",
    "profileTodoMessage": "设置DJ资料",
    "profileReadyMessage": "资料已设置",
    "payoutTodoMessage": "添加收款方式",
    "payoutReadyMessage": "收款方式已添加",
    "openRequestsMessage": "开启点歌",
    "liveMessage": "点歌已开启",
    "shareQrMessage": "分享二维码",
    "watchQueueMessage": "查看点歌队列",
    "acceptRequestsMessage": "接受待处理点歌",
    "verificationNotStartedMessage": "验证解锁提现",
    "verificationPendingMessage": "验证解锁提现",
    "connectPayoutMessage": "添加收款方式",
    "withdrawalsReadyMessage": "提现已解锁"
  },
  "ja": {
    "eyebrow": "クイック設定",
    "heading": "今やること",
    "subtitle": "リクエスト受付を開始し、出金を有効にするための手順です。",
    "profileTodoTitle": "DJプロフィールを設定",
    "profileReadyTitle": "プロフィール設定済み",
    "payoutTodoTitle": "出金方法を追加",
    "payoutReadyTitle": "出金方法を追加済み",
    "openRequestsTitle": "リクエストを開く",
    "liveTitle": "リクエスト受付中",
    "shareQrTitle": "QRコードを共有",
    "watchQueueTitle": "リクエストキューを見る",
    "acceptRequestsTitle": "保留中のリクエストを承認",
    "verificationTitle": "認証で出金を有効化",
    "withdrawalsUnlockedTitle": "出金が有効です",
    "verificationNote": "認証待ちでもリクエスト受付は止まりません。出金はBlackline承認後に有効になります。",
    "startHere": "ここから",
    "ready": "準備完了",
    "needed": "必要",
    "connected": "接続済み",
    "share": "共有",
    "actionNeeded": "要対応",
    "queue": "キュー",
    "goLive": "開始",
    "liveNow": "受付中",
    "requestsAllowed": "受付可能",
    "unlocked": "有効",
    "profileTodoMessage": "DJプロフィールを設定",
    "profileReadyMessage": "プロフィール設定済み",
    "payoutTodoMessage": "出金方法を追加",
    "payoutReadyMessage": "出金方法を追加済み",
    "openRequestsMessage": "リクエストを開く",
    "liveMessage": "リクエスト受付中",
    "shareQrMessage": "QRコードを共有",
    "watchQueueMessage": "リクエストキューを見る",
    "acceptRequestsMessage": "保留中のリクエストを承認",
    "verificationNotStartedMessage": "認証で出金を有効化",
    "verificationPendingMessage": "認証で出金を有効化",
    "connectPayoutMessage": "出金方法を追加",
    "withdrawalsReadyMessage": "出金が有効です"
  },
  "ko": {
    "eyebrow": "빠른 설정",
    "heading": "지금 할 일",
    "subtitle": "요청을 받기 시작하고 출금을 열려면 이 단계를 완료하세요.",
    "profileTodoTitle": "DJ 프로필 설정",
    "profileReadyTitle": "프로필 설정됨",
    "payoutTodoTitle": "정산 방법 추가",
    "payoutReadyTitle": "정산 방법 추가됨",
    "openRequestsTitle": "요청 열기",
    "liveTitle": "요청 열림",
    "shareQrTitle": "QR 코드 공유",
    "watchQueueTitle": "요청 대기열 보기",
    "acceptRequestsTitle": "대기 요청 수락",
    "verificationTitle": "인증 후 출금 가능",
    "withdrawalsUnlockedTitle": "출금 잠금 해제됨",
    "verificationNote": "인증은 요청을 막지 않습니다. 승인 대기 중에도 유료 요청을 받을 수 있고 출금은 Blackline 승인 후 열립니다.",
    "startHere": "여기서 시작",
    "ready": "준비됨",
    "needed": "필요",
    "connected": "연결됨",
    "share": "공유",
    "actionNeeded": "조치 필요",
    "queue": "대기열",
    "goLive": "시작",
    "liveNow": "라이브",
    "requestsAllowed": "요청 가능",
    "unlocked": "해제됨",
    "profileTodoMessage": "DJ 프로필 설정",
    "profileReadyMessage": "프로필 설정됨",
    "payoutTodoMessage": "정산 방법 추가",
    "payoutReadyMessage": "정산 방법 추가됨",
    "openRequestsMessage": "요청 열기",
    "liveMessage": "요청 열림",
    "shareQrMessage": "QR 코드 공유",
    "watchQueueMessage": "요청 대기열 보기",
    "acceptRequestsMessage": "대기 요청 수락",
    "verificationNotStartedMessage": "인증 후 출금 가능",
    "verificationPendingMessage": "인증 후 출금 가능",
    "connectPayoutMessage": "정산 방법 추가",
    "withdrawalsReadyMessage": "출금 잠금 해제됨"
  },
  "id": {
    "eyebrow": "Pengaturan Cepat",
    "heading": "Yang harus dilakukan sekarang",
    "subtitle": "Selesaikan langkah ini untuk mulai menerima request dan membuka penarikan.",
    "profileTodoTitle": "Atur profil DJ",
    "profileReadyTitle": "Profil sudah siap",
    "payoutTodoTitle": "Tambah metode payout",
    "payoutReadyTitle": "Metode payout ditambahkan",
    "openRequestsTitle": "Buka request",
    "liveTitle": "Request sudah dibuka",
    "shareQrTitle": "Bagikan kode QR",
    "watchQueueTitle": "Pantau antrean request",
    "acceptRequestsTitle": "Terima request pending",
    "verificationTitle": "Verifikasi membuka penarikan",
    "withdrawalsUnlockedTitle": "Penarikan terbuka",
    "verificationNote": "Verifikasi tidak menghentikan request. DJ tetap bisa live dan menerima request berbayar saat menunggu persetujuan.",
    "startHere": "Mulai di sini",
    "ready": "Siap",
    "needed": "Diperlukan",
    "connected": "Terhubung",
    "share": "Bagikan",
    "actionNeeded": "Perlu aksi",
    "queue": "Antrean",
    "goLive": "Go live",
    "liveNow": "Live",
    "requestsAllowed": "Request boleh",
    "unlocked": "Terbuka",
    "profileTodoMessage": "Atur profil DJ",
    "profileReadyMessage": "Profil sudah siap",
    "payoutTodoMessage": "Tambah metode payout",
    "payoutReadyMessage": "Metode payout ditambahkan",
    "openRequestsMessage": "Buka request",
    "liveMessage": "Request sudah dibuka",
    "shareQrMessage": "Bagikan kode QR",
    "watchQueueMessage": "Pantau antrean request",
    "acceptRequestsMessage": "Terima request pending",
    "verificationNotStartedMessage": "Verifikasi membuka penarikan",
    "verificationPendingMessage": "Verifikasi membuka penarikan",
    "connectPayoutMessage": "Tambah metode payout",
    "withdrawalsReadyMessage": "Penarikan terbuka"
  },
  "ms": {
    "eyebrow": "Tetapan Pantas",
    "heading": "Apa perlu dibuat sekarang",
    "subtitle": "Lengkapkan langkah ini untuk mula menerima permintaan dan membuka pengeluaran.",
    "profileTodoTitle": "Sediakan profil DJ",
    "profileReadyTitle": "Profil sudah siap",
    "payoutTodoTitle": "Tambah kaedah payout",
    "payoutReadyTitle": "Kaedah payout ditambah",
    "openRequestsTitle": "Buka permintaan",
    "liveTitle": "Permintaan dibuka",
    "shareQrTitle": "Kongsi kod QR",
    "watchQueueTitle": "Pantau barisan permintaan",
    "acceptRequestsTitle": "Terima permintaan pending",
    "verificationTitle": "Verifikasi membuka pengeluaran",
    "withdrawalsUnlockedTitle": "Pengeluaran dibuka",
    "verificationNote": "Verifikasi tidak menghentikan permintaan. DJ boleh live dan menerima permintaan berbayar sementara menunggu kelulusan.",
    "startHere": "Mula di sini",
    "ready": "Siap",
    "needed": "Diperlukan",
    "connected": "Disambung",
    "share": "Kongsi",
    "actionNeeded": "Perlu tindakan",
    "queue": "Barisan",
    "goLive": "Go live",
    "liveNow": "Live",
    "requestsAllowed": "Permintaan dibenarkan",
    "unlocked": "Dibuka",
    "profileTodoMessage": "Sediakan profil DJ",
    "profileReadyMessage": "Profil sudah siap",
    "payoutTodoMessage": "Tambah kaedah payout",
    "payoutReadyMessage": "Kaedah payout ditambah",
    "openRequestsMessage": "Buka permintaan",
    "liveMessage": "Permintaan dibuka",
    "shareQrMessage": "Kongsi kod QR",
    "watchQueueMessage": "Pantau barisan permintaan",
    "acceptRequestsMessage": "Terima permintaan pending",
    "verificationNotStartedMessage": "Verifikasi membuka pengeluaran",
    "verificationPendingMessage": "Verifikasi membuka pengeluaran",
    "connectPayoutMessage": "Tambah kaedah payout",
    "withdrawalsReadyMessage": "Pengeluaran dibuka"
  },
  "th": {
    "eyebrow": "ตั้งค่าด่วน",
    "heading": "สิ่งที่ต้องทำตอนนี้",
    "subtitle": "ทำขั้นตอนเหล่านี้ให้เสร็จเพื่อเริ่มรับคำขอเพลงและปลดล็อกการถอนเงิน",
    "profileTodoTitle": "ตั้งค่าโปรไฟล์ DJ",
    "profileReadyTitle": "โปรไฟล์พร้อมแล้ว",
    "payoutTodoTitle": "เพิ่มวิธีรับเงิน",
    "payoutReadyTitle": "เพิ่มวิธีรับเงินแล้ว",
    "openRequestsTitle": "เปิดรับคำขอ",
    "liveTitle": "เปิดรับคำขอแล้ว",
    "shareQrTitle": "แชร์ QR code",
    "watchQueueTitle": "ดูคิวคำขอ",
    "acceptRequestsTitle": "รับคำขอที่รออยู่",
    "verificationTitle": "ยืนยันตัวตนเพื่อถอนเงิน",
    "withdrawalsUnlockedTitle": "ปลดล็อกการถอนแล้ว",
    "verificationNote": "การยืนยันไม่ปิดการรับคำขอ DJ ยัง Live และรับคำขอแบบชำระเงินได้ระหว่างรออนุมัติ",
    "startHere": "เริ่มที่นี่",
    "ready": "พร้อม",
    "needed": "ต้องเพิ่ม",
    "connected": "เชื่อมต่อแล้ว",
    "share": "แชร์",
    "actionNeeded": "ต้องดำเนินการ",
    "queue": "คิว",
    "goLive": "เริ่ม Live",
    "liveNow": "Live",
    "requestsAllowed": "รับคำขอได้",
    "unlocked": "ปลดล็อก",
    "profileTodoMessage": "ตั้งค่าโปรไฟล์ DJ",
    "profileReadyMessage": "โปรไฟล์พร้อมแล้ว",
    "payoutTodoMessage": "เพิ่มวิธีรับเงิน",
    "payoutReadyMessage": "เพิ่มวิธีรับเงินแล้ว",
    "openRequestsMessage": "เปิดรับคำขอ",
    "liveMessage": "เปิดรับคำขอแล้ว",
    "shareQrMessage": "แชร์ QR code",
    "watchQueueMessage": "ดูคิวคำขอ",
    "acceptRequestsMessage": "รับคำขอที่รออยู่",
    "verificationNotStartedMessage": "ยืนยันตัวตนเพื่อถอนเงิน",
    "verificationPendingMessage": "ยืนยันตัวตนเพื่อถอนเงิน",
    "connectPayoutMessage": "เพิ่มวิธีรับเงิน",
    "withdrawalsReadyMessage": "ปลดล็อกการถอนแล้ว"
  },
  "hi": {
    "eyebrow": "त्वरित सेटअप",
    "heading": "अब क्या करें",
    "subtitle": "रिक्वेस्ट लेना शुरू करने और निकासी अनलॉक करने के लिए ये चरण पूरे करें।",
    "profileTodoTitle": "अपनी DJ प्रोफाइल सेट करें",
    "profileReadyTitle": "प्रोफाइल सेट है",
    "payoutTodoTitle": "पेआउट तरीका जोड़ें",
    "payoutReadyTitle": "पेआउट तरीका जोड़ा गया",
    "openRequestsTitle": "रिक्वेस्ट खोलें",
    "liveTitle": "रिक्वेस्ट खुली हैं",
    "shareQrTitle": "QR कोड शेयर करें",
    "watchQueueTitle": "रिक्वेस्ट queue देखें",
    "acceptRequestsTitle": "Pending requests स्वीकार करें",
    "verificationTitle": "Verification से निकासी अनलॉक होती है",
    "withdrawalsUnlockedTitle": "निकासी अनलॉक है",
    "verificationNote": "Verification requests को नहीं रोकता। DJ approval pending होने पर भी paid requests ले सकते हैं।",
    "startHere": "यहां शुरू करें",
    "ready": "तैयार",
    "needed": "जरूरी",
    "connected": "जुड़ा",
    "share": "शेयर",
    "actionNeeded": "कार्रवाई चाहिए",
    "queue": "Queue",
    "goLive": "Go live",
    "liveNow": "लाइव",
    "requestsAllowed": "Requests allowed",
    "unlocked": "Unlocked",
    "profileTodoMessage": "अपनी DJ प्रोफाइल सेट करें",
    "profileReadyMessage": "प्रोफाइल सेट है",
    "payoutTodoMessage": "पेआउट तरीका जोड़ें",
    "payoutReadyMessage": "पेआउट तरीका जोड़ा गया",
    "openRequestsMessage": "रिक्वेस्ट खोलें",
    "liveMessage": "रिक्वेस्ट खुली हैं",
    "shareQrMessage": "QR कोड शेयर करें",
    "watchQueueMessage": "रिक्वेस्ट queue देखें",
    "acceptRequestsMessage": "Pending requests स्वीकार करें",
    "verificationNotStartedMessage": "Verification से निकासी अनलॉक होती है",
    "verificationPendingMessage": "Verification से निकासी अनलॉक होती है",
    "connectPayoutMessage": "पेआउट तरीका जोड़ें",
    "withdrawalsReadyMessage": "निकासी अनलॉक है"
  },
  "ar": {
    "eyebrow": "إعداد سريع",
    "heading": "ماذا تفعل الآن",
    "subtitle": "أكمل هذه الخطوات لبدء استلام الطلبات وفتح السحب.",
    "profileTodoTitle": "أعد ملف DJ",
    "profileReadyTitle": "الملف جاهز",
    "payoutTodoTitle": "أضف طريقة الدفع",
    "payoutReadyTitle": "تمت إضافة طريقة الدفع",
    "openRequestsTitle": "افتح الطلبات",
    "liveTitle": "الطلبات مفتوحة",
    "shareQrTitle": "شارك رمز QR",
    "watchQueueTitle": "راقب قائمة الطلبات",
    "acceptRequestsTitle": "اقبل الطلبات المعلقة",
    "verificationTitle": "التوثيق يفتح السحب",
    "withdrawalsUnlockedTitle": "السحب مفتوح",
    "verificationNote": "التوثيق لا يوقف الطلبات. يمكن للـ DJ استقبال الطلبات المدفوعة أثناء انتظار الموافقة.",
    "startHere": "ابدأ هنا",
    "ready": "جاهز",
    "needed": "مطلوب",
    "connected": "متصل",
    "share": "شارك",
    "actionNeeded": "يتطلب إجراء",
    "queue": "القائمة",
    "goLive": "ابدأ",
    "liveNow": "مباشر",
    "requestsAllowed": "الطلبات مسموحة",
    "unlocked": "مفتوح",
    "profileTodoMessage": "أعد ملف DJ",
    "profileReadyMessage": "الملف جاهز",
    "payoutTodoMessage": "أضف طريقة الدفع",
    "payoutReadyMessage": "تمت إضافة طريقة الدفع",
    "openRequestsMessage": "افتح الطلبات",
    "liveMessage": "الطلبات مفتوحة",
    "shareQrMessage": "شارك رمز QR",
    "watchQueueMessage": "راقب قائمة الطلبات",
    "acceptRequestsMessage": "اقبل الطلبات المعلقة",
    "verificationNotStartedMessage": "التوثيق يفتح السحب",
    "verificationPendingMessage": "التوثيق يفتح السحب",
    "connectPayoutMessage": "أضف طريقة الدفع",
    "withdrawalsReadyMessage": "السحب مفتوح"
  },
  "vi": {
    "eyebrow": "Cài đặt nhanh",
    "heading": "Việc cần làm ngay",
    "subtitle": "Hoàn thành các bước này để bắt đầu nhận yêu cầu và mở rút tiền.",
    "profileTodoTitle": "Thiết lập hồ sơ DJ",
    "profileReadyTitle": "Hồ sơ đã sẵn sàng",
    "payoutTodoTitle": "Thêm phương thức nhận tiền",
    "payoutReadyTitle": "Đã thêm phương thức nhận tiền",
    "openRequestsTitle": "Mở nhận yêu cầu",
    "liveTitle": "Yêu cầu đã mở",
    "shareQrTitle": "Chia sẻ mã QR",
    "watchQueueTitle": "Theo dõi hàng đợi",
    "acceptRequestsTitle": "Nhận yêu cầu đang chờ",
    "verificationTitle": "Xác minh mở rút tiền",
    "withdrawalsUnlockedTitle": "Rút tiền đã mở",
    "verificationNote": "Xác minh không chặn yêu cầu. DJ vẫn có thể live và nhận yêu cầu trả phí khi chờ duyệt.",
    "startHere": "Bắt đầu",
    "ready": "Sẵn sàng",
    "needed": "Cần thêm",
    "connected": "Đã kết nối",
    "share": "Chia sẻ",
    "actionNeeded": "Cần xử lý",
    "queue": "Hàng đợi",
    "goLive": "Go live",
    "liveNow": "Đang live",
    "requestsAllowed": "Được nhận yêu cầu",
    "unlocked": "Đã mở",
    "profileTodoMessage": "Thiết lập hồ sơ DJ",
    "profileReadyMessage": "Hồ sơ đã sẵn sàng",
    "payoutTodoMessage": "Thêm phương thức nhận tiền",
    "payoutReadyMessage": "Đã thêm phương thức nhận tiền",
    "openRequestsMessage": "Mở nhận yêu cầu",
    "liveMessage": "Yêu cầu đã mở",
    "shareQrMessage": "Chia sẻ mã QR",
    "watchQueueMessage": "Theo dõi hàng đợi",
    "acceptRequestsMessage": "Nhận yêu cầu đang chờ",
    "verificationNotStartedMessage": "Xác minh mở rút tiền",
    "verificationPendingMessage": "Xác minh mở rút tiền",
    "connectPayoutMessage": "Thêm phương thức nhận tiền",
    "withdrawalsReadyMessage": "Rút tiền đã mở"
  },
  "tl": {
    "eyebrow": "Quick Setup",
    "heading": "Ano ang gagawin ngayon",
    "subtitle": "Tapusin ang mga step na ito para makatanggap ng requests at ma-unlock ang withdrawals.",
    "profileTodoTitle": "I-set up ang DJ profile",
    "profileReadyTitle": "Profile ay set na",
    "payoutTodoTitle": "Magdagdag ng payout method",
    "payoutReadyTitle": "Payout method added",
    "openRequestsTitle": "Buksan ang requests",
    "liveTitle": "Requests are open",
    "shareQrTitle": "I-share ang QR code",
    "watchQueueTitle": "Bantayan ang request queue",
    "acceptRequestsTitle": "Tanggapin ang pending requests",
    "verificationTitle": "Verification unlocks withdrawals",
    "withdrawalsUnlockedTitle": "Withdrawals unlocked",
    "verificationNote": "Hindi pinipigilan ng verification ang requests. Pwede pa ring tumanggap ng paid requests habang pending ang approval.",
    "startHere": "Start here",
    "ready": "Ready",
    "needed": "Needed",
    "connected": "Connected",
    "share": "Share",
    "actionNeeded": "Action needed",
    "queue": "Queue",
    "goLive": "Go live",
    "liveNow": "Live now",
    "requestsAllowed": "Requests allowed",
    "unlocked": "Unlocked",
    "profileTodoMessage": "I-set up ang DJ profile",
    "profileReadyMessage": "Profile ay set na",
    "payoutTodoMessage": "Magdagdag ng payout method",
    "payoutReadyMessage": "Payout method added",
    "openRequestsMessage": "Buksan ang requests",
    "liveMessage": "Requests are open",
    "shareQrMessage": "I-share ang QR code",
    "watchQueueMessage": "Bantayan ang request queue",
    "acceptRequestsMessage": "Tanggapin ang pending requests",
    "verificationNotStartedMessage": "Verification unlocks withdrawals",
    "verificationPendingMessage": "Verification unlocks withdrawals",
    "connectPayoutMessage": "Magdagdag ng payout method",
    "withdrawalsReadyMessage": "Withdrawals unlocked"
  },
  "pt": {
    "eyebrow": "Configuração rápida",
    "heading": "O que fazer agora",
    "subtitle": "Conclua estes passos para começar a receber pedidos e desbloquear levantamentos.",
    "profileTodoTitle": "Configure o perfil de DJ",
    "profileReadyTitle": "Perfil configurado",
    "payoutTodoTitle": "Adicione método de pagamento",
    "payoutReadyTitle": "Método de pagamento adicionado",
    "openRequestsTitle": "Abrir pedidos",
    "liveTitle": "Pedidos abertos",
    "shareQrTitle": "Partilhe o código QR",
    "watchQueueTitle": "Ver fila de pedidos",
    "acceptRequestsTitle": "Aceitar pedidos pendentes",
    "verificationTitle": "Verificação desbloqueia levantamentos",
    "withdrawalsUnlockedTitle": "Levantamentos desbloqueados",
    "verificationNote": "A verificação não impede pedidos. DJs podem ir live e receber pedidos pagos enquanto aguardam aprovação.",
    "startHere": "Comece aqui",
    "ready": "Pronto",
    "needed": "Necessário",
    "connected": "Ligado",
    "share": "Partilhar",
    "actionNeeded": "Ação necessária",
    "queue": "Fila",
    "goLive": "Go live",
    "liveNow": "Ao vivo",
    "requestsAllowed": "Pedidos permitidos",
    "unlocked": "Desbloqueado",
    "profileTodoMessage": "Configure o perfil de DJ",
    "profileReadyMessage": "Perfil configurado",
    "payoutTodoMessage": "Adicione método de pagamento",
    "payoutReadyMessage": "Método de pagamento adicionado",
    "openRequestsMessage": "Abrir pedidos",
    "liveMessage": "Pedidos abertos",
    "shareQrMessage": "Partilhe o código QR",
    "watchQueueMessage": "Ver fila de pedidos",
    "acceptRequestsMessage": "Aceitar pedidos pendentes",
    "verificationNotStartedMessage": "Verificação desbloqueia levantamentos",
    "verificationPendingMessage": "Verificação desbloqueia levantamentos",
    "connectPayoutMessage": "Adicione método de pagamento",
    "withdrawalsReadyMessage": "Levantamentos desbloqueados"
  },
  "es": {
    "eyebrow": "Configuración rápida",
    "heading": "Qué hacer ahora",
    "subtitle": "Completa estos pasos para empezar a recibir solicitudes y desbloquear retiros.",
    "profileTodoTitle": "Configura tu perfil de DJ",
    "profileReadyTitle": "Perfil listo",
    "payoutTodoTitle": "Agrega método de pago",
    "payoutReadyTitle": "Método de pago agregado",
    "openRequestsTitle": "Abrir solicitudes",
    "liveTitle": "Solicitudes abiertas",
    "shareQrTitle": "Comparte tu código QR",
    "watchQueueTitle": "Mira tu cola de solicitudes",
    "acceptRequestsTitle": "Aceptar solicitudes pendientes",
    "verificationTitle": "La verificación desbloquea retiros",
    "withdrawalsUnlockedTitle": "Retiros desbloqueados",
    "verificationNote": "La verificación no bloquea solicitudes. Los DJs pueden recibir solicitudes pagadas mientras esperan aprobación.",
    "startHere": "Empieza aquí",
    "ready": "Listo",
    "needed": "Necesario",
    "connected": "Conectado",
    "share": "Compartir",
    "actionNeeded": "Acción necesaria",
    "queue": "Cola",
    "goLive": "Go live",
    "liveNow": "En vivo",
    "requestsAllowed": "Solicitudes permitidas",
    "unlocked": "Desbloqueado",
    "profileTodoMessage": "Configura tu perfil de DJ",
    "profileReadyMessage": "Perfil listo",
    "payoutTodoMessage": "Agrega método de pago",
    "payoutReadyMessage": "Método de pago agregado",
    "openRequestsMessage": "Abrir solicitudes",
    "liveMessage": "Solicitudes abiertas",
    "shareQrMessage": "Comparte tu código QR",
    "watchQueueMessage": "Mira tu cola de solicitudes",
    "acceptRequestsMessage": "Aceptar solicitudes pendientes",
    "verificationNotStartedMessage": "La verificación desbloquea retiros",
    "verificationPendingMessage": "La verificación desbloquea retiros",
    "connectPayoutMessage": "Agrega método de pago",
    "withdrawalsReadyMessage": "Retiros desbloqueados"
  },
  "fr": {
    "eyebrow": "Configuration rapide",
    "heading": "Que faire maintenant",
    "subtitle": "Terminez ces étapes pour recevoir des demandes et débloquer les retraits.",
    "profileTodoTitle": "Configurez votre profil DJ",
    "profileReadyTitle": "Profil prêt",
    "payoutTodoTitle": "Ajoutez une méthode de paiement",
    "payoutReadyTitle": "Méthode de paiement ajoutée",
    "openRequestsTitle": "Ouvrir les demandes",
    "liveTitle": "Demandes ouvertes",
    "shareQrTitle": "Partagez votre QR code",
    "watchQueueTitle": "Surveillez la file de demandes",
    "acceptRequestsTitle": "Accepter les demandes en attente",
    "verificationTitle": "La vérification débloque les retraits",
    "withdrawalsUnlockedTitle": "Retraits débloqués",
    "verificationNote": "La vérification ne bloque pas les demandes. Les DJs peuvent recevoir des demandes payantes pendant l’attente.",
    "startHere": "Commencez ici",
    "ready": "Prêt",
    "needed": "Nécessaire",
    "connected": "Connecté",
    "share": "Partager",
    "actionNeeded": "Action requise",
    "queue": "File",
    "goLive": "Go live",
    "liveNow": "En direct",
    "requestsAllowed": "Demandes autorisées",
    "unlocked": "Débloqué",
    "profileTodoMessage": "Configurez votre profil DJ",
    "profileReadyMessage": "Profil prêt",
    "payoutTodoMessage": "Ajoutez une méthode de paiement",
    "payoutReadyMessage": "Méthode de paiement ajoutée",
    "openRequestsMessage": "Ouvrir les demandes",
    "liveMessage": "Demandes ouvertes",
    "shareQrMessage": "Partagez votre QR code",
    "watchQueueMessage": "Surveillez la file de demandes",
    "acceptRequestsMessage": "Accepter les demandes en attente",
    "verificationNotStartedMessage": "La vérification débloque les retraits",
    "verificationPendingMessage": "La vérification débloque les retraits",
    "connectPayoutMessage": "Ajoutez une méthode de paiement",
    "withdrawalsReadyMessage": "Retraits débloqués"
  },
  "de": {
    "eyebrow": "Schnelle Einrichtung",
    "heading": "Was jetzt zu tun ist",
    "subtitle": "Schließe diese Schritte ab, um Anfragen anzunehmen und Auszahlungen freizuschalten.",
    "profileTodoTitle": "DJ-Profil einrichten",
    "profileReadyTitle": "Profil ist bereit",
    "payoutTodoTitle": "Auszahlungsmethode hinzufügen",
    "payoutReadyTitle": "Auszahlungsmethode hinzugefügt",
    "openRequestsTitle": "Anfragen öffnen",
    "liveTitle": "Anfragen geöffnet",
    "shareQrTitle": "QR-Code teilen",
    "watchQueueTitle": "Request-Queue beobachten",
    "acceptRequestsTitle": "Ausstehende Anfragen annehmen",
    "verificationTitle": "Verifizierung schaltet Auszahlungen frei",
    "withdrawalsUnlockedTitle": "Auszahlungen freigeschaltet",
    "verificationNote": "Verifizierung stoppt keine Anfragen. DJs können live gehen und bezahlte Anfragen erhalten, während die Freigabe aussteht.",
    "startHere": "Hier starten",
    "ready": "Bereit",
    "needed": "Benötigt",
    "connected": "Verbunden",
    "share": "Teilen",
    "actionNeeded": "Aktion nötig",
    "queue": "Queue",
    "goLive": "Go live",
    "liveNow": "Live",
    "requestsAllowed": "Anfragen erlaubt",
    "unlocked": "Freigeschaltet",
    "profileTodoMessage": "DJ-Profil einrichten",
    "profileReadyMessage": "Profil ist bereit",
    "payoutTodoMessage": "Auszahlungsmethode hinzufügen",
    "payoutReadyMessage": "Auszahlungsmethode hinzugefügt",
    "openRequestsMessage": "Anfragen öffnen",
    "liveMessage": "Anfragen geöffnet",
    "shareQrMessage": "QR-Code teilen",
    "watchQueueMessage": "Request-Queue beobachten",
    "acceptRequestsMessage": "Ausstehende Anfragen annehmen",
    "verificationNotStartedMessage": "Verifizierung schaltet Auszahlungen frei",
    "verificationPendingMessage": "Verifizierung schaltet Auszahlungen frei",
    "connectPayoutMessage": "Auszahlungsmethode hinzufügen",
    "withdrawalsReadyMessage": "Auszahlungen freigeschaltet"
  },
  "ru": {
    "eyebrow": "Быстрая настройка",
    "heading": "Что сделать сейчас",
    "subtitle": "Выполните шаги, чтобы принимать заявки и открыть вывод средств.",
    "profileTodoTitle": "Настройте профиль DJ",
    "profileReadyTitle": "Профиль готов",
    "payoutTodoTitle": "Добавьте способ выплат",
    "payoutReadyTitle": "Способ выплат добавлен",
    "openRequestsTitle": "Открыть заявки",
    "liveTitle": "Заявки открыты",
    "shareQrTitle": "Поделитесь QR-кодом",
    "watchQueueTitle": "Следите за очередью",
    "acceptRequestsTitle": "Принять ожидающие заявки",
    "verificationTitle": "Проверка открывает выводы",
    "withdrawalsUnlockedTitle": "Выводы открыты",
    "verificationNote": "Проверка не блокирует заявки. DJ может принимать платные заявки во время ожидания.",
    "startHere": "Начните здесь",
    "ready": "Готово",
    "needed": "Нужно",
    "connected": "Подключено",
    "share": "Поделиться",
    "actionNeeded": "Нужно действие",
    "queue": "Очередь",
    "goLive": "Go live",
    "liveNow": "В эфире",
    "requestsAllowed": "Заявки разрешены",
    "unlocked": "Открыто",
    "profileTodoMessage": "Настройте профиль DJ",
    "profileReadyMessage": "Профиль готов",
    "payoutTodoMessage": "Добавьте способ выплат",
    "payoutReadyMessage": "Способ выплат добавлен",
    "openRequestsMessage": "Открыть заявки",
    "liveMessage": "Заявки открыты",
    "shareQrMessage": "Поделитесь QR-кодом",
    "watchQueueMessage": "Следите за очередью",
    "acceptRequestsMessage": "Принять ожидающие заявки",
    "verificationNotStartedMessage": "Проверка открывает выводы",
    "verificationPendingMessage": "Проверка открывает выводы",
    "connectPayoutMessage": "Добавьте способ выплат",
    "withdrawalsReadyMessage": "Выводы открыты"
  },
  "tr": {
    "eyebrow": "Hızlı Kurulum",
    "heading": "Şimdi ne yapılacak",
    "subtitle": "İstek almaya başlamak ve para çekmeyi açmak için bu adımları tamamlayın.",
    "profileTodoTitle": "DJ profilini ayarla",
    "profileReadyTitle": "Profil hazır",
    "payoutTodoTitle": "Payout yöntemi ekle",
    "payoutReadyTitle": "Payout yöntemi eklendi",
    "openRequestsTitle": "İstekleri aç",
    "liveTitle": "İstekler açık",
    "shareQrTitle": "QR kodunu paylaş",
    "watchQueueTitle": "İstek kuyruğunu izle",
    "acceptRequestsTitle": "Bekleyen istekleri kabul et",
    "verificationTitle": "Doğrulama para çekmeyi açar",
    "withdrawalsUnlockedTitle": "Para çekme açık",
    "verificationNote": "Doğrulama istekleri durdurmaz. DJ’ler onay beklerken ücretli istek alabilir.",
    "startHere": "Buradan başla",
    "ready": "Hazır",
    "needed": "Gerekli",
    "connected": "Bağlı",
    "share": "Paylaş",
    "actionNeeded": "İşlem gerekli",
    "queue": "Kuyruk",
    "goLive": "Go live",
    "liveNow": "Canlı",
    "requestsAllowed": "İsteklere izin var",
    "unlocked": "Açık",
    "profileTodoMessage": "DJ profilini ayarla",
    "profileReadyMessage": "Profil hazır",
    "payoutTodoMessage": "Payout yöntemi ekle",
    "payoutReadyMessage": "Payout yöntemi eklendi",
    "openRequestsMessage": "İstekleri aç",
    "liveMessage": "İstekler açık",
    "shareQrMessage": "QR kodunu paylaş",
    "watchQueueMessage": "İstek kuyruğunu izle",
    "acceptRequestsMessage": "Bekleyen istekleri kabul et",
    "verificationNotStartedMessage": "Doğrulama para çekmeyi açar",
    "verificationPendingMessage": "Doğrulama para çekmeyi açar",
    "connectPayoutMessage": "Payout yöntemi ekle",
    "withdrawalsReadyMessage": "Para çekme açık"
  },
  "it": {
    "eyebrow": "Configurazione rapida",
    "heading": "Cosa fare ora",
    "subtitle": "Completa questi passaggi per ricevere richieste e sbloccare i prelievi.",
    "profileTodoTitle": "Configura il profilo DJ",
    "profileReadyTitle": "Profilo pronto",
    "payoutTodoTitle": "Aggiungi metodo payout",
    "payoutReadyTitle": "Metodo payout aggiunto",
    "openRequestsTitle": "Apri richieste",
    "liveTitle": "Richieste aperte",
    "shareQrTitle": "Condividi il QR code",
    "watchQueueTitle": "Controlla la coda richieste",
    "acceptRequestsTitle": "Accetta richieste in attesa",
    "verificationTitle": "La verifica sblocca i prelievi",
    "withdrawalsUnlockedTitle": "Prelievi sbloccati",
    "verificationNote": "La verifica non blocca le richieste. I DJ possono ricevere richieste pagate mentre attendono approvazione.",
    "startHere": "Inizia qui",
    "ready": "Pronto",
    "needed": "Necessario",
    "connected": "Collegato",
    "share": "Condividi",
    "actionNeeded": "Azione richiesta",
    "queue": "Coda",
    "goLive": "Go live",
    "liveNow": "Live",
    "requestsAllowed": "Richieste consentite",
    "unlocked": "Sbloccato",
    "profileTodoMessage": "Configura il profilo DJ",
    "profileReadyMessage": "Profilo pronto",
    "payoutTodoMessage": "Aggiungi metodo payout",
    "payoutReadyMessage": "Metodo payout aggiunto",
    "openRequestsMessage": "Apri richieste",
    "liveMessage": "Richieste aperte",
    "shareQrMessage": "Condividi il QR code",
    "watchQueueMessage": "Controlla la coda richieste",
    "acceptRequestsMessage": "Accetta richieste in attesa",
    "verificationNotStartedMessage": "La verifica sblocca i prelievi",
    "verificationPendingMessage": "La verifica sblocca i prelievi",
    "connectPayoutMessage": "Aggiungi metodo payout",
    "withdrawalsReadyMessage": "Prelievi sbloccati"
  },
  "nl": {
    "eyebrow": "Snelle setup",
    "heading": "Wat je nu moet doen",
    "subtitle": "Voltooi deze stappen om verzoeken te ontvangen en opnames te ontgrendelen.",
    "profileTodoTitle": "Stel je DJ-profiel in",
    "profileReadyTitle": "Profiel is klaar",
    "payoutTodoTitle": "Voeg uitbetaalmethode toe",
    "payoutReadyTitle": "Uitbetaalmethode toegevoegd",
    "openRequestsTitle": "Open verzoeken",
    "liveTitle": "Verzoeken open",
    "shareQrTitle": "Deel je QR-code",
    "watchQueueTitle": "Bekijk je request queue",
    "acceptRequestsTitle": "Accepteer openstaande verzoeken",
    "verificationTitle": "Verificatie ontgrendelt opnames",
    "withdrawalsUnlockedTitle": "Opnames ontgrendeld",
    "verificationNote": "Verificatie stopt verzoeken niet. DJs kunnen live gaan en betaalde verzoeken ontvangen terwijl goedkeuring loopt.",
    "startHere": "Begin hier",
    "ready": "Klaar",
    "needed": "Nodig",
    "connected": "Verbonden",
    "share": "Delen",
    "actionNeeded": "Actie nodig",
    "queue": "Queue",
    "goLive": "Go live",
    "liveNow": "Live",
    "requestsAllowed": "Verzoeken toegestaan",
    "unlocked": "Ontgrendeld",
    "profileTodoMessage": "Stel je DJ-profiel in",
    "profileReadyMessage": "Profiel is klaar",
    "payoutTodoMessage": "Voeg uitbetaalmethode toe",
    "payoutReadyMessage": "Uitbetaalmethode toegevoegd",
    "openRequestsMessage": "Open verzoeken",
    "liveMessage": "Verzoeken open",
    "shareQrMessage": "Deel je QR-code",
    "watchQueueMessage": "Bekijk je request queue",
    "acceptRequestsMessage": "Accepteer openstaande verzoeken",
    "verificationNotStartedMessage": "Verificatie ontgrendelt opnames",
    "verificationPendingMessage": "Verificatie ontgrendelt opnames",
    "connectPayoutMessage": "Voeg uitbetaalmethode toe",
    "withdrawalsReadyMessage": "Opnames ontgrendeld"
  },
  "pl": {
    "eyebrow": "Szybka konfiguracja",
    "heading": "Co zrobić teraz",
    "subtitle": "Wykonaj te kroki, aby przyjmować prośby i odblokować wypłaty.",
    "profileTodoTitle": "Skonfiguruj profil DJ",
    "profileReadyTitle": "Profil gotowy",
    "payoutTodoTitle": "Dodaj metodę wypłaty",
    "payoutReadyTitle": "Metoda wypłaty dodana",
    "openRequestsTitle": "Otwórz prośby",
    "liveTitle": "Prośby otwarte",
    "shareQrTitle": "Udostępnij kod QR",
    "watchQueueTitle": "Obserwuj kolejkę próśb",
    "acceptRequestsTitle": "Akceptuj oczekujące prośby",
    "verificationTitle": "Weryfikacja odblokowuje wypłaty",
    "withdrawalsUnlockedTitle": "Wypłaty odblokowane",
    "verificationNote": "Weryfikacja nie blokuje próśb. DJ może przyjmować płatne prośby podczas oczekiwania.",
    "startHere": "Zacznij tutaj",
    "ready": "Gotowe",
    "needed": "Potrzebne",
    "connected": "Połączono",
    "share": "Udostępnij",
    "actionNeeded": "Wymaga działania",
    "queue": "Kolejka",
    "goLive": "Go live",
    "liveNow": "Live",
    "requestsAllowed": "Prośby dozwolone",
    "unlocked": "Odblokowane",
    "profileTodoMessage": "Skonfiguruj profil DJ",
    "profileReadyMessage": "Profil gotowy",
    "payoutTodoMessage": "Dodaj metodę wypłaty",
    "payoutReadyMessage": "Metoda wypłaty dodana",
    "openRequestsMessage": "Otwórz prośby",
    "liveMessage": "Prośby otwarte",
    "shareQrMessage": "Udostępnij kod QR",
    "watchQueueMessage": "Obserwuj kolejkę próśb",
    "acceptRequestsMessage": "Akceptuj oczekujące prośby",
    "verificationNotStartedMessage": "Weryfikacja odblokowuje wypłaty",
    "verificationPendingMessage": "Weryfikacja odblokowuje wypłaty",
    "connectPayoutMessage": "Dodaj metodę wypłaty",
    "withdrawalsReadyMessage": "Wypłaty odblokowane"
  },
  "el": {
    "eyebrow": "Γρήγορη ρύθμιση",
    "heading": "Τι να κάνεις τώρα",
    "subtitle": "Ολοκλήρωσε αυτά τα βήματα για να δέχεσαι αιτήματα και να ξεκλειδώσεις αναλήψεις.",
    "profileTodoTitle": "Ρύθμισε το DJ προφίλ",
    "profileReadyTitle": "Το προφίλ είναι έτοιμο",
    "payoutTodoTitle": "Πρόσθεσε τρόπο πληρωμής",
    "payoutReadyTitle": "Προστέθηκε τρόπος πληρωμής",
    "openRequestsTitle": "Άνοιγμα αιτημάτων",
    "liveTitle": "Τα αιτήματα είναι ανοιχτά",
    "shareQrTitle": "Μοιράσου το QR code",
    "watchQueueTitle": "Παρακολούθησε την ουρά",
    "acceptRequestsTitle": "Αποδοχή εκκρεμών αιτημάτων",
    "verificationTitle": "Η επαλήθευση ξεκλειδώνει αναλήψεις",
    "withdrawalsUnlockedTitle": "Οι αναλήψεις ξεκλειδώθηκαν",
    "verificationNote": "Η επαλήθευση δεν σταματά τα αιτήματα. Οι DJs μπορούν να δέχονται πληρωμένα αιτήματα όσο εκκρεμεί η έγκριση.",
    "startHere": "Ξεκίνα εδώ",
    "ready": "Έτοιμο",
    "needed": "Απαραίτητο",
    "connected": "Συνδέθηκε",
    "share": "Μοιράσου",
    "actionNeeded": "Χρειάζεται ενέργεια",
    "queue": "Ουρά",
    "goLive": "Go live",
    "liveNow": "Live τώρα",
    "requestsAllowed": "Αιτήματα επιτρέπονται",
    "unlocked": "Ξεκλειδώθηκε",
    "profileTodoMessage": "Ρύθμισε το DJ προφίλ",
    "profileReadyMessage": "Το προφίλ είναι έτοιμο",
    "payoutTodoMessage": "Πρόσθεσε τρόπο πληρωμής",
    "payoutReadyMessage": "Προστέθηκε τρόπος πληρωμής",
    "openRequestsMessage": "Άνοιγμα αιτημάτων",
    "liveMessage": "Τα αιτήματα είναι ανοιχτά",
    "shareQrMessage": "Μοιράσου το QR code",
    "watchQueueMessage": "Παρακολούθησε την ουρά",
    "acceptRequestsMessage": "Αποδοχή εκκρεμών αιτημάτων",
    "verificationNotStartedMessage": "Η επαλήθευση ξεκλειδώνει αναλήψεις",
    "verificationPendingMessage": "Η επαλήθευση ξεκλειδώνει αναλήψεις",
    "connectPayoutMessage": "Πρόσθεσε τρόπο πληρωμής",
    "withdrawalsReadyMessage": "Οι αναλήψεις ξεκλειδώθηκαν"
  },
  "uk": {
    "eyebrow": "Швидке налаштування",
    "heading": "Що зробити зараз",
    "subtitle": "Виконайте ці кроки, щоб приймати запити й розблокувати виведення коштів.",
    "profileTodoTitle": "Налаштуйте профіль DJ",
    "profileReadyTitle": "Профіль готовий",
    "payoutTodoTitle": "Додайте спосіб виплат",
    "payoutReadyTitle": "Спосіб виплат додано",
    "openRequestsTitle": "Відкрити запити",
    "liveTitle": "Запити відкриті",
    "shareQrTitle": "Поділіться QR-кодом",
    "watchQueueTitle": "Слідкуйте за чергою запитів",
    "acceptRequestsTitle": "Прийняти очікувані запити",
    "verificationTitle": "Верифікація відкриває виведення",
    "withdrawalsUnlockedTitle": "Виведення розблоковано",
    "verificationNote": "Верифікація не блокує запити. DJ може приймати платні запити, поки очікує схвалення.",
    "startHere": "Почніть тут",
    "ready": "Готово",
    "needed": "Потрібно",
    "connected": "Підключено",
    "share": "Поділитися",
    "actionNeeded": "Потрібна дія",
    "queue": "Черга",
    "goLive": "Go live",
    "liveNow": "У live",
    "requestsAllowed": "Запити дозволено",
    "unlocked": "Розблоковано",
    "profileTodoMessage": "Налаштуйте профіль DJ",
    "profileReadyMessage": "Профіль готовий",
    "payoutTodoMessage": "Додайте спосіб виплат",
    "payoutReadyMessage": "Спосіб виплат додано",
    "openRequestsMessage": "Відкрити запити",
    "liveMessage": "Запити відкриті",
    "shareQrMessage": "Поділіться QR-кодом",
    "watchQueueMessage": "Слідкуйте за чергою запитів",
    "acceptRequestsMessage": "Прийняти очікувані запити",
    "verificationNotStartedMessage": "Верифікація відкриває виведення",
    "verificationPendingMessage": "Верифікація відкриває виведення",
    "connectPayoutMessage": "Додайте спосіб виплат",
    "withdrawalsReadyMessage": "Виведення розблоковано"
  }
};

export default function AdminPage() {
  const [dj, setDj] = useState<DJ | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [instagram, setInstagram] = useState("");
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [country, setCountry] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("GHS");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("Mobile Money");
  const [payoutStatus, setPayoutStatus] = useState("Not Connected");
  const [payoutProvider, setPayoutProvider] = useState("MTN");
  const [payoutAccountName, setPayoutAccountName] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutBankCode, setPayoutBankCode] = useState("");
  const [paystackRecipientCode, setPaystackRecipientCode] = useState("");
  const [paystackBanks, setPaystackBanks] = useState<PaystackBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [connectingPayout, setConnectingPayout] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("not_started");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [expandedWithdrawalIds, setExpandedWithdrawalIds] = useState<number[]>(
    [],
  );
  const [expandedWithdrawalTimelineIds, setExpandedWithdrawalTimelineIds] =
    useState<number[]>([]);
  const [isWithdrawalHistoryExpanded, setIsWithdrawalHistoryExpanded] =
    useState(false);

  const [language, setLanguage] = useState<Language>("en");

  const t = translations[language];
  const quickSetupText = quickSetupTranslations[language] || quickSetupTranslations.en;

  function getCurrentScrollY() {
    if (typeof window === "undefined") return 0;
    return window.scrollY;
  }

  function restoreScrollPosition(scrollY: number) {
    if (typeof window === "undefined") return;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    });

    window.setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    }, 50);
  }

  function getCurrencyForCountry(selectedCountry: string) {
    const countryCurrencyMap: Record<string, string> = {
      Ghana: "GHS",
      Nigeria: "NGN",
      Kenya: "KES",
      "South Africa": "ZAR",

      "United Kingdom": "GBP",
      "United States": "USD",
      Canada: "CAD",
      Mexico: "MXN",
      Brazil: "BRL",

      Germany: "EUR",
      France: "EUR",
      Spain: "EUR",
      Italy: "EUR",
      Netherlands: "EUR",
      Poland: "PLN",
      Greece: "EUR",
      Ukraine: "UAH",
      Turkey: "TRY",

      UAE: "AED",
      Qatar: "QAR",
      "Saudi Arabia": "SAR",

      Singapore: "SGD",
      Malaysia: "MYR",
      Indonesia: "IDR",
      Thailand: "THB",
      Philippines: "PHP",
      Vietnam: "VND",
      China: "CNY",
      Japan: "JPY",
      "South Korea": "KRW",
      India: "INR",

      Australia: "AUD",
      "New Zealand": "NZD",
    };

    return countryCurrencyMap[selectedCountry] || "USD";
  }

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const isFetchingDashboardRef = useRef(false);
  const requestQueueRef = useRef<HTMLDivElement | null>(null);
  const liveControlsRef = useRef<HTMLDivElement | null>(null);
  const profileSectionRef = useRef<HTMLDivElement | null>(null);
  const qrCodeSectionRef = useRef<HTMLDivElement | null>(null);
  const withdrawalsSectionRef = useRef<HTMLDivElement | null>(null);
  const previousRequestCountRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const scrollStorageKey = "blackline-dj-admin-scroll-y";

  function scrollToQuickSetupTarget(
    target: "profile" | "payout" | "live" | "qr" | "queue" | "withdrawals",
  ) {
    const targetMap = {
      profile: profileSectionRef,
      payout: profileSectionRef,
      live: liveControlsRef,
      qr: qrCodeSectionRef,
      queue: requestQueueRef,
      withdrawals: withdrawalsSectionRef,
    };

    const targetRef = targetMap[target];

    targetRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function saveDashboardScrollPosition() {
    if (typeof window === "undefined") return;

    lastScrollYRef.current = window.scrollY;
    window.sessionStorage.setItem(scrollStorageKey, String(window.scrollY));
  }

  function restoreSavedDashboardScrollPosition() {
    if (typeof window === "undefined") return;

    const savedScroll = Number(
      window.sessionStorage.getItem(scrollStorageKey) ||
        lastScrollYRef.current ||
        0,
    );

    if (!savedScroll || Number.isNaN(savedScroll)) return;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: savedScroll, behavior: "auto" });
    });

    window.setTimeout(() => {
      window.scrollTo({ top: savedScroll, behavior: "auto" });
    }, 50);

    window.setTimeout(() => {
      window.scrollTo({ top: savedScroll, behavior: "auto" });
    }, 200);

    window.setTimeout(() => {
      window.scrollTo({ top: savedScroll, behavior: "auto" });
    }, 500);
  }

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    restoreSavedDashboardScrollPosition();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      saveDashboardScrollPosition();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveDashboardScrollPosition();
        return;
      }

      restoreSavedDashboardScrollPosition();
    };

    const handleTabReturn = () => {
      restoreSavedDashboardScrollPosition();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("focus", handleTabReturn);
    window.addEventListener("pageshow", handleTabReturn);
    window.addEventListener("pagehide", saveDashboardScrollPosition);
    window.addEventListener("beforeunload", saveDashboardScrollPosition);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("focus", handleTabReturn);
      window.removeEventListener("pageshow", handleTabReturn);
      window.removeEventListener("pagehide", saveDashboardScrollPosition);
      window.removeEventListener("beforeunload", saveDashboardScrollPosition);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function loadPaystackBanks(currencyCode: string) {
    if (!currencyCode) return;

    setBanksLoading(true);

    try {
      const response = await fetch(
        `/api/paystack/banks?currency=${currencyCode}`,
      );
      const result = await response.json();

      if (!response.ok) {
        console.error("PAYSTACK BANKS ERROR:", result);
        setPaystackBanks([]);
        setBanksLoading(false);
        return;
      }

      setPaystackBanks((result.banks || []) as PaystackBank[]);
    } catch (error) {
      console.error("PAYSTACK BANKS FETCH ERROR:", error);
      setPaystackBanks([]);
    }

    setBanksLoading(false);
  }

  async function loadLoggedInDJ() {
    setAuthLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDj(null);
      setAuthLoading(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("djs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      console.error(error);
      setDj(null);
      setAuthLoading(false);
      setLoading(false);
      return;
    }

    setDj(data as DJ);

    setBio(data.bio || "");
    setCity(data.city || "");
    setInstagram(data.instagram || "");
    setProfileImage(data.profile_image || "");
    setEventName(data.event_name || "");
    setVenue(data.venue || "");

    setCountry(data.country || "");
    setPreferredCurrency(data.preferred_currency || "GHS");
    setPayoutEmail(data.payout_email || "");
    setPayoutMethod(data.payout_method || "Mobile Money");
    setPayoutStatus(data.payout_status || "not_connected");
    setPayoutProvider(data.payout_provider || "MTN");
    setPayoutAccountName(data.payout_account_name || "");
    setPayoutAccountNumber(data.payout_account_number || "");
    setPayoutBankCode(data.payout_bank_code || "");
    setPaystackRecipientCode(data.paystack_recipient_code || "");
    setVerificationStatus(data.verification_status || "not_started");

    setAuthLoading(false);
  }

  useEffect(() => {
    loadLoggedInDJ();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setDj(null);
        return;
      }

      if (event === "SIGNED_IN") {
        loadLoggedInDJ();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (payoutMethod === "Bank Transfer") {
      loadPaystackBanks(preferredCurrency);
    }
  }, [payoutMethod, preferredCurrency]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setDj(null);
  }

  async function toggleLiveStatus() {
    if (!dj) return;

    const nextLiveStatus = !dj.is_live;

    const { error } = await supabase
      .from("djs")
      .update({ is_live: nextLiveStatus })
      .eq("id", dj.id);

    if (error) {
      console.error(error);
      alert("Failed to update live status");
      return;
    }

    setDj({
      ...dj,
      is_live: nextLiveStatus,
    });
  }

  async function endDJSet() {
    if (!dj) return;

    const confirmEnd = window.confirm("End DJ set and clear active queue?");

    if (!confirmEnd) return;

    const currentScrollY = getCurrentScrollY();

    setActionLoadingId(-1);

    await supabase.from("djs").update({ is_live: false }).eq("id", dj.id);

    await supabase
      .from("requests")
      .update({ status: "finished" })
      .eq("dj_id", dj.id)
      .in("status", ["accepted", "played"]);

    await fetchDashboardData();

    setDj({
      ...dj,
      is_live: false,
    });

    setActionLoadingId(null);
    restoreScrollPosition(currentScrollY);

    alert("DJ set ended successfully");
  }

  async function connectPayoutAccount() {
    if (!dj) return;

    if (!country) {
      alert("Please select your country.");
      return;
    }

    if (!preferredCurrency) {
      alert("Please select your payout currency.");
      return;
    }

    if (!payoutEmail.trim()) {
      alert("Please enter your payout email.");
      return;
    }

    if (!payoutMethod) {
      alert("Please select a payout method.");
      return;
    }

    if (!payoutProvider.trim()) {
      alert("Please enter/select your payout provider.");
      return;
    }

    if (!payoutAccountName.trim()) {
      alert("Please enter the account name.");
      return;
    }

    if (!payoutAccountNumber.trim()) {
      alert("Please enter the account number.");
      return;
    }

    if (payoutMethod === "Bank Transfer" && !payoutBankCode) {
      alert("Please select your bank.");
      return;
    }

    setConnectingPayout(true);

    try {
      const response = await fetch("/api/paystack/create-recipient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          djId: dj.id,
          country,
          currency: preferredCurrency,
          payoutMethod,
          payoutProvider,
          payoutAccountName,
          payoutAccountNumber,
          payoutBankCode,
          payoutEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("CREATE RECIPIENT ERROR:", result);
        alert(result.error || "Failed to connect payout account.");
        setConnectingPayout(false);
        return;
      }

      setDj(result.dj as DJ);
      setPayoutStatus("Active");
      setPaystackRecipientCode(result.recipientCode || "");
      setConnectingPayout(false);

      alert(
        `Payout account connected. Recipient code: ${result.recipientCode}`,
      );
    } catch (error) {
      console.error("CONNECT PAYOUT ERROR:", error);
      alert("Failed to connect payout account.");
      setConnectingPayout(false);
    }
  }

  async function saveProfile() {
    if (!dj) return;

    setSavingProfile(true);
    setProfileMessage("");

    const { data, error } = await supabase
      .from("djs")
      .update({
        bio,
        city,
        instagram,
        profile_image: profileImage,
        event_name: eventName,
        venue,

        country,
        preferred_currency: preferredCurrency,
        payout_email: payoutEmail,
        payout_method: payoutMethod,
        payout_status: payoutStatus,
        payout_provider: payoutProvider,
        payout_account_name: payoutAccountName,
        payout_account_number: payoutAccountNumber,
        payout_bank_code: payoutBankCode || null,
        verification_status: verificationStatus,
      })
      .eq("id", dj.id)
      .select()
      .single();

    if (error) {
      console.error("PROFILE UPDATE ERROR:", error);
      setProfileMessage(error.message || "Profile update failed.");
      setSavingProfile(false);
      return;
    }

    setDj(data as DJ);

    setProfileMessage("Profile updated successfully.");
    setSavingProfile(false);
  }

  async function handleProfileImageUpload(file: File) {
    if (!dj) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${dj.stage_name}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("dj-profile-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Failed to upload image");
      return;
    }

    const { data } = supabase.storage
      .from("dj-profile-images")
      .getPublicUrl(fileName);

    setProfileImage(data.publicUrl);
  }

  async function fetchDashboardData(targetDj?: DJ | null) {
    if (isFetchingDashboardRef.current) {
      return;
    }

    const activeDj = targetDj || dj;

    if (!activeDj) {
      return;
    }

    isFetchingDashboardRef.current = true;

    try {
      const { data: requestsData } = await supabase
        .from("requests")
        .select("*")
        .eq("dj_id", activeDj.id)
        .order("queue_position", { ascending: true })
        .order("tip_amount", { ascending: false });

      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .eq("dj_id", activeDj.id)
        .order("created_at", { ascending: false });

      const { data: withdrawalsData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("dj_id", activeDj.id)
        .order("created_at", { ascending: false });

      const { data: auditLogsData } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const filteredAuditLogs = ((auditLogsData || []) as AuditLog[])
        .filter((log) => {
          const metadataDjId = Number(log.metadata?.dj_id || 0);
          const entityId = Number(log.entity_id || 0);

          return (
            metadataDjId === activeDj.id ||
            (log.entity_type === "dj" && entityId === activeDj.id)
          );
        })
        .slice(0, 20);

      setRequests((requestsData || []) as SongRequest[]);
      setPayments((paymentsData || []) as Payment[]);
      setWithdrawals((withdrawalsData || []) as Withdrawal[]);
      setAuditLogs(filteredAuditLogs);
    } catch (error) {
      console.error("DASHBOARD FETCH ERROR:", error);
    } finally {
      isFetchingDashboardRef.current = false;

      if (loading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!dj) return;

    const activeDj = dj;

    const refreshDashboardIfVisible = async () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        saveDashboardScrollPosition();
        return;
      }

      const scrollBeforeRefresh = getCurrentScrollY();

      await fetchDashboardData(activeDj);

      if (scrollBeforeRefresh > 0) {
        restoreScrollPosition(scrollBeforeRefresh);
      }
    };

    refreshDashboardIfVisible();

    const refreshInterval = setInterval(() => {
      refreshDashboardIfVisible();
    }, 10000);

    const handleVisibleRefresh = () => {
      if (document.visibilityState === "hidden") {
        saveDashboardScrollPosition();
        return;
      }

      restoreSavedDashboardScrollPosition();
      refreshDashboardIfVisible();
    };

    document.addEventListener("visibilitychange", handleVisibleRefresh);

    const requestsChannel = supabase
      .channel(`admin-live-requests-${activeDj.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "requests",
          filter: `dj_id=eq.${activeDj.id}`,
        },
        async () => {
          await refreshDashboardIfVisible();

          requestQueueRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "requests",
          filter: `dj_id=eq.${activeDj.id}`,
        },
        () => refreshDashboardIfVisible(),
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel(`admin-live-payments-${activeDj.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `dj_id=eq.${activeDj.id}`,
        },
        () => refreshDashboardIfVisible(),
      )
      .subscribe();

    const withdrawalsChannel = supabase
      .channel(`admin-live-withdrawals-${activeDj.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawals",
          filter: `dj_id=eq.${activeDj.id}`,
        },
        () => refreshDashboardIfVisible(),
      )
      .subscribe();

    const auditLogsChannel = supabase
      .channel(`admin-live-audit-logs-${activeDj.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "audit_logs",
        },
        () => refreshDashboardIfVisible(),
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", handleVisibleRefresh);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(withdrawalsChannel);
      supabase.removeChannel(auditLogsChannel);
    };
  }, [dj?.id]);

  async function updateStatus(id: number, status: RequestStatus) {
    const currentScrollY = getCurrentScrollY();

    setActionLoadingId(id);
    await supabase.from("requests").update({ status }).eq("id", id);
    await fetchDashboardData();
    setActionLoadingId(null);

    restoreScrollPosition(currentScrollY);
  }

  async function deleteRequest(id: number) {
    if (!window.confirm("Delete this request?")) return;

    const currentScrollY = getCurrentScrollY();

    setActionLoadingId(id);
    await supabase.from("requests").delete().eq("id", id);
    await fetchDashboardData();
    setActionLoadingId(null);

    restoreScrollPosition(currentScrollY);
  }

  async function moveRequest(requestId: number, direction: "up" | "down") {
    const currentIndex = grouped.accepted.findIndex(
      (request) => request.id === requestId,
    );

    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= grouped.accepted.length) return;

    const reordered = [...grouped.accepted];

    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    const currentScrollY = getCurrentScrollY();

    setActionLoadingId(requestId);

    for (let index = 0; index < reordered.length; index++) {
      await supabase
        .from("requests")
        .update({ queue_position: index + 1 })
        .eq("id", reordered[index].id);
    }

    await fetchDashboardData();

    setActionLoadingId(null);
    restoreScrollPosition(currentScrollY);
  }

  async function requestWithdrawal() {
    if (!dj) return;

    if (hasOpenWithdrawal) {
      alert(
        "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
      );
      return;
    }

    if (verificationStatus !== "verified") {
      alert("Verification required before withdrawals can be requested.");
      return;
    }

    if (
      payoutStatus !== "Active" ||
      !payoutMethod ||
      !payoutProvider ||
      !payoutAccountName ||
      !payoutAccountNumber ||
      !paystackRecipientCode
    ) {
      alert(
        "Please connect your payout account before requesting a withdrawal.",
      );
      return;
    }

    const amount = Number(withdrawAmount);

    if (!amount || amount <= 0) {
      alert("Enter a valid withdrawal amount");
      return;
    }

    const availableBalance = netEarnings - totalWithdrawals;

    if (amount > availableBalance) {
      alert("Insufficient available balance");
      return;
    }

    const currentScrollY = getCurrentScrollY();

    setWithdrawLoading(true);

    const { error } = await supabase.from("withdrawals").insert([
      {
        dj_id: dj.id,
        dj_name: dj.stage_name,
        amount,
        currency,
        payout_method: payoutMethod,
        account_name: payoutAccountName,
        account_number: payoutAccountNumber,
        provider: payoutProvider,
        status: "pending",
      },
    ]);

    if (error) {
      console.error("WITHDRAWAL ERROR:", error);
      alert(error.message || JSON.stringify(error));
      setWithdrawLoading(false);
      return;
    }

    alert("Withdrawal request submitted");

    setWithdrawAmount("");

    await fetchDashboardData();

    setWithdrawLoading(false);
    restoreScrollPosition(currentScrollY);
  }

  const grouped = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "pending"),
      accepted: requests.filter((r) => r.status === "accepted"),
      rejected: requests.filter((r) => r.status === "rejected"),
      played: requests.filter((r) => r.status === "played"),
      finished: requests.filter((r) => r.status === "finished"),
    };
  }, [requests]);

  const currency = payments[0]?.currency || requests[0]?.tip_currency || "GHS";

  const grossRevenue = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );

  const netEarnings = payments.reduce(
    (sum, payment) => sum + Number(payment.dj_amount || 0),
    0,
  );

  const serviceFees = payments.reduce(
    (sum, payment) => sum + Number(payment.platform_fee || 0),
    0,
  );

  const pendingPayouts = payments.filter(
    (payment) => payment.payout_status === "pending",
  ).length;

  const vipRequests = requests.filter((r) => r.tip_amount >= 50).length;

  const totalWithdrawals = withdrawals
    .filter((item) => ["pending", "approved", "paid"].includes(item.status))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const hasOpenWithdrawal = withdrawals.some(
    (withdrawal) =>
      withdrawal.status === "pending" || withdrawal.status === "approved",
  );

  const availableBalance = netEarnings - totalWithdrawals;

  const sortedWithdrawalHistory = [...withdrawals].sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime(),
  );

  const latestWithdrawal = sortedWithdrawalHistory[0];

  const withdrawalPaidTotal = sortedWithdrawalHistory
    .filter((withdrawal) => withdrawal.status === "paid")
    .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);

  const withdrawalRequestedTotal = sortedWithdrawalHistory.reduce(
    (sum, withdrawal) => sum + Number(withdrawal.amount || 0),
    0,
  );

  const withdrawalHistoryIsOpen =
    hasOpenWithdrawal || isWithdrawalHistoryExpanded;

  const hasProfileSetup = Boolean(
    dj?.stage_name?.trim() &&
    (eventName.trim() || venue.trim() || instagram.trim() || bio.trim() || profileImage.trim()),
  );

  const hasPayoutSetup = Boolean(
    payoutStatus === "Active" &&
    payoutMethod &&
    payoutProvider &&
    payoutAccountName &&
    payoutAccountNumber &&
    paystackRecipientCode,
  );

  const isVerificationApproved = verificationStatus === "verified";
  const isVerificationPending = verificationStatus === "pending";

  const quickSetupActions = [
    { number: "1", icon: hasProfileSetup ? "✅" : "🎤", title: hasProfileSetup ? quickSetupText.profileReadyTitle : quickSetupText.profileTodoTitle, message: hasProfileSetup ? quickSetupText.profileReadyMessage : quickSetupText.profileTodoMessage, status: hasProfileSetup ? quickSetupText.ready : quickSetupText.startHere, className: hasProfileSetup ? "border-green-500/40 bg-green-500/10" : "border-purple-500/50 bg-purple-500/10", target: "profile" as const },
    { number: "2", icon: hasPayoutSetup ? "✅" : "💸", title: hasPayoutSetup ? quickSetupText.payoutReadyTitle : quickSetupText.payoutTodoTitle, message: hasPayoutSetup ? quickSetupText.payoutReadyMessage : quickSetupText.payoutTodoMessage, status: hasPayoutSetup ? quickSetupText.connected : quickSetupText.needed, className: hasPayoutSetup ? "border-green-500/40 bg-green-500/10" : "border-cyan-500/40 bg-cyan-500/10", target: "payout" as const },
    { number: "3", icon: dj?.is_live ? "🟢" : "🔴", title: dj?.is_live ? quickSetupText.liveTitle : quickSetupText.openRequestsTitle, message: dj?.is_live ? quickSetupText.liveMessage : quickSetupText.openRequestsMessage, status: dj?.is_live ? quickSetupText.liveNow : quickSetupText.goLive, className: dj?.is_live ? "border-green-500/40 bg-green-500/10" : "border-green-500/50 bg-green-500/10", target: "live" as const },
    { number: "4", icon: "📲", title: quickSetupText.shareQrTitle, message: quickSetupText.shareQrMessage, status: quickSetupText.share, className: "border-purple-500/40 bg-purple-500/10", target: "qr" as const },
    { number: "5", icon: grouped.pending.length > 0 ? "🎵" : "🎧", title: grouped.pending.length > 0 ? `${quickSetupText.acceptRequestsTitle} (${grouped.pending.length})` : quickSetupText.watchQueueTitle, message: grouped.pending.length > 0 ? quickSetupText.acceptRequestsMessage : quickSetupText.watchQueueMessage, status: grouped.pending.length > 0 ? quickSetupText.actionNeeded : quickSetupText.queue, className: grouped.pending.length > 0 ? "border-yellow-500/50 bg-yellow-500/10" : "border-zinc-700 bg-black/30", target: "queue" as const },
    { number: "6", icon: isVerificationApproved ? "✅" : "🛡️", title: isVerificationApproved ? quickSetupText.withdrawalsUnlockedTitle : quickSetupText.verificationTitle, message: isVerificationApproved ? (hasPayoutSetup ? quickSetupText.withdrawalsReadyMessage : quickSetupText.connectPayoutMessage) : (isVerificationPending ? quickSetupText.verificationPendingMessage : quickSetupText.verificationNotStartedMessage), status: isVerificationApproved ? quickSetupText.unlocked : quickSetupText.requestsAllowed, className: isVerificationApproved ? "border-green-500/40 bg-green-500/10" : "border-yellow-500/40 bg-yellow-500/10", target: "withdrawals" as const },
  ];
  function toggleWithdrawalDetails(withdrawalId: number) {
    setExpandedWithdrawalIds((currentIds) =>
      currentIds.includes(withdrawalId)
        ? currentIds.filter((id) => id !== withdrawalId)
        : [...currentIds, withdrawalId],
    );
  }

  function getWithdrawalAuditLogs(withdrawalId: number) {
    return auditLogs
      .filter(
        (log) =>
          log.entity_type === "withdrawal" &&
          Number(log.entity_id) === withdrawalId,
      )
      .slice(0, 10);
  }

  function getAuditMetadataValue(log: AuditLog, key: string) {
    const value =
      log.metadata?.[key as keyof NonNullable<AuditLog["metadata"]>];
    return typeof value === "string" ? value : null;
  }

  function formatStatusText(status?: string | null) {
    if (!status) return "Updated";

    return status
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function getAuditTimelineDetails(log: AuditLog) {
    const previousStatus = getAuditMetadataValue(log, "previous_status");
    const newStatus =
      getAuditMetadataValue(log, "new_status") || log.action_type;
    const status = (newStatus || "").toLowerCase();

    const label = previousStatus
      ? `${formatStatusText(previousStatus)}  ${formatStatusText(newStatus)}`
      : formatStatusText(newStatus);

    if (status === "paid") {
      return {
        icon: "",
        label,
        dotClass: "bg-green-500/20 border-green-500 text-green-400",
        textClass: "text-green-400",
      };
    }

    if (status === "approved") {
      return {
        icon: "",
        label,
        dotClass: "bg-cyan-500/20 border-cyan-500 text-cyan-400",
        textClass: "text-cyan-400",
      };
    }

    if (status === "rejected") {
      return {
        icon: "",
        label,
        dotClass: "bg-red-500/20 border-red-500 text-red-400",
        textClass: "text-red-400",
      };
    }

    if (status === "pending") {
      return {
        icon: "",
        label,
        dotClass: "bg-yellow-500/20 border-yellow-500 text-yellow-400",
        textClass: "text-yellow-400",
      };
    }

    return {
      icon: "",
      label,
      dotClass: "bg-zinc-700/40 border-zinc-600 text-zinc-300",
      textClass: "text-zinc-300",
    };
  }

  function getWithdrawalStatusBadge(status?: string | null) {
    if (status === "pending") {
      return {
        label: " Pending",
        className: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
      };
    }

    if (status === "approved") {
      return {
        label: " Approved",
        className: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      };
    }

    if (status === "paid") {
      return {
        label: " Paid",
        className: "bg-green-500/10 border-green-500/30 text-green-400",
      };
    }

    if (status === "rejected") {
      return {
        label: " Rejected",
        className: "bg-red-500/10 border-red-500/30 text-red-400",
      };
    }

    return {
      label: status || "Unknown",
      className: "bg-zinc-500/10 border-zinc-500/30 text-zinc-400",
    };
  }

  function toggleWithdrawalTimeline(withdrawalId: number) {
    setExpandedWithdrawalTimelineIds((currentIds) =>
      currentIds.includes(withdrawalId)
        ? currentIds.filter((id) => id !== withdrawalId)
        : [...currentIds, withdrawalId],
    );
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Checking login...
      </main>
    );
  }

  if (!dj) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        Redirecting...
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-3 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleLogout}
          className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl text-sm font-semibold"
        >
          {t.logout}
        </button>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-black border border-zinc-700 rounded-xl px-4 py-2 text-sm"
        >
          <option value="en"> English</option>
          <option value="zh"> </option>
          <option value="ja"> </option>
          <option value="ko"> </option>
          <option value="id"> Bahasa Indonesia</option>
          <option value="ms"> Bahasa Melayu</option>
          <option value="th"> </option>
          <option value="hi"> </option>
          <option value="ar"> </option>
          <option value="vi"> Ting Vit</option>
          <option value="tl"> Tagalog</option>
          <option value="pt"> Portugu\'eas</option>
          <option value="es"> Espa\'f1ol</option>
          <option value="fr"> Fran\'e7ais</option>
          <option value="de"> Deutsch</option>
          <option value="ru"> </option>
          <option value="tr"> T\'fcrk\'e7e</option>
          <option value="it"> Italiano</option>
          <option value="nl"> Nederlands</option>
          <option value="pl"> Polski</option>
          <option value="el"> </option>
          <option value="uk"> </option>
        </select>
      </div>

      <div className="text-center md:text-left mb-10">
        <h1 className="text-4xl md:text-6xl font-black text-purple-500 leading-tight">
          <span className="md:hidden">
            {dj.stage_name?.toUpperCase()}
            <br />
            Dashboard
          </span>

          <span className="hidden md:inline">
            {dj.stage_name?.toUpperCase()} Dashboard
          </span>
        </h1>

        <p className="text-zinc-400 mt-3 text-lg">{t.adminSubtitle}</p>
      </div>

      <div className="bg-zinc-900 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.16)] rounded-3xl p-4 md:p-6 mb-10">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.3em] text-purple-400 font-black">
            {quickSetupText.eyebrow}
          </p>
          <h2 className="text-2xl md:text-3xl font-black mt-2">
            🎧 {quickSetupText.heading}
          </h2>
          <p className="text-sm md:text-base text-zinc-300 mt-2 max-w-3xl leading-relaxed">
            {quickSetupText.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {quickSetupActions.map((action) => (
            <button
              key={action.number}
              type="button"
              onClick={() => scrollToQuickSetupTarget(action.target)}
              className={`text-left border rounded-2xl p-4 transition hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-purple-500/70 ${action.className}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center shrink-0 font-black text-purple-300">
                  {action.number}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{action.icon}</span>
                      <h3 className="text-white font-black">{action.title}</h3>
                    </div>

                    <span className="text-[10px] font-black uppercase tracking-widest bg-black/30 border border-white/10 rounded-full px-2 py-1 text-zinc-300">
                      {action.status}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
                    {action.message}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {!isVerificationApproved && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-2xl p-4 text-sm leading-relaxed">
            {quickSetupText.verificationNote}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard title={t.totalRequests} value={requests.length} />
        <StatCard
          title={t.vipRequests}
          value={vipRequests}
          color="text-purple-400"
        />
        <StatCard
          title={t.pendingQueue}
          value={grouped.pending.length}
          color="text-yellow-400"
        />
        <StatCard
          title={t.paidTransactions}
          value={payments.length}
          color="text-green-400"
        />
      </div>

      <div
        ref={liveControlsRef}
        className={`scroll-mt-6 border rounded-3xl p-4 md:p-6 mb-10 ${
          dj.is_live
            ? "bg-green-950 border-green-700"
            : "bg-zinc-900 border-zinc-800"
        }`}
      >
        <div className="flex flex-col gap-4">
          <div>
            <h2
              className={`text-2xl md:text-3xl font-bold ${
                dj.is_live ? "text-green-400" : "text-zinc-300"
              }`}
            >
              {dj.is_live ? t.liveNow : t.offline}
            </h2>

            <p className="text-zinc-400 mt-2 text-sm md:text-base">
              {dj.is_live ? t.liveGuestsMessage : t.offlineGuestsMessage}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={toggleLiveStatus}
              className={`w-full px-3 md:px-6 py-4 rounded-xl font-bold text-sm md:text-lg whitespace-nowrap ${
                dj.is_live
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {dj.is_live ? t.goOffline : t.goLive}
            </button>

            <button
              onClick={endDJSet}
              className="w-full bg-red-600 hover:bg-red-700 px-3 md:px-6 py-4 rounded-xl font-bold text-sm md:text-lg whitespace-nowrap"
            >
              {t.endDjSet}
            </button>
          </div>
        </div>
      </div>

      <div
        ref={requestQueueRef}
        className="scroll-mt-6 grid md:grid-cols-2 gap-8 mb-10"
      >
        <RequestColumn
          title={`${t.pendingRequests} (${grouped.pending.length})`}
          titleColor="text-yellow-400"
          requests={grouped.pending}
          borderColor="border-zinc-800"
          actionLoadingId={actionLoadingId}
          t={t}
          buttons={(request) => (
            <>
              <button
                disabled={actionLoadingId === request.id}
                onClick={() => updateStatus(request.id, "accepted")}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl disabled:bg-zinc-700"
              >
                {t.accept}
              </button>

              <button
                disabled={actionLoadingId === request.id}
                onClick={() => updateStatus(request.id, "rejected")}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl disabled:bg-zinc-700"
              >
                {t.reject}
              </button>
            </>
          )}
        />

        <RequestColumn
          title={`${t.acceptedQueue} (${grouped.accepted.length})`}
          titleColor="text-green-400"
          requests={grouped.accepted}
          borderColor="border-green-700"
          showQueueNumber
          actionLoadingId={actionLoadingId}
          t={t}
          buttons={(request) => (
            <>
              <button
                disabled={actionLoadingId === request.id}
                onClick={() => moveRequest(request.id, "up")}
                className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl"
              >
                {t.up}
              </button>

              <button
                disabled={actionLoadingId === request.id}
                onClick={() => moveRequest(request.id, "down")}
                className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl"
              >
                {t.down}
              </button>

              <button
                disabled={actionLoadingId === request.id}
                onClick={() => updateStatus(request.id, "played")}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl disabled:bg-zinc-700"
              >
                {t.markPlayed}
              </button>

              <button
                disabled={actionLoadingId === request.id}
                onClick={() => deleteRequest(request.id)}
                className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:bg-zinc-800"
              >
                {t.delete}
              </button>
            </>
          )}
        />

        <RequestColumn
          title={`${t.rejectedRequests} (${grouped.rejected.length})`}
          titleColor="text-red-400"
          requests={grouped.rejected}
          borderColor="border-red-700"
          actionLoadingId={actionLoadingId}
          t={t}
          buttons={(request) => (
            <>
              <button
                disabled={actionLoadingId === request.id}
                onClick={() => updateStatus(request.id, "pending")}
                className="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 rounded-xl disabled:bg-zinc-700 disabled:text-white"
              >
                {t.restore}
              </button>

              <button
                disabled={actionLoadingId === request.id}
                onClick={() => deleteRequest(request.id)}
                className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:bg-zinc-800"
              >
                {t.delete}
              </button>
            </>
          )}
        />

        <RequestColumn
          title={`${t.nowPlayingAdmin} (${grouped.played.length})`}
          titleColor="text-purple-400"
          requests={grouped.played}
          borderColor="border-purple-700"
          actionLoadingId={actionLoadingId}
          t={t}
          buttons={(request) => (
            <>
              <button
                disabled={actionLoadingId === request.id}
                onClick={() => updateStatus(request.id, "finished")}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl disabled:bg-zinc-800"
              >
                {t.clearNowPlaying}
              </button>

              <button
                disabled={actionLoadingId === request.id}
                onClick={() => deleteRequest(request.id)}
                className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:bg-zinc-800"
              >
                {t.delete}
              </button>
            </>
          )}
        />

        <RequestColumn
          title={`${t.playedHistory} (${grouped.finished.length})`}
          titleColor="text-blue-400"
          requests={grouped.finished}
          borderColor="border-blue-700"
          actionLoadingId={actionLoadingId}
          t={t}
          buttons={(request) => (
            <button
              disabled={actionLoadingId === request.id}
              onClick={() => deleteRequest(request.id)}
              className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:bg-zinc-800"
            >
              {t.delete}
            </button>
          )}
        />
      </div>

      <div ref={qrCodeSectionRef} className="scroll-mt-6 mb-12">
        <QRCodeBox stageName={dj.stage_name} language={language} t={t} />
      </div>

      <div
        ref={profileSectionRef}
        className="scroll-mt-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10"
      >
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-purple-400 mb-8 text-center">
          {t.djProfileSettings}
        </h2>

        <div className="space-y-6">
          <div className="flex flex-col items-center">
            {profileImage ? (
              <img
                src={profileImage}
                alt="DJ Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-purple-600 mb-4"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center text-zinc-500 mb-4">
                {t.noImage}
              </div>
            )}

            <label className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl cursor-pointer font-semibold">
              {t.uploadProfilePhoto}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProfileImageUpload(file);
                }}
              />
            </label>

            {profileImage && (
              <button
                type="button"
                onClick={() => setProfileImage("")}
                className="mt-3 bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-semibold"
              >
                {t.removePhoto}
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={t.eventNamePlaceholder}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            />

            <input
              type="text"
              placeholder={t.venuePlaceholder}
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={t.cityPlaceholder}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            />

            <input
              type="text"
              placeholder={t.instagramPlaceholder}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            />
          </div>

          <div className="border-t border-zinc-800 pt-6">
            <h3 className="text-2xl font-bold text-cyan-400 mb-2">
              {t.marketplacePayoutSetup}
            </h3>

            <p className="text-zinc-400 text-sm mb-4">
              {t.marketplacePayoutDescription}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-black border border-zinc-700 rounded-xl px-4 py-2 text-sm"
        >
          <option value="en">🇺🇸 English</option>
          <option value="zh">🇨🇳 中文</option>
          <option value="ja">🇯🇵 日本語</option>
          <option value="ko">🇰🇷 한국어</option>
          <option value="id">🇮🇩 Bahasa Indonesia</option>
          <option value="ms">🇲🇾 Bahasa Melayu</option>
          <option value="th">🇹🇭 ไทย</option>
          <option value="hi">🇮🇳 हिन्दी</option>
          <option value="ar">🇦🇪 العربية</option>
          <option value="vi">🇻🇳 Tiếng Việt</option>
          <option value="tl">🇵🇭 Tagalog</option>
          <option value="pt">🇧🇷 Português</option>
          <option value="es">🇪🇸 Español</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="de">🇩🇪 Deutsch</option>
          <option value="ru">🇷🇺 Русский</option>
          <option value="tr">🇹🇷 Türkçe</option>
          <option value="it">🇮🇹 Italiano</option>
          <option value="nl">🇳🇱 Nederlands</option>
          <option value="pl">🇵🇱 Polski</option>
          <option value="el">🇬🇷 Ελληνικά</option>
          <option value="uk">🇺🇦 Українська</option>
        </select>

            <select
              value={preferredCurrency}
              onChange={(e) => {
                const nextCurrency = e.target.value;
                setPreferredCurrency(nextCurrency);
                setPayoutBankCode("");
                setPaystackBanks([]);

                if (payoutMethod === "Bank Transfer") {
                  loadPaystackBanks(nextCurrency);
                }
              }}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            >
              <option value="GHS"> GHS</option>
              <option value="NGN"> NGN</option>
              <option value="KES"> KES</option>
              <option value="ZAR"> ZAR</option>

              <option value="USD"> USD</option>
              <option value="CAD"> CAD</option>
              <option value="MXN"> MXN</option>
              <option value="BRL"> BRL</option>

              <option value="EUR"> EUR</option>
              <option value="GBP"> GBP</option>
              <option value="PLN"> PLN</option>
              <option value="UAH"> UAH</option>
              <option value="TRY"> TRY</option>

              <option value="AED"> AED</option>
              <option value="QAR"> QAR</option>
              <option value="SAR"> SAR</option>

              <option value="SGD"> SGD</option>
              <option value="MYR"> MYR</option>
              <option value="IDR"> IDR</option>
              <option value="THB"> THB</option>
              <option value="PHP"> PHP</option>
              <option value="VND"> VND</option>
              <option value="CNY"> CNY</option>
              <option value="JPY"> JPY</option>
              <option value="KRW"> KRW</option>
              <option value="INR"> INR</option>

              <option value="AUD"> AUD</option>
              <option value="NZD"> NZD</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="email"
              placeholder={t.payoutEmail}
              value={payoutEmail}
              onChange={(e) => setPayoutEmail(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            />

            <select
              value={payoutMethod}
              onChange={(e) => {
                const nextMethod = e.target.value;
                setPayoutMethod(nextMethod);
                setPayoutBankCode("");

                if (nextMethod === "Mobile Money") {
                  setPayoutProvider("MTN");
                }

                if (nextMethod === "Bank Transfer") {
                  setPayoutProvider("");
                  loadPaystackBanks(preferredCurrency);
                }
              }}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            >
              <option value="Bank Transfer">{t.bankTransfer}</option>
              <option value="PayPal">{t.paypal}</option>
              <option value="Mobile Money">{t.mobileMoney}</option>
              <option value="Stripe Connect">{t.stripeConnect}</option>
            </select>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">{t.payoutStatus}</p>

            <p
              className={`font-bold mt-1 ${
                payoutStatus === "Active"
                  ? "text-green-400"
                  : payoutStatus === "Pending Verification"
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {payoutStatus === "not_connected" ||
              payoutStatus === "Not Connected" ||
              !payoutStatus
                ? t.notConnected
                : payoutStatus}
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-5">
              {payoutMethod === "Mobile Money" ? (
                <select
                  value={payoutProvider}
                  onChange={(e) => setPayoutProvider(e.target.value)}
                  className="w-full p-4 rounded-xl bg-black border border-zinc-700"
                >
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="Telecel">Telecel Cash</option>
                  <option value="AirtelTigo">AirtelTigo Money</option>
                </select>
              ) : payoutMethod === "Bank Transfer" ? (
                <select
                  value={payoutBankCode}
                  onChange={(e) => {
                    const selectedCode = e.target.value;
                    const selectedBank = paystackBanks.find(
                      (bank) => bank.code === selectedCode,
                    );

                    setPayoutBankCode(selectedCode);
                    setPayoutProvider(selectedBank?.name || "");
                  }}
                  className="w-full p-4 rounded-xl bg-black border border-zinc-700"
                >
                  <option value="">
                    {banksLoading ? "Loading banks..." : "Select bank"}
                  </option>

                  {paystackBanks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder={
                    payoutMethod === "PayPal"
                      ? "PayPal email or provider"
                      : "Payout provider"
                  }
                  value={payoutProvider}
                  onChange={(e) => setPayoutProvider(e.target.value)}
                  className="w-full p-4 rounded-xl bg-black border border-zinc-700"
                />
              )}

              <input
                type="text"
                placeholder="Account name"
                value={payoutAccountName}
                onChange={(e) => setPayoutAccountName(e.target.value)}
                className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              />

              <input
                type="text"
                placeholder={
                  payoutMethod === "Bank Transfer"
                    ? "Account number"
                    : payoutMethod === "Mobile Money"
                      ? "Mobile money number"
                      : "Account / payout ID"
                }
                value={payoutAccountNumber}
                onChange={(e) => setPayoutAccountNumber(e.target.value)}
                className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              />
            </div>

            {payoutStatus === "Active" && (
              <div className="mt-5 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-400 font-bold">
                  Payout account connected
                </p>
                <p className="text-sm text-zinc-400 mt-2">
                  {payoutMethod} \'95 {payoutProvider} \'95 {payoutAccountName}
                </p>

                <p className="text-xs text-zinc-500 mt-2">
                  Recipient Code:{" "}
                  <span className="text-zinc-300">
                    {paystackRecipientCode || "Not created yet"}
                  </span>
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={connectPayoutAccount}
              disabled={connectingPayout}
              className="mt-5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {connectingPayout
                ? "Connecting to Paystack..."
                : t.connectAccount}
            </button>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">{t.verificationStatus}</p>

            <p
              className={`font-bold mt-3 ${
                verificationStatus === "verified"
                  ? "text-green-400"
                  : verificationStatus === "pending"
                    ? "text-yellow-400"
                    : verificationStatus === "rejected"
                      ? "text-red-400"
                      : "text-zinc-300"
              }`}
            >
              {verificationStatus === "verified"
                ? ` ${t.verified}`
                : verificationStatus === "pending"
                  ? ` ${t.pendingVerification}`
                  : verificationStatus === "rejected"
                    ? ` ${t.rejectedVerification}`
                    : ` ${t.notStarted}`}
            </p>

            {verificationStatus === "pending" && (
              <p className="mt-3 text-sm text-zinc-400">
                {t.pendingVerificationMessage}
              </p>
            )}

            {verificationStatus === "verified" && (
              <p className="mt-3 text-sm text-green-400">{t.verifiedMessage}</p>
            )}

            {verificationStatus === "rejected" && (
              <div>
                <p className="mt-3 text-sm text-red-400">
                  {t.rejectedVerificationMessage}
                </p>

                <button
                  type="button"
                  onClick={() => setVerificationStatus("pending")}
                  className="mt-3 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700"
                >
                  {t.resubmitVerification}
                </button>
              </div>
            )}

            {verificationStatus === "not_started" && (
              <button
                type="button"
                onClick={() => setVerificationStatus("pending")}
                className="mt-3 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700"
              >
                {t.submitVerification}
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder={t.profileImageUrlPlaceholder}
            value={profileImage}
            onChange={(e) => setProfileImage(e.target.value)}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
          />

          <textarea
            placeholder={t.djBioPlaceholder}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
          />

          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-bold text-lg disabled:opacity-50"
          >
            {savingProfile ? t.saving : t.saveProfile}
          </button>

          {profileMessage && (
            <p className="text-green-400 font-semibold">{profileMessage}</p>
          )}
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-green-400">
          {t.earningsOverview}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title={t.grossRevenue}
            value={`${currency} ${grossRevenue.toFixed(2)}`}
            color="text-green-400"
          />

          <StatCard
            title={t.djEarnings}
            value={`${currency} ${netEarnings.toFixed(2)}`}
            color="text-cyan-400"
          />

          <StatCard
            title={t.platformRevenue}
            value={`${currency} ${serviceFees.toFixed(2)}`}
            color="text-zinc-300"
          />

          <StatCard
            title={t.pendingPayouts}
            value={pendingPayouts}
            color="text-yellow-400"
          />
        </div>

        <p className="text-xs text-zinc-500 mt-3">{t.platformRevenueNote}</p>
      </div>

      <div ref={withdrawalsSectionRef} className="scroll-mt-6 mb-10">
        <h2 className="text-3xl font-bold mb-4 text-cyan-400">
          {t.withdrawalActivity}
        </h2>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-white mb-5">
            {t.requestWithdrawalTitle}
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="number"
              placeholder={t.withdrawalAmount}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            />

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <p className="text-zinc-500 text-sm">Payout destination</p>
              {payoutStatus === "Active" && paystackRecipientCode ? (
                <p className="text-green-400 font-bold mt-1">
                  {payoutMethod} \'95 {payoutProvider}
                </p>
              ) : (
                <p className="text-red-400 font-bold mt-1">Not Connected</p>
              )}
            </div>
          </div>

          {payoutStatus === "Active" && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-4">
              <p className="text-sm text-zinc-400">
                Account name:{" "}
                <span className="text-white font-semibold">
                  {payoutAccountName || "Not provided"}
                </span>
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                Account number:{" "}
                <span className="text-white font-semibold">
                  {payoutAccountNumber || "Not provided"}
                </span>
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                Recipient code:{" "}
                <span className="text-white font-semibold">
                  {paystackRecipientCode || "Not created yet"}
                </span>
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-zinc-400 text-sm">{t.availableBalance}</p>

              <h4 className="text-3xl font-bold text-green-400">
                {currency} {availableBalance.toFixed(2)}
              </h4>
            </div>

            <div className="space-y-3">
              {verificationStatus !== "verified" && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl p-4 text-sm">
                  {t.verificationRequiredMessage}
                </div>
              )}

              {(!paystackRecipientCode || payoutStatus !== "Active") && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
                  Connect your payout account with Paystack before requesting a
                  withdrawal.
                </div>
              )}

              {hasOpenWithdrawal && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl p-4 text-sm">
                  You already have a pending or approved withdrawal request. New
                  withdrawal requests are locked until the current request is
                  paid or rejected.
                </div>
              )}
              <button
                onClick={requestWithdrawal}
                disabled={
                  withdrawLoading ||
                  verificationStatus !== "verified" ||
                  payoutStatus !== "Active" ||
                  !paystackRecipientCode ||
                  hasOpenWithdrawal
                }
                className="bg-cyan-600 hover:bg-cyan-700 px-8 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawLoading
                  ? "Submitting..."
                  : verificationStatus !== "verified"
                    ? t.verificationRequired
                    : !paystackRecipientCode
                      ? "Connect Payout Account"
                      : t.requestPayout}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6 mt-6">
            <StatCard
              title={t.withdrawalRequests}
              value={withdrawals.length}
              color="text-cyan-400"
            />
            <StatCard
              title={t.totalWithdrawals}
              value={`${currency} ${totalWithdrawals.toFixed(2)}`}
              color="text-green-400"
            />
            <StatCard
              title={t.pendingWithdrawals}
              value={withdrawals.filter((w) => w.status === "pending").length}
              color="text-yellow-400"
            />
          </div>

          <h3 className="text-2xl font-bold text-white mb-4">
            Withdrawal History
          </h3>

          {withdrawals.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <p className="text-zinc-500">{t.noWithdrawalRequestsYet}</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-center gap-4">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={dj.stage_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-600 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-500 text-xs text-center shrink-0">
                      {t.noImage || "No Image"}
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-bold">{dj.stage_name}</h3>

                    {latestWithdrawal && (
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                            getWithdrawalStatusBadge(latestWithdrawal.status)
                              .className
                          }`}
                        >
                          Latest:{" "}
                          {
                            getWithdrawalStatusBadge(latestWithdrawal.status)
                              .label
                          }
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="bg-black/40 border border-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-300 font-bold">
                        {sortedWithdrawalHistory.length} withdrawal
                        {sortedWithdrawalHistory.length === 1 ? "" : "s"}
                      </span>

                      <span className="bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full text-xs text-green-400 font-bold">
                        Total withdrawn: {currency}{" "}
                        {withdrawalPaidTotal.toFixed(2)}
                      </span>

                      <span className="bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-xs text-purple-300 font-bold">
                        Total requested: {currency}{" "}
                        {withdrawalRequestedTotal.toFixed(2)}
                      </span>

                      <span className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full text-xs text-yellow-400 font-bold">
                        Available: {currency} {availableBalance.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 mt-3">
                      Latest request:{" "}
                      {latestWithdrawal?.created_at
                        ? new Date(latestWithdrawal.created_at).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsWithdrawalHistoryExpanded(
                      (currentValue) => !currentValue,
                    )
                  }
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-xl text-sm font-bold"
                >
                  {withdrawalHistoryIsOpen ? "Hide Details " : "View Details "}
                </button>
              </div>

              {withdrawalHistoryIsOpen && (
                <div className="mt-5 border-t border-zinc-800 pt-5 max-h-[600px] overflow-y-auto space-y-4 pr-2">
                  {sortedWithdrawalHistory.map((withdrawal) => {
                    const statusBadge = getWithdrawalStatusBadge(
                      withdrawal.status,
                    );
                    const auditTrail = getWithdrawalAuditLogs(withdrawal.id);
                    const isTimelineOpen =
                      expandedWithdrawalTimelineIds.includes(withdrawal.id);

                    return (
                      <div
                        key={withdrawal.id}
                        className="bg-black/30 border border-zinc-800 rounded-2xl p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h4 className="text-xl font-black text-white">
                                {withdrawal.currency || currency}{" "}
                                {Number(withdrawal.amount || 0).toFixed(2)}
                              </h4>

                              <span
                                className={`inline-flex items-center border px-3 py-1 rounded-full text-xs font-bold uppercase ${statusBadge.className}`}
                              >
                                {statusBadge.label}
                              </span>
                            </div>

                            <p className="text-xs text-zinc-500 mt-2">
                              Requested:{" "}
                              {withdrawal.created_at
                                ? new Date(
                                    withdrawal.created_at,
                                  ).toLocaleString()
                                : "No date"}
                            </p>
                          </div>

                          {withdrawal.status === "paid" && (
                            <span className="bg-green-600/20 text-green-400 px-4 py-2 rounded-xl font-semibold">
                              Paid
                            </span>
                          )}

                          {withdrawal.status === "approved" && (
                            <span className="bg-cyan-600/20 text-cyan-400 px-4 py-2 rounded-xl font-semibold">
                              Approved by Blackline
                            </span>
                          )}

                          {withdrawal.status === "pending" && (
                            <span className="bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-xl font-semibold">
                              Waiting for review
                            </span>
                          )}

                          {withdrawal.status === "rejected" && (
                            <span className="bg-red-600/20 text-red-400 px-4 py-2 rounded-xl font-semibold">
                              Rejected
                            </span>
                          )}
                        </div>

                        <div className="grid md:grid-cols-4 gap-3 mt-4">
                          <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                            <p className="text-xs text-zinc-500">Method</p>
                            <p className="text-zinc-300 font-semibold">
                              {withdrawal.payout_method || "Bank Transfer"}
                            </p>
                          </div>

                          <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                            <p className="text-xs text-zinc-500">Provider</p>
                            <p className="text-zinc-300 font-semibold">
                              {withdrawal.provider || "No provider"}
                            </p>
                          </div>

                          <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                            <p className="text-xs text-zinc-500">
                              Account Name
                            </p>
                            <p className="text-zinc-300 font-semibold">
                              {withdrawal.account_name || "No account name"}
                            </p>
                          </div>

                          <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                            <p className="text-xs text-zinc-500">
                              Account Number
                            </p>
                            <p className="text-zinc-300 font-semibold">
                              {withdrawal.account_number || "No account number"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 bg-black/40 border border-zinc-800 rounded-xl p-4">
                          <button
                            type="button"
                            onClick={() =>
                              toggleWithdrawalTimeline(withdrawal.id)
                            }
                            className="w-full flex items-center justify-between gap-3 text-left"
                          >
                            <span className="text-xs text-zinc-400 font-bold">
                              Withdrawal Activity Timeline ({auditTrail.length})
                            </span>

                            <span className="text-xs text-zinc-500 font-bold">
                              {isTimelineOpen ? "Hide " : "Show "}
                            </span>
                          </button>

                          {isTimelineOpen && (
                            <div className="mt-4">
                              {auditTrail.length === 0 ? (
                                <p className="text-sm text-zinc-500">
                                  No status updates yet.
                                </p>
                              ) : (
                                <div className="max-h-44 overflow-y-auto pr-2">
                                  <div className="relative pl-9 space-y-4">
                                    <div className="absolute left-3 top-3 bottom-3 w-px bg-zinc-700" />

                                    {auditTrail.map((log) => {
                                      const timelineDetails =
                                        getAuditTimelineDetails(log);

                                      return (
                                        <div key={log.id} className="relative">
                                          <div
                                            className={`absolute -left-9 top-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs ${timelineDetails.dotClass}`}
                                          >
                                            {timelineDetails.icon}
                                          </div>

                                          <p
                                            className={`text-sm font-bold ${timelineDetails.textClass}`}
                                          >
                                            {timelineDetails.label}
                                          </p>

                                          <p className="text-sm text-zinc-300 mt-1">
                                            {log.description ||
                                              "Activity updated"}
                                          </p>

                                          <p className="text-xs text-zinc-600 mt-1">
                                            {log.created_at
                                              ? new Date(
                                                  log.created_at,
                                                ).toLocaleString()
                                              : "No date"}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  color = "text-white",
}: {
  title: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
      <p className="text-zinc-500 text-sm">{title}</p>
      <h2 className={`text-3xl font-bold mt-2 ${color}`}>{value}</h2>
    </div>
  );
}

function RequestColumn({
  title,
  titleColor,
  requests,
  borderColor,
  buttons,
  showQueueNumber = false,
  actionLoadingId,
  t,
}: {
  title: string;
  titleColor: string;
  requests: SongRequest[];
  borderColor: string;
  buttons: (request: SongRequest) => React.ReactNode;
  showQueueNumber?: boolean;
  actionLoadingId: number | null;
  t: (typeof translations)[Language];
}) {
  return (
    <section>
      <h2 className={`text-3xl font-bold mb-5 ${titleColor}`}>{title}</h2>

      <div className="space-y-4">
        {requests.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-zinc-500">{t.noRequestsYet}</p>
          </div>
        )}

        {requests.map((request, index) => (
          <div
            key={request.id}
            className={`bg-zinc-900 border ${borderColor} p-5 rounded-2xl`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-start gap-3">
                {request.artwork && (
                  <img
                    src={request.artwork}
                    alt={request.song}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}

                <div>
                  <h3 className="text-2xl font-bold">
                    {showQueueNumber
                      ? `#${index + 1} \'97 ${request.song}`
                      : request.song}
                  </h3>

                  <p className="text-zinc-400 mt-1">{request.artist}</p>

                  {request.album && (
                    <p className="text-xs text-zinc-500 mt-1">
                      {request.album}
                    </p>
                  )}

                  <p className="text-purple-400 mt-2">
                    {t.requestedBy} {request.name}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {showQueueNumber && index === 0 && (
                  <span className="bg-purple-600 px-3 py-1 rounded-full text-xs font-bold">
                    {t.nextUp}
                  </span>
                )}

                {request.tip_amount >= 50 && (
                  <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                    {t.vip}
                  </span>
                )}

                <div className="bg-green-700 px-4 py-2 rounded-xl font-bold whitespace-nowrap text-sm md:text-base">
                  {request.tip_currency} {request.tip_amount}
                </div>
              </div>
            </div>

            {actionLoadingId === request.id && (
              <p className="text-zinc-500 text-sm mt-3">{t.updating}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-5">{buttons(request)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
