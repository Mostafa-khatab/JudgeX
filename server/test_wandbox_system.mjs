import axios from 'axios';

async function testWandboxSystem() {
    const mainCpp = `
#include <cstdlib>
int main() {
    system("bash run.sh");
    return 0;
}
    `;

    const runSh = `
echo "Hello from bash"
cat user_code.cpp
g++ user_code.cpp -o prog
echo "5" | ./prog
    `;

    const userCode = `
#include<iostream>
using namespace std;
int main(){int n;cin>>n;cout<<n*2<<endl;return 0;}
    `;

    try {
        const res = await axios.post('https://wandbox.org/api/compile.json', {
            compiler: 'gcc-head-c++',
            code: mainCpp,
            codes: [
                { file: "run.sh", content: runSh },
                { file: "user_code.cpp", content: userCode }
            ]
        });
        console.log('Output:', res.data);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testWandboxSystem();
