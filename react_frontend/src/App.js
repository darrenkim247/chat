import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || ''; // can create a .env file to store the URL
const API_BASE_URL = "http://localhost:8000"; // backend on local server

function App() {
  const [state, setState] = useState({
    room: "lobby",
    rooms: {},
    connected: false,
  });

  const [newRoom, setNewRoom] = useState('');
  const [username, setUsername] = useState('guest');
  const [message, setMessage] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [state.rooms[state.room]]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function init() {
    addRoom("lobby");
    addRoom("rocket");
    changeRoom("lobby");
    addMessage("lobby", "Rocket", "Hey! Open another browser tab, send a message.", true);
    addMessage("rocket", "Rocket", "This is another room. Neat, huh?", true);
    subscribe(`${API_BASE_URL}/events`);
  }

  function addRoom(name) {
    if (state.rooms[name]) {
      changeRoom(name);
      return false;
    }

    setState(prevState => ({
      ...prevState,
      rooms: {
        ...prevState.rooms,
        [name]: []
      }
    }));

    changeRoom(name);
    return true;
  }

  function changeRoom(name) {
    if (state.room === name) return;
    setState(prevState => ({ ...prevState, room: name }));
  }

  // checks msg ID prior to posting to avoid duplicated msgs
  function addMessage(room, username, message, messageId) {
    setState(prevState => {
        const updatedRooms = { ...prevState.rooms };
        // Check if the message already exists
        if (!updatedRooms[room]?.some(msg => msg.id === messageId)) {
            updatedRooms[room] = [...(updatedRooms[room] || []), { id: messageId, username, message }];
        }
        return { ...prevState, rooms: updatedRooms };
    });
  }
 
  function setConnectedStatus(status) {
    setState(prevState => ({ ...prevState, connected: status }));
  }

  function subscribe(uri) {
    let retryTime = 1;

    function connect(uri) {
      const events = new EventSource(uri);

      events.addEventListener("message", (ev) => {
        const msg = JSON.parse(ev.data);
        if (!("message" in msg) || !("room" in msg) || !("username" in msg)) return;
        addMessage(msg.room, msg.username, msg.message, msg.id);
      });

      events.addEventListener("open", () => {
        setConnectedStatus(true);
        console.log(`connected to event stream at ${uri}`);
        retryTime = 1;
      });

      events.addEventListener("error", () => {
        setConnectedStatus(false);
        events.close();

        let timeout = retryTime;
        retryTime = Math.min(64, retryTime * 2);
        console.log(`connection lost. attempting to reconnect in ${timeout}s`);
        setTimeout(() => connect(uri), timeout * 1000);
      });
    }

    connect(uri);
  }

  function handleNewMessage(e) {
    e.preventDefault();
    if (!message || !username) return;
  
    if (state.connected) {
      fetch(`${API_BASE_URL}/message`, {
        method: "POST",
        body: new URLSearchParams({ room: state.room, username, message }),
      }).then((response) => {
        if (response.ok) setMessage('');
        // Don't add the message to the state here. It will be added when received from the server.
      });
    }
  }

  function handleNewRoom(e) {
    e.preventDefault();
    if (!newRoom) return;

    if (addRoom(newRoom)) {
      addMessage(newRoom, "Rocket", `Look, your own "${newRoom}" room! Nice.`, true);
    }
    setNewRoom('');
  }

  function hashColor(str) {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    return `hsl(${hash % 360}, 100%, 70%)`;
  }

  return (
    <main>
      <div id="sidebar">
        <div id="status" className={state.connected ? "connected" : "reconnecting"}></div>
        <div id="room-list">
          {Object.keys(state.rooms).map(room => (
            <button
              key={room}
              className={`room ${state.room === room ? 'active' : ''}`}
              onClick={() => changeRoom(room)}
            >
              {room}
            </button>
          ))}
        </div>
        <form id="new-room" onSubmit={handleNewRoom}>
          <input
            type="text"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="new room..."
            maxLength="29"
          />
          <button type="submit">+</button>
        </form>
      </div>
      <div id="content">
        <div id="messages">
          {state.rooms[state.room]?.map((msg, index) => (
            <div key={index} className="message">
              <span className="username" style={{ color: hashColor(msg.username) }}>{msg.username}</span>
              <span className="text">{msg.message}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form id="new-message" onSubmit={handleNewMessage}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="guest"
            maxLength="19"
          />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send a message..."
            autoFocus
          />
          <button type="submit" id="send">Send</button>
        </form>
      </div>
    </main>
  );
}

export default App;
