import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { getPendingAbsences, handleAbsenceAction } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Palmtree,
  Timer,
  Thermometer,
  Inbox,
} from "lucide-react";

const ABSENCE_TYPES = {
  ferie: { label: "Ferie", icon: Palmtree, color: "bg-emerald-100 text-emerald-700" },
  permesso: { label: "Permesso", icon: Timer, color: "bg-sky-100 text-sky-700" },
  malattia: { label: "Malattia", icon: Thermometer, color: "bg-rose-100 text-rose-700" },
};

const Approvals = () => {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, absence: null });
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPendingAbsences();
  }, []);

  const fetchPendingAbsences = async () => {
    try {
      const response = await getPendingAbsences();
      setAbsences(response.data);
    } catch (error) {
      console.error("Failed to fetch pending absences:", error);
      toast.error("Errore nel caricamento delle richieste");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (absenceId) => {
    setProcessing(absenceId);
    try {
      await handleAbsenceAction(absenceId, "approve");
      toast.success("Richiesta approvata!");
      setAbsences(absences.filter((a) => a.absence_id !== absenceId));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'approvazione");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.absence) return;
    
    setProcessing(rejectDialog.absence.absence_id);
    try {
      await handleAbsenceAction(rejectDialog.absence.absence_id, "reject", rejectReason);
      toast.success("Richiesta rifiutata");
      setAbsences(absences.filter((a) => a.absence_id !== rejectDialog.absence.absence_id));
      setRejectDialog({ open: false, absence: null });
      setRejectReason("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nel rifiuto");
    } finally {
      setProcessing(null);
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
    <div className="space-y-8 animate-fade-in" data-testid="approvals-page">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Approvazioni</h1>
        <p className="text-slate-500 mt-1">Gestisci le richieste di assenza in attesa</p>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-xl">Richieste in Attesa</CardTitle>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            {absences.length} in attesa
          </Badge>
        </CardHeader>
        <CardContent>
          {absences.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nessuna richiesta in attesa</p>
              <p className="text-sm text-slate-400 mt-1">
                Tutte le richieste sono state gestite
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Dipendente
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tipo
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Periodo
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Note
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Richiesta il
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
                        data-testid={`approval-row-${absence.absence_id}`}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{absence.user_name}</p>
                            <p className="text-xs text-slate-500">{absence.user_email}</p>
                          </div>
                        </TableCell>
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
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate">
                          {absence.notes || "-"}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {format(parseISO(absence.created_at), "d MMM yyyy, HH:mm", { locale: it })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(absence.absence_id)}
                              disabled={processing === absence.absence_id}
                              className="bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                              data-testid={`approve-btn-${absence.absence_id}`}
                            >
                              {processing === absence.absence_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approva
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectDialog({ open: true, absence })}
                              disabled={processing === absence.absence_id}
                              className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg"
                              data-testid={`reject-btn-${absence.absence_id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rifiuta
                            </Button>
                          </div>
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, absence: rejectDialog.absence })}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Rifiuta Richiesta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-600">
              Stai per rifiutare la richiesta di{" "}
              <strong>{rejectDialog.absence?.user_name}</strong>
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Motivo del rifiuto (opzionale)
              </label>
              <Textarea
                placeholder="Inserisci il motivo del rifiuto..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
                data-testid="reject-reason-input"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, absence: null });
                setRejectReason("");
              }}
              className="rounded-xl"
            >
              Annulla
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing}
              className="bg-rose-600 hover:bg-rose-700 rounded-xl"
              data-testid="confirm-reject-btn"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Conferma Rifiuto"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Approvals;
