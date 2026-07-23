"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

type DJ = {
 id: number;
 stage_name: string;
 stage_slug?: string | null;
 email: string | null;
 country?: string | null;
 preferred_currency?: string | null;
 payout_email?: string | null;
 payout_method?: string | null;
 payout_status?: string | null;
 payout_provider?: string | null;
 payout_account_name?: string | null;
 payout_account_number?: string | null;
 paystack_recipient_code?: string | null;
 verification_status?: string | null;
 profile_image?: string | null;
 is_live?: boolean | null;
};

type Withdrawal = {
 id: number;
 dj_id?: number | null;
 dj_name?: string | null;
 amount: number;
 currency?: string | null;
 payout_method?: string | null;
 account_name?: string | null;
 account_number?: string | null;
 provider?: string | null;
 status?: string | null;
 created_at?: string | null;
};

type BookingRequest = {
 id: number;
 dj_id: number;
 name: string;
 email?: string | null;
 phone?: string | null;
 event_type?: string | null;
 event_date?: string | null;
 venue?: string | null;
 budget?: string | null;
 message?: string | null;
 status: string;
 payment_status?: string | null;
 payment_reference?: string | null;
 currency?: string | null;
 agreed_amount?: number | null;
 commission_rate?: number | null;
 commission_amount?: number | null;
 dj_net_amount?: number | null;
 blackline_read_at?: string | null;
 accepted_at?: string | null;
 rejected_at?: string | null;
 completed_at?: string | null;
 paid_at?: string | null;
 created_at?: string | null;
};

type DjEarning = {
 dj_id: number;
 stage_name: string;
 currency: string;
 grossRevenue: number;
 platformRevenue: number;
 djRevenue: number;
 totalWithdrawals: number;
 pendingWithdrawals: number;
 approvedWithdrawals: number;
 paidWithdrawals: number;
 rejectedWithdrawals: number;
 availableBalance: number;
};

type AuditLog = {
 id: number;
 action_type: string;
 entity_type: string;
 entity_id: number;
 description: string;
 metadata?: Record<string, unknown> | null;
 created_at?: string | null;
};

type ConfirmAction =
 | {
 kind: "dj";
 id: number;
 status: "verified" | "rejected" | "pending" | "not_started" | "removed";
 title: string;
 message: string;
 warning?: string;
 confirmText: string;
 buttonClass: string;
 }
 | {
 kind: "withdrawal";
 id: number;
 status: "approved" | "rejected" | "paid" | "pending";
 title: string;
 message: string;
 warning?: string;
 confirmText: string;
 buttonClass: string;
 };

