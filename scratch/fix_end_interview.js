const fs = require('fs');
const path = 'd:/JudgeX/JudgeX/server/src/controllers/interviewController.js';
let content = fs.readFileSync(path, 'utf8');

const endInterviewRegex = /const endInterview = async \(req, res\) => \{[\s\S]*?\};/;
const newEndInterview = `const endInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { io } = req.app.locals;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    if (io) {
      io.to(\`interview:\${id}\`).emit('interview-finished', {
        status: 'finished',
        message: 'Interview ended and all data has been deleted.'
      });
      io.to(\`interview:\${id}\`).disconnectSockets();
    }

    await Interview.findByIdAndDelete(id);

    return sendSuccess(res, null, 'Interview ended and deleted');
  } catch (err) {
    return handleError(res, err, 'EndInterview', 500);
  }
};`;

content = content.replace(endInterviewRegex, newEndInterview);
fs.writeFileSync(path, content);
console.log('Successfully updated endInterview');
