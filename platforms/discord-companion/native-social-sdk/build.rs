use std::{env, path::PathBuf};

fn main() {
    let manifest = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("manifest dir"));
    let sdk = env::var_os("AURORA_DISCORD_SDK_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| manifest.join("..").join("vendor").join("discord_social_sdk"));
    let lib = sdk.join("lib").join("release");
    let dll = sdk.join("bin").join("release").join("discord_partner_sdk.dll");
    if !lib.join("discord_partner_sdk.lib").is_file() || !dll.is_file() {
        panic!("Discord Social SDK ausente. Execute npm run sdk:install no diretório do Companion.");
    }
    println!("cargo:rustc-link-search=native={}", lib.display());
    println!("cargo:rustc-link-lib=dylib=discord_partner_sdk");
    println!("cargo:rerun-if-env-changed=AURORA_DISCORD_SDK_DIR");
}
