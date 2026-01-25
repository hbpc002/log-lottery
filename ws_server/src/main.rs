use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, Responder, post, get, web, Error, HttpRequest};
use actix_ws::Message as WsMsg;
use futures_util::StreamExt as _;
use serde::{Serialize, Deserialize};
use std::collections::HashSet;
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
    // 全局广播发送端
    tx: broadcast::Sender<String>,
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
    
    // 构造消息
    let message = format!("{{\"type\":\"new_person\",\"name\":\"{}\",\"phone\":\"{}\"}}", payload.name, payload.phone);
    
    // 广播消息
    // send 返回接收者数量，如果没有接收者会返回错误，这里忽略错误
    let _ = data.tx.send(message.clone());
    
    println!("报名已接收并广播: {} / {}", payload.name, payload.phone);
    HttpResponse::Ok().json(ApiResponse::<()>::ok_without_data("Submitted".to_string()))
}

#[get("/api/ws")]
async fn websocket(
    req: HttpRequest,
    stream: web::Payload,
    data: web::Data<AppState>,
) -> Result<HttpResponse, Error> {
    let (res, mut session, mut msg_stream) = actix_ws::handle(&req, stream)?;

    // 订阅广播
    let mut rx = data.tx.subscribe();
    
    // 启动异步任务处理广播消息 -> WebSocket
    let mut session_clone = session.clone();
    actix_web::rt::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            // 包装成前端期望的格式 (根据 useWebsocket.ts, 它期望 { type: 'WS_MESSAGE', payload: ... })
            // 但这里我们简单点，直接发字符串，前端解析即可。
            // 还是稍微包装一下吧，为了匹配前端 hooks 的行为
            // 前端 useWebsocket.ts:
            // case 'WS_MESSAGE':
            //    const receivedMsg = event.data.payload
            //
            // 看来 Service Worker 负责了解包。如果 SW 接收到的是字符串，怎么处理？
            // 看 SW 代码：
            // self.webSocketConnection.onmessage = (event) => {
            //     client.postMessage({ type: 'WS_MESSAGE', payload: JSON.parse(event.data) })
            // }
            // 所以我们发送 JSON 字符串即可。
            
            if session_clone.text(msg).await.is_err() {
                break;
            }
        }
    });

    // 处理 WebSocket 输入消息 (主要是为了保持连接，处理 Ping/Pong)
    actix_web::rt::spawn(async move {
        while let Some(Ok(msg)) = msg_stream.next().await {
            match msg {
                WsMsg::Ping(bytes) => {
                    if session.pong(&bytes).await.is_err() {
                        break;
                    }
                }
                WsMsg::Close(reason) => {
                    let _ = session.close(reason).await;
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(res)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    
    // 创建广播通道
    let (tx, _rx) = broadcast::channel(100);
    
    let app_state = web::Data::new(AppState { 
        tx, 
        phones: Mutex::new(HashSet::new()) 
    });
    
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
            .service(websocket)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
