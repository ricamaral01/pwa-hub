"""Record only protocol shapes of the original Supabase realtime client."""

from __future__ import annotations

import json
import argparse

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, credentials, login_operacao


def sanitized(frame: str) -> dict:
    try:
        data = json.loads(frame)
    except ValueError:
        return {"non_json": True, "size": len(frame)}
    if isinstance(data, dict):
        payload = data.get("payload")
        if isinstance(payload, dict):
            payload = {key: ("<redacted>" if key in {"access_token", "token"} else value)
                       for key, value in payload.items()}
        return {"topic": data.get("topic"), "event": data.get("event"),
                "ref": data.get("ref"), "join_ref": data.get("join_ref"),
                "payload": payload}
    if isinstance(data, list) and len(data) == 5:
        join_ref, ref, topic, event, payload = data
        if isinstance(payload, dict):
            payload = {key: ("<redacted>" if key in {"access_token", "token"} else value)
                       for key, value in payload.items()}
        return {"join_ref": join_ref, "ref": ref, "topic": topic,
                "event": event, "payload": payload}
    return {"non_object": True}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--mock', action='store_true')
    args = parser.parse_args()
    account = credentials()
    frames = []
    received = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1024, "height": 768},
                                      service_workers="block")
        if args.mock:
            context.route_web_socket("**/realtime/v1/websocket**",
                lambda socket: socket.on_message(lambda message: frames.append(sanitized(message))))
        page = context.new_page()
        def attached(socket):
            socket.on("framesent", lambda frame: frames.append(sanitized(frame)))
            socket.on("framereceived", lambda frame: received.append(sanitized(frame)))
        page.on("websocket", attached)
        login_operacao(page, account["MAPA_TEST_USER"], account["MAPA_TEST_PASSWORD"])
        page.wait_for_timeout(2500)
        context.close()
        browser.close()
    print(json.dumps({"sent": frames[:5], "received": received[:5]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
