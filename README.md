# Claude in the Box

[<img src="https://img.youtube.com/vi/jEuIgwYx8dQ/0.jpg">](https://youtu.be/jEuIgwYx8dQ "Claude in the Box: Use Anthropic Agent SDK in a Cloudflare Sandbox")

This demo application shows using [Claude Agent](https://docs.claude.com/en/api/agent-sdk/overview) in a [Cloudflare Sandbox](https://sandbox.cloudflare.com)

This example hosts the Anthropic repo [Tutorial Checker](https://github.com/craigsdennis/skill-tutorial-checker-anthropic)

## Develop

Copy [.dev.vars.example](./.dev.vars.example) to `.dev.vars`

Gather your Anthropic API key.

Search API Token on Cloudflare, generate a new one, and choose Browser Rendering > Read and Browser Rendering > Edit.

```bash
npm run dev
```

## Develop

Upload your secrets

```bash
npx wrangler secret bulk <filename>
```

```bash
npm run deploy
```
