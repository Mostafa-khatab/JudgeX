import axios from 'axios';

// Quick test of CodeX API
async function testCodeX() {
    console.log('Testing CodeX API...\n');

    try {
        const res1 = await axios.post('https://api.codex.jaagrav.in', {
            code: '#include<iostream>\nusing namespace std;\nint main(){int n;cin>>n;cout<<n*2;return 0;}',
            language: 'cpp',
            input: '5'
        });
        console.log('C++ Output:', res1.data.output);
        console.log('Expected: 10, Got:', res1.data.output?.trim());
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testCodeX();
