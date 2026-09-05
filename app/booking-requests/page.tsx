"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { supabase } from "@/lib/supabase";
import { IconInbox, IconCheck, IconX, IconTrash, IconCurrencyDollar, IconMail, IconPhone } from "@tabler/icons-react";
import { revenueEvents } from "@/lib/revenueEvents";

type RateSegment = {
  startDate: string;
  endDate:   string;
  nights:    number;
  rate:      number;
  rateName:  string;
  subtotal:  number;
};

type BookingRequest = {
  id:             string;
  guestName:      string;
  email:          string;
  phone?:         string;
  checkIn:        string;
  checkOut:       string;
  nights:         number;
  guestCount:     number;
  message?:       string;
  source?:        string;
  status:         "pending" | "approved" | "declined";
  nightlyRate?:   number;
  rateBreakdown?: RateSegment[];
  quotedTotal:    number;
  depositPaid:    boolean;
  balancePaid:    boolean;
  revenueId?:     string;
  createdAt:      string;
};

type TabFilter = "pending" | "approved" | "declined";

const PAYMENT_METHODS = ["Zelle", "Cash App", "Venmo", "Stripe"];

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`;
}

function mapRow(r: any): BookingRequest {
  return {
    id:            r.id,
    guestName:     r.guest_name,
    email:         r.email,
    phone:         r.phone ?? undefined,
    checkIn:       r.check_in,
    checkOut:      r.check_out,
    nights:        r.nights,
    guestCount:    r.guest_count,
    message:       r.message ?? undefined,
    source:        r.source ?? undefined,
    status:        r.status,
    nightlyRate:   r.nightly_rate ?? undefined,
    rateBreakdown: r.rate_breakdown ?? undefined,
    quotedTotal:   Number(r.total_amount ?? 0),
    depositPaid:   r.deposit_paid,
    balancePaid:   r.balance_paid,
    revenueId:     r.revenue_id ?? undefined,
    createdAt:     r.created_at,
  };
}

export default function BookingRequestsPage() {
  const [requests,     setRequests]     = useState<BookingRequest[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState<TabFilter>("pending");
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [rateModal,    setRateModal]    = useState<BookingRequest | null>(null);
  const [rateInput,    setRateInput]    = useState("");
  const [totalInput,   setTotalInput]   = useState("");
  const [cancelModal,  setCancelModal]  = useState<BookingRequest | null>(null);
  const [depositModal, setDepositModal] = useState<BookingRequest | null>(null);
  const [depositMethod, setDepositMethod] = useState("Zelle");
  const [depositPct,   setDepositPct]   = useState(30);

  const load = useCallback(() => {
    supabase.from("booking_requests").select("*").order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setRequests(data.map(mapRow));
        setLoading(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = requests.filter(r => r.status === tab);
  const counts   = {
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    declined: requests.filter(r => r.status === "declined").length,
  };

  async function approve(req: BookingRequest, nightlyRate?: number, confirmedTotal?: number) {
    setActionId(req.id);
    let rate: number;
    let total: number;
    if (confirmedTotal !== undefined) {
      total = confirmedTotal;
      rate  = req.nights > 0 ? Math.round((confirmedTotal / req.nights) * 100) / 100 : 0;
    } else {
      rate  = nightlyRate ?? req.nightlyRate ?? 0;
      total = rate * req.nights;
    }

    // Create revenue entry + linked stay (via revenue context pattern)
    const { data: revRow, error: revErr } = await supabase.from("revenue").insert({
      guest_name:     req.guestName,
      check_in:       req.checkIn,
      check_out:      req.checkOut,
      nights:         req.nights,
      nightly_rate:   rate,
      total_amount:   total,
      payment_status: "Pending",
      payment_method: "Cash",
    }).select().single();

    if (revErr) { console.error(revErr); setActionId(null); return; }

    // Create gold calendar stay linked to revenue
    const { error: stayErr } = await supabase.from("stays").insert({
      person:         null,
      guest:          req.guestName,
      start_date:     req.checkIn,
      nights:         req.nights,
      cost:           total,
      payment_status: "Pending",
      payment_method: "Cash",
      payment_notes:  null,
      revenue_id:     revRow.id,
    });
    if (stayErr) { console.error("[approve] stays insert error:", stayErr); setActionId(null); return; }

    // Update booking request
    await supabase.from("booking_requests").update({
      status:       "approved",
      nightly_rate: rate,
      revenue_id:   revRow.id,
    }).eq("id", req.id);

    revenueEvents.refresh();
    setActionId(null);
    setRateModal(null);
    load();
  }

  async function cancelRequest(req: BookingRequest) {
    setActionId(req.id);
    if (req.revenueId) {
      // Delete linked calendar stay first, then revenue entry
      const { error: stayDelErr } = await supabase.from("stays").delete().eq("revenue_id", req.revenueId);
      if (stayDelErr) console.error("[cancel] stay delete error:", stayDelErr);
      const { error: revDelErr } = await supabase.from("revenue").delete().eq("id", req.revenueId);
      if (revDelErr) console.error("[cancel] revenue delete error:", revDelErr);
      revenueEvents.refresh();
    }
    await supabase.from("booking_requests").delete().eq("id", req.id);
    setActionId(null);
    setCancelModal(null);
    load();
  }

  async function decline(id: string) {
    setActionId(id);
    await supabase.from("booking_requests").update({ status: "declined" }).eq("id", id);
    setActionId(null);
    load();
  }

  async function markDepositPaid(id: string) {
    await supabase.from("booking_requests").update({ deposit_paid: true }).eq("id", id);
    load();
  }

  async function markBalancePaid(id: string) {
    await supabase.from("booking_requests").update({ balance_paid: true }).eq("id", id);
    load();
  }

  function openApprove(req: BookingRequest) {
    if (req.quotedTotal > 0) {
      // Has a quoted total from the website booking form — show pre-filled total modal
      setTotalInput(String(req.quotedTotal));
      setRateModal(req);
    } else if (!req.nightlyRate) {
      // No quote and no existing rate — fall back to asking for nightly rate
      setRateInput("");
      setRateModal(req);
    } else {
      // Already has a rate — approve directly
      approve(req);
    }
  }

  function depositAmount(req: BookingRequest) {
    const rate  = req.nightlyRate ?? 0;
    const total = rate * req.nights;
    return Math.round(total * depositPct / 100);
  }

  function balanceAmount(req: BookingRequest) {
    const rate  = req.nightlyRate ?? 0;
    const total = rate * req.nights;
    return total - depositAmount(req);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f5f4f1" }}>
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main className="flex-1 flex flex-col gap-4" style={{ padding: "24px", overflowY: "auto" }}>
          {/* Header */}
          <div className="flex items-center gap-3">
            <IconInbox size={18} style={{ color: "#3b9e95" }} strokeWidth={2} />
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1c1c1a", margin: 0 }}>Booking Requests</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {(["pending","approved","declined"] as TabFilter[]).map(t => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
                    background: active ? "#3b9e95" : "transparent",
                    color:      active ? "#fff" : "#9e9b93",
                    fontWeight: active ? 600 : 400,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {counts[t] > 0 && (
                    <span style={{ background: active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)", borderRadius: 100, padding: "0 6px", fontSize: 11, fontWeight: 600 }}>
                      {counts[t]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Requests list */}
          {loading ? (
            <div style={{ color: "#9e9b93", fontSize: 14, padding: "40px 0", textAlign: "center" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl flex items-center justify-center" style={{ border: "1px solid #e4e2dc", minHeight: 180 }}>
              <span style={{ color: "#9e9b93", fontSize: 14 }}>No {tab} requests</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(req => {
                const isApproved   = req.status === "approved";
                const rate         = req.nightlyRate ?? 0;
                const total        = rate * req.nights;
                const deposit      = depositAmount(req);
                const balance      = balanceAmount(req);
                const busy         = actionId === req.id;

                return (
                  <div key={req.id} className="bg-white rounded-xl" style={{ border: "1px solid #e4e2dc", padding: "20px 24px" }}>
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Guest info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span style={{ fontWeight: 700, fontSize: 16, color: "#1c1c1a" }}>{req.guestName}</span>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100,
                            background: req.status === "pending"  ? "rgba(201,168,76,0.1)"  :
                                        req.status === "approved" ? "rgba(59,158,149,0.1)"  :
                                        "rgba(158,155,147,0.12)",
                            color:      req.status === "pending"  ? "#7a5e10" :
                                        req.status === "approved" ? "#1f7068"  :
                                        "#5c5a55",
                          }}>
                            {req.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-3">
                          <div>
                            <div style={{ fontSize: 11, color: "#9e9b93", marginBottom: 2 }}>Dates</div>
                            <div style={{ fontSize: 13, color: "#1c1c1a", fontWeight: 500 }}>
                              {fmtDate(req.checkIn)} → {fmtDate(req.checkOut)} · {req.nights}n
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "#9e9b93", marginBottom: 2 }}>Guests</div>
                            <div style={{ fontSize: 13, color: "#1c1c1a" }}>{req.guestCount}</div>
                          </div>
                          {rate > 0 && (
                            <div>
                              <div style={{ fontSize: 11, color: "#9e9b93", marginBottom: 2 }}>Rate</div>
                              <div style={{ fontSize: 13, color: "#1c1c1a", fontWeight: 500 }}>${rate}/night · ${total} total</div>
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: 11, color: "#9e9b93", marginBottom: 2 }}>Requested</div>
                            <div style={{ fontSize: 13, color: "#6b6960" }}>{new Date(req.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <a href={`mailto:${req.email}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#3b9e95", textDecoration: "none" }}>
                            <IconMail size={14} /> {req.email}
                          </a>
                          {req.phone && (
                            <a href={`tel:${req.phone}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#3b9e95", textDecoration: "none" }}>
                              <IconPhone size={14} /> {req.phone}
                            </a>
                          )}
                        </div>

                        {req.message && (
                          <div style={{ marginTop: 12, background: "#f5f4f1", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#6b6960", lineHeight: 1.5 }}>
                            &ldquo;{req.message}&rdquo;
                          </div>
                        )}
                        {req.source && (
                          <div style={{ marginTop: 6, fontSize: 12, color: "#9e9b93" }}>Via: {req.source}</div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0" style={{ minWidth: 160 }}>
                        {/* Cancel / Delete — always visible */}
                        <button
                          onClick={() => req.status === "approved" ? setCancelModal(req) : cancelRequest(req)}
                          disabled={busy}
                          style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center", background: "rgba(185,50,40,0.07)", color: "#b93228", border: "1px solid rgba(185,50,40,0.18)", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 500, cursor: busy ? "default" : "pointer", marginBottom: 2 }}
                        >
                          <IconTrash size={12} />
                          {req.status === "approved" ? "Cancel booking" : "Delete"}
                        </button>

                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => openApprove(req)}
                              disabled={busy}
                              style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", background: "#3b9e95", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: busy ? "default" : "pointer" }}
                            >
                              <IconCheck size={14} /> Approve
                            </button>
                            <button
                              onClick={() => decline(req.id)}
                              disabled={busy}
                              style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", background: "rgba(185,50,40,0.08)", color: "#b93228", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: busy ? "default" : "pointer" }}
                            >
                              <IconX size={14} /> Decline
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <div className="flex flex-col gap-2">
                            {/* Payment status */}
                            <div style={{ fontSize: 12, color: "#9e9b93", marginBottom: 2 }}>Payment</div>
                            <div className="flex flex-col gap-1.5">
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                                <span style={{ color: req.depositPaid ? "#1f7068" : "#6b6960" }}>
                                  {req.depositPaid ? "✓" : "○"} Deposit ${deposit}
                                </span>
                                {!req.depositPaid && (
                                  <button onClick={() => { setDepositModal(req); setDepositPct(30); setDepositMethod("Zelle"); }}
                                    style={{ fontSize: 11, color: "#3b9e95", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
                                    Send
                                  </button>
                                )}
                                {req.depositPaid && !req.balancePaid && (
                                  <button onClick={() => markDepositPaid(req.id)}
                                    style={{ fontSize: 11, color: "#9e9b93", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                    Mark paid
                                  </button>
                                )}
                              </div>
                              {req.depositPaid && (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                                  <span style={{ color: req.balancePaid ? "#1f7068" : "#6b6960" }}>
                                    {req.balancePaid ? "✓" : "○"} Balance ${balance}
                                  </span>
                                  {!req.balancePaid && (
                                    <button onClick={() => { setDepositModal({ ...req, depositPaid: true }); setDepositPct(70); setDepositMethod("Zelle"); }}
                                      style={{ fontSize: 11, color: "#3b9e95", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
                                      Send
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            {!req.depositPaid && (
                              <button onClick={() => markDepositPaid(req.id)}
                                style={{ marginTop: 4, fontSize: 12, color: "#3b9e95", background: "rgba(59,158,149,0.08)", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontWeight: 500 }}>
                                <IconCurrencyDollar size={12} style={{ display: "inline", marginRight: 4 }} />
                                Mark deposit paid
                              </button>
                            )}
                            {req.depositPaid && !req.balancePaid && (
                              <button onClick={() => markBalancePaid(req.id)}
                                style={{ marginTop: 4, fontSize: 12, color: "#3b9e95", background: "rgba(59,158,149,0.08)", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontWeight: 500 }}>
                                <IconCurrencyDollar size={12} style={{ display: "inline", marginRight: 4 }} />
                                Mark balance paid
                              </button>
                            )}
                            {req.depositPaid && req.balancePaid && (
                              <div style={{ textAlign: "center", fontSize: 13, color: "#1f7068", fontWeight: 600 }}>✓ Fully paid</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Approve modal — quoted mode (has total from website) or manual mode (nightly rate) */}
      {rateModal && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.38)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) setRateModal(null); }}>
          <div className="bg-white rounded-2xl" style={{ width: 400, padding: "28px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1c1c1a", marginBottom: 4 }}>Approve booking</div>
            <div style={{ fontSize: 13, color: "#6b6960", marginBottom: 20 }}>
              {rateModal.guestName} · {rateModal.nights} night{rateModal.nights !== 1 ? "s" : ""} · {fmtDate(rateModal.checkIn)} → {fmtDate(rateModal.checkOut)}
            </div>

            {rateModal.quotedTotal > 0 ? (
              <>
                {/* Quoted summary from website */}
                <div style={{ background: "#f5f4f1", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1c1c1a", marginBottom: rateModal.rateBreakdown ? 10 : 0 }}>
                    Guest was quoted: <span style={{ color: "#3b9e95" }}>${rateModal.quotedTotal.toLocaleString()}</span> total
                  </div>
                  {rateModal.rateBreakdown && rateModal.rateBreakdown.map((seg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b6960", marginTop: 4 }}>
                      <span>
                        {seg.nights} night{seg.nights !== 1 ? "s" : ""} × ${seg.rate.toLocaleString()}
                        {seg.rateName !== "Standard rate" ? ` (${seg.rateName})` : ""}
                      </span>
                      <span style={{ fontWeight: 600 }}>${seg.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Editable confirmed total */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6b6960", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Confirmed total</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#9e9b93", fontSize: 16 }}>$</span>
                    <input
                      type="number" min={0} value={totalInput} onChange={e => setTotalInput(e.target.value)}
                      autoFocus
                      style={{ flex: 1, height: 44, border: "1px solid #e4e2dc", borderRadius: 10, padding: "0 12px", fontSize: 20, fontWeight: 700, color: "#1c1c1a", outline: "none" }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: "#9e9b93", marginTop: 6 }}>
                    Adjust if needed — guest will be notified of the confirmed rate.
                  </div>
                </div>
                <div className="flex gap-2" style={{ marginTop: 20 }}>
                  <button onClick={() => setRateModal(null)} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid #e4e2dc", background: "#f4f3f0", color: "#6b6960", cursor: "pointer", fontSize: 14 }}>Cancel</button>
                  <button
                    onClick={() => approve(rateModal, undefined, Number(totalInput))}
                    disabled={!totalInput || Number(totalInput) <= 0}
                    style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: Number(totalInput) > 0 ? "#3b9e95" : "#e4e2dc", color: "#fff", cursor: Number(totalInput) > 0 ? "pointer" : "default", fontSize: 14, fontWeight: 600 }}
                  >
                    Approve →
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Manual / fallback: ask for nightly rate */}
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b6960", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Nightly rate</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <span style={{ color: "#9e9b93", fontSize: 16 }}>$</span>
                  <input
                    type="number" min={0} value={rateInput} onChange={e => setRateInput(e.target.value)}
                    placeholder="0"
                    autoFocus
                    style={{ flex: 1, height: 44, border: "1px solid #e4e2dc", borderRadius: 10, padding: "0 12px", fontSize: 20, fontWeight: 700, color: "#1c1c1a", outline: "none" }}
                  />
                  <span style={{ fontSize: 14, color: "#9e9b93" }}>/night</span>
                </div>
                {rateInput && Number(rateInput) > 0 && (
                  <div style={{ background: "#f5f4f1", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#6b6960", marginBottom: 16 }}>
                    Total: <strong>${Number(rateInput) * rateModal.nights}</strong> · Deposit (30%): <strong>${Math.round(Number(rateInput) * rateModal.nights * 0.3)}</strong>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setRateModal(null)} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid #e4e2dc", background: "#f4f3f0", color: "#6b6960", cursor: "pointer", fontSize: 14 }}>Cancel</button>
                  <button
                    onClick={() => approve(rateModal, Number(rateInput))}
                    disabled={!rateInput || Number(rateInput) <= 0}
                    style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: Number(rateInput) > 0 ? "#3b9e95" : "#e4e2dc", color: "#fff", cursor: Number(rateInput) > 0 ? "pointer" : "default", fontSize: 14, fontWeight: 600 }}
                  >
                    Approve
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancel booking confirmation modal */}
      {cancelModal && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.38)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) setCancelModal(null); }}>
          <div className="bg-white rounded-2xl" style={{ width: 380, padding: "28px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1c1c1a", marginBottom: 8 }}>Cancel booking?</div>
            <div style={{ fontSize: 13, color: "#6b6960", marginBottom: 8, lineHeight: 1.6 }}>
              <strong style={{ color: "#1c1c1a" }}>{cancelModal.guestName}</strong> · {fmtDate(cancelModal.checkIn)} → {fmtDate(cancelModal.checkOut)}
            </div>
            <div style={{ fontSize: 13, color: "#b93228", background: "rgba(185,50,40,0.07)", borderRadius: 8, padding: "10px 14px", marginBottom: 24, lineHeight: 1.6 }}>
              Cancelling this booking will also remove the linked calendar stay and revenue entry. This cannot be undone.
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCancelModal(null)} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid #e4e2dc", background: "#f4f3f0", color: "#6b6960", cursor: "pointer", fontSize: 14 }}>Keep booking</button>
              <button onClick={() => cancelRequest(cancelModal)} style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "#b93228", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Cancel booking</button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit/balance request modal */}
      {depositModal && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.38)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) setDepositModal(null); }}>
          <div className="bg-white rounded-2xl" style={{ width: 420, padding: "28px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1c1c1a", marginBottom: 6 }}>
              {depositModal.depositPaid ? "Send balance request" : "Send deposit request"}
            </div>
            <div style={{ fontSize: 13, color: "#6b6960", marginBottom: 20 }}>
              Copy this message to send to {depositModal.guestName}
            </div>

            <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <div>
                <label style={{ fontSize: 12, color: "#9e9b93", display: "block", marginBottom: 4 }}>Method</label>
                <select value={depositMethod} onChange={e => setDepositMethod(e.target.value)}
                  style={{ height: 36, border: "1px solid #e4e2dc", borderRadius: 8, padding: "0 10px", fontSize: 13, color: "#1c1c1a" }}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              {!depositModal.depositPaid && (
                <div>
                  <label style={{ fontSize: 12, color: "#9e9b93", display: "block", marginBottom: 4 }}>Deposit %</label>
                  <input type="number" min={1} max={100} value={depositPct} onChange={e => setDepositPct(Number(e.target.value))}
                    style={{ height: 36, width: 70, border: "1px solid #e4e2dc", borderRadius: 8, padding: "0 10px", fontSize: 13, color: "#1c1c1a" }} />
                </div>
              )}
            </div>

            <div style={{ background: "#f5f4f1", borderRadius: 10, padding: "16px", fontSize: 14, color: "#1c1c1a", lineHeight: 1.65, whiteSpace: "pre-wrap", marginBottom: 20 }}>
              {depositModal.depositPaid
                ? `Hi ${depositModal.guestName}!\n\nYour deposit is confirmed. The remaining balance of $${balanceAmount(depositModal)} is due before your check-in on ${fmtDate(depositModal.checkIn)}.\n\nPlease send via ${depositMethod}.\n\nLooking forward to hosting you at Selah by the Sea! 🌊`
                : `Hi ${depositModal.guestName}!\n\nWe're excited to confirm your stay at Selah by the Sea from ${fmtDate(depositModal.checkIn)} to ${fmtDate(depositModal.checkOut)} (${depositModal.nights} nights).\n\nTo secure your reservation, please send the ${depositPct}% deposit of $${Math.round((depositModal.nightlyRate ?? 0) * depositModal.nights * depositPct / 100)} via ${depositMethod}.\n\nThe remaining balance of $${Math.round((depositModal.nightlyRate ?? 0) * depositModal.nights * (100 - depositPct) / 100)} will be due closer to your check-in date.\n\nThank you! 🌊`
              }
            </div>

            <div className="flex gap-2">
              <button onClick={() => setDepositModal(null)} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid #e4e2dc", background: "#f4f3f0", color: "#6b6960", cursor: "pointer", fontSize: 14 }}>Close</button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    depositModal.depositPaid
                      ? `Hi ${depositModal.guestName}!\n\nYour deposit is confirmed. The remaining balance of $${balanceAmount(depositModal)} is due before your check-in on ${fmtDate(depositModal.checkIn)}.\n\nPlease send via ${depositMethod}.\n\nLooking forward to hosting you at Selah by the Sea! 🌊`
                      : `Hi ${depositModal.guestName}!\n\nWe're excited to confirm your stay at Selah by the Sea from ${fmtDate(depositModal.checkIn)} to ${fmtDate(depositModal.checkOut)} (${depositModal.nights} nights).\n\nTo secure your reservation, please send the ${depositPct}% deposit of $${Math.round((depositModal.nightlyRate ?? 0) * depositModal.nights * depositPct / 100)} via ${depositMethod}.\n\nThe remaining balance of $${Math.round((depositModal.nightlyRate ?? 0) * depositModal.nights * (100 - depositPct) / 100)} will be due closer to your check-in date.\n\nThank you! 🌊`
                  );
                  setDepositModal(null);
                }}
                style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "#3b9e95", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
              >
                Copy message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
