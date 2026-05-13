import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import './App.css'

const socket = io('http://localhost:5001')

function App() {
  const [isLoginView, setIsLoginView] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [message, setMessage] = useState('')
  
  // Real-time Data
  const [todos, setTodos] = useState([])
  const [comments, setComments] = useState([])
  const [summary, setSummary] = useState('')
  const [newTodo, setNewTodo] = useState('')
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    socket.on('init_data', (data) => {
      setTodos(data.todos);
      setComments(data.comments);
      setSummary(data.summary);
    });

    socket.on('todo_added', (todo) => {
      setTodos(prev => [todo, ...prev]);
    });

    socket.on('comment_added', (data) => {
      setComments(prev => [data.comment, ...prev]);
      setSummary(data.summary);
    });

    return () => {
      socket.off('init_data');
      socket.off('todo_added');
      socket.off('comment_added');
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLoginView ? '/api/login' : '/api/signup';
    const response = await fetch(`http://localhost:5001${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      if (isLoginView) {
        setIsLoggedIn(true);
        localStorage.setItem('token', data.token);
      } else {
        setIsLoginView(true);
        setMessage('Account created! Please sign in.');
      }
    } else {
      setMessage(data.message);
    }
  };

  const addTodo = (e) => {
    e.preventDefault();
    if (!newTodo) return;
    socket.emit('add_todo', { text: newTodo, user: username });
    setNewTodo('');
  };

  const addComment = (e) => {
    e.preventDefault();
    if (!newComment) return;
    socket.emit('add_comment', { text: newComment, user: username });
    setNewComment('');
  };

  return (
    <div className="App full-app">
      {!isLoggedIn ? (
        <div className="auth-section">
          <h1>ArchScript Intelligence</h1>
          <div className="auth-card glass">
            <div className="tabs">
              <button className={isLoginView ? 'active' : ''} onClick={() => setIsLoginView(true)}>Login</button>
              <button className={!isLoginView ? 'active' : ''} onClick={() => setIsLoginView(false)}>Sign Up</button>
            </div>
            <form onSubmit={handleAuth}>
              <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit">{isLoginView ? 'Sign In' : 'Join Now'}</button>
            </form>
            {message && <p className="msg">{message}</p>}
          </div>
        </div>
      ) : (
        <div className="dashboard">
          <header className="dash-header glass">
            <h2>Welcome back, <span>{username}</span></h2>
            <button onClick={() => setIsLoggedIn(false)}>Logout</button>
          </header>

          <div className="main-content">
            {/* AI Todo Section */}
            <section className="todo-section glass">
              <h3><i className="fas fa-tasks"></i> Real-time AI Todos</h3>
              <form onSubmit={addTodo}>
                <input placeholder="Add a task... AI will classify it" value={newTodo} onChange={e => setNewTodo(e.target.value)} />
              </form>
              <div className="list">
                {todos.map(t => (
                  <div key={t.id} className="todo-item">
                    <span className="cat">{t.category}</span>
                    <span className="text">{t.text}</span>
                    <span className="user">by {t.user}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Guest Board Section */}
            <section className="board-section glass">
              <h3><i className="fas fa-comments"></i> AI Sentiment Board</h3>
              <div className="summary-banner">
                <i className="fas fa-magic"></i> {summary}
              </div>
              <form onSubmit={addComment}>
                <input placeholder="Share your thoughts..." value={newComment} onChange={e => setNewComment(e.target.value)} />
              </form>
              <div className="comments-list">
                {comments.map(c => (
                  <div key={c.id} className="comment">
                    <span className="mood">{c.mood}</span>
                    <div className="c-content">
                      <p>{c.text}</p>
                      <small>{c.user} • {c.time} • AI Score: {c.score}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
