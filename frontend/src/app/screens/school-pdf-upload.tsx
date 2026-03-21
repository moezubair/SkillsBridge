import { useId, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Download, FileText, Sparkles, Upload } from "lucide-react";
import { NavBar } from "../components/nav-bar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";

export type SchoolStoredFileRecord = {
  id: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

type TranscriptExtractionRecord = {
  id: string;
  file_id: string;
  schema_version: string;
  status: string;
  extraction: Record<string, unknown>;
  created_at: string;
};

export function SchoolPdfUploadScreen() {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [lastFile, setLastFile] = useState<SchoolStoredFileRecord | null>(null);
  const [transcript, setTranscript] = useState<TranscriptExtractionRecord | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);

  async function extractTranscript(schoolFileId: string) {
    setExtracting(true);
    setTranscript(null);
    try {
      const res = await fetch(
        `/api/v1/school/files/${schoolFileId}/extract-transcript`,
        { method: "POST" },
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          typeof payload?.detail === "string"
            ? payload.detail
            : "Transcript extraction failed";
        throw new Error(msg);
      }
      setTranscript(payload as TranscriptExtractionRecord);
      toast.success("Transcript extracted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = fileInputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      toast.error("Choose a PDF file first.");
      return;
    }
    setBusy(true);
    setTranscript(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/v1/school/files/upload", {
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
      const stored = payload as SchoolStoredFileRecord;
      setLastFile(stored);
      toast.success("Transcript PDF saved (school pipeline).");
      if (input) input.value = "";
      setPickedName(null);
      await extractTranscript(stored.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const ex = transcript?.extraction;
  const gpa =
    ex && typeof ex.gpa === "number"
      ? ex.gpa
      : ex && typeof ex.gpa === "string"
        ? Number(ex.gpa)
        : null;
  const schoolName =
    ex && typeof ex.school_name === "string" ? ex.school_name : null;
  const courses = ex?.courses;
  const courseCount = Array.isArray(courses) ? courses.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showBack title="Upload transcript" />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Upload className="h-5 w-5 text-rose-600" />
              Upload transcript (PDF)
            </CardTitle>
            <CardDescription>
              Stored in the <strong>school</strong> pipeline only (
              <code className="text-xs">school_uploaded_files</code>, disk{" "}
              <code className="text-xs">school/…</code>). Use this for Harvard matching — separate
              from the CV/job upload.
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
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-rose-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-rose-800 hover:file:bg-rose-100"
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
              <Button type="submit" className="w-full" disabled={busy || extracting}>
                {busy
                  ? "Uploading…"
                  : extracting
                    ? "Extracting transcript…"
                    : "Upload & extract transcript"}
              </Button>
            </form>

            {lastFile && (
              <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                <p className="text-sm font-medium text-gray-900">Last school upload</p>
                <dl className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="truncate max-w-[14rem] text-right">
                      {lastFile.original_filename}
                    </dd>
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
                    href={`/api/v1/school/files/${lastFile.id}/download`}
                    download={lastFile.original_filename}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download from server
                  </a>
                </Button>
              </div>
            )}

            {transcript && ex && (
              <div className="mt-8 rounded-lg border border-rose-100 bg-rose-50/40 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <Sparkles className="h-4 w-4 text-rose-600" />
                  Transcript snapshot
                  <Badge variant="secondary" className="ml-auto capitalize">
                    {transcript.status}
                  </Badge>
                </div>
                {schoolName && (
                  <p>
                    <span className="text-gray-500">School: </span>
                    {schoolName}
                  </p>
                )}
                {gpa != null && !Number.isNaN(gpa) && (
                  <p>
                    <span className="text-gray-500">GPA: </span>
                    {gpa}
                  </p>
                )}
                <p>
                  <span className="text-gray-500">Courses parsed: </span>
                  {courseCount}
                </p>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-gray-500 space-x-3">
              <Link to="/upload" className="text-blue-600 hover:underline">
                Upload CV (job flow)
              </Link>
              {lastFile && (
                <Link
                  to={`/harvard?school_file_id=${encodeURIComponent(lastFile.id)}`}
                  className="text-blue-600 hover:underline"
                >
                  Harvard majors
                </Link>
              )}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
