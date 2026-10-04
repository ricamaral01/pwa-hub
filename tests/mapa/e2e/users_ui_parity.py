"""Compare Mapa Users create/inactivate UI on the isolated test database."""
from __future__ import annotations

import hashlib
import json
import secrets
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".work-mapa-unificado/operacao/index-before-desktop.html"


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False,
                                     sort_keys=True).encode()).hexdigest()


def run_variant(browser, variant, account, user_id, password):
    context = browser.new_context(viewport={"width": 1024, "height": 768},
                                  service_workers="block")
    page = context.new_page()
    requests = []

    def capture(req):
        if "/unificado/mapa/api/rest/v1/usuarios" not in req.url:
            return
        if req.method in {"POST", "PATCH", "DELETE"}:
            body = req.post_data_json if req.post_data else None
            if isinstance(body, list):
                body = [{key: "[redacted]" if key == "senha" else
                         "[generated timestamp]" if key == "updated_at" else value
                         for key, value in row.items()} for row in body]
            elif isinstance(body, dict):
                body = {key: "[redacted]" if key == "senha" else
                        "[generated timestamp]" if key == "updated_at" else value
                        for key, value in body.items()}
            parts = urlsplit(req.url)
            requests.append({"method": req.method, "path": parts.path,
                             "query": parts.query, "body": body,
                             "prefer": req.headers.get("prefer", "")})

    page.on("request", capture)
    login_operacao(page, account["MAPA_TEST_USER"],
                   account["MAPA_TEST_PASSWORD"], "GERENCIA")
    if variant == "original":
        page.route(URL, lambda route: route.fulfill(status=200,
            content_type="text/html; charset=utf-8",
            body=BEFORE.read_text(encoding="utf-8")))
        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_function("state.authUser?.role === 'GERENCIA'")
    page.evaluate("setMode('USUARIOS')")
    page.locator("#ugNomeCompleto").fill("E2E Cadastro Mapa")
    page.locator("#ugLogin").fill(user_id)
    page.locator("#ugSenha").fill(password)
    page.locator("#ugPerfil").select_option("MONTADOR")
    page.locator("#ugSetor").select_option("Setor 3")
    page.locator("#ugCriarBtn").click()
    row = page.locator(f'#ugListaBody tr:has(button[data-ug-id="{user_id}"])')
    row.wait_for(state="visible", timeout=15000)
    created_text = row.inner_text()
    created_class = row.get_attribute("class") or ""
    created = page.evaluate("""async id => {
      const {data,error}=await supabaseClient.from('usuarios')
        .select('id,nome,perfil,ativo,setor,primeiro_acesso').eq('id',id);
      if(error) throw Error(error.message);
      return data;
    }""", user_id)
    assert len(created) == 1 and created[0]["ativo"] is True, created
    page.locator("#ugNomeCompleto").fill("E2E Cadastro Mapa Atualizado")
    page.locator("#ugLogin").fill(user_id)
    page.locator("#ugSenha").fill(password)
    page.locator("#ugPerfil").select_option("APONTADOR")
    page.locator("#ugSetor").select_option("Setor 2")
    page.locator("#ugCriarBtn").click()
    page.wait_for_function("""id => {
      const row=document.querySelector(`#ugListaBody button[data-ug-id="${id}"]`)?.closest('tr');
      return row?.innerText.includes('Atualizado') && row?.innerText.includes('Setor 2');
    }""", arg=user_id, timeout=15000)
    updated_text = row.inner_text()
    updated = page.evaluate("""async id => {
      const {data,error}=await supabaseClient.from('usuarios')
        .select('id,nome,perfil,ativo,setor,primeiro_acesso').eq('id',id);
      if(error) throw Error(error.message);
      return data;
    }""", user_id)
    assert len(updated) == 1 and updated[0]["perfil"] == "APONTADOR", updated
    row.locator(".ug-del-btn").click()
    page.locator("#ugFeedback").wait_for(state="visible", timeout=15000)
    row.wait_for(state="detached", timeout=15000)
    feedback = page.locator("#ugFeedback").inner_text()
    inactive = page.evaluate("""async id => {
      const {data,error}=await supabaseClient.from('usuarios')
        .select('id,nome,perfil,ativo,setor,primeiro_acesso').eq('id',id);
      if(error) throw Error(error.message);
      return data;
    }""", user_id)
    assert len(inactive) == 1 and inactive[0]["ativo"] is False, inactive
    ui_requests = list(requests)
    # Remove the synthetic row completely after each variant.
    cleanup = page.evaluate("""async id => {
      const {error}=await supabaseClient.from('usuarios').delete().eq('id',id);
      return error?.message||'';
    }""", user_id)
    assert not cleanup, cleanup
    residue = page.evaluate("""async id => {
      const {data,error}=await supabaseClient.from('usuarios').select('id').eq('id',id);
      if(error) throw Error(error.message);
      return data.length;
    }""", user_id)
    assert residue == 0, residue
    context.close()
    return {"requests": ui_requests, "created_row": created,
            "updated_row": updated, "updated_text": updated_text,
            "inactive_row": inactive, "created_text": created_text,
            "created_class": created_class, "feedback": feedback,
            "cleanup_residue": residue}


def main():
    account = credentials()
    user_id = "e2emapau" + secrets.token_hex(4)
    password = secrets.token_urlsafe(12)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        original = run_variant(browser, "original", account, user_id, password)
        unified = run_variant(browser, "unificado", account, user_id, password)
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "users-ui-parity.json"
    path.write_text(json.dumps({"original": original, "unificado": unified},
                               ensure_ascii=False, indent=2), encoding="utf-8")
    assert original == unified, str(path)
    print(json.dumps({"users_ui": "equal", "request_hash": digest(original["requests"]),
                      "row_hash": digest(original["created_row"]),
                      "updated_hash": digest(original["updated_row"]),
                      "inactive_hash": digest(original["inactive_row"]),
                      "cleanup_residue": 0, "password_logged": False}))


if __name__ == "__main__":
    main()
