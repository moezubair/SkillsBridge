import { useCallback, useEffect, useId, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  ExternalLink,
  GraduationCap,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
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
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

type TranscriptExtractionRecord = {
  id: string;
  file_id: string;
  schema_version: string;
  status: string;
  extraction: Record<string, unknown>;
  created_at: string;
};

type HarvardMajorMatch = {
  major: string;
  score: number;
  reasons: string[];
  detail_url: string | null;
};

type HarvardMatchResponse = {
  school: string;
  catalog_source: string;
  matches: HarvardMajorMatch[];
};

function splitList(s: string): string[] {
  return s
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseOptionalFloat(s: string): number | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export function HarvardMatchScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const schoolFileIdParam = searchParams.get("school_file_id") ?? "";
  const [schoolFileId, setSchoolFileId] = useState(schoolFileIdParam);
  const skillsId = useId();
  const overallId = useId();
  const listenId = useId();
  const readId = useId();
  const writeId = useId();
  const speakId = useId();

  const [extracting, setExtracting] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptExtractionRecord | null>(
    null,
  );
  const [skillsText, setSkillsText] = useState("");
  const [ieltsOverall, setIeltsOverall] = useState("");
  const [ieltsListening, setIeltsListening] = useState("");
  const [ieltsReading, setIeltsReading] = useState("");
  const [ieltsWriting, setIeltsWriting] = useState("");
  const [ieltsSpeaking, setIeltsSpeaking] = useState("");

  const [loadingExtras, setLoadingExtras] = useState(false);
  const [savingExtras, setSavingExtras] = useState(false);
  /** Row id from student-extras API; sent as ielts_id on match (IELTS/skills are not inlined). */
  const [savedExtrasId, setSavedExtrasId] = useState<string | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<HarvardMatchResponse | null>(
    null,
  );

  const syncUrl = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams);
      if (id.trim()) next.set("school_file_id", id.trim());
      else next.delete("school_file_id");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    setSchoolFileId(schoolFileIdParam);
  }, [schoolFileIdParam]);

  const buildIeltsBody = useCallback(() => {
    const overall = parseOptionalFloat(ieltsOverall);
    const listening = parseOptionalFloat(ieltsListening);
    const reading = parseOptionalFloat(ieltsReading);
    const writing = parseOptionalFloat(ieltsWriting);
    const speaking = parseOptionalFloat(ieltsSpeaking);
    const ielts: Record<string, number> = {};
    if (overall !== undefined) ielts.overall = overall;
    if (listening !== undefined) ielts.listening = listening;
    if (reading !== undefined) ielts.reading = reading;
    if (writing !== undefined) ielts.writing = writing;
    if (speaking !== undefined) ielts.speaking = speaking;
    return Object.keys(ielts).length ? ielts : undefined;
  }, [
    ieltsOverall,
    ieltsListening,
    ieltsReading,
    ieltsWriting,
    ieltsSpeaking,
  ]);

  const loadExtras = useCallback(async () => {
    const id = schoolFileId.trim();
    if (!id) {
      toast.error("Enter a school file id (from Transcript upload).");
      return;
    }
    syncUrl(id);
    setLoadingExtras(true);
    try {
      const res = await fetch(
        `/api/v1/student-extras?school_file_id=${encodeURIComponent(id)}`,
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 404) {
          setSavedExtrasId(null);
          setSkillsText("");
          setIeltsOverall("");
          setIeltsListening("");
          setIeltsReading("");
          setIeltsWriting("");
          setIeltsSpeaking("");
          toast.message("No saved IELTS/skills yet for this file.");
          return;
        }
        throw new Error(
          typeof payload?.detail === "string"
            ? payload.detail
            : "Failed to load student extras",
        );
      }
      if (typeof payload.id === "string") {
        setSavedExtrasId(payload.id);
      }
      const skills = Array.isArray(payload.skills)
        ? (payload.skills as string[]).join(", ")
        : "";
      setSkillsText(skills);
      const i = payload.ielts as Record<string, unknown> | null;
      if (i && typeof i === "object") {
        setIeltsOverall(
          typeof i.overall === "number" ? String(i.overall) : "",
        );
        setIeltsListening(
          typeof i.listening === "number" ? String(i.listening) : "",
        );
        setIeltsReading(
          typeof i.reading === "number" ? String(i.reading) : "",
        );
        setIeltsWriting(
          typeof i.writing === "number" ? String(i.writing) : "",
        );
        setIeltsSpeaking(
          typeof i.speaking === "number" ? String(i.speaking) : "",
        );
      }
      toast.success("Loaded saved IELTS and skills.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoadingExtras(false);
    }
  }, [schoolFileId, syncUrl]);

  async function extractTranscript() {
    const id = schoolFileId.trim();
    if (!id) {
      toast.error("Enter a school file id first.");
      return;
    }
    syncUrl(id);
    setExtracting(true);
    setTranscript(null);
    try {
      const res = await fetch(
        `/api/v1/school/files/${encodeURIComponent(id)}/extract-transcript`,
        { method: "POST" },
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof payload?.detail === "string"
            ? payload.detail
            : "Transcript extraction failed",
        );
      }
      setTranscript(payload as TranscriptExtractionRecord);
      toast.success("Transcript extracted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }

  async function saveExtras() {
    const id = schoolFileId.trim();
    if (!id) {
      toast.error("Enter a school file id first.");
      return;
    }
    syncUrl(id);
    setSavingExtras(true);
    try {
      const ielts = buildIeltsBody();
      const skills = splitList(skillsText);
      const res = await fetch(
        `/api/v1/student-extras?school_file_id=${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ielts: ielts ?? null, skills }),
        },
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof payload?.detail === "string"
            ? payload.detail
            : "Save failed",
        );
      }
      if (typeof payload?.id === "string") {
        setSavedExtrasId(payload.id);
      }
      toast.success("Saved IELTS and skills.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingExtras(false);
    }
  }

  async function runMatch() {
    const id = schoolFileId.trim();
    if (!id && !savedExtrasId) {
      toast.error("Enter a school file id or save/load student extras first.");
      return;
    }
    if (id) syncUrl(id);
    setMatching(true);
    setMatchResult(null);
    try {
      const body: Record<string, unknown> = {};
      if (id) body.school_file_id = id;
      if (savedExtrasId) {
        body.ielts_id = savedExtrasId;
      }
      const res = await fetch("/api/v1/school-matches/harvard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof payload?.detail === "string"
            ? payload.detail
            : "Harvard match failed",
        );
      }
      setMatchResult(payload as HarvardMatchResponse);
      toast.success("Ranked concentrations.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Match failed");
    } finally {
      setMatching(false);
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
      <NavBar showBack title="Harvard majors" />
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <GraduationCap className="h-5 w-5 text-rose-700" />
              Transcript + IELTS + skills
            </CardTitle>
            <CardDescription>
              Use a <strong>school file id</strong> from{" "}
              <Link to="/upload/school" className="text-blue-600 hover:underline">
                Transcript upload
              </Link>
              . Extract a transcript, optionally save IELTS and skills (the match
              request only sends that row&apos;s id — save before matching to
              include them). Matching runs one TinyFish pass on the Harvard URL,
              then falls back to a local heuristic if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="school-file-id">School upload id</Label>
              <Input
                id="school-file-id"
                value={schoolFileId}
                onChange={(e) => setSchoolFileId(e.target.value)}
                placeholder="uuid from POST /api/v1/school/files/upload"
                className="font-mono text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={loadExtras}
                disabled={loadingExtras}
              >
                {loadingExtras ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load saved extras"
                )}
              </Button>
              <Button
                type="button"
                onClick={extractTranscript}
                disabled={extracting}
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extract transcript
                  </>
                )}
              </Button>
            </div>

            {transcript && ex && (
              <div className="rounded-lg border border-rose-100 bg-rose-50/40 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
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
                    {typeof ex.gpa_scale === "string" && ex.gpa_scale
                      ? ` (${ex.gpa_scale})`
                      : ""}
                  </p>
                )}
                <p>
                  <span className="text-gray-500">Courses parsed: </span>
                  {courseCount}
                </p>
              </div>
            )}

            <div className="space-y-4 border-t border-gray-100 pt-6">
              <p className="text-sm font-medium text-gray-900">IELTS (optional)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor={overallId} className="text-xs">
                    Overall
                  </Label>
                  <Input
                    id={overallId}
                    inputMode="decimal"
                    value={ieltsOverall}
                    onChange={(e) => setIeltsOverall(e.target.value)}
                    placeholder="e.g. 7.5"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={listenId} className="text-xs">
                    Listening
                  </Label>
                  <Input
                    id={listenId}
                    inputMode="decimal"
                    value={ieltsListening}
                    onChange={(e) => setIeltsListening(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={readId} className="text-xs">
                    Reading
                  </Label>
                  <Input
                    id={readId}
                    inputMode="decimal"
                    value={ieltsReading}
                    onChange={(e) => setIeltsReading(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={writeId} className="text-xs">
                    Writing
                  </Label>
                  <Input
                    id={writeId}
                    inputMode="decimal"
                    value={ieltsWriting}
                    onChange={(e) => setIeltsWriting(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={speakId} className="text-xs">
                    Speaking
                  </Label>
                  <Input
                    id={speakId}
                    inputMode="decimal"
                    value={ieltsSpeaking}
                    onChange={(e) => setIeltsSpeaking(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={skillsId}>Skills (comma-separated)</Label>
              <Input
                id={skillsId}
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Python, research writing, debate…"
              />
            </div>

            {savedExtrasId && (
              <p className="text-xs text-gray-500 font-mono">
                Linked extras id: {savedExtrasId}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={saveExtras}
                disabled={savingExtras}
              >
                {savingExtras ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save IELTS & skills
                  </>
                )}
              </Button>
              <Button type="button" onClick={runMatch} disabled={matching}>
                {matching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Matching…
                  </>
                ) : (
                  "Match Harvard majors"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {matchResult && matchResult.matches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top matches</CardTitle>
              <CardDescription>
                Source:{" "}
                <span className="font-mono text-gray-700">
                  {matchResult.catalog_source}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {matchResult.matches.slice(0, 12).map((m) => (
                <div
                  key={m.major}
                  className="rounded-lg border border-gray-200 bg-white p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-gray-900">{m.major}</p>
                    <Badge variant="secondary">{m.score}</Badge>
                  </div>
                  <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                    {m.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  {m.detail_url && (
                    <a
                      href={m.detail_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      Details
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
