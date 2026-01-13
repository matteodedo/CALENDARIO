import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { getPendingAbsences, handleAbsenceAction, getAbsences, changeAbsenceStatus, exportAbsences, getUsers } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Palmtree,
  Timer,
  Thermometer,
  Inbox,
  Download,
  MoreHorizontal,
  Clock,
  RotateCcw,
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

const Approvals = () => {
  const { user } = useAuth();
  const [pendingAbsences, setPendingAbsences] = useState([]);
  const [allAbsences, setAllAbsences] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, absence: null });
  const [statusDialog, setStatusDialog] = useState({ open: false, absence: null });
  const [rejectReason, setRejectReason] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  
  // Export
  const [exportDialog, setExportDialog] = useState(false);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportUserId, setExportUserId] = useState("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pendingRes, allRes, usersRes] = await Promise.all([
        getPendingAbsences(),
        getAbsences(),
        getUsers().catch(() => ({ data: [] }))
      ]);
      setPendingAbsences(pendingRes.data);
      setAllAbsences(allRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
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
      fetchData();
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
      setRejectDialog({ open: false, absence: null });
      setRejectReason("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nel rifiuto");
    } finally {
      setProcessing(null);
    }
  };

  const handleChangeStatus = async () => {
    if (!statusDialog.absence || !newStatus) return;
    
    setProcessing(statusDialog.absence.absence_id);
    try {
      await changeAbsenceStatus(statusDialog.absence.absence_id, newStatus, statusReason);
      toast.success("Stato modificato!");
      setStatusDialog({ open: false, absence: null });
      setNewStatus("");
      setStatusReason("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nel cambio stato");
    } finally {
      setProcessing(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportAbsences(
        exportYear, 
        exportMonth, 
        exportUserId === "all" ? null : exportUserId
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assenze_${exportMonth}_${exportYear}.xlsx`);
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

  const openStatusDialog = (absence) => {
    setNewStatus(absence.status);
    setStatusReason("");
    setStatusDialog({ open: true, absence });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const renderAbsenceRow = (absence, showStatusChange = false) => {
    const TypeIcon = ABSENCE_TYPES[absence.absence_type]?.icon || Palmtree;
    return (
      <TableRow
        key={absence.absence_id}
        className="border-slate-100 hover:bg-slate-50/50"
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
          {absence.hours && (
            <span className="ml-2 text-sky-600 font-medium">({absence.hours}h)</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={STATUS_STYLES[absence.status]}>
            {STATUS_LABELS[absence.status]}
          </Badge>
        </TableCell>
        <TableCell className="text-slate-600 max-w-xs truncate">
          {absence.notes || "-"}
        </TableCell>
        <TableCell className="text-right">
          {absence.status === "pending" ? (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                onClick={() => handleApprove(absence.absence_id)}
                disabled={processing === absence.absence_id}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-lg"
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
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rifiuta
              </Button>
            </div>
          ) : showStatusChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openStatusDialog(absence)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Cambia stato
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in" data-testid="approvals-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Approvazioni</h1>
          <p className="text-slate-500 mt-1">Gestisci le richieste di assenza</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setExportDialog(true)}
          className="rounded-xl"
          data-testid="export-all-absences-btn"
        >
          <Download className="mr-2 h-4 w-4" />
          Esporta Excel
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            In Attesa
            {pendingAbsences.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">
                {pendingAbsences.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Tutte le richieste</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="rounded-2xl border-slate-100 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Richieste in Attesa</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingAbsences.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nessuna richiesta in attesa</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100">
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Dipendente</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Tipo</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Periodo</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Stato</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Note</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAbsences.map((absence) => renderAbsenceRow(absence, false))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card className="rounded-2xl border-slate-100 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Tutte le Richieste</CardTitle>
            </CardHeader>
            <CardContent>
              {allAbsences.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nessuna richiesta presente</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100">
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Dipendente</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Tipo</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Periodo</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Stato</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Note</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allAbsences.map((absence) => renderAbsenceRow(absence, true))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, absence: rejectDialog.absence })}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Rifiuta Richiesta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-600">
              Stai per rifiutare la richiesta di <strong>{rejectDialog.absence?.user_name}</strong>
            </p>
            <div className="space-y-2">
              <Label>Motivo del rifiuto (opzionale)</Label>
              <Textarea
                placeholder="Inserisci il motivo del rifiuto..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, absence: null })} className="rounded-xl">
              Annulla
            </Button>
            <Button onClick={handleReject} disabled={processing} className="bg-rose-600 hover:bg-rose-700 rounded-xl">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conferma Rifiuto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog({ open, absence: statusDialog.absence })}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Cambia Stato Richiesta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-600">
              Modifica lo stato della richiesta di <strong>{statusDialog.absence?.user_name}</strong>
            </p>
            <div className="space-y-2">
              <Label>Nuovo stato</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      In attesa
                    </div>
                  </SelectItem>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Approvata
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-rose-500" />
                      Rifiutata
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motivo (opzionale)</Label>
              <Textarea
                placeholder="Inserisci il motivo del cambio..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setStatusDialog({ open: false, absence: null })} className="rounded-xl">
              Annulla
            </Button>
            <Button onClick={handleChangeStatus} disabled={processing || !newStatus} className="bg-slate-900 hover:bg-slate-800 rounded-xl">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Esporta Assenze</DialogTitle>
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
            <div className="space-y-2">
              <Label>Dipendente</Label>
              <Select value={exportUserId} onValueChange={setExportUserId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i dipendenti</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.first_name} {u.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setExportDialog(false)} className="rounded-xl">
              Annulla
            </Button>
            <Button onClick={handleExport} disabled={exporting} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Esporta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Approvals;
