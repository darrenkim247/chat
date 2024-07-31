#[macro_use]
extern crate rocket;
#[cfg(test)]
mod tests;

use std::collections::HashMap;

//use rocket::fairing::AdHoc;
//use rocket::fairing::{Fairing, Info, Kind};
use rocket::form::Form;
use rocket::fs::{relative, FileServer};
//use rocket::http::hyper::request;
//use rocket::http::ContentType;
//use rocket::http::Header;
use rocket::http::Status;
use rocket::response::stream::{Event, EventStream};
use rocket::serde::{Deserialize, Serialize};
use rocket::tokio::select;
use rocket::tokio::sync::broadcast::{channel, error::RecvError, Sender};
use rocket::tokio::task::spawn;
//use rocket::{Request, Response};
use rocket::{Shutdown, State};
use uuid::Uuid;

use dotenv::dotenv;
use llm_chain::{executor, parameters, prompt};
use std::error::Error;

/* Additional imports for authentication */
use rocket::response::status::Custom;
use rocket::serde::json::Json;
mod claims;
use claims::Claims;

#[derive(Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Serialize)]
struct LoginResponse {
    token: String,
}

/// Tries to authenticate a user. Successful authentications get a JWT
#[post("/login", data = "<login>")]
fn login(login: Json<LoginRequest>) -> Result<Json<LoginResponse>, Custom<String>> {
    // Hardcode users' database
    let mut users_db: HashMap<String, String> = HashMap::new();
    users_db.insert("nguyea".to_string(), "nguyen".to_string());
    users_db.insert("brandyc".to_string(), "cao".to_string());
    users_db.insert("darrenki".to_string(), "kim".to_string());

    let username = login.username.clone();
    let password = login.password.clone();

    if !users_db.contains_key(&username) {
        return Err(Custom(
            Status::Unauthorized,
            "account was not found".to_string(),
        ));
    }

    match users_db.get(&username) {
        Some(v) if v != &password => {
            return Err(Custom(
                Status::Unauthorized,
                "account was not found".to_string(),
            ));
        }
        Some(_) => {
            let claim = Claims::from_name(&login.username);
            let response = LoginResponse {
                token: claim.into_token()?,
            };

            Ok(Json(response))
        }
        None => {
            return Err(Custom(
                Status::Unauthorized,
                "account was not found".to_string(),
            ));
        }
    }
}

// struct modified to include ID to solve duplicating message issue
#[derive(Debug, Clone, FromForm, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, UriDisplayQuery))]
#[serde(crate = "rocket::serde")]
struct Message {
    #[serde(skip_deserializing)]
    pub id: Option<String>,
    #[field(validate = len(..30))]
    pub room: String,
    #[field(validate = len(..20))]
    pub username: String,
    pub message: String,
}

/** CORS (Cross-Origin Resource Sharing) implementation
 *  enables port to port communication */
pub struct CORS;

// A Fairing in Rocket is a type that can modify requests or responses.
/*#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response,
        }
    }

    // This asynchronous method is called for each response
    // These headers configure a very permissive CORS policy (less secure),
    // allowing any origin to access the resource with various methods and including credentials.
    async fn on_response<'r>(&self, _request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new(
            "Access-Control-Allow-Methods",
            "POST, GET, OPTIONS",
        ));
        response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}*/

// #[options("/<_..>")]
// fn all_options() {
//     /* Intentionally left empty */
// }

// // event stream is turned into HTTP response, retrieved from EventSource API on client side
// #[get("/events")]
// fn events(queue: &State<Sender<Message>>, mut end: Shutdown) -> EventStream![] {
//     let mut rx = queue.subscribe();
//     dotenv().ok();

//     EventStream! {
//         loop {
//             let msg = select! {
//                 msg = rx.recv() => match msg {
//                     Ok(mut msg) => {
//                         if msg.id.is_none() {
//                             msg.id = Some(Uuid::new_v4().to_string());
//                         }
//                         msg
//                     },
//                     Err(RecvError::Closed) => break,
//                     Err(RecvError::Lagged(_)) => continue,
//                 },
//                 _ = &mut end => break,
//             };

