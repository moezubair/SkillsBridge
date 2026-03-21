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

/** Mirrors backend `StoredFile` JSON (Pydantic → OpenAPI). */
export type StoredFileRecord = {
  id: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

/** Mirrors backend `CvExtractionRecord` after POST extract-cv. */
export type CvExtractionRecord = {
  id: string;
  file_id: string;
  schema_version: string;
  status: string;
  extraction: Record<string, unknown>;
  created_at: string;
};

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export function PdfUploadScreen() {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [lastFile, setLastFile] = useState<StoredFileRecord | null>(null);
  const [cvExtraction, setCvExtraction] = useState<CvExtractionRecord | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);

  async function extractCv(fileId: string) {
    setExtracting(true);
    setCvExtraction(null);
    try {
      const res = await fetch(
        `/api/v1/files/${fileId}/extract-cv`,
        { method: "POST" },
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          typeof payload?.detail === "string"
            ? payload.detail
            : "CV extraction failed";
        throw new Error(msg);
      }
      setCvExtraction(payload as CvExtractionRecord);
      toast.success("CV parsed with LandingAI.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "CV extraction failed");
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
    setCvExtraction(null);
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
      const stored = payload as StoredFileRecord;
      setLastFile(stored);
      toast.success("PDF uploaded and saved.");
      if (input) input.value = "";
      setPickedName(null);
      await extractCv(stored.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const ex = cvExtraction?.extraction;
  const technical = ex ? asStringArray(ex.technical_skills) : [];
  const soft = ex ? asStringArray(ex.soft_skills) : [];
  const langs = ex ? asStringArray(ex.languages) : [];
  const summary =
    ex && typeof ex.professional_summary === "string"
      ? ex.professional_summary
      : null;
  const fullName = ex && typeof ex.full_name === "string" ? ex.full_name : null;
  const years =
    ex && typeof ex.years_of_experience === "number"
      ? ex.years_of_experience
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showBack title="Upload PDF" />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Upload className="h-5 w-5 text-blue-600" />
              Upload transcript (PDF)
            </CardTitle>
            <CardDescription>
              Only <strong>.pdf</strong> files are accepted. After upload we run{" "}
              <strong>LandingAI</strong> parse + schema extract and store structured CV
              fields (skills, experience, etc.).
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
              <Button type="submit" className="w-full" disabled={busy || extracting}>
                {busy
                  ? "Uploading…"
                  : extracting
                    ? "Extracting CV…"
                    : "Upload & extract CV"}
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

            {cvExtraction && ex && (
              <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Extracted profile
                  <Badge variant="secondary" className="ml-auto capitalize">
                    {cvExtraction.status}
                  </Badge>
                </div>
                {fullName && (
                  <p className="text-base font-medium text-gray-900">{fullName}</p>
                )}
                {years != null && (
                  <p className="text-sm text-gray-600">
                    ~{years} years experience (as stated on CV)
                  </p>
                )}
                {summary && (
                  <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
                )}
                {technical.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Technical skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {technical.slice(0, 24).map((s) => (
                        <Badge key={s} variant="outline" className="font-normal">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {soft.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Soft skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {soft.slice(0, 16).map((s) => (
                        <Badge key={s} variant="secondary" className="font-normal">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {langs.length > 0 && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Languages: </span>
                    {langs.join(", ")}
                  </p>
                )}
              </div>
            )}

            <p className="mt-6 text-center text-sm text-gray-500 space-x-3">
              <Link to="/wizard" className="text-blue-600 hover:underline">
                Continue to profile wizard
              </Link>
              {lastFile && (
                <>
                  <Link
                    to={`/jobs?file_id=${encodeURIComponent(lastFile.id)}`}
                    className="text-blue-600 hover:underline"
                  >
                    Find a job (TinyFish)
                  </Link>
                  <Link
                    to={`/harvard?file_id=${encodeURIComponent(lastFile.id)}`}
                    className="text-blue-600 hover:underline"
                  >
                    Harvard majors
                  </Link>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
