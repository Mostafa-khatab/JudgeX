import 'dotenv/config';
import axios from 'axios';

async function testJDoodleKeys() {
    console.log('Testing JDoodle Keys Configuration...\n');

    const jdoodleKeys = [];
    let i = 1;
    while (process.env[`JDOODLE_CLIENT_ID_${i}`] && process.env[`JDOODLE_CLIENT_SECRET_${i}`]) {
        jdoodleKeys.push({
            clientId: process.env[`JDOODLE_CLIENT_ID_${i}`],
            clientSecret: process.env[`JDOODLE_CLIENT_SECRET_${i}`]
        });
        i++;
    }

    console.log(`Found ${jdoodleKeys.length} keys in .env\n`);

    if (jdoodleKeys.length === 0) {
        console.error('❌ No keys found!');
        return;
    }

    // Pick a random key just like the controller does
    const randomKey = jdoodleKeys[Math.floor(Math.random() * jdoodleKeys.length)];
    console.log(`Using Key: ${randomKey.clientId.substring(0, 5)}...`);

    try {
        const startTime = Date.now();
        const response = await axios.post('https://api.jdoodle.com/v1/execute', {
            clientId: randomKey.clientId,
            clientSecret: randomKey.clientSecret,
            script: '#include<iostream>\nusing namespace std;\nint main(){int n;cin>>n;cout<<n*2<<endl;return 0;}',
            language: 'cpp14',
            versionIndex: '4',
            stdin: '15'
        }, { timeout: 15000 });

        console.log('\n--- JDoodle API Response ---');
        console.log(`Status Code: ${response.data.statusCode}`);
        console.log(`Output: ${response.data.output?.trim()}`);
        console.log(`Memory: ${response.data.memory}`);
        console.log(`Time taken: ${Date.now() - startTime}ms`);

        if (response.data.output?.trim() === '30') {
            console.log('\n✅ TEST PASSED: JDoodle API is working properly with the new keys!');
        } else {
            console.log('\n❌ TEST FAILED: Output did not match expected result.');
        }

    } catch (err) {
        console.error('\n❌ ERROR:', err.response?.data || err.message);
    }
}

testJDoodleKeys();
