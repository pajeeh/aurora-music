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
struct DiscordString { ptr: *mut u8, size: usize }

type UpdateCallback = unsafe extern "C" fn(*mut DiscordClientResult, *mut c_void);
type FreeCallback = unsafe extern "C" fn(*mut c_void);

#[link(name = "discord_partner_sdk")]
unsafe extern "C" {
    fn Discord_RunCallbacks();
    fn Discord_Client_Init(client: *mut DiscordClient);
    fn Discord_Client_Drop(client: *mut DiscordClient);
    fn Discord_Client_SetApplicationId(client: *mut DiscordClient, application_id: u64);
    fn Discord_Client_ClearRichPresence(client: *mut DiscordClient);
    fn Discord_Client_UpdateRichPresence(client: *mut DiscordClient, activity: *mut DiscordActivity, callback: Option<UpdateCallback>, free_callback: Option<FreeCallback>, user_data: *mut c_void);
    fn Discord_ClientResult_Successful(result: *mut DiscordClientResult) -> bool;
    fn Discord_ClientResult_Drop(result: *mut DiscordClientResult);
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
    Exit,
}

fn discord_string(value: &str) -> DiscordString {
    DiscordString { ptr: value.as_ptr() as *mut u8, size: value.len() }
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
    println!(r#"{{"event":"ready","transport":"social-sdk","activityType":"listening"}}"#);

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
                Command::Exit => running = false,
            }
        }
        unsafe { Discord_RunCallbacks() };
        thread::sleep(Duration::from_millis(100));
    }
    unsafe { Discord_Client_ClearRichPresence(&mut client) };
    unsafe { Discord_Client_Drop(&mut client) };
}
