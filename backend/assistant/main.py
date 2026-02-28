import speech_recognition as sr
import webbrowser
import pyttsx3
import musicLibrary
from gtts import gTTS
from openai import OpenAI
import pygame
import os
#webbrowser.open("https://www.google.com")

recognizer = sr.Recognizer()
engine = pyttsx3.init()
#newsapi = "REDACTED_OPENAI_API_KEY"

def speak_old(text):
    engine.say(text)
    engine.runAndWait()

def aiprocess(command):
     client = OpenAI(api_key ="REDACTED_OPENAI_API_KEY")
     completion = client.chat.completions.create(
    model ="gpt-3.5-turbo",
    messages=[
        {"role":"system","content":"you are a virtual assitance named jarvis skilled in educational and general tasks like chatgpt and google cloud"},
        {"role":"user","content":command}
     ]
     )
     return completion.choices[0].message.content

def speak(text):
     tts = gTTS(text)
     tts.save('temp.mp3')

     pygame.mixer.init()

     pygame.mixer.music.load('temp.mp3')

     pygame.mixer.music.play()

     while pygame.mixer.music.get_busy():
          pygame.time.Clock().tick(10)
     
     pygame.mixer.music.unload()
     os.remove('temp.mp3')


def processcommand(c):
     if "open google"  in c.lower():
          webbrowser.open("https://www.google.com/")
     elif "open youtube"  in c.lower():
          webbrowser.open("https://www.youtube.com/")
     elif "open facebook"  in c.lower():
          webbrowser.open("https://www.facebook.com/")
     elif "open tiktok"  in c.lower():
          webbrowser.open("https://www.tiktok.com/")
     elif c.lower().startswith("play"):
          song = c.lower().split(" ")[1]
          link = musicLibrary.music[song]
          webbrowser.open(link)
     else:
          output = aiprocess(c)
          speak(output)

if __name__ == "__main__":
    speak("initializing jarvis...")
    while True:
        #listen for wake word "jarvis"
        #obtain audio from the microphone
        r = sr.Recognizer()
        

        
        
        print("recognizing...")

        try:
             with sr.Microphone() as source:
                 print("listening...")
                 audio = r.listen(source,timeout=2,phrase_time_limit=1)
             word = r.recognize_google(audio)
             if(word.lower() == "hello"):
                  speak("yes")
                  #listen for command
                  with sr.Microphone() as source:
                       print("jarvis is active...")
                       audio = r.listen(source)
                       command =r.recognize_google(audio)
                       #REDACTED_OPENAI_API_KEY

                       processcommand(command)
             
       
        except Exception as e :
              print("Error;{0}".format(e))

     

    