#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::{
    fs,
    io::{BufRead, BufReader},
    path::Path,
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread,
};
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::io::{Read, Write};
use std::process::{ChildStdin, ChildStdout};
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::{AppHandle, Emitter, Manager, State};

static PTY_GEN: AtomicU64 = AtomicU64::new(0);

struct PtySession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
    child: Box<dyn portable_pty::Child + Send + Sync>,
}
struct PtyState(Mutex<Option<PtySession>>);

struct PyLs {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
}
struct PyState(Mutex<Option<PyLs>>);

fn start_py(app: &AppHandle) -> Result<PyLs, String> {
    let dir = app
        .path()
        .resolve("pyls", tauri::path::BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;
    let script = dir.join("jedi_server.py");
    if !script.exists() {
        return Err(format!("missing {}", script.display()));
    }
    let mut child = Command::new("python3")
        .arg(&script)
        .env("PYTHONDONTWRITEBYTECODE", "1")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("python3 not available: {}", e))?;
    let stdin = child.stdin.take().ok_or("no stdin")?;
    let stdout = BufReader::new(child.stdout.take().ok_or("no stdout")?);
    Ok(PyLs { child, stdin, stdout })
}

#[tauri::command]
async fn py_ls(app: AppHandle, state: State<'_, PyState>, request: String) -> Result<String, String> {
    let mut guard = state.0.lock().unwrap();
    if guard.is_none() {
        *guard = Some(start_py(&app)?);
    }
    let ls = guard.as_mut().unwrap();
    let res: Result<String, String> = (|| {
        writeln!(ls.stdin, "{}", request).map_err(|e| e.to_string())?;
        ls.stdin.flush().map_err(|e| e.to_string())?;
        let mut line = String::new();
        let n = ls.stdout.read_line(&mut line).map_err(|e| e.to_string())?;
        if n == 0 {
            return Err("python server closed".to_string());
        }
        Ok(line)
    })();
    if res.is_err() {
        if let Some(mut l) = guard.take() {
            let _ = l.child.kill();
        }
    }
    res
}

#[derive(Serialize, Clone)]
struct PtyExit {
    gen: u64,
}

#[tauri::command]
fn pty_open(app: AppHandle, state: State<PtyState>, cwd: String, cols: u16, rows: u16) -> Result<u64, String> {
    let mut guard = state.0.lock().unwrap();
    if let Some(mut old) = guard.take() {
        let _ = old.child.kill();
    }
    let pair = native_pty_system()
        .openpty(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| e.to_string())?;
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "bash".into());
    let mut cmd = CommandBuilder::new(shell);
    cmd.env("TERM", "xterm-256color");
    if !cwd.is_empty() && Path::new(&cwd).is_dir() {
        cmd.cwd(cwd);
    } else if let Ok(h) = std::env::var("HOME") {
        cmd.cwd(h);
    }
    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    drop(pair.slave);
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    let gen = PTY_GEN.fetch_add(1, Ordering::SeqCst) + 1;
    let app2 = app.clone();
    thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let _ = app2.emit("pty-data", String::from_utf8_lossy(&buf[..n]).to_string());
                }
            }
        }
        let _ = app2.emit("pty-exit", PtyExit { gen });
    });
    *guard = Some(PtySession { writer, master: pair.master, child });
    Ok(gen)
}

#[tauri::command]
fn pty_write(state: State<PtyState>, data: String) {
    if let Some(s) = state.0.lock().unwrap().as_mut() {
        let _ = s.writer.write_all(data.as_bytes());
        let _ = s.writer.flush();
    }
}

#[tauri::command]
fn pty_resize(state: State<PtyState>, cols: u16, rows: u16) {
    if let Some(s) = state.0.lock().unwrap().as_ref() {
        let _ = s.master.resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 });
    }
}

struct BotProc(Mutex<Option<Child>>);

#[derive(Serialize)]
struct Entry {
    name: String,
    path: String,
    is_dir: bool,
}

#[derive(Serialize, Clone)]
struct LogLine {
    text: String,
    is_err: bool,
}

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<Entry>, String> {
    let skip = [".cordium", ".git", "node_modules", "__pycache__", ".venv", "venv"];
    let mut items: Vec<Entry> = fs::read_dir(&path)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            if skip.contains(&name.as_str()) {
                return None;
            }
            let is_dir = e.path().is_dir();
            Some(Entry { name, path: e.path().to_string_lossy().to_string(), is_dir })
        })
        .collect();
    items.sort_by(|a, b| b.is_dir.cmp(&a.is_dir).then(a.name.to_lowercase().cmp(&b.name.to_lowercase())));
    Ok(items)
}

#[tauri::command]
fn startup_path() -> Option<String> {
    let arg = std::env::args().nth(1)?;
    let p = fs::canonicalize(&arg).ok()?;
    p.is_dir().then(|| p.to_string_lossy().to_string())
}

