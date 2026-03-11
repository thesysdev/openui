## Running with Docker

You can run the OpenUI chat example using Docker without manually installing dependencies.

### Build the container

```bash
docker build -t openui-chat .

```
### Run the container
```bash
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-your-key openui-chat
```
After the container starts, open your browser and go to:

http://localhost:3000

The OpenUI chat example should now be running.

## Environment Variables

The following environment variables are supported:

| Variable | Description | Required |
|----------|-------------|----------|
| OPENAI_API_KEY | Your OpenAI API key used by the chat backend | Yes |
| OPENAI_MODEL | Optional model override (e.g. `gpt-4o`) | No |
| OPENAI_BASE_URL | Optional custom API endpoint | No |

Example:
```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=sk-your-key \
  -e OPENAI_MODEL=gpt-4o \
  openui-chat
```
