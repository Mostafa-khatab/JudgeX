import axios from 'axios';

// Quick test of Wandbox API
async function testWandbox() {
    console.log('Testing Wandbox API...\n');

    try {
        const res1 = await axios.post('https://wandbox.org/api/compile.json', {
            compiler: 'gcc-13.1.0-c++',
            code: '#include<iostream>\nusing namespace std;\nint main(){int n;cin>>n;cout<<n*2;return 0;}',
            stdin: '5',
        });
        console.log('Wandbox Output:', res1.data);
    } catch (err) {
        console.error('Test failed:', err.response?.status, err.message);
    }
}

testWandbox();