#[tauri::command]
fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[derive(Serialize)]
struct Hit {
    path: String,
    rel: String,
    line: usize,
    text: String,
}

fn walk_search(dir: &Path, root: &Path, q: &str, lq: &str, case: bool, out: &mut Vec<Hit>) {
    let skip = [".cordium", ".git", "node_modules", "__pycache__", ".venv", "venv", "target", "dist"];
    let Ok(rd) = fs::read_dir(dir) else { return };
    for e in rd.flatten() {
        if out.len() >= 500 {
            return;
        }
        let p = e.path();
        let name = e.file_name().to_string_lossy().to_string();
        if skip.contains(&name.as_str()) {
            continue;
        }
        if p.is_dir() {
            walk_search(&p, root, q, lq, case, out);
        } else if fs::metadata(&p).map(|m| m.len() < 1_000_000).unwrap_or(false) {
            if let Ok(txt) = fs::read_to_string(&p) {
                for (i, l) in txt.lines().enumerate() {
                    let hit = if case { l.contains(q) } else { l.to_lowercase().contains(lq) };
                    if hit {
                        let rel = p.strip_prefix(root).unwrap_or(&p).to_string_lossy().to_string();
                        out.push(Hit { path: p.to_string_lossy().to_string(), rel, line: i + 1, text: l.trim().chars().take(200).collect() });
                        if out.len() >= 500 {
                            return;
                        }
                    }
                }
            }
        }
    }
}

#[tauri::command]
async fn search_files(root: String, query: String, case_sensitive: bool) -> Result<Vec<Hit>, String> {
    let mut out = Vec::new();
    let lq = query.to_lowercase();
    walk_search(Path::new(&root), Path::new(&root), &query, &lq, case_sensitive, &mut out);
    Ok(out)
}

#[tauri::command]
fn rename_path(from: String, to: String) -> Result<(), String> {
    fs::rename(&from, &to).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_path(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    (if p.is_dir() { fs::remove_dir_all(p) } else { fs::remove_file(p) }).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, content).map_err(|e| e.to_string())
}

fn pump<R: std::io::Read + Send + 'static>(app: AppHandle, reader: R, is_err: bool) -> thread::JoinHandle<()> {
    thread::spawn(move || {
        for line in BufReader::new(reader).lines().map_while(Result::ok) {
            let _ = app.emit("bot-log", LogLine { text: line, is_err });
        }
    })
}

#[tauri::command]
fn run_bot(app: AppHandle, state: State<BotProc>, cwd: String, program: String, args: Vec<String>) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();
    if guard.is_some() {
        return Err("The bot is already running.".into());
    }
    let mut child = Command::new(&program)
        .args(&args)
        .current_dir(&cwd)
        .env("PYTHONUNBUFFERED", "1")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start {}: {}", program, e))?;
    let out = child.stdout.take().unwrap();
    let err = child.stderr.take().unwrap();
    *guard = Some(child);

    let h1 = pump(app.clone(), out, false);
    let h2 = pump(app.clone(), err, true);
    let app2 = app.clone();
    thread::spawn(move || {
        let _ = h1.join();
        let _ = h2.join();
        let proc = app2.state::<BotProc>();
        if let Some(mut c) = proc.0.lock().unwrap().take() {
            let _ = c.wait();
        }
        let _ = app2.emit("bot-exit", ());
    });
    Ok(())
}

#[derive(Serialize)]
struct RunOutput {
    stdout: String,
    stderr: String,
    code: i32,
}

#[tauri::command]
async fn run_once(cwd: String, program: String, args: Vec<String>) -> Result<RunOutput, String> {
    let out = Command::new(&program)
        .args(&args)
        .current_dir(&cwd)
        .env("PYTHONUNBUFFERED", "1")
        .output()
        .map_err(|e| format!("Failed to start {}: {}", program, e))?;
    Ok(RunOutput {
        stdout: String::from_utf8_lossy(&out.stdout).to_string(),
        stderr: String::from_utf8_lossy(&out.stderr).to_string(),
        code: out.status.code().unwrap_or(-1),
    })
}

#[tauri::command]
fn stop_bot(state: State<BotProc>) {
    if let Some(child) = state.0.lock().unwrap().as_mut() {
        let _ = child.kill();
    }
}

fn main() {
    // WebKitGTK can fail to open a window on some GPU drivers; these defaults avoid that.
    if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }
    if std::env::var_os("CORDIUM_SAFE_MODE").is_some() {
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
        std::env::set_var("GDK_BACKEND", "x11");
    }
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(BotProc(Mutex::new(None)))
        .manage(PtyState(Mutex::new(None)))
        .manage(PyState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![list_dir, py_ls, pty_open, pty_write, pty_resize, startup_path, search_files, path_exists, rename_path, delete_path, create_dir, read_file, write_file, run_bot, run_once, stop_bot])
        .run(tauri::generate_context!())
        .expect("error while running Cordium");
}
