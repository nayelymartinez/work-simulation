# evals/agent_http_completion.py
import os
import requests
from evals.completion import CompletionFn

class AgentHttpCompletionFn(CompletionFn):
    """
    A CompletionFn that POSTs the question to your NestJS /agent/transcript/question endpoint
    and returns the “answer” field from the JSON response.
    """

    def __init__(
        self,
        url: str = None,
        user_id: str = None,
        transcript_id: str = None,
    ):
        # Default to localhost:3000 if nothing else is provided
        self.url = url or os.getenv(
            "AGENT_URL",
            "http://localhost:3000/agent/transcript/question",
        )
        # Optional override via env vars. For now, gonna hard-code
        self.user_id = user_id or os.getenv("AGENT_USER_ID", "1")
        self.transcript_id = transcript_id or os.getenv("TRANSCRIPT_ID", "1")

    def __call__(self, request: str, **kwargs) -> str:
        """
        request: the question string from the eval harness.
        kwargs: unused, but Evals will pass through things like temperature, stop, etc.
        """
        payload = {
            "user_id": self.user_id,
            "transcript_id": self.transcript_id,
            "question": request,
        }
        resp = requests.post(self.url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        # Assumes your controller returns { answer: string }
        return data.get("answer", "")

def get_agent_completion_fn() -> CompletionFn:
    """
    Factory for your eval spec. In your YAML/Python spec, set:
      type: python
      module: evals.agent_http_completion
      func: get_agent_completion_fn
    """
    return AgentHttpCompletionFn()
