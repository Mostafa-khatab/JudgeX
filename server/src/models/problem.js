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
      c: {
        type: String,
        default: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`
      },
      cpp: {
        type: String,
        default: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your solution here\n    }\n};\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    Solution sol;\n    sol.solve();\n    \n    return 0;\n}`
      },
      python: {
        type: String,
        default: `import sys\n\nclass Solution:\n    def solve(self):\n        # Write your solution here\n        pass\n\nif __name__ == "__main__":\n    sol = Solution()\n    sol.solve()`
      },
      javascript: {
        type: String,
        default: `class Solution {\n    solve() {\n        // Write your solution here\n    }\n}\n\nconst sol = new Solution();\nsol.solve();`
      },
      java: {
        type: String,
        default: `import java.util.*;\n\npublic class Solution {\n    public void solve() {\n        // Write your solution here\n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        sol.solve();\n    }\n}`
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
