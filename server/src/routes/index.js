import auth from './authRoutes.js';
import user from './userRoutes.js';
import problem from './problemRoutes.js';
import submission from './submissionRoutes.js';
import contest from './contestRoutes.js';
import course from './courseRoutes.js';
import statRoutes from './statRoutes.js';
import chatbot from './chatbotRoutes.js';
import codeRunner from './codeRunnerRoutes.js';
import interview from './interviewRoutes.js';
import queueRoutes from './queueRoutes.js';

function route(app) {
	app.get('/', (req, res, next) => res.send('Hello world!'));
	app.use('/auth', auth);
	app.use('/user', user);
	app.use('/problem', problem);
	app.use('/submission', submission);
	app.use('/contest', contest);
	app.use('/course', course);
	app.use('/stat', statRoutes);
	app.use('/chatbot', chatbot);
	app.use('/code', codeRunner);
	app.use('/interview', interview);
	app.use('/queue', queueRoutes);
}

export default route;