export default function VerificationDashboardClient({
 signOutAction,
}: {
 signOutAction?: () => void | Promise<void>;
}) {
 const [djs, setDjs] = useState<DJ[]>([]);
 const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
 const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
 const [djEarnings, setDjEarnings] = useState<DjEarning[]>([]);
 const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
 const [loading, setLoading] = useState(true);
 const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
 const [withdrawalActionLoadingId, setWithdrawalActionLoadingId] = useState<
 number | null
 >(null);

 const [withdrawalSearch, setWithdrawalSearch] = useState("");
 const [djSearch, setDjSearch] = useState("");
 const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
 null,
 );
 const [confirmLoading, setConfirmLoading] = useState(false);
 const [expandedWithdrawalDjKeys, setExpandedWithdrawalDjKeys] = useState<string[]>(
 [],
 );
 const [collapsedWithdrawalDjKeys, setCollapsedWithdrawalDjKeys] = useState<
 string[]
 >([]);
 const [expandedWithdrawalTimelineKeys, setExpandedWithdrawalTimelineKeys] =
 useState<string[]>([]);
 const [expandedDjIds, setExpandedDjIds] = useState<number[]>([]);
 const [collapsedPriorityDjIds, setCollapsedPriorityDjIds] = useState<
 number[]
 >([]);
 const [collapsedDjGroups, setCollapsedDjGroups] = useState<string[]>([
 "other",
 "removed",
 ]);
 const [isRecentActivityCollapsed, setIsRecentActivityCollapsed] =
 useState(false);
 const [connectionWarning, setConnectionWarning] = useState("");
 const isFetchingDashboardRef = useRef(false);

 async function fetchDashboardData(showLoader = false) {
 if (isFetchingDashboardRef.current) {
 return;
 }

 isFetchingDashboardRef.current = true;

 if (showLoader) {
 setLoading(true);
 }

 try {
 const response = await fetch(
 `/api/blackline-admin/dashboard?t=${Date.now()}`,
 {
 cache: "no-store",
 },
 );

 const result = await response.json();

 if (!response.ok) {
 console.error("BLACKLINE DASHBOARD API ERROR:", result);
 setConnectionWarning(
 result.error ||
 "Blackline dashboard could not refresh. It will retry automatically.",
 );
 return;
 }

 const dashboardDjs = result.allDjs || result.djs || [];
 const removedDashboardDjs = result.removedDjs || [];

 const mergedDjs = [
 ...dashboardDjs,
 ...removedDashboardDjs.filter(
 (removedDj: DJ) =>
 !dashboardDjs.some((dashboardDj: DJ) => dashboardDj.id === removedDj.id),
 ),
 ];

 setDjs(mergedDjs as DJ[]);
 setWithdrawals((result.withdrawals || []) as Withdrawal[]);
 setBookingRequests(
 (result.bookingRequests || []) as BookingRequest[],
 );
 setDjEarnings((result.djEarnings || []) as DjEarning[]);
 setAuditLogs((result.auditLogs || []) as AuditLog[]);
 setConnectionWarning("");
 } catch (error) {
 console.error("BLACKLINE DASHBOARD FETCH ERROR:", error);
 setConnectionWarning(
 "Connection paused. Blackline will reconnect automatically when the network is ready.",
 );
 } finally {
 isFetchingDashboardRef.current = false;

 if (showLoader) {
 setLoading(false);
 } else {
 setLoading(false);
 }
 }
 }

 useEffect(() => {
 fetchDashboardData(true);

 const refreshInterval = setInterval(() => {
 fetchDashboardData();
 }, 10000);

 const handleWindowFocus = () => {
 fetchDashboardData();
 };

 const handleOnline = () => {
 setConnectionWarning("Reconnected. Refreshing Blackline dashboard...");
 fetchDashboardData();
 };

 const handleOffline = () => {
 setConnectionWarning(
 "You are offline. Blackline will reconnect automatically when the network is ready.",
 );
 };

 const handleVisibilityChange = () => {
 if (document.visibilityState === "visible") {
 fetchDashboardData();
 }
 };

 window.addEventListener("focus", handleWindowFocus);
 window.addEventListener("online", handleOnline);
 window.addEventListener("offline", handleOffline);
 document.addEventListener("visibilitychange", handleVisibilityChange);

 const channel = supabase
 .channel("blackline-verification-dashboard")
 .on(
 "postgres_changes",
 {
 event: "*",
 schema: "public",
 table: "withdrawals",
 },
 () => {
 fetchDashboardData();
 },
 )
 .on(
 "postgres_changes",
 {
 event: "*",
 schema: "public",
 table: "djs",
 },
 () => {
 fetchDashboardData();
 },
 )
 .on(
 "postgres_changes",
 {
 event: "*",
 schema: "public",
 table: "requests",
 },
 () => {
 fetchDashboardData();
 },
 )
 .on(
 "postgres_changes",
 {
 event: "*",
 schema: "public",
 table: "audit_logs",
 },
 () => {
 fetchDashboardData();
 },
 )
 .on(
 "postgres_changes",
 {
 event: "*",
 schema: "public",
 table: "booking_requests",
 },
 () => {
 fetchDashboardData();
 },
 )
 .subscribe();

 return () => {
 clearInterval(refreshInterval);
 window.removeEventListener("focus", handleWindowFocus);
 window.removeEventListener("online", handleOnline);
 window.removeEventListener("offline", handleOffline);
 document.removeEventListener("visibilitychange", handleVisibilityChange);
 supabase.removeChannel(channel);
 };
 }, []);

 const activeDjs = djs.filter(
 (dj) => dj.verification_status !== "removed",
 );

 const removedDjs = djs.filter(
 (dj) => dj.verification_status === "removed",
 );

 const pendingCount = activeDjs.filter(
 (dj) => dj.verification_status === "pending",
 ).length;

 const verifiedCount = activeDjs.filter(
 (dj) => dj.verification_status === "verified",
 ).length;

 const rejectedCount = activeDjs.filter(
 (dj) => dj.verification_status === "rejected",
 ).length;

 const totalCount = activeDjs.length;

 const pendingWithdrawals = withdrawals.filter(
 (withdrawal) => withdrawal.status === "pending",
 ).length;

 const approvedWithdrawals = withdrawals.filter(
 (withdrawal) => withdrawal.status === "approved",
 ).length;

 const paidWithdrawals = withdrawals.filter(
 (withdrawal) => withdrawal.status === "paid",
 ).length;

 const rejectedWithdrawals = withdrawals.filter(
 (withdrawal) => withdrawal.status === "rejected",
 ).length;

 const withdrawalActionCount = pendingWithdrawals + approvedWithdrawals;

 const pendingBookingCount = bookingRequests.filter(
 (booking) => booking.status === "pending",
 ).length;

 const acceptedAwaitingPaymentCount = bookingRequests.filter(
 (booking) =>
 booking.status === "accepted" &&
 String(booking.payment_status || "unpaid") !== "paid",
 ).length;

 const paidBookingCount = bookingRequests.filter(
 (booking) => booking.payment_status === "paid",
 ).length;

 const bookingActionCount =
 pendingBookingCount + acceptedAwaitingPaymentCount;

 const adminActionCount =
 pendingCount + withdrawalActionCount + bookingActionCount;

 const totalBookingCommission = bookingRequests
 .filter((booking) => booking.payment_status === "paid")
 .reduce(
 (sum, booking) => sum + Number(booking.commission_amount || 0),
 0,
 );

 const totalGrossRevenue = djEarnings.reduce(
 (sum, item) => sum + Number(item.grossRevenue || 0),
 0,
 );

 const totalPlatformRevenue = djEarnings.reduce(
 (sum, item) => sum + Number(item.platformRevenue || 0),
 0,
 );

 const totalDjRevenue = djEarnings.reduce(
 (sum, item) => sum + Number(item.djRevenue || 0),
 0,
 );

 const totalAvailableBalance = djEarnings.reduce(
 (sum, item) => sum + Number(item.availableBalance || 0),
 0,
 );

 const dashboardCurrency = djEarnings[0]?.currency || "GHS";
 const djSearchTerms = djSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);

 function getDjSearchText(dj: DJ) {
 const stageSlug = (dj.stage_slug || dj.stage_name || "")
 .toLowerCase()
 .trim()
 .replace(/\s+/g, "-")
 .replace(/[^a-z0-9-]/g, "")
 .replace(/-+/g, "-")
 .replace(/^-|-$/g, "");
 const publicRequestUrl = stageSlug ? `https://blacklinedj.com/${stageSlug}` : "";

 return [
 dj.stage_name,
 dj.stage_slug,
 publicRequestUrl,
 dj.email,
 dj.country,
 dj.preferred_currency,
 dj.payout_email,
 dj.payout_method,
 dj.payout_provider,
 dj.payout_status,
 dj.payout_account_name,
 dj.payout_account_number,
 dj.paystack_recipient_code,
 dj.verification_status || "not_started",
 dj.is_live ? "live online taking requests" : "offline closed",
 ]
 .filter(Boolean)
 .join(" ")
 .toLowerCase();
 }

 function matchesDjSearch(dj: DJ) {
 if (djSearchTerms.length === 0) return true;

 const searchableText = getDjSearchText(dj);

 return djSearchTerms.every((term) => searchableText.includes(term));
 }

 const filteredActiveDjs = activeDjs.filter(matchesDjSearch);
 const filteredRemovedDjs = removedDjs.filter(matchesDjSearch);
 const totalDjDirectoryCount = activeDjs.length + removedDjs.length;
 const filteredDjDirectoryCount = filteredActiveDjs.length + filteredRemovedDjs.length;

 const sortedDjs = [...filteredActiveDjs].sort((a, b) => {
 function getDjPriority(dj: DJ) {
 const djWithdrawals = withdrawals.filter(
 (withdrawal) => withdrawal.dj_id === dj.id,
 );

 const hasApprovedWithdrawal = djWithdrawals.some(
 (withdrawal) => withdrawal.status === "approved",
 );

 const hasPendingWithdrawal = djWithdrawals.some(
 (withdrawal) => withdrawal.status === "pending",
 );

 if (dj.verification_status === "pending") return 1;
 if (hasApprovedWithdrawal) return 2;
 if (hasPendingWithdrawal) return 3;
 if (dj.verification_status === "verified") return 4;
 if (dj.verification_status === "not_started") return 5;
 if (dj.verification_status === "rejected") return 6;

 return 7;
 }

 return getDjPriority(a) - getDjPriority(b);
 });

 const pendingVerificationDjs = sortedDjs.filter(
 (dj) => dj.verification_status === "pending",
 );

 const withdrawalActionDjs = sortedDjs.filter((dj) => {
 if (dj.verification_status === "pending") return false;

 const djWithdrawals = withdrawals.filter(
 (withdrawal) => withdrawal.dj_id === dj.id,
 );

 return djWithdrawals.some(
 (withdrawal) =>
 withdrawal.status === "pending" || withdrawal.status === "approved",
 );
 });

 const otherDjs = sortedDjs.filter((dj) => {
 if (dj.verification_status === "pending") return false;

 const djWithdrawals = withdrawals.filter(
 (withdrawal) => withdrawal.dj_id === dj.id,
 );

 const hasActionWithdrawal = djWithdrawals.some(
 (withdrawal) =>
 withdrawal.status === "pending" || withdrawal.status === "approved",
 );

 return !hasActionWithdrawal;
 });

 const sortedWithdrawals = withdrawals
 .filter((withdrawal) =>
 (withdrawal.dj_name || "")
 .toLowerCase()
 .includes(withdrawalSearch.toLowerCase()),
 )
 .sort((a, b) => {
 const priority: Record<string, number> = {
 pending: 1,
 approved: 2,
 rejected: 3,
 paid: 4,
 };

 const priorityDifference =
 (priority[a.status || "pending"] || 5) -
 (priority[b.status || "pending"] || 5);

 if (priorityDifference !== 0) return priorityDifference;

 return (
 new Date(b.created_at || 0).getTime() -
 new Date(a.created_at || 0).getTime()
 );
 });

 const withdrawalGroups = Array.from(
 sortedWithdrawals.reduce((groupMap, withdrawal) => {
 const fallbackName = withdrawal.dj_name || "Unknown DJ";
 const groupKey = withdrawal.dj_id
 ? `dj-${withdrawal.dj_id}`
 : `name-${fallbackName.toLowerCase()}`;

 const existingGroup = groupMap.get(groupKey);

 if (existingGroup) {
 existingGroup.withdrawals.push(withdrawal);
 } else {
 groupMap.set(groupKey, {
 key: groupKey,
 djId: withdrawal.dj_id || null,
 djName: fallbackName,
 withdrawals: [withdrawal],
 });
 }

 return groupMap;
 }, new Map<string, { key: string; djId: number | null; djName: string; withdrawals: Withdrawal[] }>()),
 )
 .map(([, group]) => {
 const sortedGroupWithdrawals = [...group.withdrawals].sort(
 (a, b) =>
 new Date(b.created_at || 0).getTime() -
 new Date(a.created_at || 0).getTime(),
 );

 const latestWithdrawal = sortedGroupWithdrawals[0];
 const paidTotal = sortedGroupWithdrawals
 .filter((withdrawal) => withdrawal.status === "paid")
 .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);
 const requestedTotal = sortedGroupWithdrawals.reduce(
 (sum, withdrawal) => sum + Number(withdrawal.amount || 0),
 0,
 );
 const hasActionRequired = sortedGroupWithdrawals.some(
 (withdrawal) =>
 withdrawal.status === "pending" || withdrawal.status === "approved",
 );

 return {
 ...group,
 withdrawals: sortedGroupWithdrawals,
 latestWithdrawal,
 paidTotal,
 requestedTotal,
 hasActionRequired,
 };
 })
 .sort((a, b) => {
 const priority: Record<string, number> = {
 pending: 1,
 approved: 2,
 rejected: 3,
 paid: 4,
 };

 const priorityDifference =
 (priority[a.latestWithdrawal?.status || "pending"] || 5) -
 (priority[b.latestWithdrawal?.status || "pending"] || 5);

 if (priorityDifference !== 0) return priorityDifference;

 return (
 new Date(b.latestWithdrawal?.created_at || 0).getTime() -
 new Date(a.latestWithdrawal?.created_at || 0).getTime()
 );
 });

 async function updateVerificationStatus(
 djId: number,
 status: "verified" | "rejected" | "pending" | "not_started" | "removed"
 ) {
 setActionLoadingId(djId);

 const response = await fetch("/api/blackline-admin/dashboard", {
 method: "PATCH",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify({
 type: "dj",
 id: djId,
 status,
 }),
 });

 const result = await response.json();

 if (!response.ok) {
 console.error("DJ VERIFICATION UPDATE ERROR:", result);
 alert(result.error || "Failed to update verification status");
 setActionLoadingId(null);
 return;
 }

 await fetchDashboardData();
 setActionLoadingId(null);
 }

 async function updateWithdrawalStatus(
 withdrawalId: number,
 status: "approved" | "rejected" | "paid" | "pending",
 ) {
 setWithdrawalActionLoadingId(withdrawalId);

 const response = await fetch("/api/blackline-admin/dashboard", {
 method: "PATCH",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify({
 type: "withdrawal",
 id: withdrawalId,
 status,
 }),
 });

 const result = await response.json();

 if (!response.ok) {
 console.error("WITHDRAWAL UPDATE ERROR:", result);
 alert(result.error || "Failed to update withdrawal status");
 setWithdrawalActionLoadingId(null);
 return;
 }

 await fetchDashboardData();
 setWithdrawalActionLoadingId(null);
 }

 async function handleConfirmAction() {
 if (!confirmAction) return;

 const currentScrollY = typeof window !== "undefined" ? window.scrollY : 0;

 setConfirmLoading(true);

 if (confirmAction.kind === "dj") {
 await updateVerificationStatus(confirmAction.id, confirmAction.status);
 }

 if (confirmAction.kind === "withdrawal") {
 await updateWithdrawalStatus(confirmAction.id, confirmAction.status);
 }

 setConfirmLoading(false);
 setConfirmAction(null);

 setTimeout(() => {
 window.scrollTo({
 top: currentScrollY,
 behavior: "instant",
 });
 }, 50);
 }

 function withdrawalStatusColor(status?: string | null) {
 if (status === "paid") return "text-green-400";
 if (status === "approved") return "text-cyan-400";
 if (status === "rejected") return "text-red-400";
 return "text-yellow-400";
 }

 function withdrawalStatusLabel(status?: string | null) {
 if (status === "paid") return " Paid";
 if (status === "approved") return " Approved";
 if (status === "rejected") return " Rejected";
 return " Pending";
 }

 function auditLogIcon(entityType?: string | null) {
 if (entityType === "booking_request") return "📅";
 if (entityType === "withdrawal") return "";
 if (entityType === "dj") return "";
 return "";
 }

 function getWithdrawalAuditLogs(withdrawalId: number) {
 return auditLogs
 .filter(
 (log) =>
 log.entity_type === "withdrawal" && log.entity_id === withdrawalId,
 )
 .slice(0, 10);
 }

 function getAuditMetadataValue(log: AuditLog, key: string) {
 const value = log.metadata?.[key];
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
 const newStatus = getAuditMetadataValue(log, "new_status") || log.action_type;
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

 function toggleWithdrawalDjDetails(groupKey: string, isAutoExpanded = false) {
 if (isAutoExpanded) {
 setCollapsedWithdrawalDjKeys((currentKeys) =>
 currentKeys.includes(groupKey)
 ? currentKeys.filter((key) => key !== groupKey)
 : [...currentKeys, groupKey],
 );

 setExpandedWithdrawalDjKeys((currentKeys) =>
 currentKeys.filter((key) => key !== groupKey),
 );

 return;
 }

 setExpandedWithdrawalDjKeys((currentKeys) =>
 currentKeys.includes(groupKey)
 ? currentKeys.filter((key) => key !== groupKey)
 : [...currentKeys, groupKey],
 );
 }

 function toggleWithdrawalTimeline(timelineKey: string) {
 setExpandedWithdrawalTimelineKeys((currentKeys) =>
 currentKeys.includes(timelineKey)
 ? currentKeys.filter((key) => key !== timelineKey)
 : [...currentKeys, timelineKey],
 );
 }

 function toggleDjDetails(djId: number, isExpanded: boolean) {
 if (isExpanded) {
 setExpandedDjIds((currentIds) => currentIds.filter((id) => id !== djId));

 setCollapsedPriorityDjIds((currentIds) =>
 currentIds.includes(djId) ? currentIds : [...currentIds, djId],
 );

 return;
 }

 setCollapsedPriorityDjIds((currentIds) =>
 currentIds.filter((id) => id !== djId),
 );

 setExpandedDjIds((currentIds) =>
 currentIds.includes(djId) ? currentIds : [...currentIds, djId],
 );
 }

 function getVerificationStatusBadge(status?: string | null) {
 if (status === "verified") {
 return {
 label: " Verified",
 className: "bg-green-500/10 border-green-500/30 text-green-400",
 };
 }

 if (status === "pending") {
 return {
 label: " Pending Verification",
 className: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
 };
 }

 if (status === "rejected") {
 return {
 label: " Rejected",
 className: "bg-red-500/10 border-red-500/30 text-red-400",
 };
 }

 if (status === "removed") {
 return {
 label: " Removed",
 className: "bg-zinc-700/30 border-zinc-600/40 text-zinc-400",
 };
 }

 return {
 label: " Not Started",
 className: "bg-zinc-500/10 border-zinc-500/30 text-zinc-400",
 };
 }

 function getDjWithdrawalFlags(djId: number) {
 const djWithdrawals = withdrawals.filter(
 (withdrawal) => withdrawal.dj_id === djId,
 );

 return {
 hasPendingWithdrawal: djWithdrawals.some(
 (withdrawal) => withdrawal.status === "pending",
 ),
 hasApprovedWithdrawal: djWithdrawals.some(
 (withdrawal) => withdrawal.status === "approved",
 ),
 };
 }

 function toggleDjGroup(groupId: string) {
 setCollapsedDjGroups((currentGroups) =>
 currentGroups.includes(groupId)
 ? currentGroups.filter((id) => id !== groupId)
 : [...currentGroups, groupId],
 );
 }

 function renderDjCard(dj: DJ) {
 const earnings = djEarnings.find((item) => item.dj_id === dj.id);
 const { hasPendingWithdrawal, hasApprovedWithdrawal } = getDjWithdrawalFlags(
 dj.id,
 );
 const shouldAutoExpand =
 dj.verification_status === "pending" ||
 hasPendingWithdrawal ||
 hasApprovedWithdrawal;
 const isExpanded =
 expandedDjIds.includes(dj.id) ||
 (shouldAutoExpand && !collapsedPriorityDjIds.includes(dj.id));
 const verificationBadge = getVerificationStatusBadge(dj.verification_status);
 const publicStageSlug = (dj.stage_slug || dj.stage_name || "")
 .toLowerCase()
 .trim()
 .replace(/\s+/g, "-")
 .replace(/[^a-z0-9-]/g, "")
 .replace(/-+/g, "-")
 .replace(/^-|-$/g, "");
 const publicRequestUrl = publicStageSlug
 ? `https://blacklinedj.com/${publicStageSlug}`
 : "";

 return (
 <div
 key={dj.id}
 className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
 >
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
 <div className="flex items-center gap-4">
 {dj.profile_image ? (
 <img
 src={dj.profile_image}
 alt={dj.stage_name}
 className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-purple-600"
 />
 ) : (
 <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-500 text-xs text-center shrink-0">
 No Image
 </div>
 )}

 <div>
 <div className="flex flex-wrap items-center gap-3">
 <h2 className="text-2xl font-bold">{dj.stage_name}</h2>

 <span
 className={`inline-flex items-center border px-3 py-1 rounded-full text-xs font-bold ${verificationBadge.className}`}
 >
 {dj.verification_status === "rejected"
 ? "Rejected - Eligible for Removal"
 : verificationBadge.label}
 </span>
 </div>

 <div className="flex flex-wrap items-center gap-2 mt-3">
 {earnings && (
 <span className="bg-purple-500/10 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-full text-xs font-bold">
 Available: {earnings.currency} {" "}
 {earnings.availableBalance.toFixed(2)}
 </span>
 )}

 <span
 className={`px-3 py-1 rounded-full text-xs font-bold border ${
 dj.is_live
 ? "bg-green-500/10 border-green-500/30 text-green-400"
 : "bg-zinc-800 border-zinc-700 text-zinc-400"
 }`}
 >
 {dj.is_live ? "Live now" : "Offline"}
 </span>

 {hasPendingWithdrawal && (
 <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
 Pending withdrawal
 </span>
 )}

 {hasApprovedWithdrawal && (
 <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold">
 Approved withdrawal
 </span>
 )}
 </div>

 {publicRequestUrl && (
 <p className="text-sm text-purple-400 mt-2 break-all">
 Blackline link:{" "}
 <a
 href={publicRequestUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="hover:text-purple-300 underline underline-offset-4"
 >
 {publicRequestUrl}
 </a>
 </p>
 )}
 </div>
 </div>

 <button
 type="button"
 onClick={() => toggleDjDetails(dj.id, isExpanded)}
 className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-xl font-semibold"
 >
 {isExpanded ? "Hide Details " : "View Details "}
 </button>
 </div>

 {isExpanded && (
 <div className="mt-5 border-t border-zinc-800 pt-5 space-y-5">
 <div className="grid md:grid-cols-2 gap-3">
 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Email</p>
 <p className="font-bold text-white">{dj.email || "No email"}</p>
 </div>


 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Country / Currency</p>
 <p className="font-bold text-white">
 {dj.country || "No country"} ·{" "}
 {dj.preferred_currency || "No currency"}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Payout Email</p>
 <p className="font-bold text-white">
 {dj.payout_email || "Not provided"}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Payout Method</p>
 <p className="font-bold text-white">
 {dj.payout_method || "No payout method"}
 </p>
 </div>
 </div>

 <div className="grid md:grid-cols-2 gap-3">
 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Payout Status</p>
 <p
 className={`font-bold ${
 dj.payout_status === "Active"
 ? "text-green-400"
 : "text-red-400"
 }`}
 >
 {dj.payout_status === "Active"
 ? " Active"
 : " Not Connected"}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Provider</p>
 <p className="font-bold text-white">
 {dj.payout_provider || "Not provided"}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Account Name</p>
 <p className="font-bold text-white">
 {dj.payout_account_name || "Not provided"}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Account Number</p>
 <p className="font-bold text-white">
 {dj.payout_account_number || "Not provided"}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 md:col-span-2">
 <p className="text-xs text-zinc-500">Paystack Recipient Code</p>
 <p className="font-bold text-zinc-300">
 {dj.paystack_recipient_code || "Not created yet"}
 </p>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-3">
 {dj.verification_status !== "verified" &&
 dj.verification_status !== "removed" && (
 <button
 disabled={actionLoadingId === dj.id}
 onClick={() =>
 setConfirmAction({
 kind: "dj",
 id: dj.id,
 status: "verified",
 title: "Verify DJ",
 message: `Are you sure you want to verify ${dj.stage_name}?`,
 confirmText: "Verify DJ",
 buttonClass: "bg-green-600 hover:bg-green-700",
 })
 }
 className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl disabled:opacity-50"
 >
 Verify
 </button>
 )}

 {dj.verification_status !== "rejected" &&
 dj.verification_status !== "removed" && (
 <button
 disabled={actionLoadingId === dj.id}
 onClick={() =>
 setConfirmAction({
 kind: "dj",
 id: dj.id,
 status: "rejected",
 title: dj.is_live ? "Reject Live DJ" : "Reject DJ",
 message: `Are you sure you want to reject ${dj.stage_name}?`,
 warning: dj.is_live
 ? "This DJ is currently live. Rejecting them will force them offline immediately and close paid requests on their public page."
 : "Rejected DJs cannot go live or take paid requests until Blackline approves them again.",
 confirmText: dj.is_live ? "Reject and Force Offline" : "Reject DJ",
 buttonClass: "bg-red-600 hover:bg-red-700",
 })
 }
 className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl disabled:opacity-50"
 >
 Reject
 </button>
 )}

 {dj.verification_status !== "pending" &&
 dj.verification_status !== "not_started" &&
 dj.verification_status !== "removed" && (
 <button
 disabled={actionLoadingId === dj.id}
 onClick={() =>
 setConfirmAction({
 kind: "dj",
 id: dj.id,
 status: "pending",
 title: "Mark DJ as Pending",
 message: `Are you sure you want to mark ${dj.stage_name} as pending verification?`,
 confirmText: "Mark Pending",
 buttonClass: "bg-yellow-500 hover:bg-yellow-600 text-black",
 })
 }
 className="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 rounded-xl disabled:opacity-50"
 >
 Mark Pending
 </button>
 )}

 {dj.verification_status === "removed" && (
 <button
 disabled={actionLoadingId === dj.id}
 onClick={() =>
 setConfirmAction({
 kind: "dj",
 id: dj.id,
 status: "pending",
 title: "Restore DJ",
 message: `Restore ${dj.stage_name} back to pending verification?`,
 confirmText: "Restore DJ",
 buttonClass: "bg-yellow-500 hover:bg-yellow-600 text-black",
 })
 }
 className="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 rounded-xl disabled:opacity-50"
 >
 Restore DJ
 </button>
 )}

 {dj.verification_status === "rejected" && (
 <button
 disabled={actionLoadingId === dj.id}
 onClick={() =>
 setConfirmAction({
 kind: "dj",
 id: dj.id,
 status: "removed",
 title: "Remove DJ from Blackline",
 message: `This will hide ${dj.stage_name} from the normal Blackline admin dashboard and disable their live page. You should only do this if Blackline does not want to work with this DJ.`,
 confirmText: "Remove DJ",
 buttonClass: "bg-red-900 hover:bg-red-800 border border-red-500 text-red-200",
 })
 }
 className="md:ml-auto bg-red-900 hover:bg-red-800 border border-red-500 text-red-200 px-4 py-2 rounded-xl disabled:opacity-50"
 >
 Remove DJ
 </button>
 )}
 </div>

 {earnings && dj.verification_status !== "rejected" && (
 <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Gross</p>
 <p className="font-black text-green-400">
 {earnings.currency} {earnings.grossRevenue.toFixed(2)}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">DJ Earnings</p>
 <p className="font-black text-cyan-400">
 {earnings.currency} {earnings.djRevenue.toFixed(2)}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Platform Fee</p>
 <p className="font-black text-zinc-300">
 {earnings.currency} {earnings.platformRevenue.toFixed(2)}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Withdrawals</p>
 <p className="font-black text-yellow-400">
 {earnings.currency} {earnings.totalWithdrawals.toFixed(2)}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Available</p>
 <p className="font-black text-purple-400">
 {earnings.currency} {earnings.availableBalance.toFixed(2)}
 </p>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 );
 }

 function renderDjGroup(
 groupId: string,
 title: string,
 subtitle: string,
 items: DJ[],
 ) {
 const isCollapsed = djSearch.trim() ? false : collapsedDjGroups.includes(groupId);
 const isPriorityEmptyGroup =
 groupId === "pending" || groupId === "withdrawal-action";

 if (items.length === 0 && isPriorityEmptyGroup) {
 return (
 <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
 <div className="flex items-center justify-between gap-3">
 <div>
 <h3 className="text-lg font-black text-white">{title} (0)</h3>
 <p className="text-sm text-zinc-500 mt-1">Nothing needs attention here right now.</p>
 </div>

 <span className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold shrink-0">
 Clear
 </span>
 </div>
 </div>
 );
 }

 return (
 <div className="bg-black/30 border border-zinc-800 rounded-3xl overflow-hidden">
 <button
 type="button"
 onClick={() => toggleDjGroup(groupId)}
 className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-5 text-left hover:bg-zinc-900 transition"
 >
 <div>
 <h3 className="text-xl font-black text-white">
 {title} ({items.length})
 </h3>
 <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
 </div>

 <span className="bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-xl text-sm font-bold">
 {isCollapsed ? "Show " : "Hide "}
 </span>
 </button>

 {!isCollapsed && (
 <div className="border-t border-zinc-800 p-4 space-y-4">
 {items.length === 0 ? (
 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
 <p className="text-zinc-500">No DJs in this group.</p>
 </div>
 ) : (
 items.map((dj) => renderDjCard(dj))
 )}
 </div>
 )}
 </div>
 );
 }

 function exportWithdrawalsCSV() {
 const headers = [
 "DJ Name",
 "Amount",
 "Currency",
 "Payout Method",
 "Provider",
 "Account Name",
 "Account Number",
 "Status",
 "Requested At",
 ];

 const rows = sortedWithdrawals.map((withdrawal) => [
 withdrawal.dj_name || "",
 withdrawal.amount,
 withdrawal.currency || "",
 withdrawal.payout_method || "",
 withdrawal.provider || "",
 withdrawal.account_name || "",
 withdrawal.account_number || "",
 withdrawal.status || "",
 withdrawal.created_at
 ? new Date(withdrawal.created_at).toLocaleString()
 : "",
 ]);

 const csvContent = [headers, ...rows]
 .map((row) =>
 row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
 )
 .join("\n");

 const blob = new Blob([csvContent], {
 type: "text/csv;charset=utf-8;",
 });

 const url = URL.createObjectURL(blob);

 const link = document.createElement("a");
 link.href = url;
 link.download = `blackline-withdrawals-${
 new Date().toISOString().split("T")[0]
 }.csv`;

 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);

 URL.revokeObjectURL(url);
 }

 if (loading) {
 return (
 <main className="min-h-screen bg-black text-white flex items-center justify-center">
 Loading verification dashboard...
 </main>
 );
 }

 return (
 <main className="min-h-screen bg-black text-white px-4 py-6 md:p-6">
 <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
 <div>
 <h1 className="text-4xl md:text-5xl font-black text-purple-500 mb-3">
 Blackline Admin Dashboard
 </h1>

 <p className="text-zinc-400">
 Manage DJ verification, bookings, earnings, payouts, and withdrawal activity.
 </p>
 </div>

 {signOutAction && (
 <form action={signOutAction} className="shrink-0">
 <button
 type="submit"
 className="bg-zinc-900 hover:bg-red-950 border border-zinc-700 hover:border-red-500 text-zinc-200 hover:text-red-200 px-4 py-3 rounded-xl text-sm font-bold transition"
 >
 Sign out
 </button>
 </form>
 )}
 </div>

 {connectionWarning && (
 <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-100">
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div>
 <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
 Connection Notice
 </p>
 <p className="mt-2 text-sm font-semibold text-yellow-100">
 {connectionWarning}
 </p>
 <p className="mt-1 text-xs text-yellow-200/70">
 No action is needed if your laptop just woke up. The dashboard retries automatically.
 </p>
 </div>

 <button
 type="button"
 onClick={() => fetchDashboardData()}
 className="self-start rounded-xl border border-yellow-500/40 bg-black/30 px-4 py-2 text-sm font-black text-yellow-100 hover:bg-yellow-500/10 md:self-center"
 >
 Retry now
 </button>
 </div>
 </div>
 )}

 {adminActionCount > 0 ? (
 <div className="mb-6 border rounded-3xl p-5 bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_35px_rgba(250,204,21,0.18)]">
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
 <div>
 <p className="text-xs uppercase tracking-[0.25em] font-black text-yellow-400">
 Action Needed
 </p>

 <h2 className="text-2xl md:text-3xl font-black text-white mt-2">
 {adminActionCount} item{adminActionCount === 1 ? "" : "s"} need review
 </h2>

 <p className="text-sm text-zinc-400 mt-2">
 {pendingCount} DJs pending · {withdrawalActionCount} withdrawals pending/approved · {bookingActionCount} bookings need attention
 </p>
 </div>

 <div className="flex flex-col sm:flex-row gap-3">
 <a
 href="#dj-verification-management"
 className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-xl text-sm font-bold text-center"
 >
 Review DJs
 </a>

 <a
 href="#withdrawal-requests"
 className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-xl text-sm font-bold text-center"
 >
 Review Withdrawals
 </a>

 <a
 href="#booking-marketplace"
 className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 px-4 py-3 rounded-xl text-sm font-bold text-center text-amber-200"
 >
 Review Bookings
 </a>
 </div>
 </div>
 </div>
 ) : (
 <div className="mb-6 border border-green-500/30 bg-green-500/10 rounded-2xl p-4">
 <div className="flex items-center justify-between gap-4">
 <div>
 <p className="text-xs uppercase tracking-[0.25em] font-black text-green-400">
 Action Needed
 </p>

 <h2 className="text-xl font-black text-white mt-1">All clear</h2>
 </div>

 <span className="shrink-0 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-xs font-black">
 0 pending
 </span>
 </div>

 <p className="text-sm text-zinc-400 mt-2">
 0 DJs pending · 0 withdrawals pending/approved · 0 bookings need attention
 </p>
 </div>
 )}

 <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-10">
 <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
 <div>
 <p className="text-xs uppercase tracking-[0.25em] text-purple-400 font-black">
 Dashboard Summary
 </p>
 <h2 className="text-2xl font-black mt-1">Blackline overview</h2>
 </div>

 <span className="bg-black/40 border border-zinc-800 rounded-full px-4 py-2 text-xs text-zinc-400 font-bold">
 {totalCount} active DJs
 </span>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 <div className="bg-black/40 border border-zinc-800 rounded-2xl p-3">
 <p className="text-zinc-500 text-xs">Pending DJs</p>
 <p className="text-2xl font-black text-yellow-400">{pendingCount}</p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-2xl p-3">
 <p className="text-zinc-500 text-xs">Verified DJs</p>
 <p className="text-2xl font-black text-green-400">{verifiedCount}</p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-2xl p-3">
 <p className="text-zinc-500 text-xs">Pending withdrawals</p>
 <p className="text-2xl font-black text-yellow-400">{pendingWithdrawals}</p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-2xl p-3">
 <p className="text-zinc-500 text-xs">Approved withdrawals</p>
 <p className="text-2xl font-black text-cyan-400">{approvedWithdrawals}</p>
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
 <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3">
 <p className="text-amber-200/70 text-xs">Pending bookings</p>
 <p className="text-2xl font-black text-amber-300">{pendingBookingCount}</p>
 </div>

 <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-3">
 <p className="text-cyan-200/70 text-xs">Awaiting payment</p>
 <p className="text-2xl font-black text-cyan-300">{acceptedAwaitingPaymentCount}</p>
 </div>

 <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-3">
 <p className="text-green-200/70 text-xs">Paid bookings</p>
 <p className="text-2xl font-black text-green-300">{paidBookingCount}</p>
 </div>

 <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-3">
 <p className="text-purple-200/70 text-xs">Booking commission</p>
 <p className="text-2xl font-black text-purple-300">
 {dashboardCurrency} {totalBookingCommission.toFixed(2)}
 </p>
 </div>
 </div>

 <details className="mt-4 bg-black/30 border border-zinc-800 rounded-2xl p-4">
 <summary className="cursor-pointer text-sm font-bold text-zinc-300">
 Revenue details
 </summary>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-zinc-500 text-xs">Gross revenue</p>
 <p className="font-black text-green-400">
 {dashboardCurrency} {totalGrossRevenue.toFixed(2)}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-zinc-500 text-xs">Platform revenue</p>
 <p className="font-black text-purple-400">
 {dashboardCurrency} {totalPlatformRevenue.toFixed(2)}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-zinc-500 text-xs">DJ earnings</p>
 <p className="font-black text-cyan-400">
 {dashboardCurrency} {totalDjRevenue.toFixed(2)}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-zinc-500 text-xs">Available balances</p>
 <p className="font-black text-yellow-400">
 {dashboardCurrency} {totalAvailableBalance.toFixed(2)}
 </p>
 </div>
 </div>
 </details>
 </div>

 <section id="booking-marketplace" className="mb-14 scroll-mt-6">
 <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl p-5 shadow-[0_0_35px_rgba(251,191,36,0.1)]">
 <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
 <div>
 <p className="text-xs uppercase tracking-[0.25em] text-amber-400 font-black">
 Booking Marketplace
 </p>
 <h2 className="text-3xl font-black mt-2">Booking Requests</h2>
 <p className="text-zinc-400 text-sm mt-2">
 Monitor every client request, DJ response, payment, and Blackline commission.
 </p>
 </div>

 <div className="flex flex-wrap gap-2">
 <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-3 py-2 rounded-full text-xs font-black">
 {pendingBookingCount} pending
 </span>
 <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-3 py-2 rounded-full text-xs font-black">
 {acceptedAwaitingPaymentCount} awaiting payment
 </span>
 <span className="bg-green-500/10 border border-green-500/30 text-green-300 px-3 py-2 rounded-full text-xs font-black">
 {paidBookingCount} paid
 </span>
 </div>
 </div>

 {bookingRequests.length === 0 ? (
 <div className="bg-black/30 border border-zinc-800 rounded-2xl p-6 text-center">
 <div className="text-3xl mb-3">📭</div>
 <p className="font-bold text-white">No booking requests yet</p>
 <p className="text-sm text-zinc-500 mt-2">
 Marketplace bookings will appear here automatically.
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 {bookingRequests.map((booking) => {
 const djForBooking = djs.find((dj) => dj.id === booking.dj_id);
 const bookingStatus = String(booking.status || "pending").toLowerCase();
 const paymentStatus = String(
 booking.payment_status || "unpaid",
 ).toLowerCase();

 const bookingStatusClass =
 bookingStatus === "pending"
 ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
 : bookingStatus === "accepted"
 ? "border-green-500/30 bg-green-500/10 text-green-300"
 : bookingStatus === "rejected" || bookingStatus === "cancelled"
 ? "border-red-500/30 bg-red-500/10 text-red-300"
 : "border-purple-500/30 bg-purple-500/10 text-purple-300";

 const paymentStatusClass =
 paymentStatus === "paid"
 ? "border-green-500/30 bg-green-500/10 text-green-300"
 : paymentStatus === "pending"
 ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
 : paymentStatus === "failed" || paymentStatus === "refunded"
 ? "border-red-500/30 bg-red-500/10 text-red-300"
 : "border-zinc-700 bg-zinc-800/70 text-zinc-300";

 return (
 <article
 key={booking.id}
 className="bg-black/30 border border-zinc-800 rounded-2xl p-4 md:p-5 hover:border-amber-500/30 transition"
 >
 <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
 <div>
 <div className="flex flex-wrap items-center gap-3">
 <h3 className="text-xl font-black text-white">
 {booking.name || "Unnamed client"}
 </h3>
 <span className={`border px-3 py-1 rounded-full text-xs font-black uppercase ${bookingStatusClass}`}>
 {bookingStatus.replace(/_/g, " ")}
 </span>
 <span className={`border px-3 py-1 rounded-full text-xs font-black uppercase ${paymentStatusClass}`}>
 Payment: {paymentStatus.replace(/_/g, " ")}
 </span>
 </div>

 <p className="text-amber-300 font-bold mt-2">
 {booking.event_type || "Event type not provided"}
 </p>
 <p className="text-sm text-zinc-400 mt-1">
 DJ: <span className="text-white font-bold">{djForBooking?.stage_name || `DJ #${booking.dj_id}`}</span>
 </p>
 <p className="text-xs text-zinc-600 mt-2">
 Booking #{booking.id} ·{" "}
 {booking.created_at
 ? new Date(booking.created_at).toLocaleString()
 : "Unknown date"}
 </p>
 </div>

 <div className="grid grid-cols-2 gap-2 min-w-[260px]">
 <div className="bg-black/50 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Client budget</p>
 <p className="font-black text-amber-300 mt-1">{booking.budget || "Not provided"}</p>
 </div>
 <div className="bg-black/50 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Agreed amount</p>
 <p className="font-black text-white mt-1">
 {booking.agreed_amount != null
 ? `${booking.currency || dashboardCurrency} ${Number(booking.agreed_amount).toFixed(2)}`
 : "Not set"}
 </p>
 </div>
 </div>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Event date</p>
 <p className="font-semibold text-white mt-1">
 {booking.event_date
 ? new Date(`${booking.event_date}T00:00:00`).toLocaleDateString()
 : "Not provided"}
 </p>
 </div>
 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Venue</p>
 <p className="font-semibold text-white mt-1 break-words">{booking.venue || "Not provided"}</p>
 </div>
 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Client email</p>
 {booking.email ? (
 <a href={`mailto:${booking.email}`} className="font-semibold text-cyan-300 mt-1 block break-all">
 {booking.email}
 </a>
 ) : (
 <p className="text-zinc-500 mt-1">Not provided</p>
 )}
 </div>
 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Client phone</p>
 {booking.phone ? (
 <a href={`tel:${booking.phone}`} className="font-semibold text-cyan-300 mt-1 block">
 {booking.phone}
 </a>
 ) : (
 <p className="text-zinc-500 mt-1">Not provided</p>
 )}
 </div>
 </div>

 {booking.message && (
 <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 mt-3">
 <p className="text-xs uppercase tracking-wider text-zinc-500 font-black">Client message</p>
 <p className="text-zinc-300 mt-2 whitespace-pre-wrap">{booking.message}</p>
 </div>
 )}

 <div className="grid sm:grid-cols-3 gap-3 mt-3">
 <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
 <p className="text-xs text-purple-200/70">Commission rate</p>
 <p className="font-black text-purple-300 mt-1">
 {Number(booking.commission_rate ?? 10).toFixed(2)}%
 </p>
 </div>
 <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
 <p className="text-xs text-purple-200/70">Blackline commission</p>
 <p className="font-black text-purple-300 mt-1">
 {booking.commission_amount != null
 ? `${booking.currency || dashboardCurrency} ${Number(booking.commission_amount).toFixed(2)}`
 : "Calculated after payment"}
 </p>
 </div>
 <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
 <p className="text-xs text-cyan-200/70">DJ net amount</p>
 <p className="font-black text-cyan-300 mt-1">
 {booking.dj_net_amount != null
 ? `${booking.currency || dashboardCurrency} ${Number(booking.dj_net_amount).toFixed(2)}`
 : "Calculated after payment"}
 </p>
 </div>
 </div>

 {booking.payment_reference && (
 <p className="text-xs text-zinc-500 mt-3 break-all">
 Payment reference: <span className="font-mono text-zinc-300">{booking.payment_reference}</span>
 </p>
 )}
 </article>
 );
 })}
 </div>
 )}
 </div>
 </section>

 <section className="mb-14">
 <div className="bg-zinc-900 border border-purple-900/60 rounded-2xl overflow-hidden">
 <button
 type="button"
 onClick={() =>
 setIsRecentActivityCollapsed((currentValue) => !currentValue)
 }
 className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-5 text-left hover:bg-purple-950/20 transition"
 >
 <div>
 <h2 className="text-3xl font-black">Recent Activity</h2>
 <p className="text-zinc-500 text-sm mt-1">
 Latest DJ verification, booking, and withdrawal changes.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-3">
 <span className="text-sm text-zinc-500">
 Showing latest {auditLogs.length} entries
 </span>

 <span className="bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-xl text-sm font-bold">
 {isRecentActivityCollapsed ? "Show " : "Hide "}
 </span>
 </div>
 </button>

 {!isRecentActivityCollapsed && (
 <div className="border-t border-zinc-800">
 {auditLogs.length === 0 ? (
 <div className="p-5">
 <p className="text-zinc-500">No activity recorded yet.</p>
 </div>
 ) : (
 <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800">
 {auditLogs.map((log) => (
 <div
 key={log.id}
 className="p-5 hover:bg-purple-950/20 transition"
 >
 <div className="flex items-start gap-4">
 <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-600/40 flex items-center justify-center shrink-0">
 {auditLogIcon(log.entity_type)}
 </div>

 <div className="flex-1">
 <p className="text-white font-bold leading-relaxed">
 {log.description}
 </p>

 <p className="text-sm text-zinc-500 mt-2">
 {log.created_at
 ? new Date(log.created_at).toLocaleString()
 : "Unknown time"}
 </p>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </section>

 <section id="dj-verification-management" className="mb-14 scroll-mt-6">
 <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
 <div>
 <h2 className="text-3xl font-black">DJ Verification Management</h2>
 <p className="text-zinc-500 text-sm mt-1">
 Priority DJs stay visible. Lower-priority and removed DJs stay tucked away.
 </p>
 </div>

 <p className="text-sm text-zinc-500">
 {djSearch.trim()
 ? `Showing ${filteredDjDirectoryCount} of ${totalDjDirectoryCount} DJs`
 : `Showing ${activeDjs.length} active DJs`}
 </p>
 </div>

 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
 <label className="block text-xs uppercase tracking-[0.25em] text-purple-400 font-black mb-3">
 Search DJs
 </label>

 <div className="flex flex-col md:flex-row gap-3">
 <input
 type="text"
 placeholder="Search DJ name, email, country, link, status..."
 value={djSearch}
 onChange={(event) => setDjSearch(event.target.value)}
 className="w-full p-3 rounded-2xl bg-zinc-800 border-2 border-purple-500 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
 />

 {djSearch.trim() && (
 <button
 type="button"
 onClick={() => setDjSearch("")}
 className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-3 rounded-xl text-sm font-bold text-zinc-200"
 >
 Clear
 </button>
 )}
 </div>

 <p className="text-xs text-zinc-500 mt-3">
 Searches DJ name, email, country, currency, Blackline link, payout details, live/offline state, and verification status.
 </p>
 </div>

 {djSearch.trim() && filteredDjDirectoryCount === 0 && (
 <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-5">
 <p className="text-red-300 font-bold">No DJs match “{djSearch}”.</p>
 <p className="text-zinc-500 text-sm mt-1">Try searching by DJ name, email, country, link slug, or verification status.</p>
 </div>
 )}

 <div className="space-y-5">
 {renderDjGroup(
 "pending",
 " Pending Verification",
 "New DJs waiting for Blackline approval.",
 pendingVerificationDjs,
 )}

 {renderDjGroup(
 "withdrawal-action",
 " Withdrawal Action Required",
 "DJs with pending or approved withdrawals that need attention.",
 withdrawalActionDjs,
 )}

 {renderDjGroup(
 "other",
 " Other DJs",
 "Verified, rejected, or not-started DJs with no current withdrawal action required.",
 otherDjs,
 )}

 {renderDjGroup(
 "removed",
 " Removed DJs",
 "Hidden DJs kept for audit history and possible restoration.",
 filteredRemovedDjs,
 )}
 </div>
 </section>

 <section id="withdrawal-requests" className="scroll-mt-6">
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
 <div>
 <h2 className="text-3xl font-black">Withdrawal Requests</h2>
 <p className="text-sm text-zinc-500 mt-1">
 One compact card per DJ. Open a DJ to view all their withdrawal requests, newest first.
 </p>
 </div>

 <button
 onClick={exportWithdrawalsCSV}
 className="self-start bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-xl text-sm font-bold text-zinc-200"
 >
 Export CSV
 </button>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
 <p className="text-zinc-400 text-xs">Pending</p>
 <p className="text-2xl font-black text-yellow-400">
 {pendingWithdrawals}
 </p>
 </div>

 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
 <p className="text-zinc-400 text-xs">Approved</p>
 <p className="text-2xl font-black text-cyan-400">
 {approvedWithdrawals}
 </p>
 </div>

 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
 <p className="text-zinc-400 text-xs">Paid</p>
 <p className="text-2xl font-black text-green-400">
 {paidWithdrawals}
 </p>
 </div>

 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
 <p className="text-zinc-400 text-xs">Rejected</p>
 <p className="text-2xl font-black text-red-400">
 {rejectedWithdrawals}
 </p>
 </div>
 </div>

 <input
 type="text"
 placeholder=" Search DJ withdrawals..."
 value={withdrawalSearch}
 onChange={(e) => setWithdrawalSearch(e.target.value)}
 className="w-full p-3 rounded-2xl bg-zinc-800 border-2 border-purple-500 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-5"
 />

 <div className="max-h-[850px] overflow-y-auto space-y-4 pr-2">
 {withdrawalGroups.length === 0 && (
 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
 <p className="text-zinc-500">No withdrawal requests yet.</p>
 </div>
 )}

 {withdrawalGroups.map((group) => {
 const latestWithdrawal = group.latestWithdrawal;
 const latestCurrency = latestWithdrawal?.currency || "GHS";
 const isDetailsOpen =
 expandedWithdrawalDjKeys.includes(group.key) ||
 (group.hasActionRequired &&
 !collapsedWithdrawalDjKeys.includes(group.key));
 const withdrawalDj = djs.find(
 (dj) =>
 dj.id === group.djId ||
 dj.stage_name?.toLowerCase() === group.djName.toLowerCase(),
 );
 const withdrawalEarnings = djEarnings.find(
 (item) =>
 item.dj_id === group.djId ||
 item.stage_name?.toLowerCase() === group.djName.toLowerCase(),
 );

 return (
 <div
 key={group.key}
 className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
 >
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
 <div className="flex items-center gap-4">
 {withdrawalDj?.profile_image ? (
 <img
 src={withdrawalDj.profile_image}
 alt={group.djName}
 className="w-16 h-16 rounded-full object-cover border-2 border-purple-600 shrink-0"
 />
 ) : (
 <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-500 text-xs text-center shrink-0">
 No Image
 </div>
 )}

 <div>
 <h3 className="text-2xl font-bold">{group.djName}</h3>

 <div className="flex flex-wrap items-center gap-2 mt-2">
 {latestWithdrawal && (
 <span
 className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
 latestWithdrawal.status === "paid"
 ? "bg-green-500/10 border-green-500/30 text-green-400"
 : latestWithdrawal.status === "approved"
 ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
 : latestWithdrawal.status === "rejected"
 ? "bg-red-500/10 border-red-500/30 text-red-400"
 : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
 }`}
 >
 Latest: {withdrawalStatusLabel(latestWithdrawal.status)}
 </span>
 )}

 {group.hasActionRequired && (
 <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
 Action required
 </span>
 )}
 </div>

 <div className="flex flex-wrap gap-2 mt-3">
 <span className="bg-black/40 border border-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-300 font-bold">
 {group.withdrawals.length} withdrawal{group.withdrawals.length === 1 ? "" : "s"}
 </span>

 <span className="bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full text-xs text-green-400 font-bold">
 Total withdrawn: {latestCurrency} {group.paidTotal.toFixed(2)}
 </span>

 <span className="bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-xs text-purple-300 font-bold">
 Total requested: {latestCurrency} {group.requestedTotal.toFixed(2)}
 </span>

 {withdrawalEarnings && (
 <span className="bg-purple-600/10 border border-purple-500/40 px-3 py-1 rounded-full text-xs text-purple-300 font-bold">
 Available: {withdrawalEarnings.currency}{" "}
 {withdrawalEarnings.availableBalance.toFixed(2)}
 </span>
 )}
 </div>

 <p className="text-xs text-zinc-500 mt-3">
 Latest request: {latestWithdrawal?.created_at
 ? new Date(latestWithdrawal.created_at).toLocaleString()
 : "Unknown"}
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() =>
 toggleWithdrawalDjDetails(group.key, group.hasActionRequired)
 }
 className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-xl font-semibold"
 >
 {isDetailsOpen ? "Hide Details " : "View Details "}
 </button>
 </div>

 {isDetailsOpen && (
 <div className="mt-5 border-t border-zinc-800 pt-5 space-y-4">
 {group.withdrawals.map((withdrawal) => {
 const auditTrail = getWithdrawalAuditLogs(withdrawal.id);
 const timelineKey = `${group.key}-${withdrawal.id}`;
 const isTimelineOpen =
 expandedWithdrawalTimelineKeys.includes(timelineKey);

 return (
 <div
 key={withdrawal.id}
 className="bg-black/30 border border-zinc-800 rounded-2xl p-4"
 >
 <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
 <div>
 <div className="flex flex-wrap items-center gap-3">
 <h4 className="text-xl font-black text-white">
 {withdrawal.currency || "GHS"} {Number(withdrawal.amount || 0).toFixed(2)}
 </h4>

 <span
 className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
 withdrawal.status === "paid"
 ? "bg-green-500/10 border-green-500/30 text-green-400"
 : withdrawal.status === "approved"
 ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
 : withdrawal.status === "rejected"
 ? "bg-red-500/10 border-red-500/30 text-red-400"
 : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
 }`}
 >
 {withdrawalStatusLabel(withdrawal.status)}
 </span>
 </div>

 <p className="text-xs text-zinc-500 mt-2">
 Requested: {withdrawal.created_at
 ? new Date(withdrawal.created_at).toLocaleString()
 : "Unknown"}
 </p>
 </div>

 <div className="flex flex-wrap gap-3">
 {withdrawal.status === "pending" && (
 <>
 <button
 disabled={withdrawalActionLoadingId === withdrawal.id}
 onClick={() =>
 setConfirmAction({
 kind: "withdrawal",
 id: withdrawal.id,
 status: "approved",
 title: "Approve Withdrawal",
 message: `Approve ${
 withdrawal.currency || "GHS"
 } ${withdrawal.amount} withdrawal for ${
 withdrawal.dj_name || "this DJ"
 }?`,
 confirmText: "Approve Withdrawal",
 buttonClass: "bg-cyan-600 hover:bg-cyan-700",
 })
 }
 className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl disabled:opacity-50"
 >
 Approve
 </button>

 <button
 disabled={withdrawalActionLoadingId === withdrawal.id}
 onClick={() =>
 setConfirmAction({
 kind: "withdrawal",
 id: withdrawal.id,
 status: "rejected",
 title: "Reject Withdrawal",
 message: `Are you sure you want to reject this withdrawal request from ${
 withdrawal.dj_name || "this DJ"
 }?`,
 confirmText: "Reject Withdrawal",
 buttonClass: "bg-red-600 hover:bg-red-700",
 })
 }
 className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl disabled:opacity-50"
 >
 Reject
 </button>
 </>
 )}

 {withdrawal.status === "approved" && (
 <>
 <button
 disabled
 title="Automatic Paystack payouts require a Registered Business account."
 className="bg-zinc-700 text-zinc-400 px-4 py-2 rounded-xl opacity-60 cursor-not-allowed"
 >
  Pay Now Coming Soon
 </button>

 <button
 disabled={withdrawalActionLoadingId === withdrawal.id}
 onClick={() =>
 setConfirmAction({
 kind: "withdrawal",
 id: withdrawal.id,
 status: "paid",
 title: "Mark Withdrawal as Paid",
 message: `Only mark this as paid after ${
 withdrawal.dj_name || "the DJ"
 } has actually received ${
 withdrawal.currency || "GHS"
 } ${withdrawal.amount} manually.`,
 confirmText: "Mark Paid Manually",
 buttonClass: "bg-green-600 hover:bg-green-700",
 })
 }
 className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl disabled:opacity-50"
 >
 Mark Paid Manually
 </button>

 <button
 disabled={withdrawalActionLoadingId === withdrawal.id}
 onClick={() =>
 setConfirmAction({
 kind: "withdrawal",
 id: withdrawal.id,
 status: "rejected",
 title: "Reject Withdrawal",
 message: `Are you sure you want to reject this withdrawal request from ${
 withdrawal.dj_name || "this DJ"
 }?`,
 confirmText: "Reject Withdrawal",
 buttonClass: "bg-red-600 hover:bg-red-700",
 })
 }
 className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl disabled:opacity-50"
 >
 Reject
 </button>

 <button
 disabled={withdrawalActionLoadingId === withdrawal.id}
 onClick={() =>
 setConfirmAction({
 kind: "withdrawal",
 id: withdrawal.id,
 status: "pending",
 title: "Mark Withdrawal as Pending",
 message:
 "Are you sure you want to move this withdrawal request back to pending?",
 confirmText: "Mark Pending",
 buttonClass: "bg-zinc-700 hover:bg-zinc-600",
 })
 }
 className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:opacity-50"
 >
 Mark Pending
 </button>
 </>
 )}

 {withdrawal.status === "paid" && (
 <span className="bg-green-600/20 text-green-400 px-4 py-2 rounded-xl font-semibold">
  Paid
 </span>
 )}

 {withdrawal.status === "rejected" && (
 <button
 disabled={withdrawalActionLoadingId === withdrawal.id}
 onClick={() =>
 setConfirmAction({
 kind: "withdrawal",
 id: withdrawal.id,
 status: "pending",
 title: "Mark Withdrawal as Pending",
 message:
 "Are you sure you want to move this withdrawal request back to pending?",
 confirmText: "Mark Pending",
 buttonClass: "bg-zinc-700 hover:bg-zinc-600",
 })
 }
 className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:opacity-50"
 >
 Mark Pending
 </button>
 )}
 </div>
 </div>

 <div className="grid md:grid-cols-4 gap-3 mt-4">
 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Method</p>
 <p className="text-zinc-300 font-semibold">
 {withdrawal.payout_method || "Not provided"}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Provider</p>
 <p className="text-zinc-300 font-semibold">
 {withdrawal.provider || "Not provided"}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Account Name</p>
 <p className="text-zinc-300 font-semibold">
 {withdrawal.account_name || "Not provided"}
 </p>
 </div>

 <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
 <p className="text-xs text-zinc-500">Account Number</p>
 <p className="text-zinc-300 font-semibold">
 {withdrawal.account_number || "Not provided"}
 </p>
 </div>
 </div>

 <div className="mt-4 bg-black/40 border border-zinc-800 rounded-xl p-4">
 <button
 type="button"
 onClick={() => toggleWithdrawalTimeline(timelineKey)}
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
 No status activity yet.
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
 {log.description}
 </p>

 <p className="text-xs text-zinc-600 mt-1">
 {log.created_at
 ? new Date(
 log.created_at,
 ).toLocaleString()
 : "Unknown time"}
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
 );
 })}
 </div>
 </section>

 {confirmAction && (
 <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
 <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-full max-w-md">
 <h2 className="text-2xl font-black text-white mb-3">
 {confirmAction.title}
 </h2>

 <p className="text-zinc-400 mb-4 leading-relaxed">
 {confirmAction.message}
 </p>

 {confirmAction.warning && (
 <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
 <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
 Important
 </p>
 <p className="mt-2 text-sm font-semibold leading-relaxed text-red-100">
 {confirmAction.warning}
 </p>
 </div>
 )}

 <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
 <button
 type="button"
 disabled={confirmLoading}
 onClick={() => setConfirmAction(null)}
 className="px-5 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 font-bold disabled:opacity-50"
 >
 Cancel
 </button>

 <button
 type="button"
 disabled={confirmLoading}
 onClick={handleConfirmAction}
 className={`px-5 py-3 rounded-xl font-bold disabled:opacity-50 ${confirmAction.buttonClass}`}
 >
 {confirmLoading ? "Processing..." : confirmAction.confirmText}
 </button>
 </div>
 </div>
 </div>
 )}
 </main>
 );
}
