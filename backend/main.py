from fastapi import FastAPI
from fastapi.responses import StreamingResponse

from schemas import PromptRequest
from jarvis import Jarvis

app = FastAPI()
jarvis = Jarvis()


@app.post("/prompt")
def prompt(request: PromptRequest):
    generator = jarvis.chat(request.prompt_str)
    return StreamingResponse(generator, media_type='text/plain')