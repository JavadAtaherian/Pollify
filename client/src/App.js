import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, BarChart3, Settings, Home, PlusCircle, Sliders, Link as LinkIcon } from 'lucide-react';

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
  ,

  // Conditions
  // Fetch all conditions for a given survey. Returns the API response
  // containing success flag and data array of condition objects.
  getConditions: (surveyId) => fetch(`${API_BASE}/conditions/survey/${surveyId}`).then(r => r.json()),
  // Create a new condition. Accepts an object containing survey_id,
  // source_question_id, target_question_id, condition_type, condition_operator
  // and condition_value. Returns the API response with the created condition.
  createCondition: (data) => fetch(`${API_BASE}/conditions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  // Delete an existing condition by its ID. Returns the API response.
  deleteCondition: (id) => fetch(`${API_BASE}/conditions/${id}`, {
    method: 'DELETE'
  }).then(r => r.json())
};

// -----------------------------------------------------------------------------
// Conditional logic helpers
//
// The backend already supports conditional logic on survey questions via
// `question_conditions`. Each condition defines a `source_question_id` (the
// question whose answer determines the condition), a `target_question_id`
// (the question to show/hide), a `condition_type` ("show_if" or "hide_if"), a
// `condition_operator` (e.g. "equals", "not_equals", etc.) and a
// `condition_value` to compare against. The server processes these
// conditions when computing survey visibility, but the original frontend
// ignored them. To support conditional logic in the client we replicate the
// evaluation functions from the backend here.

// Types of condition actions. `SHOW_IF` means the target question is only
// displayed when the condition evaluates to true. `HIDE_IF` means the target
// question is hidden when the condition evaluates to true. `SKIP_TO` is not
// currently implemented in the backend engine and thus treated as a no-op.
const CONDITION_TYPES = {
  SHOW_IF: 'show_if',
  HIDE_IF: 'hide_if',
  SKIP_TO: 'skip_to'
};

// Supported comparison operators. These mirror the operators defined in
// `server/src/utils/validation.js` so that conditions created via the API
// behave consistently in the browser.
const CONDITION_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  GREATER_EQUAL: 'greater_equal',
  LESS_EQUAL: 'less_equal',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty'
};

/**
 * Evaluate a single condition against an answer. The answer is an object with
 * `answer_value`, `answer_text` and `selected_options` (for checkbox
 * questions). This implementation mirrors the backend implementation in
 * `server/src/utils/conditionalLogic.js`.
 *
 * @param {Object} condition The condition to evaluate.
 * @param {Object} answer The answer object for the source question.
 * @returns {boolean} True if the condition is met, false otherwise.
 */
function evaluateCondition(condition, answer) {
  const { condition_operator, condition_value } = condition;
  const answerValue = answer?.answer_value ?? answer?.answer_text;
  const answerOptions = answer?.selected_options ?? [];

  switch (condition_operator) {
    case CONDITION_OPERATORS.EQUALS:
      return String(answerValue).toLowerCase() === String(condition_value).toLowerCase();
    case CONDITION_OPERATORS.NOT_EQUALS:
      return String(answerValue).toLowerCase() !== String(condition_value).toLowerCase();
    case CONDITION_OPERATORS.CONTAINS:
      if (Array.isArray(answerOptions) && answerOptions.length > 0) {
        return answerOptions.some(opt => String(opt).toLowerCase().includes(String(condition_value).toLowerCase()));
      }
      return String(answerValue).toLowerCase().includes(String(condition_value).toLowerCase());
    case CONDITION_OPERATORS.NOT_CONTAINS:
      if (Array.isArray(answerOptions) && answerOptions.length > 0) {
        return !answerOptions.some(opt => String(opt).toLowerCase().includes(String(condition_value).toLowerCase()));
      }
      return !String(answerValue).toLowerCase().includes(String(condition_value).toLowerCase());
    case CONDITION_OPERATORS.GREATER_THAN: {
      const numAnswer = Number(answerValue);
      const numCond = Number(condition_value);
      return !isNaN(numAnswer) && !isNaN(numCond) && numAnswer > numCond;
    }
    case CONDITION_OPERATORS.LESS_THAN: {
      const numAnswer = Number(answerValue);
      const numCond = Number(condition_value);
      return !isNaN(numAnswer) && !isNaN(numCond) && numAnswer < numCond;
    }
    case CONDITION_OPERATORS.GREATER_EQUAL: {
      const numAnswer = Number(answerValue);
      const numCond = Number(condition_value);
      return !isNaN(numAnswer) && !isNaN(numCond) && numAnswer >= numCond;
    }
    case CONDITION_OPERATORS.LESS_EQUAL: {
      const numAnswer = Number(answerValue);
      const numCond = Number(condition_value);
      return !isNaN(numAnswer) && !isNaN(numCond) && numAnswer <= numCond;
    }
    case CONDITION_OPERATORS.IS_EMPTY:
      if (Array.isArray(answerOptions) && answerOptions.length > 0) {
        return answerOptions.length === 0;
      }
      return !answerValue || String(answerValue).trim() === '';
    case CONDITION_OPERATORS.IS_NOT_EMPTY:
      if (Array.isArray(answerOptions) && answerOptions.length > 0) {
        return answerOptions.length > 0;
      }
      return !!(answerValue && String(answerValue).trim() !== '');
    default:
      return false;
  }
}

/**
 * Given a list of questions, answers and conditions, determine which
 * questions should be visible. This mirrors the backend logic in
 * `ConditionalLogicEngine.processConditionalLogic`. Answers should be an array
 * of answer objects with a `question_id` property. Conditions should be an
 * array of condition objects.
 *
 * @param {Array} questions The full list of survey questions.
 * @param {Array} answers Array of answer objects keyed by question_id.
 * @param {Array} conditions Array of condition objects.
 * @returns {Array} A filtered array of questions that should be visible.
 */
function processConditionalLogic(questions, answers, conditions) {
  const answerMap = new Map();
  answers.forEach(ans => {
    // Ensure answer has question_id before mapping
    if (ans && typeof ans.question_id !== 'undefined') {
      answerMap.set(ans.question_id, ans);
    }
  });

  const visible = [];
  questions.forEach(question => {
    let shouldShow = true;
    // Find all conditions that target this question
    const relevant = conditions?.filter(c => c.target_question_id === question.id) || [];
    for (const condition of relevant) {
      const sourceAnswer = answerMap.get(condition.source_question_id);
      if (sourceAnswer) {
        const conditionMet = evaluateCondition(condition, sourceAnswer);
        if (condition.condition_type === CONDITION_TYPES.SHOW_IF) {
          shouldShow = shouldShow && conditionMet;
        } else if (condition.condition_type === CONDITION_TYPES.HIDE_IF) {
          shouldShow = shouldShow && !conditionMet;
        }
      } else {
        // If there is no answer to the source question and the condition is SHOW_IF,
        // the target should be hidden until the answer exists.
        if (condition.condition_type === CONDITION_TYPES.SHOW_IF) {
          shouldShow = false;
        }
      }
    }
    if (shouldShow) {
      visible.push(question);
    }
  });
  return visible;
}

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

  // Determine if the app is being accessed via a public survey URL.
  const [isPublic, setIsPublic] = useState(false);

  // Check the URL on mount to see if we should display a public survey view.
  useEffect(() => {
    const match = window.location.pathname.match(/^\/survey\/(\d+)/);
    if (match) {
      const id = Number(match[1]);
      setIsPublic(true);
      setSelectedSurvey({ id });
      setCurrentView('take');
    }
  }, []);

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
            onComplete={() => {
              if (isPublic) {
                setCurrentView('publicComplete');
              } else {
                setCurrentView('dashboard');
              }
            }}
          />
        );
      case 'publicComplete':
        return (
          <div className="max-w-2xl mx-auto text-center py-20">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Thank you!</h1>
            <p className="text-gray-600">Your response has been recorded.</p>
          </div>
        );
      default:
        return <Dashboard surveys={surveys} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation: hidden in public survey mode */}
      {!isPublic && (
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
      )}
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
    <div className="bg-white shadow rounded-lg hover:shadow-md transition-shadow relative overflow-visible">
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
              /*
                The context menu drops down from the gear icon. In some
                scenarios the menu would be clipped by ancestor elements with
                overflow settings, making the last option inaccessible. To
                ensure it can be fully scrolled into view we apply a max
                height and enable scrolling. A high z-index keeps it above
                other content.
              */
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 max-h-60 overflow-y-auto">
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
                      const url = `${window.location.origin}/survey/${survey.id}`;
                      navigator.clipboard.writeText(url).then(() => {
                        alert('Survey link copied to clipboard');
                      });
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LinkIcon className="w-4 h-4 mr-3" />
                    Copy Link
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

  // State for conditional logic modal
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [conditionQuestion, setConditionQuestion] = useState(null);

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

  // Handler invoked when the user wants to manage conditions for a specific question
  const handleManageConditions = (question) => {
    setConditionQuestion(question);
    setConditionModalOpen(true);
  };

  // Callback passed to the condition modal when conditions have been added or removed.
  // It reloads the survey data to reflect the latest conditions and closes the modal.
  const handleConditionsUpdated = async () => {
    await loadSurveyData();
    setConditionModalOpen(false);
    setConditionQuestion(null);
  };

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

      {/* Survey level settings */}
      {surveyData && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-2">Survey Settings</h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-3 sm:space-y-0">
            {/* Require login toggle */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!surveyData.requires_login}
                onChange={async (e) => {
                  const newValue = e.target.checked;
                  try {
                    const result = await api.updateSurvey(survey.id, { requires_login: newValue });
                    if (result.success) {
                      setSurveyData(result.data);
                      // Inform parent that survey has been updated so list refreshes
                      onSurveyUpdated && onSurveyUpdated();
                    }
                  } catch (error) {
                    console.error('Failed to update requires_login:', error);
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Require login to respond</span>
            </label>
            {/* Allow multiple responses toggle */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!surveyData.allow_multiple_responses}
                onChange={async (e) => {
                  const newValue = e.target.checked;
                  try {
                    const result = await api.updateSurvey(survey.id, { allow_multiple_responses: newValue });
                    if (result.success) {
                      setSurveyData(result.data);
                      onSurveyUpdated && onSurveyUpdated();
                    }
                  } catch (error) {
                    console.error('Failed to update allow_multiple_responses:', error);
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Allow multiple responses per user</span>
            </label>
          </div>
        </div>
      )}

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
          questions.map((question, index) => {
            // Determine if this question has any conditions targeting it
            const questionConditions = surveyData?.conditions?.filter(c => c.target_question_id === question.id) || [];
            return (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                onDelete={() => handleDeleteQuestion(question.id)}
                conditionsForQuestion={questionConditions}
                onManageConditions={() => handleManageConditions(question)}
              />
            );
          })
        )}
      </div>

      {/* Add Question Modal */}
      {showAddQuestion && (
        <AddQuestionModal
          onAdd={handleAddQuestion}
          onClose={() => setShowAddQuestion(false)}
        />
      )}

      {/* Conditional Logic Modal */}
      {conditionModalOpen && conditionQuestion && (
        <ConditionModal
          surveyId={survey.id}
          question={conditionQuestion}
          questions={questions}
          conditions={surveyData?.conditions?.filter(c => c.target_question_id === conditionQuestion.id) || []}
          onClose={() => {
            setConditionModalOpen(false);
            setConditionQuestion(null);
          }}
          onConditionsUpdated={handleConditionsUpdated}
        />
      )}
    </div>
  );
}

// Question Card Component
// Displays an individual question in the survey builder. If conditional logic
// exists for this question (conditionsForQuestion.length > 0) a small
// indicator is shown. A button allows opening a modal to add or edit
// conditions via the onManageConditions callback.
function QuestionCard({ question, index, onDelete, conditionsForQuestion = [], onManageConditions }) {
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
              {/* Show indicator if this question has conditional logic applied */}
              {conditionsForQuestion && conditionsForQuestion.length > 0 && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Conditional
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
            {/* Button to manage conditional logic for this question */}
            <button
              onClick={() => onManageConditions()}
              className="p-2 text-gray-400 hover:text-blue-600"
            >
              <Sliders className="w-4 h-4" />
            </button>
            {/* Delete question */}
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

// Condition Modal Component
// Allows users to add and manage conditional logic rules for a specific question.
function ConditionModal({ surveyId, question, questions, conditions, onClose, onConditionsUpdated }) {
  const [sourceQuestionId, setSourceQuestionId] = useState('');
  const [conditionType, setConditionType] = useState(CONDITION_TYPES.SHOW_IF);
  const [conditionOperator, setConditionOperator] = useState(CONDITION_OPERATORS.EQUALS);
  const [conditionValue, setConditionValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Determine whether the currently selected operator requires a comparison value.
  const requiresValue = ![
    CONDITION_OPERATORS.IS_EMPTY,
    CONDITION_OPERATORS.IS_NOT_EMPTY
  ].includes(conditionOperator);

  // Only allow selecting questions that appear before the target question to avoid circular dependencies
  const orderedQuestions = questions.slice().sort((a, b) => a.order_index - b.order_index);
  const targetIndex = orderedQuestions.findIndex(q => q.id === question.id);
  const possibleSources = orderedQuestions.filter((q, idx) => idx < targetIndex);

  const handleAddCondition = async (e) => {
    e.preventDefault();
    // Determine if a value is required based on the selected operator
    const requiresValue = ![
      CONDITION_OPERATORS.IS_EMPTY,
      CONDITION_OPERATORS.IS_NOT_EMPTY
    ].includes(conditionOperator);
    // Validate required fields
    if (!sourceQuestionId || (requiresValue && !conditionValue)) return;
    setSubmitting(true);
    try {
      // For operators that do not require a value, send a placeholder so the
      // server-side validation passes. The backend ignores this value when
      // evaluating IS_EMPTY and IS_NOT_EMPTY.
      const valueToSend = requiresValue ? conditionValue : (conditionValue || '__n/a__');
      const result = await api.createCondition({
        survey_id: surveyId,
        source_question_id: Number(sourceQuestionId),
        target_question_id: question.id,
        condition_type: conditionType,
        condition_operator: conditionOperator,
        condition_value: valueToSend
      });
      if (result.success) {
        setSourceQuestionId('');
        setConditionType(CONDITION_TYPES.SHOW_IF);
        setConditionOperator(CONDITION_OPERATORS.EQUALS);
        setConditionValue('');
        await onConditionsUpdated();
      } else {
        console.error('Failed to create condition');
      }
    } catch (error) {
      console.error('Error creating condition:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCondition = async (conditionId) => {
    try {
      await api.deleteCondition(conditionId);
      await onConditionsUpdated();
    } catch (error) {
      console.error('Error deleting condition:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Conditional Logic for Question
        </h3>

        {/* Existing conditions list */}
        {conditions && conditions.length > 0 && (
          <div className="mb-6 space-y-2">
            {conditions.map((cond) => {
              const sourceQ = questions.find(q => q.id === cond.source_question_id);
              return (
                <div key={cond.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <div className="text-sm text-gray-700">
                    {cond.condition_type === CONDITION_TYPES.SHOW_IF ? 'Show' : cond.condition_type === CONDITION_TYPES.HIDE_IF ? 'Hide' : 'Skip'} if
                    {' '}
                    <span className="font-medium">{sourceQ?.question_text || 'Q' + cond.source_question_id}</span>
                    {' '}
                    {cond.condition_operator.replace(/_/g, ' ')}
                    {' '}
                    <span className="font-medium">"{cond.condition_value}"</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCondition(cond.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Form to add new condition */}
        <form onSubmit={handleAddCondition} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Question
            </label>
            <select
              value={sourceQuestionId}
              onChange={(e) => setSourceQuestionId(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a question...</option>
              {possibleSources.map(q => (
                <option key={q.id} value={q.id}>
                  {q.question_text.length > 30 ? q.question_text.slice(0, 30) + '...' : q.question_text}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition Type
              </label>
              <select
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {Object.values(CONDITION_TYPES)
                  .filter(t => t !== CONDITION_TYPES.SKIP_TO)
                  .map(t => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator
              </label>
              <select
                value={conditionOperator}
                onChange={(e) => setConditionOperator(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {Object.values(CONDITION_OPERATORS).map(op => (
                  <option key={op} value={op}>
                    {op.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {requiresValue && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value
              </label>
              <input
                type="text"
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter value to compare..."
              />
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting || !sourceQuestionId || (requiresValue && !conditionValue)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Condition'}
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
  // Index in the list of currently visible questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Map of answers keyed by question ID. Each value contains the answer object
  // with properties: question_id, answer_text, answer_value and selected_options.
  const [answers, setAnswers] = useState({});
  // Computed list of questions that should be visible based on the current
  // answers and defined conditions. When no conditions are provided, this will
  // mirror `surveyData.questions`.
  const [visibleQuestions, setVisibleQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responseId, setResponseId] = useState(null);

  // Email and login management for surveys that require login
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [responseStarted, setResponseStarted] = useState(false);

  const loadSurveyAndStart = useCallback(async () => {
    if (!survey?.id) return;
    
    try {
      // Load survey data
      const surveyResult = await api.getSurvey(survey.id);
      if (surveyResult.success) {
        setSurveyData(surveyResult.data);
        // If the survey does not require login, start the response immediately
        if (!surveyResult.data.requires_login) {
          const responseResult = await api.startResponse({
            survey_id: survey.id,
            respondent_email: null
          });
          if (responseResult.success) {
            setResponseId(responseResult.data.id);
            setResponseStarted(true);
          } else {
            // If the server rejects, show error in console
            console.error('Failed to start survey response');
          }
        } else {
          // Requires login: wait for user to enter email
          setResponseStarted(false);
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

  // Recompute visible questions whenever the survey data or answers change.
  useEffect(() => {
    if (!surveyData) return;
    const answerArray = Object.values(answers);
    // Use the backend-like engine to determine which questions to show
    const vis = processConditionalLogic(
      surveyData.questions || [],
      answerArray,
      surveyData.conditions || []
    );
    setVisibleQuestions(vis);
    // Adjust current index if it falls outside of the newly computed list
    setCurrentQuestionIndex(prevIndex => {
      if (vis.length === 0) return 0;
      if (prevIndex >= vis.length) return vis.length - 1;
      if (prevIndex < 0) return 0;
      return prevIndex;
    });
  }, [surveyData, answers]);

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
    if (currentQuestionIndex < visibleQuestions.length - 1) {
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

  // If the survey requires login and the response has not been started yet,
  // prompt the user for their email address before beginning the survey.
  if (surveyData && surveyData.requires_login && !responseStarted) {
    return (
      <div className="max-w-md mx-auto bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Start Survey</h2>
        <p className="text-sm text-gray-600 mb-4">This survey requires an email address to participate.</p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="you@example.com"
          />
          {emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={async () => {
              // Basic email validation
              setEmailError('');
              const emailPattern = /.+@.+\..+/;
              if (!emailPattern.test(email)) {
                setEmailError('Please enter a valid email');
                return;
              }
              setEmailSubmitting(true);
              try {
                const responseResult = await api.startResponse({
                  survey_id: survey.id,
                  respondent_email: email
                });
                if (responseResult.success) {
                  setResponseId(responseResult.data.id);
                  setResponseStarted(true);
                } else {
                  setEmailError(responseResult.error || 'Unable to start the survey');
                }
              } catch (error) {
                setEmailError('An error occurred. Please try again later.');
              } finally {
                setEmailSubmitting(false);
              }
            }}
            disabled={emailSubmitting || !email}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {emailSubmitting ? 'Starting...' : 'Start Survey'}
          </button>
        </div>
      </div>
    );
  }

  // If there are no survey data or no visible questions, show a message.
  if (!surveyData || visibleQuestions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">❓</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Survey not available</h3>
        <p className="text-gray-500">This survey has no questions available to display</p>
      </div>
    );
  }

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100;

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
              <span>Question {currentQuestionIndex + 1} of {visibleQuestions.length}</span>
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