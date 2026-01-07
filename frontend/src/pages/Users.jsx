import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { getUsers, updateUser, deleteUser } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

const ROLE_STYLES = {
  admin: { label: "Admin", color: "bg-purple-100 text-purple-700", icon: Shield },
  manager: { label: "Manager", color: "bg-blue-100 text-blue-700", icon: UserCog },
  employee: { label: "Dipendente", color: "bg-slate-100 text-slate-700", icon: User },
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [editRole, setEditRole] = useState("");
  const [editManager, setEditManager] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Errore nel caricamento degli utenti");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user) => {
    setEditRole(user.role);
    setEditManager(user.manager_id || "");
    setEditDialog({ open: true, user });
  };

  const handleSave = async () => {
    if (!editDialog.user) return;
    
    setSaving(true);
    try {
      await updateUser(editDialog.user.user_id, {
        role: editRole,
        manager_id: editManager || null,
      });
      toast.success("Utente aggiornato!");
      setEditDialog({ open: false, user: null });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'aggiornamento");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="users-page">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Gestione Utenti</h1>
        <p className="text-slate-500 mt-1">Gestisci i ruoli e i team degli utenti</p>
      </div>

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
                    Registrato il
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
                      data-testid={`user-row-${user.user_id}`}
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
                      <TableCell className="text-slate-500 text-sm">
                        {format(parseISO(user.created_at), "d MMM yyyy", { locale: it })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            className="h-8 w-8 text-slate-400 hover:text-slate-600"
                            data-testid={`edit-user-${user.user_id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {user.user_id !== currentUser?.user_id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-rose-600"
                                  data-testid={`delete-user-${user.user_id}`}
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
                                    ? L'azione non può essere annullata.
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

      {/* Edit User Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, user: editDialog.user })}
      >
        <DialogContent className="rounded-2xl">
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

              <div className="space-y-2">
                <Label>Ruolo</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="rounded-xl" data-testid="role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Dipendente</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editRole === "employee" && (
                <div className="space-y-2">
                  <Label>Manager di riferimento</Label>
                  <Select value={editManager} onValueChange={setEditManager}>
                    <SelectTrigger className="rounded-xl" data-testid="manager-select">
                      <SelectValue placeholder="Seleziona manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuno</SelectItem>
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
              data-testid="save-user-btn"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
