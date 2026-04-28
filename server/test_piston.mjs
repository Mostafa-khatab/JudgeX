import axios from 'axios';

// Quick test of Piston API
async function testPiston() {
    console.log('Testing Piston API...\n');

    // Test 1: C++ Hello World
    console.log('=== Test 1: C++ ===');
    const res1 = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language: 'c++',
        version: '10.2.0',
        files: [{ content: '#include<iostream>\nusing namespace std;\nint main(){int n;cin>>n;cout<<n*2;return 0;}' }],
        stdin: '5',
    });
    console.log('Output:', res1.data.run?.stdout);
    console.log('Exit code:', res1.data.run?.code);
    console.log('Expected: 10, Got:', res1.data.run?.stdout?.trim());
    console.log(res1.data.run?.stdout?.trim() === '10' ? '✅ PASS' : '❌ FAIL');

    // Test 2: Python
    console.log('\n=== Test 2: Python ===');
    const res2 = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language: 'python',
        version: '3.10.0',
        files: [{ content: 'print("Hello from Python!")' }],
        stdin: '',
    });
    console.log('Output:', res2.data.run?.stdout?.trim());
    console.log(res2.data.run?.stdout?.trim() === 'Hello from Python!' ? '✅ PASS' : '❌ FAIL');

    // Test 3: Compilation Error
    console.log('\n=== Test 3: CE Detection ===');
    const res3 = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language: 'c++',
        version: '10.2.0',
        files: [{ content: 'int main(){invalid_code}' }],
        stdin: '',
    });
    console.log('Compile code:', res3.data.compile?.code);
    console.log('Compile stderr:', res3.data.compile?.stderr?.substring(0, 100));
    console.log(res3.data.compile?.code !== 0 ? '✅ CE detected' : '❌ CE not detected');

    // Test 4: Runtime Error
    console.log('\n=== Test 4: RTE Detection ===');
    const res4 = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language: 'python',
        version: '3.10.0',
        files: [{ content: 'x = 1/0' }],
        stdin: '',
    });
    console.log('Run code:', res4.data.run?.code);
    console.log('Run stderr:', res4.data.run?.stderr?.substring(0, 100));
    console.log(res4.data.run?.code !== 0 ? '✅ RTE detected' : '❌ RTE not detected');

    console.log('\n✅ All Piston API tests complete!');
}

testPiston().catch(err => console.error('Test failed:', err.message));
