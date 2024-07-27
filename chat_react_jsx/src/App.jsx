import React, { useState, useEffect, useRef } from 'react';
import LogIn from './components/LogIn';

const API_BASE_URL = "http://localhost:8000";
const AI_API_URL = `${API_BASE_URL}/suggest`;

function App() {
  // create state variables using the useState hook
  const [messages, setMessages] = useState([]); // messages: an array to store chat messages
  // const [username, setUsername] = useState('guest');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState(''); // message: the current message being typed
  const [connected, setConnected] = useState(false); // connected: a boolean indicating if the app is connected to the server
  const [showNamePrompt, setShowNamePrompt] = useState(true);

  const messagesEndRef = useRef(null); // creates a ref to be used for automatic scrolling to the latest message

  // This effect runs once when the component mounts
  useEffect(() => {
    subscribe(`${API_BASE_URL}/events`);
  }, []);

  // This effect runs whenever the messages array changes, scrolling to the bottom of the message list.
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function addMessage(username, message, messageId) {
    setMessages(prevMessages => {
      if (!prevMessages.some(msg => msg.id === messageId)) {
        return [...prevMessages, { id: messageId, username, message }];
      }
      return prevMessages;
    });
  }

  function subscribe(uri) {
    let retryTime = 1;

    function connect(uri) {
      const events = new EventSource(uri);

      events.addEventListener("message", (ev) => {
        const msg = JSON.parse(ev.data);
        if (!("message" in msg) || !("username" in msg)) return;
        addMessage(msg.username, msg.message, msg.id);
      });

      events.addEventListener("open", () => {
        setConnected(true);
        console.log(`Connected to event stream at ${uri}`);
        retryTime = 1;
      });

      events.addEventListener("error", () => {
        setConnected(false);
        events.close();

        let timeout = retryTime;
        retryTime = Math.min(64, retryTime * 2);
        console.log(`Connection lost. Attempting to reconnect in ${timeout}s`);
        setTimeout(() => connect(uri), timeout * 1000);
      });
    }

    connect(uri);
  }

  // function handleNewMessage(e) {
  //   e.preventDefault();
  //   if (!message || !username) return;
  
  //   if (connected) {
  //     fetch(`${API_BASE_URL}/message`, {
  //       method: "POST",
  //       body: new URLSearchParams({ room: "main", username, message }),
  //     }).then((response) => {
  //       if (response.ok) setMessage('');
  //     });
  //   }
  // }
  function handleNewMessage(e) {
    e.preventDefault();
    if (!message || !username) return;
  
    if (connected) {
      fetch(`${API_BASE_URL}/message`, {
        method: "POST",
        body: new URLSearchParams({ room: "main", username, message }),
      }).then((response) => {
        if (response.ok) setMessage('');
      });
    }
  }
  
  function handleLogin(name) {
    setUsername(name);
    setShowNamePrompt(false);
  }

  // WIP...
  const handleSuggestMessage = async () => {
    const lastMessage = messages.filter(msg => msg.username !== username).slice(-1)[0];
    if (!lastMessage) return;

    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ room: "main", username, message: lastMessage.message })
    });

    if (response.ok) {
      const suggestion = await response.text();
      console.log(suggestion);
      setMessage(suggestion);
    }
  };

  function hashColor(str) {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    return `hsl(${hash % 360}, 100%, 70%)`;
  }

//   /**
//    * This section defines the component's UI:

//     A container div with flex layout
//     A scrollable area for displaying messages
//     A form for inputting new messages
//     A thin bar at the bottom indicating connection status */
//   

return (
  <div className="flex flex-col h-screen bg-sky-10">
     <LogIn 
        vis={showNamePrompt}
        name={username}
        setName={handleLogin}
      />
    <div className="flex-grow overflow-auto p-4">
      {messages.map((msg, index) => (
        <div key={index} className="mb-2">
          <span className="font-bold" style={{ color: hashColor(msg.username) }}>
            {msg.username}:
          </span>
          {' '}
          <span>{msg.message}</span>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
    <form onSubmit={handleNewMessage} className="p-4 bg-stone-200">
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow p-2 rounded"
          autoFocus
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Send</button>
        <button type="button" onClick={handleSuggestMessage} className="px-4 py-2 bg-green-500 text-white rounded">Suggest</button>
      </div>
    </form>
    <div className={`h-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
  </div>
);
}

export default App;

