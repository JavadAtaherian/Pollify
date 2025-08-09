import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, BarChart3, Settings, Home, PlusCircle } from 'lucide-react';

// API Base URL
const API_BASE = 'http://localhost:5000/api';

// API Helper Functions
const api = {
  // Surveys
  getSurveys: (creatorId) => fetch(`${API_BASE}/surveys/creator/${creatorId}`).then(r => r.json()),
  getSurvey: (id) => fetch(`${API_BASE}/surveys/${id}`).then(r => r.json()),
  createSurvey: (data) => fetch(`${API_BASE}/surveys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateSurvey: (id, data) => fetch(`${API_BASE}/surveys/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteSurvey: (id) => fetch(`${API_BASE}/surveys/${id}`, {
    method: 'DELETE'
  }).then(r => r.json()),
  
  // Questions
  createQuestion: (data) => fetch(`${API_BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateQuestion: (id, data) => fetch(`${API_BASE}/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteQuestion: (id) => fetch(`${API_BASE}/questions/${id}`, {
    method: 'DELETE'
  }).then(r => r.json()),
  
  // Responses
  getSurveyResponses: (surveyId) => fetch(`${API_BASE}/responses/survey/${surveyId}`).then(r => r.json()),
  startResponse: (data) => fetch(`${API_BASE}/responses/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  submitResponse: (responseId, answers) => fetch(`${API_BASE}/responses/${responseId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers })
  }).then(r => r.json())
};

// Question Types
const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text', icon: '📝' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
  { value: 'radio', label: 'Single Choice', icon: '🔘' },
  { value: 'checkbox', label: 'Multiple Choice', icon: '☑️' },
  { value: 'dropdown', label: 'Dropdown', icon: '📋' },
  { value: 'rating', label: 'Rating', icon: '⭐' },
  { value: 'scale', label: 'Scale', icon: '📊' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'number', label: 'Number', icon: '🔢' }
];

