Prototype Rust Chat Application

To run LOCALLY: **cargo shuttle run**

To deploy on SHUTTLE:
1. Create a shuttle account: https://www.shuttle.rs/
2. Add project to shuttle: **cargo shuttle project start**
   (make sure the name of the project is unique. Here I used 'chat-rocket-dab')
3. Deploy project: **cargo shuttle deploy --allow-dirty**
   (**--allow-dirty** allows deploying with uncommitted git changes)

Disclaimer: I had to comment out the tests.rs file for this to work. The main function no longer returns a Rocket instance but a Result instead.
