import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key or not api_key.startswith("sk-"):
    print("❌ OPENAI_API_KEY not found or invalid.")
    exit(1)

# Delay importing evals until the key is guaranteed to be present
import evals
from evals.cli import main

main([
    "evals/therapy_eval.yaml",
    "--model", "gpt-4"
])
