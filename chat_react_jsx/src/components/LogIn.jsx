import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';

const Login = ({ vis, setName, createUser }) => {
  const [username, setUsername] = useState('');

  function handleCallbackResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    var userObject = jwtDecode(response.credential);
    console.log(userObject);
    createUser(userObject)
    setName(userObject.given_name);
  }

  useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      client_id: "1064643738082-uk6qcqkom3fh3ranfutp5d1orncipo4f.apps.googleusercontent.com",
      callback: handleCallbackResponse
    })

    google.accounts.id.renderButton(
      document.getElementById("signInDiv"),
      { theme: "outline", size: "large"}
    )
  }, [])

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
            <div className='flex gap-4 flex-col items-center'>
              <p className='text-lg lg:text-2xl'>Welcome to RustY!</p>
              <div className="App">
                <div id="signInDiv"></div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Login;
