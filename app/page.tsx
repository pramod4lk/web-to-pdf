"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FiUpload, FiLink, FiRefreshCw, FiDownload, FiFileText, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function Home() {
  // UI state
  const [tab, setTab] = useState<'single' | 'batch'>('single');
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<{ url: string; name: string } | null>(null);
  const [batchResults, setBatchResults] = useState<Array<{ url: string; status: 'pending' | 'generating' | 'done' | 'error'; pdfUrl?: string; error?: string }>>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers for tab switching
  const handleTab = (t: 'single' | 'batch') => {
    setTab(t);
    setError(null);
    setPdfUrl(null);
    setZipUrl(null);
    setBatchResults([]);
    setUrl("");
    setFile(null);
    setProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 p-4 sm:p-10">
      <div className="w-full max-w-2xl bg-white/90 dark:bg-zinc-900/90 rounded-2xl shadow-2xl p-8 sm:p-12 flex flex-col gap-10 border border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-2 mb-2">
          <button
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl font-semibold transition-colors text-lg ${tab === 'single' ? 'bg-blue-600 text-white shadow' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-zinc-700'}`}
            onClick={() => handleTab('single')}
          >
            <FiLink /> Single Link
          </button>
          <button
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl font-semibold transition-colors text-lg ${tab === 'batch' ? 'bg-blue-600 text-white shadow' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-zinc-700'}`}
            onClick={() => handleTab('batch')}
          >
            <FiUpload /> Batch Upload
          </button>
        </div>
        {tab === 'single' && (
          <form
            className="flex flex-col gap-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setIsLoading(true);
              setPdfUrl(null);
              setProgress(null);
              try {
                setProgress(10);
                const res = await fetch("/api/generate-pdf", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url }),
                });
                setProgress(60);
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error || "Failed to generate PDF");
                }
                const blob = await res.blob();
                setProgress(100);
                // Get filename from header if available
                let fileName = "download.pdf";
                const header = res.headers.get("X-Filename");
                if (header) fileName = header;
                const pdfUrl = URL.createObjectURL(blob);
                setPdfUrl({ url: pdfUrl, name: fileName });
              } catch (err: any) {
                setError(err.message || "Failed to generate PDF. Please check the URL and try again.");
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <label className="font-semibold text-base flex items-center gap-2"><FiLink /> Paste a URL to convert to PDF:</label>
            <input
              type="url"
              required
              className="border-2 border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-zinc-50 dark:bg-zinc-800 text-lg transition"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading || !!pdfUrl}
            />
            {error && <div className="flex items-center gap-2 text-red-600 text-base"><FiAlertCircle /> {error}</div>}
            {!pdfUrl && (
              <button
                type="submit"
                className="flex items-center gap-2 justify-center bg-blue-600 text-white rounded-lg px-6 py-3 font-bold text-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-50 relative min-w-[180px]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Generating PDF
                  </>
                ) : (
                  <>
                    <FiFileText /> Generate PDF
                  </>
                )}
              </button>
            )}
            {pdfUrl && (
              <div className="flex flex-col gap-3">
                <a
                  href={pdfUrl.url}
                  download={pdfUrl.name}
                  className="flex items-center gap-2 justify-center bg-green-600 text-white rounded-lg px-6 py-3 font-bold text-lg shadow hover:bg-green-700 transition-colors text-center"
                >
                  <FiDownload /> Download PDF
                </a>
                <button
                  type="button"
                  className="flex items-center gap-2 justify-center bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-lg px-6 py-3 font-bold text-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                  onClick={() => handleTab('single')}
                >
                  <FiRefreshCw /> Generate Another PDF
                </button>
              </div>
            )}
          </form>
        )}
        {tab === 'batch' && (
          <form
            className="flex flex-col gap-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setBatchResults([]);
              setZipUrl(null);
              if (!file) {
                setError("Please upload a .txt file with URLs.");
                return;
              }
              setIsLoading(true);
              try {
                const text = await file.text();
                const links = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                setBatchResults(links.map(url => ({ url, status: 'generating' as const })));
                const res = await fetch("/api/batch-pdf", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ urls: links }),
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error || "Failed to generate PDFs");
                }
                const zipBlob = await res.blob();
                // Try to get per-link results from header
                let results: any[] = [];
                try {
                  const header = res.headers.get("X-Results");
                  if (header) results = JSON.parse(decodeURIComponent(header));
                } catch {}
                setBatchResults(
                  links.map((url, i) => {
                    const r = results.find((r) => r.url === url) || {};
                    return {
                      url,
                      status: r.status || 'done',
                      pdfUrl: r.status === 'done' ? undefined : undefined, // Individual download not supported in this version
                      error: r.error,
                    };
                  })
                );
                setZipUrl(URL.createObjectURL(zipBlob));
              } catch (err: any) {
                setError(err.message || "Failed to generate PDFs.");
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <label className="font-semibold text-base flex items-center gap-2"><FiUpload /> Upload a .txt file with one URL per line:</label>
            <input
              type="file"
              accept=".txt"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isLoading || batchResults.length > 0}
              className="border-2 border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 bg-zinc-50 dark:bg-zinc-800 text-lg transition"
            />
            {isLoading && (
              <div className="flex items-center gap-3 text-blue-600 font-medium animate-pulse">
                <span className="loader" />
                <span>Generating PDFs...</span>
              </div>
            )}
            {error && <div className="flex items-center gap-2 text-red-600 text-base"><FiAlertCircle /> {error}</div>}
            {batchResults.length === 0 && (
              <button
                type="submit"
                className="flex items-center gap-2 justify-center bg-blue-600 text-white rounded-lg px-6 py-3 font-bold text-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                <FiFileText /> Generate PDFs
              </button>
            )}
            {batchResults.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  {batchResults.map((res, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                      <span className="truncate max-w-[220px] text-zinc-700 dark:text-zinc-200 text-base" title={res.url}>{res.url}</span>
                      {res.status === 'generating' && <span className="loader scale-75" />}
                      {res.status === 'done' && (
                        <span className="flex items-center gap-1 text-green-600 font-semibold"><FiCheckCircle /> Done</span>
                      )}
                      {res.status === 'error' && <span className="flex items-center gap-1 text-red-600"><FiAlertCircle /> Error</span>}
                    </div>
                  ))}
                </div>
                {zipUrl && (
                  <a
                    href={zipUrl}
                    download
                    className="flex items-center gap-2 justify-center bg-green-600 text-white rounded-lg px-6 py-3 font-bold text-lg shadow hover:bg-green-700 transition-colors text-center"
                  >
                    <FiDownload /> Download All as ZIP
                  </a>
                )}
                <button
                  type="button"
                  className="flex items-center gap-2 justify-center bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-lg px-6 py-3 font-bold text-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                  onClick={() => handleTab('batch')}
                >
                  <FiRefreshCw /> Generate Another Batch
                </button>
              </div>
            )}
          </form>
        )}
      </div>
      {/* Modern loader style */}
      <style>{`
        .loader {
          border: 3px solid #e5e7eb;
          border-top: 3px solid #2563eb;
          border-radius: 50%;
          width: 1.5em;
          height: 1.5em;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {/* Footer */}
      <footer className="w-full flex justify-center mt-8 mb-2">
        <span className="text-zinc-500 dark:text-zinc-400 text-base">
          Made with <span className="text-red-500">♥</span> by{' '}
          <a
            href="https://www.linkedin.com/in/pramod4lk/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            pramod4lk
          </a>.
        </span>
      </footer>
    </div>
  );
}
