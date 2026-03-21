import { useCallback, useEffect, useId, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Briefcase, ExternalLink, Loader2, Save, Search } from "lucide-react";
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
import { Switch } from "../components/ui/switch";

type JobPreferencesBody = {
  desired_titles: string[];
  locations: string[];
  remote_only: boolean;
  visa_sponsorship: boolean;
  industries: string[];
  seniority: string | null;
  keywords_include: string[];
  keywords_exclude: string[];
};

type JobListingOut = {
  id: string;
  search_run_id: string;
  source_site: string;
  source_url: string;
  title: string;
  company: string | null;
  location: string | null;
  match_score: number | null;
  match_reasons: string[] | null;
  description_snippet: string | null;
};

type JobSearchRunOut = {
  id: string;
  file_id: string;
  status: string;
  tinyfish_run_id: string | null;
};

const emptyPrefs = (): JobPreferencesBody => ({
  desired_titles: [],
  locations: [],
  remote_only: false,
  visa_sponsorship: false,
  industries: [],
  seniority: null,
  keywords_include: [],
  keywords_exclude: [],
});

function splitList(s: string): string[] {
  return s
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function JobMatchScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileIdParam = searchParams.get("file_id") ?? "";
  const [fileId, setFileId] = useState(fileIdParam);
  const titlesId = useId();
  const locsId = useId();
  const kwId = useId();
  const exId = useId();
  const seniorityId = useId();

  const [prefs, setPrefs] = useState<JobPreferencesBody>(emptyPrefs);
  const [titlesText, setTitlesText] = useState("");
  const [locsText, setLocsText] = useState("");
  const [kwText, setKwText] = useState("");
  const [exText, setExText] = useState("");
  const [seniorityText, setSeniorityText] = useState("");

  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [searching, setSearching] = useState(false);
  const [job, setJob] = useState<JobListingOut | null>(null);
  const [lastRun, setLastRun] = useState<JobSearchRunOut | null>(null);

  const syncUrl = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams);
      if (id.trim()) next.set("file_id", id.trim());
      else next.delete("file_id");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    setFileId(fileIdParam);
  }, [fileIdParam]);

  const loadPrefs = useCallback(async () => {
    const id = fileId.trim();
    if (!id) {
      toast.error("Enter a file id (from Upload PDF).");
      return;
    }
    syncUrl(id);
    setLoadingPrefs(true);
    try {
      const res = await fetch(
        `/api/v1/job-preferences?file_id=${encodeURIComponent(id)}`,
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 404) {
          setPrefs(emptyPrefs());
          setTitlesText("");
          setLocsText("");
          setKwText("");
          setExText("");
          setSeniorityText("");
          toast.message("No saved preferences yet — edit and save.");
          return;
        }
        throw new Error(
          typeof payload?.detail === "string" ? payload.detail : "Load failed",
        );
      }
      const p = (payload.preferences ?? {}) as Record<string, unknown>;
      const body: JobPreferencesBody = {
        desired_titles: Array.isArray(p.desired_titles)
          ? p.desired_titles.filter((x): x is string => typeof x === "string")
          : [],
        locations: Array.isArray(p.locations)
          ? p.locations.filter((x): x is string => typeof x === "string")
          : [],
        remote_only: Boolean(p.remote_only),
        visa_sponsorship: Boolean(p.visa_sponsorship),
        industries: Array.isArray(p.industries)
          ? p.industries.filter((x): x is string => typeof x === "string")
          : [],
        seniority: typeof p.seniority === "string" ? p.seniority : null,
        keywords_include: Array.isArray(p.keywords_include)
          ? p.keywords_include.filter((x): x is string => typeof x === "string")
          : [],
        keywords_exclude: Array.isArray(p.keywords_exclude)
          ? p.keywords_exclude.filter((x): x is string => typeof x === "string")
          : [],
      };
      setPrefs(body);
      setTitlesText(body.desired_titles.join(", "));
      setLocsText(body.locations.join(", "));
      setKwText(body.keywords_include.join(", "));
      setExText(body.keywords_exclude.join(", "));
      setSeniorityText(body.seniority ?? "");
      toast.success("Preferences loaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoadingPrefs(false);
    }
  }, [fileId, syncUrl]);

  async function savePrefs() {
    const id = fileId.trim();
    if (!id) {
      toast.error("Enter a file id first.");
      return;
    }
    syncUrl(id);
    const body: JobPreferencesBody = {
      ...prefs,
      desired_titles: splitList(titlesText),
      locations: splitList(locsText),
      keywords_include: splitList(kwText),
      keywords_exclude: splitList(exText),
      seniority: seniorityText.trim() || null,
    };
    setSavingPrefs(true);
    try {
      const res = await fetch(
        `/api/v1/job-preferences?file_id=${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof payload?.detail === "string" ? payload.detail : "Save failed",
        );
      }
      setPrefs(body);
      toast.success("Preferences saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingPrefs(false);
    }
  }

  async function runSearch() {
    const id = fileId.trim();
    if (!id) {
      toast.error("Enter a file id first.");
      return;
    }
    syncUrl(id);
    setSearching(true);
    setJob(null);
    setLastRun(null);
    try {
      const res = await fetch("/api/v1/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: id }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof payload?.detail === "string"
            ? payload.detail
            : "Job search failed",
        );
      }
      setJob(payload.job as JobListingOut);
      setLastRun(payload.run as JobSearchRunOut);
      toast.success("Found one listing.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Job search failed");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showBack title="Job match" />
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Briefcase className="h-5 w-5 text-blue-600" />
              TinyFish job search
            </CardTitle>
            <CardDescription>
              One agent run per click — the agent opens CareerBuilder by default (override with{" "}
              <code className="text-xs bg-gray-100 px-1 rounded">
                TINYFISH_JOB_SEARCH_URL
              </code>
              ). Uses your saved preferences and latest CV extraction for this file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file-id">CV file id</Label>
              <Input
                id="file-id"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
                placeholder="UUID from Upload PDF"
                className="font-mono text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadPrefs()}
                  disabled={loadingPrefs}
                >
                  {loadingPrefs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Load preferences
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link to="/upload">Upload PDF</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={titlesId}>Desired titles</Label>
                <Input
                  id={titlesId}
                  value={titlesText}
                  onChange={(e) => setTitlesText(e.target.value)}
                  placeholder="e.g. Software Engineer, Data Analyst"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={locsId}>Locations</Label>
                <Input
                  id={locsId}
                  value={locsText}
                  onChange={(e) => setLocsText(e.target.value)}
                  placeholder="e.g. London, Remote"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={kwId}>Keywords (include)</Label>
                <Input
                  id={kwId}
                  value={kwText}
                  onChange={(e) => setKwText(e.target.value)}
                  placeholder="Python, React, …"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={exId}>Keywords (exclude)</Label>
                <Input
                  id={exId}
                  value={exText}
                  onChange={(e) => setExText(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={seniorityId}>Seniority</Label>
              <Input
                id={seniorityId}
                value={seniorityText}
                onChange={(e) => setSeniorityText(e.target.value)}
                placeholder="e.g. mid-level"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                <div className="space-y-0.5 pr-2">
                  <Label htmlFor="remote-only">Remote only</Label>
                  <p className="text-xs text-gray-500">
                    Agent goal + match heuristic.
                  </p>
                </div>
                <Switch
                  id="remote-only"
                  checked={prefs.remote_only}
                  onCheckedChange={(v) =>
                    setPrefs((p) => ({ ...p, remote_only: Boolean(v) }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                <div className="space-y-0.5 pr-2">
                  <Label htmlFor="visa">Visa sponsorship</Label>
                  <p className="text-xs text-gray-500">Stored with preferences.</p>
                </div>
                <Switch
                  id="visa"
                  checked={prefs.visa_sponsorship}
                  onCheckedChange={(v) =>
                    setPrefs((p) => ({ ...p, visa_sponsorship: Boolean(v) }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="secondary"
                className="sm:flex-1"
                onClick={() => void savePrefs()}
                disabled={savingPrefs}
              >
                <Save className="h-4 w-4 mr-2" />
                {savingPrefs ? "Saving…" : "Save preferences"}
              </Button>
              <Button
                type="button"
                className="sm:flex-1"
                onClick={() => void runSearch()}
                disabled={searching}
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Find one job
              </Button>
            </div>
          </CardContent>
        </Card>

        {job && (
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg leading-snug">{job.title}</CardTitle>
                  {job.company && (
                    <CardDescription className="mt-1">{job.company}</CardDescription>
                  )}
                </div>
                {job.match_score != null && (
                  <Badge variant="secondary" className="shrink-0">
                    Match {job.match_score}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.location && (
                <p className="text-sm text-gray-600">{job.location}</p>
              )}
              {job.description_snippet && (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {job.description_snippet}
                </p>
              )}
              {job.match_reasons && job.match_reasons.length > 0 && (
                <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                  {job.match_reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
              <Button asChild className="w-full sm:w-auto">
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open posting
                </a>
              </Button>
              {lastRun && (
                <p className="text-xs text-gray-400 font-mono break-all">
                  Run {lastRun.id}
                  {lastRun.tinyfish_run_id
                    ? ` · TinyFish ${lastRun.tinyfish_run_id}`
                    : ""}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
