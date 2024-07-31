import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LogIn = ({ vis, setName }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submitCredentials = async (e) => {
    e.preventDefault();
    if (username === "" && password == "") {
      return;
    }

    // fetch the login route and post username and password to authenticate user
    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      console.log('Login successful', data); // Handle the successful response
      setName(username);  // Update the username in App and hide the prompt
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <AnimatePresence>
      {vis && (
        <motion.div 
          className='z-40 transition-all flex flex-col justify-center items-center h-screen w-screen absolute backdrop-blur-xl'
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity:0}}
        >
          <motion.div 
            className='z-50 w-4/5 h-3/5 lg:w-2/5 lg:h-2/5 bg-sky-500/50 flex flex-col justify-center items-center rounded-xl shadow-md'
            initial={{y:-500}}
            animate={{y:0}}
            exit={{y:-500}}
          >
            <form className='flex gap-4 flex-col items-center' onSubmit={submitCredentials}>
              <p className='text-lg lg:text-2xl'>Log in to RustY</p>
              <input 
                type="text" 
                className='px-5 py-2 rounded-xl required' 
                value={username} 
                placeholder='Username'
                onChange={(e) => setUsername(e.target.value)}
              />
              <div className='relative w-full'>
                <input 
                  type = {showPassword ? "text" : "password"} 
                  className='px-5 py-2 rounded-xl required' 
                  value={password} 
                  placeholder='Password'
                  onChange={(e) => setPassword(e.target.value)}
                />
                {password && (
                  <span
                    className="show-password"
                    value={showPassword}
                    onClick={() =>
                        setShowPassword((prev) => !prev)
                    }
                  > 
                  {showPassword ? 'Hide' : 'Show'}
                  </span>
                )}
              </div>
              <button 
                type="submit" 
                className='text-gray-100 bg-blue-500 px-5 py-2 rounded-xl active:translate-y-0.5 active:translate-x-0.5 hover:bg-green-500 transition-all'
              >
                Log in
              </button>
              <p class="text-center mt-2">
                      Don't have an account?&nbsp
                      <span class="text-purple-500">
                          Sign up
                      </span>
                  </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogIn;
