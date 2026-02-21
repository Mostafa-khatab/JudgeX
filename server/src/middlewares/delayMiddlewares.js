export const delayMiddleware = (req, res, next) => {
	setTimeout(next, 200);
};

/*
This middleware only use in development mode to simulate delay in response like production
*/