// Mock user data (in real app, this would come from authentication)
const MOCK_USER = { id: 1, name: 'Test User', email: 'test@example.com' };

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const result = await api.getSurveys(MOCK_USER.id);
      if (result.success) {
        setSurveys(result.data);
      }
    } catch (error) {
      console.error('Failed to load surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSurveyCreated = async (surveyData) => {
    try {
      const result = await api.createSurvey({
        ...surveyData,
        creator_id: MOCK_USER.id
      });
      if (result.success) {
        await loadSurveys();
        setSelectedSurvey(result.data);
        setCurrentView('builder');
      }
    } catch (error) {
      console.error('Failed to create survey:', error);
    }
  };

  const handleSurveyDeleted = async (surveyId) => {
    try {
      await api.deleteSurvey(surveyId);
      await loadSurveys();
    } catch (error) {
      console.error('Failed to delete survey:', error);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            surveys={surveys}
            onCreateSurvey={() => setCurrentView('create')}
            onEditSurvey={(survey) => {
              setSelectedSurvey(survey);
              setCurrentView('builder');
            }}
            onViewResponses={(survey) => {
              setSelectedSurvey(survey);
              setCurrentView('responses');
            }}
            onDeleteSurvey={handleSurveyDeleted}
            loading={loading}
          />
        );
      case 'create':
        return (
          <CreateSurvey 
            onSurveyCreated={handleSurveyCreated}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      case 'builder':
        return (
          <SurveyBuilder 
            survey={selectedSurvey}
            onBack={() => setCurrentView('dashboard')}
            onSurveyUpdated={loadSurveys}
          />
        );
      case 'responses':
        return (
          <ResponsesView 
            survey={selectedSurvey}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'take':
        return (
          <TakeSurvey 
            survey={selectedSurvey}
            onComplete={() => setCurrentView('dashboard')}
          />
        );
      default:
        return <Dashboard surveys={surveys} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">Pollify</div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Home className="w-4 h-4 inline mr-2" />
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {MOCK_USER.name}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
}

// Dashboard Component
function Dashboard({ surveys, onCreateSurvey, onEditSurvey, onViewResponses, onDeleteSurvey, loading }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">My Surveys</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create, manage, and analyze your surveys
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={onCreateSurvey}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            New Survey
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <input
          type="text"
          placeholder="Search surveys..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Surveys Grid */}
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading surveys...</p>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first survey</p>
            <button
              onClick={onCreateSurvey}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Survey
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSurveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onEdit={() => onEditSurvey(survey)}
                onViewResponses={() => onViewResponses(survey)}
                onDelete={() => onDeleteSurvey(survey.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Survey Card Component
function SurveyCard({ survey, onEdit, onViewResponses, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {survey.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {survey.description || 'No description'}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Settings className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    onClick={() => { onEdit(); setShowMenu(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 mr-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => { onViewResponses(); setShowMenu(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <BarChart3 className="w-4 h-4 mr-3" />
                    View Responses
                  </button>
                  <button
                    onClick={() => { 
                      if (window.confirm('Are you sure you want to delete this survey?')) {
                        onDelete();
                      }
                      setShowMenu(false); 
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-1" />
            <span>0 responses</span>
          </div>
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${
            survey.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {survey.is_active ? 'Active' : 'Draft'}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          Created {new Date(survey.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

// Create Survey Component
function CreateSurvey({ onSurveyCreated, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_active: false,
    allow_multiple_responses: false,
    requires_login: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      await onSurveyCreated(formData);
    } catch (error) {
      console.error('Failed to create survey:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Create New Survey</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Survey Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter survey title..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this survey is about..."
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Activate survey immediately
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allow_multiple"
                checked={formData.allow_multiple_responses}
                onChange={(e) => setFormData({ ...formData, allow_multiple_responses: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allow_multiple" className="ml-2 block text-sm text-gray-700">
                Allow multiple responses from same user
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requires_login"
                checked={formData.requires_login}
                onChange={(e) => setFormData({ ...formData, requires_login: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requires_login" className="ml-2 block text-sm text-gray-700">
                Require login to respond
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? 'Creating...' : 'Create Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Survey Builder Component
function SurveyBuilder({ survey, onBack, onSurveyUpdated }) {
  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const loadSurveyData = useCallback(async () => {
    if (!survey?.id) return;
    
    try {
      const result = await api.getSurvey(survey.id);
      if (result.success) {
        setSurveyData(result.data);
        setQuestions(result.data.questions || []);
      }
    } catch (error) {
      console.error('Failed to load survey:', error);
    } finally {
      setLoading(false);
    }
  }, [survey?.id]);

  useEffect(() => {
    loadSurveyData();
  }, [loadSurveyData]);

  const handleAddQuestion = async (questionData) => {
    try {
      const result = await api.createQuestion({
        ...questionData,
        survey_id: survey.id,
        order_index: questions.length
      });
      if (result.success) {
        await loadSurveyData();
        setShowAddQuestion(false);
      }
    } catch (error) {
      console.error('Failed to add question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await api.deleteQuestion(questionId);
      await loadSurveyData();
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-500">Loading survey...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{surveyData?.title}</h1>
            <p className="text-sm text-gray-500">{surveyData?.description}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddQuestion(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-4xl mb-4">❓</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
            <p className="text-gray-500 mb-4">Start building your survey by adding questions</p>
            <button
              onClick={() => setShowAddQuestion(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Question
            </button>
          </div>
        ) : (
          questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              onDelete={() => handleDeleteQuestion(question.id)}
            />
          ))
        )}
      </div>

      {/* Add Question Modal */}
      {showAddQuestion && (
        <AddQuestionModal
          onAdd={handleAddQuestion}
          onClose={() => setShowAddQuestion(false)}
        />
      )}
    </div>
  );
}

// Question Card Component
function QuestionCard({ question, index, onDelete }) {
  const questionType = QUESTION_TYPES.find(type => type.value === question.question_type);

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">{questionType?.icon}</span>
              <span className="text-sm font-medium text-gray-500">
                Question {index + 1} • {questionType?.label}
              </span>
              {question.is_required && (
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Required
                </span>
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {question.question_text}
            </h3>
            
            {/* Show options for choice-based questions */}
            {question.options && question.options.length > 0 && (
              <div className="space-y-2">
                {question.options.map((option, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">
                      {question.question_type === 'radio' ? '○' : '☐'}
                    </span>
                    {option.text}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => onDelete()}
              className="p-2 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Question Modal Component
function AddQuestionModal({ onAdd, onClose }) {
  const [questionData, setQuestionData] = useState({
    question_text: '',
    question_type: 'text',
    is_required: false,
    options: []
  });
  const [newOption, setNewOption] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!questionData.question_text.trim()) return;
    
    onAdd(questionData);
  };

  const addOption = () => {
    if (newOption.trim()) {
      setQuestionData({
        ...questionData,
        options: [...questionData.options, { text: newOption.trim(), value: newOption.trim() }]
      });
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    setQuestionData({
      ...questionData,
      options: questionData.options.filter((_, i) => i !== index)
    });
  };

  const needsOptions = ['radio', 'checkbox', 'dropdown'].includes(questionData.question_type);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Add Question</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type
            </label>
            <select
              value={questionData.question_type}
              onChange={(e) => setQuestionData({ ...questionData, question_type: e.target.value, options: [] })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {QUESTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={questionData.question_text}
              onChange={(e) => setQuestionData({ ...questionData, question_text: e.target.value })}
              placeholder="Enter your question..."
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {questionData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...questionData.options];
                        newOptions[index] = { ...option, text: e.target.value, value: e.target.value };
                        setQuestionData({ ...questionData, options: newOptions });
                      }}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_required"
              checked={questionData.is_required}
              onChange={(e) => setQuestionData({ ...questionData, is_required: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_required" className="ml-2 block text-sm text-gray-700">
              Required question
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={!questionData.question_text.trim() || (needsOptions && questionData.options.length === 0)}
            >
              Add Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Responses View Component
function ResponsesView({ survey, onBack }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadResponses = useCallback(async () => {
    if (!survey?.id) return;
    
    try {
      const result = await api.getSurveyResponses(survey.id);
      if (result.success) {
        setResponses(result.data);
      }
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoading(false);
    }
  }, [survey?.id]);

  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-500">Loading responses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Survey Responses</h1>
            <p className="text-sm text-gray-500">{survey.title}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{responses.length}</div>
          <div className="text-sm text-gray-500">Total Responses</div>
        </div>
      </div>

      {/* Responses List */}
      {responses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
          <p className="text-gray-500">Responses will appear here once people start taking your survey</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Respondent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Answers
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {responses.map((response) => (
                <tr key={response.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {response.respondent_name || response.respondent_email || 'Anonymous'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      response.is_complete 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {response.is_complete ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(response.started_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {response.completed_at ? new Date(response.completed_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {response.answer_count} answers
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Take Survey Component
function TakeSurvey({ survey, onComplete }) {
  const [surveyData, setSurveyData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responseId, setResponseId] = useState(null);

  const loadSurveyAndStart = useCallback(async () => {
    if (!survey?.id) return;
    
    try {
      // Load survey data
      const surveyResult = await api.getSurvey(survey.id);
      if (surveyResult.success) {
        setSurveyData(surveyResult.data);
        
        // Start response
        const responseResult = await api.startResponse({
          survey_id: survey.id,
          respondent_email: null // Anonymous for now
        });
        if (responseResult.success) {
          setResponseId(responseResult.data.id);
        }
      }
    } catch (error) {
      console.error('Failed to load survey:', error);
    } finally {
      setLoading(false);
    }
  }, [survey?.id]);

  useEffect(() => {
    loadSurveyAndStart();
  }, [loadSurveyAndStart]);

  const handleAnswer = (questionId, value, selectedOptions = null) => {
    setAnswers({
      ...answers,
      [questionId]: {
        question_id: questionId,
        answer_text: typeof value === 'string' ? value : null,
        answer_value: value,
        selected_options: selectedOptions
      }
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < surveyData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!responseId) return;
    
    setSubmitting(true);
    try {
      const answerArray = Object.values(answers);
      await api.submitResponse(responseId, answerArray);
      onComplete();
    } catch (error) {
      console.error('Failed to submit survey:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-500">Loading survey...</p>
      </div>
    );
  }

  if (!surveyData || !surveyData.questions.length) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">❓</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Survey not available</h3>
        <p className="text-gray-500">This survey has no questions or is not active</p>
      </div>
    );
  }

  const currentQuestion = surveyData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === surveyData.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / surveyData.questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">{surveyData.title}</h1>
          {surveyData.description && (
            <p className="mt-1 text-sm text-gray-600">{surveyData.description}</p>
          )}
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Question {currentQuestionIndex + 1} of {surveyData.questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {currentQuestion.question_text}
              {currentQuestion.is_required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h2>
            
            <QuestionInput
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={(value, selectedOptions) => handleAnswer(currentQuestion.id, value, selectedOptions)}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Survey'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Question Input Component
function QuestionInput({ question, value, onChange }) {
  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const handleCheckboxChange = (optionValue, checked) => {
    const currentSelected = value?.selected_options || [];
    let newSelected;
    
    if (checked) {
      newSelected = [...currentSelected, optionValue];
    } else {
      newSelected = currentSelected.filter(v => v !== optionValue);
    }
    
    onChange(newSelected.join(', '), newSelected);
  };

  switch (question.question_type) {
    case 'text':
    case 'email':
      return (
        <input
          type={question.question_type}
          value={value?.answer_value || ''}
          onChange={handleInputChange}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter your answer..."
        />
      );
    
    case 'number':
      return (
        <input
          type="number"
          value={value?.answer_value || ''}
          onChange={handleInputChange}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter a number..."
        />
      );
    
    case 'date':
      return (
        <input
          type="date"
          value={value?.answer_value || ''}
          onChange={handleInputChange}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      );
    
    case 'textarea':
      return (
        <textarea
          value={value?.answer_value || ''}
          onChange={handleInputChange}
          rows={4}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter your answer..."
        />
      );
    
    case 'radio':
      return (
        <div className="space-y-3">
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                type="radio"
                id={`${question.id}_${index}`}
                name={`question_${question.id}`}
                value={option.value}
                checked={value?.answer_value === option.value}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor={`${question.id}_${index}`} className="ml-3 block text-sm text-gray-700">
                {option.text}
              </label>
            </div>
          ))}
        </div>
      );
    
    case 'checkbox':
      return (
        <div className="space-y-3">
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                type="checkbox"
                id={`${question.id}_${index}`}
                checked={value?.selected_options?.includes(option.value) || false}
                onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`${question.id}_${index}`} className="ml-3 block text-sm text-gray-700">
                {option.text}
              </label>
            </div>
          ))}
        </div>
      );
    
    case 'dropdown':
      return (
        <select
          value={value?.answer_value || ''}
          onChange={handleInputChange}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select an option...</option>
          {question.options?.map((option, index) => (
            <option key={index} value={option.value}>
              {option.text}
            </option>
          ))}
        </select>
      );
    
    case 'rating':
      const maxRating = question.validation_rules?.max_value || 5;
      return (
        <div className="flex items-center space-x-2">
          {[...Array(maxRating)].map((_, index) => {
            const rating = index + 1;
            return (
              <button
                key={index}
                type="button"
                onClick={() => onChange(rating)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  (value?.answer_value || 0) >= rating
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 text-gray-400 hover:border-gray-400'
                }`}
              >
                {rating}
              </button>
            );
          })}
          <span className="ml-4 text-sm text-gray-500">
            {value?.answer_value ? `${value.answer_value}/${maxRating}` : 'Not rated'}
          </span>
        </div>
      );
    
    case 'scale':
      const maxScale = question.validation_rules?.max_value || 10;
      const minScale = question.validation_rules?.min_value || 1;
      return (
        <div className="space-y-4">
          <input
            type="range"
            min={minScale}
            max={maxScale}
            value={value?.answer_value || minScale}
            onChange={handleInputChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{minScale}</span>
            <span className="font-medium text-blue-600">
              {value?.answer_value || minScale}
            </span>
            <span>{maxScale}</span>
          </div>
        </div>
      );
    
    default:
      return (
        <input
          type="text"
          value={value?.answer_value || ''}
          onChange={handleInputChange}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter your answer..."
        />
      );
  }
}

export default App;