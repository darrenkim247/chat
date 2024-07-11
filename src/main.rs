#[macro_use]
extern crate rocket;
#[cfg(test)]
mod tests;

use rocket::fairing::AdHoc;
use rocket::fairing::{Fairing, Info, Kind};
use rocket::form::Form;
use rocket::http::ContentType;
use rocket::http::Header;
use rocket::http::Status;
use rocket::response::stream::{Event, EventStream};
use rocket::serde::{Deserialize, Serialize};
use rocket::tokio::select;
use rocket::tokio::sync::broadcast::{channel, error::RecvError, Sender};
use rocket::{Request, Response};
use rocket::{Shutdown, State};
use uuid::Uuid;

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
#[rocket::async_trait]
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
}

#[options("/<_..>")]
fn all_options() {
    /* Intentionally left empty */
}

// event stream is turned into HTTP response, retrieved from EventSource API on client side
#[get("/events")]
fn events(queue: &State<Sender<Message>>, mut end: Shutdown) -> EventStream![] {
    let mut rx = queue.subscribe();
    EventStream! {
        loop {
            let msg = select! {
                msg = rx.recv() => match msg {
                    Ok(mut msg) => {
                        // Ensure ID is present
                        if msg.id.is_none() {
                            msg.id = Some(Uuid::new_v4().to_string());
                        }
                        msg
                    },
                    Err(RecvError::Closed) => break,
                    Err(RecvError::Lagged(_)) => continue,
                },
                _ = &mut end => break,
            };
            yield Event::json(&msg).event("message");
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

// attach CORS and removed local hosting to frontend stored in static folder
pub async fn rocketeer() -> shuttle_rocket::ShuttleRocket {
    let rocket = rocket::build()
        .attach(CORS)
        .manage(channel::<Message>(1024).0)
        .mount("/", routes![post, events, all_options])
        .attach(AdHoc::on_response("SSE Headers", |_, res| {
            Box::pin(async move {
                if res.content_type() == Some(ContentType::EventStream) {
                    res.set_header(Header::new("Cache-Control", "no-cache"));
                    res.set_header(Header::new("Connection", "keep-alive"));
                }
            })
        }));
    Ok(rocket.into())
}

#[shuttle_runtime::main]
async fn shuttle_rocketeer() -> shuttle_rocket::ShuttleRocket {
    rocketeer().await
}
