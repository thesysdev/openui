This is an [OpenUI](https://openui.com) Agent Chat project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/api/route.ts` and improving your agent
by adding system prompts or tools.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!

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
