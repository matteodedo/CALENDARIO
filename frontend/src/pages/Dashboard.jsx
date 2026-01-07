import { useState, useEffect, useMemo } from "react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from "date-fns";
import { it } from "date-fns/locale";
import { getAbsences, getStats, createAbsence } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";

const ABSENCE_TYPES = {
  ferie: { label: "Ferie", icon: Palmtree, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  permesso: { label: "Permesso", icon: Timer, color: "bg-sky-100 text-sky-700 border-sky-200" },
  malattia: { label: "Malattia", icon: Thermometer, color: "bg-rose-100 text-rose-700 border-rose-200" },
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
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New absence form
  const [absenceType, setAbsenceType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [absencesRes, statsRes] = await Promise.all([getAbsences(), getStats()]);
      setAbsences(absencesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAbsence = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAbsence({
        absence_type: absenceType,
        start_date: startDate,
        end_date: endDate,
        notes: notes || null,
      });
      toast.success("Richiesta inviata con successo!");
      setDialogOpen(false);
      setAbsenceType("");
      setStartDate("");
      setEndDate("");
      setNotes("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'invio della richiesta");
    } finally {
      setSubmitting(false);
    }
  };

  // Get absences for calendar visualization
  const absenceDays = useMemo(() => {
    const days = {};
    absences
      .filter((a) => a.status === "approved")
      .forEach((absence) => {
        const start = parseISO(absence.start_date);
        const end = parseISO(absence.end_date);
        eachDayOfInterval({ start, end }).forEach((day) => {
          const key = format(day, "yyyy-MM-dd");
          if (!days[key]) days[key] = [];
          days[key].push(absence);
        });
      });
    return days;
  }, [absences]);

  // Get absences for selected date
  const selectedDateAbsences = useMemo(() => {
    return absences.filter((absence) => {
      const start = parseISO(absence.start_date);
      const end = parseISO(absence.end_date);
      return isWithinInterval(selectedDate, { start, end });
    });
  }, [absences, selectedDate]);

  // Calendar day render
  const modifiers = useMemo(() => {
    const ferieDays = [];
    const permessoDays = [];
    const malattiaDays = [];

    Object.entries(absenceDays).forEach(([dateStr, dayAbsences]) => {
      const date = parseISO(dateStr);
      dayAbsences.forEach((absence) => {
        if (absence.absence_type === "ferie") ferieDays.push(date);
        if (absence.absence_type === "permesso") permessoDays.push(date);
        if (absence.absence_type === "malattia") malattiaDays.push(date);
      });
    });

    return { ferie: ferieDays, permesso: permessoDays, malattia: malattiaDays };
  }, [absenceDays]);

  const modifiersStyles = {
    ferie: { backgroundColor: "hsl(152, 81%, 96%)", borderRadius: "50%" },
    permesso: { backgroundColor: "hsl(199, 89%, 95%)", borderRadius: "50%" },
    malattia: { backgroundColor: "hsl(350, 100%, 97%)", borderRadius: "50%" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100 shadow-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Dipendenti</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.total_users || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">In Attesa</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats?.pending_absences || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Approvate</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats?.approved_absences || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Totale Richieste</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.total_absences || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-100 shadow-card" data-testid="calendar-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-xl">Calendario Assenze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={it}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  className="rounded-xl"
                  data-testid="calendar"
                />
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                  {Object.entries(ABSENCE_TYPES).map(([key, { label, color }]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${color.split(" ")[0]}`} />
                      <span className="text-xs text-slate-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Selected Date Details */}
              <div className="w-full md:w-64">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-heading font-semibold text-slate-900">
                    {format(selectedDate, "d MMMM yyyy", { locale: it })}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedDateAbsences.length} assenze
                  </p>
                </div>
                <ScrollArea className="h-48 mt-4">
                  {selectedDateAbsences.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      Nessuna assenza in questa data
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateAbsences.map((absence) => {
                        const TypeIcon = ABSENCE_TYPES[absence.absence_type]?.icon || CalendarDays;
                        return (
                          <div
                            key={absence.absence_id}
                            className={`p-3 rounded-xl border ${ABSENCE_TYPES[absence.absence_type]?.color || "bg-slate-50"}`}
                          >
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4" />
                              <span className="text-sm font-medium">{absence.user_name}</span>
                            </div>
                            <p className="text-xs mt-1 opacity-80">
                              {ABSENCE_TYPES[absence.absence_type]?.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-2xl border-slate-100 shadow-card" data-testid="activity-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Attività Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {absences.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Nessuna richiesta presente
                </p>
              ) : (
                <div className="space-y-3">
                  {absences.slice(0, 10).map((absence) => {
                    const TypeIcon = ABSENCE_TYPES[absence.absence_type]?.icon || CalendarDays;
                    return (
                      <div
                        key={absence.absence_id}
                        className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${ABSENCE_TYPES[absence.absence_type]?.color.split(" ")[0] || "bg-slate-100"}`}>
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {absence.user_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {ABSENCE_TYPES[absence.absence_type]?.label}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${STATUS_STYLES[absence.status]} text-xs`}
                          >
                            {STATUS_LABELS[absence.status]}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {format(parseISO(absence.start_date), "d MMM", { locale: it })} -{" "}
                          {format(parseISO(absence.end_date), "d MMM yyyy", { locale: it })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