//             // Clone msg for AI processing
//             let ai_msg = msg.clone();

//             // Spawn a Tokio task to handle AI processing asynchronously
//             let ai_task = spawn(async move {
//                 let exec = match executor!() {
//                     Ok(ex) => ex,
//                     Err(e) => {
//                         eprintln!("Error creating executor: {:?}", e);
//                         return None;
//                     }
//                 };

//                 let res = prompt!(
//                     "You are a robot assistant helping me draft socially appropriate responses to text messages. Respond to this message",
//                     &ai_msg.message
//                 )
//                 .run(&parameters!(), &exec)
//                 .await;

//                 match res {
//                     Ok(result) => {
//                         Some(Message {
//                             id: Some(Uuid::new_v4().to_string()),
//                             room: ai_msg.room,
//                             username: String::from("Assistant"),
//                             message: result.to_string(),
//                         })
//                     },
//                     Err(e) => {
//                         eprintln!("Error running prompt: {:?}", e);
//                         None
//                     }
//                 }
//             });

//             // Await the AI task and handle the result
//             match ai_task.await {
//                 Ok(Some(ai_msg)) => {
//                     yield Event::json(&msg).event("message");
//                     yield Event::json(&ai_msg).event("message");
//                 },
//                 Ok(None) => {
//                     eprintln!("AI message generation failed");
//                     continue;
//                 },
//                 Err(e) => {
//                     eprintln!("Error awaiting AI task: {:?}", e);
//                     continue;
//                 }
//             }
//         }
//     }
// }

/// Returns an infinite stream of server-sent events. Each event is a message
/// pulled from a broadcast queue sent by the `post` handler.
/// add Claims to require authentication
#[get("/events")]
async fn events(queue: &State<Sender<Message>>, mut end: Shutdown) -> EventStream![] {
    let mut rx = queue.subscribe();
    EventStream! {
        loop {
            let msg = select! {
                msg = rx.recv() => match msg {
                    Ok(msg) => msg,
                    Err(RecvError::Closed) => break,
                    Err(RecvError::Lagged(_)) => continue,
                },
                _ = &mut end => break,
            };

            yield Event::json(&msg);
        }
    }
}

// when a msg is generated, an unique ID is linked with the msg
#[post("/message", data = "<form>")]
fn post(form: Form<Message>, queue: &State<Sender<Message>>) -> Status {
    let mut msg = form.into_inner();
    msg.id = Some(Uuid::new_v4().to_string());
    let _res = queue.send(msg);
    Status::Ok
}

#[post("/suggest", data = "<form>")]
async fn suggest(form: Form<Message>) -> Result<String, Status> {
    dotenv().ok();
    let ai_msg = form.into_inner();
    let exec = match executor!() {
        Ok(ex) => ex,
        Err(e) => {
            eprintln!("Error creating executor: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    let res = prompt!(
        "You are chatting with a friend. Please use a friendly tone (less of an assistant) to respond to this question: \"{}\"",
        &ai_msg.message
    )
    .run(&parameters!(), &exec)
    .await;

    match res {
        Ok(result) => Ok(result.to_string()),
        Err(e) => {
            eprintln!("Error running prompt: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}

// attach CORS and removed local hosting to frontend stored in static folder
pub async fn rocketeer() -> shuttle_rocket::ShuttleRocket {
    let rocket = rocket::build()
        /*.attach(CORS)*/
        .manage(channel::<Message>(1024).0)
        .mount("/", routes![login, post, events, suggest])
        // .mount("/", FileServer::from(relative!("static_archive")))
        .mount("/", FileServer::from(relative!("chat_react_jsx/dist")))
        /*.attach(AdHoc::on_response("SSE Headers", |_, res| {
            Box::pin(async move {
                if res.content_type() == Some(ContentType::EventStream) {
                    res.set_header(Header::new("Cache-Control", "no-cache"));
                    res.set_header(Header::new("Connection", "keep-alive"));
                }
            })
        }))*/;
    Ok(rocket.into())
}

#[shuttle_runtime::main]
async fn shuttle_rocketeer() -> shuttle_rocket::ShuttleRocket {
    rocketeer().await
}
