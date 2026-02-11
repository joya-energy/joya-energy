import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users, Mail, Phone, Building2, Calendar, Search, Filter,
  TrendingUp, UserPlus, Eye, ArrowUpRight, ChevronDown,
  X, Clock, CheckCircle2, AlertCircle, MessageSquare,
  BarChart3, Globe, FileText, Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// ---------- types ----------
type LeadStatus = "nouveau" | "contacté" | "qualifié" | "converti" | "perdu";
type LeadSource = "contact" | "newsletter" | "simulateur" | "partenaire";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: LeadSource;
  status: LeadStatus;
  subject: string;
  message: string;
  date: string;
  notes: string[];
}

// ---------- mock data ----------
const MOCK_LEADS: Lead[] = [
  {
    id: "1", name: "Ahmed Ben Salah", email: "ahmed@greentech.tn", phone: "+216 71 234 567",
    company: "GreenTech Solutions", source: "simulateur", status: "qualifié",
    subject: "Audit Solaire", message: "Intéressé par une installation solaire pour notre usine de 2000m².",
    date: "2026-02-10", notes: ["Rappel prévu le 12/02", "Budget estimé : 150k TND"],
  },
  {
    id: "2", name: "Fatma Chaabane", email: "f.chaabane@medipark.tn", phone: "+216 70 987 654",
    company: "MediPark Clinic", source: "contact", status: "nouveau",
    subject: "Audit Énergétique", message: "Nous souhaitons réduire notre consommation d'énergie dans notre clinique.",
    date: "2026-02-09", notes: [],
  },
  {
    id: "3", name: "Karim Trabelsi", email: "k.trabelsi@hotel-azur.tn", phone: "+216 73 456 789",
    company: "Hôtel Azur", source: "newsletter", status: "contacté",
    subject: "Information générale", message: "J'ai lu votre article sur le tiers-investissement, je souhaite en savoir plus.",
    date: "2026-02-08", notes: ["Premier contact par email le 08/02"],
  },
  {
    id: "4", name: "Sonia Mejri", email: "s.mejri@agroplus.tn", phone: "+216 72 111 222",
    company: "AgroPlus SARL", source: "simulateur", status: "converti",
    subject: "Empreinte Carbone", message: "Nous devons établir notre bilan carbone pour 2025.",
    date: "2026-02-05", notes: ["Contrat signé le 07/02", "Démarrage audit prévu mars 2026"],
  },
  {
    id: "5", name: "Nabil Gharbi", email: "nabil@batipro.tn", phone: "+216 74 333 444",
    company: "BatiPro", source: "partenaire", status: "qualifié",
    subject: "Comparateur Financements", message: "Besoin d'un comparatif pour financer la rénovation énergétique de nos bureaux.",
    date: "2026-02-07", notes: ["Référé par notre partenaire BankGreen"],
  },
  {
    id: "6", name: "Leila Hamdi", email: "leila@startupflow.tn", phone: "+216 55 666 777",
    company: "StartupFlow", source: "newsletter", status: "perdu",
    subject: "Information générale", message: "Exploration des options pour nos locaux. Budget très limité.",
    date: "2026-01-28", notes: ["Pas de budget pour 2026"],
  },
  {
    id: "7", name: "Youssef Mansour", email: "y.mansour@logistiq.tn", phone: "+216 71 888 999",
    company: "LogistiQ", source: "contact", status: "nouveau",
    subject: "Audit Solaire", message: "Intéressé par le solaire pour notre entrepôt de 5000m².",
    date: "2026-02-10", notes: [],
  },
  {
    id: "8", name: "Ines Bouazizi", email: "ines@ecobuild.tn", phone: "+216 76 222 333",
    company: "EcoBuild", source: "simulateur", status: "contacté",
    subject: "Audit Énergétique", message: "Nous cherchons à obtenir la certification ISO 50001.",
    date: "2026-02-06", notes: ["Devis envoyé le 06/02"],
  },
];

// ---------- helpers ----------
const statusConfig: Record<LeadStatus, { label: string; color: string; icon: React.ElementType }> = {
  nouveau: { label: "Nouveau", color: "bg-blue-100 text-blue-700 border-blue-200", icon: UserPlus },
  contacté: { label: "Contacté", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Phone },
  qualifié: { label: "Qualifié", color: "bg-purple-100 text-purple-700 border-purple-200", icon: CheckCircle2 },
  converti: { label: "Converti", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: TrendingUp },
  perdu: { label: "Perdu", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
};

const sourceConfig: Record<LeadSource, { label: string; icon: React.ElementType }> = {
  contact: { label: "Formulaire contact", icon: FileText },
  newsletter: { label: "Newsletter", icon: Megaphone },
  simulateur: { label: "Simulateur", icon: BarChart3 },
  partenaire: { label: "Partenaire", icon: Globe },
};

// ---------- sub-components ----------
function StatCard({ icon: Icon, label, value, trend, accent = false }: {
  icon: React.ElementType; label: string; value: string | number; trend?: string; accent?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
      accent
        ? "gradient-cta border-transparent text-text-on-dark"
        : "border-border bg-background shadow-card hover:shadow-card-hover"
    }`}>
      {accent && <div className="pattern-dots absolute inset-0 pointer-events-none" />}
      <div className="relative flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${accent ? "text-text-on-dark/70" : "text-muted-foreground"}`}>{label}</p>
          <p className={`mt-2 text-3xl font-bold font-heading ${accent ? "" : "text-teal-deep"}`}>{value}</p>
          {trend && (
            <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${accent ? "text-orange-glow" : "text-orange-solar"}`}>
              <ArrowUpRight className="h-3 w-3" /> {trend}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-3 ${accent ? "bg-white/10" : "bg-orange-solar/10"}`}>
          <Icon className={`h-6 w-6 ${accent ? "text-orange-glow" : "text-orange-solar"}`} />
        </div>
      </div>
    </div>
  );
}

