import { MailtrapClient } from 'mailtrap';

export const mailtrapClient = new MailtrapClient({
	token: process.env.MAILTRAP_TOKEN,
});

export const sender = {
	email: 'floatPoint@demomailtrap.com',
	name: 'floatPoint',
};

console.log("Mailtrap Token:", process.env.MAILTRAP_TOKEN);