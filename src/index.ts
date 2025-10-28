import { getSandbox, Sandbox } from '@cloudflare/sandbox';
import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { getCookie, setCookie } from 'hono/cookie';

export { Sandbox };

const app = new Hono<{ Bindings: Env }>();

app.get('/api/results', async(c) => {
	const recentSandboxName = getCookie(c, "recentSandboxName");
	if (recentSandboxName) {
		const results = await c.env.RESULTS.get(recentSandboxName, "json");
		return c.json(results);
	} else {
		return c.notFound();
	}
})

app.post('/api/tutorial/stream', async (c) => {
	const { tutorialUrl } = await c.req.json();
	console.log(`Checking tutorial: ${tutorialUrl}`);
	const VERBOSE = false;
	const REPO_URL = 'https://github.com/craigsdennis/skill-tutorial-checker-anthropic';
	// You could share this and let other processes connect
	const sandboxName = crypto.randomUUID();
	setCookie(c, 'recentSandboxName', sandboxName);
	const sandbox = getSandbox(c.env.Sandbox, sandboxName);
	await sandbox.setEnvVars({
		ANTHROPIC_API_KEY: c.env.ANTHROPIC_API_KEY,
		CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
		CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
	});
	// Help streaming in local dev
	c.header('Content-Encoding', 'Identity');
	c.header('Transfer-Encoding', 'chunked');
	c.header('Content-Type', 'text/x-unknown');
	return streamText(c, async (stream) => {
		try {
			await stream.writeln('🚀 Starting Claude in the Box...🎁');
			await stream.writeln(`Sandbox name: ${sandboxName}`);
			const rootDir = '/workspace/claude-agent';
			const { exists } = await sandbox.exists(rootDir);
			if (exists) {
				stream.writeln('Checkout already exists continuing...');
			} else {
				stream.writeln(`Checking out Agent repository ${REPO_URL}...`);
				await sandbox.gitCheckout(REPO_URL, {
					targetDir: rootDir,
				});
			}
			await sandbox.exec(`cd ${rootDir}`);
			stream.writeln('Installing dependencies...');
			await sandbox.exec('npm install');
			await stream.writeln('Starting skill...');
			// You can reconnect to a Claude Agent session using this
			let claudeSessionId;
			// Customize what you want to pass in here
			await sandbox.exec(`npm start ${tutorialUrl}`, {
				stream: true,
				onOutput: (sandboxStreamType: string, data: string) => {
					console.log({ data });
					if (sandboxStreamType === 'stdout') {
						try {
							const obj = JSON.parse(data);
							// User messages are very noisy
							if (!VERBOSE && obj.type === 'user') return;
							if (obj.type === 'system') {
								claudeSessionId = obj.session_id;
								stream.writeln('Claude Session ID: ' + claudeSessionId);
								return;
							}
							const content = obj.message?.content[0];
							switch (content?.type) {
								case 'text':
									stream.writeln(`Claude: ${content.text}`);
									break;
								case 'tool_use':
									stream.writeln(`🛠️ ${content.name}: ${JSON.stringify(content.input)}`);
									break;
								default:
									stream.writeln(data);
									break;
							}
						} catch (err) {
							stream.writeln(data);
						}
					} else {
						console.error(`[${sandboxStreamType}] - ${data}`);
					}
				},
			});
			// Specific Claude Agent handling here

			const fetched = await sandbox.readFile(`${rootDir}/fetched.md`);
			const review = await sandbox.readFile(`${rootDir}/review.md`);
			const resultsJSON = {
				fetched: fetched.content,
				review: review.content
			};
			await c.env.RESULTS.put(sandboxName, JSON.stringify(resultsJSON));
		} finally {
			stream.writeln('Destroying sandbox');
			await sandbox.destroy();
		}
	});
});

export default app;
