import speech_recognition as sr
import webbrowser
import musicLibrary
from gtts import gTTS
from openai import OpenAI

import subprocess
import os
import json
from datetime import datetime
import urllib.parse
import random

from dotenv import load_dotenv  # ← ここでdotenvをimport

# .env を読み込む
load_dotenv()

# .env からキーを取り出す
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    # ここで止まったら .env or 環境設定の問題
    raise RuntimeError("OPENAI_API_KEY が読み込めていません。.env の場所と内容を確認してください。")

# OpenAI クライアントを作成
client = OpenAI(api_key=api_key)

recognizer = sr.Recognizer()

# ===== 音声出力（gTTS + pygame） =====

from openai import OpenAI
client = OpenAI()   # ← 自動で環境変数からAPIキーを読む


def speak(text: str):
    if not text:
        return

    tts = gTTS(text, lang="ja")
    temp_file = "temp_tilku.mp3"
    tts.save(temp_file)

    try:
        # macOS 標準の音声再生コマンド
        subprocess.run(["afplay", temp_file])
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)



# ===== GPT で自然な返事（雑談用） =====
def aiprocess(command: str) -> str:
    completion = client.chat.completions.create(
        model="gpt-4.1-mini",  # プランに合わせて変更可
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a virtual assistant named Tilku, "
                    "skilled in educational and general tasks."
                ),
            },
            {"role": "user", "content": command},
        ],
    )
    return completion.choices[0].message.content


# =========================
#  Intent 解析
# =========================
def analyze_command(command: str) -> dict:
    prompt = f"""
ユーザーの音声コマンドを、アシスタント用のJSONに変換してください。

必ずこの形式で返してください（出力はJSONのみ）:
{{
  "intent": "open_website" | "play_music" | "open_app" | "time" | "small_talk" | "unknown",
  "target": "対象(サイト名 / アプリ名 / 曲名など)",
  "extra": "追加情報や検索クエリなど"
}}

ユーザーのコマンド: "{command}"
"""

    completion = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "あなたは音声アシスタントの司令塔です。出力は必ずJSONのみです。"},
            {"role": "user", "content": prompt},
        ],
    )

    text = completion.choices[0].message.content.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = {"intent": "unknown", "target": "", "extra": text}

    return data


# =========================
#  各 Intent ごとの処理
# =========================

def handle_open_website(site: str, query: str = ""):
    s = (site or "").lower()

    if "google" in s:
        url = "https://www.google.com"
        if query:
            q = urllib.parse.quote(query)
            url = f"https://www.google.com/search?q={q}"
        webbrowser.open(url)
        speak("グーグルを開きます。")

    elif "youtube" in s:
        url = "https://www.youtube.com"
        if query:
            q = urllib.parse.quote(query)
            url = f"https://www.youtube.com/results?search_query={q}"
        webbrowser.open(url)
        speak("ユーチューブを開きます。")

    elif "facebook" in s:
        webbrowser.open("https://www.facebook.com")
        speak("フェイスブックを開きます。")

    elif "tiktok" in s or "ティックトック" in s:
        webbrowser.open("https://www.tiktok.com")
        speak("ティックトックを開きます。")

    else:
        webbrowser.open("https://www.google.com")
        speak("とりあえずグーグルを開きました。")


def handle_play_music(song_name: str):
    if not song_name:
        speak("曲の名前を言ってください。")
        return

    key = song_name.lower().strip()
    if key in musicLibrary.music:
        link = musicLibrary.music[key]
        speak(f"{song_name} を再生します。")
        webbrowser.open(link)
    else:
        speak(f"{song_name} は登録されていません。")


def handle_open_app(app_name: str):
    app_map = {
        "chrome": "Google Chrome",
        "google chrome": "Google Chrome",
        "safari": "Safari",
        "vscode": "Visual Studio Code",
        "visual studio code": "Visual Studio Code",
        "line": "LINE",
    }

    if not app_name:
        speak("アプリの名前を言ってください。")
        return

    key = app_name.lower()
    if key in app_map:
        real_name = app_map[key]
        subprocess.Popen(["open", "-a", real_name])
        speak(f"{real_name} を起動します。")
    else:
        speak(f"{app_name} というアプリはまだ登録していません。")


def handle_time():
    now = datetime.now()
    text = f"今は {now.hour} 時 {now.minute} 分です。"
    speak(text)


def speak_wake():
    replies = [
        "はい、聞いています。",
        "どうしましたか？",
        "はい、ご主人。",
        "何をしましょうか？",
    ]
    speak(random.choice(replies))


# =========================
#  コマンド全体を振り分ける
# =========================
def processcommand(c: str):
    print("[Raw command]:", c)

    analysis = analyze_command(c)
    intent = analysis.get("intent", "unknown")
    target = analysis.get("target", "")
    extra = analysis.get("extra", "")

    print("[Intent]", intent, "| target:", target, "| extra:", extra)

    if intent == "open_website":
        handle_open_website(target, extra)
    elif intent == "play_music":
        handle_play_music(target or c)
    elif intent == "open_app":
        handle_open_app(target)
    elif intent == "time":
        handle_time()
    elif intent == "small_talk":
        reply = aiprocess(c)
        speak(reply)
    else:
        reply = aiprocess(c)
        speak(reply)


# =========================
#  メインループ
# =========================
if __name__ == "__main__":
    speak("ティルクを起動しました。")

    while True:
        try:
            with sr.Microphone() as source:
                print("Say 'hello' to wake me up...")
                recognizer.adjust_for_ambient_noise(source, duration=0.3)

                try:
                    audio = recognizer.listen(source, timeout=4, phrase_time_limit=2)
                except sr.WaitTimeoutError:
                    continue

            try:
                word = recognizer.recognize_google(audio, language="en-US")
                print("[Heard wake]:", word)
            except sr.UnknownValueError:
                continue

            if word.lower() == "hello":
                speak_wake()

                with sr.Microphone() as source:
                    print("Tilku is active, listening for your command...")
                    recognizer.adjust_for_ambient_noise(source, duration=0.3)
                    try:
                        audio = recognizer.listen(source, timeout=6)
                    except sr.WaitTimeoutError:
                        speak("時間内に声が聞こえませんでした。")
                        continue

                try:
                    command = recognizer.recognize_google(audio, language="ja-JP")
                    print("[Full command]:", command)
                    processcommand(command)
                except sr.UnknownValueError:
                    print("Sorry, I could not understand your command.")
                    speak("すみません、うまく聞き取れませんでした。")
                except sr.RequestError as e:
                    print(f"Speech recognition API error: {e}")
                    speak("音声認識サービスでエラーが発生しました。")

        except KeyboardInterrupt:
            print("Bye!")
            speak("終了します。お疲れさまでした。")
            break
        except Exception as e:
            print("Error:", e)
