use serde::Deserialize;
use std::{
    ffi::c_void,
    io::{self, BufRead},
    ptr,
    sync::mpsc,
    thread,
    time::Duration,
};

#[repr(C)]
struct DiscordClient { opaque: *mut c_void }
#[repr(C)]
struct DiscordActivity { opaque: *mut c_void }
#[repr(C)]
struct DiscordActivityAssets { opaque: *mut c_void }
#[repr(C)]
struct DiscordActivityTimestamps { opaque: *mut c_void }
#[repr(C)]
struct DiscordActivityButton { opaque: *mut c_void }
#[repr(C)]
struct DiscordClientResult { opaque: *mut c_void }
#[repr(C)]
struct DiscordAuthorizationCodeChallenge { opaque: *mut c_void }
#[repr(C)]
struct DiscordAuthorizationCodeVerifier { opaque: *mut c_void }
#[repr(C)]
struct DiscordAuthorizationArgs { opaque: *mut c_void }
#[repr(C)]
struct DiscordString { ptr: *mut u8, size: usize }

type UpdateCallback = unsafe extern "C" fn(*mut DiscordClientResult, *mut c_void);
type FreeCallback = unsafe extern "C" fn(*mut c_void);
type AuthorizationCallback = unsafe extern "C" fn(*mut DiscordClientResult, DiscordString, DiscordString, *mut c_void);
type TokenCallback = unsafe extern "C" fn(*mut DiscordClientResult, DiscordString, DiscordString, i32, i32, DiscordString, *mut c_void);
type StatusCallback = unsafe extern "C" fn(i32, i32, i32, *mut c_void);

