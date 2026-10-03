#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use std::{
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    sync::atomic::{AtomicBool, Ordering},
    time::{Duration, Instant},
};

static LOGIN_ACTIVE: AtomicBool = AtomicBool::new(false);
const AURORA_ORIGIN: &str = "https://pajeeh.github.io";

fn response(stream: &mut TcpStream, status: &str, body: &str) {
    let headers = format!(
        "HTTP/1.1 {status}\r\nAccess-Control-Allow-Origin: {AURORA_ORIGIN}\r\nAccess-Control-Allow-Methods: POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\nAccess-Control-Allow-Private-Network: true\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    );
    let _ = stream.write_all(headers.as_bytes());
    let _ = stream.write_all(body.as_bytes());
}

fn receive_credential(mut stream: TcpStream, nonce: &str) -> Option<String> {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
    let mut buffer = vec![0_u8; 32 * 1024];
    let size = stream.read(&mut buffer).ok()?;
    let request = String::from_utf8_lossy(&buffer[..size]);
    if request.starts_with("OPTIONS ") {
        response(&mut stream, "204 No Content", "");
        return None;
    }
    if !request.starts_with("POST /aurora-login ")
        || !request.contains(&format!("Origin: {AURORA_ORIGIN}\r\n"))
    {
        response(&mut stream, "403 Forbidden", "Origem recusada.");
        return None;
    }
    let body = request.split("\r\n\r\n").nth(1)?;
    let value: serde_json::Value = serde_json::from_str(body).ok()?;
    if value.get("nonce")?.as_str()? != nonce {
        response(&mut stream, "403 Forbidden", "Código recusado.");
        return None;
    }
    let credential = value.get("credential")?.as_str()?.to_owned();
    if credential.len() > 16_384 || credential.split('.').count() != 3 {
        response(&mut stream, "400 Bad Request", "Credencial inválida.");
        return None;
    }
    response(&mut stream, "200 OK", "Login concluído. Você já pode voltar ao Aurora.");
    Some(credential)
}

fn receive_youtube_grant(mut stream: TcpStream, nonce: &str) -> Option<serde_json::Value> {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
    let mut buffer = vec![0_u8; 32 * 1024];
    let size = stream.read(&mut buffer).ok()?;
    let request = String::from_utf8_lossy(&buffer[..size]);
    if request.starts_with("OPTIONS ") {
        response(&mut stream, "204 No Content", "");
        return None;
    }
    if !request.starts_with("POST /aurora-youtube ")
        || !request.contains(&format!("Origin: {AURORA_ORIGIN}\r\n"))
    {
        response(&mut stream, "403 Forbidden", "Origem recusada.");
        return None;
    }
    let value: serde_json::Value = serde_json::from_str(request.split("\r\n\r\n").nth(1)?).ok()?;
    if value.get("nonce")?.as_str()? != nonce {
        response(&mut stream, "403 Forbidden", "Código recusado.");
        return None;
    }
    let token = value.get("token")?.as_str()?;
    let expires_at = value.get("expiresAt")?.as_f64()?;
    if token.len() > 16_384 || token.len() < 20 || !expires_at.is_finite() {
        response(&mut stream, "400 Bad Request", "Autorização inválida.");
        return None;
    }
    response(&mut stream, "200 OK", "YouTube conectado. Você já pode voltar ao Aurora.");
    Some(serde_json::json!({"token": token, "expiresAt": expires_at}))
}

#[tauri::command]
fn start_google_login(window: tauri::WebviewWindow) -> Result<(), String> {
    if LOGIN_ACTIVE.swap(true, Ordering::SeqCst) {
        return Err("Uma janela de login já está aberta.".into());
    }
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|error| {
        LOGIN_ACTIVE.store(false, Ordering::SeqCst);
        format!("Não foi possível preparar o login: {error}")
    })?;
    listener.set_nonblocking(true).map_err(|error| {
        LOGIN_ACTIVE.store(false, Ordering::SeqCst);
        error.to_string()
    })?;
    let port = listener.local_addr().map_err(|error| error.to_string())?.port();
    let nonce = uuid::Uuid::new_v4().to_string();
    let url = format!("https://pajeeh.github.io/aurora-music/?desktop-login=1&port={port}&nonce={nonce}");
    if let Err(error) = open::that(&url) {
        LOGIN_ACTIVE.store(false, Ordering::SeqCst);
        return Err(format!("Não foi possível abrir o navegador: {error}"));
    }
    std::thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(180);
        while Instant::now() < deadline {
            match listener.accept() {
                Ok((stream, _)) => {
                    if let Some(credential) = receive_credential(stream, &nonce) {
                        if let Ok(detail) = serde_json::to_string(&credential) {
                            let _ = window.eval(&format!("window.dispatchEvent(new CustomEvent('aurora-google-credential',{{detail:{detail}}}))"));
                        }
                        break;
                    }
                }
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => std::thread::sleep(Duration::from_millis(100)),
                Err(_) => break,
            }
        }
        LOGIN_ACTIVE.store(false, Ordering::SeqCst);
    });
    Ok(())
}

#[tauri::command]
fn start_youtube_login(window: tauri::WebviewWindow) -> Result<(), String> {
    if LOGIN_ACTIVE.swap(true, Ordering::SeqCst) {
        return Err("Uma janela de autorização já está aberta.".into());
    }
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|error| {
        LOGIN_ACTIVE.store(false, Ordering::SeqCst);
        format!("Não foi possível preparar a autorização: {error}")
    })?;
    listener.set_nonblocking(true).map_err(|error| {
        LOGIN_ACTIVE.store(false, Ordering::SeqCst);
        error.to_string()
    })?;
    let port = listener.local_addr().map_err(|error| error.to_string())?.port();
    let nonce = uuid::Uuid::new_v4().to_string();
    let url = format!("https://pajeeh.github.io/aurora-music/?desktop-youtube=1&port={port}&nonce={nonce}");
    if let Err(error) = open::that(&url) {
        LOGIN_ACTIVE.store(false, Ordering::SeqCst);
        return Err(format!("Não foi possível abrir o navegador: {error}"));
    }
    std::thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(180);
        while Instant::now() < deadline {
            match listener.accept() {
                Ok((stream, _)) => {
                    if let Some(grant) = receive_youtube_grant(stream, &nonce) {
                        let _ = window.eval(&format!("window.dispatchEvent(new CustomEvent('aurora-youtube-grant',{{detail:{grant}}}))"));
                        break;
                    }
                }
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => std::thread::sleep(Duration::from_millis(100)),
                Err(_) => break,
            }
        }
        LOGIN_ACTIVE.store(false, Ordering::SeqCst);
    });
    Ok(())
}

fn show_main(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_google_login, start_youtube_login])
        .setup(|app| {
            let open = MenuItem::with_id(app, "open", "Abrir Aurora", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Sair do Aurora", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;

            TrayIconBuilder::with_id("aurora-tray")
                .icon(app.default_window_icon().expect("ícone do Aurora ausente").clone())
                .tooltip("Aurora Music")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => show_main(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("falha ao iniciar o Aurora Music");
}
