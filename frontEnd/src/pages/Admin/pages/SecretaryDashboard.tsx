import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { memberService } from "../../../api/jumuiyaMemberService";
import { getYearOfStudy, genderCode, isMale, isFemale } from "../../../utils/memberYear";
import {
  Users, Church, Calendar, RefreshCw,
  BarChart3, TrendingUp, GitMerge, CheckCircle,
  ArrowLeftRight, UserCheck, Image, CalendarCheck
} from "lucide-react";
import toast from "react-hot-toast";
import OrganizationPanel from "../../Jumuiya/admin/OrganizationPanel";
import CsaAllocationsApproval from "../../Jumuiya/components/CsaAllocationsApproval";
import GalleryManager from "./GalleryManager";
import JumuiyaAnalyticsDashboard from "../../Jumuiya/admin/JumuiyaAnalyticsDashboard";
import JumuiyaAttendanceRegister from "./JumuiyaAttendanceRegister";
import JumuiyaAnnouncementsRegister from "./JumuiyaAnnouncementsRegister";
import { Megaphone } from "lucide-react";
import { SkeletonSummaryBar } from "../../../components/Skeleton";


type DashboardTab = "overview" | "organize" | "allocations" | "analytics" | "gallery" | "attendance" | "announcements";

const TAB_CONFIGS: Record<string, { id: DashboardTab; label: string; icon: any }[]> = {
  chair: [
    { id: "overview", label: "Dashboard", icon: BarChart3 },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "organize", label: "Organize", icon: GitMerge },
    { id: "allocations", label: "Allocations", icon: UserCheck },
    { id: "analytics", label: "Reports", icon: TrendingUp },
  ],
  secretary: [
    { id: "overview", label: "Dashboard", icon: BarChart3 },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "analytics", label: "Reports", icon: TrendingUp },
  ],
  os: [
    { id: "overview", label: "Dashboard", icon: BarChart3 },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "gallery", label: "Gallery", icon: Image },
  ],
};

const JUMUIYAS: Record<string, { name: string; color: string; initials: string }> = {
  "st-anthony": { name: "St. Anthony", color: "#8b5cf6", initials: "SA" },
  "st-augustine": { name: "St. Augustine", color: "#3b82f6", initials: "AU" },
  "st-catherine": { name: "St. Catherine", color: "#800000", initials: "CA" },
  "st-dominic": { name: "St. Dominic", color: "#979695ff", initials: "DO" },
  "st-elizabeth": { name: "St. Elizabeth", color: "#07a414d1", initials: "EL" },
  "st-maria-goretti": { name: "St. Maria Goretti", color: "#0ea5e9", initials: "MG" },
  "st-monica": { name: "St. Monica", color: "#ef4444", initials: "MO" },
};

const SEMESTERS = [
  { label: "1.1", dbCol: "sem_1_reg" },
  { label: "1.2", dbCol: "sem_2_reg" },
  { label: "2.1", dbCol: "sem_3_reg" },
  { label: "2.2", dbCol: "sem_4_reg" },
  { label: "3.1", dbCol: "sem_5_reg" },
  { label: "3.2", dbCol: "sem_6_reg" },
  { label: "4.1", dbCol: "sem_7_reg" },
  { label: "4.2", dbCol: "sem_8_reg" },
];

