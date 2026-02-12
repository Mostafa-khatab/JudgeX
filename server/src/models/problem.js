import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    tags: [String],
    public: { type: Boolean, default: true },
    contest: [String],
    point: { type: Number, default: 100 },
    timeLimit: { type: Number, default: 1 },
    memoryLimit: { type: Number, default: 256 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    noOfSubm: { type: Number, default: 0 },
    noOfSuccess: { type: Number, default: 0 },
    task: { type: String, default: '' },
    testcase: [
      {
        stdin: { type: String, required: true },
        stdout: { type: String, required: true },
      },
    ],
    // ===== Starter Code Templates for Interview =====
    starterCode: {
      cpp: {
        type: String,
        default: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    void solve() {
        // Write your solution here
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    Solution().solve();
    return 0;
}`
      },
      python: {
        type: String,
        default: `class Solution:
    def solve(self):
        # Write your solution here
        pass

if __name__ == "__main__":
    Solution().solve()`
      },
      javascript: {
        type: String,
        default: `class Solution {
    solve() {
        // Write your solution here
    }
}

new Solution().solve();`
      },
      java: {
        type: String,
        default: `import java.util.*;

public class Solution {
    public void solve() {
        // Write your solution here
    }
    
    public static void main(String[] args) {
        new Solution().solve();
    }
}`
      }
    },
  },
  {
    timestamps: true,
    statics: {
      filterAndSort: async function ({ tags = [], q = '', sortBy, order, difficulty }) {
        const regex = new RegExp(q, 'i');
        const data = await this.find({
          $or: [{ id: { $regex: regex } }, { name: { $regex: regex } }],
        })
          .sort({
            [(sortBy === 'accuracy' || sortBy === 'difficulty' ? 'id' : sortBy) || 'id']:
              typeof order === 'string' ? Number(order) : order || 1,
          })
          .select('-testcase -_id -__v');

        return data.filter(
          (problem) =>
            (tags.length == 0 || tags.every((tag) => problem.tags.includes(tag))) &&
            (!difficulty || problem.difficulty == difficulty),
        );
      },
    },
  },
);

const Problem = mongoose.model('Problem', problemSchema);
export default Problem;
