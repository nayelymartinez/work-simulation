import { useState, useEffect } from "react";
import axios from "axios";

export function Transcript() {
  const userId = 1;
  const transcriptId = 1;

  // Transcript
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState("");

  // Q&A
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  // Collapse
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchTranscript = async () => {
      setTxLoading(true);
      setTxError("");
      try {
        const { data } = await axios.get<{
          transcript: string;
          summary?: string;
        }>(`http://localhost:3000/agent/transcript/${userId}/${transcriptId}`, {
          params: { onlyTranscript: false },
        });
        setTranscript(data.transcript);
        setSummary(data.summary ?? "");
      } catch (err: any) {
        if (err.response?.status === 404)
          setTxError("Transcript not found — check the ID.");
        else if (err.response?.status === 403)
          setTxError("No permission to view this transcript.");
        else setTxError(err.message || "Unexpected error.");
      } finally {
        setTxLoading(false);
      }
    };
    fetchTranscript();
  }, [transcriptId]);

  const handleQuestion = async () => {
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const { data } = await axios.post<{
        answer?: string;
        message?: string;
      }>("http://localhost:3000/agent/transcript/question", {
        user_id: userId,
        transcript_id: transcriptId,
        question,
      });
      setAnswer(data.answer ?? "");
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404)
        setError("Transcript not found — please verify the ID.");
      else if (status === 403)
        setError("You don't have permission to ask questions here.");
      else setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* SUMMARY */}
      {summary && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h2 className="font-semibold text-blue-700 mb-1">
            Transcript Summary
          </h2>
          <p className="text-gray-800 whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {/* QUESTION FORM */}
      <div className="space-y-2">
        {error && <p className="text-red-600">{error}</p>}
        <textarea
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows={3}
          placeholder="Ask a question about this session…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          onClick={handleQuestion}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Submitting…" : "Submit"}
        </button>
      </div>

      {/* ANSWER */}
      {answer && (
        <div className="bg-white shadow rounded p-4 border">
          <h3 className="font-medium text-gray-800 mb-2">Answer</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{answer}</p>
        </div>
      )}

      {/* TRANSCRIPT COLLAPSE */}
      <div className="space-y-2">
        {txLoading ? (
          <p>Loading transcript…</p>
        ) : txError ? (
          <p className="text-red-600">{txError}</p>
        ) : (
          <>
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-blue-600 hover:underline"
            >
              {open ? "Hide Transcript" : "Show Transcript"}
            </button>
            {open && (
              <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap text-sm">
                {transcript}
              </pre>
            )}
          </>
        )}
      </div>
    </div>
  );
}
