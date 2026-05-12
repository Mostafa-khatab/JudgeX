const fs = require('fs');
const path = 'd:/JudgeX/JudgeX/mobile/src/components/MissionDashboard.js';
if (fs.existsSync(path)) {
    console.log('File exists!');
    console.log(fs.readFileSync(path, 'utf8').substring(0, 100));
} else {
    console.log('File does not exist.');
    const dir = 'd:/JudgeX/JudgeX/mobile/src/components';
    console.log('Contents of ' + dir + ':');
    console.log(fs.readdirSync(dir));
}
