from browser_use_sdk import BrowserUse

client = BrowserUse(
api_key="My API Key",
)
task = client.tasks.create(
task="x",
)
print(task.id)
