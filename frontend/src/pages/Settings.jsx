import { useState, useEffect, useRef } from "react";
import { getSettings, updateSettings, uploadLogo } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Upload,
  Building2,
  Image,
  Trash2,
} from "lucide-react";

const Settings = () => {
  const [settings, setSettings] = useState({ company_name: "", logo_base64: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Errore nel caricamento delle impostazioni");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success("Impostazioni salvate!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Seleziona un file immagine");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Il file non può superare 2MB");
      return;
    }

    setUploading(true);
    try {
      const response = await uploadLogo(file);
      setSettings({ ...settings, logo_base64: response.data.logo_base64 });
      toast.success("Logo caricato!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nel caricamento del logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setSaving(true);
    try {
      await updateSettings({ ...settings, logo_base64: null });
      setSettings({ ...settings, logo_base64: null });
      toast.success("Logo rimosso");
    } catch (error) {
      toast.error("Errore nella rimozione del logo");
    } finally {
      setSaving(false);
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
    <div className="space-y-8 animate-fade-in" data-testid="settings-page">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Impostazioni</h1>
        <p className="text-slate-500 mt-1">Configura le impostazioni dell'azienda</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Company Name */}
        <Card className="rounded-2xl border-slate-100 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg">Nome Azienda</CardTitle>
                <CardDescription>Il nome verrà visualizzato nella sidebar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome</Label>
              <Input
                id="company-name"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                placeholder="Nome dell'azienda"
                className="rounded-xl"
                data-testid="company-name-input"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800 rounded-xl"
              data-testid="save-settings-btn"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Salva Nome"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card className="rounded-2xl border-slate-100 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Image className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg">Logo Aziendale</CardTitle>
                <CardDescription>Carica il logo da visualizzare nella sidebar (max 2MB)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Logo Preview */}
            {settings.logo_base64 ? (
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <img
                  src={settings.logo_base64}
                  alt="Logo aziendale"
                  className="h-16 w-auto max-w-[200px] object-contain"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={saving}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  data-testid="remove-logo-btn"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Rimuovi
                </Button>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                <Image className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nessun logo caricato</p>
              </div>
            )}

            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="logo-file-input"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-xl"
              data-testid="upload-logo-btn"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {settings.logo_base64 ? "Cambia Logo" : "Carica Logo"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
