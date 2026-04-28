import 'dotenv/config';
import axios from 'axios';

async function testJDoodleTLE() {
    console.log('Testing JDoodle TLE...\n');

    try {
        const response = await axios.post('https://api.jdoodle.com/v1/execute', {
            clientId: process.env.JDOODLE_CLIENT_ID_1,
            clientSecret: process.env.JDOODLE_CLIENT_SECRET_1,
            script: '#include<iostream>\nusing namespace std;\nint main(){while(true){}; return 0;}',
            language: 'cpp14',
            versionIndex: '4',
            stdin: ''
        }, { timeout: 15000 });

        console.log('Response:', response.data);
    } catch (err) {
        console.error('ERROR:', err.response?.data || err.message);
    }
}

testJDoodleTLE();
