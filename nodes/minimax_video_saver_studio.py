import os
import json
import wave
import torch
import numpy as np
import folder_paths
import subprocess
import shutil

try:
    import imageio_ffmpeg
    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_PATH = shutil.which("ffmpeg") or "ffmpeg"


class McValley_MiniMaxVideoSaverStudio:
    def __init__(self):
        self.output_dir = folder_paths.get_output_directory()
        self.type = "output"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "frame_rate": ("FLOAT", {"default": 24.0, "min": 1.0, "max": 120.0, "step": 1.0}),
                "filename_prefix": ("STRING", {"default": "MiniMax_Render"}),
                "subfolder_name": ("STRING", {"default": "MiniMax_Videos"}),
                "crf": ("INT", {"default": 19, "min": 0, "max": 51, "step": 1}),
                "save_metadata": ("BOOLEAN", {"default": True}),
            },
            "optional": {
                "audio": ("AUDIO",),
            },
            "hidden": {
                "prompt": "PROMPT",
                "extra_pnginfo": "EXTRA_PNGINFO"
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "save_video"
    OUTPUT_NODE = True
    CATEGORY = "Mc_Valley Nodes/MiniMax"

    def _extract_audio_tensor(self, audio):
        """Resuelve de forma segura LazyAudioMap (VHS), diccionarios nativos o tensores."""
        if audio is None:
            return None, 44100

        if callable(audio):
            try:
                audio = audio()
            except Exception:
                pass

        waveform = None
        sample_rate = 44100

        if isinstance(audio, dict):
            waveform = audio.get("waveform")
            sample_rate = int(audio.get("sample_rate", 44100))
        elif hasattr(audio, "waveform"):
            waveform = getattr(audio, "waveform")
            sample_rate = int(getattr(audio, "sample_rate", 44100))
        elif isinstance(audio, torch.Tensor):
            waveform = audio

        if waveform is None and hasattr(audio, "__getitem__"):
            try:
                waveform = audio["waveform"]
                sample_rate = int(audio["sample_rate"])
            except Exception:
                pass

        if callable(waveform):
            waveform = waveform()

        if waveform is not None and isinstance(waveform, torch.Tensor) and waveform.numel() > 0:
            wav = waveform.detach().cpu().float()

            if wav.dim() == 3:
                wav = wav[0]
            elif wav.dim() == 1:
                wav = wav.unsqueeze(0)

            if wav.shape[0] == 1:
                wav = wav.repeat(2, 1)

            wav = torch.clamp(wav, -1.0, 1.0)
            return wav, sample_rate

        return None, 44100

    def _save_wav_native(self, file_path, wav_tensor, sample_rate):
        """Guarda audio usando el módulo wave estándar, evitando dependencias externas."""
        audio_int16 = (wav_tensor * 32767.0).clamp(-32768, 32767).to(torch.int16)
        channels = audio_int16.shape[0]
        interleaved = audio_int16.t().contiguous().numpy()

        with wave.open(file_path, "wb") as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(interleaved.tobytes())

    def save_video(self, images, frame_rate, filename_prefix, subfolder_name, crf, save_metadata, audio=None, prompt=None, extra_pnginfo=None):
        subfolder = subfolder_name.strip() if subfolder_name else "MiniMax_Videos"
        target_dir = os.path.join(self.output_dir, subfolder)
        os.makedirs(target_dir, exist_ok=True)

        counter = 1
        existing_files = os.listdir(target_dir)
        for f in existing_files:
            if f.startswith(filename_prefix) and f.endswith(".mp4"):
                try:
                    parts = f.replace(".mp4", "").split("_")
                    num = int(parts[-1])
                    if num >= counter:
                        counter = num + 1
                except Exception:
                    pass

        filename = f"{filename_prefix}_{counter:05d}.mp4"
        file_path = os.path.join(target_dir, filename)

        # 1. Preparación de fotogramas
        frames = (images.cpu().numpy() * 255.0).clip(0, 255).astype(np.uint8)
        b, height, width, _ = frames.shape

        if width % 2 != 0 or height % 2 != 0:
            width = width - (width % 2)
            height = height - (height % 2)
            frames = frames[:, :height, :width, :]

        # 2. Extracción de Audio nativa
        temp_audio_path = None
        has_audio = False

        if audio is not None:
            wav, sample_rate = self._extract_audio_tensor(audio)
            if wav is not None:
                try:
                    temp_audio_path = os.path.join(target_dir, f"_temp_audio_{counter:05d}.wav")
                    self._save_wav_native(temp_audio_path, wav, sample_rate)
                    if os.path.exists(temp_audio_path) and os.path.getsize(temp_audio_path) > 100:
                        has_audio = True
                        dur_sec = wav.shape[-1] / sample_rate
                        print(f"[MiniMax Video Saver] Audio procesado exitosamente: {dur_sec:.2f}s | SR: {sample_rate}Hz | Canales: {wav.shape[0]}")
                except Exception as e:
                    print(f"[MiniMax Video Saver] Error guardando archivo WAV: {e}")
                    has_audio = False
                    temp_audio_path = None

        # 3. Preparación de Metadata FFMETADATA
        meta_temp_file = None
        if save_metadata:
            meta_dict = {}
            if prompt is not None:
                meta_dict["prompt"] = prompt
            if extra_pnginfo is not None:
                meta_dict["extra_pnginfo"] = extra_pnginfo
            if meta_dict:
                try:
                    meta_temp_file = os.path.join(target_dir, f"_temp_meta_{counter:05d}.txt")
                    meta_content = json.dumps(meta_dict)
                    # Escape formal para FFMETADATA
                    clean_content = (
                        meta_content.replace("\\", "\\\\")
                        .replace("=", "\\=")
                        .replace(";", "\\;")
                        .replace("#", "\\#")
                        .replace("\n", " ")
                    )
                    with open(meta_temp_file, "w", encoding="utf-8") as mf:
                        mf.write(f";FFMETADATA1\ncomment={clean_content}\n")
                except Exception as e:
                    print(f"[MiniMax Video Saver] Advertencia escribiendo metadata: {e}")
                    meta_temp_file = None

        # 4. Compilación estricta de FFmpeg (TODOS los -i al principio)
        cmd = [
            FFMPEG_PATH,
            "-y",
            "-f", "rawvideo",
            "-vcodec", "rawvideo",
            "-s", f"{width}x{height}",
            "-pix_fmt", "rgb24",
            "-r", str(frame_rate),
            "-i", "-",  # Entrada 0: Video crudo
        ]

        next_idx = 1
        audio_idx = None
        meta_idx = None

        if has_audio and temp_audio_path:
            cmd.extend(["-i", temp_audio_path])  # Entrada de Audio
            audio_idx = next_idx
            next_idx += 1

        if meta_temp_file and os.path.exists(meta_temp_file):
            cmd.extend(["-i", meta_temp_file])  # Entrada de Metadata
            meta_idx = next_idx
            next_idx += 1

        # Opciones de salida de Video
        cmd.extend([
            "-map", "0:v:0",
            "-c:v", "libx264",
            "-crf", str(crf),
            "-pix_fmt", "yuv420p",
            "-preset", "medium",
            "-movflags", "+faststart",  # Obligatorio para reproducción web instantánea
        ])

        # Opciones de salida de Audio
        if audio_idx is not None:
            cmd.extend([
                "-map", f"{audio_idx}:a:0",
                "-c:a", "aac",
                "-b:a", "192k",
                "-af", "aresample=async=1000",
                "-shortest",
            ])

        # Mapeo de metadata global
        if meta_idx is not None:
            cmd.extend(["-map_metadata", str(meta_idx)])

        cmd.append(file_path)

        # 5. Ejecución del pipe de video
        raw_bytes = frames.tobytes()
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout_out, stderr_out = process.communicate(input=raw_bytes)

        if process.returncode != 0 or not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
            err_msg = stderr_out.decode("utf-8", errors="ignore")
            raise RuntimeError(f"[MiniMax Video Saver] FFmpeg falló al generar el MP4:\n{err_msg}")

        # Limpieza de archivos temporales
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except Exception:
                pass

        if meta_temp_file and os.path.exists(meta_temp_file):
            try:
                os.remove(meta_temp_file)
            except Exception:
                pass

        return {
            "ui": {
                "videos": [{
                    "filename": filename,
                    "subfolder": subfolder,
                    "type": self.type,
                    "format": "video/mp4"
                }]
            }
        }


NODE_CLASS_MAPPINGS = {
    "McValley_MiniMaxVideoSaverStudio": McValley_MiniMaxVideoSaverStudio
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "McValley_MiniMaxVideoSaverStudio": "MiniMax Video Saver"
}
