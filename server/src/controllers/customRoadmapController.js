import CustomRoadmap from '../models/customRoadmap.js';
import Problem from '../models/problem.js';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = 'gemini-flash-latest';

const fetchYouTubeVideo = async (query) => {
    try {
        const API_KEY = process.env.YOUTUBE_API_KEY;
        if (!API_KEY) {
            console.log('YouTube API key missing - using direct search fallback');
            return [];
        }
        
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: 1,
                key: API_KEY
            }
        });
        
        return response.data.items.length > 0 ? [response.data.items[0].id.videoId] : [];
    } catch (error) {
        console.error('YouTube API Error:', error.message);
        return []; // Graceful fallback
    }
};

export const generateRoadmap = async (req, res) => {
    try {
        const { goal } = req.body;
        if (!goal) return res.status(400).json({ success: false, msg: 'Goal is required' });

        const modelName = 'gemini-flash-latest';
        
        const prompt = `Expert tech curriculum designer. Create a high-quality 2D tree learning path for: "${goal}".
JSON format: {
  "title": "Roadmap Title",
  "description": "Short overview",
  "nodes": [
    {
      "nodeId": "unique_string",
      "type": "Video", 
      "title": "Topic Name",
      "description": "Deep technical overview",
      "videoSearchQuery": "Specific YouTube search term",
      "judgeXTags": ["Tag1", "Tag2"],
      "quizzes": [
        {"question": "Technical question?", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0},
        {"question": "Another question?", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 1}
      ]
    }
  ],
  "edges": [{"id": "e1-2", "source": "node1", "target": "node2"}]
}
REQUIREMENTS:
- 5-8 nodes with logical branching.
- EVERY node MUST have 2-3 technical quizzes.
- "judgeXTags" should use standard DSA/Tech tags (e.g., "Array", "Segment Tree", "DP", "React Hooks", "Node.js").
- Descriptions should be professional and detailed.`;
        
        const response = await aiClient.models.generateContent({
            model: modelName,
            contents: [{ text: prompt }],
            config: {
                responseMimeType: "application/json",
                maxOutputTokens: 8000
            }
        });
        
        let aiText = '';
        if (response?.candidates?.length > 0) {
            for (const candidate of response.candidates) {
                const parts = candidate?.content?.parts;
                if (parts?.length > 0) {
                    aiText = parts.map(p => p.text || '').join('').trim();
                    if (aiText) break;
                }
            }
        }
        
        if (!aiText) {
            console.error('Empty AI response');
            return res.status(500).json({ success: false, msg: 'Empty AI response' });
        }
        
        let responseText = aiText.trim();
        if (responseText.startsWith('```json')) {
            responseText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }
        
        if (!responseText.endsWith('}') && !responseText.endsWith(']')) {
            console.error('=== JSON Truncation Error ===');
            console.error('Incomplete JSON - does not end with } or ]:', responseText.slice(-100));
            return res.status(500).json({ success: false, msg: 'JSON response truncated by AI' });
        }
        
        let parsedData;
        try {
            parsedData = JSON.parse(responseText);
        } catch (parseErr) {
            console.error('=== JSON Parse Error ===');
            console.error('Stripped Response:', responseText);
            console.error('Parse Error:', parseErr.message);
            return res.status(500).json({ success: false, msg: 'Failed to parse AI response' });
        }

        // Hydrate nodes with YouTube and Problems
        const hydratedNodes = await Promise.all(parsedData.nodes.map(async (node, index) => {
            const videoIds = await fetchYouTubeVideo(node.videoSearchQuery);
            const videoSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(node.videoSearchQuery)}`;
            
            // Find actual JudgeX problems by tags (using regex for flexibility)
            const tagQueries = (node.judgeXTags || []).map(tag => ({
                tags: { $regex: new RegExp(`^${tag}$`, 'i') } 
            }));
            
            let problems = [];
            if (tagQueries.length > 0) {
                problems = await Problem.find({ 
                    $or: tagQueries
                }).limit(2);
            }
            
            // Fallback: If no problems found by exact tags, try keywords from title
            if (problems.length === 0) {
                const keywords = node.title.split(' ').filter(w => w.length > 3);
                problems = await Problem.find({
                    $or: [
                        { name: { $regex: new RegExp(keywords.join('|'), 'i') } },
                        { tags: { $regex: new RegExp(keywords.join('|'), 'i') } }
                    ]
                }).limit(2);
            }

            return {
                ...node,
                videoIds,
                videoSearchUrl,
                linkedProblems: problems.map(p => p._id),
                status: index === 0 ? 'unlocked' : 'locked' // Initial state
            };
        }));

        const newRoadmap = new CustomRoadmap({
            user: req.userId,
            goal: goal,
            title: parsedData.title,
            description: parsedData.description,
            nodes: hydratedNodes,
            edges: parsedData.edges
        });

        await newRoadmap.save();
        return res.status(201).json({ success: true, roadmap: newRoadmap });

    } catch (err) {
        console.error('=== Gemini AI Error Details ===');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        if (err.response) {
            console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
        }
        console.error('Full Error Stack:', err.stack);
        
        const errorMessage = err.message || 'Server Error';
        return res.status(500).json({ success: false, msg: `Server Error: ${errorMessage}` });
    }
};

export const getMyRoadmaps = async (req, res) => {
    try {
        const roadmaps = await CustomRoadmap.find({ user: req.userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, roadmaps });
    } catch (err) {
        return res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

export const getRoadmapById = async (req, res) => {
    try {
        const roadmap = await CustomRoadmap.findOne({ _id: req.params.id, user: req.userId })
            .populate('nodes.linkedProblems');
        if (!roadmap) return res.status(404).json({ success: false, msg: 'Roadmap not found' });
        return res.status(200).json({ success: true, roadmap });
    } catch (err) {
        return res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

export const updateNodeProgress = async (req, res) => {
    try {
        const { id, nodeId } = req.params;
        const { isVideoWatched, isQuizPassed, isProblemSolved } = req.body;
        
        const roadmap = await CustomRoadmap.findOne({ _id: id, user: req.userId });
        if (!roadmap) return res.status(404).json({ success: false, msg: 'Roadmap not found' });

        const node = roadmap.nodes.find(n => n.nodeId === nodeId || n._id.toString() === nodeId);
        if (!node) return res.status(404).json({ success: false, msg: `Node ${nodeId} not found` });

        if (isVideoWatched !== undefined) node.isVideoWatched = isVideoWatched;
        if (isQuizPassed !== undefined) node.isQuizPassed = isQuizPassed;
        if (isProblemSolved !== undefined) node.isProblemSolved = isProblemSolved;

        // Auto-complete logic (Mastering video unlocks next step)
        if (node.isVideoWatched || (node.isQuizPassed && node.isProblemSolved)) {
            node.status = 'completed';
            
            // Unlock outgoing edges using the canonical nodeId
            const canonicalId = node.nodeId;
            const outgoingEdges = roadmap.edges.filter(e => e.source === canonicalId);
            outgoingEdges.forEach(edge => {
                const targetNode = roadmap.nodes.find(n => n.nodeId === edge.target);
                if (targetNode && targetNode.status === 'locked') {
                    targetNode.status = 'unlocked';
                }
            });
        }

        await roadmap.save();
        return res.status(200).json({ success: true, roadmap });
    } catch (err) {
        return res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

export const deleteRoadmap = async (req, res) => {
    try {
        const { id } = req.params;
        const roadmap = await CustomRoadmap.findOneAndDelete({ _id: id, user: req.userId });
        if (!roadmap) {
            return res.status(404).json({ success: false, msg: 'Roadmap not found or not authorized' });
        }
        return res.status(200).json({ success: true, msg: 'Roadmap deleted successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, msg: 'Server Error' });
    }
};
