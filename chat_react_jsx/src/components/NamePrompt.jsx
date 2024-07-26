import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NamePrompt = ({ vis, setName }) => {
  const [localName, setLocalName] = useState('');

  const submitName = (e) => {
    e.preventDefault();
    if (localName === "") {
      return;
    }
    setName(localName);  // This will update the username in App and hide the prompt
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
            <form className='flex gap-4 flex-col items-center' onSubmit={submitName}>
              <p className='text-lg lg:text-2xl'>Hi there! What's your name?</p>
              <input 
                type="text" 
                className='px-5 py-2 rounded-xl required' 
                value={localName} 
                onChange={(e) => setLocalName(e.target.value)}
              />
              <button 
                type="submit" 
                className='text-gray-100 bg-blue-500 px-5 py-2 rounded-xl active:translate-y-0.5 active:translate-x-0.5 hover:bg-green-500 transition-all'
              >
                Submit
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NamePrompt;
