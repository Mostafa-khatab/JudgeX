import axios from 'axios';

async function testWandboxBash() {
    const bashScript = `
# Write user code to file
cat << 'EOF' > user_code.cpp
#include<iostream>
using namespace std;
int main(){int n;cin>>n;cout<<n*2<<endl;return 0;}
EOF

# Compile
g++ -O2 user_code.cpp -o prog
if [ $? -ne 0 ]; then
    echo "COMPILE_ERROR"
    exit 1
fi

# Run test case 1
echo "---TEST_1---"
echo "5" | ./prog
echo "---TEST_2---"
echo "10" | ./prog
`;

    try {
        const res = await axios.post('https://wandbox.org/api/compile.json', {
            compiler: 'bash',
            code: bashScript
        });
        console.log('Output:', res.data);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testWandboxBash();
