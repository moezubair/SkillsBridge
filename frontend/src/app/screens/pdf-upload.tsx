import { useId, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Download, FileText, Upload } from "lucide-react";
import { NavBar } from "../components/nav-bar";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";

/** Mirrors backend `StoredFile` JSON (Pydantic → OpenAPI). */
export type StoredFileRecord = {
  id: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export function PdfUploadScreen() {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [lastFile, setLastFile] = useState<StoredFileRecord | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = fileInputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      toast.error("Choose a PDF file first.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/v1/files/upload", {
        method: "POST",
        body,
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          typeof payload?.detail === "string"
            ? payload.detail
            : "Upload failed";
        throw new Error(msg);
      }
      setLastFile(payload as StoredFileRecord);
      toast.success("PDF uploaded and saved.");
      if (input) input.value = "";
      setPickedName(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showBack title="Upload PDF" />
      <main className="max-w-lg mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Upload className="h-5 w-5 text-blue-600" />
              Upload transcript (PDF)
            </CardTitle>
            <CardDescription>
              Only <strong>.pdf</strong> files are accepted. Files are stored on disk
              and registered in the database so you can download them later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor={inputId}>PDF file</Label>
                <input
                  ref={fileInputRef}
                  id={inputId}
                  name="file"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                  onChange={() => {
                    const f = fileInputRef.current?.files?.[0];
                    setPickedName(f?.name ?? null);
                  }}
                />
                {pickedName && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {pickedName}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Uploading…" : "Upload PDF"}
              </Button>
            </form>

            {lastFile && (
              <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                <p className="text-sm font-medium text-gray-900">Last upload</p>
                <dl className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="truncate max-w-[14rem] text-right">
                      {lastFile.original_filename}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Size</dt>
                    <dd>{(lastFile.size_bytes / 1024).toFixed(1)} KB</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Id</dt>
                    <dd className="font-mono text-xs truncate max-w-[14rem]">
                      {lastFile.id}
                    </dd>
                  </div>
                </dl>
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={`/api/v1/files/${lastFile.id}/download`}
                    download={lastFile.original_filename}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download from server
                  </a>
                </Button>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link to="/wizard" className="text-blue-600 hover:underline">
                Continue to profile wizard
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