#[link(name = "discord_partner_sdk")]
unsafe extern "C" {
    fn Discord_RunCallbacks();
    fn Discord_Client_Init(client: *mut DiscordClient);
    fn Discord_Client_Drop(client: *mut DiscordClient);
    fn Discord_Client_SetApplicationId(client: *mut DiscordClient, application_id: u64);
    fn Discord_Client_GetDefaultPresenceScopes(value: *mut DiscordString);
    fn Discord_Client_CreateAuthorizationCodeVerifier(client: *mut DiscordClient, value: *mut DiscordAuthorizationCodeVerifier);
    fn Discord_Client_Authorize(client: *mut DiscordClient, args: *mut DiscordAuthorizationArgs, callback: Option<AuthorizationCallback>, free_callback: Option<FreeCallback>, user_data: *mut c_void);
    fn Discord_Client_GetToken(client: *mut DiscordClient, application_id: u64, code: DiscordString, verifier: DiscordString, redirect_uri: DiscordString, callback: Option<TokenCallback>, free_callback: Option<FreeCallback>, user_data: *mut c_void);
    fn Discord_Client_RefreshToken(client: *mut DiscordClient, application_id: u64, refresh_token: DiscordString, callback: Option<TokenCallback>, free_callback: Option<FreeCallback>, user_data: *mut c_void);
    fn Discord_Client_UpdateToken(client: *mut DiscordClient, token_type: i32, token: DiscordString, callback: Option<UpdateCallback>, free_callback: Option<FreeCallback>, user_data: *mut c_void);
    fn Discord_Client_Connect(client: *mut DiscordClient);
    fn Discord_Client_Disconnect(client: *mut DiscordClient);
    fn Discord_Client_SetStatusChangedCallback(client: *mut DiscordClient, callback: Option<StatusCallback>, free_callback: Option<FreeCallback>, user_data: *mut c_void);
    fn Discord_Client_ClearRichPresence(client: *mut DiscordClient);
    fn Discord_Client_UpdateRichPresence(client: *mut DiscordClient, activity: *mut DiscordActivity, callback: Option<UpdateCallback>, free_callback: Option<FreeCallback>, user_data: *mut c_void);
    fn Discord_ClientResult_Successful(result: *mut DiscordClientResult) -> bool;
    fn Discord_ClientResult_Drop(result: *mut DiscordClientResult);
    fn Discord_AuthorizationCodeVerifier_Drop(value: *mut DiscordAuthorizationCodeVerifier);
    fn Discord_AuthorizationCodeVerifier_Challenge(value: *mut DiscordAuthorizationCodeVerifier, result: *mut DiscordAuthorizationCodeChallenge);
    fn Discord_AuthorizationCodeVerifier_Verifier(value: *mut DiscordAuthorizationCodeVerifier, result: *mut DiscordString);
    fn Discord_AuthorizationCodeChallenge_Drop(value: *mut DiscordAuthorizationCodeChallenge);
    fn Discord_AuthorizationArgs_Init(value: *mut DiscordAuthorizationArgs);
    fn Discord_AuthorizationArgs_Drop(value: *mut DiscordAuthorizationArgs);
    fn Discord_AuthorizationArgs_SetClientId(value: *mut DiscordAuthorizationArgs, client_id: u64);
    fn Discord_AuthorizationArgs_SetScopes(value: *mut DiscordAuthorizationArgs, scopes: DiscordString);
    fn Discord_AuthorizationArgs_SetCodeChallenge(value: *mut DiscordAuthorizationArgs, challenge: *mut DiscordAuthorizationCodeChallenge);
    fn Discord_Activity_Init(activity: *mut DiscordActivity);
    fn Discord_Activity_Drop(activity: *mut DiscordActivity);
    fn Discord_Activity_SetName(activity: *mut DiscordActivity, value: DiscordString);
    fn Discord_Activity_SetType(activity: *mut DiscordActivity, value: i32);
    fn Discord_Activity_SetState(activity: *mut DiscordActivity, value: *mut DiscordString);
    fn Discord_Activity_SetDetails(activity: *mut DiscordActivity, value: *mut DiscordString);
    fn Discord_Activity_SetAssets(activity: *mut DiscordActivity, value: *mut DiscordActivityAssets);
    fn Discord_Activity_SetTimestamps(activity: *mut DiscordActivity, value: *mut DiscordActivityTimestamps);
    fn Discord_Activity_AddButton(activity: *mut DiscordActivity, button: *const DiscordActivityButton);
    fn Discord_ActivityAssets_Init(assets: *mut DiscordActivityAssets);
    fn Discord_ActivityAssets_Drop(assets: *mut DiscordActivityAssets);
    fn Discord_ActivityAssets_SetLargeImage(assets: *mut DiscordActivityAssets, value: *mut DiscordString);
    fn Discord_ActivityAssets_SetLargeText(assets: *mut DiscordActivityAssets, value: *mut DiscordString);
    fn Discord_ActivityTimestamps_Init(timestamps: *mut DiscordActivityTimestamps);
    fn Discord_ActivityTimestamps_Drop(timestamps: *mut DiscordActivityTimestamps);
    fn Discord_ActivityTimestamps_SetStart(timestamps: *mut DiscordActivityTimestamps, value: u64);
    fn Discord_ActivityTimestamps_SetEnd(timestamps: *mut DiscordActivityTimestamps, value: u64);
    fn Discord_ActivityButton_Init(button: *mut DiscordActivityButton);
    fn Discord_ActivityButton_Drop(button: *mut DiscordActivityButton);
    fn Discord_ActivityButton_SetLabel(button: *mut DiscordActivityButton, value: DiscordString);
    fn Discord_ActivityButton_SetUrl(button: *mut DiscordActivityButton, value: DiscordString);
}

#[derive(Deserialize)]
#[serde(tag = "command", rename_all = "lowercase")]
enum Command {
    Set { id: u64, title: String, artist: String, image: Option<String>, start: Option<u64>, end: Option<u64>, url: Option<String> },
    Clear { id: u64 },
    Authenticate { access_token: String },
    Authorize,
    Refresh { refresh_token: String },
    Exit,
}

fn discord_string(value: &str) -> DiscordString {
    DiscordString { ptr: value.as_ptr() as *mut u8, size: value.len() }
}

