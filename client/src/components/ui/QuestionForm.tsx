import { useState, useEffect } from "react";
import { Box, Text, Spinner } from "@chakra-ui/react";
import { Card } from "@chakra-ui/react";
import { Textarea } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react/button";

export function QuestionForm() {
  // Gonna hard-code these for demo; pull these from props or route params in real app
  const userId = 1;
  const transcriptId = 1;

  // transcript state
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [txLoading, setTxLoading] = useState<boolean>(true);
  const [txError, setTxError] = useState<string>("");

  // Q&A state
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Load transcript on mount
  useEffect(() => {
    const fetchTranscript = async () => {
      setTxLoading(true);
      setTxError("");
      try {
        const resp = await fetch(
          `http://localhost:3000/agent/transcript/${userId}/${transcriptId}?onlyTranscript=false`
        );
        if (!resp.ok) {
          let msg = "Unable to load transcript.";
          if (resp.status === 404) {
            msg =
              "Hm, I'm having trouble finding that transcript. Please verify the ID and try again.";
          } else if (resp.status === 403) {
            msg =
              "Hm, it seems you may not have permission to view that transcript. Please contact your administrator.";
          }
          throw new Error(msg);
        }
        const data = (await resp.json()) as {
          transcript: string;
          summary?: string;
        };
        setTranscript(data.transcript);
        setSummary(data.summary ?? "");
      } catch (err: unknown) {
        setTxError(err instanceof Error ? err.message : "Unexpected error");
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
      const resp = await fetch(
        "http://localhost:3000/agent/transcript/question",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            transcript_id: transcriptId,
            question,
          }),
        }
      );

      const data = (await resp.json()) as {
        answer?: string;
        message?: string;
      };
      console.log(JSON.stringify(data, null, 2));

      if (!resp.ok) {
        let clientMsg: string;
        switch (resp.status) {
          case 404:
            clientMsg =
              "Sorry, I can't find that transcript. Please verify the ID.";
            break;
          case 403:
            clientMsg =
              "You don't have permission to ask questions on this transcript.";
            break;
          default:
            clientMsg =
              data.message ??
              "Sorry, something went wrong answering your question.";
        }
        throw new Error(clientMsg);
      }

      setAnswer(data.answer ?? "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="800px" mx="auto" p={4}>
      {/* Question Form */}
      {error && (
        <Text color="red.500" mb={2}>
          {error}
        </Text>
      )}
      <Textarea
        mb={2}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type your question about the transcript here..."
      />
      <Button onClick={handleQuestion} loading={loading} mb={4}>
        {loading ? "Loading..." : "Submit"}
      </Button>

      {/* Answer */}
      {answer && (
        <Card.Root>
          <Card.Body>
            <Card.Title>Answer:</Card.Title>
            <Card.Description>{answer}</Card.Description>
          </Card.Body>
        </Card.Root>
      )}

      {/* Transcript */}
      {txLoading ? (
        <Spinner mb={4} />
      ) : txError ? (
        <Text color="red.500" mb={4}>
          {txError}
        </Text>
      ) : (
        <Card.Root mb={6}>
          {summary && (
            <Card.Body>
              <Card.Title>Summary</Card.Title>
              <Card.Description fontSize="sm">{summary}</Card.Description>
            </Card.Body>
          )}
          <Card.Body>
            <Card.Title>Transcript</Card.Title>
            <Card.Description whiteSpace="pre-wrap" fontSize="sm">
              {transcript}
            </Card.Description>
          </Card.Body>
        </Card.Root>
      )}
    </Box>
  );
}
