import axios from 'axios';

// Quick test of OneCompiler API
async function testOneCompiler() {
    console.log('Testing OneCompiler API...\n');

    try {
        const res1 = await axios.post('https://onecompiler.com/api/code/exec', {
            language: 'cpp',
            stdin: '5',
            files: [
                {
                    name: 'main.cpp',
                    content: '#include<iostream>\nusing namespace std;\nint main(){int n;cin>>n;cout<<n*2;return 0;}'
                }
            ]
        });
        console.log('OneCompiler Output:', res1.data);
    } catch (err) {
        console.error('Test failed:', err.response?.status, err.message);
    }
}

testOneCompiler();
