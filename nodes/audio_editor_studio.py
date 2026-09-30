import os
import time
import torch
import torch.nn.functional as F
import soundfile as sf
import folder_paths

class McValley_AudioEditorStudio:
    def __init__(self):
        self.output_dir = folder_paths.get_output_directory()
        self.subfolder = "AudioEditorStudio"
        self.full_output_dir = os.path.join(self.output_dir, self.subfolder)
        os.makedirs(self.full_output_dir, exist_ok=True)

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "ch1_enabled": ("BOOLEAN", {"default": True}),
                "ch1_start": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 7200.0, "step": 0.01}),
                "ch1_end": ("FLOAT", {"default": 10.0, "min": 0.0, "max": 7200.0, "step": 0.01}),
                "ch1_volume": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 2.0, "step": 0.05}),

                "ch2_enabled": ("BOOLEAN", {"default": True}),
                "ch2_start": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 7200.0, "step": 0.01}),
                "ch2_end": ("FLOAT", {"default": 10.0, "min": 0.0, "max": 7200.0, "step": 0.01}),
                "ch2_volume": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 2.0, "step": 0.05}),

                "ch3_enabled": ("BOOLEAN", {"default": True}),
                "ch3_start": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 7200.0, "step": 0.01}),
                "ch3_end": ("FLOAT", {"default": 10.0, "min": 0.0, "max": 7200.0, "step": 0.01}),
                "ch3_volume": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 2.0, "step": 0.05}),
            },
            "optional": {
                "audio_1": ("AUDIO",),
                "audio_2": ("AUDIO",),
                "audio_3": ("AUDIO",),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID"
            }
        }

    RETURN_TYPES = ("AUDIO",)
    RETURN_NAMES = ("audio",)
    FUNCTION = "process_studio_mix"
    OUTPUT_NODE = True
    CATEGORY = "Mc_Valley Nodes/Audio"

    def _resample(self, tensor, orig_sr, target_sr):
        if orig_sr == target_sr:
            return tensor
        in_samples = tensor.shape[-1]
        out_samples = int(in_samples * (target_sr / orig_sr))
        return F.interpolate(tensor.unsqueeze(0), size=out_samples, mode="linear", align_corners=False).squeeze(0)

    def _normalize_tensor(self, audio_dict, target_sr=44100):
        if not audio_dict or "waveform" not in audio_dict:
            return None, 0.0
        wav = audio_dict["waveform"].clone()
        if wav.ndim == 3:
            wav = wav[0]
        if wav.shape[0] == 1:
            wav = wav.repeat(2, 1)
        sr = int(audio_dict.get("sample_rate", target_sr))
        if sr != target_sr:
            wav = self._resample(wav, sr, target_sr)
        dur = float(wav.shape[-1] / target_sr)
        return wav, dur

    def _save_preview_wav(self, tensor, sr, filename):
        path = os.path.join(self.full_output_dir, filename)
        data = tensor.detach().cpu().numpy().T
        sf.write(path, data, sr, format="WAV")
        return {
            "filename": filename,
            "subfolder": self.subfolder,
            "type": "output"
        }

    def process_studio_mix(self, ch1_enabled, ch1_start, ch1_end, ch1_volume,
                           ch2_enabled, ch2_start, ch2_end, ch2_volume,
                           ch3_enabled, ch3_start, ch3_end, ch3_volume,
                           audio_1=None, audio_2=None, audio_3=None, unique_id="0", **kwargs):

        TARGET_SR = 44100
        ts = int(time.time() * 1000)

        wav1, dur1 = self._normalize_tensor(audio_1, TARGET_SR)
        wav2, dur2 = self._normalize_tensor(audio_2, TARGET_SR)
        wav3, dur3 = self._normalize_tensor(audio_3, TARGET_SR)

        preview_data = {
            "track_1": [],
            "track_2": [],
            "track_3": [],
            "connected_status": [wav1 is not None, wav2 is not None, wav3 is not None]
        }

        # La duración del master la marca el corte final más largo o la duración del audio 1
        max_requested_end = 0.0
        if wav1 is not None and ch1_enabled:
            max_requested_end = max(max_requested_end, ch1_end, dur1)
        if wav2 is not None and ch2_enabled:
            max_requested_end = max(max_requested_end, ch2_end)
        if wav3 is not None and ch3_enabled:
            max_requested_end = max(max_requested_end, ch3_end)

        master_duration = max(max_requested_end, dur1, 1.0)
        total_samples = max(1, int(master_duration * TARGET_SR))
        master_canvas = torch.zeros((2, total_samples), dtype=torch.float32)

        if wav1 is not None:
            preview_data["track_1"] = [self._save_preview_wav(wav1, TARGET_SR, f"ch1_in_{unique_id}_{ts}.wav")]
        if wav2 is not None:
            preview_data["track_2"] = [self._save_preview_wav(wav2, TARGET_SR, f"ch2_in_{unique_id}_{ts}.wav")]
        if wav3 is not None:
            preview_data["track_3"] = [self._save_preview_wav(wav3, TARGET_SR, f"ch3_in_{unique_id}_{ts}.wav")]

        # Inserción y reemplazo exacto
        track_configs = [
            (wav1, ch1_enabled, ch1_start, ch1_end, ch1_volume),
            (wav2, ch2_enabled, ch2_start, ch2_end, ch2_volume),
            (wav3, ch3_enabled, ch3_start, ch3_end, ch3_volume)
        ]

        for wav, enabled, st_sec, en_sec, vol in track_configs:
            if wav is None or not enabled:
                continue

            s_idx = max(0, int(st_sec * TARGET_SR))
            e_idx = min(total_samples, int(en_sec * TARGET_SR))

            if e_idx > s_idx:
                span_len = e_idx - s_idx
                # Extraemos el fragmento exacto del audio de entrada
                if wav.shape[-1] >= span_len:
                    clip = wav[:, :span_len] * vol
                else:
                    clip = wav * vol

                # Reemplazo en el lienzo de masterización
                target_len = min(clip.shape[-1], total_samples - s_idx)
                master_canvas[:, s_idx : s_idx + target_len] = clip[:, :target_len]

        master_canvas = torch.clamp(master_canvas, -1.0, 1.0)
        master_preview_info = self._save_preview_wav(master_canvas, TARGET_SR, f"master_mix_{unique_id}_{ts}.wav")
        preview_data["master_preview"] = [master_preview_info]

        out_audio = {
            "waveform": master_canvas.unsqueeze(0),
            "sample_rate": TARGET_SR
        }

        return {
            "ui": preview_data,
            "result": (out_audio,)
        }

NODE_CLASS_MAPPINGS = {
    "McValley_AudioEditorStudio": McValley_AudioEditorStudio
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_AudioEditorStudio": "Audio Editor Studio"
}
