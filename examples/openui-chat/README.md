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


## Run with Docker

You can run the OpenUI chat example using Docker without installing Node.js or dependencies locally.

### Build the Docker image

From the repository root:

```bash
docker build -f examples/openui-chat/Dockerfile -t openui-chat .
```

### Run the container
```bash
docker run -p 3000:3000 \
-e OPENAI_API_KEY=sk-your-key \
openui-chat
```

### Then open your browser at:

http://localhost:3000

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
