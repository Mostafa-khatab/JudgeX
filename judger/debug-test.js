// Debug test for the specific wrong answer case
import judge from './src/judgeEngine/index.js';

const testProblem = {
    id: 'debug-test',
    point: 100,
    timeLimit: 2,
    memoryLimit: 256,
    testcase: [
        {
            stdin: '3\n5 3\n-2 7\n1000000000 1000000000',
            stdout: '13\n3\n-1294967296\n'
        }
    ]
};

const testCode = `#include <iostream>
using namespace std;

int main(){
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cout.tie(NULL);
    int t;
    cin>>t;
    while(t--){
        int a,b;
        cin>>a>>b;
        cout<<a+b+a<<endl;
    }

    return 0;
}`;

console.log('Debugging wrong answer case...\n');
console.log('Input:');
console.log(testProblem.testcase[0].stdin);
console.log('\nExpected Output:');
console.log(testProblem.testcase[0].stdout);
console.log('\nSource Code:');
console.log(testCode);
console.log('\nRunning judge...\n');

try {
    const result = await judge({
        src: testCode,
        language: 'c++17',
        problem: testProblem
    });
    
    console.log('Result:', JSON.stringify(result, null, 2));
} catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
}
