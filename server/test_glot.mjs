import axios from 'axios';

// Quick test of Glot.io API
async function testGlot() {
    console.log('Testing Glot.io API...\n');

    try {
        const res1 = await axios.post('https://run.glot.io/languages/cpp/latest', {
            files: [{ name: "main.cpp", content: "#include<iostream>\nusing namespace std;\nint main(){int n;cin>>n;cout<<n*2;return 0;}" }],
            stdin: '5'
        });
        console.log('Glot Output:', res1.data);
    } catch (err) {
        console.error('Test failed:', err.response?.status, err.message);
    }
}

testGlot();
