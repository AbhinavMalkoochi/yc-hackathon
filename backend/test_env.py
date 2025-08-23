from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

print("=== Environment Variable Test ===")
print(f"GEMINI_API_KEY found: {bool(os.getenv('GEMINI_API_KEY'))}")
print(f"Key starts with: {os.getenv('GEMINI_API_KEY', '')[:10]}..." if os.getenv('GEMINI_API_KEY') else 'Not found')
print(f"OPENAI_API_KEY found: {bool(os.getenv('OPENAI_API_KEY'))}")
print("=================================")
