"""Provedores configuráveis para leitura multimodal de notas fiscais.

Usa apenas a biblioteca padrão e nunca registra credenciais.
"""

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request


SUPPORTED_PROVIDERS = ("openai", "gemini", "groq", "huggingface", "ollama")
PROVIDER_ENV = {
    "openai": "OPENAI_API_KEY",
    "gemini": "GEMINI_API_KEY",
    "groq": "GROQ_API_KEY",
    "huggingface": "HUGGINGFACE_API_KEY",
    "ollama": "OLLAMA_BASE_URL",
}
PROVIDER_MODELS = {
    "openai": ("OPENAI_NF_MODEL", "gpt-5.4-mini"),
    "gemini": ("GEMINI_MODEL", "gemini-2.5-flash"),
    "groq": ("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"),
    "huggingface": ("HUGGINGFACE_MODEL", "google/gemma-3-27b-it"),
    "ollama": ("OLLAMA_MODEL", "gemma3:4b"),
}


class AIProviderError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def provider_status() -> dict:
    provider = os.getenv("AI_PROVIDER", "openai").strip().lower()
    if provider not in SUPPORTED_PROVIDERS:
        return {"provider": provider, "configured": False, "missing": "AI_PROVIDER",
                "message": f"AI_PROVIDER inválido: {provider}. Use: {', '.join(SUPPORTED_PROVIDERS)}"}
    variable = PROVIDER_ENV[provider]
    configured = bool(os.getenv(variable, "").strip())
    return {
        "provider": provider,
        "configured": configured,
        "missing": None if configured else variable,
        "message": (f"Provider de IA configurado: {provider}." if configured
                    else f"Provider selecionado: {provider}. Configure a variável {variable}."),
    }


def _model(provider: str) -> str:
    variable, default = PROVIDER_MODELS[provider]
    return os.getenv(variable, default).strip()


def _post_json(url: str, payload: dict, headers: dict, timeout: int = 90) -> dict:
    request = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                     headers={"Content-Type": "application/json", **headers}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = f"O provider retornou HTTP {exc.code}"
        try:
            body = json.loads(exc.read().decode("utf-8"))
            detail = body.get("error", {}).get("message") or body.get("message") or detail
        except Exception:
            pass
        raise AIProviderError(detail)
    except (urllib.error.URLError, TimeoutError):
        raise AIProviderError("Tempo esgotado ao acessar o provider de IA", 504)


def _json_from_text(text: str) -> dict:
    text = (text or "").strip()
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    if fenced:
        text = fenced.group(1).strip()
    try:
        value = json.loads(text)
    except json.JSONDecodeError as exc:
        raise AIProviderError(f"O provider não retornou JSON válido: {exc.msg}")
    if not isinstance(value, dict):
        raise AIProviderError("O provider não retornou um objeto JSON")
    return value


def _prompt(material_context: str) -> str:
    return (
        "Leia esta nota fiscal brasileira e retorne SOMENTE JSON válido, sem markdown, com exatamente estas chaves: "
        "numero_nota, data_emissao (YYYY-MM-DD), fornecedor, cnpj_fornecedor, chave_acesso, valor_nota, "
        "icms_perc, valor_frete, icms_frete, quantidade, unidade, descricao_material, confianca (0 a 1), avisos (lista). "
        "Use null para campos ausentes ou ilegíveis. Números usam ponto decimal sem separador de milhar. "
        "ICMS é percentual e icms_frete é valor monetário. Não invente dados. " + material_context
    )


def _openai(document_b64: str, mime: str, filename: str, prompt: str, schema: dict) -> dict:
    data_url = f"data:{mime};base64,{document_b64}"
    file_part = ({"type": "input_file", "filename": filename, "file_data": data_url}
                 if mime == "application/pdf" else {"type": "input_image", "image_url": data_url, "detail": "high"})
    response = _post_json("https://api.openai.com/v1/responses", {
        "model": _model("openai"),
        "input": [{"role": "user", "content": [{"type": "input_text", "text": prompt}, file_part]}],
        "text": {"format": {"type": "json_schema", "name": "nota_fiscal", "strict": True, "schema": schema}},
    }, {"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"})
    for item in response.get("output", []):
        for content in item.get("content", []):
            if content.get("type") == "output_text":
                return _json_from_text(content.get("text"))
    return _json_from_text(response.get("output_text"))


def _gemini(document_b64: str, mime: str, prompt: str) -> dict:
    model = urllib.parse.quote(_model("gemini"), safe="")
    response = _post_json(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", {
        "contents": [{"parts": [{"inline_data": {"mime_type": mime, "data": document_b64}}, {"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0},
    }, {"x-goog-api-key": os.environ["GEMINI_API_KEY"]})
    try:
        return _json_from_text(response["candidates"][0]["content"]["parts"][0]["text"])
    except (KeyError, IndexError):
        raise AIProviderError("Gemini não retornou conteúdo para esta nota")


def _openai_compatible(provider: str, document_b64: str, mime: str, prompt: str) -> dict:
    if mime == "application/pdf":
        raise AIProviderError(f"O provider {provider} aceita fotos nesta integração, mas não PDF. Envie JPG, PNG ou WEBP.", 415)
    config = {
        "groq": ("https://api.groq.com/openai/v1/chat/completions", "GROQ_API_KEY"),
        "huggingface": ("https://router.huggingface.co/v1/chat/completions", "HUGGINGFACE_API_KEY"),
    }
    url, env_name = config[provider]
    response = _post_json(url, {
        "model": _model(provider), "stream": False, "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{document_b64}"}},
        ]}],
    }, {"Authorization": f"Bearer {os.environ[env_name]}"})
    try:
        return _json_from_text(response["choices"][0]["message"]["content"])
    except (KeyError, IndexError):
        raise AIProviderError(f"{provider} não retornou conteúdo para esta nota")


def _ollama(document_b64: str, mime: str, prompt: str) -> dict:
    if mime == "application/pdf":
        raise AIProviderError("Ollama aceita fotos nesta integração, mas não PDF. Envie JPG, PNG ou WEBP.", 415)
    base_url = os.environ["OLLAMA_BASE_URL"].rstrip("/")
    response = _post_json(f"{base_url}/api/chat", {
        "model": _model("ollama"), "stream": False, "format": "json",
        "messages": [{"role": "user", "content": prompt, "images": [document_b64]}],
        "options": {"temperature": 0},
    }, {}, timeout=180)
    try:
        return _json_from_text(response["message"]["content"])
    except KeyError:
        raise AIProviderError("Ollama não retornou conteúdo para esta nota")


def read_invoice(document_b64: str, mime: str, filename: str, material_context: str, schema: dict) -> tuple[dict, str]:
    status = provider_status()
    if not status["configured"]:
        raise AIProviderError(status["message"], 503)
    provider = status["provider"]
    prompt = _prompt(material_context)
    if provider == "openai":
        result = _openai(document_b64, mime, filename, prompt, schema)
    elif provider == "gemini":
        result = _gemini(document_b64, mime, prompt)
    elif provider in {"groq", "huggingface"}:
        result = _openai_compatible(provider, document_b64, mime, prompt)
    else:
        result = _ollama(document_b64, mime, prompt)
    return result, provider
