import { useState, useEffect, useMemo } from "react";
import { format, parseISO, eachDayOfInterval, isWithinInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { getAbsences, getStats, createAbsence, getMyBalance } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  CalendarDays,
  Users,
  Clock,
  CheckCircle,
  Plus,
  Loader2,
  Palmtree,
  Timer,
  Thermometer,
  Filter,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ABSENCE_TYPES = {
  ferie: { label: "Ferie", icon: Palmtree, color: "bg-emerald-500", lightColor: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  permesso: { label: "Permesso", icon: Timer, color: "bg-sky-500", lightColor: "bg-sky-100 text-sky-700 border-sky-200" },
  malattia: { label: "Malattia", icon: Thermometer, color: "bg-rose-500", lightColor: "bg-rose-100 text-rose-700 border-rose-200" },
};

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_LABELS = {
  pending: "In attesa",
  approved: "Approvata",
  rejected: "Rifiutata",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [absences, setAbsences] = useState([]);
  const [stats, setStats] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState("calendar"); // calendar or list
  
  // Filters
  const [filterFerie, setFilterFerie] = useState(true);
  const [filterPermesso, setFilterPermesso] = useState(true);
  const [filterMalattia, setFilterMalattia] = useState(true);
  const [filterStatus, setFilterStatus] = useState("approved");

  // New absence form
  const [absenceType, setAbsenceType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [absencesRes, statsRes, balanceRes] = await Promise.all([
        getAbsences(),
        getStats(),
        getMyBalance()
      ]);
      setAbsences(absencesRes.data);
      setStats(statsRes.data);
      setBalance(balanceRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAbsence = async (e) => {
    e.preventDefault();
    
    if (absenceType === "permesso" && !hours) {
      toast.error("Inserisci le ore per il permesso");
      return;
    }
    
    setSubmitting(true);
    try {
      await createAbsence({
        absence_type: absenceType,
        start_date: startDate,
        end_date: endDate,
        hours: absenceType === "permesso" ? parseFloat(hours) : null,
        notes: notes || null,
      });
      toast.success("Richiesta inviata con successo!");
      setDialogOpen(false);
      setAbsenceType("");
      setStartDate("");
      setEndDate("");
      setHours("");
      setNotes("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'invio della richiesta");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered absences
  const filteredAbsences = useMemo(() => {
    return absences.filter((a) => {
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (a.absence_type === "ferie" && !filterFerie) return false;
      if (a.absence_type === "permesso" && !filterPermesso) return false;
      if (a.absence_type === "malattia" && !filterMalattia) return false;
      return true;
    });
  }, [absences, filterFerie, filterPermesso, filterMalattia, filterStatus]);

  // Get absences for calendar visualization
  const absenceDays = useMemo(() => {
    const days = {};
    filteredAbsences.forEach((absence) => {
      try {
        const start = parseISO(absence.start_date);
        const end = parseISO(absence.end_date);
        eachDayOfInterval({ start, end }).forEach((day) => {
          const key = format(day, "yyyy-MM-dd");
          if (!days[key]) days[key] = [];
          days[key].push(absence);
        });
      } catch (e) {
        console.error("Error parsing date:", e);
      }
    });
    return days;
  }, [filteredAbsences]);

  // Get absences for selected date
  const selectedDateAbsences = useMemo(() => {
    return filteredAbsences.filter((absence) => {
      try {
        const start = parseISO(absence.start_date);
        const end = parseISO(absence.end_date);
        return isWithinInterval(selectedDate, { start, end });
      } catch (e) {
        return false;
      }
    });
  }, [filteredAbsences, selectedDate]);

  // Calendar modifiers for coloring
  const modifiers = useMemo(() => {
    const ferieDays = [];
    const permessoDays = [];
    const malattiaDays = [];

    Object.entries(absenceDays).forEach(([dateStr, dayAbsences]) => {
      const date = parseISO(dateStr);
      const types = [...new Set(dayAbsences.map(a => a.absence_type))];
      if (types.includes("ferie")) ferieDays.push(date);
      if (types.includes("permesso")) permessoDays.push(date);
      if (types.includes("malattia")) malattiaDays.push(date);
    });

    return { ferie: ferieDays, permesso: permessoDays, malattia: malattiaDays };
  }, [absenceDays]);

  const modifiersStyles = {
    ferie: { backgroundColor: "#10b981", color: "white", borderRadius: "8px" },
    permesso: { backgroundColor: "#0ea5e9", color: "white", borderRadius: "8px" },
    malattia: { backgroundColor: "#f43f5e", color: "white", borderRadius: "8px" },
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const feriePercentage = balance ? Math.min(100, (balance.ferie_used / (balance.ferie_total || 1)) * 100) : 0;
  const permessiPercentage = balance ? Math.min(100, (balance.permessi_used / (balance.permessi_total || 1)) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">
            Benvenuto, {user?.first_name}!
          </h1>
          <p className="text-slate-500 mt-1">
            Visualizza il calendario delle assenze del team
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/20"
              data-testid="new-request-btn"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuova Richiesta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Nuova Richiesta di Assenza</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAbsence} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tipo di assenza</Label>
                <Select value={absenceType} onValueChange={setAbsenceType} required>
                  <SelectTrigger className="rounded-xl" data-testid="absence-type-select">
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ferie">Ferie</SelectItem>
                    <SelectItem value="permesso">Permesso</SelectItem>
                    <SelectItem value="malattia">Malattia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Data inizio</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="rounded-xl"
                    data-testid="start-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Data fine</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    min={startDate}
                    className="rounded-xl"
                    data-testid="end-date-input"
                  />
                </div>
              </div>
              
              {absenceType === "permesso" && (
                <div className="space-y-2">
                  <Label htmlFor="hours">Ore di permesso *</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="8"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    required
                    placeholder="Es: 2, 4, 8"
                    className="rounded-xl"
                    data-testid="hours-input"
                  />
                  <p className="text-xs text-slate-500">Inserisci le ore richieste (max 8)</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="notes">Note (opzionale)</Label>
                <Textarea
                  id="notes"
                  placeholder="Aggiungi note..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={3}
                  data-testid="notes-input"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 hover:bg-slate-800 rounded-xl"
                data-testid="submit-request-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  "Invia Richiesta"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Balance Cards */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-2xl border-slate-100 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Palmtree className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Ferie</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {balance.ferie_remaining.toFixed(1)}h
                      <span className="text-sm font-normal text-slate-400"> residue</span>
                    </p>
                  </div>
                </div>
              </div>
              <Progress value={feriePercentage} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Utilizzate: {balance.ferie_used.toFixed(1)}h</span>
                <span>Totale: {balance.ferie_total.toFixed(1)}h</span>
              </div>
              {balance.ferie_pending > 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  In attesa: {balance.ferie_pending.toFixed(1)}h
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center">
                    <Timer className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Permessi</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {balance.permessi_remaining.toFixed(1)}h
                      <span className="text-sm font-normal text-slate-400"> residue</span>
                    </p>
                  </div>
                </div>
              </div>
              <Progress value={permessiPercentage} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Utilizzate: {balance.permessi_used.toFixed(1)}h</span>
                <span>Totale: {balance.permessi_total.toFixed(1)}h</span>
              </div>
              {balance.permessi_pending > 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  In attesa: {balance.permessi_pending.toFixed(1)}h
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Dipendenti</p>
                <p className="text-xl font-bold text-slate-900">{stats?.total_users || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">In Attesa</p>
                <p className="text-xl font-bold text-amber-600">{stats?.pending_absences || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Approvate</p>
                <p className="text-xl font-bold text-emerald-600">{stats?.approved_absences || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Totale</p>
                <p className="text-xl font-bold text-slate-900">{stats?.total_absences || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-slate-100 shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filtri:</span>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filterFerie}
                  onCheckedChange={setFilterFerie}
                  className="border-emerald-500 data-[state=checked]:bg-emerald-500"
                />
                <span className="text-sm text-slate-600">Ferie</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filterPermesso}
                  onCheckedChange={setFilterPermesso}
                  className="border-sky-500 data-[state=checked]:bg-sky-500"
                />
                <span className="text-sm text-slate-600">Permessi</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filterMalattia}
                  onCheckedChange={setFilterMalattia}
                  className="border-rose-500 data-[state=checked]:bg-rose-500"
                />
                <span className="text-sm text-slate-600">Malattia</span>
              </label>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 rounded-lg h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="approved">Approvate</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="rejected">Rifiutate</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className="rounded-lg"
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-lg"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar or List View */}
      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Large Calendar */}
          <Card className="lg:col-span-3 rounded-2xl border-slate-100 shadow-card" data-testid="calendar-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-xl">Calendario Assenze</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {format(currentMonth, "MMMM yyyy", { locale: it })}
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={it}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-xl w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                  month: "space-y-4 w-full",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-sm py-2",
                  row: "flex w-full mt-2",
                  cell: "flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                  day: "h-12 w-full p-0 font-normal hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center",
                  day_selected: "bg-slate-900 text-white hover:bg-slate-800",
                  day_today: "border-2 border-slate-900",
                  day_outside: "text-muted-foreground opacity-50",
                }}
                data-testid="calendar"
              />
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-100">
                {Object.entries(ABSENCE_TYPES).map(([key, { label, color }]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded ${color}`} />
                    <span className="text-sm text-slate-600">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          <Card className="rounded-2xl border-slate-100 shadow-card" data-testid="activity-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                {format(selectedDate, "d MMMM yyyy", { locale: it })}
              </CardTitle>
              <p className="text-sm text-slate-500">{selectedDateAbsences.length} assenze</p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {selectedDateAbsences.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    Nessuna assenza in questa data
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedDateAbsences.map((absence) => {
                      const TypeIcon = ABSENCE_TYPES[absence.absence_type]?.icon || CalendarDays;
                      return (
                        <div
                          key={absence.absence_id}
                          className={`p-4 rounded-xl border ${ABSENCE_TYPES[absence.absence_type]?.lightColor || "bg-slate-50"}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <TypeIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">{absence.user_name}</span>
                          </div>
                          <p className="text-xs opacity-80">
                            {ABSENCE_TYPES[absence.absence_type]?.label}
                            {absence.hours && ` - ${absence.hours}h`}
                          </p>
                          <p className="text-xs opacity-60 mt-1">
                            {format(parseISO(absence.start_date), "d MMM", { locale: it })} -{" "}
                            {format(parseISO(absence.end_date), "d MMM", { locale: it })}
                          </p>
                          <Badge
                            variant="outline"
                            className={`mt-2 text-xs ${STATUS_STYLES[absence.status]}`}
                          >
                            {STATUS_LABELS[absence.status]}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* List View */
        <Card className="rounded-2xl border-slate-100 shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Elenco Assenze</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {filteredAbsences.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Nessuna assenza trovata con i filtri selezionati
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredAbsences.map((absence) => {
                    const TypeIcon = ABSENCE_TYPES[absence.absence_type]?.icon || CalendarDays;
                    return (
                      <div
                        key={absence.absence_id}
                        className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${ABSENCE_TYPES[absence.absence_type]?.lightColor.split(" ")[0] || "bg-slate-100"}`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{absence.user_name}</p>
                            <p className="text-sm text-slate-500">
                              {ABSENCE_TYPES[absence.absence_type]?.label}
                              {absence.hours && ` - ${absence.hours}h`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-600">
                            {format(parseISO(absence.start_date), "d MMM", { locale: it })} -{" "}
                            {format(parseISO(absence.end_date), "d MMM yyyy", { locale: it })}
                          </p>
                          <Badge
                            variant="outline"
                            className={`mt-1 ${STATUS_STYLES[absence.status]}`}
                          >
                            {STATUS_LABELS[absence.status]}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
