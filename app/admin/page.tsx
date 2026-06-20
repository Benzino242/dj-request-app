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

  const [language, setLanguage] = useState<Language>("en");

  const t = translations[language];

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
  const previousRequestCountRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const scrollStorageKey = "blackline-dj-admin-scroll-y";

  function saveDashboardScrollPosition() {
    if (typeof window === "undefined") return;

    lastScrollYRef.current = window.scrollY;
    window.sessionStorage.setItem(scrollStorageKey, String(window.scrollY));
  }

  function restoreSavedDashboardScrollPosition() {
    if (typeof window === "undefined") return;

    const savedScroll = Number(
      window.sessionStorage.getItem(scrollStorageKey) || lastScrollYRef.current || 0
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
      const response = await fetch(`/api/paystack/banks?currency=${currencyCode}`);
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

      alert(`Payout account connected. Recipient code: ${result.recipientCode}`);
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
        .contains("metadata", { dj_id: activeDj.id })
        .order("created_at", { ascending: false })
        .limit(20);

      setRequests((requestsData || []) as SongRequest[]);
      setPayments((paymentsData || []) as Payment[]);
      setWithdrawals((withdrawalsData || []) as Withdrawal[]);
      setAuditLogs((auditLogsData || []) as AuditLog[]);
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
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
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
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "requests",
        filter: `dj_id=eq.${activeDj.id}`,
      },
      () => refreshDashboardIfVisible()
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
        () => refreshDashboardIfVisible()
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
        () => refreshDashboardIfVisible()
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
        () => refreshDashboardIfVisible()
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
      (request) => request.id === requestId
    );

    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

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
        "You already have a pending or approved withdrawal request. Please wait until it is paid or rejected before creating a new one."
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
      alert("Please connect your payout account before requesting a withdrawal.");
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
    0
  );

  const netEarnings = payments.reduce(
    (sum, payment) => sum + Number(payment.dj_amount || 0),
    0
  );

  const serviceFees = payments.reduce(
    (sum, payment) => sum + Number(payment.platform_fee || 0),
    0
  );

  const pendingPayouts = payments.filter(
    (payment) => payment.payout_status === "pending"
  ).length;

  const vipRequests = requests.filter((r) => r.tip_amount >= 50).length;

  const totalWithdrawals = withdrawals
    .filter((item) => ["pending", "approved", "paid"].includes(item.status))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const hasOpenWithdrawal = withdrawals.some(
      (withdrawal) =>
        withdrawal.status === "pending" ||
        withdrawal.status === "approved"
    );

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
        className={`border rounded-3xl p-4 md:p-6 mb-10 ${
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
  className="grid md:grid-cols-2 gap-8 mb-10"
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

      <div className="mb-12">
        <QRCodeBox stageName={dj.stage_name} t={t} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10">
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

              <option value="Ghana">🇬🇭 Ghana</option>
              <option value="Nigeria">🇳🇬 Nigeria</option>
              <option value="Kenya">🇰🇪 Kenya</option>
              <option value="South Africa">🇿🇦 South Africa</option>

              <option value="United Kingdom">🇬🇧 United Kingdom</option>
              <option value="United States">🇺🇸 United States</option>
              <option value="Canada">🇨🇦 Canada</option>

              <option value="Germany">🇩🇪 Germany</option>
              <option value="France">🇫🇷 France</option>
              <option value="Spain">🇪🇸 Spain</option>
              <option value="Italy">🇮🇹 Italy</option>
              <option value="Netherlands">🇳🇱 Netherlands</option>
              <option value="Poland">🇵🇱 Poland</option>
              <option value="Greece">🇬🇷 Greece</option>
              <option value="Ukraine">🇺🇦 Ukraine</option>
              <option value="Turkey">🇹🇷 Turkey</option>

              <option value="UAE">🇦🇪 UAE</option>
              <option value="Qatar">🇶🇦 Qatar</option>
              <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>

              <option value="Singapore">🇸🇬 Singapore</option>
              <option value="Malaysia">🇲🇾 Malaysia</option>
              <option value="Indonesia">🇮🇩 Indonesia</option>
              <option value="Thailand">🇹🇭 Thailand</option>
              <option value="Philippines">🇵🇭 Philippines</option>
              <option value="Vietnam">🇻🇳 Vietnam</option>
              <option value="China">🇨🇳 China</option>
              <option value="Japan">🇯🇵 Japan</option>
              <option value="South Korea">🇰🇷 South Korea</option>
              <option value="India">🇮🇳 India</option>

              <option value="Australia">🇦🇺 Australia</option>
              <option value="New Zealand">🇳🇿 New Zealand</option>

              <option value="Brazil">🇧🇷 Brazil</option>
              <option value="Mexico">🇲🇽 Mexico</option>
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
              <option value="GHS">🇬🇭 GHS</option>
              <option value="NGN">🇳🇬 NGN</option>
              <option value="KES">🇰🇪 KES</option>
              <option value="ZAR">🇿🇦 ZAR</option>

              <option value="USD">🇺🇸 USD</option>
              <option value="CAD">🇨🇦 CAD</option>
              <option value="MXN">🇲🇽 MXN</option>
              <option value="BRL">🇧🇷 BRL</option>

              <option value="EUR">🇪🇺 EUR</option>
              <option value="GBP">🇬🇧 GBP</option>
              <option value="PLN">🇵🇱 PLN</option>
              <option value="UAH">🇺🇦 UAH</option>
              <option value="TRY">🇹🇷 TRY</option>

              <option value="AED">🇦🇪 AED</option>
              <option value="QAR">🇶🇦 QAR</option>
              <option value="SAR">🇸🇦 SAR</option>

              <option value="SGD">🇸🇬 SGD</option>
              <option value="MYR">🇲🇾 MYR</option>
              <option value="IDR">🇮🇩 IDR</option>
              <option value="THB">🇹🇭 THB</option>
              <option value="PHP">🇵🇭 PHP</option>
              <option value="VND">🇻🇳 VND</option>
              <option value="CNY">🇨🇳 CNY</option>
              <option value="JPY">🇯🇵 JPY</option>
              <option value="KRW">🇰🇷 KRW</option>
              <option value="INR">🇮🇳 INR</option>

              <option value="AUD">🇦🇺 AUD</option>
              <option value="NZD">🇳🇿 NZD</option>
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
                      (bank) => bank.code === selectedCode
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
                  {payoutMethod} • {payoutProvider} • {payoutAccountName}
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
                ? `🟢 ${t.verified}`
                : verificationStatus === "pending"
                ? `🟡 ${t.pendingVerification}`
                : verificationStatus === "rejected"
                ? `🔴 ${t.rejectedVerification}`
                : `⚪ ${t.notStarted}`}
            </p>

            {verificationStatus === "pending" && (
              <p className="mt-3 text-sm text-zinc-400">
                {t.pendingVerificationMessage}
              </p>
            )}

            {verificationStatus === "verified" && (
              <p className="mt-3 text-sm text-green-400">
                {t.verifiedMessage}
              </p>
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

      <div className="mb-10">
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
                  {payoutMethod} • {payoutProvider}
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
                {currency} {(netEarnings - totalWithdrawals).toFixed(2)}
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
                  Connect your payout account with Paystack before requesting a withdrawal.
                </div>
              )}

{hasOpenWithdrawal && (
  <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl p-4 text-sm">
    You already have a pending or approved withdrawal request. New withdrawal requests are locked until the current request is paid or rejected.
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

          <div className="space-y-4">
            {withdrawals.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <p className="text-zinc-500">{t.noWithdrawalRequestsYet}</p>
              </div>
            )}

            {withdrawals.map((withdrawal) => {
              const statusBadge =
                withdrawal.status === "pending"
                  ? {
                      label: "🟡 Pending",
                      className:
                        "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
                    }
                  : withdrawal.status === "approved"
                  ? {
                      label: "🔵 Approved",
                      className:
                        "bg-blue-500/10 border-blue-500/30 text-blue-400",
                    }
                  : withdrawal.status === "paid"
                  ? {
                      label: "🟢 Paid",
                      className:
                        "bg-green-500/10 border-green-500/30 text-green-400",
                    }
                  : withdrawal.status === "rejected"
                  ? {
                      label: "🔴 Rejected",
                      className:
                        "bg-red-500/10 border-red-500/30 text-red-400",
                    }
                  : {
                      label: withdrawal.status,
                      className:
                        "bg-zinc-500/10 border-zinc-500/30 text-zinc-400",
                    };

              return (
                <div
                  key={withdrawal.id}
                  className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold">
                          {withdrawal.currency}{" "}
                          {Number(withdrawal.amount || 0).toFixed(2)}
                        </h3>

                        <span
                          className={`inline-flex items-center border px-3 py-1 rounded-full text-xs font-bold uppercase ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      <p className="text-zinc-400 mt-3">
                        {withdrawal.payout_method || "Bank Transfer"} •{" "}
                        {withdrawal.provider || "No provider"}
                      </p>

                      <p className="text-sm text-zinc-500 mt-2">
                        Account name:{" "}
                        <span className="text-zinc-300">
                          {withdrawal.account_name || "No account name"}
                        </span>
                      </p>

                      <p className="text-sm text-zinc-500 mt-1">
                        Account number:{" "}
                        <span className="text-zinc-300">
                          {withdrawal.account_number || "No account number"}
                        </span>
                      </p>
                    </div>

                    <div className="md:text-right">
                      <p className="text-xs text-zinc-500">Requested on</p>
                      <p className="text-sm text-zinc-300 mt-1">
                        {withdrawal.created_at
                          ? new Date(withdrawal.created_at).toLocaleString()
                          : "No date"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 border-t border-zinc-800 pt-6">
            <h3 className="text-2xl font-bold text-purple-400 mb-4">
              DJ Activity History
            </h3>

            <div className="space-y-3">
              {auditLogs.length === 0 && (
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                  <p className="text-zinc-500">No activity yet.</p>
                </div>
              )}

              {auditLogs.map((log) => {
                const icon =
                  log.entity_type === "withdrawal" &&
                  log.action_type === "pending"
                    ? "🟡"
                    : log.entity_type === "withdrawal" &&
                      log.action_type === "approved"
                    ? "🔵"
                    : log.entity_type === "withdrawal" &&
                      log.action_type === "paid"
                    ? "🟢"
                    : log.entity_type === "withdrawal" &&
                      log.action_type === "rejected"
                    ? "🔴"
                    : log.entity_type === "dj" &&
                      log.action_type === "verified"
                    ? "✅"
                    : log.entity_type === "dj" &&
                      log.action_type === "rejected"
                    ? "❌"
                    : "📝";

                return (
                  <div
                    key={log.id}
                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{icon}</div>

                      <div className="flex-1">
                        <p className="text-white font-semibold">
                          {log.description || "Activity updated"}
                        </p>

                        {log.metadata?.amount && (
                          <p className="text-sm text-cyan-400 mt-1">
                            Amount: {log.metadata.currency || currency}{" "}
                            {Number(log.metadata.amount).toFixed(2)}
                          </p>
                        )}

                        <p className="text-xs text-zinc-500 mt-2">
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString()
                            : "No date"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
                      ? `#${index + 1} — ${request.song}`
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