unsafe fn copy_string(value: DiscordString) -> String {
    if value.ptr.is_null() || value.size == 0 { return String::new(); }
    String::from_utf8_lossy(unsafe { std::slice::from_raw_parts(value.ptr, value.size) }).into_owned()
}

struct ClientContext { client: *mut DiscordClient, application_id: u64 }
struct AuthorizationContext { client: *mut DiscordClient, application_id: u64, verifier: String }

unsafe extern "C" fn free_client_context(user_data: *mut c_void) {
    if !user_data.is_null() { drop(unsafe { Box::from_raw(user_data as *mut ClientContext) }); }
}

unsafe extern "C" fn free_authorization_context(user_data: *mut c_void) {
    if !user_data.is_null() { drop(unsafe { Box::from_raw(user_data as *mut AuthorizationContext) }); }
}

unsafe extern "C" fn token_updated(result: *mut DiscordClientResult, user_data: *mut c_void) {
    let successful = unsafe { Discord_ClientResult_Successful(result) };
    let context = unsafe { &*(user_data as *mut ClientContext) };
    if successful {
        unsafe { Discord_Client_Connect(context.client) };
    } else {
        println!(r#"{{"event":"auth-error","stage":"update-token"}}"#);
    }
    unsafe { Discord_ClientResult_Drop(result) };
}

unsafe extern "C" fn token_received(result: *mut DiscordClientResult, access: DiscordString, refresh: DiscordString, _token_type: i32, expires_in: i32, scopes: DiscordString, user_data: *mut c_void) {
    let successful = unsafe { Discord_ClientResult_Successful(result) };
    let context = unsafe { &*(user_data as *mut ClientContext) };
    if !successful {
        println!(r#"{{"event":"auth-error","stage":"token-exchange"}}"#);
        unsafe { Discord_ClientResult_Drop(result) };
        return;
    }
    let access_token = unsafe { copy_string(access) };
    let refresh_token = unsafe { copy_string(refresh) };
    let scopes_value = unsafe { copy_string(scopes) };
    println!("{}", serde_json::json!({"event":"token","accessToken":access_token,"refreshToken":refresh_token,"expiresIn":expires_in,"scopes":scopes_value}));
    let update_context = Box::into_raw(Box::new(ClientContext { client: context.client, application_id: context.application_id })) as *mut c_void;
    unsafe { Discord_Client_UpdateToken(context.client, 1, discord_string(&access_token), Some(token_updated), Some(free_client_context), update_context) };
    unsafe { Discord_ClientResult_Drop(result) };
}

unsafe extern "C" fn authorized(result: *mut DiscordClientResult, code: DiscordString, redirect_uri: DiscordString, user_data: *mut c_void) {
    let successful = unsafe { Discord_ClientResult_Successful(result) };
    let context = unsafe { &*(user_data as *mut AuthorizationContext) };
    if successful {
        let code_value = unsafe { copy_string(code) };
        let redirect_value = unsafe { copy_string(redirect_uri) };
        let token_context = Box::into_raw(Box::new(ClientContext { client: context.client, application_id: context.application_id })) as *mut c_void;
        unsafe { Discord_Client_GetToken(context.client, context.application_id, discord_string(&code_value), discord_string(&context.verifier), discord_string(&redirect_value), Some(token_received), Some(free_client_context), token_context) };
    } else {
        println!(r#"{{"event":"auth-error","stage":"authorize"}}"#);
    }
    unsafe { Discord_ClientResult_Drop(result) };
}

unsafe extern "C" fn status_changed(status: i32, error: i32, detail: i32, _user_data: *mut c_void) {
    if status == 3 { println!(r#"{{"event":"connected","authenticated":true}}"#); }
    else { println!("{}", serde_json::json!({"event":"status","status":status,"error":error,"detail":detail})); }
}

unsafe fn authenticate(client: *mut DiscordClient, application_id: u64, access_token: &str) {
    let context = Box::into_raw(Box::new(ClientContext { client, application_id })) as *mut c_void;
    unsafe { Discord_Client_UpdateToken(client, 1, discord_string(access_token), Some(token_updated), Some(free_client_context), context) };
}

unsafe fn refresh(client: *mut DiscordClient, application_id: u64, refresh_token: &str) {
    let context = Box::into_raw(Box::new(ClientContext { client, application_id })) as *mut c_void;
    unsafe { Discord_Client_RefreshToken(client, application_id, discord_string(refresh_token), Some(token_received), Some(free_client_context), context) };
}

unsafe fn authorize(client: *mut DiscordClient, application_id: u64) {
    let mut verifier = DiscordAuthorizationCodeVerifier { opaque: ptr::null_mut() };
    unsafe { Discord_Client_CreateAuthorizationCodeVerifier(client, &mut verifier) };
    let mut challenge = DiscordAuthorizationCodeChallenge { opaque: ptr::null_mut() };
    unsafe { Discord_AuthorizationCodeVerifier_Challenge(&mut verifier, &mut challenge) };
    let mut verifier_text = DiscordString { ptr: ptr::null_mut(), size: 0 };
    unsafe { Discord_AuthorizationCodeVerifier_Verifier(&mut verifier, &mut verifier_text) };
    let verifier_value = unsafe { copy_string(verifier_text) };
    let mut scopes = DiscordString { ptr: ptr::null_mut(), size: 0 };
    unsafe { Discord_Client_GetDefaultPresenceScopes(&mut scopes) };
    let mut args = DiscordAuthorizationArgs { opaque: ptr::null_mut() };
    unsafe { Discord_AuthorizationArgs_Init(&mut args) };
    unsafe { Discord_AuthorizationArgs_SetClientId(&mut args, application_id) };
    unsafe { Discord_AuthorizationArgs_SetScopes(&mut args, scopes) };
    unsafe { Discord_AuthorizationArgs_SetCodeChallenge(&mut args, &mut challenge) };
    let context = Box::into_raw(Box::new(AuthorizationContext { client, application_id, verifier: verifier_value })) as *mut c_void;
    unsafe { Discord_Client_Authorize(client, &mut args, Some(authorized), Some(free_authorization_context), context) };
    unsafe { Discord_AuthorizationArgs_Drop(&mut args) };
    unsafe { Discord_AuthorizationCodeChallenge_Drop(&mut challenge) };
    unsafe { Discord_AuthorizationCodeVerifier_Drop(&mut verifier) };
}

unsafe extern "C" fn updated(result: *mut DiscordClientResult, user_data: *mut c_void) {
    let successful = unsafe { Discord_ClientResult_Successful(result) };
    let id = unsafe { *(user_data as *mut u64) };
    println!("{{\"event\":\"updated\",\"id\":{id},\"successful\":{successful}}}");
    unsafe { Discord_ClientResult_Drop(result) };
}

unsafe extern "C" fn free_request(user_data: *mut c_void) {
    if !user_data.is_null() { drop(unsafe { Box::from_raw(user_data as *mut u64) }); }
}

unsafe fn set_presence(client: *mut DiscordClient, id: u64, title: &str, artist: &str, image: Option<&str>, start: Option<u64>, end: Option<u64>, url: Option<&str>) {
    let mut activity = DiscordActivity { opaque: ptr::null_mut() };
    unsafe { Discord_Activity_Init(&mut activity) };
    unsafe { Discord_Activity_SetName(&mut activity, discord_string("Aurora Music")) };
    unsafe { Discord_Activity_SetType(&mut activity, 2) };
    let mut state = discord_string(artist);
    let mut details = discord_string(title);
    unsafe { Discord_Activity_SetState(&mut activity, &mut state) };
    unsafe { Discord_Activity_SetDetails(&mut activity, &mut details) };

    let mut assets = DiscordActivityAssets { opaque: ptr::null_mut() };
    unsafe { Discord_ActivityAssets_Init(&mut assets) };
    let image_value = image.unwrap_or("aurora");
    let mut large_image = discord_string(image_value);
    let mut large_text = discord_string("Aurora Music");
    unsafe { Discord_ActivityAssets_SetLargeImage(&mut assets, &mut large_image) };
    unsafe { Discord_ActivityAssets_SetLargeText(&mut assets, &mut large_text) };
    unsafe { Discord_Activity_SetAssets(&mut activity, &mut assets) };

    let mut timestamps = DiscordActivityTimestamps { opaque: ptr::null_mut() };
    if let (Some(start), Some(end)) = (start, end) {
        unsafe { Discord_ActivityTimestamps_Init(&mut timestamps) };
        unsafe { Discord_ActivityTimestamps_SetStart(&mut timestamps, start) };
        unsafe { Discord_ActivityTimestamps_SetEnd(&mut timestamps, end) };
        unsafe { Discord_Activity_SetTimestamps(&mut activity, &mut timestamps) };
    }

    let mut button = DiscordActivityButton { opaque: ptr::null_mut() };
    if let Some(url) = url {
        unsafe { Discord_ActivityButton_Init(&mut button) };
        unsafe { Discord_ActivityButton_SetLabel(&mut button, discord_string("Abrir o Aurora")) };
        unsafe { Discord_ActivityButton_SetUrl(&mut button, discord_string(url)) };
        unsafe { Discord_Activity_AddButton(&mut activity, &button) };
    }

    let request = Box::into_raw(Box::new(id)) as *mut c_void;
    unsafe { Discord_Client_UpdateRichPresence(client, &mut activity, Some(updated), Some(free_request), request) };
    if !button.opaque.is_null() { unsafe { Discord_ActivityButton_Drop(&mut button) }; }
    if !timestamps.opaque.is_null() { unsafe { Discord_ActivityTimestamps_Drop(&mut timestamps) }; }
    unsafe { Discord_ActivityAssets_Drop(&mut assets) };
    unsafe { Discord_Activity_Drop(&mut activity) };
}

fn main() {
    let application_id = std::env::args().nth(1).and_then(|value| value.parse::<u64>().ok()).unwrap_or(1_555_389_940_542_611_596);
    let mut client = DiscordClient { opaque: ptr::null_mut() };
    unsafe { Discord_Client_Init(&mut client) };
    unsafe { Discord_Client_SetApplicationId(&mut client, application_id) };
    unsafe { Discord_Client_SetStatusChangedCallback(&mut client, Some(status_changed), None, ptr::null_mut()) };
    println!(r#"{{"event":"ready","transport":"social-sdk","activityType":"listening","authenticated":false}}"#);

    let (sender, receiver) = mpsc::channel();
    thread::spawn(move || {
        for line in io::stdin().lock().lines().map_while(Result::ok) {
            match serde_json::from_str::<Command>(&line) {
                Ok(command) => { if sender.send(command).is_err() { break; } }
                Err(error) => eprintln!("Comando inválido: {error}"),
            }
        }
        let _ = sender.send(Command::Exit);
    });

    let mut running = true;
    while running {
        while let Ok(command) = receiver.try_recv() {
            match command {
                Command::Set { id, title, artist, image, start, end, url } => unsafe { set_presence(&mut client, id, &title, &artist, image.as_deref(), start, end, url.as_deref()) },
                Command::Clear { id } => { unsafe { Discord_Client_ClearRichPresence(&mut client) }; println!("{{\"event\":\"cleared\",\"id\":{id}}}"); },
                Command::Authenticate { access_token } => unsafe { authenticate(&mut client, application_id, &access_token) },
                Command::Authorize => unsafe { authorize(&mut client, application_id) },
                Command::Refresh { refresh_token } => unsafe { refresh(&mut client, application_id, &refresh_token) },
                Command::Exit => running = false,
            }
        }
        unsafe { Discord_RunCallbacks() };
        thread::sleep(Duration::from_millis(100));
    }
    unsafe { Discord_Client_ClearRichPresence(&mut client) };
    unsafe { Discord_Client_Disconnect(&mut client) };
    unsafe { Discord_Client_Drop(&mut client) };
}
