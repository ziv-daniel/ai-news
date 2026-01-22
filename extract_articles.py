import json
import re

with open(r"C:\Users\zivda\.claude\projects\C--Repo-ai-news-rag\a398a3f0-83af-44f1-856e-9c423d076dca\tool-results\mcp-supabase-execute_sql-1769079829143.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Parse the outer JSON
data = json.loads(content)
# Get the text field which contains escaped JSON
text = data[0]["text"]

# Find the array start (escaped)
start = text.find('[{\\"id\\"')
if start != -1:
    # Find the end
    end = text.find('</untrusted-data', start)
    if end != -1:
        articles_json_escaped = text[start:end].strip()
        # The JSON is double-escaped, need to unescape
        articles_json = articles_json_escaped.replace('\\"', '"')
        # Handle escaped newlines
        articles_json = articles_json.replace('\\n', ' ').replace('\\r', ' ')
        articles_json = articles_json.replace('\\t', ' ')
        # Remove any other control characters
        articles_json = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', articles_json)

        articles = json.loads(articles_json)
        # Save first 60 articles
        with open("frontend/public/articles.json", "w", encoding="utf-8") as f:
            json.dump(articles[:60], f, indent=2)
        print(f"Saved {len(articles[:60])} articles")
    else:
        print("Could not find end marker")
else:
    print("Could not find escaped start")
