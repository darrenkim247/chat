Prototype Rust Chat Application

- Update Jul 10 (BC)
  Frontend is remade with REACT. All frontend material is moved into folder react_frontend. (I didn't change anything in static, the original frontend, but i disabled the mounting, so if you load the backend server, you won't see the chat window)
- Update 27 Jul 24 (AN)
  Authentication implemented. The username is "username", password is "password".
---

To run LOCALLY: 
1. **npm run build** in chat_react_jsx to build front end
2. **cargo shuttle run** in the main directory 

To deploy on SHUTTLE:
1. Install shuttle: https://docs.shuttle.rs/getting-started/installation
2. Create a shuttle account: https://www.shuttle.rs/
3. Add project to shuttle: **cargo shuttle project start**  
   (make sure the name of the project is unique. Here I used 'chat-rocket-dab')
4. Deploy project: **cargo shuttle deploy --allow-dirty**  
   (**--allow-dirty** allows deploying with uncommitted git changes)

Disclaimer: I had to comment out the tests.rs file for this to work. The main function no longer returns a Rocket instance but a Result instead.
