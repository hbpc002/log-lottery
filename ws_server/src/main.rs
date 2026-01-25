use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, Responder, post, web};
use serde::{Serialize, Deserialize};
use std::collections::{HashMap, HashSet};
use std::sync::Mutex;
use tokio::sync::broadcast;

#[derive(Serialize)]
struct ApiResponse<T> {
    code: i32,
    success: bool,
    msg: String,
    data: Option<T>,
}

impl<T> ApiResponse<T> {
    fn ok_with_data(data: T, msg: String) -> Self {
        ApiResponse { code: 200, success: true, msg, data: Some(data) }
    }
    fn ok_without_data(msg: String) -> Self {
        ApiResponse { code: 200, success: true, msg, data: None }
    }
    fn error(code: i32, msg: String) -> Self {
        ApiResponse { code, success: false, msg, data: None }
    }
}

struct AppState {
    // 广播通道集合，按签名区分
    tx_map: Mutex<HashMap<String, broadcast::Sender<String>>>,
    // 已注册手机号集合，用于简单去重
    phones: Mutex<HashSet<String>>,
}

#[derive(Deserialize, Debug)]
struct PersonSubmission {
    name: String,
    phone: String,
}

#[post("/api/user-msg")]
async fn user_msg() -> impl Responder {
    HttpResponse::Ok().json(ApiResponse::<()>::ok_without_data("发送成功".to_string()))
}

#[post("/api/submit-person")]
async fn submit_person(sub: web::Json<PersonSubmission>, data: web::Data<AppState>) -> impl Responder {
    let payload = &sub.0;
    // 基础校验
    if payload.name.trim().is_empty() {
        return HttpResponse::BadRequest().json(ApiResponse::<()>::error(400, "请填写姓名".to_string()));
    }
    let phone = payload.phone.trim();
    if phone.is_empty() || phone.len() != 11 || !phone.chars().all(|c| c.is_ascii_digit()) {
        return HttpResponse::BadRequest().json(ApiResponse::<()>::error(400, "手机号格式不正确".to_string()));
    }
    // 去重 by phone
    {
        let mut phones = data.phones.lock().unwrap();
        if phones.contains(phone) {
            return HttpResponse::Conflict().json(ApiResponse::<()>::error(409, "手机号已参与抽奖".to_string()));
        }
        phones.insert(phone.to_string());
    }
    // 广播给所有已建立的通道(如果存在)
    let message = format!("{{\"type\":\"new_person\",\"name\":\"{}\",\"phone\":\"{}\"}}", payload.name, payload.phone);
    // 遍历并发送到所有已建立的通道
    if let Ok(mut map) = data.tx_map.lock() {
        for tx in map.values_mut() {
            let _ = tx.send(message.clone());
        }
    }
    println!("报名已接收并广播: {} / {}", payload.name, payload.phone);
    HttpResponse::Ok().json(ApiResponse::<()>::ok_without_data("Submitted".to_string()))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    let app_state = web::Data::new(AppState { tx_map: Mutex::new(HashMap::new()), phones: Mutex::new(HashSet::new()) });
    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .wrap(Cors::default()
                .allow_any_origin()
                .allow_any_method()
                .allow_any_header()
                .supports_credentials()
            )
            .service(user_msg)
            .service(submit_person)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
