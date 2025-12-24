import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Copy, ExternalLink, Trash2, Users, Clock, Share2 } from 'lucide-react';
import { toast } from 'react-toastify';

const CreateInterviewRoom = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);

  const generateRoomId = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  };

  const createInterview = () => {
    const id = generateRoomId();
    const link = `${window.location.origin}/interview/${id}`;
    const newInterview = {
      id,
      createdAt: new Date().toISOString(),
      link,
    };
    setInterviews([newInterview, ...interviews]);
    toast.success('Interview room created!');
    // Auto-copy link
    navigator.clipboard.writeText(link);
    toast.info('Link copied to clipboard!');
  };

  const copyLink = (link, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };

  const deleteInterview = (id, e) => {
    e.stopPropagation();
    setInterviews(interviews.filter((i) => i.id !== id));
    toast.success('Interview deleted');
  };

  const joinInterview = (id) => {
    navigate(`/interview/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Interview Sessions</h1>
                <p className="text-sm text-gray-400">Create and manage coding interviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Create Button */}
        <button
          onClick={createInterview}
          className="w-full mb-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl transition-all duration-300 group shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-white">Create New Interview</h3>
              <p className="text-sm text-blue-100">Start a collaborative coding session</p>
            </div>
          </div>
        </button>

        {/* Interview List */}
        {interviews.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Recent Sessions
            </h2>
            <div className="space-y-3">
              {interviews.map((interview) => (
                <div
                  key={interview.id}
                  onClick={() => joinInterview(interview.id)}
                  className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl p-4 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Room: {interview.id.slice(0, 12)}...</p>
                        <p className="text-xs text-gray-400">
                          Created {new Date(interview.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => copyLink(interview.link, e)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Copy Link"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          joinInterview(interview.id);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <ExternalLink size={14} />
                        Join
                      </button>
                      <button
                        onClick={(e) => deleteInterview(interview.id, e)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {interviews.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No interviews yet</h3>
            <p className="text-gray-500 text-sm">Create your first interview to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateInterviewRoom;
