import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import axios from "axios";
import { getUsers, updateUser, deleteUser, getAllBalances, addHoursToUser, runMonthlyAccrual } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  Loader2,
  Pencil,
  Trash2,
  User,
  Shield,
  UserCog,
  UserPlus,
  Briefcase,
  Clock,
  Palmtree,
  Timer,
  Plus,
  RefreshCw,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ROLE_STYLES = {
  admin: { label: "Admin", color: "bg-purple-100 text-purple-700", icon: Shield },
  manager: { label: "Manager", color: "bg-blue-100 text-blue-700", icon: UserCog },
  employee: { label: "Dipendente", color: "bg-slate-100 text-slate-700", icon: User },
  ufficio_personale: { label: "Ufficio Personale", color: "bg-amber-100 text-amber-700", icon: Briefcase },
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [addDialog, setAddDialog] = useState(false);
  const [hoursDialog, setHoursDialog] = useState({ open: false, user: null });
  const [editRole, setEditRole] = useState("");
  const [editManager, setEditManager] = useState("none");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [activeTab, setActiveTab] = useState("users");

  // Hours management
  const [editFerieTotal, setEditFerieTotal] = useState("");
  const [editPermessiTotal, setEditPermessiTotal] = useState("");
  const [editFerieMonthly, setEditFerieMonthly] = useState("");
  const [editPermessiMonthly, setEditPermessiMonthly] = useState("");
  
  // Add hours form
  const [addHoursType, setAddHoursType] = useState("ferie");
  const [addHoursAmount, setAddHoursAmount] = useState("");
  const [addHoursNotes, setAddHoursNotes] = useState("");

  // New user form
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "employee",
    manager_id: "none",
    total_ferie_hours: 0,
    total_permessi_hours: 0,
    monthly_ferie_hours: 0,
    monthly_permessi_hours: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, balancesRes] = await Promise.all([
        getUsers(),
        getAllBalances().catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data);
      setBalances(balancesRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user) => {
    setEditRole(user.role);
    setEditManager(user.manager_id || "none");
    setEditFerieTotal(user.total_ferie_hours?.toString() || "0");
    setEditPermessiTotal(user.total_permessi_hours?.toString() || "0");
    setEditFerieMonthly(user.monthly_ferie_hours?.toString() || "0");
    setEditPermessiMonthly(user.monthly_permessi_hours?.toString() || "0");
    setEditDialog({ open: true, user });
  };

  const openHoursDialog = (user) => {
    setAddHoursType("ferie");
    setAddHoursAmount("");
    setAddHoursNotes("");
    setHoursDialog({ open: true, user });
  };

  const handleSave = async () => {
    if (!editDialog.user) return;
    
    setSaving(true);
    try {
      const updateData = {
        role: editRole,
        manager_id: editManager === "none" ? null : editManager,
        total_ferie_hours: parseFloat(editFerieTotal) || 0,
        total_permessi_hours: parseFloat(editPermessiTotal) || 0,
        monthly_ferie_hours: parseFloat(editFerieMonthly) || 0,
        monthly_permessi_hours: parseFloat(editPermessiMonthly) || 0,
      };
      await updateUser(editDialog.user.user_id, updateData);
      toast.success("Utente aggiornato!");
      setEditDialog({ open: false, user: null });
      fetchData();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.detail || "Errore nell'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  const handleAddHours = async () => {
    if (!hoursDialog.user || !addHoursAmount) return;
    
    setSaving(true);
    try {
      await addHoursToUser(hoursDialog.user.user_id, {
        user_id: hoursDialog.user.user_id,
        hours_type: addHoursType,
        hours: parseFloat(addHoursAmount),
        notes: addHoursNotes || null,
      });
      toast.success(`Aggiunte ${addHoursAmount} ore di ${addHoursType === "ferie" ? "ferie" : "permessi"}`);
      setHoursDialog({ open: false, user: null });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'aggiunta ore");
    } finally {
      setSaving(false);
    }
  };

  const handleMonthlyAccrual = async () => {
    if (!confirm("Sei sicuro di voler eseguire la maturazione mensile per tutti gli utenti?")) return;
    
    setSaving(true);
    try {
      const response = await runMonthlyAccrual();
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nella maturazione mensile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.first_name || !newUser.last_name) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    setSaving(true);
    try {
      const userData = {
        email: newUser.email,
        password: newUser.password,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
        manager_id: newUser.manager_id === "none" ? null : newUser.manager_id,
        total_ferie_hours: parseFloat(newUser.total_ferie_hours) || 0,
        total_permessi_hours: parseFloat(newUser.total_permessi_hours) || 0,
        monthly_ferie_hours: parseFloat(newUser.monthly_ferie_hours) || 0,
        monthly_permessi_hours: parseFloat(newUser.monthly_permessi_hours) || 0,
      };
      await axios.post(`${API}/auth/register`, userData);
      toast.success("Utente creato con successo!");
      setAddDialog(false);
      setNewUser({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "employee",
        manager_id: "none",
        total_ferie_hours: 0,
        total_permessi_hours: 0,
        monthly_ferie_hours: 0,
        monthly_permessi_hours: 0,
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nella creazione dell'utente");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    setDeleting(userId);
    try {
      await deleteUser(userId);
      toast.success("Utente eliminato");
      setUsers(users.filter((u) => u.user_id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'eliminazione");
    } finally {
      setDeleting(null);
    }
  };

  const managers = users.filter((u) => u.role === "manager" || u.role === "admin");
  const canManageHours = ["admin", "manager", "ufficio_personale"].includes(currentUser?.role);
  const canRunAccrual = ["admin", "ufficio_personale"].includes(currentUser?.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="users-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Gestione Utenti</h1>
          <p className="text-slate-500 mt-1">Gestisci i ruoli, i team e le ore degli utenti</p>
        </div>
        <div className="flex gap-2">
          {canRunAccrual && (
            <Button
              variant="outline"
              onClick={handleMonthlyAccrual}
              disabled={saving}
              className="rounded-xl"
              data-testid="monthly-accrual-btn"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Maturazione Mensile
            </Button>
          )}
          <Button
            onClick={() => setAddDialog(true)}
            className="bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/20"
            data-testid="add-user-btn"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Aggiungi Utente
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users">Utenti</TabsTrigger>
          <TabsTrigger value="hours">Ore Ferie/Permessi</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="rounded-2xl border-slate-100 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-xl">Elenco Utenti</CardTitle>
              <Badge variant="secondary">{users.length} utenti</Badge>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Utente
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Ruolo
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Manager
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Ore Ferie/Permessi
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                        Azioni
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const RoleIcon = ROLE_STYLES[user.role]?.icon || User;
                      const manager = users.find((u) => u.user_id === user.manager_id);
                      return (
                        <TableRow
                          key={user.user_id}
                          className="border-slate-100 hover:bg-slate-50/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                <User className="h-5 w-5 text-slate-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`${ROLE_STYLES[user.role]?.color}`}
                            >
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {ROLE_STYLES[user.role]?.label || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {manager ? `${manager.first_name} ${manager.last_name}` : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-slate-600">
                              <div className="flex items-center gap-1">
                                <Palmtree className="h-3 w-3 text-emerald-500" />
                                {user.total_ferie_hours || 0}h
                              </div>
                              <div className="flex items-center gap-1">
                                <Timer className="h-3 w-3 text-sky-500" />
                                {user.total_permessi_hours || 0}h
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canManageHours && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openHoursDialog(user)}
                                  className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                                  title="Aggiungi ore"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(user)}
                                className="h-8 w-8 text-slate-400 hover:text-slate-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {user.user_id !== currentUser?.user_id && currentUser?.role === "admin" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-slate-400 hover:text-rose-600"
                                    >
                                      {deleting === user.user_id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="font-heading">
                                        Elimina Utente
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Sei sicuro di voler eliminare{" "}
                                        <strong>
                                          {user.first_name} {user.last_name}
                                        </strong>
                                        ?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl">
                                        Annulla
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(user.user_id)}
                                        className="bg-rose-600 hover:bg-rose-700 rounded-xl"
                                      >
                                        Elimina
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card className="rounded-2xl border-slate-100 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Riepilogo Ore</CardTitle>
              <CardDescription>Visualizza le ore disponibili e utilizzate per ogni utente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {balances.map((balance) => (
                  <div key={balance.user_id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-slate-900">{balance.user_name}</h3>
                      {canManageHours && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const user = users.find(u => u.user_id === balance.user_id);
                            if (user) openHoursDialog(user);
                          }}
                          className="rounded-lg"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Aggiungi ore
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-600">
                            <Palmtree className="h-4 w-4 text-emerald-500" />
                            Ferie
                          </span>
                          <span className="font-medium">
                            {balance.ferie_remaining.toFixed(1)}h / {balance.ferie_total.toFixed(1)}h
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(100, (balance.ferie_used / (balance.ferie_total || 1)) * 100)} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Utilizzate: {balance.ferie_used.toFixed(1)}h</span>
                          {balance.ferie_pending > 0 && (
                            <span className="text-amber-600">In attesa: {balance.ferie_pending.toFixed(1)}h</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-600">
                            <Timer className="h-4 w-4 text-sky-500" />
                            Permessi
                          </span>
                          <span className="font-medium">
                            {balance.permessi_remaining.toFixed(1)}h / {balance.permessi_total.toFixed(1)}h
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(100, (balance.permessi_used / (balance.permessi_total || 1)) * 100)} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Utilizzate: {balance.permessi_used.toFixed(1)}h</span>
                          {balance.permessi_pending > 0 && (
                            <span className="text-amber-600">In attesa: {balance.permessi_pending.toFixed(1)}h</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {(balance.monthly_ferie_hours > 0 || balance.monthly_permessi_hours > 0) && (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        Maturazione mensile: Ferie {balance.monthly_ferie_hours}h, Permessi {balance.monthly_permessi_hours}h
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => {
          if (!open) setEditDialog({ open: false, user: null });
        }}
      >
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Modifica Utente</DialogTitle>
          </DialogHeader>
          {editDialog.user && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {editDialog.user.first_name} {editDialog.user.last_name}
                  </p>
                  <p className="text-sm text-slate-500">{editDialog.user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ruolo</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Seleziona ruolo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Dipendente</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="ufficio_personale">Ufficio Personale</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editRole === "employee" && (
                  <div className="space-y-2">
                    <Label>Manager</Label>
                    <Select value={editManager} onValueChange={setEditManager}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleziona manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nessuno</SelectItem>
                        {managers.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.first_name} {m.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-medium text-slate-900 mb-3">Gestione Ore</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Totale Ferie (ore)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={editFerieTotal}
                      onChange={(e) => setEditFerieTotal(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Totale Permessi (ore)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={editPermessiTotal}
                      onChange={(e) => setEditPermessiTotal(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maturazione Ferie/mese</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={editFerieMonthly}
                      onChange={(e) => setEditFerieMonthly(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maturazione Permessi/mese</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={editPermessiMonthly}
                      onChange={(e) => setEditPermessiMonthly(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, user: null })}
              className="rounded-xl"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Hours Dialog */}
      <Dialog
        open={hoursDialog.open}
        onOpenChange={(open) => {
          if (!open) setHoursDialog({ open: false, user: null });
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Aggiungi Ore</DialogTitle>
          </DialogHeader>
          {hoursDialog.user && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-slate-600">
                Aggiungi ore a <strong>{hoursDialog.user.first_name} {hoursDialog.user.last_name}</strong>
              </p>
              
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={addHoursType} onValueChange={setAddHoursType}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ferie">Ferie</SelectItem>
                    <SelectItem value="permessi">Permessi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ore da aggiungere</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={addHoursAmount}
                  onChange={(e) => setAddHoursAmount(e.target.value)}
                  placeholder="Es: 8, 16, -8 (per sottrarre)"
                  className="rounded-xl"
                />
                <p className="text-xs text-slate-500">Usa valori negativi per sottrarre ore</p>
              </div>

              <div className="space-y-2">
                <Label>Note (opzionale)</Label>
                <Input
                  value={addHoursNotes}
                  onChange={(e) => setAddHoursNotes(e.target.value)}
                  placeholder="Es: Bonus annuale, Correzione..."
                  className="rounded-xl"
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setHoursDialog({ open: false, user: null })}
              className="rounded-xl"
            >
              Annulla
            </Button>
            <Button
              onClick={handleAddHours}
              disabled={saving || !addHoursAmount}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Aggiungi Nuovo Utente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  placeholder="Mario"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Cognome *</Label>
                <Input
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  placeholder="Rossi"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="mario.rossi@azienda.it"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Minimo 6 caratteri"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ruolo</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Dipendente</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="ufficio_personale">Ufficio Personale</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newUser.role === "employee" && (
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <Select
                    value={newUser.manager_id}
                    onValueChange={(value) => setNewUser({ ...newUser, manager_id: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuno</SelectItem>
                      {managers.map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.first_name} {m.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-medium text-slate-900 mb-3">Ore Iniziali</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Totale Ferie (ore)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newUser.total_ferie_hours}
                    onChange={(e) => setNewUser({ ...newUser, total_ferie_hours: parseFloat(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Totale Permessi (ore)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newUser.total_permessi_hours}
                    onChange={(e) => setNewUser({ ...newUser, total_permessi_hours: parseFloat(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maturazione Ferie/mese</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newUser.monthly_ferie_hours}
                    onChange={(e) => setNewUser({ ...newUser, monthly_ferie_hours: parseFloat(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maturazione Permessi/mese</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newUser.monthly_permessi_hours}
                    onChange={(e) => setNewUser({ ...newUser, monthly_permessi_hours: parseFloat(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setAddDialog(false)}
              className="rounded-xl"
            >
              Annulla
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crea Utente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
