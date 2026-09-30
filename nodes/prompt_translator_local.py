import os
import re
import hashlib
import torch
import folder_paths

TRANSLATION_MODELS_DIR = os.path.join(folder_paths.models_dir, "prompt_translation")
os.makedirs(TRANSLATION_MODELS_DIR, exist_ok=True)

_LOCAL_MODEL_CACHE = {}

def _split_into_chunks(text, max_chars=450):
    if len(text) <= max_chars:
        return [text]

    chunks = []
    paragraphs = text.split("\n")

    for paragraph in paragraphs:
        if not paragraph.strip():
            chunks.append("")
            continue

        sentences = re.split(r'([.,;!]+|\b(?=masterpiece|best quality|detailed)\b)', paragraph)
        current_chunk = ""

        for part in sentences:
            if len(current_chunk) + len(part) < max_chars:
                current_chunk += part
            else:
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                current_chunk = part

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

    return [c for c in chunks if c is not None]

def _get_or_load_pipeline(direction: str):
    from transformers import MarianMTModel, MarianTokenizer

    is_es_to_en = "Spanish" in direction.split("➔")[0]
    hf_repo = "Helsinki-NLP/opus-mt-es-en" if is_es_to_en else "Helsinki-NLP/opus-mt-en-es"
    folder_name = "opus-mt-es-en" if is_es_to_en else "opus-mt-en-es"
    local_path = os.path.join(TRANSLATION_MODELS_DIR, folder_name)

    if folder_name in _LOCAL_MODEL_CACHE:
        return _LOCAL_MODEL_CACHE[folder_name]

    load_source = local_path if os.path.exists(local_path) else hf_repo
    print(f"[McValley Local Translator] Cargando modelo desde: {load_source}...")

    tokenizer = MarianTokenizer.from_pretrained(load_source, cache_dir=TRANSLATION_MODELS_DIR)
    model = MarianMTModel.from_pretrained(load_source, cache_dir=TRANSLATION_MODELS_DIR)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    model.eval()

    _LOCAL_MODEL_CACHE[folder_name] = (tokenizer, model, device)
    return _LOCAL_MODEL_CACHE[folder_name]

class McValley_PromptTranslatorLocal:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "enabled": ("BOOLEAN", {"default": True}),
                "source_text": ("STRING", {"default": "", "multiline": True}),
                "direction": (["Spanish ➔ English", "English ➔ Spanish"], {"default": "Spanish ➔ English"}),
                "model_engine": (["Helsinki OPUS-MT (Neural Local)"], {"default": "Helsinki OPUS-MT (Neural Local)"}),
            },
            "optional": {
                "text_override": ("STRING", {"forceInput": True}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID"
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("translated_text",)
    FUNCTION = "translate_prompt"
    CATEGORY = "Mc_Valley Nodes/Prompting"
    OUTPUT_NODE = True

    @classmethod
    def IS_CHANGED(cls, enabled=True, source_text="", direction="", model_engine="", text_override=None, **kwargs):
        if not enabled:
            return "bypassed"
        content = f"{source_text}_{direction}_{model_engine}_{text_override or ''}"
        return hashlib.md5(content.encode("utf-8")).hexdigest()

    def translate_prompt(self, enabled=True, source_text="", direction="Spanish ➔ English", model_engine="Helsinki OPUS-MT (Neural Local)", text_override=None, unique_id="0"):
        raw_input = text_override if (text_override is not None and text_override.strip()) else source_text
        raw_input = raw_input.strip()

        # Si el interruptor está apagado, devuelve el texto directo y avisa a la UI sin cargar modelo
        if not enabled:
            return {
                "ui": {"payload": [{"translated": raw_input, "source": raw_input, "direction": direction, "bypassed": True}]},
                "result": (raw_input,)
            }

        if not raw_input:
            return {
                "ui": {"payload": [{"translated": "", "source": "", "direction": direction, "bypassed": False}]},
                "result": ("",)
            }

        tokenizer, model, device = _get_or_load_pipeline(direction)
        chunks = _split_into_chunks(raw_input, max_chars=450)
        translated_chunks = []

        with torch.inference_mode():
            for c in chunks:
                if not c.strip():
                    translated_chunks.append("")
                    continue
                tokens = tokenizer(c, return_tensors="pt", padding=True, truncation=True).to(device)
                outputs = model.generate(**tokens, max_length=512)
                decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)
                translated_chunks.append(decoded)

        final_translated = " ".join(translated_chunks).strip()
        final_translated = re.sub(r'\s+', ' ', final_translated)
        final_translated = final_translated.replace(" ,", ",").replace(" .", ".")

        return {
            "ui": {
                "payload": [{
                    "source": raw_input,
                    "translated": final_translated,
                    "direction": direction,
                    "engine": model_engine,
                    "bypassed": False
                }]
            },
            "result": (final_translated,)
        }

NODE_CLASS_MAPPINGS = {
    "McValley_PromptTranslatorLocal": McValley_PromptTranslatorLocal
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_PromptTranslatorLocal": "Prompt Translator Studio (Local Offline)"
}