function LeadDetailModal({ lead, open, onClose }: { lead: Lead | null; open: boolean; onClose: () => void }) {
  if (!lead) return null;
  const sc = statusConfig[lead.status];
  const StatusIcon = sc.icon;
  const src = sourceConfig[lead.source];
  const SrcIcon = src.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-teal-deep">{lead.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* status & source */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${sc.color}`}>
              <StatusIcon className="h-3.5 w-3.5" /> {sc.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              <SrcIcon className="h-3.5 w-3.5" /> {src.label}
            </span>
          </div>

          {/* info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 text-orange-solar" /><span className="truncate">{lead.email}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 text-orange-solar" />{lead.phone}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4 text-orange-solar" />{lead.company}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4 text-orange-solar" />{new Date(lead.date).toLocaleDateString("fr-TN")}</div>
          </div>

          {/* subject & message */}
          <div>
            <h4 className="text-sm font-semibold text-teal-deep mb-1">Sujet : {lead.subject}</h4>
            <p className="rounded-lg bg-muted p-4 text-sm leading-relaxed text-foreground">{lead.message}</p>
          </div>

          {/* notes */}
          {lead.notes.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-teal-deep mb-2">
                <MessageSquare className="h-4 w-4" /> Notes
              </h4>
              <ul className="space-y-2">
                {lead.notes.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-solar" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- main page ----------
export default function Leads() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Lead | null>(null);

  const filtered = useMemo(() => {
    return MOCK_LEADS.filter((l) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      const matchesSource = sourceFilter === "all" || l.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [search, statusFilter, sourceFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: MOCK_LEADS.length,
      newToday: MOCK_LEADS.filter((l) => l.date === today).length,
      qualified: MOCK_LEADS.filter((l) => l.status === "qualifié").length,
      converted: MOCK_LEADS.filter((l) => l.status === "converti").length,
    };
  }, []);

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-orange-solar/5 blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-teal-soft/10 blur-3xl animate-float-delayed" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-fade-in">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-orange-solar">
              Tableau de bord
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl text-teal-deep">
              Gestion des Leads
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Suivez et gérez tous les prospects entrants — formulaires, simulateurs et newsletters.
            </p>
          </div>
          <Link to="/contact">
            <Button variant="cta" className="gap-2 rounded-xl">
              <UserPlus className="h-4 w-4" /> Nouveau Lead
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <StatCard icon={Users} label="Total leads" value={stats.total} trend="+12% ce mois" accent />
          <StatCard icon={Clock} label="Nouveaux aujourd'hui" value={stats.newToday} />
          <StatCard icon={CheckCircle2} label="Qualifiés" value={stats.qualified} trend="+3 cette semaine" />
          <StatCard icon={TrendingUp} label="Convertis" value={stats.converted} />
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email ou entreprise…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/80 backdrop-blur border-border"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-background/80 backdrop-blur border-border">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px] bg-background/80 backdrop-blur border-border">
                <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                {Object.entries(sourceConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-background/80 backdrop-blur shadow-card animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="font-semibold text-teal-deep">Nom</TableHead>
                <TableHead className="font-semibold text-teal-deep">Entreprise</TableHead>
                <TableHead className="font-semibold text-teal-deep hidden md:table-cell">Source</TableHead>
                <TableHead className="font-semibold text-teal-deep">Statut</TableHead>
                <TableHead className="font-semibold text-teal-deep hidden lg:table-cell">Date</TableHead>
                <TableHead className="font-semibold text-teal-deep text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                    <Search className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    <p className="font-semibold">Aucun lead trouvé</p>
                    <p className="text-sm">Essayez d'ajuster vos filtres</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((lead) => {
                  const sc = statusConfig[lead.status];
                  const StatusIcon = sc.icon;
                  const src = sourceConfig[lead.source];
                  const SrcIcon = src.icon;
                  return (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                      onClick={() => setSelected(lead)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.company}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <SrcIcon className="h-3.5 w-3.5" /> {src.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>
                          <StatusIcon className="h-3 w-3" /> {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {new Date(lead.date).toLocaleDateString("fr-TN", { day: "numeric", month: "short" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-orange-solar hover:text-orange-solar"
                          onClick={(e) => { e.stopPropagation(); setSelected(lead); }}
                        >
                          <Eye className="h-4 w-4" /> Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <p className="mt-3 text-right text-xs text-muted-foreground">
          {filtered.length} lead{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
        </p>
      </div>

      <LeadDetailModal lead={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