export default function SecretaryDashboard() {
  const { user } = useAuth();
  const jumuiyaId = user?.jumuiya_id || "";

  // Resolve jumuiya UUID → display info (API lookup for UUIDs, local map for slugs)
  const [resolvedInfo, setResolvedInfo] = useState<{ name: string; color: string; initials: string } | null>(null);
  const jumuiyaInfo = resolvedInfo || JUMUIYAS[jumuiyaId] || { name: jumuiyaId || "Your Jumuiya", color: "#6b7280", initials: "J" };

  useEffect(() => {
    if (!jumuiyaId) return;
    if (JUMUIYAS[jumuiyaId]) {
      setResolvedInfo(null); // already known
      return;
    }
    memberService.getJumuiyaLookup().then((res: any) => {
      const data = res?.data || res || {};
      const entry = data[jumuiyaId];
      if (entry) {
        const name = entry.name || entry.fullName || jumuiyaId;
        const initials = name.split(" ").map((w: string) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
        setResolvedInfo({ name, color: "#6b7280", initials });
      }
    }).catch(() => {});
  }, [jumuiyaId]);

  const userRoles = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
  const normalizedRoles = userRoles.map(r => String(r).toUpperCase().trim());
  const isChair = normalizedRoles.includes("JUMUIYA_CHAIRPERSON");
  const isSecretary = normalizedRoles.includes("JUMUIYA_SECRETARY");
  const roleKey = isChair ? "chair" : isSecretary ? "secretary" : "os";
  const tabs = TAB_CONFIGS[roleKey];
  const roleLabel = isChair ? "Chairperson Dashboard" : isSecretary ? "Secretary Dashboard" : "Jumuiya Dashboard";

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const [stats, setStats] = useState<any>(null);
  const [csaAllocations, setCsaAllocations] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchOverview = useCallback(async () => {
    if (!jumuiyaId) return;
    setLoadingStats(true);
    try {
      const [statsRes, csaRes, seasonsRes] = await Promise.all([
        memberService.getStatistics(jumuiyaId),
        memberService.getCsaAllocations(jumuiyaId).catch(() => ({ data: { members: [] } })),
        memberService.getSeasons(jumuiyaId).catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data || null);
      if (statsRes.data?.jumuiyaName && !JUMUIYAS[jumuiyaId]) {
        const name = statsRes.data.jumuiyaName;
        const initials = name.split(" ").map((w: string) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
        setResolvedInfo({ name, color: "#6b7280", initials });
      }
      setCsaAllocations((csaRes.data?.members || csaRes.data || []));
      setSeasons(seasonsRes.data || []);
    } catch (err) {
      console.error("Failed to load overview:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoadingStats(false);
    }
  }, [jumuiyaId]);

  const fetchMembers = useCallback(async () => {
    if (!jumuiyaId) return;
    setLoadingMembers(true);
    try {
      const data = await memberService.getMembers(jumuiyaId);
      // For secretaries, only show members from their jumuiya (source = 'jum'), filter out CSA members
      const raw = data?.data || data || [];
      const jumuiyaOnly = raw.filter((m: any) => m.source === 'jum');
      setMembers(jumuiyaOnly);
    } catch (err) {
      // Fallback: try export members endpoint
      try {
        const res = await memberService.exportMembers(jumuiyaId);
        setMembers(res.data || []);
      } catch (err2) {
        console.error("Failed to load members:", err2);
        toast.error("Failed to load members");
      }
    } finally {
      setLoadingMembers(false);
    }
  }, [jumuiyaId]);

  const refreshAll = useCallback(() => {
    fetchOverview();
    fetchMembers();
  }, [fetchOverview, fetchMembers]);

  useEffect(() => {
    fetchOverview();
    fetchMembers();
    const handleUpdated = () => fetchMembers();
    window.addEventListener("csa_members_updated", handleUpdated);
    return () => window.removeEventListener("csa_members_updated", handleUpdated);
  }, [jumuiyaId, fetchMembers]);

  const genderCounts = useMemo(() => {
    const bd = stats?.genderBreakdown;
    if (bd && Array.isArray(bd)) {
      const male = bd.find((g: any) => isMale(g.gender))?.count || 0;
      const female = bd.find((g: any) => isFemale(g.gender))?.count || 0;
      return { male, female };
    }
    let male = 0, female = 0;
    members.forEach(m => {
      if (isMale(m.gender)) male++;
      else if (isFemale(m.gender)) female++;
    });
    return { male, female };
  }, [stats, members]);

  const semesterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SEMESTERS.forEach(s => {
      counts[s.label] = members.filter(m => m[s.dbCol] === true || m[s.dbCol] === "true" || m[s.dbCol] === 1).length;
    });
    return counts;
  }, [members]);

  if (!jumuiyaId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Church size={64} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-600">No Jumuiya Assigned</h2>
        <p className="text-slate-400 mt-2 max-w-md">
          Your account is not linked to a specific Jumuiya. Please contact the admin to assign you to a Jumuiya.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
            style={{ background: `linear-gradient(135deg, ${jumuiyaInfo.color}, ${jumuiyaInfo.color}cc)` }}
          >
            {jumuiyaInfo.initials}
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">{jumuiyaInfo.name}</h2>
            <p className="text-sm text-slate-500">
              {roleLabel}
            </p>
          </div>
        </div>
        <button
          onClick={() => { fetchOverview(); fetchMembers(); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw size={16} className={(loadingStats || loadingMembers) ? "animate-spin" : ""} />
          Refresh All
        </button>
      </div>

      <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {loadingStats ? (
            <SkeletonSummaryBar count={4} />
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Users size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-800">{stats?.totalMembers || 0}</p>
                      <p className="text-xs text-slate-400 font-medium">Total Members</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <CheckCircle size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-800">{stats?.jum?.total || 0}</p>
                      <p className="text-xs text-slate-400 font-medium">Jum Members</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <GitMerge size={20} className="text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-800">{stats?.csa?.total || 0}</p>
                      <p className="text-xs text-slate-400 font-medium">CSA Allocated</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gender Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Gender Distribution</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Male</span>
                        <span className="font-bold text-blue-600">{genderCounts.male}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${members.length > 0 ? (genderCounts.male / members.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Female</span>
                        <span className="font-bold text-pink-600">{genderCounts.female}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-500 rounded-full transition-all"
                          style={{ width: `${members.length > 0 ? (genderCounts.female / members.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Semester Progress */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 md:col-span-2">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Semester Registration Progress</h3>
                  <div className="flex items-end gap-1 h-28">
                    {SEMESTERS.map(s => {
                      const count = semesterCounts[s.label] || 0;
                      const maxH = Math.max(...Object.values(semesterCounts), 1);
                      const pct = (count / maxH) * 100;
                      return (
                        <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-slate-600">{count}</span>
                          <div className="w-full bg-indigo-100 rounded-t-md transition-all" style={{ height: `${pct}%`, minHeight: count > 0 ? 4 : 0 }} />
                          <span className="text-[10px] text-slate-400 font-medium">{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Seasons */}
              {seasons.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-500" />
                    Registration Seasons
                  </h3>
                  <div className="space-y-2">
                    {seasons.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${
                            s.status === "active" ? "bg-emerald-500" : s.status === "closed" ? "bg-red-400" : "bg-slate-300"
                          }`} />
                          <span className="font-semibold text-sm text-slate-700">{s.season_name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>{s.start_date?.slice(0, 10)} — {s.end_date?.slice(0, 10)}</span>
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            s.status === "active" ? "bg-emerald-100 text-emerald-700" :
                            s.status === "closed" ? "bg-red-100 text-red-700" :
                            "bg-slate-200 text-slate-600"
                          }`}>{s.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent CSA Allocations */}
              {csaAllocations.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <ArrowLeftRight size={16} className="text-cyan-500" />
                    Recent CSA Allocations ({csaAllocations.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Reg #</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Gender</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csaAllocations.slice(0, 10).map((m: any, i: number) => (
                          <tr key={m.id || i} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-700">{m.name}</td>
                            <td className="py-2 px-3 text-slate-500 font-mono text-xs">{m.reg_number || "—"}</td>
                            <td className="py-2 px-3">
                              <span className={`text-xs font-semibold ${genderCode(m.gender) === "M" ? "text-blue-600" : genderCode(m.gender) === "W" ? "text-pink-600" : "text-slate-400"}`}>
                                {genderCode(m.gender)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-xs">{getYearOfStudy(m.reg_number || m.member_id || "") || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <JumuiyaAnalyticsDashboard
          jumuiyaId={jumuiyaId}
          jumuiyaName={jumuiyaInfo.name}
          jumuiyaColor={jumuiyaInfo.color}
          members={members}
          stats={stats}
          csaAllocations={csaAllocations}
          user={user ?? undefined}
          onRegister={refreshAll}
        />
      )}

      {activeTab === "attendance" && (
        <JumuiyaAttendanceRegister
          jumuiyaId={jumuiyaId}
          jumuiyaName={jumuiyaInfo.name}
          jumuiyaColor={jumuiyaInfo.color}
        />
      )}

      {activeTab === "organize" && (
        <OrganizationPanel jumuiyaId={jumuiyaId} />
      )}

      {activeTab === "allocations" && (
        <CsaAllocationsApproval jumuiyaId={jumuiyaId} jumuiyaName={jumuiyaInfo.name} jumuiyaColor={jumuiyaInfo.color} />
      )}

      {activeTab === "announcements" && (
        <JumuiyaAnnouncementsRegister
          jumuiyaId={jumuiyaId}
          jumuiyaName={jumuiyaInfo.name}
          jumuiyaColor={jumuiyaInfo.color}
        />
      )}

      {activeTab === "gallery" && (
        <GalleryManager jumuiyaId={jumuiyaId} jumuiyaInfo={{ ...jumuiyaInfo, saintImage: stats?.saintImage || '' }} />
      )}
    </div>
  );
}
