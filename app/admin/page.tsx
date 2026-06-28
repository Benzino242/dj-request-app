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
  played_at?: string | null;
};

type Payment = {
  id: number;
  dj_id: number;
  request_id?: number | null;
  guest_name?: string | null;
  song?: string | null;
  artist?: string | null;
  amount: number;
  dj_amount: number;
  platform_fee: number;
  currency: string;
  status?: string | null;
  provider?: string | null;
  provider_reference?: string | null;
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

const NOW_PLAYING_DURATION_MS = 5 * 60 * 1000;

function getNowPlayingCutoffIso() {
  return new Date(Date.now() - NOW_PLAYING_DURATION_MS).toISOString();
}

function isNowPlayingStillActive(request: SongRequest) {
  if (request.status !== "played" || !request.played_at) return false;

  const playedAtTime = new Date(request.played_at).getTime();

  if (Number.isNaN(playedAtTime)) return false;

  return Date.now() - playedAtTime < NOW_PLAYING_DURATION_MS;
}

function isExpiredNowPlaying(request: SongRequest) {
  if (request.status !== "played") return false;

  if (!request.played_at) return true;

  const playedAtTime = new Date(request.played_at).getTime();

  if (Number.isNaN(playedAtTime)) return true;

  return Date.now() - playedAtTime >= NOW_PLAYING_DURATION_MS;
}

function getNowPlayingRemainingMs(request: SongRequest) {
  if (request.status !== "played" || !request.played_at) return 0;

  const playedAtTime = new Date(request.played_at).getTime();

  if (Number.isNaN(playedAtTime)) return 0;

  return Math.max(0, NOW_PLAYING_DURATION_MS - (Date.now() - playedAtTime));
}

function formatNowPlayingRemaining(request: SongRequest) {
  const totalSeconds = Math.ceil(getNowPlayingRemainingMs(request) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatPlayedAt(value?: string | null) {
  if (!value) return "";

  const playedAtDate = new Date(value);

  if (Number.isNaN(playedAtDate.getTime())) return "";

  return playedAtDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getPlayedHistoryTime(request: SongRequest) {
  const playedAtTime = request.played_at
    ? new Date(request.played_at).getTime()
    : Number.NaN;

  if (!Number.isNaN(playedAtTime)) {
    return playedAtTime;
  }

  const createdAtTime = request.created_at
    ? new Date(request.created_at).getTime()
    : Number.NaN;

  if (!Number.isNaN(createdAtTime)) {
    return createdAtTime;
  }

  return 0;
}

type QuickSetupTranslation = {
  eyebrow: string;
  heading: string;
  subtitle: string;
  profileTodoTitle: string;
  profileReadyTitle: string;
  payoutTodoTitle: string;
  payoutReadyTitle: string;
  openRequestsTitle: string;
  liveTitle: string;
  shareQrTitle: string;
  watchQueueTitle: string;
  acceptRequestsTitle: string;
  verificationTitle: string;
  withdrawalsUnlockedTitle: string;
  verificationNote: string;
  startHere: string;
  ready: string;
  needed: string;
  connected: string;
  share: string;
  actionNeeded: string;
  queue: string;
  goLive: string;
  liveNow: string;
  requestsAllowed: string;
  unlocked: string;
  profileTodoMessage: string;
  profileReadyMessage: string;
  payoutTodoMessage: string;
  payoutReadyMessage: string;
  openRequestsMessage: string;
  liveMessage: string;
  shareQrMessage: string;
  watchQueueMessage: string;
  acceptRequestsMessage: string;
  verificationNotStartedMessage: string;
  verificationPendingMessage: string;
  connectPayoutMessage: string;
  withdrawalsReadyMessage: string;
};

type BalanceExplainerTranslation = {
  title: string;
  leadBefore: string;
  availableBalance: string;
  leadAfter: string;
  grossTitle: string;
  grossBody: string;
  djTitle: string;
  djBody: string;
  openTitle: string;
  openBody: string;
  verificationTitle: string;
  verificationBody: string;
  formula: string;
};

type DashboardAlertTranslation = {
  actionNeeded: string;
  pendingRequestSingular: string;
  pendingRequestPlural: string;
  needReview: string;
  tapToQueue: string;
  reviewNow: string;
  done: string;
  showSteps: string;
  hideSteps: string;
  showAllHistory: string;
  showLessHistory: string;
  playedHistoryRetentionNote: string;
  playedAt: string;
  expiresIn: string;
  qrCode: string;
  showQr: string;
  hideQr: string;
};


type AdminUiTranslation = {
  paymentAudit: string;
  recentPaymentReferences: string;
  paymentAuditBodyView: string;
  paymentAuditBodyHide: string;
  latest: string;
  viewReferences: string;
  hideReferences: string;
  noPaymentsRecordedYet: string;
  requestNumber: string;
  songNotSaved: string;
  artistNotSaved: string;
  guest: string;
  guestNotSaved: string;
  noDate: string;
  paystackReference: string;
  noReferenceSaved: string;
  copyReference: string;
  noPaymentReferenceFound: string;
  paymentReferenceCopied: string;
  failedConnectPayout: string;
  payoutConnectedAlert: string;
  active: string;
  pendingVerificationStatus: string;
  rejectedStatus: string;
  notStartedStatus: string;
  updatedStatus: string;
  pendingStatus: string;
  approvedStatus: string;
  paidStatus: string;
  unknownStatus: string;
  withdrawalHistory: string;
  latestLabel: string;
  withdrawalSingular: string;
  withdrawalPlural: string;
  totalWithdrawn: string;
  totalRequested: string;
  available: string;
  latestRequest: string;
  unknown: string;
  viewDetails: string;
  hideDetails: string;
  payoutAccountConnected: string;
  recipientCode: string;
  notCreatedYet: string;
  loadingBanks: string;
  selectBank: string;
  paypalEmailOrProvider: string;
  payoutProvider: string;
  accountName: string;
  accountNumber: string;
  mobileMoneyNumber: string;
  accountPayoutId: string;
  connectingToPaystack: string;
  payoutDestination: string;
  notConnected: string;
  notProvided: string;
  connectPayoutAccount: string;
  connectPayoutBeforeWithdrawal: string;
  existingWithdrawalLocked: string;
  submitting: string;
  verificationRequiredBeforeWithdrawal: string;
  alreadyOpenWithdrawalAlert: string;
  enterValidWithdrawalAmount: string;
  insufficientAvailableBalance: string;
  requested: string;
  method: string;
  provider: string;
  bankTransfer: string;
  noProvider: string;
  noAccountName: string;
  noAccountNumber: string;
  paid: string;
  approvedByBlackline: string;
  waitingForReview: string;
  rejected: string;
  withdrawalActivityTimeline: string;
  hide: string;
  show: string;
  noStatusUpdatesYet: string;
  activityUpdated: string;
};

const adminUiTranslations: Record<Language, AdminUiTranslation> = {
  "en": {
    "paymentAudit": "Payment audit",
    "recentPaymentReferences": "Recent Payment References",
    "paymentAuditBodyView": "Use this when a guest says they paid. Tap to view recent Paystack references.",
    "paymentAuditBodyHide": "Use this when a guest says they paid. Tap to hide recent Paystack references.",
    "latest": "latest",
    "viewReferences": "View references",
    "hideReferences": "Hide references",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Active",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Rejected",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Pending",
    "approvedStatus": "Approved",
    "paidStatus": "Paid",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Withdrawal History",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "View Details",
    "hideDetails": "Hide Details",
    "payoutAccountConnected": "Payout account connected",
    "recipientCode": "Recipient Code",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Not Connected",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Connect Payout Account",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Submitting...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Paid",
    "approvedByBlackline": "Approved by Blackline",
    "waitingForReview": "Waiting for review",
    "rejected": "Rejected",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Hide",
    "show": "Show",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "zh": {
    "paymentAudit": "付款审核",
    "recentPaymentReferences": "最近付款参考号",
    "paymentAuditBodyView": "当客人说已经付款时使用这里。点击查看最近的 Paystack 参考号。",
    "paymentAuditBodyHide": "当客人说已经付款时使用这里。点击隐藏最近的 Paystack 参考号。",
    "latest": "最新",
    "viewReferences": "查看参考号",
    "hideReferences": "隐藏参考号",
    "noPaymentsRecordedYet": "还没有付款记录。",
    "requestNumber": "请求 #",
    "songNotSaved": "歌曲未保存",
    "artistNotSaved": "艺人未保存",
    "guest": "客人",
    "guestNotSaved": "客人未保存",
    "noDate": "无日期",
    "paystackReference": "Paystack 参考号",
    "noReferenceSaved": "未保存参考号",
    "copyReference": "复制参考号",
    "noPaymentReferenceFound": "此付款没有找到参考号。",
    "paymentReferenceCopied": "付款参考号已复制",
    "failedConnectPayout": "连接收款账户失败。",
    "payoutConnectedAlert": "收款账户已连接。",
    "active": "已启用",
    "pendingVerificationStatus": "等待验证",
    "rejectedStatus": "已拒绝",
    "notStartedStatus": "未开始",
    "updatedStatus": "已更新",
    "pendingStatus": "待处理",
    "approvedStatus": "已批准",
    "paidStatus": "已支付",
    "unknownStatus": "未知",
    "withdrawalHistory": "提现历史",
    "latestLabel": "最新",
    "withdrawalSingular": "笔提现",
    "withdrawalPlural": "笔提现",
    "totalWithdrawn": "已提现总额",
    "totalRequested": "申请总额",
    "available": "可用",
    "latestRequest": "最新申请",
    "unknown": "未知",
    "viewDetails": "查看详情",
    "hideDetails": "隐藏详情",
    "payoutAccountConnected": "收款账户已连接",
    "recipientCode": "收款人代码",
    "notCreatedYet": "尚未创建",
    "loadingBanks": "正在加载银行...",
    "selectBank": "选择银行",
    "paypalEmailOrProvider": "PayPal 邮箱或服务商",
    "payoutProvider": "收款服务商",
    "accountName": "账户名称",
    "accountNumber": "账号",
    "mobileMoneyNumber": "移动支付号码",
    "accountPayoutId": "账户 / 收款 ID",
    "connectingToPaystack": "正在连接 Paystack...",
    "payoutDestination": "收款目的地",
    "notConnected": "未连接",
    "notProvided": "未提供",
    "connectPayoutAccount": "连接收款账户",
    "connectPayoutBeforeWithdrawal": "申请提现前，请先用 Paystack 连接你的收款账户。",
    "existingWithdrawalLocked": "你已有待处理或已批准的提现申请。当前申请支付或拒绝前，新的提现申请会被锁定。",
    "submitting": "正在提交...",
    "verificationRequiredBeforeWithdrawal": "申请提现前需要完成验证。",
    "alreadyOpenWithdrawalAlert": "你已有待处理或已批准的提现申请。请等它被支付或拒绝后再创建新的申请。",
    "enterValidWithdrawalAmount": "请输入有效的提现金额",
    "insufficientAvailableBalance": "可用余额不足",
    "requested": "申请时间",
    "method": "方式",
    "provider": "服务商",
    "bankTransfer": "银行转账",
    "noProvider": "无服务商",
    "noAccountName": "无账户名称",
    "noAccountNumber": "无账号",
    "paid": "已支付",
    "approvedByBlackline": "Blackline 已批准",
    "waitingForReview": "等待审核",
    "rejected": "已拒绝",
    "withdrawalActivityTimeline": "提现活动时间线",
    "hide": "隐藏",
    "show": "显示",
    "noStatusUpdatesYet": "还没有状态更新。",
    "activityUpdated": "活动已更新"
  },
  "ja": {
    "paymentAudit": "支払い確認",
    "recentPaymentReferences": "最近の支払い参照番号",
    "paymentAuditBodyView": "ゲストが支払ったと言った時に使用します。タップして最近の Paystack 参照番号を表示します。",
    "paymentAuditBodyHide": "ゲストが支払ったと言った時に使用します。タップして最近の Paystack 参照番号を隠します。",
    "latest": "最新",
    "viewReferences": "参照番号を表示",
    "hideReferences": "参照番号を隠す",
    "noPaymentsRecordedYet": "まだ支払い記録はありません。",
    "requestNumber": "リクエスト #",
    "songNotSaved": "曲が保存されていません",
    "artistNotSaved": "アーティストが保存されていません",
    "guest": "ゲスト",
    "guestNotSaved": "ゲストが保存されていません",
    "noDate": "日付なし",
    "paystackReference": "Paystack 参照番号",
    "noReferenceSaved": "参照番号が保存されていません",
    "copyReference": "参照番号をコピー",
    "noPaymentReferenceFound": "この支払いの参照番号が見つかりません。",
    "paymentReferenceCopied": "支払い参照番号をコピーしました",
    "failedConnectPayout": "受取口座の接続に失敗しました。",
    "payoutConnectedAlert": "受取口座が接続されました。",
    "active": "有効",
    "pendingVerificationStatus": "認証待ち",
    "rejectedStatus": "拒否済み",
    "notStartedStatus": "未開始",
    "updatedStatus": "更新済み",
    "pendingStatus": "保留中",
    "approvedStatus": "承認済み",
    "paidStatus": "支払い済み",
    "unknownStatus": "不明",
    "withdrawalHistory": "出金履歴",
    "latestLabel": "最新",
    "withdrawalSingular": "件の出金",
    "withdrawalPlural": "件の出金",
    "totalWithdrawn": "出金済み合計",
    "totalRequested": "申請合計",
    "available": "利用可能",
    "latestRequest": "最新申請",
    "unknown": "不明",
    "viewDetails": "詳細を表示",
    "hideDetails": "詳細を隠す",
    "payoutAccountConnected": "受取口座が接続済み",
    "recipientCode": "受取人コード",
    "notCreatedYet": "未作成",
    "loadingBanks": "銀行を読み込み中...",
    "selectBank": "銀行を選択",
    "paypalEmailOrProvider": "PayPalメールまたはプロバイダー",
    "payoutProvider": "受取プロバイダー",
    "accountName": "口座名義",
    "accountNumber": "口座番号",
    "mobileMoneyNumber": "モバイルマネー番号",
    "accountPayoutId": "口座 / 受取ID",
    "connectingToPaystack": "Paystack に接続中...",
    "payoutDestination": "受取先",
    "notConnected": "未接続",
    "notProvided": "未入力",
    "connectPayoutAccount": "受取口座を接続",
    "connectPayoutBeforeWithdrawal": "出金申請の前に Paystack で受取口座を接続してください。",
    "existingWithdrawalLocked": "保留中または承認済みの出金申請があります。現在の申請が支払われるか拒否されるまで新しい出金はロックされます。",
    "submitting": "送信中...",
    "verificationRequiredBeforeWithdrawal": "出金申請には認証が必要です。",
    "alreadyOpenWithdrawalAlert": "保留中または承認済みの出金申請があります。支払いまたは拒否されるまでお待ちください。",
    "enterValidWithdrawalAmount": "有効な出金額を入力してください",
    "insufficientAvailableBalance": "利用可能残高が不足しています",
    "requested": "申請日時",
    "method": "方法",
    "provider": "プロバイダー",
    "bankTransfer": "銀行振込",
    "noProvider": "プロバイダーなし",
    "noAccountName": "口座名義なし",
    "noAccountNumber": "口座番号なし",
    "paid": "支払い済み",
    "approvedByBlackline": "Blackline が承認済み",
    "waitingForReview": "確認待ち",
    "rejected": "拒否済み",
    "withdrawalActivityTimeline": "出金アクティビティ履歴",
    "hide": "隠す",
    "show": "表示",
    "noStatusUpdatesYet": "まだステータス更新はありません。",
    "activityUpdated": "アクティビティが更新されました"
  },
  "ko": {
    "paymentAudit": "결제 확인",
    "recentPaymentReferences": "최근 결제 참조번호",
    "paymentAuditBodyView": "게스트가 결제했다고 말할 때 사용하세요. 탭해서 최근 Paystack 참조번호를 봅니다.",
    "paymentAuditBodyHide": "게스트가 결제했다고 말할 때 사용하세요. 탭해서 최근 Paystack 참조번호를 숨깁니다.",
    "latest": "최신",
    "viewReferences": "참조번호 보기",
    "hideReferences": "참조번호 숨기기",
    "noPaymentsRecordedYet": "아직 결제 기록이 없습니다.",
    "requestNumber": "요청 #",
    "songNotSaved": "곡이 저장되지 않음",
    "artistNotSaved": "아티스트가 저장되지 않음",
    "guest": "게스트",
    "guestNotSaved": "게스트가 저장되지 않음",
    "noDate": "날짜 없음",
    "paystackReference": "Paystack 참조번호",
    "noReferenceSaved": "참조번호가 저장되지 않음",
    "copyReference": "참조번호 복사",
    "noPaymentReferenceFound": "이 결제의 참조번호를 찾을 수 없습니다.",
    "paymentReferenceCopied": "결제 참조번호가 복사되었습니다",
    "failedConnectPayout": "지급 계정 연결에 실패했습니다.",
    "payoutConnectedAlert": "지급 계정이 연결되었습니다.",
    "active": "활성",
    "pendingVerificationStatus": "인증 대기",
    "rejectedStatus": "거절됨",
    "notStartedStatus": "시작 안 됨",
    "updatedStatus": "업데이트됨",
    "pendingStatus": "대기 중",
    "approvedStatus": "승인됨",
    "paidStatus": "지급됨",
    "unknownStatus": "알 수 없음",
    "withdrawalHistory": "출금 내역",
    "latestLabel": "최신",
    "withdrawalSingular": "건 출금",
    "withdrawalPlural": "건 출금",
    "totalWithdrawn": "총 출금액",
    "totalRequested": "총 요청액",
    "available": "사용 가능",
    "latestRequest": "최근 요청",
    "unknown": "알 수 없음",
    "viewDetails": "상세 보기",
    "hideDetails": "상세 숨기기",
    "payoutAccountConnected": "지급 계정 연결됨",
    "recipientCode": "수취인 코드",
    "notCreatedYet": "아직 생성되지 않음",
    "loadingBanks": "은행 불러오는 중...",
    "selectBank": "은행 선택",
    "paypalEmailOrProvider": "PayPal 이메일 또는 제공업체",
    "payoutProvider": "지급 제공업체",
    "accountName": "계정 이름",
    "accountNumber": "계좌 번호",
    "mobileMoneyNumber": "모바일 머니 번호",
    "accountPayoutId": "계정 / 지급 ID",
    "connectingToPaystack": "Paystack 연결 중...",
    "payoutDestination": "지급 대상",
    "notConnected": "연결 안 됨",
    "notProvided": "제공되지 않음",
    "connectPayoutAccount": "지급 계정 연결",
    "connectPayoutBeforeWithdrawal": "출금 요청 전에 Paystack으로 지급 계정을 연결하세요.",
    "existingWithdrawalLocked": "대기 중이거나 승인된 출금 요청이 있습니다. 현재 요청이 지급되거나 거절될 때까지 새 출금 요청은 잠깁니다.",
    "submitting": "제출 중...",
    "verificationRequiredBeforeWithdrawal": "출금 요청 전 인증이 필요합니다.",
    "alreadyOpenWithdrawalAlert": "대기 중이거나 승인된 출금 요청이 있습니다. 지급 또는 거절될 때까지 기다려 주세요.",
    "enterValidWithdrawalAmount": "올바른 출금 금액을 입력하세요",
    "insufficientAvailableBalance": "사용 가능 잔액이 부족합니다",
    "requested": "요청됨",
    "method": "방법",
    "provider": "제공업체",
    "bankTransfer": "은행 송금",
    "noProvider": "제공업체 없음",
    "noAccountName": "계정 이름 없음",
    "noAccountNumber": "계좌 번호 없음",
    "paid": "지급됨",
    "approvedByBlackline": "Blackline 승인됨",
    "waitingForReview": "검토 대기 중",
    "rejected": "거절됨",
    "withdrawalActivityTimeline": "출금 활동 타임라인",
    "hide": "숨기기",
    "show": "보기",
    "noStatusUpdatesYet": "아직 상태 업데이트가 없습니다.",
    "activityUpdated": "활동이 업데이트되었습니다"
  },
  "id": {
    "paymentAudit": "Audit pembayaran",
    "recentPaymentReferences": "Referensi Pembayaran Terbaru",
    "paymentAuditBodyView": "Gunakan ini saat tamu bilang sudah membayar. Tap untuk melihat referensi Paystack terbaru.",
    "paymentAuditBodyHide": "Gunakan ini saat tamu bilang sudah membayar. Tap untuk menyembunyikan referensi Paystack terbaru.",
    "latest": "terbaru",
    "viewReferences": "Lihat referensi",
    "hideReferences": "Sembunyikan referensi",
    "noPaymentsRecordedYet": "Belum ada pembayaran tercatat.",
    "requestNumber": "Request #",
    "songNotSaved": "Lagu belum tersimpan",
    "artistNotSaved": "Artis belum tersimpan",
    "guest": "Tamu",
    "guestNotSaved": "Tamu belum tersimpan",
    "noDate": "Tidak ada tanggal",
    "paystackReference": "Referensi Paystack",
    "noReferenceSaved": "Referensi belum tersimpan",
    "copyReference": "Salin referensi",
    "noPaymentReferenceFound": "Referensi pembayaran tidak ditemukan untuk pembayaran ini.",
    "paymentReferenceCopied": "Referensi pembayaran disalin",
    "failedConnectPayout": "Gagal menghubungkan akun payout.",
    "payoutConnectedAlert": "Akun payout terhubung.",
    "active": "Aktif",
    "pendingVerificationStatus": "Menunggu verifikasi",
    "rejectedStatus": "Ditolak",
    "notStartedStatus": "Belum dimulai",
    "updatedStatus": "Diperbarui",
    "pendingStatus": "Pending",
    "approvedStatus": "Disetujui",
    "paidStatus": "Dibayar",
    "unknownStatus": "Tidak diketahui",
    "withdrawalHistory": "Riwayat Penarikan",
    "latestLabel": "Terbaru",
    "withdrawalSingular": "penarikan",
    "withdrawalPlural": "penarikan",
    "totalWithdrawn": "Total ditarik",
    "totalRequested": "Total diminta",
    "available": "Tersedia",
    "latestRequest": "Request terbaru",
    "unknown": "Tidak diketahui",
    "viewDetails": "Lihat detail",
    "hideDetails": "Sembunyikan detail",
    "payoutAccountConnected": "Akun payout terhubung",
    "recipientCode": "Kode penerima",
    "notCreatedYet": "Belum dibuat",
    "loadingBanks": "Memuat bank...",
    "selectBank": "Pilih bank",
    "paypalEmailOrProvider": "Email PayPal atau provider",
    "payoutProvider": "Provider payout",
    "accountName": "Nama akun",
    "accountNumber": "Nomor akun",
    "mobileMoneyNumber": "Nomor mobile money",
    "accountPayoutId": "Akun / ID payout",
    "connectingToPaystack": "Menghubungkan ke Paystack...",
    "payoutDestination": "Tujuan payout",
    "notConnected": "Belum terhubung",
    "notProvided": "Belum diisi",
    "connectPayoutAccount": "Hubungkan Akun Payout",
    "connectPayoutBeforeWithdrawal": "Hubungkan akun payout dengan Paystack sebelum meminta penarikan.",
    "existingWithdrawalLocked": "Anda sudah memiliki request penarikan pending atau disetujui. Request baru terkunci sampai request saat ini dibayar atau ditolak.",
    "submitting": "Mengirim...",
    "verificationRequiredBeforeWithdrawal": "Verifikasi diperlukan sebelum penarikan dapat diminta.",
    "alreadyOpenWithdrawalAlert": "Anda sudah memiliki request penarikan pending atau disetujui. Tunggu sampai dibayar atau ditolak sebelum membuat yang baru.",
    "enterValidWithdrawalAmount": "Masukkan jumlah penarikan yang valid",
    "insufficientAvailableBalance": "Saldo tersedia tidak cukup",
    "requested": "Diminta",
    "method": "Metode",
    "provider": "Provider",
    "bankTransfer": "Transfer bank",
    "noProvider": "Tidak ada provider",
    "noAccountName": "Tidak ada nama akun",
    "noAccountNumber": "Tidak ada nomor akun",
    "paid": "Dibayar",
    "approvedByBlackline": "Disetujui Blackline",
    "waitingForReview": "Menunggu review",
    "rejected": "Ditolak",
    "withdrawalActivityTimeline": "Timeline aktivitas penarikan",
    "hide": "Sembunyikan",
    "show": "Tampilkan",
    "noStatusUpdatesYet": "Belum ada update status.",
    "activityUpdated": "Aktivitas diperbarui"
  },
  "ms": {
    "paymentAudit": "Audit bayaran",
    "recentPaymentReferences": "Rujukan Bayaran Terkini",
    "paymentAuditBodyView": "Gunakan ini apabila tetamu berkata mereka sudah bayar. Tekan untuk lihat rujukan Paystack terkini.",
    "paymentAuditBodyHide": "Gunakan ini apabila tetamu berkata mereka sudah bayar. Tekan untuk sembunyikan rujukan Paystack terkini.",
    "latest": "terkini",
    "viewReferences": "Lihat rujukan",
    "hideReferences": "Sembunyi rujukan",
    "noPaymentsRecordedYet": "Belum ada bayaran direkodkan.",
    "requestNumber": "Permintaan #",
    "songNotSaved": "Lagu belum disimpan",
    "artistNotSaved": "Artis belum disimpan",
    "guest": "Tetamu",
    "guestNotSaved": "Tetamu belum disimpan",
    "noDate": "Tiada tarikh",
    "paystackReference": "Rujukan Paystack",
    "noReferenceSaved": "Tiada rujukan disimpan",
    "copyReference": "Salin rujukan",
    "noPaymentReferenceFound": "Rujukan bayaran tidak ditemui untuk bayaran ini.",
    "paymentReferenceCopied": "Rujukan bayaran disalin",
    "failedConnectPayout": "Gagal menyambung akaun bayaran.",
    "payoutConnectedAlert": "Akaun bayaran disambungkan.",
    "active": "Aktif",
    "pendingVerificationStatus": "Menunggu verifikasi",
    "rejectedStatus": "Ditolak",
    "notStartedStatus": "Belum bermula",
    "updatedStatus": "Dikemas kini",
    "pendingStatus": "Pending",
    "approvedStatus": "Diluluskan",
    "paidStatus": "Dibayar",
    "unknownStatus": "Tidak diketahui",
    "withdrawalHistory": "Sejarah Pengeluaran",
    "latestLabel": "Terkini",
    "withdrawalSingular": "pengeluaran",
    "withdrawalPlural": "pengeluaran",
    "totalWithdrawn": "Jumlah dikeluarkan",
    "totalRequested": "Jumlah diminta",
    "available": "Tersedia",
    "latestRequest": "Permintaan terkini",
    "unknown": "Tidak diketahui",
    "viewDetails": "Lihat butiran",
    "hideDetails": "Sembunyi butiran",
    "payoutAccountConnected": "Akaun bayaran disambungkan",
    "recipientCode": "Kod penerima",
    "notCreatedYet": "Belum dibuat",
    "loadingBanks": "Memuatkan bank...",
    "selectBank": "Pilih bank",
    "paypalEmailOrProvider": "Emel PayPal atau penyedia",
    "payoutProvider": "Penyedia bayaran",
    "accountName": "Nama akaun",
    "accountNumber": "Nombor akaun",
    "mobileMoneyNumber": "Nombor mobile money",
    "accountPayoutId": "Akaun / ID bayaran",
    "connectingToPaystack": "Menyambung ke Paystack...",
    "payoutDestination": "Destinasi bayaran",
    "notConnected": "Belum disambung",
    "notProvided": "Belum diberi",
    "connectPayoutAccount": "Sambung Akaun Bayaran",
    "connectPayoutBeforeWithdrawal": "Sambungkan akaun bayaran dengan Paystack sebelum meminta pengeluaran.",
    "existingWithdrawalLocked": "Anda sudah ada permintaan pengeluaran pending atau diluluskan. Permintaan baru dikunci sehingga permintaan semasa dibayar atau ditolak.",
    "submitting": "Menghantar...",
    "verificationRequiredBeforeWithdrawal": "Verifikasi diperlukan sebelum pengeluaran boleh diminta.",
    "alreadyOpenWithdrawalAlert": "Anda sudah ada permintaan pengeluaran pending atau diluluskan. Tunggu sehingga dibayar atau ditolak sebelum membuat yang baru.",
    "enterValidWithdrawalAmount": "Masukkan jumlah pengeluaran yang sah",
    "insufficientAvailableBalance": "Baki tersedia tidak mencukupi",
    "requested": "Diminta",
    "method": "Kaedah",
    "provider": "Penyedia",
    "bankTransfer": "Pindahan bank",
    "noProvider": "Tiada penyedia",
    "noAccountName": "Tiada nama akaun",
    "noAccountNumber": "Tiada nombor akaun",
    "paid": "Dibayar",
    "approvedByBlackline": "Diluluskan oleh Blackline",
    "waitingForReview": "Menunggu semakan",
    "rejected": "Ditolak",
    "withdrawalActivityTimeline": "Garis masa aktiviti pengeluaran",
    "hide": "Sembunyi",
    "show": "Tunjuk",
    "noStatusUpdatesYet": "Belum ada kemas kini status.",
    "activityUpdated": "Aktiviti dikemas kini"
  },
  "th": {
    "paymentAudit": "ตรวจสอบการชำระเงิน",
    "recentPaymentReferences": "รหัสอ้างอิงการชำระเงินล่าสุด",
    "paymentAuditBodyView": "ใช้เมื่อแขกบอกว่าจ่ายแล้ว แตะเพื่อดูรหัสอ้างอิง Paystack ล่าสุด",
    "paymentAuditBodyHide": "ใช้เมื่อแขกบอกว่าจ่ายแล้ว แตะเพื่อซ่อนรหัสอ้างอิง Paystack ล่าสุด",
    "latest": "ล่าสุด",
    "viewReferences": "ดูรหัสอ้างอิง",
    "hideReferences": "ซ่อนรหัสอ้างอิง",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "ใช้งานอยู่",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "ถูกปฏิเสธ",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "รอดำเนินการ",
    "approvedStatus": "อนุมัติแล้ว",
    "paidStatus": "จ่ายแล้ว",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "ประวัติการถอน",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "ดูรายละเอียด",
    "hideDetails": "ซ่อนรายละเอียด",
    "payoutAccountConnected": "เชื่อมต่อบัญชีรับเงินแล้ว",
    "recipientCode": "รหัสผู้รับ",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "ยังไม่เชื่อมต่อ",
    "notProvided": "Not provided",
    "connectPayoutAccount": "เชื่อมต่อบัญชีรับเงิน",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "กำลังส่ง...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "จ่ายแล้ว",
    "approvedByBlackline": "Blackline อนุมัติแล้ว",
    "waitingForReview": "รอตรวจสอบ",
    "rejected": "ถูกปฏิเสธ",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "ซ่อน",
    "show": "แสดง",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "hi": {
    "paymentAudit": "भुगतान ऑडिट",
    "recentPaymentReferences": "हाल के भुगतान संदर्भ",
    "paymentAuditBodyView": "जब guest कहे कि उन्होंने भुगतान किया है, इसे उपयोग करें. हाल के Paystack reference देखने के लिए tap करें.",
    "paymentAuditBodyHide": "जब guest कहे कि उन्होंने भुगतान किया है, इसे उपयोग करें. हाल के Paystack reference छिपाने के लिए tap करें.",
    "latest": "नवीनतम",
    "viewReferences": "Reference देखें",
    "hideReferences": "Reference छिपाएं",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Active",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Rejected",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Pending",
    "approvedStatus": "Approved",
    "paidStatus": "Paid",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "निकासी इतिहास",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Details देखें",
    "hideDetails": "Details छिपाएं",
    "payoutAccountConnected": "Payout account connected",
    "recipientCode": "Recipient Code",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Connected नहीं",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Payout Account जोड़ें",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Submitting...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Paid",
    "approvedByBlackline": "Blackline से approved",
    "waitingForReview": "Review का इंतज़ार",
    "rejected": "Rejected",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Hide",
    "show": "Show",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "ar": {
    "paymentAudit": "تدقيق الدفع",
    "recentPaymentReferences": "مراجع الدفع الأخيرة",
    "paymentAuditBodyView": "استخدم هذا عندما يقول الضيف إنه دفع. اضغط لعرض مراجع Paystack الأخيرة.",
    "paymentAuditBodyHide": "استخدم هذا عندما يقول الضيف إنه دفع. اضغط لإخفاء مراجع Paystack الأخيرة.",
    "latest": "الأحدث",
    "viewReferences": "عرض المراجع",
    "hideReferences": "إخفاء المراجع",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "نشط",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "مرفوض",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "معلق",
    "approvedStatus": "موافق عليه",
    "paidStatus": "مدفوع",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "سجل السحب",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "عرض التفاصيل",
    "hideDetails": "إخفاء التفاصيل",
    "payoutAccountConnected": "حساب الدفع متصل",
    "recipientCode": "رمز المستلم",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "غير متصل",
    "notProvided": "Not provided",
    "connectPayoutAccount": "ربط حساب الدفع",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "جارٍ الإرسال...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "مدفوع",
    "approvedByBlackline": "تمت الموافقة من Blackline",
    "waitingForReview": "بانتظار المراجعة",
    "rejected": "مرفوض",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "إخفاء",
    "show": "إظهار",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "vi": {
    "paymentAudit": "Kiểm tra thanh toán",
    "recentPaymentReferences": "Mã tham chiếu thanh toán gần đây",
    "paymentAuditBodyView": "Dùng khi khách nói đã thanh toán. Nhấn để xem mã Paystack gần đây.",
    "paymentAuditBodyHide": "Dùng khi khách nói đã thanh toán. Nhấn để ẩn mã Paystack gần đây.",
    "latest": "mới nhất",
    "viewReferences": "Xem mã tham chiếu",
    "hideReferences": "Ẩn mã tham chiếu",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Đang hoạt động",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Bị từ chối",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Đang chờ",
    "approvedStatus": "Đã duyệt",
    "paidStatus": "Đã trả",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Lịch sử rút tiền",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Xem chi tiết",
    "hideDetails": "Ẩn chi tiết",
    "payoutAccountConnected": "Tài khoản nhận tiền đã kết nối",
    "recipientCode": "Mã người nhận",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Chưa kết nối",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Kết nối tài khoản nhận tiền",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Đang gửi...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Đã trả",
    "approvedByBlackline": "Blackline đã duyệt",
    "waitingForReview": "Đang chờ xem xét",
    "rejected": "Bị từ chối",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Ẩn",
    "show": "Hiện",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "tl": {
    "paymentAudit": "Payment audit",
    "recentPaymentReferences": "Recent Payment References",
    "paymentAuditBodyView": "Gamitin ito kapag sinabi ng guest na nagbayad na sila. I-tap para makita ang recent Paystack references.",
    "paymentAuditBodyHide": "Gamitin ito kapag sinabi ng guest na nagbayad na sila. I-tap para itago ang recent Paystack references.",
    "latest": "latest",
    "viewReferences": "View references",
    "hideReferences": "Hide references",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Active",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Rejected",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Pending",
    "approvedStatus": "Approved",
    "paidStatus": "Paid",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Withdrawal History",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "View Details",
    "hideDetails": "Hide Details",
    "payoutAccountConnected": "Payout account connected",
    "recipientCode": "Recipient Code",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Not Connected",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Connect Payout Account",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Submitting...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Paid",
    "approvedByBlackline": "Approved by Blackline",
    "waitingForReview": "Waiting for review",
    "rejected": "Rejected",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Hide",
    "show": "Show",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "pt": {
    "paymentAudit": "Auditoria de pagamento",
    "recentPaymentReferences": "Referências de pagamento recentes",
    "paymentAuditBodyView": "Use isto quando um convidado disser que pagou. Toque para ver referências Paystack recentes.",
    "paymentAuditBodyHide": "Use isto quando um convidado disser que pagou. Toque para ocultar referências Paystack recentes.",
    "latest": "recentes",
    "viewReferences": "Ver referências",
    "hideReferences": "Ocultar referências",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Ativo",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Rejeitado",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Pendente",
    "approvedStatus": "Aprovado",
    "paidStatus": "Pago",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Histórico de levantamentos",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Ver detalhes",
    "hideDetails": "Ocultar detalhes",
    "payoutAccountConnected": "Conta de pagamento conectada",
    "recipientCode": "Código do destinatário",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Não conectado",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Conectar conta de pagamento",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "A enviar...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Pago",
    "approvedByBlackline": "Aprovado pela Blackline",
    "waitingForReview": "A aguardar revisão",
    "rejected": "Rejeitado",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Ocultar",
    "show": "Mostrar",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "es": {
    "paymentAudit": "Auditoría de pago",
    "recentPaymentReferences": "Referencias de pago recientes",
    "paymentAuditBodyView": "Úsalo cuando un invitado diga que pagó. Toca para ver referencias recientes de Paystack.",
    "paymentAuditBodyHide": "Úsalo cuando un invitado diga que pagó. Toca para ocultar referencias recientes de Paystack.",
    "latest": "recientes",
    "viewReferences": "Ver referencias",
    "hideReferences": "Ocultar referencias",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Activo",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Rechazado",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Pendiente",
    "approvedStatus": "Aprobado",
    "paidStatus": "Pagado",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Historial de retiros",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Ver detalles",
    "hideDetails": "Ocultar detalles",
    "payoutAccountConnected": "Cuenta de pago conectada",
    "recipientCode": "Código de destinatario",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "No conectado",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Conectar cuenta de pago",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Enviando...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Pagado",
    "approvedByBlackline": "Aprobado por Blackline",
    "waitingForReview": "Esperando revisión",
    "rejected": "Rechazado",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Ocultar",
    "show": "Mostrar",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "fr": {
    "paymentAudit": "Audit de paiement",
    "recentPaymentReferences": "Références de paiement récentes",
    "paymentAuditBodyView": "Utilisez ceci quand un invité dit avoir payé. Touchez pour voir les références Paystack récentes.",
    "paymentAuditBodyHide": "Utilisez ceci quand un invité dit avoir payé. Touchez pour masquer les références Paystack récentes.",
    "latest": "récentes",
    "viewReferences": "Voir les références",
    "hideReferences": "Masquer les références",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Actif",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Rejeté",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "En attente",
    "approvedStatus": "Approuvé",
    "paidStatus": "Payé",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Historique des retraits",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Voir les détails",
    "hideDetails": "Masquer les détails",
    "payoutAccountConnected": "Compte de paiement connecté",
    "recipientCode": "Code destinataire",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Non connecté",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Connecter le compte de paiement",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Envoi...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Payé",
    "approvedByBlackline": "Approuvé par Blackline",
    "waitingForReview": "En attente de vérification",
    "rejected": "Rejeté",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Masquer",
    "show": "Afficher",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "de": {
    "paymentAudit": "Zahlungsprüfung",
    "recentPaymentReferences": "Aktuelle Zahlungsreferenzen",
    "paymentAuditBodyView": "Nutze dies, wenn ein Gast sagt, dass er bezahlt hat. Tippe, um aktuelle Paystack-Referenzen zu sehen.",
    "paymentAuditBodyHide": "Nutze dies, wenn ein Gast sagt, dass er bezahlt hat. Tippe, um aktuelle Paystack-Referenzen auszublenden.",
    "latest": "aktuell",
    "viewReferences": "Referenzen anzeigen",
    "hideReferences": "Referenzen ausblenden",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Aktiv",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Abgelehnt",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Ausstehend",
    "approvedStatus": "Genehmigt",
    "paidStatus": "Bezahlt",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Auszahlungsverlauf",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Details anzeigen",
    "hideDetails": "Details ausblenden",
    "payoutAccountConnected": "Auszahlungskonto verbunden",
    "recipientCode": "Empfängercode",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Nicht verbunden",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Auszahlungskonto verbinden",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Wird gesendet...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Bezahlt",
    "approvedByBlackline": "Von Blackline genehmigt",
    "waitingForReview": "Wartet auf Prüfung",
    "rejected": "Abgelehnt",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Ausblenden",
    "show": "Anzeigen",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "ru": {
    "paymentAudit": "Проверка платежей",
    "recentPaymentReferences": "Последние платежные ссылки",
    "paymentAuditBodyView": "Используйте, когда гость говорит, что оплатил. Нажмите, чтобы посмотреть последние ссылки Paystack.",
    "paymentAuditBodyHide": "Используйте, когда гость говорит, что оплатил. Нажмите, чтобы скрыть последние ссылки Paystack.",
    "latest": "последние",
    "viewReferences": "Показать ссылки",
    "hideReferences": "Скрыть ссылки",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Активно",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Отклонено",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Ожидает",
    "approvedStatus": "Одобрено",
    "paidStatus": "Оплачено",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "История выводов",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Показать детали",
    "hideDetails": "Скрыть детали",
    "payoutAccountConnected": "Счет выплат подключен",
    "recipientCode": "Код получателя",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Не подключено",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Подключить счет выплат",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Отправка...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Оплачено",
    "approvedByBlackline": "Одобрено Blackline",
    "waitingForReview": "Ожидает проверки",
    "rejected": "Отклонено",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Скрыть",
    "show": "Показать",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "tr": {
    "paymentAudit": "Ödeme denetimi",
    "recentPaymentReferences": "Son ödeme referansları",
    "paymentAuditBodyView": "Misafir ödeme yaptığını söylediğinde bunu kullan. Son Paystack referanslarını görmek için dokun.",
    "paymentAuditBodyHide": "Misafir ödeme yaptığını söylediğinde bunu kullan. Son Paystack referanslarını gizlemek için dokun.",
    "latest": "son",
    "viewReferences": "Referansları göster",
    "hideReferences": "Referansları gizle",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Aktif",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Reddedildi",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Bekliyor",
    "approvedStatus": "Onaylandı",
    "paidStatus": "Ödendi",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Para çekme geçmişi",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Detayları göster",
    "hideDetails": "Detayları gizle",
    "payoutAccountConnected": "Ödeme hesabı bağlı",
    "recipientCode": "Alıcı kodu",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Bağlı değil",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Ödeme hesabını bağla",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Gönderiliyor...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Ödendi",
    "approvedByBlackline": "Blackline onayladı",
    "waitingForReview": "İnceleme bekliyor",
    "rejected": "Reddedildi",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Gizle",
    "show": "Göster",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "it": {
    "paymentAudit": "Controllo pagamenti",
    "recentPaymentReferences": "Riferimenti pagamento recenti",
    "paymentAuditBodyView": "Usalo quando un ospite dice di aver pagato. Tocca per vedere i riferimenti Paystack recenti.",
    "paymentAuditBodyHide": "Usalo quando un ospite dice di aver pagato. Tocca per nascondere i riferimenti Paystack recenti.",
    "latest": "recenti",
    "viewReferences": "Vedi riferimenti",
    "hideReferences": "Nascondi riferimenti",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Attivo",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Rifiutato",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "In attesa",
    "approvedStatus": "Approvato",
    "paidStatus": "Pagato",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Storico prelievi",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Vedi dettagli",
    "hideDetails": "Nascondi dettagli",
    "payoutAccountConnected": "Account pagamento connesso",
    "recipientCode": "Codice destinatario",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Non connesso",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Connetti account pagamento",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Invio...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Pagato",
    "approvedByBlackline": "Approvato da Blackline",
    "waitingForReview": "In attesa di controllo",
    "rejected": "Rifiutato",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Nascondi",
    "show": "Mostra",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "nl": {
    "paymentAudit": "Betalingscontrole",
    "recentPaymentReferences": "Recente betalingsreferenties",
    "paymentAuditBodyView": "Gebruik dit wanneer een gast zegt dat hij heeft betaald. Tik om recente Paystack-referenties te bekijken.",
    "paymentAuditBodyHide": "Gebruik dit wanneer een gast zegt dat hij heeft betaald. Tik om recente Paystack-referenties te verbergen.",
    "latest": "laatste",
    "viewReferences": "Referenties bekijken",
    "hideReferences": "Referenties verbergen",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Actief",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Afgewezen",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "In behandeling",
    "approvedStatus": "Goedgekeurd",
    "paidStatus": "Betaald",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Opnamegeschiedenis",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Details bekijken",
    "hideDetails": "Details verbergen",
    "payoutAccountConnected": "Uitbetaalaccount verbonden",
    "recipientCode": "Ontvangercode",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Niet verbonden",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Uitbetaalaccount verbinden",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Verzenden...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Betaald",
    "approvedByBlackline": "Goedgekeurd door Blackline",
    "waitingForReview": "Wacht op beoordeling",
    "rejected": "Afgewezen",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Verbergen",
    "show": "Tonen",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "pl": {
    "paymentAudit": "Kontrola płatności",
    "recentPaymentReferences": "Ostatnie referencje płatności",
    "paymentAuditBodyView": "Użyj tego, gdy gość mówi, że zapłacił. Dotknij, aby zobaczyć ostatnie referencje Paystack.",
    "paymentAuditBodyHide": "Użyj tego, gdy gość mówi, że zapłacił. Dotknij, aby ukryć ostatnie referencje Paystack.",
    "latest": "ostatnie",
    "viewReferences": "Pokaż referencje",
    "hideReferences": "Ukryj referencje",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Aktywne",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Odrzucone",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Oczekuje",
    "approvedStatus": "Zatwierdzone",
    "paidStatus": "Zapłacone",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Historia wypłat",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Pokaż szczegóły",
    "hideDetails": "Ukryj szczegóły",
    "payoutAccountConnected": "Konto wypłat połączone",
    "recipientCode": "Kod odbiorcy",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Nie połączono",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Połącz konto wypłat",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Wysyłanie...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Zapłacone",
    "approvedByBlackline": "Zatwierdzone przez Blackline",
    "waitingForReview": "Czeka na sprawdzenie",
    "rejected": "Odrzucone",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Ukryj",
    "show": "Pokaż",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "el": {
    "paymentAudit": "Έλεγχος πληρωμών",
    "recentPaymentReferences": "Πρόσφατες αναφορές πληρωμών",
    "paymentAuditBodyView": "Χρησιμοποιήστε το όταν ένας επισκέπτης λέει ότι πλήρωσε. Πατήστε για να δείτε πρόσφατες αναφορές Paystack.",
    "paymentAuditBodyHide": "Χρησιμοποιήστε το όταν ένας επισκέπτης λέει ότι πλήρωσε. Πατήστε για να αποκρύψετε πρόσφατες αναφορές Paystack.",
    "latest": "πρόσφατα",
    "viewReferences": "Προβολή αναφορών",
    "hideReferences": "Απόκρυψη αναφορών",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Ενεργό",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Απορρίφθηκε",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Σε αναμονή",
    "approvedStatus": "Εγκεκριμένο",
    "paidStatus": "Πληρωμένο",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Ιστορικό αναλήψεων",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Προβολή λεπτομερειών",
    "hideDetails": "Απόκρυψη λεπτομερειών",
    "payoutAccountConnected": "Ο λογαριασμός πληρωμής συνδέθηκε",
    "recipientCode": "Κωδικός παραλήπτη",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Μη συνδεδεμένο",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Σύνδεση λογαριασμού πληρωμής",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Υποβολή...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Πληρωμένο",
    "approvedByBlackline": "Εγκρίθηκε από Blackline",
    "waitingForReview": "Αναμονή ελέγχου",
    "rejected": "Απορρίφθηκε",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Απόκρυψη",
    "show": "Εμφάνιση",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  },
  "uk": {
    "paymentAudit": "Перевірка платежів",
    "recentPaymentReferences": "Останні платіжні референси",
    "paymentAuditBodyView": "Використовуйте, коли гість каже, що оплатив. Натисніть, щоб переглянути останні референси Paystack.",
    "paymentAuditBodyHide": "Використовуйте, коли гість каже, що оплатив. Натисніть, щоб сховати останні референси Paystack.",
    "latest": "останні",
    "viewReferences": "Показати референси",
    "hideReferences": "Сховати референси",
    "noPaymentsRecordedYet": "No payments recorded yet.",
    "requestNumber": "Request #",
    "songNotSaved": "Song not saved",
    "artistNotSaved": "Artist not saved",
    "guest": "Guest",
    "guestNotSaved": "Guest not saved",
    "noDate": "No date",
    "paystackReference": "Paystack reference",
    "noReferenceSaved": "No reference saved",
    "copyReference": "Copy reference",
    "noPaymentReferenceFound": "No payment reference found for this payment.",
    "paymentReferenceCopied": "Payment reference copied",
    "failedConnectPayout": "Failed to connect payout account.",
    "payoutConnectedAlert": "Payout account connected.",
    "active": "Активно",
    "pendingVerificationStatus": "Pending verification",
    "rejectedStatus": "Відхилено",
    "notStartedStatus": "Not started",
    "updatedStatus": "Updated",
    "pendingStatus": "Очікує",
    "approvedStatus": "Схвалено",
    "paidStatus": "Виплачено",
    "unknownStatus": "Unknown",
    "withdrawalHistory": "Історія виведень",
    "latestLabel": "Latest",
    "withdrawalSingular": "withdrawal",
    "withdrawalPlural": "withdrawals",
    "totalWithdrawn": "Total withdrawn",
    "totalRequested": "Total requested",
    "available": "Available",
    "latestRequest": "Latest request",
    "unknown": "Unknown",
    "viewDetails": "Показати деталі",
    "hideDetails": "Сховати деталі",
    "payoutAccountConnected": "Рахунок виплат підключено",
    "recipientCode": "Код отримувача",
    "notCreatedYet": "Not created yet",
    "loadingBanks": "Loading banks...",
    "selectBank": "Select bank",
    "paypalEmailOrProvider": "PayPal email or provider",
    "payoutProvider": "Payout provider",
    "accountName": "Account name",
    "accountNumber": "Account number",
    "mobileMoneyNumber": "Mobile money number",
    "accountPayoutId": "Account / payout ID",
    "connectingToPaystack": "Connecting to Paystack...",
    "payoutDestination": "Payout destination",
    "notConnected": "Не підключено",
    "notProvided": "Not provided",
    "connectPayoutAccount": "Підключити рахунок виплат",
    "connectPayoutBeforeWithdrawal": "Connect your payout account with Paystack before requesting a withdrawal.",
    "existingWithdrawalLocked": "You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.",
    "submitting": "Надсилання...",
    "verificationRequiredBeforeWithdrawal": "Verification required before withdrawals can be requested.",
    "alreadyOpenWithdrawalAlert": "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one.",
    "enterValidWithdrawalAmount": "Enter a valid withdrawal amount",
    "insufficientAvailableBalance": "Insufficient available balance",
    "requested": "Requested",
    "method": "Method",
    "provider": "Provider",
    "bankTransfer": "Bank Transfer",
    "noProvider": "No provider",
    "noAccountName": "No account name",
    "noAccountNumber": "No account number",
    "paid": "Виплачено",
    "approvedByBlackline": "Схвалено Blackline",
    "waitingForReview": "Очікує перевірки",
    "rejected": "Відхилено",
    "withdrawalActivityTimeline": "Withdrawal Activity Timeline",
    "hide": "Сховати",
    "show": "Показати",
    "noStatusUpdatesYet": "No status updates yet.",
    "activityUpdated": "Activity updated"
  }
};

const dashboardAlertTranslations: Record<Language, DashboardAlertTranslation> = {
  en: {
    actionNeeded: "Action needed",
    pendingRequestSingular: "pending song request",
    pendingRequestPlural: "pending song requests",
    needReview: "need review",
    tapToQueue: "Tap here to jump straight to your request queue.",
    reviewNow: "Review now",
    done: "done",
    showSteps: "Show steps",
    hideSteps: "Hide steps",
    showAllHistory: "Show all history",
    showLessHistory: "Show less",
    playedHistoryRetentionNote: "Played history shown here covers the last 30 days. Older records are kept safely for payment and support audit.",
    playedAt: "Played at",
    expiresIn: "Expires in",
    qrCode: "QR code",
    showQr: "Show QR",
    hideQr: "Hide QR",
  },
  zh: {
    actionNeeded: "需要操作",
    pendingRequestSingular: "个待处理点歌",
    pendingRequestPlural: "个待处理点歌",
    needReview: "需要审核",
    tapToQueue: "点此直接跳到你的点歌队列。",
    reviewNow: "立即查看",
    done: "已完成",
    showSteps: "显示步骤",
    hideSteps: "隐藏步骤",
    showAllHistory: "显示全部历史",
    showLessHistory: "显示更少",
    playedHistoryRetentionNote: "这里显示最近30天的播放历史。更早的记录会安全保留，用于付款和支持审核。",
    playedAt: "播放时间",
    expiresIn: "剩余",
    qrCode: "二维码",
    showQr: "显示二维码",
    hideQr: "隐藏二维码",
  },
  ja: {
    actionNeeded: "要対応",
    pendingRequestSingular: "件の保留中リクエスト",
    pendingRequestPlural: "件の保留中リクエスト",
    needReview: "確認が必要です",
    tapToQueue: "ここをタップしてリクエストキューへ移動します。",
    reviewNow: "今すぐ確認",
    done: "完了",
    showSteps: "手順を表示",
    hideSteps: "手順を隠す",
    showAllHistory: "履歴をすべて表示",
    showLessHistory: "少なく表示",
    playedHistoryRetentionNote: "ここには過去30日間の再生履歴が表示されます。古い記録は支払いとサポート確認のため安全に保管されます。",
    playedAt: "再生時刻",
    expiresIn: "残り",
    qrCode: "QRコード",
    showQr: "QRを表示",
    hideQr: "QRを隠す",
  },
  ko: {
    actionNeeded: "조치 필요",
    pendingRequestSingular: "개의 대기 곡 요청",
    pendingRequestPlural: "개의 대기 곡 요청",
    needReview: "확인이 필요합니다",
    tapToQueue: "요청 대기열로 바로 이동하려면 탭하세요.",
    reviewNow: "지금 확인",
    done: "완료",
    showSteps: "단계 보기",
    hideSteps: "단계 숨기기",
    showAllHistory: "전체 기록 보기",
    showLessHistory: "적게 보기",
    playedHistoryRetentionNote: "여기에는 최근 30일 재생 기록이 표시됩니다. 이전 기록은 결제 및 지원 확인을 위해 안전하게 보관됩니다.",
    playedAt: "재생 시간",
    expiresIn: "남은 시간",
    qrCode: "QR 코드",
    showQr: "QR 보기",
    hideQr: "QR 숨기기",
  },
  id: {
    actionNeeded: "Perlu aksi",
    pendingRequestSingular: "request lagu pending",
    pendingRequestPlural: "request lagu pending",
    needReview: "perlu ditinjau",
    tapToQueue: "Tap untuk langsung ke antrean request Anda.",
    reviewNow: "Tinjau sekarang",
    done: "selesai",
    showSteps: "Tampilkan langkah",
    hideSteps: "Sembunyikan langkah",
    showAllHistory: "Tampilkan semua riwayat",
    showLessHistory: "Tampilkan lebih sedikit",
    playedHistoryRetentionNote: "Riwayat yang tampil di sini mencakup 30 hari terakhir. Catatan lama tetap disimpan aman untuk audit pembayaran dan bantuan.",
    playedAt: "Diputar pada",
    expiresIn: "Berakhir dalam",
    qrCode: "Kode QR",
    showQr: "Tampilkan QR",
    hideQr: "Sembunyikan QR",
  },
  ms: {
    actionNeeded: "Perlu tindakan",
    pendingRequestSingular: "permintaan lagu pending",
    pendingRequestPlural: "permintaan lagu pending",
    needReview: "perlu disemak",
    tapToQueue: "Tekan untuk terus ke barisan permintaan anda.",
    reviewNow: "Semak sekarang",
    done: "selesai",
    showSteps: "Tunjuk langkah",
    hideSteps: "Sembunyi langkah",
    showAllHistory: "Tunjuk semua sejarah",
    showLessHistory: "Tunjuk kurang",
    playedHistoryRetentionNote: "Sejarah yang dipaparkan di sini meliputi 30 hari terakhir. Rekod lama disimpan dengan selamat untuk audit bayaran dan sokongan.",
    playedAt: "Dimainkan pada",
    expiresIn: "Tamat dalam",
    qrCode: "Kod QR",
    showQr: "Tunjuk QR",
    hideQr: "Sembunyi QR",
  },
  th: {
    actionNeeded: "ต้องดำเนินการ",
    pendingRequestSingular: "คำขอเพลงที่รออยู่",
    pendingRequestPlural: "คำขอเพลงที่รออยู่",
    needReview: "ต้องตรวจสอบ",
    tapToQueue: "แตะเพื่อไปยังคิวคำขอของคุณทันที",
    reviewNow: "ตรวจสอบตอนนี้",
    done: "เสร็จแล้ว",
    showSteps: "แสดงขั้นตอน",
    hideSteps: "ซ่อนขั้นตอน",
    showAllHistory: "แสดงประวัติทั้งหมด",
    showLessHistory: "แสดงน้อยลง",
    playedHistoryRetentionNote: "ประวัติที่แสดงที่นี่เป็นของ 30 วันที่ผ่านมา รายการเก่าจะถูกเก็บไว้อย่างปลอดภัยสำหรับการตรวจสอบการชำระเงินและการช่วยเหลือ",
    playedAt: "เล่นเมื่อ",
    expiresIn: "เหลือเวลา",
    qrCode: "รหัส QR",
    showQr: "แสดง QR",
    hideQr: "ซ่อน QR",
  },
  hi: {
    actionNeeded: "कार्रवाई चाहिए",
    pendingRequestSingular: "pending song request",
    pendingRequestPlural: "pending song requests",
    needReview: "review चाहिए",
    tapToQueue: "Request queue पर सीधे जाने के लिए tap करें.",
    reviewNow: "अभी review करें",
    done: "done",
    showSteps: "Steps दिखाएं",
    hideSteps: "Steps छिपाएं",
    showAllHistory: "पूरी history दिखाएं",
    showLessHistory: "कम दिखाएं",
    playedHistoryRetentionNote: "यहाँ पिछले 30 दिनों की played history दिखाई जाती है. पुराने records payment और support audit के लिए सुरक्षित रखे जाते हैं.",
    playedAt: "चलाया गया",
    expiresIn: "समाप्त होने में",
    qrCode: "QR कोड",
    showQr: "QR दिखाएं",
    hideQr: "QR छिपाएं",
  },
  ar: {
    actionNeeded: "يتطلب إجراء",
    pendingRequestSingular: "طلب أغنية معلق",
    pendingRequestPlural: "طلبات أغاني معلقة",
    needReview: "تحتاج إلى مراجعة",
    tapToQueue: "اضغط للانتقال مباشرة إلى قائمة الطلبات.",
    reviewNow: "راجع الآن",
    done: "مكتمل",
    showSteps: "إظهار الخطوات",
    hideSteps: "إخفاء الخطوات",
    showAllHistory: "إظهار كل السجل",
    showLessHistory: "إظهار أقل",
    playedHistoryRetentionNote: "يعرض هذا القسم سجل التشغيل لآخر 30 يومًا. يتم حفظ السجلات الأقدم بأمان لتدقيق الدفع والدعم.",
    playedAt: "تم التشغيل في",
    expiresIn: "ينتهي خلال",
    qrCode: "رمز QR",
    showQr: "إظهار QR",
    hideQr: "إخفاء QR",
  },
  vi: {
    actionNeeded: "Cần xử lý",
    pendingRequestSingular: "yêu cầu bài hát đang chờ",
    pendingRequestPlural: "yêu cầu bài hát đang chờ",
    needReview: "cần xem lại",
    tapToQueue: "Nhấn để chuyển thẳng đến hàng đợi yêu cầu.",
    reviewNow: "Xem ngay",
    done: "xong",
    showSteps: "Hiện bước",
    hideSteps: "Ẩn bước",
    showAllHistory: "Hiện tất cả lịch sử",
    showLessHistory: "Hiện ít hơn",
    playedHistoryRetentionNote: "Lịch sử hiển thị ở đây là trong 30 ngày gần nhất. Bản ghi cũ được giữ an toàn để kiểm tra thanh toán và hỗ trợ.",
    playedAt: "Đã phát lúc",
    expiresIn: "Hết sau",
    qrCode: "Mã QR",
    showQr: "Hiện QR",
    hideQr: "Ẩn QR",
  },
  tl: {
    actionNeeded: "Kailangan aksyon",
    pendingRequestSingular: "pending song request",
    pendingRequestPlural: "pending song requests",
    needReview: "kailangang i-review",
    tapToQueue: "I-tap para pumunta agad sa request queue.",
    reviewNow: "Review ngayon",
    done: "done",
    showSteps: "Ipakita ang steps",
    hideSteps: "Itago ang steps",
    showAllHistory: "Ipakita lahat ng history",
    showLessHistory: "Ipakita nang mas kaunti",
    playedHistoryRetentionNote: "Ang history na ipinapakita dito ay para sa huling 30 araw. Ang mas lumang records ay ligtas na naka-save para sa payment at support audit.",
    playedAt: "Na-play noong",
    expiresIn: "Mag-e-expire sa",
    qrCode: "QR code",
    showQr: "Ipakita ang QR",
    hideQr: "Itago ang QR",
  },
  pt: {
    actionNeeded: "Ação necessária",
    pendingRequestSingular: "pedido de música pendente",
    pendingRequestPlural: "pedidos de música pendentes",
    needReview: "precisa de revisão",
    tapToQueue: "Toque para ir direto à fila de pedidos.",
    reviewNow: "Rever agora",
    done: "concluído",
    showSteps: "Mostrar passos",
    hideSteps: "Ocultar passos",
    showAllHistory: "Mostrar todo o histórico",
    showLessHistory: "Mostrar menos",
    playedHistoryRetentionNote: "O histórico mostrado aqui cobre os últimos 30 dias. Registos antigos ficam guardados em segurança para auditoria de pagamentos e suporte.",
    playedAt: "Tocado em",
    expiresIn: "Expira em",
    qrCode: "Código QR",
    showQr: "Mostrar QR",
    hideQr: "Ocultar QR",
  },
  es: {
    actionNeeded: "Acción necesaria",
    pendingRequestSingular: "solicitud de canción pendiente",
    pendingRequestPlural: "solicitudes de canciones pendientes",
    needReview: "necesita revisión",
    tapToQueue: "Toca aquí para ir directo a tu cola de solicitudes.",
    reviewNow: "Revisar ahora",
    done: "listo",
    showSteps: "Mostrar pasos",
    hideSteps: "Ocultar pasos",
    showAllHistory: "Mostrar todo el historial",
    showLessHistory: "Mostrar menos",
    playedHistoryRetentionNote: "El historial mostrado aquí cubre los últimos 30 días. Los registros antiguos se conservan de forma segura para auditoría de pagos y soporte.",
    playedAt: "Reproducido a las",
    expiresIn: "Expira en",
    qrCode: "Código QR",
    showQr: "Mostrar QR",
    hideQr: "Ocultar QR",
  },
  fr: {
    actionNeeded: "Action nécessaire",
    pendingRequestSingular: "demande de chanson en attente",
    pendingRequestPlural: "demandes de chansons en attente",
    needReview: "à vérifier",
    tapToQueue: "Touchez ici pour aller directement à votre file de demandes.",
    reviewNow: "Vérifier",
    done: "terminé",
    showSteps: "Afficher les étapes",
    hideSteps: "Masquer les étapes",
    showAllHistory: "Afficher tout l’historique",
    showLessHistory: "Afficher moins",
    playedHistoryRetentionNote: "L’historique affiché ici couvre les 30 derniers jours. Les anciens enregistrements sont conservés pour l’audit des paiements et le support.",
    playedAt: "Joué à",
    expiresIn: "Expire dans",
    qrCode: "QR code",
    showQr: "Afficher le QR",
    hideQr: "Masquer le QR",
  },
  de: {
    actionNeeded: "Aktion nötig",
    pendingRequestSingular: "ausstehender Songwunsch",
    pendingRequestPlural: "ausstehende Songwünsche",
    needReview: "muss geprüft werden",
    tapToQueue: "Tippe hier, um direkt zur Anfrage-Warteschlange zu springen.",
    reviewNow: "Jetzt prüfen",
    done: "erledigt",
    showSteps: "Schritte anzeigen",
    hideSteps: "Schritte ausblenden",
    showAllHistory: "Gesamten Verlauf anzeigen",
    showLessHistory: "Weniger anzeigen",
    playedHistoryRetentionNote: "Der hier angezeigte Verlauf umfasst die letzten 30 Tage. Ältere Datensätze werden für Zahlungs- und Supportprüfungen sicher aufbewahrt.",
    playedAt: "Gespielt um",
    expiresIn: "Läuft ab in",
    qrCode: "QR-Code",
    showQr: "QR anzeigen",
    hideQr: "QR ausblenden",
  },
  ru: {
    actionNeeded: "Требуется действие",
    pendingRequestSingular: "ожидающий запрос песни",
    pendingRequestPlural: "ожидающих запроса песни",
    needReview: "нужно проверить",
    tapToQueue: "Нажмите, чтобы перейти прямо к очереди запросов.",
    reviewNow: "Проверить",
    done: "готово",
    showSteps: "Показать шаги",
    hideSteps: "Скрыть шаги",
    showAllHistory: "Показать всю историю",
    showLessHistory: "Показать меньше",
    playedHistoryRetentionNote: "Здесь отображается история за последние 30 дней. Более старые записи безопасно сохраняются для проверки платежей и поддержки.",
    playedAt: "Воспроизведено",
    expiresIn: "Истекает через",
    qrCode: "QR-код",
    showQr: "Показать QR",
    hideQr: "Скрыть QR",
  },
  tr: {
    actionNeeded: "İşlem gerekli",
    pendingRequestSingular: "bekleyen şarkı isteği",
    pendingRequestPlural: "bekleyen şarkı isteği",
    needReview: "incelenmeli",
    tapToQueue: "İstek kuyruğuna gitmek için dokun.",
    reviewNow: "Şimdi incele",
    done: "tamamlandı",
    showSteps: "Adımları göster",
    hideSteps: "Adımları gizle",
    showAllHistory: "Tüm geçmişi göster",
    showLessHistory: "Daha az göster",
    playedHistoryRetentionNote: "Burada son 30 günün geçmişi gösterilir. Eski kayıtlar ödeme ve destek denetimi için güvenli şekilde saklanır.",
    playedAt: "Çalındığı zaman",
    expiresIn: "Kalan süre",
    qrCode: "QR kodu",
    showQr: "QR göster",
    hideQr: "QR gizle",
  },
  it: {
    actionNeeded: "Azione richiesta",
    pendingRequestSingular: "richiesta brano in attesa",
    pendingRequestPlural: "richieste brani in attesa",
    needReview: "da controllare",
    tapToQueue: "Tocca qui per andare alla coda richieste.",
    reviewNow: "Controlla ora",
    done: "completato",
    showSteps: "Mostra passaggi",
    hideSteps: "Nascondi passaggi",
    showAllHistory: "Mostra tutta la cronologia",
    showLessHistory: "Mostra meno",
    playedHistoryRetentionNote: "La cronologia mostrata qui copre gli ultimi 30 giorni. I record più vecchi sono conservati per audit pagamenti e supporto.",
    playedAt: "Riprodotto alle",
    expiresIn: "Scade tra",
    qrCode: "Codice QR",
    showQr: "Mostra QR",
    hideQr: "Nascondi QR",
  },
  nl: {
    actionNeeded: "Actie nodig",
    pendingRequestSingular: "openstaand songverzoek",
    pendingRequestPlural: "openstaande songverzoeken",
    needReview: "moet worden bekeken",
    tapToQueue: "Tik om direct naar je verzoekwachtrij te gaan.",
    reviewNow: "Nu bekijken",
    done: "klaar",
    showSteps: "Stappen tonen",
    hideSteps: "Stappen verbergen",
    showAllHistory: "Alle geschiedenis tonen",
    showLessHistory: "Minder tonen",
    playedHistoryRetentionNote: "De geschiedenis die hier wordt getoond beslaat de laatste 30 dagen. Oudere records worden veilig bewaard voor betalings- en supportcontrole.",
    playedAt: "Gespeeld om",
    expiresIn: "Verloopt over",
    qrCode: "QR-code",
    showQr: "QR tonen",
    hideQr: "QR verbergen",
  },
  pl: {
    actionNeeded: "Wymagana akcja",
    pendingRequestSingular: "oczekująca prośba o piosenkę",
    pendingRequestPlural: "oczekujące prośby o piosenki",
    needReview: "wymaga sprawdzenia",
    tapToQueue: "Dotknij, aby przejść prosto do kolejki próśb.",
    reviewNow: "Sprawdź teraz",
    done: "gotowe",
    showSteps: "Pokaż kroki",
    hideSteps: "Ukryj kroki",
    showAllHistory: "Pokaż całą historię",
    showLessHistory: "Pokaż mniej",
    playedHistoryRetentionNote: "Pokazana tutaj historia obejmuje ostatnie 30 dni. Starsze rekordy są bezpiecznie przechowywane do kontroli płatności i wsparcia.",
    playedAt: "Odtworzono o",
    expiresIn: "Wygasa za",
    qrCode: "Kod QR",
    showQr: "Pokaż QR",
    hideQr: "Ukryj QR",
  },
  el: {
    actionNeeded: "Απαιτείται ενέργεια",
    pendingRequestSingular: "εκκρεμές αίτημα τραγουδιού",
    pendingRequestPlural: "εκκρεμή αιτήματα τραγουδιών",
    needReview: "χρειάζεται έλεγχο",
    tapToQueue: "Πατήστε για να πάτε απευθείας στην ουρά αιτημάτων.",
    reviewNow: "Έλεγχος τώρα",
    done: "ολοκληρώθηκε",
    showSteps: "Εμφάνιση βημάτων",
    hideSteps: "Απόκρυψη βημάτων",
    showAllHistory: "Εμφάνιση όλου του ιστορικού",
    showLessHistory: "Εμφάνιση λιγότερων",
    playedHistoryRetentionNote: "Το ιστορικό που εμφανίζεται εδώ καλύπτει τις τελευταίες 30 ημέρες. Παλαιότερες εγγραφές φυλάσσονται για έλεγχο πληρωμών και υποστήριξη.",
    playedAt: "Παίχτηκε στις",
    expiresIn: "Λήγει σε",
    qrCode: "Κωδικός QR",
    showQr: "Εμφάνιση QR",
    hideQr: "Απόκρυψη QR",
  },
  uk: {
    actionNeeded: "Потрібна дія",
    pendingRequestSingular: "очікуваний запит пісні",
    pendingRequestPlural: "очікувані запити пісень",
    needReview: "потрібно переглянути",
    tapToQueue: "Натисніть, щоб перейти прямо до черги запитів.",
    reviewNow: "Переглянути",
    done: "готово",
    showSteps: "Показати кроки",
    hideSteps: "Сховати кроки",
    showAllHistory: "Показати всю історію",
    showLessHistory: "Показати менше",
    playedHistoryRetentionNote: "Тут показано історію за останні 30 днів. Старіші записи безпечно зберігаються для перевірки платежів і підтримки.",
    playedAt: "Відтворено",
    expiresIn: "Закінчиться через",
    qrCode: "QR-код",
    showQr: "Показати QR",
    hideQr: "Сховати QR",
  },
};

const balanceExplainerTranslations: Record<Language, BalanceExplainerTranslation> = {
  "en": {
    "title": "How your balance is calculated",
    "leadBefore": "Your",
    "availableBalance": "available balance",
    "leadAfter": "is your DJ earnings after the Blackline platform fee, minus any withdrawals that are pending, approved, or already paid.",
    "grossTitle": "Gross earnings",
    "grossBody": "Total paid requests before fees.",
    "djTitle": "DJ earnings",
    "djBody": "Your share after Blackline fees.",
    "openTitle": "Open withdrawals",
    "openBody": "Pending, approved, and paid withdrawals reduce available balance.",
    "verificationTitle": "Verification",
    "verificationBody": "You can take paid requests before approval. Withdrawals unlock after verification.",
    "formula": "Formula: Available balance = DJ earnings - pending/approved/paid withdrawals."
  },
  "zh": {
    "title": "余额如何计算",
    "leadBefore": "你的",
    "availableBalance": "可用余额",
    "leadAfter": "是扣除 Blackline 平台费后的 DJ 收入，再减去待处理、已批准或已支付的提现。",
    "grossTitle": "总收入",
    "grossBody": "扣费前的所有付费点歌金额。",
    "djTitle": "DJ 收入",
    "djBody": "扣除 Blackline 费用后的你的收入。",
    "openTitle": "提现记录",
    "openBody": "待处理、已批准和已支付的提现会减少可用余额。",
    "verificationTitle": "验证",
    "verificationBody": "批准前你仍可接受付费点歌。验证后可提现。",
    "formula": "公式：可用余额 = DJ 收入 - 待处理/已批准/已支付提现。"
  },
  "ja": {
    "title": "残高の仕組み",
    "leadBefore": "あなたの",
    "availableBalance": "利用可能残高",
    "leadAfter": "は、Blackline手数料を差し引いたDJ収益から、保留中・承認済み・支払い済みの出金を引いた金額です。",
    "grossTitle": "総収益",
    "grossBody": "手数料前のすべての有料リクエスト。",
    "djTitle": "DJ収益",
    "djBody": "Blackline手数料後のあなたの取り分。",
    "openTitle": "出金分",
    "openBody": "保留中、承認済み、支払い済みの出金は利用可能残高を減らします。",
    "verificationTitle": "認証",
    "verificationBody": "承認前でも有料リクエストは受けられます。出金は認証後に有効になります。",
    "formula": "計算式：利用可能残高 = DJ収益 - 保留中/承認済み/支払い済み出金。"
  },
  "ko": {
    "title": "잔액 계산 방식",
    "leadBefore": "내",
    "availableBalance": "사용 가능 잔액",
    "leadAfter": "은 Blackline 플랫폼 수수료를 뺀 DJ 수익에서 대기, 승인, 지급된 출금을 뺀 금액입니다.",
    "grossTitle": "총 수익",
    "grossBody": "수수료 전 전체 유료 요청 금액입니다.",
    "djTitle": "DJ 수익",
    "djBody": "Blackline 수수료 후 내 몫입니다.",
    "openTitle": "출금 내역",
    "openBody": "대기, 승인, 지급된 출금은 사용 가능 잔액을 줄입니다.",
    "verificationTitle": "인증",
    "verificationBody": "승인 전에도 유료 요청을 받을 수 있습니다. 출금은 인증 후 열립니다.",
    "formula": "공식: 사용 가능 잔액 = DJ 수익 - 대기/승인/지급된 출금."
  },
  "id": {
    "title": "Cara kerja saldo Anda",
    "leadBefore": "Saldo",
    "availableBalance": "tersedia",
    "leadAfter": "adalah pendapatan DJ setelah biaya platform Blackline, dikurangi penarikan yang pending, disetujui, atau sudah dibayar.",
    "grossTitle": "Pendapatan kotor",
    "grossBody": "Total request berbayar sebelum biaya.",
    "djTitle": "Pendapatan DJ",
    "djBody": "Bagian Anda setelah biaya Blackline.",
    "openTitle": "Penarikan terbuka",
    "openBody": "Penarikan pending, disetujui, dan dibayar mengurangi saldo tersedia.",
    "verificationTitle": "Verifikasi",
    "verificationBody": "Anda bisa menerima request berbayar sebelum disetujui. Penarikan terbuka setelah verifikasi.",
    "formula": "Rumus: Saldo tersedia = pendapatan DJ - penarikan pending/disetujui/dibayar."
  },
  "ms": {
    "title": "Cara baki anda dikira",
    "leadBefore": "Baki",
    "availableBalance": "tersedia",
    "leadAfter": "ialah pendapatan DJ selepas yuran platform Blackline, ditolak pengeluaran yang pending, diluluskan atau sudah dibayar.",
    "grossTitle": "Pendapatan kasar",
    "grossBody": "Jumlah permintaan berbayar sebelum yuran.",
    "djTitle": "Pendapatan DJ",
    "djBody": "Bahagian anda selepas yuran Blackline.",
    "openTitle": "Pengeluaran terbuka",
    "openBody": "Pengeluaran pending, diluluskan dan dibayar mengurangkan baki tersedia.",
    "verificationTitle": "Verifikasi",
    "verificationBody": "Anda boleh menerima permintaan berbayar sebelum kelulusan. Pengeluaran dibuka selepas verifikasi.",
    "formula": "Formula: Baki tersedia = pendapatan DJ - pengeluaran pending/diluluskan/dibayar."
  },
  "th": {
    "title": "ยอดเงินของคุณคำนวณอย่างไร",
    "leadBefore": "ยอด",
    "availableBalance": "พร้อมใช้",
    "leadAfter": "คือรายได้ DJ หลังหักค่าธรรมเนียม Blackline แล้วลบการถอนที่รอดำเนินการ อนุมัติแล้ว หรือจ่ายแล้ว",
    "grossTitle": "รายได้รวม",
    "grossBody": "คำขอเพลงแบบชำระเงินทั้งหมดก่อนหักค่าธรรมเนียม",
    "djTitle": "รายได้ DJ",
    "djBody": "ส่วนแบ่งของคุณหลังหักค่าธรรมเนียม Blackline",
    "openTitle": "การถอนเงิน",
    "openBody": "การถอนที่รอดำเนินการ อนุมัติแล้ว และจ่ายแล้วจะลดยอดพร้อมใช้",
    "verificationTitle": "การยืนยัน",
    "verificationBody": "คุณรับคำขอแบบชำระเงินได้ก่อนอนุมัติ การถอนจะปลดล็อกหลังการยืนยัน",
    "formula": "สูตร: ยอดพร้อมใช้ = รายได้ DJ - การถอนที่รอดำเนินการ/อนุมัติแล้ว/จ่ายแล้ว"
  },
  "hi": {
    "title": "आपका बैलेंस कैसे काम करता है",
    "leadBefore": "आपका",
    "availableBalance": "available balance",
    "leadAfter": "Blackline platform fee के बाद DJ earnings है, जिसमें pending, approved या paid withdrawals घटा दी जाती हैं।",
    "grossTitle": "Gross earnings",
    "grossBody": "Fees से पहले कुल paid requests.",
    "djTitle": "DJ earnings",
    "djBody": "Blackline fees के बाद आपका हिस्सा.",
    "openTitle": "Open withdrawals",
    "openBody": "Pending, approved और paid withdrawals available balance कम करती हैं.",
    "verificationTitle": "Verification",
    "verificationBody": "Approval से पहले भी आप paid requests ले सकते हैं. Withdrawals verification के बाद unlock होती हैं.",
    "formula": "Formula: Available balance = DJ earnings - pending/approved/paid withdrawals."
  },
  "ar": {
    "title": "كيف يعمل رصيدك",
    "leadBefore": "رصيدك",
    "availableBalance": "المتاح",
    "leadAfter": "هو أرباح DJ بعد رسوم منصة Blackline، ناقص أي سحوبات معلقة أو معتمدة أو مدفوعة.",
    "grossTitle": "الإيرادات الإجمالية",
    "grossBody": "إجمالي الطلبات المدفوعة قبل الرسوم.",
    "djTitle": "أرباح DJ",
    "djBody": "حصتك بعد رسوم Blackline.",
    "openTitle": "السحوبات المفتوحة",
    "openBody": "السحوبات المعلقة والمعتمدة والمدفوعة تقلل الرصيد المتاح.",
    "verificationTitle": "التوثيق",
    "verificationBody": "يمكنك استقبال الطلبات المدفوعة قبل الموافقة. السحب يفتح بعد التوثيق.",
    "formula": "المعادلة: الرصيد المتاح = أرباح DJ - السحوبات المعلقة/المعتمدة/المدفوعة."
  },
  "vi": {
    "title": "Cách số dư hoạt động",
    "leadBefore": "Số dư",
    "availableBalance": "khả dụng",
    "leadAfter": "là thu nhập DJ sau phí nền tảng Blackline, trừ các khoản rút đang chờ, đã duyệt hoặc đã trả.",
    "grossTitle": "Doanh thu gộp",
    "grossBody": "Tổng yêu cầu trả phí trước phí.",
    "djTitle": "Thu nhập DJ",
    "djBody": "Phần của bạn sau phí Blackline.",
    "openTitle": "Khoản rút mở",
    "openBody": "Khoản rút đang chờ, đã duyệt và đã trả sẽ giảm số dư khả dụng.",
    "verificationTitle": "Xác minh",
    "verificationBody": "Bạn có thể nhận yêu cầu trả phí trước khi được duyệt. Rút tiền mở sau xác minh.",
    "formula": "Công thức: Số dư khả dụng = thu nhập DJ - khoản rút đang chờ/đã duyệt/đã trả."
  },
  "tl": {
    "title": "Paano gumagana ang balance mo",
    "leadBefore": "Ang",
    "availableBalance": "available balance",
    "leadAfter": "mo ay DJ earnings pagkatapos ng Blackline platform fee, minus withdrawals na pending, approved, o paid na.",
    "grossTitle": "Gross earnings",
    "grossBody": "Kabuuang paid requests bago ang fees.",
    "djTitle": "DJ earnings",
    "djBody": "Share mo pagkatapos ng Blackline fees.",
    "openTitle": "Open withdrawals",
    "openBody": "Pending, approved, at paid withdrawals ay nagbabawas sa available balance.",
    "verificationTitle": "Verification",
    "verificationBody": "Pwede kang tumanggap ng paid requests bago ma-approve. Unlock ang withdrawals pagkatapos ng verification.",
    "formula": "Formula: Available balance = DJ earnings - pending/approved/paid withdrawals."
  },
  "pt": {
    "title": "Como o seu saldo funciona",
    "leadBefore": "O seu",
    "availableBalance": "saldo disponível",
    "leadAfter": "é o ganho do DJ após a taxa da plataforma Blackline, menos levantamentos pendentes, aprovados ou já pagos.",
    "grossTitle": "Ganhos brutos",
    "grossBody": "Total de pedidos pagos antes das taxas.",
    "djTitle": "Ganhos do DJ",
    "djBody": "A sua parte após as taxas Blackline.",
    "openTitle": "Levantamentos abertos",
    "openBody": "Levantamentos pendentes, aprovados e pagos reduzem o saldo disponível.",
    "verificationTitle": "Verificação",
    "verificationBody": "Pode receber pedidos pagos antes da aprovação. Levantamentos desbloqueiam após verificação.",
    "formula": "Fórmula: Saldo disponível = ganhos do DJ - levantamentos pendentes/aprovados/pagos."
  },
  "es": {
    "title": "Cómo funciona tu saldo",
    "leadBefore": "Tu",
    "availableBalance": "saldo disponible",
    "leadAfter": "es tu ganancia de DJ después de la comisión de Blackline, menos cualquier retiro pendiente, aprobado o ya pagado.",
    "grossTitle": "Ganancias brutas",
    "grossBody": "Total de solicitudes pagadas antes de comisiones.",
    "djTitle": "Ganancias del DJ",
    "djBody": "Tu parte después de las comisiones de Blackline.",
    "openTitle": "Retiros abiertos",
    "openBody": "Los retiros pendientes, aprobados y pagados reducen el saldo disponible.",
    "verificationTitle": "Verificación",
    "verificationBody": "Puedes recibir solicitudes pagadas antes de la aprobación. Los retiros se desbloquean después de la verificación.",
    "formula": "Fórmula: Saldo disponible = ganancias del DJ - retiros pendientes/aprobados/pagados."
  },
  "fr": {
    "title": "Comment fonctionne votre solde",
    "leadBefore": "Votre",
    "availableBalance": "solde disponible",
    "leadAfter": "correspond à vos gains DJ après les frais Blackline, moins les retraits en attente, approuvés ou déjà payés.",
    "grossTitle": "Gains bruts",
    "grossBody": "Total des demandes payantes avant les frais.",
    "djTitle": "Gains du DJ",
    "djBody": "Votre part après les frais Blackline.",
    "openTitle": "Retraits ouverts",
    "openBody": "Les retraits en attente, approuvés et payés réduisent le solde disponible.",
    "verificationTitle": "Vérification",
    "verificationBody": "Vous pouvez recevoir des demandes payantes avant approbation. Les retraits se débloquent après vérification.",
    "formula": "Formule : solde disponible = gains DJ - retraits en attente/approuvés/payés."
  },
  "de": {
    "title": "So funktioniert dein Guthaben",
    "leadBefore": "Dein",
    "availableBalance": "verfügbares Guthaben",
    "leadAfter": "sind deine DJ-Einnahmen nach der Blackline-Plattformgebühr, abzüglich ausstehender, genehmigter oder bereits bezahlter Auszahlungen.",
    "grossTitle": "Bruttoeinnahmen",
    "grossBody": "Alle bezahlten Anfragen vor Gebühren.",
    "djTitle": "DJ-Einnahmen",
    "djBody": "Dein Anteil nach Blackline-Gebühren.",
    "openTitle": "Offene Auszahlungen",
    "openBody": "Ausstehende, genehmigte und bezahlte Auszahlungen reduzieren das verfügbare Guthaben.",
    "verificationTitle": "Verifizierung",
    "verificationBody": "Du kannst vor der Freigabe bezahlte Anfragen annehmen. Auszahlungen werden nach der Verifizierung freigeschaltet.",
    "formula": "Formel: Verfügbares Guthaben = DJ-Einnahmen - ausstehende/genehmigte/bezahlte Auszahlungen."
  },
  "ru": {
    "title": "Как работает ваш баланс",
    "leadBefore": "Ваш",
    "availableBalance": "доступный баланс",
    "leadAfter": "— это доход DJ после комиссии платформы Blackline, минус выводы со статусом ожидания, одобрено или оплачено.",
    "grossTitle": "Валовой доход",
    "grossBody": "Все платные заявки до вычета комиссий.",
    "djTitle": "Доход DJ",
    "djBody": "Ваша доля после комиссий Blackline.",
    "openTitle": "Открытые выводы",
    "openBody": "Ожидающие, одобренные и оплаченные выводы уменьшают доступный баланс.",
    "verificationTitle": "Проверка",
    "verificationBody": "Вы можете принимать платные заявки до одобрения. Выводы открываются после проверки.",
    "formula": "Формула: доступный баланс = доход DJ - ожидающие/одобренные/оплаченные выводы."
  },
  "tr": {
    "title": "Bakiyen nasıl çalışır",
    "leadBefore": "Senin",
    "availableBalance": "kullanılabilir bakiyen",
    "leadAfter": "Blackline platform ücretinden sonraki DJ kazancındır; bekleyen, onaylanan veya ödenen çekimler düşülür.",
    "grossTitle": "Brüt kazanç",
    "grossBody": "Ücretlerden önceki toplam ücretli istekler.",
    "djTitle": "DJ kazancı",
    "djBody": "Blackline ücretlerinden sonraki payın.",
    "openTitle": "Açık çekimler",
    "openBody": "Bekleyen, onaylanan ve ödenen çekimler kullanılabilir bakiyeyi azaltır.",
    "verificationTitle": "Doğrulama",
    "verificationBody": "Onaydan önce ücretli istek alabilirsin. Çekimler doğrulamadan sonra açılır.",
    "formula": "Formül: Kullanılabilir bakiye = DJ kazancı - bekleyen/onaylanan/ödenen çekimler."
  },
  "it": {
    "title": "Come funziona il saldo",
    "leadBefore": "Il tuo",
    "availableBalance": "saldo disponibile",
    "leadAfter": "è il guadagno DJ dopo la commissione Blackline, meno eventuali prelievi in attesa, approvati o già pagati.",
    "grossTitle": "Guadagni lordi",
    "grossBody": "Totale richieste pagate prima delle commissioni.",
    "djTitle": "Guadagni DJ",
    "djBody": "La tua parte dopo le commissioni Blackline.",
    "openTitle": "Prelievi aperti",
    "openBody": "Prelievi in attesa, approvati e pagati riducono il saldo disponibile.",
    "verificationTitle": "Verifica",
    "verificationBody": "Puoi ricevere richieste pagate prima dell’approvazione. I prelievi si sbloccano dopo la verifica.",
    "formula": "Formula: saldo disponibile = guadagni DJ - prelievi in attesa/approvati/pagati."
  },
  "nl": {
    "title": "Hoe je saldo werkt",
    "leadBefore": "Je",
    "availableBalance": "beschikbare saldo",
    "leadAfter": "is je DJ-inkomsten na de Blackline-platformkosten, min openstaande, goedgekeurde of al betaalde opnames.",
    "grossTitle": "Bruto inkomsten",
    "grossBody": "Alle betaalde verzoeken vóór kosten.",
    "djTitle": "DJ inkomsten",
    "djBody": "Jouw deel na Blackline-kosten.",
    "openTitle": "Open opnames",
    "openBody": "Openstaande, goedgekeurde en betaalde opnames verlagen het beschikbare saldo.",
    "verificationTitle": "Verificatie",
    "verificationBody": "Je kunt betaalde verzoeken ontvangen vóór goedkeuring. Opnames worden ontgrendeld na verificatie.",
    "formula": "Formule: beschikbaar saldo = DJ inkomsten - openstaande/goedgekeurde/betaalde opnames."
  },
  "pl": {
    "title": "Jak działa saldo",
    "leadBefore": "Twoje",
    "availableBalance": "dostępne saldo",
    "leadAfter": "to zarobki DJ po opłacie platformy Blackline, minus wypłaty oczekujące, zatwierdzone lub już zapłacone.",
    "grossTitle": "Przychód brutto",
    "grossBody": "Wszystkie płatne prośby przed opłatami.",
    "djTitle": "Zarobki DJ",
    "djBody": "Twoja część po opłatach Blackline.",
    "openTitle": "Otwarte wypłaty",
    "openBody": "Wypłaty oczekujące, zatwierdzone i zapłacone zmniejszają dostępne saldo.",
    "verificationTitle": "Weryfikacja",
    "verificationBody": "Możesz przyjmować płatne prośby przed zatwierdzeniem. Wypłaty odblokowują się po weryfikacji.",
    "formula": "Formuła: dostępne saldo = zarobki DJ - wypłaty oczekujące/zatwierdzone/zapłacone."
  },
  "el": {
    "title": "Πώς λειτουργεί το υπόλοιπο",
    "leadBefore": "Το",
    "availableBalance": "διαθέσιμο υπόλοιπο",
    "leadAfter": "είναι τα κέρδη DJ μετά την προμήθεια Blackline, μείον αναλήψεις σε αναμονή, εγκεκριμένες ή πληρωμένες.",
    "grossTitle": "Μικτά κέρδη",
    "grossBody": "Σύνολο πληρωμένων αιτημάτων πριν τις χρεώσεις.",
    "djTitle": "Κέρδη DJ",
    "djBody": "Το μερίδιό σας μετά τις χρεώσεις Blackline.",
    "openTitle": "Ανοιχτές αναλήψεις",
    "openBody": "Αναλήψεις σε αναμονή, εγκεκριμένες και πληρωμένες μειώνουν το διαθέσιμο υπόλοιπο.",
    "verificationTitle": "Επαλήθευση",
    "verificationBody": "Μπορείτε να δέχεστε πληρωμένα αιτήματα πριν την έγκριση. Οι αναλήψεις ξεκλειδώνουν μετά την επαλήθευση.",
    "formula": "Τύπος: διαθέσιμο υπόλοιπο = κέρδη DJ - αναλήψεις σε αναμονή/εγκεκριμένες/πληρωμένες."
  },
  "uk": {
    "title": "Як працює ваш баланс",
    "leadBefore": "Ваш",
    "availableBalance": "доступний баланс",
    "leadAfter": "— це дохід DJ після комісії платформи Blackline, мінус виведення в очікуванні, схвалені або вже виплачені.",
    "grossTitle": "Валовий дохід",
    "grossBody": "Усі платні запити до комісій.",
    "djTitle": "Дохід DJ",
    "djBody": "Ваша частка після комісій Blackline.",
    "openTitle": "Відкриті виведення",
    "openBody": "Виведення в очікуванні, схвалені та виплачені зменшують доступний баланс.",
    "verificationTitle": "Верифікація",
    "verificationBody": "Ви можете приймати платні запити до схвалення. Виведення відкривається після верифікації.",
    "formula": "Формула: доступний баланс = дохід DJ - виведення в очікуванні/схвалені/виплачені."
  }
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
    "profileTodoMessage": "Add event name, venue, Instagram, bio, or a profile photo.",
    "profileReadyMessage": "Your DJ profile has enough details for guests to recognize your page.",
    "payoutTodoMessage": "Add where you want to receive your money before requesting withdrawals.",
    "payoutReadyMessage": "Your payout account is connected for future withdrawals.",
    "openRequestsMessage": "Tap Go Live when you are ready for guests to start requesting songs.",
    "liveMessage": "Guests can scan your QR code and send paid requests now.",
    "shareQrMessage": "Download your promo kit, print it, or show the QR code on your phone so guests can scan it.",
    "watchQueueMessage": "New paid song requests will appear in your queue automatically.",
    "acceptRequestsMessage": "Review new songs and accept the ones you want to play.",
    "verificationNotStartedMessage": "Submit verification when ready. You can still take requests before approval.",
    "verificationPendingMessage": "You can still take requests now. Withdrawals unlock after Blackline approval.",
    "connectPayoutMessage": "Connect your payout method before requesting your first withdrawal.",
    "withdrawalsReadyMessage": "You can request withdrawals when you have available balance."
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
    "profileTodoMessage": "添加活动名称、场地、Instagram、简介或头像。",
    "profileReadyMessage": "你的DJ资料足够让客人认出你的页面。",
    "payoutTodoMessage": "在申请提现前，添加你想收款的账户。",
    "payoutReadyMessage": "你的收款账户已连接，可用于之后提现。",
    "openRequestsMessage": "准备好让客人点歌时，点击 Go Live。",
    "liveMessage": "客人现在可以扫码并发送付费点歌。",
    "shareQrMessage": "下载宣传套件、打印，或在手机上展示二维码让客人扫码。",
    "watchQueueMessage": "新的付费点歌会自动出现在你的队列中。",
    "acceptRequestsMessage": "查看新歌曲并接受你想播放的请求。",
    "verificationNotStartedMessage": "准备好时提交验证。批准前仍可接受点歌。",
    "verificationPendingMessage": "你现在仍可接受点歌。Blackline 批准后可提现。",
    "connectPayoutMessage": "申请首次提现前，请先连接收款方式。",
    "withdrawalsReadyMessage": "有可用余额时，你可以申请提现。"
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
    "profileTodoMessage": "イベント名、会場、Instagram、自己紹介、プロフィール写真を追加しましょう。",
    "profileReadyMessage": "ゲストがあなたのページだと分かる情報が入っています。",
    "payoutTodoMessage": "出金前にお金を受け取る方法を追加してください。",
    "payoutReadyMessage": "今後の出金用アカウントが接続されています。",
    "openRequestsMessage": "受付を始める準備ができたら Go Live をタップ。",
    "liveMessage": "ゲストはQRを読み取り、有料リクエストを送信できます。",
    "shareQrMessage": "プロモキットをダウンロードして印刷するか、スマホでQRコードを表示しましょう。",
    "watchQueueMessage": "新しい有料リクエストは自動でキューに表示されます。",
    "acceptRequestsMessage": "新しい曲を確認し、再生したい曲を承認してください。",
    "verificationNotStartedMessage": "準備ができたら認証を送信してください。承認前でもリクエストは受けられます。",
    "verificationPendingMessage": "今すぐリクエストは受けられます。Blackline 承認後に出金できます。",
    "connectPayoutMessage": "初回出金前に出金方法を接続してください。",
    "withdrawalsReadyMessage": "利用可能残高があれば出金申請できます。"
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
    "profileTodoMessage": "이벤트명, 장소, Instagram, 소개 또는 프로필 사진을 추가하세요.",
    "profileReadyMessage": "게스트가 내 페이지를 알아볼 수 있는 정보가 있습니다.",
    "payoutTodoMessage": "출금 요청 전에 받을 계정을 추가하세요.",
    "payoutReadyMessage": "향후 출금을 위한 계정이 연결되었습니다.",
    "openRequestsMessage": "곡 요청을 받을 준비가 되면 Go Live를 누르세요.",
    "liveMessage": "게스트가 QR 코드를 스캔하고 유료 요청을 보낼 수 있습니다.",
    "shareQrMessage": "프로모 키트를 다운로드해 인쇄하거나 휴대폰에서 QR 코드를 보여주세요.",
    "watchQueueMessage": "새 유료 요청은 자동으로 대기열에 표시됩니다.",
    "acceptRequestsMessage": "새 곡을 확인하고 재생할 곡을 수락하세요.",
    "verificationNotStartedMessage": "준비되면 인증을 제출하세요. 승인 전에도 요청은 받을 수 있습니다.",
    "verificationPendingMessage": "지금도 요청을 받을 수 있습니다. Blackline 승인 후 출금이 열립니다.",
    "connectPayoutMessage": "첫 출금 전에 정산 방법을 연결하세요.",
    "withdrawalsReadyMessage": "사용 가능 잔액이 있으면 출금을 요청할 수 있습니다."
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
    "profileTodoMessage": "Tambahkan nama acara, venue, Instagram, bio, atau foto profil.",
    "profileReadyMessage": "Profil DJ Anda cukup jelas untuk dikenali tamu.",
    "payoutTodoMessage": "Tambahkan tujuan penerimaan uang sebelum menarik saldo.",
    "payoutReadyMessage": "Akun payout Anda sudah terhubung untuk penarikan nanti.",
    "openRequestsMessage": "Tap Go Live saat siap menerima request lagu.",
    "liveMessage": "Tamu bisa scan QR dan mengirim request berbayar sekarang.",
    "shareQrMessage": "Download promo kit, cetak, atau tampilkan QR di ponsel.",
    "watchQueueMessage": "Request berbayar baru muncul otomatis di antrean.",
    "acceptRequestsMessage": "Periksa lagu baru dan terima yang ingin dimainkan.",
    "verificationNotStartedMessage": "Kirim verifikasi saat siap. Request tetap bisa diterima sebelum disetujui.",
    "verificationPendingMessage": "Anda tetap bisa menerima request. Penarikan terbuka setelah disetujui Blackline.",
    "connectPayoutMessage": "Hubungkan metode payout sebelum penarikan pertama.",
    "withdrawalsReadyMessage": "Anda bisa menarik saldo saat ada saldo tersedia."
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
    "profileTodoMessage": "Tambah nama acara, venue, Instagram, bio atau gambar profil.",
    "profileReadyMessage": "Profil DJ anda cukup jelas untuk dikenali tetamu.",
    "payoutTodoMessage": "Tambah tempat menerima wang sebelum meminta pengeluaran.",
    "payoutReadyMessage": "Akaun payout anda sudah disambungkan untuk pengeluaran nanti.",
    "openRequestsMessage": "Tekan Go Live apabila sedia menerima permintaan lagu.",
    "liveMessage": "Tetamu boleh imbas QR dan hantar permintaan berbayar sekarang.",
    "shareQrMessage": "Muat turun promo kit, cetak, atau tunjuk kod QR pada telefon.",
    "watchQueueMessage": "Permintaan berbayar baru akan muncul secara automatik.",
    "acceptRequestsMessage": "Semak lagu baru dan terima yang mahu dimainkan.",
    "verificationNotStartedMessage": "Hantar verifikasi apabila sedia. Permintaan masih boleh diterima sebelum kelulusan.",
    "verificationPendingMessage": "Anda masih boleh menerima permintaan. Pengeluaran dibuka selepas diluluskan Blackline.",
    "connectPayoutMessage": "Sambungkan kaedah payout sebelum pengeluaran pertama.",
    "withdrawalsReadyMessage": "Anda boleh meminta pengeluaran apabila ada baki tersedia."
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
    "profileTodoMessage": "Thêm tên sự kiện, địa điểm, Instagram, bio hoặc ảnh đại diện.",
    "profileReadyMessage": "Hồ sơ DJ đủ thông tin để khách nhận ra trang của bạn.",
    "payoutTodoMessage": "Thêm nơi bạn muốn nhận tiền trước khi rút.",
    "payoutReadyMessage": "Tài khoản nhận tiền đã kết nối cho các lần rút sau.",
    "openRequestsMessage": "Nhấn Go Live khi bạn sẵn sàng nhận yêu cầu bài hát.",
    "liveMessage": "Khách có thể quét QR và gửi yêu cầu trả phí ngay.",
    "shareQrMessage": "Tải promo kit, in ra hoặc hiển thị QR trên điện thoại.",
    "watchQueueMessage": "Yêu cầu trả phí mới sẽ tự hiện trong hàng đợi.",
    "acceptRequestsMessage": "Xem bài hát mới và nhận bài bạn muốn phát.",
    "verificationNotStartedMessage": "Gửi xác minh khi sẵn sàng. Trước khi duyệt vẫn nhận yêu cầu được.",
    "verificationPendingMessage": "Bạn vẫn có thể nhận yêu cầu. Rút tiền mở sau khi Blackline duyệt.",
    "connectPayoutMessage": "Kết nối phương thức nhận tiền trước lần rút đầu tiên.",
    "withdrawalsReadyMessage": "Bạn có thể rút khi có số dư khả dụng."
  },
  "tl": {
    "eyebrow": "Quick Setup",
    "heading": "Ano ang gagawin ngayon",
    "subtitle": "Tapusin ang mga step na ito para makatanggap ng requests at ma-unlock ang withdrawals.",
    "profileReadyTitle": "Naka-set na ang profile",
    "profileTodoTitle": "I-set up ang DJ profile",
    "profileReadyMessage": "May sapat na detalye ang DJ profile mo para makilala ng guests ang page mo.",
    "profileTodoMessage": "Magdagdag ng event name, venue, Instagram, bio, o profile photo.",
    "ready": "Ready",
    "startHere": "Magsimula dito",
    "payoutReadyTitle": "Nadagdag na ang payout method",
    "payoutTodoTitle": "Magdagdag ng payout method",
    "payoutReadyMessage": "Connected na ang payout account mo para sa future withdrawals.",
    "payoutTodoMessage": "Ilagay kung saan mo gustong matanggap ang pera bago mag-withdraw.",
    "connected": "Connected",
    "needed": "Kailangan",
    "liveTitle": "Bukas na ang requests",
    "openRequestsTitle": "Buksan ang requests",
    "liveMessage": "Pwede nang mag-scan ang guests at magpadala ng paid requests.",
    "openRequestsMessage": "I-tap ang Go Live kapag ready ka nang tumanggap ng song requests.",
    "liveNow": "Live now",
    "goLive": "Go live",
    "shareQrTitle": "I-share ang QR code",
    "shareQrMessage": "I-download ang promo kit, i-print, o ipakita ang QR code sa phone para ma-scan ng guests.",
    "share": "Share",
    "acceptRequestsTitle": "Tanggapin ang pending requests",
    "watchQueueTitle": "Bantayan ang request queue",
    "acceptRequestsMessage": "Tingnan ang bagong songs at tanggapin ang gusto mong i-play.",
    "watchQueueMessage": "Lalabas automatically sa queue ang bagong paid song requests.",
    "actionNeeded": "Kailangan aksyon",
    "queue": "Queue",
    "withdrawalsUnlockedTitle": "Unlocked na ang withdrawals",
    "verificationTitle": "Verification ang mag-u-unlock ng withdrawals",
    "withdrawalsReadyMessage": "Pwede kang mag-request ng withdrawal kapag may available balance.",
    "connectPayoutMessage": "I-connect ang payout method bago ang first withdrawal.",
    "verificationPendingMessage": "Pwede ka pa ring tumanggap ng requests ngayon. Unlock ang withdrawals after Blackline approval.",
    "verificationNotStartedMessage": "Submit verification kapag ready. Pwede pa ring tumanggap ng requests bago ma-approve.",
    "unlocked": "Unlocked",
    "requestsAllowed": "Pwede ang requests",
    "verificationNote": "Hindi pinipigilan ng verification ang requests. Pwede pa ring mag-live at tumanggap ng paid requests habang pending ang approval. Unlock ang withdrawals pagkatapos ma-approve ng Blackline ang account."
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
    "profileTodoMessage": "Agrega nombre del evento, lugar, Instagram, bio o foto de perfil.",
    "profileReadyMessage": "Tu perfil tiene suficientes datos para que los invitados reconozcan tu página.",
    "payoutTodoMessage": "Agrega dónde quieres recibir tu dinero antes de solicitar retiros.",
    "payoutReadyMessage": "Tu cuenta de pago está conectada para futuros retiros.",
    "openRequestsMessage": "Toca Go Live cuando estés listo para recibir canciones.",
    "liveMessage": "Los invitados ya pueden escanear tu QR y enviar solicitudes pagadas.",
    "shareQrMessage": "Descarga tu promo kit, imprímelo o muestra el QR en tu teléfono.",
    "watchQueueMessage": "Las nuevas solicitudes pagadas aparecerán automáticamente en tu cola.",
    "acceptRequestsMessage": "Revisa nuevas canciones y acepta las que quieres tocar.",
    "verificationNotStartedMessage": "Envía la verificación cuando estés listo. Puedes recibir solicitudes antes de aprobarse.",
    "verificationPendingMessage": "Puedes recibir solicitudes ahora. Los retiros se desbloquean tras aprobación de Blackline.",
    "connectPayoutMessage": "Conecta tu método de pago antes del primer retiro.",
    "withdrawalsReadyMessage": "Puedes solicitar retiros cuando tengas saldo disponible."
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
    "profileTodoMessage": "Ajoutez le nom de l’événement, le lieu, Instagram, bio ou photo de profil.",
    "profileReadyMessage": "Votre profil contient assez d’informations pour que les invités reconnaissent votre page.",
    "payoutTodoMessage": "Ajoutez où recevoir votre argent avant de demander un retrait.",
    "payoutReadyMessage": "Votre compte de paiement est connecté pour les futurs retraits.",
    "openRequestsMessage": "Touchez Go Live quand vous êtes prêt à recevoir des demandes.",
    "liveMessage": "Les invités peuvent scanner le QR et envoyer des demandes payantes.",
    "shareQrMessage": "Téléchargez le kit promo, imprimez-le ou affichez le QR sur votre téléphone.",
    "watchQueueMessage": "Les nouvelles demandes payantes apparaîtront automatiquement dans la file.",
    "acceptRequestsMessage": "Vérifiez les nouveaux morceaux et acceptez ceux que vous voulez jouer.",
    "verificationNotStartedMessage": "Soumettez la vérification quand vous êtes prêt. Les demandes restent possibles avant approbation.",
    "verificationPendingMessage": "Vous pouvez recevoir des demandes maintenant. Les retraits s’ouvrent après approbation Blackline.",
    "connectPayoutMessage": "Connectez votre méthode de paiement avant le premier retrait.",
    "withdrawalsReadyMessage": "Vous pouvez demander un retrait avec un solde disponible."
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
    "profileTodoMessage": "Füge Eventname, Venue, Instagram, Bio oder Profilfoto hinzu.",
    "profileReadyMessage": "Dein Profil hat genug Infos, damit Gäste deine Seite erkennen.",
    "payoutTodoMessage": "Füge hinzu, wohin du dein Geld erhalten möchtest.",
    "payoutReadyMessage": "Dein Auszahlungskonto ist für spätere Auszahlungen verbunden.",
    "openRequestsMessage": "Tippe Go Live, wenn du Song-Anfragen annehmen möchtest.",
    "liveMessage": "Gäste können deinen QR scannen und bezahlte Anfragen senden.",
    "shareQrMessage": "Lade dein Promo-Kit herunter, drucke es oder zeige den QR am Handy.",
    "watchQueueMessage": "Neue bezahlte Anfragen erscheinen automatisch in deiner Queue.",
    "acceptRequestsMessage": "Prüfe neue Songs und akzeptiere, was du spielen willst.",
    "verificationNotStartedMessage": "Sende die Verifizierung, wenn du bereit bist. Anfragen sind vorher möglich.",
    "verificationPendingMessage": "Du kannst jetzt Anfragen annehmen. Auszahlungen nach Blackline-Freigabe.",
    "connectPayoutMessage": "Verbinde deine Auszahlungsmethode vor der ersten Auszahlung.",
    "withdrawalsReadyMessage": "Du kannst auszahlen, wenn Guthaben verfügbar ist."
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
    "profileTodoMessage": "Добавьте название события, место, Instagram, био или фото профиля.",
    "profileReadyMessage": "В профиле достаточно данных, чтобы гости узнали вашу страницу.",
    "payoutTodoMessage": "Добавьте, куда получать деньги перед выводом.",
    "payoutReadyMessage": "Счет выплат подключен для будущих выводов.",
    "openRequestsMessage": "Нажмите Go Live, когда готовы принимать песни.",
    "liveMessage": "Гости могут сканировать QR и отправлять платные заявки.",
    "shareQrMessage": "Скачайте промо-кит, распечатайте или покажите QR на телефоне.",
    "watchQueueMessage": "Новые платные заявки появятся в очереди автоматически.",
    "acceptRequestsMessage": "Проверьте новые песни и примите те, что хотите сыграть.",
    "verificationNotStartedMessage": "Отправьте проверку, когда будете готовы. Заявки можно принимать до одобрения.",
    "verificationPendingMessage": "Вы уже можете принимать заявки. Выводы откроются после одобрения Blackline.",
    "connectPayoutMessage": "Подключите способ выплат перед первым выводом.",
    "withdrawalsReadyMessage": "Вы можете вывести средства при доступном балансе."
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
    "profileTodoMessage": "Aggiungi nome evento, location, Instagram, bio o foto profilo.",
    "profileReadyMessage": "Il tuo profilo ha abbastanza dettagli per essere riconosciuto dagli ospiti.",
    "payoutTodoMessage": "Aggiungi dove vuoi ricevere il denaro prima di prelevare.",
    "payoutReadyMessage": "Il tuo account payout è collegato per futuri prelievi.",
    "openRequestsMessage": "Tocca Go Live quando sei pronto a ricevere canzoni.",
    "liveMessage": "Gli ospiti possono scansionare il QR e inviare richieste pagate.",
    "shareQrMessage": "Scarica il promo kit, stampalo o mostra il QR sul telefono.",
    "watchQueueMessage": "Le nuove richieste pagate appariranno automaticamente in coda.",
    "acceptRequestsMessage": "Controlla nuove canzoni e accetta quelle da suonare.",
    "verificationNotStartedMessage": "Invia la verifica quando sei pronto. Puoi ricevere richieste prima dell’approvazione.",
    "verificationPendingMessage": "Puoi ricevere richieste ora. I prelievi si sbloccano dopo approvazione Blackline.",
    "connectPayoutMessage": "Collega il payout prima del primo prelievo.",
    "withdrawalsReadyMessage": "Puoi richiedere prelievi quando hai saldo disponibile."
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
    "profileTodoMessage": "Voeg eventnaam, locatie, Instagram, bio of profielfoto toe.",
    "profileReadyMessage": "Je profiel heeft genoeg details zodat gasten je pagina herkennen.",
    "payoutTodoMessage": "Voeg toe waar je geld wilt ontvangen vóór je opnames aanvraagt.",
    "payoutReadyMessage": "Je uitbetaalaccount is gekoppeld voor toekomstige opnames.",
    "openRequestsMessage": "Tik op Go Live wanneer je klaar bent voor song requests.",
    "liveMessage": "Gasten kunnen je QR scannen en betaalde verzoeken sturen.",
    "shareQrMessage": "Download je promo kit, print hem of toon de QR op je telefoon.",
    "watchQueueMessage": "Nieuwe betaalde verzoeken verschijnen automatisch in je queue.",
    "acceptRequestsMessage": "Controleer nieuwe nummers en accepteer wat je wilt draaien.",
    "verificationNotStartedMessage": "Dien verificatie in wanneer je klaar bent. Verzoeken kunnen vóór goedkeuring.",
    "verificationPendingMessage": "Je kunt nu al verzoeken ontvangen. Opnames worden ontgrendeld na Blackline-goedkeuring.",
    "connectPayoutMessage": "Koppel je uitbetaalmethode vóór je eerste opname.",
    "withdrawalsReadyMessage": "Je kunt opnemen wanneer je beschikbaar saldo hebt."
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
    "profileTodoMessage": "Dodaj nazwę wydarzenia, miejsce, Instagram, bio lub zdjęcie profilu.",
    "profileReadyMessage": "Twój profil ma wystarczające dane, by goście rozpoznali stronę.",
    "payoutTodoMessage": "Dodaj, gdzie chcesz otrzymywać pieniądze przed wypłatą.",
    "payoutReadyMessage": "Konto wypłat jest połączone na przyszłe wypłaty.",
    "openRequestsMessage": "Kliknij Go Live, gdy chcesz przyjmować utwory.",
    "liveMessage": "Goście mogą skanować QR i wysyłać płatne prośby.",
    "shareQrMessage": "Pobierz promo kit, wydrukuj lub pokaż QR na telefonie.",
    "watchQueueMessage": "Nowe płatne prośby pojawią się automatycznie w kolejce.",
    "acceptRequestsMessage": "Sprawdź nowe utwory i zaakceptuj te, które chcesz zagrać.",
    "verificationNotStartedMessage": "Wyślij weryfikację, gdy będziesz gotowy. Prośby są możliwe przed akceptacją.",
    "verificationPendingMessage": "Możesz już przyjmować prośby. Wypłaty po akceptacji Blackline.",
    "connectPayoutMessage": "Połącz metodę wypłaty przed pierwszą wypłatą.",
    "withdrawalsReadyMessage": "Możesz wypłacać, gdy masz dostępne saldo."
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
  const [isEarningsExpanded, setIsEarningsExpanded] = useState(false);
  const [isBalanceGuideExpanded, setIsBalanceGuideExpanded] = useState(false);
  const [isPaymentAuditExpanded, setIsPaymentAuditExpanded] = useState(false);
  const [isProfileDetailsExpanded, setIsProfileDetailsExpanded] = useState(false);
  const [isPayoutSetupExpanded, setIsPayoutSetupExpanded] = useState(false);

  const [language, setLanguage] = useState<Language>("en");

  const t = translations[language];
  const quickSetupText = quickSetupTranslations[language] || quickSetupTranslations.en;
  const dashboardAlertText =
    dashboardAlertTranslations[language] || dashboardAlertTranslations.en;
  const adminUiText = adminUiTranslations[language] || adminUiTranslations.en;
  const balanceText = balanceExplainerTranslations[language] || balanceExplainerTranslations.en;

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


  function getPayoutStatusLabel(status?: string | null) {
    if (!status || status === "not_connected" || status === "Not Connected") {
      return adminUiText.notConnected;
    }

    if (status === "Active") return adminUiText.active;
    if (status === "Pending Verification") return adminUiText.pendingVerificationStatus;
    if (status === "rejected") return adminUiText.rejectedStatus;

    return status;
  }

  function getAdminStatusLabel(status?: string | null) {
    if (!status) return adminUiText.unknownStatus;

    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "pending") return adminUiText.pendingStatus;
    if (normalizedStatus === "approved") return adminUiText.approvedStatus;
    if (normalizedStatus === "paid") return adminUiText.paidStatus;
    if (normalizedStatus === "rejected") return adminUiText.rejectedStatus;
    if (normalizedStatus === "active") return adminUiText.active;
    if (normalizedStatus === "not_started") return adminUiText.notStartedStatus;

    return status
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
  const [isQuickSetupExpanded, setIsQuickSetupExpanded] = useState(false);
  const [showAllPlayedHistory, setShowAllPlayedHistory] = useState(false);
  const [isQrCodeExpanded, setIsQrCodeExpanded] = useState(false);
  const [nowPlayingClockTick, setNowPlayingClockTick] = useState(0);
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
    if (target === "qr") {
      setIsQrCodeExpanded(true);
    }

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
        alert(result.error || adminUiText.failedConnectPayout);
        setConnectingPayout(false);
        return;
      }

      setDj(result.dj as DJ);
      setPayoutStatus("Active");
      setPaystackRecipientCode(result.recipientCode || "");
      setConnectingPayout(false);

      alert(`${adminUiText.payoutConnectedAlert} ${adminUiText.recipientCode}: ${result.recipientCode}`);
    } catch (error) {
      console.error("CONNECT PAYOUT ERROR:", error);
      alert(adminUiText.failedConnectPayout);
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

  async function finishExpiredNowPlaying(djId: number) {
    const cutoffIso = getNowPlayingCutoffIso();

    const { error: expiredPlayedError } = await supabase
      .from("requests")
      .update({ status: "finished" })
      .eq("dj_id", djId)
      .eq("status", "played")
      .lt("played_at", cutoffIso);

    if (expiredPlayedError) {
      console.error("EXPIRE NOW PLAYING ERROR:", expiredPlayedError);
    }

    const { error: missingPlayedAtError } = await supabase
      .from("requests")
      .update({ status: "finished" })
      .eq("dj_id", djId)
      .eq("status", "played")
      .is("played_at", null);

    if (missingPlayedAtError) {
      console.error(
        "EXPIRE NOW PLAYING MISSING PLAYED_AT ERROR:",
        missingPlayedAtError,
      );
    }
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

      await finishExpiredNowPlaying(activeDj.id);
      await fetchDashboardData(activeDj);

      if (scrollBeforeRefresh > 0) {
        restoreScrollPosition(scrollBeforeRefresh);
      }
    };

    refreshDashboardIfVisible();

    const refreshInterval = setInterval(() => {
      refreshDashboardIfVisible();
    }, 10000);

    const nowPlayingClockInterval = setInterval(() => {
      setNowPlayingClockTick((currentTick) => currentTick + 1);
    }, 1000);

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
      clearInterval(nowPlayingClockInterval);
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

    if (status === "played" && dj?.id) {
      const { error: clearNowPlayingError } = await supabase
        .from("requests")
        .update({ status: "finished" })
        .eq("dj_id", dj.id)
        .eq("status", "played")
        .neq("id", id);

      if (clearNowPlayingError) {
        console.error("CLEAR NOW PLAYING ERROR:", clearNowPlayingError);
        alert(clearNowPlayingError.message);
        setActionLoadingId(null);
        restoreScrollPosition(currentScrollY);
        return;
      }
    }

    const updatePayload =
      status === "played"
        ? { status, played_at: new Date().toISOString() }
        : { status };

    const { error } = await supabase
      .from("requests")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("UPDATE REQUEST STATUS ERROR:", error);
      alert(error.message);
      setActionLoadingId(null);
      restoreScrollPosition(currentScrollY);
      return;
    }

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
  async function triggerWithdrawalRequestAlert(withdrawalId: number) {
    try {
      const response = await fetch("/api/blackline-admin/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: "withdrawal",
          id: withdrawalId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("WITHDRAWAL ALERT FAILED:", errorText);
      }
    } catch (error) {
      console.error("WITHDRAWAL ALERT ERROR:", error);
    }
  }
  async function requestWithdrawal() {
    if (!dj) return;

    if (hasOpenWithdrawal) {
      alert(adminUiText.alreadyOpenWithdrawalAlert);
      return;
    }

    if (verificationStatus !== "verified") {
      alert(adminUiText.verificationRequiredBeforeWithdrawal);
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
      alert(adminUiText.connectPayoutBeforeWithdrawal);
      return;
    }

    const amount = Number(withdrawAmount);

    if (!amount || amount <= 0) {
      alert(adminUiText.enterValidWithdrawalAmount);
      return;
    }

    const availableBalance = netEarnings - totalWithdrawals;

    if (amount > availableBalance) {
      alert(adminUiText.insufficientAvailableBalance);
      return;
    }

    const currentScrollY = getCurrentScrollY();

    setWithdrawLoading(true);

    const { data: createdWithdrawal, error } = await supabase
    .from("withdrawals")
    .insert([
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
    ])
    .select("id")
    .single();

    if (error) {
      console.error("WITHDRAWAL ERROR:", error);
      alert(error.message || JSON.stringify(error));
      setWithdrawLoading(false);
      return;
    }

    if (createdWithdrawal?.id) {
      await triggerWithdrawalRequestAlert(createdWithdrawal.id);
    } else {
      console.error("WITHDRAWAL ALERT SKIPPED: Missing withdrawal id");
    }

    alert("Withdrawal request submitted");

    setWithdrawAmount("");

    await fetchDashboardData();

    setWithdrawLoading(false);
    restoreScrollPosition(currentScrollY);
  }

  const grouped = useMemo(() => {
    void nowPlayingClockTick;

    const activeNowPlaying = requests.filter(isNowPlayingStillActive);
    const finishedHistory = requests.filter(
      (request) => request.status === "finished" || isExpiredNowPlaying(request),
    );

    return {
      pending: requests.filter((r) => r.status === "pending"),
      accepted: requests.filter((r) => r.status === "accepted"),
      rejected: requests.filter((r) => r.status === "rejected"),
      played: activeNowPlaying,
      finished: finishedHistory,
    };
  }, [requests, nowPlayingClockTick]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPlayedHistory = grouped.finished
    .filter((request) => getPlayedHistoryTime(request) >= thirtyDaysAgo.getTime())
    .sort((firstRequest, secondRequest) =>
      getPlayedHistoryTime(secondRequest) - getPlayedHistoryTime(firstRequest),
    );

  const visiblePlayedHistory = showAllPlayedHistory
    ? recentPlayedHistory
    : recentPlayedHistory.slice(0, 1);

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

  const latestPayments = payments.slice(0, 10);

  async function copyPaymentReference(reference?: string | null) {
    if (!reference) {
      alert(adminUiText.noPaymentReferenceFound);
      return;
    }

    try {
      await navigator.clipboard.writeText(reference);
      alert(`${adminUiText.paymentReferenceCopied}: ${reference}`);
    } catch (error) {
      console.error("COPY PAYMENT REFERENCE ERROR:", error);
      alert(reference);
    }
  }

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
    {
      number: "1",
      icon: hasProfileSetup ? "✅" : "🎤",
      title: hasProfileSetup ? quickSetupText.profileReadyTitle : quickSetupText.profileTodoTitle,
      message: hasProfileSetup ? quickSetupText.profileReadyMessage : quickSetupText.profileTodoMessage,
      status: hasProfileSetup ? quickSetupText.ready : quickSetupText.startHere,
      className: hasProfileSetup
        ? "border-green-500/40 bg-green-500/10"
        : "border-purple-500/50 bg-purple-500/10",
      target: "profile" as const,
    },
    {
      number: "2",
      icon: hasPayoutSetup ? "✅" : "💸",
      title: hasPayoutSetup ? quickSetupText.payoutReadyTitle : quickSetupText.payoutTodoTitle,
      message: hasPayoutSetup ? quickSetupText.payoutReadyMessage : quickSetupText.payoutTodoMessage,
      status: hasPayoutSetup ? quickSetupText.connected : quickSetupText.needed,
      className: hasPayoutSetup
        ? "border-green-500/40 bg-green-500/10"
        : "border-cyan-500/40 bg-cyan-500/10",
      target: "payout" as const,
    },
    {
      number: "3",
      icon: dj?.is_live ? "🟢" : "🔴",
      title: dj?.is_live ? quickSetupText.liveTitle : quickSetupText.openRequestsTitle,
      message: dj?.is_live ? quickSetupText.liveMessage : quickSetupText.openRequestsMessage,
      status: dj?.is_live ? quickSetupText.liveNow : quickSetupText.goLive,
      className: dj?.is_live
        ? "border-green-500/40 bg-green-500/10"
        : "border-green-500/50 bg-green-500/10",
      target: "live" as const,
    },
    {
      number: "4",
      icon: "📲",
      title: quickSetupText.shareQrTitle,
      message: quickSetupText.shareQrMessage,
      status: quickSetupText.share,
      className: "border-purple-500/40 bg-purple-500/10",
      target: "qr" as const,
    },
    {
      number: "5",
      icon: grouped.pending.length > 0 ? "🎵" : "🎧",
      title: grouped.pending.length > 0 ? `${quickSetupText.acceptRequestsTitle} (${grouped.pending.length})` : quickSetupText.watchQueueTitle,
      message: grouped.pending.length > 0 ? quickSetupText.acceptRequestsMessage : quickSetupText.watchQueueMessage,
      status: grouped.pending.length > 0 ? quickSetupText.actionNeeded : quickSetupText.queue,
      className: grouped.pending.length > 0
        ? "border-yellow-400 bg-yellow-500/10 shadow-[0_0_35px_rgba(250,204,21,0.35)] animate-pulse"
        : "border-zinc-700 bg-black/30",
      attention: grouped.pending.length > 0,
      target: "queue" as const,
    },
    {
      number: "6",
      icon: isVerificationApproved ? "✅" : "🛡️",
      title: isVerificationApproved ? quickSetupText.withdrawalsUnlockedTitle : quickSetupText.verificationTitle,
      message: isVerificationApproved
        ? hasPayoutSetup
          ? quickSetupText.withdrawalsReadyMessage
          : quickSetupText.connectPayoutMessage
        : isVerificationPending
          ? quickSetupText.verificationPendingMessage
          : quickSetupText.verificationNotStartedMessage,
      status: isVerificationApproved ? quickSetupText.unlocked : quickSetupText.requestsAllowed,
      className: isVerificationApproved
        ? "border-green-500/40 bg-green-500/10"
        : "border-yellow-500/40 bg-yellow-500/10",
      target: "withdrawals" as const,
    },
  ];

  const quickSetupCompletedCount = [
    hasProfileSetup,
    hasPayoutSetup,
    Boolean(dj?.is_live),
    true,
    grouped.pending.length === 0,
    isVerificationApproved,
  ].filter(Boolean).length;

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
    if (!status) return adminUiText.updatedStatus;

    return getAdminStatusLabel(status);
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
        label: adminUiText.pendingStatus,
        className: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
      };
    }

    if (status === "approved") {
      return {
        label: adminUiText.approvedStatus,
        className: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      };
    }

    if (status === "paid") {
      return {
        label: adminUiText.paidStatus,
        className: "bg-green-500/10 border-green-500/30 text-green-400",
      };
    }

    if (status === "rejected") {
      return {
        label: adminUiText.rejectedStatus,
        className: "bg-red-500/10 border-red-500/30 text-red-400",
      };
    }

    return {
      label: status || adminUiText.unknownStatus,
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
      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-10">
        <div className="text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-purple-500 leading-tight">
            <span className="md:hidden">
              {dj.stage_name?.toUpperCase()} Dashboard
            </span>

            <span className="hidden md:inline">
              {dj.stage_name?.toUpperCase()} Dashboard
            </span>
          </h1>

          <p className="text-zinc-400 mt-2 md:mt-3 text-sm md:text-lg">
            {t.adminSubtitle}
          </p>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3">
          <button
            onClick={handleLogout}
            className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 md:px-5 rounded-xl text-sm font-semibold"
          >
            {t.logout}
          </button>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-black border border-zinc-700 rounded-xl px-3 py-3 md:px-4 md:py-2 text-sm min-w-0 max-w-[220px]"
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
        </div>
      </div>

      {grouped.pending.length > 0 && (
        <button
          type="button"
          onClick={() => scrollToQuickSetupTarget("queue")}
          className="w-full mb-6 md:mb-8 text-left relative overflow-hidden bg-gradient-to-r from-yellow-500/20 via-zinc-900 to-yellow-500/10 border border-yellow-400/70 rounded-3xl p-4 md:p-5 shadow-[0_0_35px_rgba(250,204,21,0.25)] animate-pulse"
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-yellow-400/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-black flex items-center justify-center text-2xl font-black shrink-0 shadow-[0_0_25px_rgba(250,204,21,0.45)]">
              🚨
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.25em] text-yellow-300 font-black">
                {dashboardAlertText.actionNeeded}
              </p>

              <h2 className="text-xl md:text-2xl font-black text-white mt-1 leading-tight">
                {grouped.pending.length}{" "}
                {grouped.pending.length === 1
                  ? dashboardAlertText.pendingRequestSingular
                  : dashboardAlertText.pendingRequestPlural}{" "}
                {dashboardAlertText.needReview}
              </h2>

              <p className="text-sm text-zinc-300 mt-1">
                {dashboardAlertText.tapToQueue}
              </p>
            </div>

            <div className="hidden sm:block bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-black">
              {dashboardAlertText.reviewNow}
            </div>
          </div>
        </button>
      )}

      <div className="bg-zinc-900 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.16)] rounded-3xl p-4 md:p-6 mb-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
          <div>
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

          <div className="flex items-center gap-3">
            <span className="bg-black/40 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              {quickSetupCompletedCount}/6 {dashboardAlertText.done}
            </span>

            <button
              type="button"
              onClick={() => setIsQuickSetupExpanded((current) => !current)}
              className="md:hidden bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-full text-sm font-black transition"
            >
              {isQuickSetupExpanded
                ? dashboardAlertText.hideSteps
                : dashboardAlertText.showSteps}
            </button>
          </div>
        </div>

        <div
          className={`${
            isQuickSetupExpanded ? "grid" : "hidden md:grid"
          } md:grid-cols-2 xl:grid-cols-3 gap-3`}
        >
          {quickSetupActions.map((action) => (
            <button
              key={action.number}
              type="button"
              onClick={() => scrollToQuickSetupTarget(action.target)}
              className={`relative overflow-hidden text-left border rounded-2xl p-4 transition hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-purple-500/70 ${action.className}`}
            >
              {action.attention && (
                <div className="absolute inset-0 pointer-events-none rounded-2xl bg-yellow-400/10 animate-ping" />
              )}

              {action.attention && (
                <div className="absolute right-3 top-3 h-3 w-3 rounded-full bg-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.95)] animate-ping" />
              )}

              <div className="relative z-10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center shrink-0 font-black text-purple-300">
                  {action.number}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{action.icon}</span>
                      <h3 className="text-white font-black">{action.title}</h3>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase tracking-widest rounded-full px-2 py-1 ${
                        action.attention
                          ? "bg-yellow-400 text-black border border-yellow-200 shadow-[0_0_18px_rgba(250,204,21,0.55)] animate-bounce"
                          : "bg-black/30 border border-white/10 text-zinc-300"
                      }`}
                    >
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
          <div
            className={`${
              isQuickSetupExpanded ? "block" : "hidden md:block"
            } mt-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-2xl p-4 text-sm leading-relaxed`}
          >
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <button
                disabled={actionLoadingId === request.id}
                onClick={() => updateStatus(request.id, "accepted")}
                className="w-full bg-green-600 hover:bg-green-700 px-5 py-4 md:py-3 rounded-xl text-lg md:text-base font-bold disabled:bg-zinc-700"
              >
                {t.accept}
              </button>

              <button
                disabled={actionLoadingId === request.id}
                onClick={() => updateStatus(request.id, "rejected")}
                className="w-full bg-red-600 hover:bg-red-700 px-5 py-4 md:py-3 rounded-xl text-lg md:text-base font-bold disabled:bg-zinc-700"
              >
                {t.reject}
              </button>
            </div>
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
            <div className="w-full">
              <button
                disabled={actionLoadingId === request.id}
                onClick={() => updateStatus(request.id, "played")}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 px-5 py-4 md:py-3 rounded-xl text-lg md:text-base font-bold disabled:bg-zinc-700"
              >
                {t.markPlayed}
              </button>

              <div className="grid grid-cols-3 gap-3 mt-3 md:flex md:flex-wrap">
                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => moveRequest(request.id, "up")}
                  className="bg-zinc-700 hover:bg-zinc-600 px-4 py-3 md:py-2 rounded-xl disabled:bg-zinc-800"
                >
                  {t.up}
                </button>

                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => moveRequest(request.id, "down")}
                  className="bg-zinc-700 hover:bg-zinc-600 px-4 py-3 md:py-2 rounded-xl disabled:bg-zinc-800"
                >
                  {t.down}
                </button>

                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => deleteRequest(request.id)}
                  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 md:py-2 rounded-xl text-zinc-300 disabled:bg-zinc-900"
                >
                  {t.delete}
                </button>
              </div>
            </div>
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
          expiresInLabel={dashboardAlertText.expiresIn}
          buttons={(request) => (
            <button
              disabled={actionLoadingId === request.id}
              onClick={() => updateStatus(request.id, "finished")}
              className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 px-5 py-4 md:py-3 rounded-xl text-lg md:text-base font-bold disabled:bg-zinc-800"
            >
              {t.clearNowPlaying}
            </button>
          )}
        />

        <div>
          <RequestColumn
            title={`${t.playedHistory} (${recentPlayedHistory.length})`}
            titleColor="text-blue-400"
            requests={visiblePlayedHistory}
            borderColor="border-blue-700"
            actionLoadingId={actionLoadingId}
            t={t}
            showPlayedAt
            compactCards
            playedAtLabel={dashboardAlertText.playedAt}
            buttons={() => null}
          />

          {recentPlayedHistory.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllPlayedHistory((current) => !current)}
              className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-5 py-4 rounded-xl font-bold text-zinc-200 transition"
            >
              {showAllPlayedHistory
                ? dashboardAlertText.showLessHistory
                : dashboardAlertText.showAllHistory}
            </button>
          )}

          <p className="mt-3 text-xs md:text-sm text-zinc-500 leading-relaxed">
            {dashboardAlertText.playedHistoryRetentionNote}
          </p>
        </div>
      </div>

      <div ref={qrCodeSectionRef} className="scroll-mt-6 mb-12">
        <button
          type="button"
          onClick={() => setIsQrCodeExpanded((current) => !current)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5 md:p-7 text-left hover:border-purple-500/60 transition"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-400 font-black">
                {dashboardAlertText.qrCode}
              </p>

              <h2 className="text-2xl md:text-4xl font-black text-purple-400 mt-1">
                {quickSetupText.shareQrTitle}
              </h2>

              <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                {quickSetupText.shareQrMessage}
              </p>
            </div>

            <span className="bg-purple-600 px-5 py-3 rounded-full text-sm text-white font-black text-center">
              {isQrCodeExpanded ? dashboardAlertText.hideQr : dashboardAlertText.showQr}
            </span>
          </div>
        </button>

        {isQrCodeExpanded && (
          <div className="mt-4">
            <QRCodeBox stageName={dj.stage_name} language={language} t={t} />
          </div>
        )}
      </div>

      <div ref={profileSectionRef} className="scroll-mt-6 mb-10">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 md:p-7">
          <button
            type="button"
            onClick={() => setIsProfileDetailsExpanded((current) => !current)}
            className="w-full text-left"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="DJ Profile"
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-purple-600 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center text-zinc-500 text-xs flex-shrink-0">
                    {t.noImage}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-purple-400 font-black">
                    {quickSetupText.profileReadyTitle}
                  </p>

                  <h2 className="text-2xl md:text-4xl font-black text-white mt-1">
                    {t.djProfileSettings}
                  </h2>

                  <p className="text-sm text-zinc-500 mt-2 leading-relaxed break-words">
                    {[eventName, venue, instagram ? `@${instagram.replace(/^@/, "")}` : ""]
                      .filter(Boolean)
                      .join(" · ") || quickSetupText.profileTodoMessage}
                  </p>
                </div>
              </div>

              <span className="bg-purple-600 px-5 py-3 rounded-full text-sm text-white font-black text-center">
                {isProfileDetailsExpanded ? adminUiText.hideDetails : adminUiText.viewDetails}
              </span>
            </div>
          </button>

          {isProfileDetailsExpanded && (
            <div className="mt-6 border-t border-zinc-800 pt-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <label className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl cursor-pointer font-semibold text-center">
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
                    className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-semibold"
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
                rows={4}
                className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              />
            </div>
          )}

          <div className="mt-6 border-t border-zinc-800 pt-6">
            <button
              type="button"
              onClick={() => setIsPayoutSetupExpanded((current) => !current)}
              className="w-full text-left bg-black/30 border border-zinc-800 rounded-2xl p-4 md:p-5 hover:border-cyan-500/50 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-black">
                    {t.marketplacePayoutSetup}
                  </p>

                  <h3 className="text-xl md:text-2xl font-black text-white mt-1">
                    {payoutStatus === "Active"
                      ? adminUiText.payoutAccountConnected
                      : adminUiText.connectPayoutAccount}
                  </h3>

                  <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                    {payoutStatus === "Active"
                      ? `${payoutMethod} · ${payoutProvider || adminUiText.notConnected} · ${payoutAccountName || adminUiText.accountName}`
                      : t.marketplacePayoutDescription}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black border ${
                      payoutStatus === "Active"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}
                  >
                    {getPayoutStatusLabel(payoutStatus)}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black border ${
                      verificationStatus === "verified"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : verificationStatus === "pending"
                          ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                          : verificationStatus === "rejected"
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-zinc-700/40 border-zinc-600 text-zinc-300"
                    }`}
                  >
                    {verificationStatus === "verified"
                      ? t.verified
                      : verificationStatus === "pending"
                        ? t.pendingVerification
                        : verificationStatus === "rejected"
                          ? t.rejectedVerification
                          : t.notStarted}
                  </span>

                  <span className="bg-zinc-800 px-4 py-2 rounded-full text-xs text-white font-black">
                    {isPayoutSetupExpanded ? adminUiText.hideDetails : adminUiText.viewDetails}
                  </span>
                </div>
              </div>
            </button>

            {isPayoutSetupExpanded && (
              <div className="mt-5 space-y-5">
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {t.marketplacePayoutDescription}
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <select
                    value={country}
                    onChange={(e) => {
                      const selectedCountry = e.target.value;
                      const nextCurrency = getCurrencyForCountry(selectedCountry);

                      setCountry(selectedCountry);
                      setPreferredCurrency(nextCurrency);
                      setPayoutBankCode("");
                      setPaystackBanks([]);

                      if (payoutMethod === "Bank Transfer") {
                        loadPaystackBanks(nextCurrency);
                      }
                    }}
                    className="w-full p-4 rounded-xl bg-black border border-zinc-700"
                  >
                    <option value="">{t.selectCountry}</option>

                    <option value="Ghana"> Ghana</option>
                    <option value="Nigeria"> Nigeria</option>
                    <option value="Kenya"> Kenya</option>
                    <option value="South Africa"> South Africa</option>

                    <option value="United Kingdom"> United Kingdom</option>
                    <option value="United States"> United States</option>
                    <option value="Canada"> Canada</option>

                    <option value="Germany"> Germany</option>
                    <option value="France"> France</option>
                    <option value="Spain"> Spain</option>
                    <option value="Italy"> Italy</option>
                    <option value="Netherlands"> Netherlands</option>
                    <option value="Poland"> Poland</option>
                    <option value="Greece"> Greece</option>
                    <option value="Ukraine"> Ukraine</option>
                    <option value="Turkey"> Turkey</option>

                    <option value="UAE"> UAE</option>
                    <option value="Qatar"> Qatar</option>
                    <option value="Saudi Arabia"> Saudi Arabia</option>

                    <option value="Singapore"> Singapore</option>
                    <option value="Malaysia"> Malaysia</option>
                    <option value="Indonesia"> Indonesia</option>
                    <option value="Thailand"> Thailand</option>
                    <option value="Philippines"> Philippines</option>
                    <option value="Vietnam"> Vietnam</option>
                    <option value="China"> China</option>
                    <option value="Japan"> Japan</option>
                    <option value="South Korea"> South Korea</option>
                    <option value="India"> India</option>

                    <option value="Australia"> Australia</option>
                    <option value="New Zealand"> New Zealand</option>

                    <option value="Brazil"> Brazil</option>
                    <option value="Mexico"> Mexico</option>
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
                    {getPayoutStatusLabel(payoutStatus)}
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
                          {banksLoading ? adminUiText.loadingBanks : adminUiText.selectBank}
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
                            ? adminUiText.paypalEmailOrProvider
                            : adminUiText.payoutProvider
                        }
                        value={payoutProvider}
                        onChange={(e) => setPayoutProvider(e.target.value)}
                        className="w-full p-4 rounded-xl bg-black border border-zinc-700"
                      />
                    )}

                    <input
                      type="text"
                      placeholder={adminUiText.accountName}
                      value={payoutAccountName}
                      onChange={(e) => setPayoutAccountName(e.target.value)}
                      className="w-full p-4 rounded-xl bg-black border border-zinc-700"
                    />

                    <input
                      type="text"
                      placeholder={
                        payoutMethod === "Bank Transfer"
                          ? adminUiText.accountNumber
                          : payoutMethod === "Mobile Money"
                            ? adminUiText.mobileMoneyNumber
                            : adminUiText.accountPayoutId
                      }
                      value={payoutAccountNumber}
                      onChange={(e) => setPayoutAccountNumber(e.target.value)}
                      className="w-full p-4 rounded-xl bg-black border border-zinc-700"
                    />
                  </div>

                  {payoutStatus === "Active" && (
                    <div className="mt-5 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <p className="text-green-400 font-bold">
                        {adminUiText.payoutAccountConnected}
                      </p>
                      <p className="text-sm text-zinc-400 mt-2">
                        {payoutMethod} - {payoutProvider} - {payoutAccountName}
                      </p>

                      <p className="text-xs text-zinc-500 mt-2">
                        {adminUiText.recipientCode}: {" "}
                        <span className="text-zinc-300">
                          {paystackRecipientCode || adminUiText.notCreatedYet}
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
                      ? adminUiText.connectingToPaystack
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
              </div>
            )}
          </div>

          {(isProfileDetailsExpanded || isPayoutSetupExpanded) && (
            <div className="mt-6 border-t border-zinc-800 pt-6">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-bold text-lg disabled:opacity-50"
              >
                {savingProfile ? t.saving : t.saveProfile}
              </button>
            </div>
          )}

          {profileMessage && (
            <p className="text-green-400 font-semibold mt-4">{profileMessage}</p>
          )}
        </div>
      </div>

      <div className="mb-10">
        <button
          type="button"
          onClick={() => setIsEarningsExpanded((currentValue) => !currentValue)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-left hover:border-green-500/50 transition"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-green-400 font-black">
                {t.earningsOverview}
              </p>

              <h2 className="text-4xl md:text-5xl font-black text-cyan-400 mt-2">
                {currency} {netEarnings.toFixed(2)}
              </h2>

              <p className="text-sm text-zinc-500 mt-2">{t.djEarnings}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 border border-zinc-800 rounded-2xl px-4 py-3">
                <p className="text-xs text-zinc-500">{t.availableBalance}</p>
                <p className="text-lg md:text-xl font-black text-yellow-400 mt-1">
                  {currency} {availableBalance.toFixed(2)}
                </p>
              </div>

              <div className="bg-black/40 border border-zinc-800 rounded-2xl px-4 py-3">
                <p className="text-xs text-zinc-500">{t.pendingPayouts}</p>
                <p className="text-lg md:text-xl font-black text-yellow-400 mt-1">
                  {pendingPayouts}
                </p>
              </div>
            </div>

            <span className="bg-green-600 px-4 py-2 rounded-full text-sm text-white font-black text-center">
              {isEarningsExpanded ? adminUiText.hideDetails : adminUiText.viewDetails}
            </span>
          </div>
        </button>

        {isEarningsExpanded && (
          <div className="mt-4 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        )}
      </div>

      <div className="mb-10">
        <button
          type="button"
          onClick={() => setIsPaymentAuditExpanded((current) => !current)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-left hover:border-purple-500/50 transition"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-400 font-black">
                {adminUiText.paymentAudit}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
                {adminUiText.recentPaymentReferences}
              </h2>

              <p className="text-sm text-zinc-500 mt-2">
                {isPaymentAuditExpanded
                  ? adminUiText.paymentAuditBodyHide
                  : adminUiText.paymentAuditBodyView}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-black border border-zinc-800 px-4 py-2 rounded-full text-xs text-zinc-400 font-bold">
                {latestPayments.length} {adminUiText.latest}
              </span>

              <span className="bg-purple-600 px-4 py-2 rounded-full text-sm text-white font-black">
                {isPaymentAuditExpanded ? adminUiText.hideReferences : adminUiText.viewReferences}
              </span>
            </div>
          </div>
        </button>

        {isPaymentAuditExpanded && (
          <div className="mt-4">
            {latestPayments.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="text-zinc-500">{adminUiText.noPaymentsRecordedYet}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {latestPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-green-600/15 border border-green-600/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                            {getAdminStatusLabel(payment.status || "paid")}
                          </span>

                          <span className="bg-purple-600/15 border border-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-xs font-bold uppercase">
                            {payment.provider || "paystack"}
                          </span>

                          {payment.request_id && (
                            <span className="bg-black/40 border border-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs font-bold">
                              {adminUiText.requestNumber}{payment.request_id}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-black text-white mt-3 truncate">
                          {payment.song || adminUiText.songNotSaved}
                        </h3>

                        <p className="text-sm text-zinc-400 mt-1">
                          {payment.artist || adminUiText.artistNotSaved}
                        </p>

                        <p className="text-sm text-purple-300 mt-2">
                          {adminUiText.guest}: {payment.guest_name || adminUiText.guestNotSaved}
                        </p>

                        <p className="text-xs text-zinc-600 mt-2">
                          {payment.created_at
                            ? new Date(payment.created_at).toLocaleString()
                            : adminUiText.noDate}
                        </p>
                      </div>

                      <div className="lg:text-right shrink-0">
                        <p className="text-2xl font-black text-green-400">
                          {payment.currency || currency}{" "}
                          {Number(payment.amount || 0).toFixed(2)}
                        </p>

                        <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 mt-3 text-left lg:text-right">
                          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                            {adminUiText.paystackReference}
                          </p>
                          <p className="text-sm text-white font-mono break-all mt-1">
                            {payment.provider_reference || adminUiText.noReferenceSaved}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              copyPaymentReference(payment.provider_reference)
                            }
                            className="mt-3 w-full lg:w-auto bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-sm font-bold transition"
                          >
                            {adminUiText.copyReference}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={withdrawalsSectionRef} className="scroll-mt-6 mb-10">
        <h2 className="text-3xl font-bold mb-4 text-cyan-400">
          {t.withdrawalActivity}
        </h2>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-white mb-5">
            {t.requestWithdrawalTitle}
          </h3>

          <div className="bg-black/40 border border-purple-500/30 rounded-2xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                💰
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h4 className="text-base md:text-lg font-black text-white">
                      {balanceText.title}
                    </h4>

                    <p className="text-xs md:text-sm text-zinc-400 mt-1 leading-relaxed">
                      {balanceText.formula}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setIsBalanceGuideExpanded((current) => !current)
                    }
                    className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-xl text-sm font-bold transition shrink-0"
                  >
                    {isBalanceGuideExpanded
                      ? adminUiText.hideDetails
                      : adminUiText.viewDetails}
                  </button>
                </div>

                {isBalanceGuideExpanded && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {balanceText.leadBefore}{" "}
                      <span className="text-white font-semibold">
                        {balanceText.availableBalance}
                      </span>{" "}
                      {balanceText.leadAfter}
                    </p>

                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                          {balanceText.grossTitle}
                        </p>
                        <p className="text-sm text-zinc-300 mt-1">
                          {balanceText.grossBody}
                        </p>
                      </div>

                      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                          {balanceText.djTitle}
                        </p>
                        <p className="text-sm text-zinc-300 mt-1">
                          {balanceText.djBody}
                        </p>
                      </div>

                      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                          {balanceText.openTitle}
                        </p>
                        <p className="text-sm text-zinc-300 mt-1">
                          {balanceText.openBody}
                        </p>
                      </div>

                      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                          {balanceText.verificationTitle}
                        </p>
                        <p className="text-sm text-zinc-300 mt-1">
                          {balanceText.verificationBody}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="number"
              placeholder={t.withdrawalAmount}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            />

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <p className="text-zinc-500 text-sm">{adminUiText.payoutDestination}</p>
              {payoutStatus === "Active" && paystackRecipientCode ? (
                <p className="text-green-400 font-bold mt-1">
                  {payoutMethod} - {payoutProvider}
                </p>
              ) : (
                <p className="text-red-400 font-bold mt-1">{adminUiText.notConnected}</p>
              )}
            </div>
          </div>

          {payoutStatus === "Active" && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-4">
              <p className="text-sm text-zinc-400">
                {adminUiText.accountName}: {" "}
                <span className="text-white font-semibold">
                  {payoutAccountName || adminUiText.notProvided}
                </span>
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                {adminUiText.accountNumber}: {" "}
                <span className="text-white font-semibold">
                  {payoutAccountNumber || adminUiText.notProvided}
                </span>
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                {adminUiText.recipientCode}: {" "}
                <span className="text-white font-semibold">
                  {paystackRecipientCode || adminUiText.notCreatedYet}
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
                  {adminUiText.connectPayoutBeforeWithdrawal}
                </div>
              )}

              {hasOpenWithdrawal && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl p-4 text-sm">
                  {adminUiText.existingWithdrawalLocked}
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
                  ? adminUiText.submitting
                  : verificationStatus !== "verified"
                    ? t.verificationRequired
                    : !paystackRecipientCode
                      ? adminUiText.connectPayoutAccount
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
            {adminUiText.withdrawalHistory}
          </h3>

          {withdrawals.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <p className="text-zinc-500">{t.noWithdrawalRequestsYet}</p>
            </div>
          ) : !withdrawalHistoryIsOpen ? (
            <button
              type="button"
              onClick={() => setIsWithdrawalHistoryExpanded(true)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 p-4 rounded-2xl text-left transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-400 font-black">
                    {adminUiText.withdrawalHistory}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {latestWithdrawal && (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                          getWithdrawalStatusBadge(latestWithdrawal.status)
                            .className
                        }`}
                      >
                        {adminUiText.latestLabel}: {" "}
                        {getWithdrawalStatusBadge(latestWithdrawal.status).label}
                      </span>
                    )}

                    <span className="bg-black/40 border border-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-300 font-bold">
                      {sortedWithdrawalHistory.length} {sortedWithdrawalHistory.length === 1 ? adminUiText.withdrawalSingular : adminUiText.withdrawalPlural}
                    </span>

                    <span className="bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full text-xs text-green-400 font-bold">
                      {adminUiText.totalWithdrawn}: {currency} {withdrawalPaidTotal.toFixed(2)}
                    </span>

                    <span className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full text-xs text-yellow-400 font-bold">
                      {adminUiText.available}: {currency} {availableBalance.toFixed(2)}
                    </span>
                  </div>
                </div>

                <span className="bg-cyan-600 hover:bg-cyan-700 px-5 py-3 rounded-xl text-sm text-white font-black text-center">
                  {adminUiText.viewDetails}
                </span>
              </div>
            </button>
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
                          {adminUiText.latestLabel}: {" "}
                          {
                            getWithdrawalStatusBadge(latestWithdrawal.status)
                              .label
                          }
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="bg-black/40 border border-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-300 font-bold">
                        {sortedWithdrawalHistory.length} {sortedWithdrawalHistory.length === 1 ? adminUiText.withdrawalSingular : adminUiText.withdrawalPlural}
                      </span>

                      <span className="bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full text-xs text-green-400 font-bold">
                        {adminUiText.totalWithdrawn}: {currency}{" "}
                        {withdrawalPaidTotal.toFixed(2)}
                      </span>

                      <span className="bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-xs text-purple-300 font-bold">
                        {adminUiText.totalRequested}: {currency}{" "}
                        {withdrawalRequestedTotal.toFixed(2)}
                      </span>

                      <span className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full text-xs text-yellow-400 font-bold">
                        {adminUiText.available}: {currency} {availableBalance.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 mt-3">
                      {adminUiText.latestRequest}: {" "}
                      {latestWithdrawal?.created_at
                        ? new Date(latestWithdrawal.created_at).toLocaleString()
                        : adminUiText.unknown}
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
                  {adminUiText.hideDetails}
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
                              {adminUiText.requested}: {" "}
                              {withdrawal.created_at
                                ? new Date(
                                    withdrawal.created_at,
                                  ).toLocaleString()
                                : adminUiText.noDate}
                            </p>
                          </div>

                          {withdrawal.status === "paid" && (
                            <span className="bg-green-600/20 text-green-400 px-4 py-2 rounded-xl font-semibold">
                              {adminUiText.paid}
                            </span>
                          )}

                          {withdrawal.status === "approved" && (
                            <span className="bg-cyan-600/20 text-cyan-400 px-4 py-2 rounded-xl font-semibold">
                              {adminUiText.approvedByBlackline}
                            </span>
                          )}

                          {withdrawal.status === "pending" && (
                            <span className="bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-xl font-semibold">
                              {adminUiText.waitingForReview}
                            </span>
                          )}

                          {withdrawal.status === "rejected" && (
                            <span className="bg-red-600/20 text-red-400 px-4 py-2 rounded-xl font-semibold">
                              {adminUiText.rejected}
                            </span>
                          )}
                        </div>

                        <div className="grid md:grid-cols-4 gap-3 mt-4">
                          <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                            <p className="text-xs text-zinc-500">{adminUiText.method}</p>
                            <p className="text-zinc-300 font-semibold">
                              {withdrawal.payout_method || adminUiText.bankTransfer}
                            </p>
                          </div>

                          <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                            <p className="text-xs text-zinc-500">{adminUiText.provider}</p>
                            <p className="text-zinc-300 font-semibold">
                              {withdrawal.provider || adminUiText.noProvider}
                            </p>
                          </div>

                          <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                            <p className="text-xs text-zinc-500">
                              {adminUiText.accountName}
                            </p>
                            <p className="text-zinc-300 font-semibold">
                              {withdrawal.account_name || adminUiText.noAccountName}
                            </p>
                          </div>

                          <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                            <p className="text-xs text-zinc-500">
                              {adminUiText.accountNumber}
                            </p>
                            <p className="text-zinc-300 font-semibold">
                              {withdrawal.account_number || adminUiText.noAccountNumber}
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
                              {adminUiText.withdrawalActivityTimeline} ({auditTrail.length})
                            </span>

                            <span className="text-xs text-zinc-500 font-bold">
                              {isTimelineOpen ? adminUiText.hide : adminUiText.show}
                            </span>
                          </button>

                          {isTimelineOpen && (
                            <div className="mt-4">
                              {auditTrail.length === 0 ? (
                                <p className="text-sm text-zinc-500">
                                  {adminUiText.noStatusUpdatesYet}
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
                                              adminUiText.activityUpdated}
                                          </p>

                                          <p className="text-xs text-zinc-600 mt-1">
                                            {log.created_at
                                              ? new Date(
                                                  log.created_at,
                                                ).toLocaleString()
                                              : adminUiText.noDate}
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
  showPlayedAt = false,
  compactCards = false,
  playedAtLabel = "Played at",
  expiresInLabel = "Expires in",
}: {
  title: string;
  titleColor: string;
  requests: SongRequest[];
  borderColor: string;
  buttons: (request: SongRequest) => React.ReactNode;
  showQueueNumber?: boolean;
  actionLoadingId: number | null;
  t: (typeof translations)[Language];
  showPlayedAt?: boolean;
  compactCards?: boolean;
  playedAtLabel?: string;
  expiresInLabel?: string;
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
            className={`bg-zinc-900 border ${borderColor} ${
              compactCards ? "p-3 md:p-4 rounded-xl md:rounded-2xl" : "p-5 rounded-2xl"
            }`}
          >
            <div className={`flex justify-between items-start ${compactCards ? "gap-2" : "gap-3"}`}>
              <div className={`flex items-start min-w-0 ${compactCards ? "gap-2.5" : "gap-3"}`}>
                {request.artwork && (
                  <img
                    src={request.artwork}
                    alt={request.song}
                    className={
                      compactCards
                        ? "w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover flex-shrink-0"
                        : "w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    }
                  />
                )}

                <div className="min-w-0">
                  <h3
                    className={
                      compactCards
                        ? "text-lg md:text-xl font-bold leading-tight break-words"
                        : "text-2xl font-bold"
                    }
                  >
                    {showQueueNumber
                      ? `#${index + 1} - ${request.song}`
                      : request.song}
                  </h3>

                  <p
                    className={
                      compactCards
                        ? "text-sm text-zinc-400 mt-0.5 leading-snug break-words"
                        : "text-zinc-400 mt-1"
                    }
                  >
                    {request.artist}
                  </p>

                  {request.album && (
                    <p
                      className={
                        compactCards
                          ? "text-[11px] md:text-xs text-zinc-500 mt-0.5 leading-snug break-words"
                          : "text-xs text-zinc-500 mt-1"
                      }
                    >
                      {request.album}
                    </p>
                  )}

                  <p
                    className={
                      compactCards
                        ? "text-sm text-purple-400 mt-1 leading-snug break-words"
                        : "text-purple-400 mt-2"
                    }
                  >
                    {t.requestedBy} {request.name}
                  </p>

                  {showPlayedAt && request.played_at && formatPlayedAt(request.played_at) && (
                    <p
                      className={
                        compactCards
                          ? "text-[11px] md:text-xs text-blue-300 mt-1 font-semibold"
                          : "text-xs md:text-sm text-blue-300 mt-2 font-semibold"
                      }
                    >
                      {playedAtLabel} {formatPlayedAt(request.played_at)}
                    </p>
                  )}

                  {request.status === "played" && isNowPlayingStillActive(request) && (
                    <div className="inline-flex items-center gap-2 mt-3 bg-purple-600/15 border border-purple-500/40 text-purple-200 px-3 py-2 rounded-full text-xs md:text-sm font-bold">
                      <span>⏳</span>
                      <span>{expiresInLabel} {formatNowPlayingRemaining(request)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex flex-col items-end flex-shrink-0 ${compactCards ? "gap-1.5" : "gap-2"}`}>
                {showQueueNumber && index === 0 && (
                  <span className="bg-purple-600 px-3 py-1 rounded-full text-xs font-bold">
                    {t.nextUp}
                  </span>
                )}

                {request.tip_amount >= 50 && (
                  <span
                    className={
                      compactCards
                        ? "bg-yellow-500 text-black px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold"
                        : "bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold"
                    }
                  >
                    {t.vip}
                  </span>
                )}

                <div
                  className={
                    compactCards
                      ? "bg-green-700 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs md:text-sm"
                      : "bg-green-700 px-4 py-2 rounded-xl font-bold whitespace-nowrap text-sm md:text-base"
                  }
                >
                  {request.tip_currency} {request.tip_amount}
                </div>
              </div>
            </div>

            {actionLoadingId === request.id && (
              <p className={`text-zinc-500 text-sm ${compactCards ? "mt-2" : "mt-3"}`}>{t.updating}</p>
            )}

            <div className={`flex flex-wrap ${compactCards ? "gap-2 mt-3" : "gap-3 mt-5"}`}>
              {buttons(request)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
