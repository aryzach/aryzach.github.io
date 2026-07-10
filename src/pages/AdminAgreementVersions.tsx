import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Archive, CheckCircle2, Download, FileText, Loader2, Upload } from "lucide-react";

interface AgreementVersion {
  id: string;
  version_name: string;
  description: string | null;
  master_pdf_storage_path: string;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  callAdmin: (body: Record<string, unknown>) => Promise<any>;
}

export const AgreementVersionsPanel = ({ callAdmin }: Props) => {
  const [versions, setVersions] = useState<AgreementVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [makeActive, setMakeActive] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callAdmin({ action: "list_agreement_versions" });
      setVersions(res.versions || []);
    } catch (e) {
      toast.error((e as Error).message || "Failed to load agreement versions");
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => { load(); }, [load]);

  const resetUploadForm = () => {
    setShowUpload(false);
    setName("");
    setDescription("");
    setMakeActive(true);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!name.trim()) { toast.error("Enter a version name"); return; }
    if (!file) { toast.error("Choose a PDF file"); return; }
    if (file.type !== "application/pdf") { toast.error("Master Agreement must be a PDF"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("File too large (max 20MB)"); return; }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const res = await callAdmin({
        action: "upload_agreement_version",
        version_name: name.trim(),
        description: description.trim() || null,
        file_name: file.name,
        content_type: file.type,
        file_base64: base64,
      });
      const newId = res?.version?.id as string | undefined;
      if (makeActive && newId) {
        await callAdmin({ action: "set_active_agreement_version", id: newId });
      }
      toast.success("Master Agreement uploaded");
      resetUploadForm();
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const setActive = async (id: string) => {
    setBusyId(id);
    try {
      await callAdmin({ action: "set_active_agreement_version", id });
      toast.success("Set as active version");
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const archive = async (id: string) => {
    if (!confirm("Archive this version? It will remain viewable but new draft agreements won't use it.")) return;
    setBusyId(id);
    try {
      await callAdmin({ action: "archive_agreement_version", id });
      toast.success("Version archived");
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const download = async (id: string) => {
    setBusyId(id);
    try {
      const res = await callAdmin({ action: "agreement_version_download_url", id });
      if (res?.url) window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Master Agreement versions</h2>
          <p className="text-sm text-muted-foreground">
            Upload and manage the Master Rental Agreement PDF. Only one version can be active at a time.
          </p>
        </div>
        {!showUpload && (
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="mr-2" size={16} /> Upload new version
          </Button>
        )}
      </div>

      {showUpload && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Master Agreement version</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="version-name">Version name / number</Label>
              <Input
                id="version-name"
                placeholder="e.g. Version 2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="version-desc">Internal description (optional)</Label>
              <Textarea
                id="version-desc"
                placeholder="What changed in this version?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="version-file">Master Agreement PDF</Label>
              <Input
                id="version-file"
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={makeActive}
                onChange={(e) => setMakeActive(e.target.checked)}
              />
              Set as active version after upload
            </label>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? <><Loader2 className="mr-2 animate-spin" size={16} /> Uploading…</> : "Upload"}
              </Button>
              <Button variant="ghost" onClick={resetUploadForm} disabled={uploading}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No versions yet. Upload the first Master Agreement PDF.</p>
      ) : (
        <div className="space-y-3">
          {versions.map((v) => (
            <Card key={v.id} className={v.is_active ? "border-primary" : ""}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText size={16} className="text-muted-foreground shrink-0" />
                      <span className="font-semibold text-foreground">{v.version_name}</span>
                      {v.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full bg-green-100 text-green-900 px-2 py-0.5">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : v.archived_at ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full bg-muted text-muted-foreground px-2 py-0.5">
                          Archived
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full bg-muted text-muted-foreground px-2 py-0.5">
                          Inactive
                        </span>
                      )}
                    </div>
                    {v.description && (
                      <p className="text-sm text-muted-foreground mt-1">{v.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Uploaded {fmt(v.created_at)}
                      {v.archived_at ? ` · Archived ${fmt(v.archived_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => download(v.id)}
                      disabled={busyId === v.id}
                    >
                      <Download className="mr-1.5" size={14} /> Download
                    </Button>
                    {!v.is_active && (
                      <Button
                        size="sm"
                        onClick={() => setActive(v.id)}
                        disabled={busyId === v.id}
                      >
                        Set active
                      </Button>
                    )}
                    {!v.is_active && !v.archived_at && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => archive(v.id)}
                        disabled={busyId === v.id}
                      >
                        <Archive className="mr-1.5" size={14} /> Archive
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};