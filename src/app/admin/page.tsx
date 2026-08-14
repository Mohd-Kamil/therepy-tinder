'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ConfigError from '@/components/ConfigError';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Participant, Session, Response, FinalReflection } from '@/types/assessment';
import { 
  LayoutDashboard, Users, FileText, Search, User as UserIcon, RefreshCw, 
  Download, Filter, Calendar, ChevronRight, Lock, HelpCircle, X, Check, Heart 
} from 'lucide-react';
import { getCardIcon } from '@/components/PsychologyCard';
import { questions } from '@/lib/questions';

interface ParticipantRecord extends Participant {
  sessions: (Session & {
    responses: Response[];
    final_reflections: FinalReflection[];
  })[];
}

export default function AdminPage() {
  const router = useRouter();
  
  // Login credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<ParticipantRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Tab states: 'overview' | 'responses' | 'reflections' | 'list'
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'reflections' | 'list'>('overview');
  
  // Detail sidebar state
  const [selectedRecord, setSelectedRecord] = useState<ParticipantRecord | null>(null);

  // Filters for Text Response Analysis table
  const [textSearch, setTextSearch] = useState('');
  const [filterQuestion, setFilterQuestion] = useState('All');
  const [filterApproach, setFilterApproach] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filters for Final Reflections list
  const [reflectionSearch, setReflectionSearch] = useState('');

  // Selected question in Question Analysis card
  const [analysisQuestionNum, setAnalysisQuestionNum] = useState<number>(1);

  // Configuration check
  if (!isSupabaseConfigured) {
    return (
      <ConfigError message="Supabase configuration is required to access the admin dashboard." />
    );
  }

  const fetchRecords = async (user = username, pass = password) => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized.');
      }

      // Check credentials using our hardened RPC database validation function
      const { data, error: fetchError } = await supabase.rpc('get_admin_dashboard_data', {
        p_username: user,
        p_password: pass,
      });

      if (fetchError) {
        throw fetchError;
      }

      setRecords((data || []) as any);
      setIsUnlocked(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unauthorized: Invalid admin credentials.');
      setIsUnlocked(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords(username, password);
  };

  // ---------------------------------------------------------
  // STATS & METRICS CALCULATIONS
  // ---------------------------------------------------------
  const totalParticipants = records.length;
  
  // Flatten all sessions
  const allSessions: Session[] = [];
  records.forEach((r) => {
    if (r.sessions && r.sessions[0]) {
      allSessions.push(r.sessions[0]);
    }
  });
  const totalSessions = allSessions.length;
  const completedSessions = allSessions.filter((s) => s.status === 'completed' || s.completed_at).length;
  const completionRate = totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // Flatten all responses
  const allResponses: (Response & { participantName: string; date: string })[] = [];
  records.forEach((p) => {
    const session = p.sessions && p.sessions[0];
    if (session && session.responses) {
      session.responses.forEach((res) => {
        allResponses.push({
          ...res,
          participantName: p.name,
          date: res.created_at,
        });
      });
    }
  });
  const totalResponses = allResponses.length;

  // Approach popularity count calculations
  const cardCounts: Record<string, number> = {
    cbt: 0,
    behavioural: 0,
    psychodynamic: 0,
    humanistic: 0,
    systemic: 0,
  };
  allResponses.forEach((r) => {
    const approach = r.selected_card.toLowerCase();
    if (approach in cardCounts) {
      cardCounts[approach]++;
    }
  });

  // Find most selected approach
  let mostSelectedApproach = '—';
  let maxCount = -1;
  Object.keys(cardCounts).forEach((key) => {
    if (cardCounts[key] > maxCount) {
      maxCount = cardCounts[key];
      mostSelectedApproach = key.toUpperCase();
    }
  });
  if (maxCount === 0) mostSelectedApproach = '—';

  // ---------------------------------------------------------
  // SELECTION ANALYSIS BY APPROACH (Chart data)
  // ---------------------------------------------------------
  const approachColors: Record<string, string> = {
    cbt: 'bg-purple-500',
    behavioural: 'bg-indigo-500',
    psychodynamic: 'bg-rose-500',
    humanistic: 'bg-amber-500',
    systemic: 'bg-emerald-500',
  };

  // Selections by question percentages calculations
  const getQuestionDistribution = (questionNum: number) => {
    const questionResponses = allResponses.filter((r) => r.question_number === questionNum);
    const count = questionResponses.length;
    if (!count) return { cbt: 0, behavioural: 0, psychodynamic: 0, humanistic: 0, systemic: 0, total: 0 };

    const counts = { cbt: 0, behavioural: 0, psychodynamic: 0, humanistic: 0, systemic: 0 };
    questionResponses.forEach((r) => {
      const app = r.selected_card.toLowerCase() as keyof typeof counts;
      if (app in counts) counts[app]++;
    });

    return {
      cbt: Math.round((counts.cbt / count) * 100),
      behavioural: Math.round((counts.behavioural / count) * 100),
      psychodynamic: Math.round((counts.psychodynamic / count) * 100),
      humanistic: Math.round((counts.humanistic / count) * 100),
      systemic: Math.round((counts.systemic / count) * 100),
      total: count,
      rawCounts: counts
    };
  };

  // ---------------------------------------------------------
  // TEXT RESPONSE ANALYSIS TABLE FILTERING
  // ---------------------------------------------------------
  const filteredTextResponses = allResponses.filter((res) => {
    // Search filter
    const matchesSearch = 
      res.reason?.toLowerCase().includes(textSearch.toLowerCase()) ||
      res.participantName.toLowerCase().includes(textSearch.toLowerCase());
    
    // Question filter
    const matchesQuestion = filterQuestion === 'All' || res.question_number === parseInt(filterQuestion, 10);

    // Approach filter
    const matchesApproach = filterApproach === 'All' || res.selected_card.toLowerCase() === filterApproach.toLowerCase();

    // Date Range filters
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(res.date) >= new Date(startDate);
    }
    if (endDate) {
      // Add one day to end date to make range inclusive of select day
      const inclusiveEnd = new Date(endDate);
      inclusiveEnd.setDate(inclusiveEnd.getDate() + 1);
      matchesDate = matchesDate && new Date(res.date) < inclusiveEnd;
    }

    return matchesSearch && matchesQuestion && matchesApproach && matchesDate;
  });

  // ---------------------------------------------------------
  // FINAL REFLECTIONS FILTERING
  // ---------------------------------------------------------
  const allFinalReflections: { participantName: string; reflection: string; date: string }[] = [];
  records.forEach((p) => {
    const session = p.sessions && p.sessions[0];
    const reflection = session && session.final_reflections && session.final_reflections[0];
    if (reflection && reflection.reflection) {
      allFinalReflections.push({
        participantName: p.name,
        reflection: reflection.reflection,
        date: reflection.created_at,
      });
    }
  });

  const filteredReflections = allFinalReflections.filter((ref) => {
    return (
      ref.reflection.toLowerCase().includes(reflectionSearch.toLowerCase()) ||
      ref.participantName.toLowerCase().includes(reflectionSearch.toLowerCase())
    );
  });

  // ---------------------------------------------------------
  // EXPORT CSV UTILITY
  // ---------------------------------------------------------
  const handleExportCSV = () => {
    // Filter only completed participant records
    const completedRecords = records.filter((r) => r.completed_at);
    
    // Construct headers
    const headers = [
      "session_id", "participant_name", "age",
      "q1_selection", "q1_reason", "q2_selection", "q2_reason",
      "q3_selection", "q3_reason", "q4_selection", "q4_reason",
      "q5_selection", "q5_reason", "final_reflection",
      "created_at", "completed_at"
    ];

    // Build rows mapping
    const rows = completedRecords.map((r) => {
      const session = r.sessions && r.sessions[0];
      const responses = session?.responses || [];
      const reflection = session?.final_reflections && session.final_reflections[0];

      // Helper to extract question selection details
      const getQDetails = (qNum: number) => {
        const resp = responses.find((res) => res.question_number === qNum);
        return {
          selection: resp?.selected_card || '',
          reason: resp?.reason ? `"${resp.reason.replace(/"/g, '""')}"` : ''
        };
      };

      const q1 = getQDetails(1);
      const q2 = getQDetails(2);
      const q3 = getQDetails(3);
      const q4 = getQDetails(4);
      const q5 = getQDetails(5);

      const finalReflection = reflection?.reflection ? `"${reflection.reflection.replace(/"/g, '""')}"` : '';

      return [
        session?.id || '',
        r.name,
        r.age || '',
        q1.selection,
        q1.reason,
        q2.selection,
        q2.reason,
        q3.selection,
        q3.reason,
        q4.selection,
        q4.reason,
        q5.selection,
        q5.reason,
        finalReflection,
        r.created_at,
        r.completed_at
      ].join(',');
    });

    const csvString = [headers.join(','), ...rows].join('\n');
    
    // Trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mindlens_participants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations for Question Analysis sub-block
  const analysisDist = getQuestionDistribution(analysisQuestionNum);
  let analysisFavApproach = '—';
  let analysisFavCount = -1;
  if (analysisDist.total > 0 && analysisDist.rawCounts) {
    Object.keys(analysisDist.rawCounts).forEach((key) => {
      const count = (analysisDist.rawCounts as any)[key];
      if (count > analysisFavCount) {
        analysisFavCount = count;
        analysisFavApproach = key.toUpperCase();
      }
    });
  }

  // ---------------------------------------------------------
  // LOGIN FORM (ARISH / ARISH verification)
  // ---------------------------------------------------------
  if (!isUnlocked) {
    return (
      <div className="min-h-screen w-full bg-[#0b041a] flex items-center justify-center p-6 font-sans text-zinc-200 select-none relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -left-20 w-96 h-96 bg-purple-900/10 rounded-full filter blur-3xl" />
          <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-indigo-900/20 rounded-full filter blur-3xl" />
        </div>

        {/* Login Panel */}
        <div className="w-full max-w-[400px] bg-[#1a0b36]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl z-10 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="relative w-28 h-8">
              <Image
                src="/assets/logo/Logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-white">Admin Dashboard</h2>
            <p className="text-xs text-zinc-400">Validate credentials to open analytics</p>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 px-4 py-2.5 rounded-xl border border-red-900/30">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[#24163f] border border-white/5 rounded-xl focus:border-purple-500 focus:outline-none text-white text-sm"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#24163f] border border-white/5 rounded-xl focus:border-purple-500 focus:outline-none text-white text-sm"
                disabled={loading}
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#6355d8] to-[#9c66e4] text-white rounded-full text-sm font-semibold shadow-lg shadow-purple-900/40 hover:opacity-95 active:scale-[0.98] transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="animate-spin h-4 w-4" />
                ) : (
                  <span>Access Dashboard</span>
                )}
              </button>
            </div>
          </form>

          <button 
            onClick={() => router.push('/')}
            className="text-xs text-zinc-450 hover:text-zinc-300 underline pt-1 block mx-auto"
          >
            Return to Home Screen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0b041a] font-sans text-zinc-200 selection:bg-purple-950 flex select-none">
      
      {/* Sidebar Panel */}
      <aside className="w-16 sm:w-20 bg-[#13072b] border-r border-white/5 flex flex-col items-center py-8 space-y-8 shrink-0">
        <button 
          onClick={() => router.push('/')}
          className="relative w-8 h-8 rounded-xl overflow-hidden bg-purple-500/10 cursor-pointer"
          title="Go Home"
        >
          <Image
            src="/assets/logo/Logo.png"
            alt="Logo"
            fill
            className="object-contain"
          />
        </button>
        
        <nav className="flex-1 flex flex-col space-y-5 pt-6">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`p-3 rounded-2xl transition ${activeTab === 'overview' ? 'bg-[#24163f] text-[#9c66e4] border border-purple-500/15' : 'text-zinc-450 hover:text-white'}`} 
            title="Overview Analytics"
          >
            <LayoutDashboard className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`p-3 rounded-2xl transition ${activeTab === 'list' ? 'bg-[#24163f] text-[#9c66e4] border border-purple-500/15' : 'text-zinc-450 hover:text-white'}`} 
            title="Participant Records"
          >
            <Users className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setActiveTab('responses')}
            className={`p-3 rounded-2xl transition ${activeTab === 'responses' ? 'bg-[#24163f] text-[#9c66e4] border border-purple-500/15' : 'text-zinc-450 hover:text-white'}`} 
            title="Response Analysis"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setActiveTab('reflections')}
            className={`p-3 rounded-2xl transition ${activeTab === 'reflections' ? 'bg-[#24163f] text-[#9c66e4] border border-purple-500/15' : 'text-zinc-450 hover:text-white'}`} 
            title="Final Reflections"
          >
            <FileText className="h-5 w-5" />
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Header bar */}
        <header className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-[#0b041a] sticky top-0 z-20">
          <div>
            <span className="text-[8px] text-purple-400 font-extrabold tracking-wider uppercase block">Administrator Area</span>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-white">Admin Analytics</h1>
          </div>

          <div className="flex items-center space-x-3.5">
            {/* Export CSV CTA */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-[#6355d8] hover:bg-[#5244c7] text-white rounded-xl text-xs font-semibold shadow flex items-center space-x-2 transition"
              title="Export completed sessions CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            
            <button
              onClick={() => fetchRecords(username, password)}
              disabled={loading}
              className="p-2 border border-white/5 bg-[#24163f] text-zinc-300 hover:text-white rounded-xl transition"
              title="Sync Database"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-9 w-9 rounded-full bg-[#24163f] border border-purple-500/15 flex items-center justify-center text-purple-300 font-bold text-xs uppercase font-mono">
              AR
            </div>
          </div>
        </header>

        {/* Dashboard Panels */}
        <div className="p-6 sm:p-8 space-y-6 max-w-5xl w-full mx-auto flex-grow">
          
          {activeTab === 'overview' && (
            /* =====================================================================
               TAB 1: OVERVIEW & SELECTION ANALYTICS
               ===================================================================== */
            <div className="space-y-6 animate-fade-in">
              {/* Overview widgets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Participants', value: totalParticipants },
                  { label: 'Total Sessions', value: totalSessions },
                  { label: 'Completed Sessions', value: completedSessions },
                  { label: 'Completion Rate', value: `${completionRate}%` },
                  { label: 'Total Responses', value: totalResponses },
                  { label: 'Favorite Approach', value: mostSelectedApproach },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-[#13072b] border border-white/5 p-5 rounded-2xl text-left">
                    <p className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400">{stat.label}</p>
                    <p className="font-serif text-xl sm:text-2xl font-bold text-white mt-1 truncate">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Selection distributions */}
              <div className="grid gap-6 md:grid-cols-5">
                {/* Selections by Approach Bar Chart */}
                <div className="bg-[#13072b] border border-white/5 p-6 rounded-3xl md:col-span-2 space-y-5 text-left">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">Approach Selections</h3>
                    <p className="text-[10px] text-zinc-500">Total matched answers across all questions</p>
                  </div>

                  <div className="space-y-3.5 pt-2 text-[10px] font-semibold text-zinc-300 font-mono">
                    {Object.keys(cardCounts).map((key) => {
                      const count = cardCounts[key];
                      const pct = totalResponses ? Math.round((count / totalResponses) * 100) : 0;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="capitalize">{key}</span>
                            <span>{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#24163f] rounded-full overflow-hidden">
                            <div className={`h-full ${approachColors[key]}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selections by Question Percentages Chart */}
                <div className="bg-[#13072b] border border-white/5 p-6 rounded-3xl md:col-span-3 space-y-5 text-left">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">Selections by Question</h3>
                    <p className="text-[10px] text-zinc-500">Distribution percentages across prompts Q1 to Q5</p>
                  </div>

                  <div className="space-y-4 pt-1 text-[10px] font-semibold text-zinc-400">
                    {[1, 2, 3, 4, 5].map((qNum) => {
                      const dist = getQuestionDistribution(qNum);
                      return (
                        <div key={qNum} className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="font-bold text-white">Q{qNum}. {qNum === 1 ? 'Overthinking' : qNum === 2 ? 'Avoiding' : qNum === 3 ? 'Identity' : qNum === 4 ? 'Relationships' : 'Family Dynamics'}</span>
                            <span className="text-zinc-500">{dist.total} responses</span>
                          </div>
                          {dist.total > 0 ? (
                            <div className="h-2.5 w-full bg-[#24163f] rounded-full overflow-hidden flex">
                              <div className="h-full bg-purple-500" style={{ width: `${dist.cbt}%` }} title={`CBT: ${dist.cbt}%`} />
                              <div className="h-full bg-indigo-500" style={{ width: `${dist.behavioural}%` }} title={`Behavioural: ${dist.behavioural}%`} />
                              <div className="h-full bg-rose-500" style={{ width: `${dist.psychodynamic}%` }} title={`Psychodynamic: ${dist.psychodynamic}%`} />
                              <div className="h-full bg-amber-500" style={{ width: `${dist.humanistic}%` }} title={`Humanistic: ${dist.humanistic}%`} />
                              <div className="h-full bg-emerald-500" style={{ width: `${dist.systemic}%` }} title={`Systemic: ${dist.systemic}%`} />
                            </div>
                          ) : (
                            <div className="h-2.5 w-full bg-[#24163f] rounded-full text-center text-[8px] text-zinc-600 flex items-center justify-center italic">
                              No data recorded
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* Donut Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-2 text-[8px] uppercase tracking-wider font-extrabold">
                      <div className="flex items-center space-x-1"><div className="h-2 w-2 rounded-full bg-purple-500" /><span>CBT</span></div>
                      <div className="flex items-center space-x-1"><div className="h-2 w-2 rounded-full bg-indigo-500" /><span>Behavioural</span></div>
                      <div className="flex items-center space-x-1"><div className="h-2 w-2 rounded-full bg-rose-500" /><span>Psychodynamic</span></div>
                      <div className="flex items-center space-x-1"><div className="h-2 w-2 rounded-full bg-amber-500" /><span>Humanistic</span></div>
                      <div className="flex items-center space-x-1"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span>Systemic</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            /* =====================================================================
               TAB 2: PARTICIPANTS GENERAL RECORDS LIST
               ===================================================================== */
            <div className="bg-[#13072b] border border-white/5 rounded-3xl overflow-hidden shadow animate-fade-in text-left">
              <div className="p-5 border-b border-white/5">
                <h2 className="font-serif text-base font-bold text-white">Participant Session Records</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-400 uppercase font-extrabold text-[9px] tracking-wider bg-[#1e0e3d]/30">
                      <th className="p-4 pl-6">Participant ID</th>
                      <th className="p-4">Participant Name</th>
                      <th className="p-4">Age</th>
                      <th className="p-4">Completed</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {records.map((record) => {
                      const completedDate = record.completed_at
                        ? new Date(record.completed_at).toLocaleDateString()
                        : 'In Progress';

                      return (
                        <tr key={record.id} className="hover:bg-[#24163f]/30 transition duration-150">
                          <td className="p-4 pl-6 font-mono text-zinc-400 font-semibold">{record.id.substring(0, 8)}...</td>
                          <td className="p-4 font-bold text-white">{record.name}</td>
                          <td className="p-4 text-zinc-300 font-medium">{record.age || '—'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              record.completed_at
                                ? 'bg-green-500/10 border-green-550 text-green-400'
                                : 'bg-amber-500/10 border-amber-550 text-amber-400'
                            }`}>
                              {completedDate}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <button
                              onClick={() => setSelectedRecord(record)}
                              className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline flex items-center space-x-1 ml-auto"
                            >
                              <span>View Profile</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'responses' && (
            /* =====================================================================
               TAB 3: TEXT RESPONSE ANALYSIS (Searchable Table)
               ===================================================================== */
            <div className="space-y-6 animate-fade-in text-left">
              
              {/* Question Analysis Subblock */}
              <div className="bg-[#13072b] border border-white/5 p-6 rounded-3xl grid gap-6 md:grid-cols-3">
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">Question Breakdowns</h3>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Select a question step to inspect individual approach distributions and favorites.
                  </p>
                  
                  {/* Select Dropdown */}
                  <select 
                    value={analysisQuestionNum}
                    onChange={(e) => setAnalysisQuestionNum(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-3 bg-[#24163f] border border-white/5 rounded-xl text-xs font-semibold focus:outline-none text-white cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>Q{n}. {questions[n-1]}</option>
                    ))}
                  </select>
                </div>

                {/* Substats */}
                <div className="bg-[#24163f]/30 border border-white/5 p-5 rounded-2xl space-y-2 flex flex-col justify-center">
                  <p className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400">Total Question Responses</p>
                  <p className="font-serif text-2xl font-bold text-white">{analysisDist.total}</p>
                  <p className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400 mt-2">Favorite Approach</p>
                  <p className="font-serif text-xl font-bold text-purple-300">{analysisFavApproach} ({analysisFavCount} picks)</p>
                </div>

                {/* Question SVG Percentages Bar Graph */}
                <div className="flex flex-col justify-center space-y-1.5 text-[9px] font-bold text-zinc-300 font-mono">
                  {analysisDist.total > 0 && Object.keys(analysisDist.rawCounts || {}).map((key) => {
                    const count = (analysisDist.rawCounts as any)[key];
                    const pct = Math.round((count / analysisDist.total) * 100);
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${approachColors[key]}`} />
                          <span className="capitalize">{key}</span>
                        </div>
                        <span>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Table search filters */}
              <div className="bg-[#13072b] border border-white/5 p-5 rounded-3xl grid gap-4 sm:grid-cols-2 md:grid-cols-5 items-end">
                {/* Search query */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[9px] uppercase font-extrabold text-zinc-400 tracking-wider">Search Reflections</label>
                  <div className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-550" />
                    <input
                      type="text"
                      placeholder="Search participant or reason text..."
                      value={textSearch}
                      onChange={(e) => setTextSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#24163f] border border-white/5 rounded-xl text-xs focus:outline-none text-white"
                    />
                  </div>
                </div>

                {/* Filter Question */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-extrabold text-zinc-400 tracking-wider">Question</label>
                  <select
                    value={filterQuestion}
                    onChange={(e) => setFilterQuestion(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#24163f] border border-white/5 rounded-xl text-xs focus:outline-none text-white cursor-pointer"
                  >
                    <option value="All">All Questions</option>
                    <option value="1">Q1. Overthinking</option>
                    <option value="2">Q2. Avoiding</option>
                    <option value="3">Q3. Identity</option>
                    <option value="4">Q4. Relationships</option>
                    <option value="5">Q5. Family Dynamics</option>
                  </select>
                </div>

                {/* Filter Approach */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-extrabold text-zinc-400 tracking-wider">Approach</label>
                  <select
                    value={filterApproach}
                    onChange={(e) => setFilterApproach(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#24163f] border border-white/5 rounded-xl text-xs focus:outline-none text-white cursor-pointer"
                  >
                    <option value="All">All Approaches</option>
                    <option value="cbt">CBT</option>
                    <option value="behavioural">Behavioural</option>
                    <option value="psychodynamic">Psychodynamic</option>
                    <option value="humanistic">Humanistic</option>
                    <option value="systemic">Systemic</option>
                  </select>
                </div>

                {/* Date range trigger */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-extrabold text-zinc-400 tracking-wider">Date From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#24163f] border border-white/5 rounded-xl text-xs focus:outline-none text-white cursor-pointer"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="bg-[#13072b] border border-white/5 rounded-3xl overflow-hidden shadow">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-400 uppercase font-extrabold text-[9px] tracking-wider bg-[#1e0e3d]/30">
                        <th className="p-4 pl-6">Participant</th>
                        <th className="p-4 w-40">Question</th>
                        <th className="p-4">Selected Model</th>
                        <th className="p-4 w-96">Reason/Reflection</th>
                        <th className="p-4 pr-6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredTextResponses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-16 text-center text-xs text-zinc-500 italic">
                            No matching responses found.
                          </td>
                        </tr>
                      ) : (
                        filteredTextResponses.map((res) => (
                          <tr key={res.id} className="hover:bg-[#24163f]/20 transition duration-150">
                            <td className="p-4 pl-6 font-bold text-white truncate max-w-[120px]">{res.participantName}</td>
                            <td className="p-4 text-zinc-300 font-semibold truncate max-w-[150px]" title={res.question_text}>Q{res.question_number}: {res.question_text}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border border-purple-500/10 bg-purple-500/5 text-[9px] font-bold tracking-wider uppercase text-purple-300">
                                {getCardIcon(res.selected_card, "h-2.5 w-2.5")}
                                <span>{res.selected_card}</span>
                              </span>
                            </td>
                            <td className="p-4 text-zinc-300 font-medium italic break-words">
                              {res.reason ? `“${res.reason}”` : <span className="text-zinc-600 font-normal italic">Skipped reason</span>}
                            </td>
                            <td className="p-4 pr-6 text-zinc-450 font-semibold">{new Date(res.date).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reflections' && (
            /* =====================================================================
               TAB 4: FINAL THEME REFLECTIONS LIST (Searchable list)
               ===================================================================== */
            <div className="space-y-6 animate-fade-in text-left">
              {/* Search Bar */}
              <div className="bg-[#13072b] border border-white/5 p-4.5 rounded-3xl max-w-sm">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-550" />
                  <input
                    type="text"
                    placeholder="Search by participant name or quote..."
                    value={reflectionSearch}
                    onChange={(e) => setReflectionSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-[#24163f] border border-white/5 rounded-xl text-xs focus:outline-none text-white font-medium"
                  />
                </div>
              </div>

              {/* Reflection Card list */}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredReflections.length === 0 ? (
                  <div className="col-span-2 bg-[#13072b] border border-white/5 p-16 rounded-3xl text-center text-xs text-zinc-500 italic">
                    No matching final reflections found.
                  </div>
                ) : (
                  filteredReflections.map((ref, idx) => (
                    <div key={idx} className="bg-[#13072b] border border-white/5 p-6 rounded-3xl space-y-4 flex flex-col justify-between shadow-sm">
                      <p className="text-xs text-zinc-200 font-semibold italic leading-relaxed">
                        &ldquo;{ref.reflection}&rdquo;
                      </p>
                      
                      <div className="flex justify-between items-center border-t border-white/5 pt-3 text-[10px] font-bold text-zinc-450">
                        <span className="text-purple-300">{ref.participantName}</span>
                        <span>{new Date(ref.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* RENDER DETAILED PARTICIPANT DRAWER/SIDEBAR (Timeline) */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-[#070212]/80 backdrop-blur-sm z-50 flex justify-end animate-fade-in text-left select-none">
          <div className="w-full max-w-[500px] h-full bg-[#13072b] border-l border-white/5 p-6 overflow-y-auto flex flex-col justify-between space-y-6 relative shadow-2xl">
            
            {/* Close trigger */}
            <button 
              onClick={() => setSelectedRecord(null)}
              className="absolute top-6 right-6 p-2 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white transition"
              aria-label="Close details"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-6 flex-grow">
              {/* Header profile details */}
              <div className="space-y-1 border-b border-white/5 pb-4">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-purple-400 font-mono">Participant UUID: {selectedRecord.id}</span>
                <h3 className="font-serif text-2xl font-bold text-white">{selectedRecord.name}</h3>
                <p className="text-xs text-zinc-400 font-medium">
                  Age: {selectedRecord.age || '—'} &bull; Registered: {new Date(selectedRecord.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Step Timeline Selection Grid */}
              <div className="space-y-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Self-Reflection Timeline</h4>
                
                {(() => {
                  const session = selectedRecord.sessions && selectedRecord.sessions[0];
                  const responses = session?.responses || [];
                  const finalReflection = session?.final_reflections && session.final_reflections[0];

                  return (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((qNum) => {
                        const resp = responses.find((r) => r.question_number === qNum);
                        
                        return (
                          <div key={qNum} className="flex space-x-3 text-xs border-l-2 border-[#24163f] pl-4 relative">
                            {/* Marker dot */}
                            <div className={`absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full border border-purple-900/50 flex items-center justify-center text-[9px] font-bold ${
                              resp ? 'bg-[#6355d8] text-white' : 'bg-[#24163f] text-zinc-500'
                            }`}>
                              {qNum}
                            </div>
                            
                            <div className="space-y-1.5 flex-1">
                              <p className="font-bold text-[#faf8fd]">Q{qNum}: &ldquo;{questions[qNum-1]}&rdquo;</p>
                              {resp ? (
                                <div className="p-3.5 bg-[#24163f] border border-white/5 rounded-2xl space-y-2">
                                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border border-purple-500/10 bg-purple-500/5 text-[9px] font-bold tracking-wider uppercase text-purple-300">
                                    {getCardIcon(resp.selected_card, "h-2.5 w-2.5")}
                                    <span>{resp.selected_card}</span>
                                  </span>
                                  {resp.reason ? (
                                    <p className="text-zinc-350 italic border-t border-dashed border-white/5 pt-2 leading-relaxed">&ldquo;{resp.reason}&rdquo;</p>
                                  ) : (
                                    <p className="text-zinc-500 italic border-t border-dashed border-white/5 pt-2 font-normal">Skipped reasoning reflection</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-zinc-500 italic">Not answered yet</p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Final reflection timeline element */}
                      <div className="flex space-x-3 text-xs border-l-2 border-transparent pl-4 relative">
                        <div className={`absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          finalReflection ? 'bg-purple-650 text-white' : 'bg-[#24163f] text-zinc-500'
                        }`}>
                          <Heart className="h-2 w-2" fill="currentColor" />
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <p className="font-bold text-[#faf8fd]">Final Overall Reflection Theme</p>
                          {finalReflection && finalReflection.reflection ? (
                            <div className="p-3.5 bg-[#24163f] border border-white/5 rounded-2xl italic leading-relaxed text-zinc-300">
                              &ldquo;{finalReflection.reflection}&rdquo;
                            </div>
                          ) : (
                            <p className="text-zinc-500 italic">No final summary reflection submitted</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-full text-xs font-semibold transition"
              >
                Close Profile Detail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
