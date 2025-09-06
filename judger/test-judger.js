// Test script to debug RTE issues
import judge from './src/judgeEngine/index.js';

const testProblem = {
    id: 'test-problem',
    point: 100,
    timeLimit: 2, // 2 seconds
    memoryLimit: 256, // 256 MB
    testcase: [
        {
            stdin: '5\n1 2 3 4 5',
            stdout: '15\n'
        }
    ]
};

const testCases = [
    {
        name: 'C++ Test',
        language: 'c++17',
        src: `#include <iostream>
using namespace std;
int main() {
    int n, sum = 0;
    cin >> n;
    for(int i = 0; i < n; i++) {
        int x;
        cin >> x;
        sum += x;
    }
    cout << sum << endl;
    return 0;
}`
    },
    {
        name: 'Python Test',
        language: 'python3',
        src: `n = int(input())
arr = list(map(int, input().split()))
print(sum(arr))`
    },
    {
        name: 'C Test',
        language: 'c',
        src: `#include <stdio.h>
int main() {
    int n, sum = 0;
    scanf("%d", &n);
    for(int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        sum += x;
    }
    printf("%d\\n", sum);
    return 0;
}`
    }
];

console.log('Testing judger with different languages...\n');

for (const testCase of testCases) {
    console.log(`\n=== Testing ${testCase.name} ===`);
    console.log(`Language: ${testCase.language}`);
    console.log('Source code:');
    console.log(testCase.src);
    console.log('\nRunning judge...');
    
    try {
        const result = await judge({
            src: testCase.src,
            language: testCase.language,
            problem: testProblem
        });
        
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
    
    console.log('\n' + '='.repeat(50));
}
