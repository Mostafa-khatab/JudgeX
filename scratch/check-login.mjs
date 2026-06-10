import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output, terminal: true });
const email = (await rl.question('Email: ')).trim();
const password = (await rl.question('Password: ')).trim();
rl.close();

const res = await fetch('http://localhost:8080/auth/login', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ email, password }),
});

const body = await res.text();
let parsed;
try {
	parsed = JSON.parse(body);
} catch {
	parsed = body;
}

console.log(JSON.stringify({
	status: res.status,
	ok: res.ok,
	success: parsed?.success,
	msg: parsed?.msg,
	hasToken: Boolean(parsed?.data?.token),
	user: parsed?.data ? {
		name: parsed.data.name,
		role: parsed.data.role,
		verified: parsed.data.isVerified ?? parsed.data.verified,
	} : null,
}, null, 2));
