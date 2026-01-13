import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { getMyAbsences, deleteAbsence, exportAbsences } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Trash2,
  Palmtree,
  Timer,
  Thermometer,
  FileX,
  Download,
} from "lucide-react";

const ABSENCE_TYPES = {
  ferie: { label: "Ferie", icon: Palmtree, color: "bg-emerald-100 text-emerald-700" },
  permesso: { label: "Permesso", icon: Timer, color: "bg-sky-100 text-sky-700" },
  malattia: { label: "Malattia", icon: Thermometer, color: "bg-rose-100 text-rose-700" },
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

const MyRequests = () => {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [exportDialog, setExportDialog] = useState(false);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAbsences();
  }, []);

  const fetchAbsences = async () => {
    try {
      const response = await getMyAbsences();
      setAbsences(response.data);
    } catch (error) {
      console.error("Failed to fetch absences:", error);
      toast.error("Errore nel caricamento delle richieste");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportAbsences(exportYear, exportMonth);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `le_mie_assenze_${exportMonth}_${exportYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Esportazione completata!");
      setExportDialog(false);
    } catch (error) {
      toast.error("Errore nell'esportazione");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (absenceId) => {
    setDeleting(absenceId);
    try {
      await deleteAbsence(absenceId);
      toast.success("Richiesta eliminata");
      setAbsences(absences.filter((a) => a.absence_id !== absenceId));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'eliminazione");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="my-requests-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Le Mie Richieste</h1>
          <p className="text-slate-500 mt-1">Visualizza e gestisci le tue richieste di assenza</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setExportDialog(true)}
          className="rounded-xl"
          data-testid="export-my-absences-btn"
        >
          <Download className="mr-2 h-4 w-4" />
          Esporta Excel
        </Button>
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Esporta le mie assenze</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Anno</Label>
                <Input
                  type="number"
                  value={exportYear}
                  onChange={(e) => setExportYear(parseInt(e.target.value))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Mese</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={exportMonth}
                  onChange={(e) => setExportMonth(parseInt(e.target.value))}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setExportDialog(false)} className="rounded-xl">
              Annulla
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Esporta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="rounded-2xl border-slate-100 shadow-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Storico Richieste</CardTitle>
        </CardHeader>
        <CardContent>
          {absences.length === 0 ? (
            <div className="text-center py-12">
              <FileX className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nessuna richiesta presente</p>
              <p className="text-sm text-slate-400 mt-1">
                Vai al calendario per creare una nuova richiesta
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tipo
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Periodo
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Stato
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Note
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Gestita da
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                      Azioni
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absences.map((absence) => {
                    const TypeIcon = ABSENCE_TYPES[absence.absence_type]?.icon || Palmtree;
                    return (
                      <TableRow
                        key={absence.absence_id}
                        className="border-slate-100 hover:bg-slate-50/50"
                        data-testid={`request-row-${absence.absence_id}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                ABSENCE_TYPES[absence.absence_type]?.color || "bg-slate-100"
                              }`}
                            >
                              <TypeIcon className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-slate-700">
                              {ABSENCE_TYPES[absence.absence_type]?.label || absence.absence_type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {format(parseISO(absence.start_date), "d MMM", { locale: it })} -{" "}
                          {format(parseISO(absence.end_date), "d MMM yyyy", { locale: it })}
                          {absence.hours && (
                            <span className="ml-2 text-sky-600 font-medium">({absence.hours}h)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${STATUS_STYLES[absence.status]}`}
                          >
                            {STATUS_LABELS[absence.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate">
                          {absence.notes || "-"}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {absence.approved_by || "-"}
                          {absence.rejection_reason && (
                            <p className="text-xs text-rose-500 mt-1">
                              Motivo: {absence.rejection_reason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {absence.status === "pending" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-rose-600"
                                  data-testid={`delete-request-${absence.absence_id}`}
                                >
                                  {deleting === absence.absence_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-heading">
                                    Elimina Richiesta
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare questa richiesta? L'azione non può
                                    essere annullata.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(absence.absence_id)}
                                    className="bg-rose-600 hover:bg-rose-700 rounded-xl"
                                  >
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyRequests;
