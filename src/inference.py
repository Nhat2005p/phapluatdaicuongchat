from threading import Thread
import torch
from transformers import TextStreamer, TextIteratorStreamer

try:
    from config import (
        SYSTEM_PROMPT,
        MAX_NEW_TOKENS,
        TEMPERATURE,
        TOP_P,
        MAX_HISTORY_TURNS,
    )
except ModuleNotFoundError:
    from src.config import (
        SYSTEM_PROMPT,
        MAX_NEW_TOKENS,
        TEMPERATURE,
        TOP_P,
        MAX_HISTORY_TURNS,
    )

def generate_answer(tokenizer, model, question, history=None, stream=False):
    history = history or []

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Giữ lịch sử ngắn để tiết kiệm VRAM / RAM.
    trimmed = history[-MAX_HISTORY_TURNS * 2:]
    messages.extend(trimmed)
    messages.append({"role": "user", "content": question})

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=4096,
    )

    # device_map="auto" có thể chia model; đưa input về device embedding đầu tiên.
    try:
        input_device = model.get_input_embeddings().weight.device
    except Exception:
        input_device = next(model.parameters()).device

    inputs = {k: v.to(input_device) for k, v in inputs.items()}

    do_sample = TEMPERATURE > 0

    if hasattr(model, "generation_config") and model.generation_config is not None:
        model.generation_config.max_length = None

    gen_kwargs = dict(
        max_new_tokens=MAX_NEW_TOKENS,
        do_sample=do_sample,
        temperature=TEMPERATURE if do_sample else None,
        top_p=TOP_P if do_sample else None,
        repetition_penalty=1.05,
        pad_token_id=tokenizer.eos_token_id,
        eos_token_id=tokenizer.eos_token_id,
    )

    if stream:
        gen_kwargs["streamer"] = TextStreamer(
            tokenizer,
            skip_prompt=True,
            skip_special_tokens=True,
        )

    with torch.inference_mode():
        outputs = model.generate(
            **inputs,
            **gen_kwargs,
        )

    generated = outputs[0][inputs["input_ids"].shape[1]:]
    answer = tokenizer.decode(generated, skip_special_tokens=True).strip()
    return answer


def generate_answer_stream(tokenizer, model, question, history=None, max_new_tokens=None, temperature=None):
    history = history or []

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    trimmed = history[-MAX_HISTORY_TURNS * 2:]
    messages.extend(trimmed)
    messages.append({"role": "user", "content": question})

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=2048,
    )

    try:
        input_device = model.get_input_embeddings().weight.device
    except Exception:
        input_device = next(model.parameters()).device

    inputs = {k: v.to(input_device) for k, v in inputs.items()}
    actual_temp = float(temperature) if temperature is not None else TEMPERATURE
    actual_max = int(max_new_tokens) if max_new_tokens is not None else MAX_NEW_TOKENS
    do_sample = actual_temp > 0

    if hasattr(model, "generation_config") and model.generation_config is not None:
        model.generation_config.max_length = None

    streamer = TextIteratorStreamer(
        tokenizer,
        skip_prompt=True,
        skip_special_tokens=True,
    )

    gen_kwargs = dict(
        **inputs,
        streamer=streamer,
        max_new_tokens=actual_max,
        do_sample=do_sample,
        temperature=actual_temp if do_sample else None,
        top_p=TOP_P if do_sample else None,
        repetition_penalty=1.05,
        pad_token_id=tokenizer.eos_token_id,
        eos_token_id=tokenizer.eos_token_id,
    )

    thread = Thread(target=model.generate, kwargs=gen_kwargs)
    thread.start()

    partial_text = ""
    for new_text in streamer:
        partial_text += new_text
        yield partial_text

    thread.join()

